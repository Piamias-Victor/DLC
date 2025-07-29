// src/lib/services/rotationService.ts - PARSING CSV AVEC PRIX
import { prisma } from '@/lib/prisma/client';
import type { ProductRotation, RotationImportData, RotationImportResult } from '@/lib/types';

// Fonction de normalisation EAN13 (inchangée)
function normalizeEan13(code: string): string {
  if (!code) return code;
  let cleaned = code.trim().replace(/[^0-9]/g, '');
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 13);
  }
  const withoutLeadingZeros = cleaned.replace(/^0+/, '');
  const result = withoutLeadingZeros.length >= 8 ? withoutLeadingZeros : cleaned;
  console.log(`🔄 Normalisation: "${code}" → "${result}"`);
  return result;
}

export class RotationService {
  
  /**
   * 🆕 Upsert rotation AVEC prix
   */
  static async upsertRotation(
    ean13: string, 
    rotationMensuelle: number, 
    prixAchatUnitaire?: number
  ): Promise<ProductRotation> {
    const normalizedEan13 = normalizeEan13(ean13);
    
    console.log(`🔄 Upsert rotation: "${ean13}" → "${normalizedEan13}" (${rotationMensuelle}) prix: ${prixAchatUnitaire || 'N/A'}€`);
    
    const updateData: any = {
      rotationMensuelle,
      derniereMAJ: new Date(),
      updatedAt: new Date()
    };
    
    // Ajouter le prix seulement s'il est fourni
    if (prixAchatUnitaire !== undefined) {
      updateData.prixAchatUnitaire = prixAchatUnitaire;
    }
    
    const createData: any = {
      ean13: normalizedEan13,
      rotationMensuelle,
      derniereMAJ: new Date()
    };
    
    if (prixAchatUnitaire !== undefined) {
      createData.prixAchatUnitaire = prixAchatUnitaire;
    }
    
    return await prisma.productRotation.upsert({
      where: { ean13: normalizedEan13 },
      update: updateData,
      create: createData
    });
  }

  /**
   * 🆕 Import rotations AVEC prix
   */
  static async importRotations(data: RotationImportData[]): Promise<RotationImportResult & { withPrice: number; withoutPrice: number }> {
    const result: RotationImportResult & { withPrice: number; withoutPrice: number } = {
      success: 0,
      errors: [],
      updated: 0,
      created: 0,
      withPrice: 0,
      withoutPrice: 0
    };

    console.log(`📁 Import démarré: ${data.length} rotations à traiter`);

    for (let i = 0; i < data.length; i++) {
      const { ean13, rotationMensuelle, prixAchatUnitaire } = data[i];
      
      try {
        // Validation EAN13
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

        // 🆕 Validation prix (optionnel)
        if (prixAchatUnitaire !== undefined) {
          if (isNaN(prixAchatUnitaire) || prixAchatUnitaire < 0) {
            result.errors.push({
              line: i + 1,
              ean13: ean13,
              error: 'Prix d\'achat invalide (doit être ≥ 0)'
            });
            continue;
          }

          if (prixAchatUnitaire > 9999.99) {
            result.errors.push({
              line: i + 1,
              ean13: ean13,
              error: 'Prix d\'achat trop élevé (max 9999.99€)'
            });
            continue;
          }
          
          result.withPrice++;
        } else {
          result.withoutPrice++;
        }

        // Vérifier si existe déjà
        const existing = await prisma.productRotation.findUnique({
          where: { ean13: normalizedEan13 }
        });
        
        // Upsert avec ou sans prix
        await this.upsertRotation(normalizedEan13, rotationMensuelle, prixAchatUnitaire);
        
        if (existing) {
          result.updated++;
          console.log(`📝 Updated: "${ean13}" → "${normalizedEan13}" (${rotationMensuelle}) prix: ${prixAchatUnitaire || 'N/A'}€`);
        } else {
          result.created++;
          console.log(`✅ Created: "${ean13}" → "${normalizedEan13}" (${rotationMensuelle}) prix: ${prixAchatUnitaire || 'N/A'}€`);
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

    console.log(`🎯 Import terminé: ${result.success} succès, ${result.errors.length} erreurs, ${result.withPrice} avec prix, ${result.withoutPrice} sans prix`);
    return result;
  }

  /**
   * 🆕 Parse CSV AVEC PRIX (3 colonnes) OU SANS PRIX (2 colonnes)
   */
  static parseRotationCSV(csvContent: string): RotationImportData[] {
    const normalizedContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.trim().split('\n');
    const data: RotationImportData[] = [];

    console.log(`📁 Parsing CSV: ${lines.length} lignes détectées`);
    console.log(`🔍 Première ligne: "${lines[0]}"`);

    // Détecter et ignorer le header
    let startIndex = 0;
    const firstLine = lines[0].trim().toLowerCase();
    if (firstLine.includes('ean') || firstLine.includes('rotation') || firstLine.includes('prix')) {
      startIndex = 1;
      console.log('📋 Header détecté et ignoré');
    }

    // 🆕 Détecter le format (2 ou 3 colonnes)
    let hasPrice = false;
    if (lines.length > startIndex) {
      const sampleLine = lines[startIndex];
      const columns = sampleLine.split(',').length;
      hasPrice = columns >= 3;
      console.log(`🔍 Format détecté: ${columns} colonnes, prix: ${hasPrice ? 'OUI' : 'NON'}`);
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      console.log(`📝 Ligne ${i + 1}: "${line}"`);

      try {
        // 🆕 Parser selon le format détecté
        const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
        
        if (parts.length < 2) {
          console.warn(`⚠️ Ligne ${i + 1} format invalide: "${line}"`);
          continue;
        }

        // Extraire EAN13 et rotation
        let ean13 = parts[0].replace(/\s+/g, '').replace(/[^0-9]/g, '');
        const rotationStr = parts[1].replace(',', '.');
        const rotation = parseFloat(rotationStr);

        // 🆕 Extraire prix si présent
        let prixAchat: number | undefined = undefined;
        if (hasPrice && parts.length >= 3 && parts[2] && parts[2].trim() !== '') {
          const prixStr = parts[2].replace(',', '.');
          const prix = parseFloat(prixStr);
          if (!isNaN(prix)) {
            prixAchat = prix;
          }
        }

        console.log(`🧹 Parsed: EAN="${ean13}" Rotation=${rotation} Prix=${prixAchat || 'N/A'}€`);

        // Validations basiques
        if (!ean13 || ean13.length < 8) {
          console.warn(`⚠️ Ligne ${i + 1}: EAN13 trop court "${ean13}"`);
          continue;
        }

        if (isNaN(rotation) || rotation < 0) {
          console.warn(`⚠️ Ligne ${i + 1}: Rotation invalide "${rotationStr}" → ${rotation}`);
          continue;
        }

        if (prixAchat !== undefined && (isNaN(prixAchat) || prixAchat < 0)) {
          console.warn(`⚠️ Ligne ${i + 1}: Prix invalide "${parts[2]}" → ${prixAchat}`);
          prixAchat = undefined; // Ignorer le prix invalide mais garder la rotation
        }

        // 🆕 Ajouter avec ou sans prix
        const importItem: RotationImportData = {
          ean13,
          rotationMensuelle: rotation
        };
        
        if (prixAchat !== undefined) {
          importItem.prixAchatUnitaire = prixAchat;
        }
        
        data.push(importItem);
        console.log(`✅ Ajouté: EAN="${ean13}" Rotation=${rotation} Prix=${prixAchat || 'N/A'}€`);

      } catch (error) {
        console.error(`❌ Erreur ligne ${i + 1}: "${line}"`, error);
        continue;
      }
    }

    console.log(`🎯 Parsing terminé: ${data.length} rotations valides sur ${lines.length - startIndex} lignes`);
    
    // Stats pour debug
    const withPrice = data.filter(item => item.prixAchatUnitaire !== undefined).length;
    const withoutPrice = data.length - withPrice;
    console.log(`💰 Répartition: ${withPrice} avec prix, ${withoutPrice} sans prix`);

    return data;
  }

  /**
   * 🆕 Template CSV mis à jour avec prix
   */
  static generateTemplate(): string {
    return `ean13,rotationMensuelle,prixAchatUnitaire
3400930029985,25.5,12.45
12345678901,12.0,8.90
1234567890123,8.75,15.25
5555555555,15.0,6.50`;
  }

  // 🔍 Méthodes existantes inchangées (getRotationByEan13, getAllRotations, etc.)
  static async getRotationByEan13(ean13: string): Promise<ProductRotation | null> {
    // Code existant inchangé...
    try {
      console.log(`🔍 Recherche rotation pour: "${ean13}"`);
      
      let rotation = await prisma.productRotation.findUnique({
        where: { ean13: ean13.trim() }
      });
      
      if (rotation) {
        console.log(`✅ Match exact trouvé: ${rotation.ean13} → ${rotation.rotationMensuelle}`);
        return rotation;
      }
      
      const normalized = normalizeEan13(ean13);
      rotation = await prisma.productRotation.findFirst({
        where: { ean13: normalized }
      });
      
      if (rotation) {
        console.log(`✅ Match normalisé: ${ean13} → ${rotation.ean13} → ${rotation.rotationMensuelle}`);
        return rotation;
      }
      
      console.log(`❌ Aucune rotation trouvée pour: "${ean13}"`);
      return null;
    } catch (error) {
      console.error('Erreur récupération rotation:', error);
      return null;
    }
  }

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
    // 🆕 Stats prix
    avecPrix: number;
    sansPrix: number;
    prixMoyen: number;
  }> {
    const [stats, statsPrice] = await Promise.all([
      prisma.productRotation.aggregate({
        _count: { id: true },
        _avg: { rotationMensuelle: true },
        _max: { rotationMensuelle: true, derniereMAJ: true }
      }),
      prisma.productRotation.aggregate({
        _count: { 
          prixAchatUnitaire: true // Compte seulement les non-null
        },
        _avg: { prixAchatUnitaire: true }
      })
    ]);

    return {
      total: stats._count.id,
      rotationMoyenne: Number(stats._avg.rotationMensuelle) || 0,
      rotationMax: Number(stats._max.rotationMensuelle) || 0,
      derniereMaj: stats._max.derniereMAJ,
      // 🆕 Stats prix
      avecPrix: statsPrice._count.prixAchatUnitaire || 0,
      sansPrix: stats._count.id - (statsPrice._count.prixAchatUnitaire || 0),
      prixMoyen: Number(statsPrice._avg.prixAchatUnitaire) || 0
    };
  }
}