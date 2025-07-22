// Types pour les codes parsés
export interface ParsedCode {
  originalCode: string;
  codeType: 'EAN13' | 'DATA_MATRIX' | 'UNKNOWN';
  processedCode: string;
  gtin?: string;
  expirationDate?: string;
  batchLot?: string;
  serialNumber?: string;
}

// Détection du type de code
export function detectCodeType(code: string): ParsedCode['codeType'] {
  const clean = code.trim();
  
  console.log('🔍 Détection type pour:', clean, 'longueur:', clean.length);
  
  // Règle simple : si plus de 13 caractères = Data Matrix
  if (clean.length > 13) {
    console.log('✅ Détecté comme DATA_MATRIX (> 13 caractères)');
    return 'DATA_MATRIX';
  }
  
  // EAN-13 (exactement 13 chiffres)
  if (clean.length === 13 && /^\d{13}$/.test(clean)) {
    console.log('✅ Détecté comme EAN13');
    return 'EAN13';
  }
  
  console.log('⚠️ Type UNKNOWN');
  return 'UNKNOWN';
}

// Parse Data Matrix GS1
export function parseDataMatrix(code: string): ParsedCode {
  const original = code.trim();
  const result: ParsedCode = {
    originalCode: original,
    codeType: 'DATA_MATRIX',
    processedCode: original
  };

  console.log('🔍 Parsing Data Matrix:', original);

  // Nettoyer et séparer les données (sans ]d2 prefix)
  const data = original;
  
  // Parser les AI avec position fixe pour certains
  let position = 0;
  
  while (position < data.length) {
    // Lire l'AI (2 chiffres)
    const ai = data.substring(position, position + 2);
    position += 2;
    
    console.log('📍 AI trouvé:', ai, 'à position', position - 2);
    
    let value = '';
    
    // Longueurs fixes pour certains AI
    switch (ai) {
      case '01': // GTIN (14 caractères)
        value = data.substring(position, position + 14);
        position += 14;
        result.gtin = value;
        result.processedCode = value;
        console.log('✅ GTIN:', value);
        break;
        
      case '17': // Date péremption (6 caractères YYMMDD)
        value = data.substring(position, position + 6);
        position += 6;
        result.expirationDate = parseGS1Date(value);
        console.log('✅ Date péremption:', value, '→', result.expirationDate);
        break;
        
      case '10': // Lot (longueur variable, jusqu'au prochain AI ou fin)
        // Chercher le prochain AI (2 chiffres consécutifs) ou fin
        let nextAI = position;
        while (nextAI < data.length - 1) {
          const potential = data.substring(nextAI, nextAI + 2);
          if (/^\d{2}$/.test(potential) && ['01', '10', '11', '17', '21', '30', '37'].includes(potential)) {
            break;
          }
          nextAI++;
        }
        value = data.substring(position, nextAI);
        position = nextAI;
        result.batchLot = value;
        console.log('✅ Lot:', value);
        break;
        
      case '21': // Numéro série (longueur variable)
        let nextAI21 = position;
        while (nextAI21 < data.length - 1) {
          const potential = data.substring(nextAI21, nextAI21 + 2);
          if (/^\d{2}$/.test(potential) && ['01', '10', '11', '17', '21', '30', '37'].includes(potential)) {
            break;
          }
          nextAI21++;
        }
        value = data.substring(position, nextAI21);
        position = nextAI21;
        result.serialNumber = value;
        console.log('✅ Série:', value);
        break;
        
      default:
        // AI inconnu, essayer de lire jusqu'au prochain AI ou fin
        console.log('⚠️ AI inconnu:', ai);
        let nextUnknown = position;
        while (nextUnknown < data.length - 1) {
          const potential = data.substring(nextUnknown, nextUnknown + 2);
          if (/^\d{2}$/.test(potential) && ['01', '10', '11', '17', '21', '30', '37'].includes(potential)) {
            break;
          }
          nextUnknown++;
        }
        value = data.substring(position, nextUnknown);
        position = nextUnknown;
        console.log('⚠️ Valeur inconnue:', value);
        break;
    }
  }
  
  console.log('📊 Résultat final:', result);
  return result;
}

// Conversion date GS1 (YYMMDD) vers ISO
export function parseGS1Date(gs1Date: string): string {
  if (gs1Date.length !== 6) return '';
  
  const yy = parseInt(gs1Date.substring(0, 2));
  const mm = parseInt(gs1Date.substring(2, 4));
  const dd = parseInt(gs1Date.substring(4, 6));
  
  // Gestion année (si < 50 = 20xx, sinon 19xx)
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  
  return `${year}-${mm.toString().padStart(2, '0')}-${dd.toString().padStart(2, '0')}`;
}

// Fonction principale de parsing
export function parseCode(code: string): ParsedCode {
  const codeType = detectCodeType(code);
  
  switch (codeType) {
    case 'DATA_MATRIX':
      return parseDataMatrix(code);
      
    case 'EAN13':
      return {
        originalCode: code,
        codeType: 'EAN13',
        processedCode: code,
        gtin: code
      };
      
    default:
      return {
        originalCode: code,
        codeType: 'UNKNOWN',
        processedCode: code
      };
  }
}