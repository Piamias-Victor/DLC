// src/lib/constants/status.ts - Mise à jour avec A_VERIFIER
import type { StatusConfig } from '@/lib/types';
import type { Signalement } from '@prisma/client';

export type SignalementStatus = Signalement['status'];

export const STATUS_CONFIG: Record<SignalementStatus, StatusConfig> = {
  EN_ATTENTE: {
    value: 'EN_ATTENTE',
    label: 'En attente',
    color: 'gray',
    description: 'Signalement en attente de traitement'
  },
  EN_COURS: {
    value: 'EN_COURS',
    label: 'En cours',
    color: 'blue',
    description: 'Action en cours de réalisation'
  },
  A_DESTOCKER: {
    value: 'A_DESTOCKER',
    label: 'À déstocker',
    color: 'orange',
    description: 'Produit à transférer vers autre pharmacie'
  },
  A_VERIFIER: {
    value: 'A_VERIFIER',
    label: 'À vérifier',
    color: 'orange',
    description: 'Probablement écoulé, contrôle terrain requis'
  },
  DETRUIT: {
    value: 'DETRUIT',
    label: 'Détruit',
    color: 'red',
    description: 'Produit détruit définitivement'
  }
} as const;

export const STATUS_OPTIONS = Object.values(STATUS_CONFIG);

// Couleurs Tailwind correspondantes
export const STATUS_COLORS = {
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  }
} as const;

// Configuration des niveaux d'urgence
export const URGENCY_CONFIG = {
  low: {
    value: 'low',
    label: 'Faible',
    color: 'green',
    description: 'Risque faible de perte'
  },
  medium: {
    value: 'medium',
    label: 'Moyen',
    color: 'orange',
    description: 'Surveiller régulièrement'
  },
  high: {
    value: 'high',
    label: 'Élevé',
    color: 'red',
    description: 'Action requise rapidement'
  },
  critical: {
    value: 'critical',
    label: 'Critique',
    color: 'red',
    description: 'Action immédiate nécessaire'
  }
} as const;

export const URGENCY_OPTIONS = Object.values(URGENCY_CONFIG);