// src/lib/types/index.ts - AVEC TYPES MANUELS
import type { Signalement as PrismaSignalement, ProductRotation as PrismaProductRotation } from '@prisma/client';

export interface ParsedCode {
  originalCode: string;
  codeType: 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';
  processedCode: string;
  gtin?: string;
  expirationDate?: string;
  batchLot?: string;
  serialNumber?: string;
}

// ✅ TYPES MANUELS - FINI LES GALÈRES
export type SignalementStatus = 
  | 'EN_ATTENTE' 
  | 'EN_COURS' 
  | 'A_DESTOCKER' 
  | 'A_VERIFIER' 
  | 'ECOULEMENT' 
  | 'DETRUIT';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical' | 'ecoulement';
export type CodeType = 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';

// Types signalement
export interface SignalementData {
  codeBarres: string;
  quantite: string;
  datePeremption: string;
  commentaire?: string;
}

// Types complets depuis DB
export type Signalement = PrismaSignalement;
export type ProductRotation = PrismaProductRotation;

// Types étendus avec rotation
export interface SignalementWithRotation extends Signalement {
  rotation?: ProductRotation;
}

// Types pour calculs d'urgence
export interface UrgencyCalculation {
  urgence: UrgencyLevel;
  probabiliteEcoulement: number;
  shouldAutoVerify: boolean;
  reasoning: {
    moisRestants: number;
    quantiteTheorique: number;
    quantiteAvecFifo: number;
    surplus: number;
  };
}

// Types pour import rotation
export interface ProductRotationInput {
  ean13: string;
  rotationMensuelle: number;
}

export interface RotationFiltersInput {
  search?: string;
  rotationMin?: string;
  rotationMax?: string;
  dateMAJFrom?: string;
  dateMAJTo?: string;
  limit?: number;
  offset?: number;
}

export interface RotationImportData {
  ean13: string;
  rotationMensuelle: number;
}

export interface RotationImportResult {
  success: number;
  errors: Array<{
    line: number;
    ean13: string;
    error: string;
  }>;
  updated: number;
  created: number;
}

// Types filtres - AVEC FILTRE POURCENTAGE
export interface DashboardFilters {
  search: string;
  status: SignalementStatus[] | 'ALL';
  urgency: UrgencyLevel[] | 'ALL';
  urgenceCalculee: UrgencyLevel[] | 'ALL';
  datePeremptionFrom: string;
  datePeremptionTo: string;
  quantiteMin: string;
  quantiteMax: string;
  probabiliteEcoulementMax: string;
  avecRotation: boolean;
}

// Type pour le tri des colonnes
export type SortField = 'codeBarres' | 'quantite' | 'datePeremption' | 'status' | 'urgenceCalculee' | 'probabiliteEcoulement' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Types pour bulk update
export interface BulkUpdateRequest {
  signalementIds: string[];
  newStatus: SignalementStatus;
}

// Configuration des statuts
export interface StatusConfig {
  value: SignalementStatus;
  label: string;
  color: 'gray' | 'blue' | 'orange' | 'green' | 'red';
  description: string;
}

// Types UI
export type FormErrors<T> = {
  [K in keyof T]?: string;
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Types pour GS1
export interface GS1ApplicationIdentifier {
  ai: string;
  description: string;
  fixedLength?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

// Types pour les événements
export interface ScanEvent {
  code: string;
  parsedData?: ParsedCode;
  timestamp: Date;
  source: 'manual' | 'scanner';
}

export interface ErrorEvent {
  error: string;
  timestamp: Date;
  context?: string;
}

// Types pour les créations/mises à jour
export interface SignalementCreateData {
  codeBarres: string;
  quantite: number;
  datePeremption: Date;
  commentaire?: string;
}

export interface SignalementUpdateData {
  codeBarres?: string;
  quantite?: number;
  datePeremption?: Date;
  commentaire?: string;
  status?: SignalementStatus;
}