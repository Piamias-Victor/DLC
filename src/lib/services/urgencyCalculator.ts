// src/lib/services/urgencyCalculator.ts - Logique ULTRA-NUANCÉE
import { prisma } from '@/lib/prisma/client';
import { RotationService } from './rotationService';
import type { UrgencyCalculation, UrgencyLevel, Signalement } from '@/lib/types';

const RESPECT_FIFO = 0.65; // 65% de respect du FIFO

export class UrgencyCalculator {
  
  /**
   * Calcule l'urgence avec rotation - LOGIQUE ULTRA-NUANCÉE
   */
  static calculateUrgencyWithRotation(
    quantite: number,
    datePeremption: Date,
    rotationMensuelle: number
  ): UrgencyCalculation {
    
    const aujourdhui = new Date();
    const moisRestants = this.calculateMonthsDiff(aujourdhui, datePeremption);
    
    // Quantité théoriquement vendue
    const quantiteTheorique = rotationMensuelle * moisRestants;
    const quantiteAvecFifo = quantiteTheorique * RESPECT_FIFO;
    const probabiliteEcoulement = Math.min(100, (quantiteAvecFifo / quantite) * 100);
    
    // 🔥 LOGIQUE INDULGENTE AJUSTÉE
    let urgence: UrgencyLevel;
    
    // RÈGLE 1: 100% d'écoulement = ÉCOULEMENT
    if (probabiliteEcoulement >= 100) {
      urgence = 'ecoulement';
    }
    // RÈGLE 2: Très proche (< 1 mois) mais plus indulgent
    else if (moisRestants < 1) {
      if (probabiliteEcoulement >= 50) {
        urgence = 'low';        // 50%+ = faible même si proche
      } else if (probabiliteEcoulement >= 30) {
        urgence = 'medium';     // 30-50% = moyen
      } else if (probabiliteEcoulement >= 15) {
        urgence = 'high';       // 15-30% = élevé
      } else {
        urgence = 'critical';   // < 15% = critique
      }
    }
    // RÈGLE 3: Temps suffisant = très indulgent
    else {
      // Seuils quantité ajustés
      const isVerySmall = quantite <= 3;    // Très petite quantité
      const isSmall = quantite > 3 && quantite <= 10;
      const isMedium = quantite > 10 && quantite <= 25;
      const isLarge = quantite > 25;
      
      // Logique ultra-indulgente
      if (probabiliteEcoulement >= 70) {
        urgence = 'low';        // 70%+ = toujours faible
      } else if (probabiliteEcoulement >= 50) {
        urgence = isLarge ? 'medium' : 'low';  // 50-70% = faible ou moyen
      } else if (probabiliteEcoulement >= 30) {
        // 30-50% = indulgent selon quantité
        if (isVerySmall) {
          urgence = 'low';      // ≤3 unités = faible
        } else if (isSmall) {
          urgence = 'medium';   // 4-10 unités = moyen
        } else {
          urgence = 'high';     // >10 unités = élevé
        }
      } else if (probabiliteEcoulement >= 15) {
        // 15-30% = moyennement sévère
        if (isVerySmall) {
          urgence = 'medium';   // ≤3 unités = moyen
        } else if (isSmall) {
          urgence = 'high';     // 4-10 unités = élevé
        } else {
          urgence = 'critical'; // >10 unités = critique
        }
      } else {
        // < 15% = plus sévère mais pas trop
        if (isVerySmall) {
          urgence = 'medium';   // ≤3 unités = moyen quand même
        } else if (isSmall) {
          urgence = 'high';     // 4-10 unités = élevé
        } else {
          urgence = 'critical'; // >10 unités = critique
        }
      }
    }
    
    return {
      urgence,
      probabiliteEcoulement: Math.round(probabiliteEcoulement * 100) / 100,
      shouldAutoVerify: false,
      reasoning: {
        moisRestants,
        quantiteTheorique: Math.round(quantiteTheorique),
        quantiteAvecFifo: Math.round(quantiteAvecFifo),
        surplus: Math.round(Math.max(0, quantite - quantiteAvecFifo))
      }
    };
  }

  /**
   * Calcule l'urgence classique (sans rotation) - ÉGALEMENT NUANCÉE
   */
  static calculateClassicUrgency(
    quantite: number,
    datePeremption: Date
  ): UrgencyCalculation {
    
    const aujourdhui = new Date();
    const joursRestants = Math.ceil((datePeremption.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgence: UrgencyLevel;
    
    // Facteur quantité pour nuancer
    const isSmallQuantity = quantite <= 5;
    const isMediumQuantity = quantite > 5 && quantite <= 15;
    
    // 🔥 LOGIQUE CLASSIQUE TRÈS INDULGENTE
    if (joursRestants <= 30) {
      // Très proche - plus indulgent
      if (isSmallQuantity) {
        urgence = 'medium';     // ≤5 unités = moyen même proche
      } else if (isMediumQuantity) {
        urgence = 'high';       // 6-15 unités = élevé
      } else {
        urgence = 'critical';   // >15 unités = critique
      }
    } else if (joursRestants <= 75) {
      // Assez proche - très indulgent
      if (isSmallQuantity) {
        urgence = 'low';        // ≤5 unités = faible
      } else if (isMediumQuantity) {
        urgence = 'medium';     // 6-15 unités = moyen
      } else {
        urgence = 'high';       // >15 unités = élevé
      }
    } else if (joursRestants <= 150) {
      // Moyennement éloigné - ultra-indulgent
      if (quantite <= 10) {
        urgence = 'low';        // ≤10 unités = faible
      } else {
        urgence = 'medium';     // >10 unités = moyen
      }
    } else {
      // Loin dans le temps - toujours indulgent
      urgence = quantite >= 50 ? 'medium' : 'low';
    }
    
    return {
      urgence,
      probabiliteEcoulement: 0,
      shouldAutoVerify: false,
      reasoning: {
        moisRestants: Math.ceil(joursRestants / 30),
        quantiteTheorique: 0,
        quantiteAvecFifo: 0,
        surplus: quantite
      }
    };
  }

  /**
   * Met à jour l'urgence d'un signalement - LOGIQUE À_VERIFIER NUANCÉE
   */
  static async updateSignalementUrgency(signalementId: string): Promise<void> {
    const signalement = await prisma.signalement.findUnique({
      where: { id: signalementId }
    });
    
    if (!signalement) {
      throw new Error('Signalement non trouvé');
    }
    
    const rotation = await RotationService.getRotationByEan13(signalement.codeBarres);
    
    let calculation: UrgencyCalculation;
    let newStatus = signalement.status;
    
    // Calculer urgence
    if (rotation) {
      calculation = this.calculateUrgencyWithRotation(
        signalement.quantite,
        signalement.datePeremption,
        Number(rotation.rotationMensuelle)
      );
    } else {
      calculation = this.calculateClassicUrgency(
        signalement.quantite,
        signalement.datePeremption
      );
    }
    
    // 🔥 LOGIQUE À_VERIFIER NUANCÉE
    const aujourdhui = new Date();
    const moisRestants = this.calculateMonthsDiff(aujourdhui, signalement.datePeremption);
    
    // PRIORITÉ 1: Si 100% d'écoulement → ECOULEMENT
    if (calculation.probabiliteEcoulement >= 100) {
      newStatus = 'ECOULEMENT' as any;
    } 
    // PRIORITÉ 2: À_VERIFIER seulement si vraiment critique ET proche
    else if (moisRestants < 1 && 
             calculation.urgence === 'critical' && 
             signalement.status === 'EN_ATTENTE') {
      newStatus = 'A_VERIFIER' as any;
    }
    // PRIORITÉ 3: Pas de changement automatique pour les autres cas
    
    console.log(`🎯 Signalement ${signalementId}:`, {
      codeBarres: signalement.codeBarres,
      quantite: signalement.quantite,
      moisRestants,
      rotation: rotation ? Number(rotation.rotationMensuelle) : null,
      probabiliteEcoulement: calculation.probabiliteEcoulement,
      urgenceAvant: signalement.urgenceCalculee,
      urgenceApres: calculation.urgence,
      statusAvant: signalement.status,
      statusApres: newStatus,
      raison: calculation.probabiliteEcoulement >= 100 ? 'ECOULEMENT_100%' : 
             (moisRestants < 1 && calculation.urgence === 'critical' && signalement.status === 'EN_ATTENTE') ? 'A_VERIFIER_CRITIQUE' : 'INCHANGE'
    });
    
    // Mise à jour en base
    await prisma.$executeRaw`
      UPDATE signalements 
      SET 
        "urgenceCalculee" = ${calculation.urgence}::text,
        "probabiliteEcoulement" = ${calculation.probabiliteEcoulement}::decimal(5,2),
        "status" = ${newStatus}::"SignalementStatus",
        "updatedAt" = NOW()
      WHERE id = ${signalementId}
    `;
  }

  /**
   * Recalcule toutes les urgences
   */
  static async recalculateAllUrgencies(): Promise<{
    processed: number;
    withRotation: number;
    ecoulement: number;
    aVerifier: number;
  }> {
    const signalements = await prisma.signalement.findMany({
      where: { status: { not: 'DETRUIT' } }
    });

    let processed = 0;
    let withRotation = 0;
    let ecoulement = 0;
    let aVerifier = 0;

    console.log(`🔄 Recalcul ULTRA-INDULGENT démarré: ${signalements.length} signalements`);

    for (const signalement of signalements) {
      try {
        await this.updateSignalementUrgency(signalement.id);
        
        // Compter les stats
        const updated = await prisma.signalement.findUnique({
          where: { id: signalement.id }
        });
        
        if (updated) {
          if (updated.status === ('ECOULEMENT' as any)) ecoulement++;
          if (updated.status === ('A_VERIFIER' as any)) aVerifier++;
        }
        
        // Vérifier si rotation
        const rotation = await RotationService.getRotationByEan13(signalement.codeBarres);
        if (rotation) withRotation++;
        
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`⏳ Progression: ${processed}/${signalements.length}`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur signalement ${signalement.id}:`, error);
      }
    }

    console.log(`✅ Recalcul ULTRA-INDULGENT terminé:`, {
      processed,
      withRotation,
      ecoulement,
      aVerifier,
      distribution: {
        ecoulement: ((ecoulement / processed) * 100).toFixed(1) + '%',
        aVerifier: ((aVerifier / processed) * 100).toFixed(1) + '%'
      }
    });
    
    return { processed, withRotation, ecoulement, aVerifier };
  }

  /**
   * Calcule la différence en mois entre deux dates
   */
  private static calculateMonthsDiff(start: Date, end: Date): number {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return Math.max(0, years * 12 + months);
  }
}