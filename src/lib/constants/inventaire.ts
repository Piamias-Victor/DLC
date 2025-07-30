// src/lib/constants/inventaire.ts
import type { InventaireStatus, InventaireStatusConfig } from '@/lib/types/inventaire';

// ✅ CONFIGURATION DES STATUTS
export const INVENTAIRE_STATUS_CONFIG: Record<InventaireStatus, InventaireStatusConfig> = {
  EN_COURS: {
    value: 'EN_COURS',
    label: 'En cours',
    color: 'blue',
    description: 'Inventaire en cours de saisie'
  },
  TERMINE: {
    value: 'TERMINE',
    label: 'Terminé',
    color: 'green',
    description: 'Inventaire finalisé'
  },
  ARCHIVE: {
    value: 'ARCHIVE',
    label: 'Archivé',
    color: 'gray',
    description: 'Inventaire archivé (lecture seule)'
  }
} as const;

export const INVENTAIRE_STATUS_OPTIONS = Object.values(INVENTAIRE_STATUS_CONFIG);

// ✅ COULEURS TAILWIND CORRESPONDANTES
export const INVENTAIRE_STATUS_COLORS = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-500'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500'
  }
} as const;

// ✅ LIMITES ET CONTRAINTES
export const INVENTAIRE_LIMITS = {
  MAX_ITEMS_PER_INVENTAIRE: 10000,
  MAX_QUANTITY_PER_ITEM: 9999,
  MIN_QUANTITY_PER_ITEM: 1,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_NAME_LENGTH: 3
} as const;

// ✅ MESSAGES D'ERREUR
export const INVENTAIRE_ERRORS = {
  NOT_FOUND: 'Inventaire non trouvé',
  ALREADY_FINISHED: 'Cet inventaire est déjà terminé',
  EMPTY_INVENTAIRE: 'Impossible de finaliser un inventaire vide',
  INVALID_EAN13: 'Code EAN13 invalide',
  QUANTITY_OUT_OF_RANGE: 'Quantité hors limites (1-9999)',
  NAME_TOO_SHORT: 'Le nom doit contenir au moins 3 caractères',
  NAME_TOO_LONG: 'Le nom ne peut pas dépasser 100 caractères',
  DESCRIPTION_TOO_LONG: 'La description ne peut pas dépasser 500 caractères',
  INVENTAIRE_IN_PROGRESS: 'Un inventaire est déjà en cours',
  EXPORT_FAILED: 'Erreur lors de l\'export CSV'
} as const;

// ✅ FORMAT EXPORT CSV
export const CSV_CONFIG = {
  SEPARATOR: ';',
  FILENAME_PREFIX: 'inventaire_',
  DATE_FORMAT: 'yyyyMMdd_HHmm',
  ENCODING: 'utf-8'
} as const;

// ✅ ORDRE PAR DÉFAUT (pour les items)
export const DEFAULT_ORDER_INCREMENT = 1;