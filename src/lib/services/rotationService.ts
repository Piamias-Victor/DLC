// src/lib/services/rotationService.ts - Version complète avec parsing CSV amélioré
import { prisma } from '@/lib/prisma/client';
import type { ProductRotation, RotationImportData, RotationImportResult } from '@/lib/types';

// Fonction de normalisation EAN13 améliorée
function normalizeEan13(code: string): string {
  if (!code) return code;
  
  // 1. Nettoyer: garder seulement les chiffres
  let cleaned = code.trim().replace(/[^0-9]/g, '');
  
  // 2. Si très long, prendre les 13 premiers chiffres
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 13);
  }
  
  // 3. Supprimer zéros de tête mais garder minimum 8 chiffres pour EAN8
  const withoutLeadingZeros = cleaned.replace(/^0+/, '');
  const result = withoutLeadingZeros.length >= 8 ? withoutLeadingZeros : cleaned;
  
  console.log(`🔄 Normalisation: "${code}" → "${result}"`);
  return result;
}

export class RotationService {
  
  /**
   * Récupère la rotation d'un produit par EAN13 (avec matching intelligent)
   */
  static async getRotationByEan13(ean13: string): Promise<ProductRotation | null> {
    try {
      console.log(`🔍 Recherche rotation pour: "${ean13}"`);
      
      // 1. Essayer match exact d'abord
      let rotation = await prisma.productRotation.findUnique({
        where: { ean13: ean13.trim() }
      });
      
      if (rotation) {
        console.log(`✅ Match exact trouvé: ${rotation.ean13} → ${rotation.rotationMensuelle}`);
        return rotation;
      }
      
      // 2. Essayer match normalisé
      const normalized = normalizeEan13(ean13);
      rotation = await prisma.productRotation.findFirst({
        where: { ean13: normalized }
      });
      
      if (rotation) {
        console.log(`✅ Match normalisé: ${ean13} → ${rotation.ean13} → ${rotation.rotationMensuelle}`);
        return rotation;
      }
      
      // 3. Recherche avancée avec LIKE pour matching partiel
      const allRotations = await prisma.productRotation.findMany();
      
      for (const rot of allRotations) {
        const rotNormalized = normalizeEan13(rot.ean13);
        const codeNormalized = normalizeEan13(ean13);
        
        // Match préfixe (10 premiers chiffres)
        if (codeNormalized.length >= 10 && rotNormalized.length >= 10) {
          const codePrefix = codeNormalized.substring(0, 10);
          const rotPrefix = rotNormalized.substring(0, 10);
          if (codePrefix === rotPrefix) {
            console.log(`✅ Match préfixe: ${ean13} → ${rot.ean13} → ${rot.rotationMensuelle}`);
            return rot;
          }
        }
        
        // Match suffixe (8 derniers chiffres)
        if (codeNormalized.length >= 8 && rotNormalized.length >= 8) {
          const codeSuffix = codeNormalized.substring(codeNormalized.length - 8);
          const rotSuffix = rotNormalized.substring(rotNormalized.length - 8);
          if (codeSuffix === rotSuffix) {
            console.log(`✅ Match suffixe: ${ean13} → ${rot.ean13} → ${rot.rotationMensuelle}`);
            return rot;
          }
        }
        
        // Match inclusion (le plus court inclus dans le plus long)
        if (rotNormalized.includes(codeNormalized) || codeNormalized.includes(rotNormalized)) {
          console.log(`✅ Match inclusion: ${ean13} → ${rot.ean13} → ${rot.rotationMensuelle}`);
          return rot;
        }
      }
      
      console.log(`❌ Aucune rotation trouvée pour: "${ean13}"`);
      return null;
    } catch (error) {
      console.error('Erreur récupération rotation:', error);
      return null;
    }
  }

  /**
   * Crée ou met à jour une rotation avec normalisation
   */
  static async upsertRotation(ean13: string, rotationMensuelle: number): Promise<ProductRotation> {
    const normalizedEan13 = normalizeEan13(ean13);
    
    console.log(`🔄 Upsert rotation: "${ean13}" → "${normalizedEan13}" (${rotationMensuelle})`);
    
    return await prisma.productRotation.upsert({
      where: { ean13: normalizedEan13 },
      update: {
        rotationMensuelle,
        derniereMAJ: new Date(),
        updatedAt: new Date()
      },
      create: {
        ean13: normalizedEan13,
        rotationMensuelle,
        derniereMAJ: new Date()
      }
    });
  }

  /**
   * Import en masse des rotations avec normalisation
   */
  static async importRotations(data: RotationImportData[]): Promise<RotationImportResult> {
    const result: RotationImportResult = {
      success: 0,
      errors: [],
      updated: 0,
      created: 0
    };

    console.log(`📁 Import démarré: ${data.length} rotations à traiter`);

    for (let i = 0; i < data.length; i++) {
      const { ean13, rotationMensuelle } = data[i];
      
      try {
        // Validation EAN13 après nettoyage
        if (!ean13 || ean13.length === 0) {
          result.errors.push({
            line: i + 1,
            ean13: data[i].ean13 || '',
            error: 'EAN13 vide après nettoyage'
          });
          continue;
        }

        if (ean13.length < 6) {
          result.errors.push({
            line: i + 1,
            ean13: data[i].ean13,
            error: `EAN13 trop court: "${ean13}" (${ean13.length} caractères)`
          });
          continue;
        }

        if (ean13.length > 20) {
          result.errors.push({
            line: i + 1,
            ean13: data[i].ean13,
            error: `EAN13 trop long: "${ean13}" (${ean13.length} caractères)`
          });
          continue;
        }

        // Normaliser le code
        const normalizedEan13 = normalizeEan13(ean13);
        
        if (normalizedEan13.length < 8) {
          result.errors.push({
            line: i + 1,
            ean13: ean13,
            error: `EAN13 trop court après normalisation: "${normalizedEan13}"`
          });
          continue;
        }

        // Validation rotation
        if (isNaN(rotationMensuelle) || rotationMensuelle < 0) {
          result.errors.push({
            line: i + 1,
            ean13: ean13,
            error: 'Rotation invalide (doit être ≥ 0)'
          });
          continue;
        }

        if (rotationMensuelle > 1000) {
          result.errors.push({
            line: i + 1,
            ean13: ean13,
            error: 'Rotation trop élevée (max 1000)'
          });
          continue;
        }

        // Vérifier si existe déjà
        const existing = await prisma.productRotation.findUnique({
          where: { ean13: normalizedEan13 }
        });
        
        // Upsert avec code normalisé
        await prisma.productRotation.upsert({
          where: { ean13: normalizedEan13 },
          update: {
            rotationMensuelle,
            derniereMAJ: new Date(),
            updatedAt: new Date()
          },
          create: {
            ean13: normalizedEan13,
            rotationMensuelle,
            derniereMAJ: new Date()
          }
        });
        
        if (existing) {
          result.updated++;
          console.log(`📝 Updated: "${ean13}" → "${normalizedEan13}" (${rotationMensuelle})`);
        } else {
          result.created++;
          console.log(`✅ Created: "${ean13}" → "${normalizedEan13}" (${rotationMensuelle})`);
        }
        
        result.success++;

      } catch (error) {
        console.error(`Erreur import ligne ${i + 1}:`, error);
        result.errors.push({
          line: i + 1,
          ean13: ean13,
          error: `Erreur technique: ${error}`
        });
      }
    }

    console.log(`🎯 Import terminé: ${result.success} succès, ${result.errors.length} erreurs`);
    return result;
  }

  /**
   * Parse un CSV de rotations avec détection intelligente du format
   */
  // Dans rotationService.ts - parseRotationCSV corrigé pour ton format exact

static parseRotationCSV(csvContent: string): RotationImportData[] {
  // Normaliser les retours à la ligne (Windows → Unix)
  const normalizedContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.trim().split('\n');
  const data: RotationImportData[] = [];

  console.log(`📁 Parsing CSV: ${lines.length} lignes détectées`);
  console.log(`🔍 Première ligne: "${lines[0]}"`);

  // Détecter et ignorer le header
  let startIndex = 0;
  const firstLine = lines[0].trim().toLowerCase();
  if (firstLine.includes('ean') || firstLine.includes('rotation')) {
    startIndex = 1;
    console.log('📋 Header détecté et ignoré');
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    console.log(`📝 Ligne ${i + 1}: "${line}"`);

    try {
      // Parser CSV avec gestion des guillemets
      const csvRegex = /^([^,]+),(.+)$/;
      const match = line.match(csvRegex);
      
      if (!match) {
        console.warn(`⚠️ Ligne ${i + 1} format invalide: "${line}"`);
        continue;
      }

      let [, ean13Raw, rotationRaw] = match;

      // NETTOYER L'EAN13
      // 1. Supprimer tous les espaces
      ean13Raw = ean13Raw.replace(/\s+/g, '');
      // 2. Garder seulement les chiffres
      let ean13 = ean13Raw.replace(/[^0-9]/g, '');
      
      console.log(`🧹 EAN13: "${ean13Raw}" → "${ean13}"`);

      // NETTOYER LA ROTATION
      // 1. Supprimer les guillemets
      rotationRaw = rotationRaw.replace(/"/g, '');
      // 2. Remplacer virgule par point pour décimales
      const rotationStr = rotationRaw.replace(',', '.');
      const rotation = parseFloat(rotationStr);
      
      console.log(`🧹 Rotation: "${rotationRaw}" → "${rotationStr}" → ${rotation}`);

      // VALIDATIONS
      if (!ean13 || ean13.length < 8) {
        console.warn(`⚠️ Ligne ${i + 1}: EAN13 trop court "${ean13}"`);
        continue;
      }

      if (ean13.length > 20) {
        console.warn(`⚠️ Ligne ${i + 1}: EAN13 trop long "${ean13}", tronqué`);
        ean13 = ean13.substring(0, 13);
      }

      if (isNaN(rotation) || rotation < 0) {
        console.warn(`⚠️ Ligne ${i + 1}: Rotation invalide "${rotationStr}" → ${rotation}`);
        continue;
      }

      if (rotation > 1000) {
        console.warn(`⚠️ Ligne ${i + 1}: Rotation trop élevée ${rotation}`);
        continue;
      }

      // AJOUTER À LA LISTE
      data.push({
        ean13,
        rotationMensuelle: rotation
      });
      
      console.log(`✅ Ajouté: EAN="${ean13}" Rotation=${rotation}`);

    } catch (error) {
      console.error(`❌ Erreur ligne ${i + 1}: "${line}"`, error);
      continue;
    }
  }

  console.log(`🎯 Parsing terminé: ${data.length} rotations valides sur ${lines.length - startIndex} lignes`);
  
  // LOG des résultats pour debug
  console.log('\n📊 RÉSULTATS DU PARSING:');
  data.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. EAN="${item.ean13}" Rotation=${item.rotationMensuelle}`);
  });
  if (data.length > 5) {
    console.log(`... et ${data.length - 5} autres rotations`);
  }

  return data;
}

  /**
   * Template CSV mis à jour avec exemples
   */
  static generateTemplate(): string {
    return `ean13,rotationMensuelle
3400930029985,25.5
12345678901,12.0
1234567890123,8.75
5555555555,15.0`;
  }

  // Méthodes inchangées
  static async getAllRotations(limit = 100, offset = 0): Promise<{
    rotations: ProductRotation[];
    total: number;
  }> {
    const [rotations, total] = await Promise.all([
      prisma.productRotation.findMany({
        orderBy: { derniereMAJ: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.productRotation.count()
    ]);

    return { rotations, total };
  }

  static async deleteRotation(id: string): Promise<void> {
    await prisma.productRotation.delete({
      where: { id }
    });
  }

  static async getRotationStats(): Promise<{
    total: number;
    rotationMoyenne: number;
    rotationMax: number;
    derniereMaj: Date | null;
  }> {
    const stats = await prisma.productRotation.aggregate({
      _count: { id: true },
      _avg: { rotationMensuelle: true },
      _max: { rotationMensuelle: true, derniereMAJ: true }
    });

    return {
      total: stats._count.id,
      rotationMoyenne: Number(stats._avg.rotationMensuelle) || 0,
      rotationMax: Number(stats._max.rotationMensuelle) || 0,
      derniereMaj: stats._max.derniereMAJ
    };
  }
}

// Test de la normalisation
export function testNormalization() {
  const testCases = [
    '10002066033313000981360', // Ton cas problématique
    '34009 3609664 60',        
    '0340093930780023',        
    '8001841491110',           // Signalement
    '800184149111035',         // Rotation correspondante
  ];

  console.log('🧪 TESTS NORMALISATION EAN13:');
  testCases.forEach(code => {
    const normalized = normalizeEan13(code);
    console.log(`"${code}" → "${normalized}"`);
  });
}