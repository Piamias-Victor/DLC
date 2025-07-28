// src/lib/services/rotationService.ts
import { prisma } from '@/lib/prisma/client';
import type { ProductRotation, RotationImportData, RotationImportResult } from '@/lib/types';

export class RotationService {
  
  /**
   * Récupère la rotation d'un produit par EAN13
   */
  static async getRotationByEan13(ean13: string): Promise<ProductRotation | null> {
    try {
      return await prisma.productRotation.findUnique({
        where: { ean13: ean13.trim() }
      });
    } catch (error) {
      console.error('Erreur récupération rotation:', error);
      return null;
    }
  }

  /**
   * Crée ou met à jour une rotation
   */
  static async upsertRotation(ean13: string, rotationMensuelle: number): Promise<ProductRotation> {
    return await prisma.productRotation.upsert({
      where: { ean13: ean13.trim() },
      update: {
        rotationMensuelle,
        derniereMAJ: new Date(),
        updatedAt: new Date()
      },
      create: {
        ean13: ean13.trim(),
        rotationMensuelle,
        derniereMAJ: new Date()
      }
    });
  }

  /**
   * Import en masse des rotations depuis CSV
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
        // Validation
        if (!ean13 || ean13.trim().length === 0) {
          result.errors.push({
            line: i + 1,
            ean13: ean13 || '',
            error: 'EAN13 manquant'
          });
          continue;
        }

        if (isNaN(rotationMensuelle) || rotationMensuelle < 0) {
          result.errors.push({
            line: i + 1,
            ean13,
            error: 'Rotation invalide (doit être ≥ 0)'
          });
          continue;
        }

        if (rotationMensuelle > 1000) {
          result.errors.push({
            line: i + 1,
            ean13,
            error: 'Rotation trop élevée (max 1000)'
          });
          continue;
        }

        // Vérifier si existe déjà
        const existing = await this.getRotationByEan13(ean13);
        
        // Upsert
        await this.upsertRotation(ean13, rotationMensuelle);
        
        if (existing) {
          result.updated++;
        } else {
          result.created++;
        }
        
        result.success++;

      } catch (error) {
        console.error(`Erreur import ligne ${i + 1}:`, error);
        result.errors.push({
          line: i + 1,
          ean13,
          error: `Erreur technique: ${error}`
        });
      }
    }

    return result;
  }

  /**
   * Parse un CSV de rotations
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
      
      const [ean13, rotationStr] = line.split(separator).map(s => s.trim());
      
      if (ean13 && rotationStr) {
        const rotation = parseFloat(rotationStr.replace(',', '.'));
        data.push({
          ean13,
          rotationMensuelle: rotation
        });
      }
    }

    return data;
  }

  /**
   * Récupère toutes les rotations
   */
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

  /**
   * Supprime une rotation
   */
  static async deleteRotation(id: string): Promise<void> {
    await prisma.productRotation.delete({
      where: { id }
    });
  }

  /**
   * Récupère les statistiques des rotations
   */
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