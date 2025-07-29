// src/components/signalement/UrgencyComponents.tsx - Avec support ECOULEMENT
import { Droplets, AlertTriangle, Info } from 'lucide-react';

interface UrgencyIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical' | 'ecoulement';
}

export function UrgencyIndicator({ level }: UrgencyIndicatorProps) {
  const configs = {
    low: { 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      label: 'Faible',
      icon: Info
    },
    medium: { 
      color: 'text-orange-600', 
      bg: 'bg-orange-100', 
      label: 'Moyen',
      icon: AlertTriangle 
    },
    high: { 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      label: 'Élevé',
      icon: AlertTriangle 
    },
    critical: { 
      color: 'text-red-700', 
      bg: 'bg-red-200', 
      label: 'Critique',
      icon: AlertTriangle 
    },
    ecoulement: { 
      color: 'text-cyan-700', 
      bg: 'bg-cyan-100', 
      label: 'Écoulement',
      icon: Droplets 
    }
  };
  
  const config = configs[level];
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg} ${config.color} text-xs font-medium`}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}

export function UrgencyText({ level }: UrgencyIndicatorProps) {
  const labels = {
    low: 'faible',
    medium: 'moyenne', 
    high: 'élevée',
    critical: 'critique',
    ecoulement: 'écoulement naturel'
  };
  
  return <span className="font-medium">{labels[level]}</span>;
}