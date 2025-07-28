// src/hooks/rotation/useRotations.ts - Version corrigée
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  ProductRotation, 
  RotationImportResult, 
  ProductRotationInput,
  RotationFiltersInput 
} from '@/lib/types';

interface RotationsResponse {
  data: ProductRotation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  stats: {
    total: number;
    rotationMoyenne: number;
    rotationMax: number;
    derniereMaj: string | null;
  };
  filters: RotationFiltersInput;
}

interface ImportResponse extends RotationImportResult {
  recalculatedUrgencies: number;
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    created: number;
    updated: number;
  };
}

// Fetch rotations avec filtres
const fetchRotations = async (filters: Partial<RotationFiltersInput> = {}): Promise<RotationsResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/rotations?${params}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des rotations');
  }
  return response.json();
};

// Créer/modifier rotation
const upsertRotation = async (data: ProductRotationInput): Promise<ProductRotation> => {
  const response = await fetch('/api/rotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la sauvegarde');
  }
  
  return response.json();
};

// Supprimer rotation
const deleteRotation = async (id: string): Promise<void> => {
  const response = await fetch(`/api/rotations?id=${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression');
  }
};

// Import CSV
const importRotationsCSV = async (
  file: File, 
  recalculateUrgencies = true
): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('recalculateUrgencies', String(recalculateUrgencies));

  const response = await fetch('/api/rotations/import', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de l\'import');
  }
  
  return response.json();
};

// Télécharger template CSV
const downloadTemplate = async (): Promise<Blob> => {
  const response = await fetch('/api/rotations/import');
  
  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du template');
  }
  
  return response.blob();
};

// Recalculer urgences
const recalculateUrgencies = async (params: {
  all?: boolean;
  signalementIds?: string[];
}): Promise<{ processed: number; withRotation: number; autoVerified: number }> => {
  const response = await fetch('/api/signalements/recalculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors du recalcul');
  }
  
  const result = await response.json();
  return result.stats;
};

// Hooks
export function useRotations(filters: Partial<RotationFiltersInput> = {}) {
  return useQuery({
    queryKey: ['rotations', filters],
    queryFn: () => fetchRotations(filters)
  });
}

export function useUpsertRotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: upsertRotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    }
  });
}

export function useDeleteRotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteRotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    }
  });
}

export function useImportRotations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, recalculate }: { file: File; recalculate: boolean }) =>
      importRotationsCSV(file, recalculate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    }
  });
}

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: downloadTemplate
  });
}

export function useRecalculateUrgencies() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: recalculateUrgencies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    }
  });
}