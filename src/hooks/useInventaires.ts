// src/hooks/useInventaires.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  InventaireWithItems, 
  InventaireCreateData, 
  InventairesResponse, 
} from '@/lib/types/inventaire';
import { InventaireFiltersInput } from '@/lib/validations/inventaire';

// ✅ FETCH LISTE INVENTAIRES
const fetchInventaires = async (filters: Partial<InventaireFiltersInput> = {}): Promise<InventairesResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'ALL') {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/inventaires?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors du chargement des inventaires');
  }
  return response.json();
};

// ✅ CRÉATION INVENTAIRE
const createInventaire = async (data: InventaireCreateData): Promise<InventaireWithItems> => {
  const response = await fetch('/api/inventaires', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la création');
  }
  
  return response.json();
};

// ✅ SUPPRESSION INVENTAIRE
const deleteInventaire = async (id: string): Promise<void> => {
  const response = await fetch(`/api/inventaires/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la suppression');
  }
};

// ✅ HOOKS
export function useInventaires(filters: Partial<InventaireFiltersInput> = {}) {
  return useQuery({
    queryKey: ['inventaires', filters],
    queryFn: () => fetchInventaires(filters),
    staleTime: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: true
  });
}

export function useCreateInventaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createInventaire,
    onSuccess: (newInventaire) => {
      // Invalider la liste des inventaires
      queryClient.invalidateQueries({ queryKey: ['inventaires'] });
      
      // Ajouter l'inventaire au cache si c'est une liste simple
      queryClient.setQueryData(['inventaires', {}], (oldData: InventairesResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: [newInventaire, ...oldData.data]
        };
      });
      
      console.log('✅ Inventaire créé et cache mis à jour:', newInventaire.nom);
    },
    onError: (error) => {
      console.error('❌ Erreur création inventaire:', error);
    }
  });
}

export function useDeleteInventaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteInventaire,
    onSuccess: (_, deletedId) => {
      // Invalider toutes les queries inventaires
      queryClient.invalidateQueries({ queryKey: ['inventaires'] });
      
      // Supprimer du cache le détail si il existe
      queryClient.removeQueries({ queryKey: ['inventaire', deletedId] });
      
      console.log('✅ Inventaire supprimé et cache nettoyé:', deletedId);
    },
    onError: (error) => {
      console.error('❌ Erreur suppression inventaire:', error);
    }
  });
}