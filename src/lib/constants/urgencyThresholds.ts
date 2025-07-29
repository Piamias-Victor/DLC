// src/lib/constants/urgencyThresholds.ts
export const URGENCY_FINANCIAL_THRESHOLDS = {
  // Seuils de perte financière en euros
  FAIBLE: 20,      // < 50€ = faible
  MOYEN: 50,      // 50€ - 200€ = moyen  
  ELEVE: 100,      // 200€ - 500€ = élevé
  CRITIQUE: 200    // > 500€ = critique
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