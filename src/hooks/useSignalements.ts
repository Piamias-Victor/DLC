// src/hooks/useSignalements.ts - Mis à jour pour filtres multiples
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SignalementCreateInput, DashboardFiltersInput, BulkUpdateStatusInput } from '@/lib/validations/signalement';
import { DashboardFilters } from '@/lib/types';
import { Signalement } from '@prisma/client';

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

// Fonction API mise à jour pour gérer les filtres multiples
const fetchSignalements = async (
  page = 1, 
  limit = 20, 
  filters: Partial<DashboardFilters & { status: string; urgency: string }> = {}
): Promise<SignalementsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters.search && { search: filters.search }),
    ...(filters.status && filters.status !== 'ALL' && { status: filters.status }),
    ...(filters.urgency && filters.urgency !== 'ALL' && { urgency: filters.urgency }),
    ...(filters.datePeremptionFrom && { datePeremptionFrom: filters.datePeremptionFrom }),
    ...(filters.datePeremptionTo && { datePeremptionTo: filters.datePeremptionTo }),
    ...(filters.quantiteMin && { quantiteMin: filters.quantiteMin }),
    ...(filters.quantiteMax && { quantiteMax: filters.quantiteMax }),
  });

  const response = await fetch(`/api/signalements?${params}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des signalements');
  }
  return response.json();
};

interface SignalementCreateData {
  codeBarres: string;
  quantite: number;
  datePeremption: string;
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
  filters: Partial<DashboardFilters & { status: string; urgency: string }> = {}
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

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: bulkUpdateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    },
  });
}

export type { Signalement };