// src/components/dashboard/UrgencyBadge.tsx
import { Badge } from '../atoms/Badge';

interface UrgencyBadgeProps {
  datePeremption: string | Date;
  quantite: number;
}

function getUrgency(datePeremption: string | Date, quantite: number): 'low' | 'medium' | 'high' | 'critical' {
  const today = new Date();
  const expDate = new Date(datePeremption);
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) return 'critical';
  if (quantite >= 50 && diffDays <= 120) return 'critical';
  if (diffDays > 30 && diffDays <= 75) {
    if (quantite >= 10) return 'high';
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  if (diffDays > 75 && diffDays <= 180) {
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  return 'low';
}

export function UrgencyBadge({ datePeremption, quantite }: UrgencyBadgeProps) {
  const level = getUrgency(datePeremption, quantite);
  
  const configs = {
    low: { variant: 'success' as const, label: 'Faible' },
    medium: { variant: 'warning' as const, label: 'Moyen' },
    high: { variant: 'error' as const, label: 'Élevé' },
    critical: { variant: 'error' as const, label: 'Critique' }
  };
  
  const config = configs[level];
  
  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}