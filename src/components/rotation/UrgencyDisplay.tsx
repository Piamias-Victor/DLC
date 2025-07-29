// src/components/rotation/UrgencyDisplay.tsx - Avec support ECOULEMENT
import { Info, TrendingUp, AlertTriangle, Droplets } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import type { UrgencyLevel, SignalementWithRotation } from '@/lib/types';

interface UrgencyDisplayProps {
  urgenceCalculee?: UrgencyLevel | null;
  probabiliteEcoulement?: number | null;
  showDetails?: boolean;
  className?: string;
}

export function UrgencyDisplay({ 
  urgenceCalculee, 
  probabiliteEcoulement, 
  showDetails = false,
  className = '' 
}: UrgencyDisplayProps) {
  
  if (!urgenceCalculee) {
    return (
      <Badge variant="default" size="sm" className={className}>
        Non calculée
      </Badge>
    );
  }

  const urgencyConfig = {
    low: { variant: 'success' as const, label: 'Faible', color: 'text-green-600', icon: Info },
    medium: { variant: 'warning' as const, label: 'Moyen', color: 'text-orange-600', icon: AlertTriangle },
    high: { variant: 'error' as const, label: 'Élevé', color: 'text-red-600', icon: AlertTriangle },
    critical: { variant: 'error' as const, label: 'Critique', color: 'text-red-700', icon: AlertTriangle },
    ecoulement: { variant: 'success' as const, label: 'Écoulement', color: 'text-cyan-700', icon: Droplets }
  };

  const config = urgencyConfig[urgenceCalculee];

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <config.icon className="w-3 h-3" />
        <Badge variant={config.variant} size="sm">
          {config.label}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <config.icon className="w-4 h-4" />
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
        </div>
        
        {probabiliteEcoulement !== null && probabiliteEcoulement !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">
              {probabiliteEcoulement.toFixed(1)}% écoulé
            </span>
          </div>
        )}
      </div>

      {probabiliteEcoulement !== null && probabiliteEcoulement !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              urgenceCalculee === 'ecoulement' ? 'bg-cyan-500' :
              probabiliteEcoulement >= 85 ? 'bg-green-500' :
              probabiliteEcoulement >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, probabiliteEcoulement)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface RotationInfoProps {
  rotation?: number | null;
  className?: string;
}

export function RotationInfo({ rotation, className = '' }: RotationInfoProps) {
  if (!rotation) {
    return (
      <div className={`flex items-center gap-1 text-xs text-gray-500 ${className}`}>
        <AlertTriangle className="w-3 h-3" />
        <span>Pas de rotation</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-blue-600 ${className}`}>
      <TrendingUp className="w-3 h-3" />
      <span>{rotation}/mois</span>
    </div>
  );
}

interface UrgencyTooltipProps {
  signalement: SignalementWithRotation;
  rotation?: number | null;
}

export function UrgencyTooltip({ signalement, rotation }: UrgencyTooltipProps) {
  const hasRotation = rotation !== null && rotation !== undefined;
  
  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-xs max-w-xs">
      <div className="space-y-2">
        <div className="font-medium text-gray-900">
          Calcul d&apos;urgence {hasRotation ? 'avec rotation' : 'classique'}
        </div>
        
        <div className="space-y-1 text-gray-600">
          <div>Quantité: {signalement.quantite}</div>
          <div>
            Péremption: {new Date(signalement.datePeremption).toLocaleDateString('fr-FR')}
          </div>
          
          {hasRotation && (
            <>
              <div>Rotation: {rotation}/mois</div>
              {signalement.probabiliteEcoulement && (
                <div>Prob. écoulement: {Number(signalement.probabiliteEcoulement)}%</div>
              )}
            </>
          )}
          
          {signalement.urgenceCalculee === 'ecoulement' && (
            <div className="text-cyan-700 font-medium">
              ✨ Écoulement naturel garanti
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <UrgencyDisplay 
            urgenceCalculee={signalement.urgenceCalculee as UrgencyLevel}
            probabiliteEcoulement={signalement.probabiliteEcoulement ? Number(signalement.probabiliteEcoulement) : null}
            showDetails={true}
          />
        </div>
      </div>
    </div>
  );
}