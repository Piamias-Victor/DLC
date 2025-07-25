// src/lib/hooks/useSignalements.ts - Version mise à jour avec filtre quantité
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SignalementCreateInput, DashboardFiltersInput, BulkUpdateStatusInput } from '@/lib/validations/signalement';
import { Signalement, DashboardFilters } from '../types';

// Types pour l'API
interface SignalementsResponse {
  data: Signalement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: DashboardFilters;
}

// Fonctions API - MISE À JOUR
const fetchSignalements = async (
  page = 1, 
  limit = 20, 
  filters: Partial<DashboardFilters> = {}
): Promise<SignalementsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters.search && { search: filters.search }),
    ...(filters.status && filters.status !== 'ALL' && { status: filters.status }),
    ...(filters.urgency && filters.urgency !== 'ALL' && { urgency: filters.urgency }),
    ...(filters.datePeremptionFrom && { datePeremptionFrom: filters.datePeremptionFrom }),
    ...(filters.datePeremptionTo && { datePeremptionTo: filters.datePeremptionTo }),
    ...(filters.quantiteMin && { quantiteMin: filters.quantiteMin }),  // NOUVEAU
    ...(filters.quantiteMax && { quantiteMax: filters.quantiteMax }),  // NOUVEAU
  });

  const response = await fetch(`/api/signalements?${params}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des signalements');
  }
  return response.json();
};

// Types pour l'input côté client
interface SignalementCreateData {
  codeBarres: string;
  quantite: number;
  datePeremption: string; // String depuis le formulaire
  commentaire?: string;
}

const createSignalement = async (data: SignalementCreateData): Promise<Signalement> => {
  const response = await fetch('/api/signalements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la création');
  }
  
  return response.json();
};

const deleteSignalement = async (id: string): Promise<void> => {
  const response = await fetch(`/api/signalements/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression');
  }
};

// Fonction pour le changement d'état en masse
const bulkUpdateStatus = async (data: BulkUpdateStatusInput) => {
  const response = await fetch('/api/signalements/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la mise à jour');
  }
  
  return response.json();
};

// Hooks
export function useSignalements(
  page = 1, 
  limit = 20, 
  filters: Partial<DashboardFilters> = {}
) {
  return useQuery({
    queryKey: ['signalements', page, limit, filters],
    queryFn: () => fetchSignalements(page, limit, filters),
  });
}

export function useCreateSignalement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSignalement,
    onSuccess: () => {
      // Invalider le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    },
  });
}

export function useDeleteSignalement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSignalement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    },
  });
}

// Hook pour le changement d'état en masse
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: bulkUpdateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    },
  });
}

// Export du type Prisma pour usage dans les composants
export type { Signalement };