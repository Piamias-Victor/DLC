// src/lib/utils/codeParser.ts
import { ParsedCode, GS1ApplicationIdentifier } from '@/lib/types';

// Configuration des Application Identifiers GS1
const GS1_AIS: Record<string, GS1ApplicationIdentifier> = {
  '01': { ai: '01', description: 'GTIN', fixedLength: 14 },
  '10': { ai: '10', description: 'Batch/Lot', minLength: 1, maxLength: 20 },
  '11': { ai: '11', description: 'Production Date', fixedLength: 6 },
  '17': { ai: '17', description: 'Expiration Date', fixedLength: 6 },
  '21': { ai: '21', description: 'Serial Number', minLength: 1, maxLength: 20 },
  '30': { ai: '30', description: 'Variable Count', minLength: 1, maxLength: 8 },
  '37': { ai: '37', description: 'Number of Units', minLength: 1, maxLength: 8 }
};

/**
 * Détecte le type de code à partir de sa structure
 */
export function detectCodeType(code: string): ParsedCode['codeType'] {
  const clean = code.trim();
  
  // EAN-13: exactement 13 chiffres
  if (clean.length === 13 && /^\d{13}$/.test(clean)) {
    return 'EAN13';
  }
  
  // Data Matrix: généralement > 13 caractères avec structure GS1
  if (clean.length > 13) {
    return 'DATA_MATRIX';
  }
  
  return 'UNKNOWN';
}

/**
 * Parse une date GS1 (YYMMDD) vers format ISO
 */
export function parseGS1Date(gs1Date: string): string {
  if (gs1Date.length !== 6 || !/^\d{6}$/.test(gs1Date)) {
    throw new Error(`Format de date GS1 invalide: ${gs1Date}`);
  }
  
  const yy = parseInt(gs1Date.substring(0, 2));
  const mm = parseInt(gs1Date.substring(2, 4));
  const dd = parseInt(gs1Date.substring(4, 6));
  
  // Validation basique
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    throw new Error(`Date GS1 invalide: ${gs1Date}`);
  }
  
  // Gestion de l'année (< 50 = 20xx, >= 50 = 19xx)
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  
  return `${year}-${mm.toString().padStart(2, '0')}-${dd.toString().padStart(2, '0')}`;
}

/**
 * Parse un Data Matrix GS1 
 */
export function parseDataMatrix(code: string): ParsedCode {
  const result: ParsedCode = {
    originalCode: code,
    codeType: 'DATA_MATRIX',
    processedCode: code
  };

  let position = 0;
  const data = code.trim();
  
  // Parser séquentiellement les AIs
  while (position < data.length - 1) {
    // Lire l'AI (2 caractères)
    const ai = data.substring(position, position + 2);
    
    if (!/^\d{2}$/.test(ai)) {
      // Si ce n'est pas un AI valide, continuer
      position++;
      continue;
    }
    
    position += 2;
    const aiConfig = GS1_AIS[ai];
    
    if (!aiConfig) {
      // AI inconnu, essayer de skipper intelligemment
      position = findNextAI(data, position);
      continue;
    }
    
    // Extraire la valeur selon la configuration
    const value = extractAIValue(data, position, aiConfig);
    position += value.length;
    
    // Traiter selon le type d'AI
    switch (ai) {
      case '01':
        result.gtin = value;
        result.processedCode = value;
        break;
      case '17':
        try {
          result.expirationDate = parseGS1Date(value);
        } catch (err) {
          console.warn(`Erreur parsing date: ${value}`, err);
        }
        break;
      case '10':
        result.batchLot = value;
        break;
      case '21':
        result.serialNumber = value;
        break;
    }
  }
  
  return result;
}

/**
 * Extrait la valeur d'un AI selon sa configuration
 */
function extractAIValue(data: string, startPos: number, aiConfig: GS1ApplicationIdentifier): string {
  if (aiConfig.fixedLength) {
    return data.substring(startPos, startPos + aiConfig.fixedLength);
  }
  
  // Longueur variable: chercher le prochain AI ou fin de chaîne
  const nextAIPos = findNextAI(data, startPos);
  let value = data.substring(startPos, nextAIPos);
  
  // Appliquer les limites min/max si définies
  if (aiConfig.maxLength && value.length > aiConfig.maxLength) {
    value = value.substring(0, aiConfig.maxLength);
  }
  
  return value;
}

/**
 * Trouve la position du prochain AI valide
 */
function findNextAI(data: string, startPos: number): number {
  for (let i = startPos + 1; i < data.length - 1; i++) {
    const potentialAI = data.substring(i, i + 2);
    if (/^\d{2}$/.test(potentialAI) && GS1_AIS[potentialAI]) {
      return i;
    }
  }
  return data.length;
}

/**
 * Parse un code EAN-13
 */
export function parseEAN13(code: string): ParsedCode {
  if (code.length !== 13 || !/^\d{13}$/.test(code)) {
    throw new Error(`Code EAN-13 invalide: ${code}`);
  }
  
  return {
    originalCode: code,
    codeType: 'EAN13',
    processedCode: code,
    gtin: code
  };
}

/**
 * Fonction principale de parsing
 */
export function parseCode(code: string): ParsedCode {
  const codeType = detectCodeType(code);
  
  try {
    switch (codeType) {
      case 'DATA_MATRIX':
        return parseDataMatrix(code);
      case 'EAN13':
        return parseEAN13(code);
      default:
        return {
          originalCode: code,
          codeType: 'UNKNOWN',
          processedCode: code
        };
    }
  } catch (error) {
    console.error('Erreur de parsing:', error);
    throw new Error(`Impossible de parser le code: ${error}`);
  }
}

/**
 * Valide si un code est acceptable
 */
export function validateCode(code: string): { isValid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: 'Code vide' };
  }
  
  const clean = code.trim();
  
  if (clean.length < 8) {
    return { isValid: false, error: 'Code trop court (minimum 8 caractères)' };
  }
  
  if (clean.length > 50) {
    return { isValid: false, error: 'Code trop long (maximum 50 caractères)' };
  }
  
  try {
    parseCode(clean);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: String(error) };
  }
}