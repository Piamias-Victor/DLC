// src/app/inventaire/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { InventaireStats } from '@/components/inventaire/InventaireStats';
import { InventaireForm } from '@/components/inventaire/InventaireForm';
import { InventaireItemsList } from '@/components/inventaire/InventaireItemsList';
import { InventaireActions } from '@/components/inventaire/InventaireActions';
import { useInventaire } from '@/hooks/useInventaire';

export default function InventaireDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inventaireId = params.id as string;
  
  const [clearTrigger, setClearTrigger] = useState(0);
  const [lastAddedItem, setLastAddedItem] = useState<any>(null);

  // Hook principal
  const { data: inventaire, isLoading, error, refetch } = useInventaire(inventaireId);

  // Gestion ajout d'item réussi
  const handleItemAdded = () => {
    // Déclencher le clear du formulaire
    setClearTrigger(prev => prev + 1);
    
    // Recharger les données
    refetch();
  };

  // Gestion inventaire finalisé
  const handleInventaireFinished = () => {
    // Recharger pour mettre à jour le statut
    refetch();
  };

  // États de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'inventaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => router.push('/inventaire')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!inventaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600">Inventaire non trouvé</p>
        </div>
      </div>
    );
  }

  const isEnCours = inventaire.status === 'EN_COURS';
  const items = inventaire.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header avec statistiques */}
        <InventaireStats 
          inventaire={inventaire}
          realtime={isEnCours}
        />

        {/* Actions en haut */}
        <div className="mb-8">
          <InventaireActions 
            inventaire={inventaire}
            onFinished={handleInventaireFinished}
          />
        </div>

        {/* Interface principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Colonne gauche : Formulaire de scan */}
          <div className="space-y-6">
            
            {isEnCours ? (
              <>
                {/* Formulaire de scan actif */}
                <div className="sticky top-4">
                  <InventaireForm
                    inventaireId={inventaireId}
                    onItemAdded={handleItemAdded}
                    clearTrigger={clearTrigger}
                    lastAddedItem={lastAddedItem}
                  />
                </div>

                {/* Instructions d'utilisation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    💡 Mode d'emploi
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Scanner :</strong> Utilisez la caméra ou tapez le code manuellement</li>
                    <li>• <strong>Quantité :</strong> Modifiez si nécessaire, puis validez</li>
                    <li>• <strong>Doublons :</strong> Les quantités sont automatiquement additionnées</li>
                    <li>• <strong>Correction :</strong> Cliquez sur un produit pour modifier sa quantité</li>
                  </ul>
                </div>
              </>
            ) : (
              /* Inventaire terminé - Affichage en lecture seule */
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Inventaire Terminé
                  </h3>
                  <p className="text-green-800 mb-4">
                    Cet inventaire a été finalisé et ne peut plus être modifié.
                  </p>
                  <div className="text-sm text-green-700">
                    <p>📊 <strong>{inventaire.stats?.totalProduits || 0}</strong> produits distincts</p>
                    <p>📦 <strong>{inventaire.stats?.totalQuantite || 0}</strong> unités comptées</p>
                    {inventaire.finishedAt && (
                      <p className="mt-2">
                        ✅ Terminé le {new Date(inventaire.finishedAt).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Colonne droite : Liste des items */}
          <div>
            <InventaireItemsList
              inventaireId={inventaireId}
              items={items}
              isLoading={false}
            />
          </div>

        </div>

        {/* Résumé rapide en bas (mobile) */}
        <div className="mt-8 lg:hidden">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {inventaire.stats?.totalProduits || 0}
                </div>
                <div className="text-xs text-gray-600">Produits</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {inventaire.stats?.totalQuantite || 0}
                </div>
                <div className="text-xs text-gray-600">Unités</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {items.length}
                </div>
                <div className="text-xs text-gray-600">Scans</div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug info en développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-800 text-white rounded-lg text-xs font-mono">
            <details>
              <summary className="cursor-pointer mb-2">🔧 Debug Info</summary>
              <pre className="overflow-auto">
                {JSON.stringify({
                  id: inventaire.id,
                  status: inventaire.status,
                  totalItems: items.length,
                  totalProduits: inventaire.stats?.totalProduits,
                  totalQuantite: inventaire.stats?.totalQuantite,
                  createdAt: inventaire.createdAt,
                  finishedAt: inventaire.finishedAt
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}

      </div>
    </div>
  );
}