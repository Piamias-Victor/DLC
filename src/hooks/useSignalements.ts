// src/hooks/useSignalements.ts - Version complète avec matching intelligent
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

// Fonction de normalisation pour matching
function normalizeForMatching(code: string): string {
  const cleaned = code.replace(/[^0-9]/g, '').replace(/^0+/, '');
  return cleaned.length >= 8 ? cleaned : code;
}

// Fonction API avec matching intelligent amélioré
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

  console.log(`📊 ${rotations.length} rotations chargées pour matching`);

  // Type pour les rotations
  interface Rotation {
    id: string;
    ean13: string;
    rotationMensuelle: number;
    derniereMAJ: string;
  }

  // 3. Enrichir avec matching intelligent ULTRA-AMÉLIORÉ
  const enrichedSignalements = signalementsData.data.map((signalement: Signalement) => {
    
    // Fonction de matching intelligent avec toutes les stratégies
    const findRotation = (code: string): Rotation | null => {
      const rotationList = rotations as Rotation[];
      
      console.log(`🔍 Recherche rotation pour signalement: "${code}"`);
      
      // 1. Match exact
      let rotation = rotationList.find(r => r.ean13 === code);
      if (rotation) {
        console.log(`✅ Match exact: ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
        return rotation;
      }
      
      // 2. Match normalisé (supprimer zéros de tête)
      const normalizedCode = normalizeForMatching(code);
      rotation = rotationList.find(r => normalizeForMatching(r.ean13) === normalizedCode);
      if (rotation) {
        console.log(`✅ Match normalisé: ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
        return rotation;
      }
      
      // 3. Match préfixe (10 premiers chiffres)
      if (normalizedCode.length >= 10) {
        const codePrefix = normalizedCode.substring(0, 10);
        rotation = rotationList.find(r => {
          const rNormalized = normalizeForMatching(r.ean13);
          if (rNormalized.length >= 10) {
            const rPrefix = rNormalized.substring(0, 10);
            return rPrefix === codePrefix;
          }
          return false;
        });
        if (rotation) {
          console.log(`✅ Match préfixe (10): ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
          return rotation;
        }
      }
      
      // 4. Match préfixe (8 premiers chiffres)
      if (normalizedCode.length >= 8) {
        const codePrefix8 = normalizedCode.substring(0, 8);
        rotation = rotationList.find(r => {
          const rNormalized = normalizeForMatching(r.ean13);
          if (rNormalized.length >= 8) {
            const rPrefix8 = rNormalized.substring(0, 8);
            return rPrefix8 === codePrefix8;
          }
          return false;
        });
        if (rotation) {
          console.log(`✅ Match préfixe (8): ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
          return rotation;
        }
      }
      
      // 5. Match suffixe (8 derniers chiffres)
      if (normalizedCode.length >= 8) {
        const codeSuffix = normalizedCode.substring(normalizedCode.length - 8);
        rotation = rotationList.find(r => {
          const rNormalized = normalizeForMatching(r.ean13);
          if (rNormalized.length >= 8) {
            const rSuffix = rNormalized.substring(rNormalized.length - 8);
            return rSuffix === codeSuffix;
          }
          return false;
        });
        if (rotation) {
          console.log(`✅ Match suffixe (8): ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
          return rotation;
        }
      }
      
      // 6. Match inclusion (le code signalement inclus dans rotation)
      rotation = rotationList.find(r => {
        const rNormalized = normalizeForMatching(r.ean13);
        const codeNorm = normalizeForMatching(code);
        return rNormalized.includes(codeNorm) && codeNorm.length >= 8;
      });
      if (rotation) {
        console.log(`✅ Match inclusion (code dans rotation): ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
        return rotation;
      }
      
      // 7. Match inclusion inverse (rotation incluse dans code signalement)
      rotation = rotationList.find(r => {
        const rNormalized = normalizeForMatching(r.ean13);
        const codeNorm = normalizeForMatching(code);
        return codeNorm.includes(rNormalized) && rNormalized.length >= 8;
      });
      if (rotation) {
        console.log(`✅ Match inclusion inverse (rotation dans code): ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
        return rotation;
      }
      
      // 8. Match partiel intelligent (au moins 8 chiffres communs consécutifs)
      rotation = rotationList.find(r => {
        const rNormalized = normalizeForMatching(r.ean13);
        const codeNorm = normalizeForMatching(code);
        
        // Chercher sous-séquences communes de 8+ chiffres
        for (let i = 0; i <= codeNorm.length - 8; i++) {
          const subCode = codeNorm.substring(i, i + 8);
          if (rNormalized.includes(subCode)) {
            return true;
          }
        }
        return false;
      });
      if (rotation) {
        console.log(`✅ Match partiel (8+ chiffres communs): ${code} → ${rotation.ean13} (${rotation.rotationMensuelle})`);
        return rotation;
      }
      
      console.log(`❌ Aucune rotation trouvée pour: "${code}"`);
      return null;
    };
    
    const rotation = findRotation(signalement.codeBarres);
    return {
      ...signalement,
      rotation: rotation || null
    };
  });

  // Statistiques de matching
  const totalAvecRotation = enrichedSignalements.filter((s: SignalementWithRotation) => s.rotation).length;
  console.log(`📈 Matching résultats: ${totalAvecRotation}/${enrichedSignalements.length} signalements avec rotation`);

  return {
    ...signalementsData,
    data: enrichedSignalements,
    stats: {
      totalAvecRotation,
      moyenneProbaEcoulement: 0,
      autoVerifies: 0
    }
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