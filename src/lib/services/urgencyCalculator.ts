// src/lib/services/urgencyCalculator.ts - Nouvelle logique simple et claire
import { prisma } from '@/lib/prisma/client';
import { RotationService } from './rotationService';
import type { UrgencyCalculation, UrgencyLevel, Signalement } from '@/lib/types';

// Constantes de configuration
const RESPECT_FIFO = 0.65; // 65% de respect du FIFO

export class UrgencyCalculator {
  
  /**
   * Calcule l'urgence avec rotation - NOUVELLE LOGIQUE SIMPLIFIÉE
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
    
    // Quantité réellement écoulée avec FIFO imparfait  
    const quantiteAvecFifo = quantiteTheorique * RESPECT_FIFO;
    
    // Surplus qui restera probablement
    const surplus = Math.max(0, quantite - quantiteAvecFifo);
    
    // Probabilité d'écoulement (%)
    const probabiliteEcoulement = Math.min(100, (quantiteAvecFifo / quantite) * 100);
    
    // NOUVELLE LOGIQUE ULTRA-SIMPLE
    let urgence: UrgencyLevel;
    
    if (probabiliteEcoulement >= 100) {
      urgence = 'ecoulement';  // 100% = écoulement certain
    } else if (moisRestants < 1) {
      urgence = 'critical';    // < 1 mois = critique peu importe la rotation
    } else if (probabiliteEcoulement >= 85) {
      urgence = 'low';         // 85-99% = faible
    } else if (probabiliteEcoulement >= 70) {
      urgence = 'medium';      // 70-85% = moyen  
    } else if (probabiliteEcoulement >= 50) {
      urgence = 'high';        // 50-70% = élevé
    } else {
      urgence = 'critical';    // < 50% = critique
    }
    
    return {
      urgence,
      probabiliteEcoulement: Math.round(probabiliteEcoulement * 100) / 100,
      shouldAutoVerify: false, // Pas utilisé dans la nouvelle logique
      reasoning: {
        moisRestants,
        quantiteTheorique: Math.round(quantiteTheorique),
        quantiteAvecFifo: Math.round(quantiteAvecFifo),
        surplus: Math.round(surplus)
      }
    };
  }

  /**
   * Calcule l'urgence classique (sans rotation)
   */
  static calculateClassicUrgency(
    quantite: number,
    datePeremption: Date
  ): UrgencyCalculation {
    
    const aujourdhui = new Date();
    const joursRestants = Math.ceil((datePeremption.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgence: UrgencyLevel;
    
    if (joursRestants <= 30) {
      urgence = 'critical';
    } else if (joursRestants <= 75) {
      urgence = quantite >= 10 ? 'high' : quantite >= 5 ? 'medium' : 'low';
    } else if (joursRestants <= 180) {
      urgence = quantite >= 5 ? 'medium' : 'low';
    } else {
      urgence = 'low';
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
   * Met à jour l'urgence d'un signalement - NOUVELLE LOGIQUE STATUT
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
    
    // NOUVELLE LOGIQUE D'ASSIGNATION DE STATUT - TA DEMANDE
    if (signalement.status === 'EN_ATTENTE') {
      
      const aujourdhui = new Date();
      const moisRestants = this.calculateMonthsDiff(aujourdhui, signalement.datePeremption);
      
      if (calculation.probabiliteEcoulement >= 100) {
        newStatus = 'ECOULEMENT';   // 100% d'écoulement = ECOULEMENT
      } else if (moisRestants < 1) {
        newStatus = 'A_VERIFIER';   // < 1 mois = À VÉRIFIER
      }
      // Sinon reste EN_ATTENTE
    }
    
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
      where: {
        status: { in: ['EN_ATTENTE', 'EN_COURS'] }
      }
    });

    let processed = 0;
    let withRotation = 0;
    let ecoulement = 0;
    let aVerifier = 0;

    for (const signalement of signalements) {
      try {
        const rotation = await RotationService.getRotationByEan13(signalement.codeBarres);
        
        let calculation: UrgencyCalculation;
        let newStatus = signalement.status;
        
        if (rotation) {
          withRotation++;
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
        
        // NOUVELLE LOGIQUE D'ASSIGNATION DE STATUT
        if (signalement.status === 'EN_ATTENTE') {
          const aujourdhui = new Date();
          const moisRestants = this.calculateMonthsDiff(aujourdhui, signalement.datePeremption);
          
          if (calculation.probabiliteEcoulement >= 100) {
            newStatus = 'ECOULEMENT';
            ecoulement++;
          } else if (moisRestants < 1) {
            newStatus = 'A_VERIFIER';
            aVerifier++;
          }
        }
        
        // Mise à jour avec requête SQL brute
        await prisma.$executeRaw`
          UPDATE signalements 
          SET 
            "urgenceCalculee" = ${calculation.urgence}::text,
            "probabiliteEcoulement" = ${calculation.probabiliteEcoulement}::decimal(5,2),
            "status" = ${newStatus}::"SignalementStatus",
            "updatedAt" = NOW()
          WHERE id = ${signalement.id}
        `;
        
        processed++;
      } catch (error) {
        console.error(`Erreur recalcul signalement ${signalement.id}:`, error);
      }
    }

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