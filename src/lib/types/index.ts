// src/lib/types/index.ts - Types corrigés
import type { Signalement as PrismaSignalement } from '@prisma/client';

export interface ParsedCode {
  originalCode: string;
  codeType: 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';
  processedCode: string;
  gtin?: string;
  expirationDate?: string;
  batchLot?: string;
  serialNumber?: string;
}

// Utiliser directement les types Prisma pour éviter les conflits
export type SignalementStatus = PrismaSignalement['status'];
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type CodeType = 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';

// Types métier signalement
export interface SignalementData {
  codeBarres: string;
  quantite: string;
  datePeremption: string;
  commentaire?: string;
}

export interface SignalementWithId extends SignalementData {
  id: string;
  timestamp: string;
  urgency?: UrgencyLevel;
  status: SignalementStatus;
}

// Type pour le signalement complet (depuis DB) - Utiliser le type Prisma
export type Signalement = PrismaSignalement;

// Types pour les filtres
export interface DashboardFilters {
  search: string;
  status: SignalementStatus[] | 'ALL';
  urgency: UrgencyLevel[] | 'ALL';
  datePeremptionFrom: string;
  datePeremptionTo: string;
  quantiteMin: string;
  quantiteMax: string;
}

// Types pour la sélection multiple
export interface BulkUpdateRequest {
  signalementIds: string[];
  newStatus: SignalementStatus;
}

// Types pour l'historique
export interface StatusChangeLog {
  signalementId: string;
  fromStatus: SignalementStatus;
  toStatus: SignalementStatus;
  changedAt: Date;
  changedBy?: string;
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

// Types de configuration
export interface ScannerConfig {
  minLength: number;
  maxLength: number;
  timeout: number;
  enableDataMatrix: boolean;
  enableEAN13: boolean;
}

// Types d'événements
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

// Types pour les parseurs
export interface GS1ApplicationIdentifier {
  ai: string;
  description: string;
  fixedLength?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}