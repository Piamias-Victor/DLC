// src/lib/types/inventaire.ts
import type { Inventaire as PrismaInventaire, InventaireItem as PrismaInventaireItem } from '@prisma/client';

// ✅ TYPES DE BASE
export type InventaireStatus = 'EN_COURS' | 'TERMINE' | 'ARCHIVE';

// ✅ TYPES COMPLETS (depuis Prisma)
export type Inventaire = PrismaInventaire;
export type InventaireItem = PrismaInventaireItem;

// ✅ TYPES ÉTENDUS AVEC RELATIONS
export interface InventaireWithItems extends Inventaire {
  items: InventaireItem[];
  _count?: {
    items: number;
  };
}

// ✅ TYPES POUR FORMULAIRES
export interface InventaireFormData {
  nom: string;
  description?: string;
}

export interface InventaireItemFormData {
  ean13: string;
  quantite: string; // String dans le form, number après validation
}

// ✅ TYPES POUR API
export interface InventaireCreateData {
  nom: string;
  description?: string;
}

export interface InventaireItemCreateData {
  ean13: string;
  quantite: number;
}

export interface InventaireUpdateData {
  nom?: string;
  description?: string;
}

// ✅ TYPES POUR RESPONSES API
export interface InventairesResponse {
  data: InventaireWithItems[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface InventaireDetailResponse {
  inventaire: InventaireWithItems;
}

export interface InventaireStatsResponse {
  totalProduits: number;
  totalQuantite: number;
  tempsEcoule?: number; // en secondes
}

// ✅ TYPES POUR GESTION DOUBLONS
export interface DoublonDetection {
  isDoublon: boolean;
  existingItem?: InventaireItem;
  newQuantiteTotal?: number;
}

// ✅ TYPES POUR EXPORT
export interface ExportCSVData {
  ean13: string;
  quantite: number;
}

// ✅ TYPES POUR UI STATE
export interface InventaireUIState {
  isLoading: boolean;
  error: string | null;
  clearTrigger: number;
  showDoublonAlert: boolean;
  lastAddedItem?: InventaireItem;
}

// ✅ TYPES POUR FILTRES (future extension)
export interface InventaireFilters {
  status?: InventaireStatus | 'ALL';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ✅ CONFIGURATION STATUTS
export interface InventaireStatusConfig {
  value: InventaireStatus;
  label: string;
  color: 'gray' | 'blue' | 'green' | 'orange';
  description: string;
}

// ✅ ERREURS MÉTIER
export interface InventaireError {
  code: 'INVENTAIRE_NOT_FOUND' | 'INVENTAIRE_ALREADY_FINISHED' | 'ITEM_VALIDATION_ERROR' | 'EXPORT_ERROR';
  message: string;
  details?: any;
}

// ✅ IMPORT DANS TYPES GLOBAUX - POUR ÉVITER ERREURS
export interface ParsedCode {
  originalCode: string;
  codeType: 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';
  processedCode: string;
  gtin?: string;
  expirationDate?: string;
  batchLot?: string;
  serialNumber?: string;
}