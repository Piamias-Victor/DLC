// src/lib/hooks/useSignalements.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SignalementCreateInput } from '@/lib/validations/signalement';
import { Signalement } from '../types';

// Types pour l'API
interface SignalementsResponse {
  data: Signalement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Fonctions API
const fetchSignalements = async (page = 1, limit = 20): Promise<SignalementsResponse> => {
  const response = await fetch(`/api/signalements?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des signalements');
  }
  return response.json();
};

const createSignalement = async (data: SignalementCreateInput): Promise<Signalement> => {
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

// Hooks
export function useSignalements(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['signalements', page, limit],
    queryFn: () => fetchSignalements(page, limit),
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