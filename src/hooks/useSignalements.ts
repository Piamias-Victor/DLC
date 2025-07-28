// src/hooks/useSignalements.ts - Version avec rotation
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SignalementCreateInput, DashboardFiltersInput, BulkUpdateStatusInput } from '@/lib/validations/signalement';
import { DashboardFilters } from '@/lib/types';
import { Signalement } from '@prisma/client';

// Interface étendue avec rotation
interface SignalementWithRotation extends Signalement {
  rotation?: {
    id: string;
    ean13: string;
    rotationMensuelle: number;
    derniereMAJ: string;
  } | null;
}

interface SignalementsResponse {
  data: SignalementWithRotation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: DashboardFilters;
  stats?: {
    totalAvecRotation: number;
    moyenneProbaEcoulement: number;
    autoVerifies: number;
  };
}

// Fonction API mise à jour pour inclure les rotations
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
    ...(filters.avecRotation && { avecRotation: 'true' }),
  });

  // 1. Récupérer les signalements
  const signalementsResponse = await fetch(`/api/signalements?${params}`);
  if (!signalementsResponse.ok) {
    throw new Error('Erreur lors du chargement des signalements');
  }
  const signalementsData = await signalementsResponse.json();

  // 2. Récupérer toutes les rotations (cache côté client)
  const rotationsResponse = await fetch('/api/rotations?limit=1000');
  const rotationsData = rotationsResponse.ok ? await rotationsResponse.json() : { data: [] };
  const rotations = rotationsData.data || [];

  // Définir le type pour les objets rotation
  interface Rotation {
    id: string;
    ean13: string;
    rotationMensuelle: number;
    derniereMAJ: string;
  }

  // 3. Enrichir avec matching intelligent
  const enrichedSignalements = signalementsData.data.map((signalement: Signalement) => {
    // Fonction de matching intelligent intégrée
    const findRotation = (code: string) => {
      // 1. Match exact
      let rotation = rotations.find((r: Rotation) => r.ean13 === code);
      
      if (!rotation) {
        // 2. Match normalisé (supprimer zéros de tête)
        const normalizeEan13 = (c: string) => {
          const cleaned = c.replace(/^0+/, '');
          return cleaned.length >= 8 ? cleaned : c;
        };
        
        const normalizedCode = normalizeEan13(code);
        rotation = rotations.find((r: Rotation) => normalizeEan13(r.ean13) === normalizedCode);
      }
      
      return rotation;
    };
    
    const rotation = findRotation(signalement.codeBarres);
    return {
      ...signalement,
      rotation: rotation || null
    };
  });

  return {
    ...signalementsData,
    data: enrichedSignalements
  };
};

interface SignalementCreateData {
  codeBarres: string;
  quantite: number;
  datePeremption: string;
  commentaire?: string;
}

const createSignalement = async (data: SignalementCreateData): Promise<SignalementWithRotation> => {
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

// Hook pour teste le calcul d'urgence
const testUrgencyCalculation = async (signalementId: string) => {
  const response = await fetch('/api/signalements/test-urgency', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signalementId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur test urgence');
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

// Nouveau hook pour tester le calcul d'urgence
export function useTestUrgencyCalculation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: testUrgencyCalculation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    },
  });
}

export type { SignalementWithRotation, Signalement };