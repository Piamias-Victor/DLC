// src/lib/constants/urgencyThresholds.ts
export const URGENCY_FINANCIAL_THRESHOLDS = {
  // Seuils de perte financière en euros
  FAIBLE: 50,      // < 50€ = faible
  MOYEN: 200,      // 50€ - 200€ = moyen  
  ELEVE: 500,      // 200€ - 500€ = élevé
  CRITIQUE: 500    // > 500€ = critique
} as const;

// Fonction pour calculer le niveau d'urgence financière
export function getFinancialUrgencyLevel(perteFinanciere: number): 'low' | 'medium' | 'high' | 'critical' {
  if (perteFinanciere < URGENCY_FINANCIAL_THRESHOLDS.FAIBLE) {
    return 'low';
  } else if (perteFinanciere < URGENCY_FINANCIAL_THRESHOLDS.MOYEN) {
    return 'medium';
  } else if (perteFinanciere < URGENCY_FINANCIAL_THRESHOLDS.ELEVE) {
    return 'high';
  } else {
    return 'critical';
  }
}