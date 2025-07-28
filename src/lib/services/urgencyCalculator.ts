// src/lib/services/urgencyCalculator.ts - Version corrigée avec raw SQL
import { prisma } from '@/lib/prisma/client';
import { RotationService } from './rotationService';
import type { UrgencyCalculation, UrgencyLevel, Signalement } from '@/lib/types';

// Constantes de configuration
const RESPECT_FIFO = 0.65; // 65% de respect du FIFO
const SEUIL_VERIFICATION = 85; // Si >85% de chances d'écoulement = À vérifier
const MOIS_AUTO_VERIFIER = 3; // Auto-vérifier si <3 mois et forte probabilité

export class UrgencyCalculator {
  
  /**
   * Calcule l'urgence avec rotation
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
    
    // Déterminer l'urgence
    const urgence = this.determineUrgencyLevel(
      moisRestants, 
      probabiliteEcoulement, 
      surplus, 
      quantite
    );

    // Auto-vérification si forte probabilité + délai court
    const shouldAutoVerify = probabiliteEcoulement >= SEUIL_VERIFICATION && 
                            moisRestants <= MOIS_AUTO_VERIFIER;
    
    return {
      urgence,
      probabiliteEcoulement: Math.round(probabiliteEcoulement * 100) / 100,
      shouldAutoVerify,
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
      probabiliteEcoulement: 0, // Pas de calcul de probabilité
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
   * Met à jour l'urgence d'un signalement avec requête SQL brute
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
    
    if (rotation) {
      // Calcul avec rotation
      calculation = this.calculateUrgencyWithRotation(
        signalement.quantite,
        signalement.datePeremption,
        Number(rotation.rotationMensuelle)
      );
      
      // Auto-assignation du statut À_VERIFIER
      if (calculation.shouldAutoVerify && signalement.status === 'EN_ATTENTE') {
        newStatus = 'A_VERIFIER';
      }
    } else {
      // Calcul classique
      calculation = this.calculateClassicUrgency(
        signalement.quantite,
        signalement.datePeremption
      );
    }
    
    // Mise à jour en base avec requête SQL brute pour éviter les erreurs de types Prisma
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
    autoVerified: number;
  }> {
    const signalements = await prisma.signalement.findMany({
      where: {
        status: { in: ['EN_ATTENTE', 'EN_COURS'] }
      }
    });

    let processed = 0;
    let withRotation = 0;
    let autoVerified = 0;

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
          
          if (calculation.shouldAutoVerify && signalement.status === 'EN_ATTENTE') {
            newStatus = 'A_VERIFIER';
            autoVerified++;
          }
        } else {
          calculation = this.calculateClassicUrgency(
            signalement.quantite,
            signalement.datePeremption
          );
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

    return { processed, withRotation, autoVerified };
  }

  /**
   * Calcule la différence en mois entre deux dates
   */
  private static calculateMonthsDiff(start: Date, end: Date): number {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return Math.max(0, years * 12 + months);
  }

  /**
   * Détermine le niveau d'urgence selon les critères
   */
  private static determineUrgencyLevel(
    moisRestants: number,
    probabiliteEcoulement: number,
    surplus: number,
    quantiteTotal: number
  ): UrgencyLevel {
    
    // Si très probablement écoulé
    if (probabiliteEcoulement >= SEUIL_VERIFICATION) {
      return moisRestants <= 3 ? 'medium' : 'low';
    }
    
    // Pourcentage de surplus
    const pctSurplus = (surplus / quantiteTotal) * 100;
    
    if (pctSurplus >= 80) {
      // 80%+ restera probablement
      if (moisRestants <= 2) return 'critical';
      if (moisRestants <= 6) return 'high';
      return 'medium';
    } else if (pctSurplus >= 50) {
      // 50%+ restera probablement
      if (moisRestants <= 1) return 'critical';
      if (moisRestants <= 4) return 'high';
      return 'medium';
    } else {
      // Situation normale avec rotation
      if (moisRestants <= 1) return 'high';
      if (moisRestants <= 3) return 'medium';
      return 'low';
    }
  }
}