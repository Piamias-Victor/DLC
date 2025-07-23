// src/lib/types/index.ts

// Types de base pour les codes
export interface ParsedCode {
  originalCode: string;
  codeType: 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';
  processedCode: string;
  gtin?: string;
  expirationDate?: string;
  batchLot?: string;
  serialNumber?: string;
}

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
  status?: SignalementStatus;
}

// Énumérations
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type SignalementStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type CodeType = 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';

// Types UI
export type FormErrors<T> = {
  [K in keyof T]?: string;
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
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

export interface Signalement {
  id: string;
  codeBarres: string;
  quantite: number;
  datePeremption: Date;
  commentaire: string | null;
  createdAt: Date;
  updatedAt: Date;
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
}