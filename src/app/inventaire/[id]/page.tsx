// src/app/inventaire/[id]/page.tsx - Version épurée mobile scanette
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, ArrowLeft, CheckCircle, Check, List } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { useInventaire, useFinishInventaire } from '@/hooks/useInventaire';
import { InventaireFormMobile } from '@/components/inventaire/InventaireFormMobile';
import { InventaireItemsListMobile } from '@/components/inventaire/InventaireItemsListMobile';

export default function InventaireDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inventaireId = params.id as string;
  
  const [clearTrigger, setClearTrigger] = useState(0);
  const [showItemsList, setShowItemsList] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  // Hooks
  const { data: inventaire, isLoading, error, refetch } = useInventaire(inventaireId);
  const finishMutation = useFinishInventaire();

  // Gestion ajout d'item réussi
  const handleItemAdded = () => {
    setClearTrigger(prev => prev + 1);
    refetch();
  };

  // Finaliser l'inventaire
  const handleFinish = async () => {
    try {
      await finishMutation.mutateAsync({ 
        id: inventaireId, 
        force: (inventaire?.stats?.totalProduits || 0) === 0 
      });
      refetch();
      setShowConfirmFinish(false);
    } catch (error) {
      console.error('Erreur finalisation:', error);
      alert('Erreur lors de la finalisation');
    }
  };

  // États de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Erreur de chargement</p>
          <Button onClick={() => refetch()} variant="primary" size="sm">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!inventaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600">Inventaire non trouvé</p>
        </div>
      </div>
    );
  }

  const isEnCours = inventaire.status === 'EN_COURS';
  const stats = inventaire.stats || { totalProduits: 0, totalQuantite: 0 };
  const items = inventaire.items || [];

  // Si inventaire terminé
  if (!isEnCours) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          
          {/* Header simple */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/inventaire')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {inventaire.nom}
            </h1>
          </div>

          {/* Message terminé */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              Inventaire Terminé
            </h2>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>{stats.totalProduits}</strong> produits</p>
              <p><strong>{stats.totalQuantite}</strong> unités</p>
            </div>
            
            {/* Bouton voir liste finale */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowItemsList(true)}
              className="mt-4"
            >
              <List className="w-4 h-4 mr-2" />
              Voir la liste finale
            </Button>
          </div>

        </div>
        
        {/* Modal liste items terminé */}
        {showItemsList && (
          <InventaireItemsListMobile
            items={items}
            onClose={() => setShowItemsList(false)}
            readonly={true}
          />
        )}
      </div>
    );
  }

  // Interface principale épurée EN_COURS
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">

        {/* Header minimaliste */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/inventaire')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {inventaire.nom}
              </h1>
              <p className="text-xs text-gray-600">
                {stats.totalProduits} produits • {stats.totalQuantite} unités
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire de scan principal */}
        <div className="space-y-6">
          <InventaireFormMobile
            inventaireId={inventaireId}
            onItemAdded={handleItemAdded}
            clearTrigger={clearTrigger}
          />
        </div>

        {/* Stats + Actions rapides */}
        <div className="mt-8 space-y-4">
          
          {/* Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalProduits}
                </div>
                <div className="text-sm text-gray-600">Produits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalQuantite}
                </div>
                <div className="text-sm text-gray-600">Unités</div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Voir liste produits scannés */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowItemsList(true)}
              disabled={stats.totalProduits === 0}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-2" />
              Voir liste ({items.length})
            </Button>

            {/* Terminer inventaire */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowConfirmFinish(true)}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Terminer
            </Button>
          </div>

        </div>

        {/* Aide scanette */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            💡 Scanner → Quantité → Date → Valider
          </p>
        </div>

      </div>

      {/* Modal liste items */}
      {showItemsList && (
        <InventaireItemsListMobile
          items={items}
          onClose={() => setShowItemsList(false)}
          readonly={false}
        />
      )}

      {/* Modal confirmation finalisation */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Terminer l&apos;inventaire ?
            </h3>
            
            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-2">Résumé :</p>
              <p>• <strong>{stats.totalProduits}</strong> produits distincts</p>
              <p>• <strong>{stats.totalQuantite}</strong> unités comptées</p>
              <p>• <strong>{items.length}</strong> scans effectués</p>
              
              {stats.totalProduits === 0 && (
                <p className="text-orange-600 mt-2 text-xs">
                  ⚠️ Attention : Aucun produit scanné
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmFinish(false)}
                disabled={finishMutation.isPending}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleFinish}
                isLoading={finishMutation.isPending}
                loadingText="Finalisation..."
                className="flex-1"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}