// src/lib/utils/perteFinanciere.ts
import type { SignalementWithRotation } from '@/lib/types';

const RESPECT_FIFO = 0.65; // 65% de respect du FIFO

export interface PerteFinanciereCalculee {
  quantitePerdue: number;
  montantPerte: number;
  niveauPerte: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Calcule la perte financière d'un signalement
 */
export function calculerPerteFinanciere(signalement: SignalementWithRotation): PerteFinanciereCalculee | null {
  // Vérifier qu'on a les données nécessaires
  if (!signalement.rotation?.prixAchatUnitaire) {
    return null;
  }

  const aujourdhui = new Date();
  const datePeremption = new Date(signalement.datePeremption);
  const moisRestants = calculateMonthsDiff(aujourdhui, datePeremption);
  
  // Calcul identique à UrgencyCalculator
  const rotationMensuelle = Number(signalement.rotation.rotationMensuelle);
  const quantiteTheorique = rotationMensuelle * moisRestants;
  const quantiteAvecFifo = quantiteTheorique * RESPECT_FIFO;
  
  // Quantité qui va rester = perte réelle
  const quantitePerdue = Math.max(0, signalement.quantite - quantiteAvecFifo);
  
  // Montant de la perte
  const prixUnitaire = Number(signalement.rotation.prixAchatUnitaire);
  const montantPerte = quantitePerdue * prixUnitaire;
  
  // Niveau de perte selon les seuils
  let niveauPerte: 'low' | 'medium' | 'high' | 'critical';
  if (montantPerte < 50) {
    niveauPerte = 'low';
  } else if (montantPerte < 200) {
    niveauPerte = 'medium';
  } else if (montantPerte < 500) {
    niveauPerte = 'high';
  } else {
    niveauPerte = 'critical';
  }
  
  return {
    quantitePerdue: Math.round(quantitePerdue * 100) / 100,
    montantPerte: Math.round(montantPerte * 100) / 100,
    niveauPerte
  };
}

/**
 * Calcule la différence en mois entre deux dates
 */
function calculateMonthsDiff(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return Math.max(0, years * 12 + months);
}

/**
 * Formate le montant pour affichage
 */
export function formaterMontantPerte(montant: number): string {
  if (montant === 0) return '0€';
  if (montant < 1) return `${(montant * 100).toFixed(0)}c`;
  if (montant < 100) return `${montant.toFixed(1)}€`;
  return `${Math.round(montant)}€`;
}

/**
 * Retourne la couleur selon le niveau de perte
 */
export function getCouleurPerte(niveauPerte: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (niveauPerte) {
    case 'low': return 'text-green-700';
    case 'medium': return 'text-yellow-700';
    case 'high': return 'text-orange-700';
    case 'critical': return 'text-red-700';
    default: return 'text-gray-500';
  }
}