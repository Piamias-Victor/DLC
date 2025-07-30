// src/hooks/useInventaire.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  InventaireWithItems, 
  InventaireUpdateData,
  InventaireItemCreateData,
  InventaireItem 
} from '@/lib/types/inventaire';

// ✅ FETCH DÉTAIL INVENTAIRE
const fetchInventaire = async (id: string): Promise<InventaireWithItems & { stats: any }> => {
  const response = await fetch(`/api/inventaires/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors du chargement de l\'inventaire');
  }
  return response.json();
};

// ✅ MISE À JOUR INVENTAIRE
const updateInventaire = async ({ id, data }: { id: string; data: InventaireUpdateData }): Promise<InventaireWithItems> => {
  const response = await fetch(`/api/inventaires/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la modification');
  }
  
  return response.json();
};

// ✅ AJOUT ITEM (avec gestion doublons)
const addInventaireItem = async ({ inventaireId, data }: { 
  inventaireId: string; 
  data: InventaireItemCreateData 
}): Promise<InventaireItem & { isDoublon: boolean; message: string }> => {
  const response = await fetch(`/api/inventaires/${inventaireId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de l\'ajout du produit');
  }
  
  return response.json();
};

// ✅ MODIFICATION QUANTITÉ ITEM
const updateInventaireItem = async ({ 
  inventaireId, 
  itemId, 
  quantite 
}: { 
  inventaireId: string; 
  itemId: string; 
  quantite: number 
}): Promise<InventaireItem & { message: string }> => {
  const response = await fetch(`/api/inventaires/${inventaireId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantite })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la modification');
  }
  
  return response.json();
};

// ✅ SUPPRESSION ITEM
const deleteInventaireItem = async ({ inventaireId, itemId }: { 
  inventaireId: string; 
  itemId: string 
}): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/inventaires/${inventaireId}/items/${itemId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la suppression');
  }
  
  return response.json();
};

// ✅ FINALISATION INVENTAIRE
const finishInventaire = async ({ id, force = false }: { 
  id: string; 
  force?: boolean 
}): Promise<InventaireWithItems & { stats: any; message: string }> => {
  const response = await fetch(`/api/inventaires/${id}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la finalisation');
  }
  
  return response.json();
};

// ✅ HOOKS
export function useInventaire(id: string) {
  return useQuery({
    queryKey: ['inventaire', id],
    queryFn: () => fetchInventaire(id),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 secondes (plus court car données changeantes)
    refetchOnWindowFocus: true
  });
}

export function useUpdateInventaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateInventaire,
    onSuccess: (updatedInventaire) => {
      // Mettre à jour le cache du détail
      queryClient.setQueryData(['inventaire', updatedInventaire.id], updatedInventaire);
      
      // Invalider la liste des inventaires
      queryClient.invalidateQueries({ queryKey: ['inventaires'] });
      
      console.log('✅ Inventaire modifié:', updatedInventaire.nom);
    }
  });
}

export function useAddInventaireItem(inventaireId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InventaireItemCreateData) => addInventaireItem({ inventaireId, data }),
    onSuccess: (newItem) => {
      // Invalider le détail de l'inventaire pour recharger les items et stats
      queryClient.invalidateQueries({ queryKey: ['inventaire', inventaireId] });
      
      console.log('✅ Item ajouté:', {
        ean13: newItem.ean13,
        quantite: newItem.quantite,
        isDoublon: newItem.isDoublon,
        message: newItem.message
      });
    }
  });
}

export function useUpdateInventaireItem(inventaireId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, quantite }: { itemId: string; quantite: number }) => 
      updateInventaireItem({ inventaireId, itemId, quantite }),
    onSuccess: (updatedItem) => {
      // Invalider pour recharger les stats
      queryClient.invalidateQueries({ queryKey: ['inventaire', inventaireId] });
      
      console.log('✅ Quantité modifiée:', updatedItem.message);
    }
  });
}

export function useDeleteInventaireItem(inventaireId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (itemId: string) => deleteInventaireItem({ inventaireId, itemId }),
    onSuccess: (result) => {
      // Invalider pour recharger la liste et les stats
      queryClient.invalidateQueries({ queryKey: ['inventaire', inventaireId] });
      
      console.log('✅ Item supprimé:', result.message);
    }
  });
}

export function useFinishInventaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: finishInventaire,
    onSuccess: (finishedInventaire) => {
      // Mettre à jour le cache du détail
      queryClient.setQueryData(['inventaire', finishedInventaire.id], finishedInventaire);
      
      // Invalider la liste des inventaires (changement de statut)
      queryClient.invalidateQueries({ queryKey: ['inventaires'] });
      
      console.log('✅ Inventaire finalisé:', finishedInventaire.message);
    }
  });
}