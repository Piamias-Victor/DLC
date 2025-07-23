// src/lib/hooks/useSignalements.ts - Version sans import Prisma
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SignalementCreateInput } from '@/lib/validations/signalement';
import { Signalement } from '../types';

// Types compatibles avec Prisma (sans import direct)
interface SignalementFromDB {
  id: string;
  codeBarres: string;
  quantite: number;
  datePeremption: string; // ISO string depuis l'API
  commentaire: string | null;
  createdAt: string; // ISO string depuis l'API
  updatedAt: string; // ISO string depuis l'API
}

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

// Export du type Prisma pour usage dans les composants
export type { Signalement };