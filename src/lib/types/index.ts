// src/lib/types/index.ts - Correction simple
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

// Types de base
export type SignalementStatus = PrismaSignalement['status'];
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type CodeType = 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';

// Types signalement
export interface SignalementData {
  codeBarres: string;
  quantite: string;
  datePeremption: string;
  commentaire?: string;
}

// Types complets depuis DB (Prisma génère déjà les bons types après migration)
export type Signalement = PrismaSignalement;
export type ProductRotation = PrismaProductRotation;

// Types étendus avec rotation (les champs urgenceCalculee et probabiliteEcoulement sont déjà dans Signalement)
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

// Types filtres avec urgence calculée
export interface DashboardFilters {
  search: string;
  status: SignalementStatus[] | 'ALL';
  urgency: UrgencyLevel[] | 'ALL';
  urgenceCalculee: UrgencyLevel[] | 'ALL';
  datePeremptionFrom: string;
  datePeremptionTo: string;
  quantiteMin: string;
  quantiteMax: string;
  avecRotation: boolean;
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