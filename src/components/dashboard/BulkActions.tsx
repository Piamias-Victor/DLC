// src/components/dashboard/BulkActions.tsx - Avec ECOULEMENT
import { Users, Settings, X, Droplets } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardContent } from '../atoms/Card';
import { STATUS_CONFIG } from '@/lib/constants/status';
import type { SignalementStatus } from '@/lib/types';

interface BulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: SignalementStatus) => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

export function BulkActions({ 
  selectedCount, 
  onBulkAction, 
  onClearSelection,
  isLoading 
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  // Fonction pour obtenir les styles du bouton selon le statut
  const getButtonStyles = (status: SignalementStatus) => {
    const baseClasses = "flex items-center gap-2";
    
    switch (status) {
      case 'EN_ATTENTE':
        return `${baseClasses} border-gray-300 text-gray-700 hover:bg-gray-50`;
      case 'EN_COURS':
        return `${baseClasses} border-blue-300 text-blue-700 hover:bg-blue-50`;
      case 'A_DESTOCKER':
        return `${baseClasses} border-orange-300 text-orange-700 hover:bg-orange-50`;
      case 'A_VERIFIER':
        return `${baseClasses} border-orange-300 text-orange-700 hover:bg-orange-50`;
      case 'ECOULEMENT':
        return `${baseClasses} border-cyan-300 text-cyan-700 hover:bg-cyan-50`;
      case 'DETRUIT':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white border-red-600`;
      default:
        return baseClasses;
    }
  };

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (status: SignalementStatus) => {
    switch (status) {
      case 'ECOULEMENT':
        return <Droplets className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          
          {/* Left side - Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {selectedCount} signalement{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-blue-700">
                Choisissez une action à appliquer à la sélection
              </p>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {Object.values(STATUS_CONFIG).map(config => (
              <Button
                key={config.value}
                variant={config.value === 'DETRUIT' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onBulkAction(config.value)}
                isLoading={isLoading}
                className={getButtonStyles(config.value)}
                title={config.description}
              >
                {getStatusIcon(config.value)}
                {config.label}
              </Button>
            ))}
            
            <div className="w-px h-8 bg-gray-300 mx-2"></div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
              Annuler
            </Button>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}