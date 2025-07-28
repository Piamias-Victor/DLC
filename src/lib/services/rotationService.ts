// src/lib/services/rotationService.ts - Avec normalisation EAN13
import { prisma } from '@/lib/prisma/client';
import type { ProductRotation, RotationImportData, RotationImportResult } from '@/lib/types';

// Fonction de normalisation EAN13
function normalizeEan13(code: string): string {
  if (!code) return code;
  
  // Supprimer les zéros de tête mais garder minimum 8 chiffres
  const cleaned = code.trim().replace(/^0+/, '');
  return cleaned.length >= 8 ? cleaned : code;
}

export class RotationService {
  
  /**
   * Récupère la rotation d'un produit par EAN13 (avec matching intelligent)
   */
  static async getRotationByEan13(ean13: string): Promise<ProductRotation | null> {
    try {
      // 1. Essayer match exact d'abord
      let rotation = await prisma.productRotation.findUnique({
        where: { ean13: ean13.trim() }
      });
      
      if (!rotation) {
        // 2. Essayer match normalisé
        const normalized = normalizeEan13(ean13);
        rotation = await prisma.productRotation.findFirst({
          where: { ean13: normalized }
        });
      }
      
      return rotation;
    } catch (error) {
      console.error('Erreur récupération rotation:', error);
      return null;
    }
  }

  /**
   * Crée ou met à jour une rotation avec normalisation
   */
  static async upsertRotation(ean13: string, rotationMensuelle: number): Promise<ProductRotation> {
    // NORMALISER le code EAN13 avant stockage
    const normalizedEan13 = normalizeEan13(ean13);
    
    console.log(`🔄 Normalisation: "${ean13}" → "${normalizedEan13}"`);
    
    return await prisma.productRotation.upsert({
      where: { ean13: normalizedEan13 },
      update: {
        rotationMensuelle,
        derniereMAJ: new Date(),
        updatedAt: new Date()
      },
      create: {
        ean13: normalizedEan13, // ← CODE NORMALISÉ STOCKÉ
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

        // Validation longueur EAN13
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
        
        // Validation longueur après normalisation
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

        // Vérifier si existe déjà (avec code normalisé)
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
            ean13: normalizedEan13, // ← STOCKAGE NORMALISÉ
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
   * Parse un CSV de rotations avec nettoyage amélioré
   */
  static parseRotationCSV(csvContent: string): RotationImportData[] {
    const lines = csvContent.trim().split('\n');
    const data: RotationImportData[] = [];

    // Ignorer header si présent
    const startIndex = lines[0]?.toLowerCase().includes('ean') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Supporter différents séparateurs
      const separator = line.includes(';') ? ';' : 
                       line.includes('\t') ? '\t' : ',';
      
      const parts = line.split(separator).map(s => s.trim());
      
      if (parts.length >= 2) {
        let ean13 = parts[0].trim();
        const rotationStr = parts[1].trim();
        
        // NETTOYER le code EAN13
        // 1. Supprimer tous les espaces
        ean13 = ean13.replace(/\s+/g, '');
        
        // 2. Garder seulement les chiffres
        ean13 = ean13.replace(/[^0-9]/g, '');
        
        // 3. Tronquer si trop long (> 20 caractères)
        if (ean13.length > 20) {
          ean13 = ean13.substring(0, 13); // Garder les 13 premiers chiffres
        }
        
        console.log(`🧹 Nettoyage: "${parts[0]}" → "${ean13}"`);
        
        if (ean13 && rotationStr) {
          const rotation = parseFloat(rotationStr.replace(',', '.'));
          data.push({
            ean13,
            rotationMensuelle: rotation
          });
        }
      }
    }

    console.log(`📊 CSV parsé: ${data.length} lignes valides sur ${lines.length - startIndex} lignes`);
    return data;
  }

  /**
   * Template CSV mis à jour avec exemples
   */
  static generateTemplate(): string {
    return `ean13,rotationMensuelle
03400930029985,25.5
0012345678901,12.0
1234567890123,8.75
00005555555555,15.0`;
  }

  // ... reste des méthodes inchangées
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

// Tests de la normalisation
export function testNormalization() {
  const testCases = [
    '03400930029985',  // → "3400930029985"
    '0012345678901',   // → "12345678901"  
    '1234567890123',   // → "1234567890123" (inchangé)
    '00000067890123',  // → "67890123"
    '0000000123',      // → "0000000123" (garde si < 8)
  ];

  console.log('🧪 TESTS NORMALISATION EAN13:');
  testCases.forEach(code => {
    const normalized = normalizeEan13(code);
    console.log(`"${code}" → "${normalized}"`);
  });
}