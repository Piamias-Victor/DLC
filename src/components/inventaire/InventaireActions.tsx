// src/components/inventaire/InventaireActions.tsx
'use client';

import { useState } from 'react';
import { CheckCircle, Download, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { InventaireWithItems } from '@/lib/types/inventaire';
import { useExportInventaire } from '@/hooks/useExportInventaire';
import { useFinishInventaire } from '@/hooks/useInventaire';

interface InventaireActionsProps {
  inventaire: InventaireWithItems & { stats?: any };
  onFinished?: () => void;
}

export function InventaireActions({ inventaire, onFinished }: InventaireActionsProps) {
  const finishMutation = useFinishInventaire();
  const exportMutation = useExportInventaire();
  
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const stats = inventaire.stats || { totalProduits: 0, totalQuantite: 0 };
  const isEmpty = stats.totalProduits === 0;
  const isFinished = inventaire.status === 'TERMINE';

  // Finaliser l'inventaire
  const handleFinish = async (force = false) => {
    try {
      await finishMutation.mutateAsync({ 
        id: inventaire.id, 
        force 
      });
      
      setShowConfirmFinish(false);
      onFinished?.();
      
    } catch (error) {
      console.error('Erreur finalisation:', error);
      alert('Erreur lors de la finalisation');
    }
  };

  // Exporter en CSV
  const handleExport = async () => {
    if (isEmpty) {
      alert('Impossible d\'exporter un inventaire vide');
      return;
    }
    
    try {
      await exportMutation.mutateAsync({ 
        inventaireId: inventaire.id, 
        inventaireName: inventaire.nom 
      });
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Actions principales */}
      <div className="flex flex-col sm:flex-row gap-4">
        
        {/* Retour */}
        <Button
          variant="outline"
          onClick={() => window.location.href = '/inventaire'}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Button>

        <div className="flex-1"></div>

        {/* Export */}
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isEmpty || exportMutation.isPending}
          isLoading={exportMutation.isPending}
          loadingText="Export..."
          className="flex items-center gap-2"
          title={isEmpty ? 'Inventaire vide' : 'Télécharger CSV'}
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>

        {/* Finaliser */}
        {!isFinished && (
          <Button
            variant="primary"
            onClick={() => {
              if (isEmpty) {
                setShowConfirmFinish(true);
              } else {
                handleFinish();
              }
            }}
            disabled={finishMutation.isPending}
            isLoading={finishMutation.isPending}
            loadingText="Finalisation..."
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Finaliser l'Inventaire
          </Button>
        )}

      </div>

      {/* Confirmation finalisation inventaire vide */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Finaliser un inventaire vide ?
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Cet inventaire ne contient aucun produit. Voulez-vous vraiment le finaliser ?
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmFinish(false)}
                disabled={finishMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => handleFinish(true)}
                isLoading={finishMutation.isPending}
                loadingText="Finalisation..."
              >
                Finaliser quand même
              </Button>
            </div>
            
          </div>
        </div>
      )}

      {/* Informations sur l'export */}
      {!isEmpty && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="mb-1">
            <strong>Format d'export :</strong> CSV avec colonnes "ean13;quantite"
          </p>
          <p>
            <strong>Traitement des doublons :</strong> Quantités automatiquement additionnées par EAN13
          </p>
        </div>
      )}

      {/* Message inventaire terminé */}
      {isFinished && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">
              Inventaire terminé avec succès !
            </p>
            <p className="text-green-700 text-sm">
              {stats.totalProduits} produits distincts • {stats.totalQuantite} unités comptées
              {inventaire.finishedAt && (
                <span className="ml-2">
                  • Terminé le {new Date(inventaire.finishedAt).toLocaleString('fr-FR')}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}