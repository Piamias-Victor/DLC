// src/hooks/useInventaire.ts - Version compatible avec l'existant
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  InventaireWithItems, 
  InventaireUpdateData,
  InventaireItem 
} from '@/lib/types/inventaire';

// ✅ Interface étendue avec date de péremption (compatible avec l'existant)
interface InventaireItemCreateDataWithDate {
  ean13: string;
  quantite: number;
  datePeremption?: Date | null; // 🆕 NOUVEAU: Date optionnelle
}

// ✅ Interface de réponse avec info signalement
interface InventaireItemResponseWithSignalement extends InventaireItem {
  isDoublon: boolean;
  message: string;
  previousQuantite?: number;
  signalement?: {
    created: boolean;
    id?: string;
    error?: string;
    message: string;
  };
}

// ✅ FETCH DÉTAIL INVENTAIRE (inchangé)
const fetchInventaire = async (id: string): Promise<InventaireWithItems & { stats: any }> => {
  const response = await fetch(`/api/inventaires/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors du chargement de l\'inventaire');
  }
  return response.json();
};

// ✅ MISE À JOUR INVENTAIRE (inchangé)
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

// ✅ AJOUT ITEM avec date et création signalement (NOUVELLE VERSION)
const addInventaireItemWithDate = async ({ inventaireId, data }: { 
  inventaireId: string; 
  data: InventaireItemCreateDataWithDate 
}): Promise<InventaireItemResponseWithSignalement> => {
  
  // Préparer les données avec date
  const payload = {
    ean13: data.ean13,
    quantite: data.quantite,
    datePeremption: data.datePeremption && data.datePeremption instanceof Date 
      ? data.datePeremption.toISOString().split('T')[0] 
      : data.datePeremption || null
  };

  console.log('📦 Envoi données inventaire avec signalement:', payload);

  const response = await fetch(`/api/inventaires/${inventaireId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de l\'ajout du produit');
  }
  
  return response.json();
};

// ✅ FONCTIONS EXISTANTES INCHANGÉES

// MODIFICATION QUANTITÉ ITEM
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

// SUPPRESSION ITEM
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

// FINALISATION INVENTAIRE
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

// ✅ HOOKS EXISTANTS (inchangés)
export function useInventaire(id: string) {
  return useQuery({
    queryKey: ['inventaire', id],
    queryFn: () => fetchInventaire(id),
    enabled: !!id,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true
  });
}

export function useUpdateInventaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateInventaire,
    onSuccess: (updatedInventaire) => {
      queryClient.setQueryData(['inventaire', updatedInventaire.id], updatedInventaire);
      queryClient.invalidateQueries({ queryKey: ['inventaires'] });
      console.log('✅ Inventaire modifié:', updatedInventaire.nom);
    }
  });
}

// ✅ Hook ajout item AVEC NOUVELLE LOGIQUE
export function useAddInventaireItem(inventaireId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InventaireItemCreateDataWithDate) => addInventaireItemWithDate({ inventaireId, data }),
    onSuccess: (newItem) => {
      // Invalider le détail de l'inventaire pour recharger les items et stats
      queryClient.invalidateQueries({ queryKey: ['inventaire', inventaireId] });
      
      // 🆕 Invalider aussi les signalements si un a été créé
      if (newItem.signalement?.created) {
        queryClient.invalidateQueries({ queryKey: ['signalements'] });
      }
      
      console.log('✅ Item ajouté avec signalement:', {
        ean13: newItem.ean13,
        quantite: newItem.quantite,
        isDoublon: newItem.isDoublon,
        signalementCreated: newItem.signalement?.created,
        signalementId: newItem.signalement?.id,
        message: newItem.message,
        signalementMessage: newItem.signalement?.message
      });
    }
  });
}

// ✅ HOOKS EXISTANTS INCHANGÉS
export function useUpdateInventaireItem(inventaireId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, quantite }: { itemId: string; quantite: number }) => 
      updateInventaireItem({ inventaireId, itemId, quantite }),
    onSuccess: (updatedItem) => {
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
      queryClient.setQueryData(['inventaire', finishedInventaire.id], finishedInventaire);
      queryClient.invalidateQueries({ queryKey: ['inventaires'] });
      console.log('✅ Inventaire finalisé:', finishedInventaire.message);
    }
  });
}