// src/app/inventaire/page.tsx
'use client';

import { useState } from 'react';
import { Plus, Package, Clock, Eye, Download, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardHeader, CardContent } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { INVENTAIRE_STATUS_CONFIG, INVENTAIRE_STATUS_COLORS } from '@/lib/constants/inventaire';
import type { InventaireWithItems, InventaireStatus } from '@/lib/types/inventaire';
import { useExportInventaire } from '@/hooks/useExportInventaire';
import { useInventaires, useDeleteInventaire } from '@/hooks/useInventaires';

// Composant Badge de Statut
function InventaireStatusBadge({ status }: { status: InventaireStatus }) {
  const config = INVENTAIRE_STATUS_CONFIG[status];
  const colors = INVENTAIRE_STATUS_COLORS[config.color];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {config.label}
    </span>
  );
}

// Composant Card Inventaire
interface InventaireCardProps {
  inventaire: InventaireWithItems;
  onDelete: (id: string) => void;
  onExport: (id: string, nom: string) => void;
  isDeleteLoading: boolean;
  isExportLoading: boolean;
}

function InventaireCard({ 
  inventaire, 
  onDelete, 
  onExport, 
  isDeleteLoading, 
  isExportLoading 
}: InventaireCardProps) {
  const itemsCount = inventaire._count?.items || 0;
  const isEnCours = inventaire.status === 'EN_COURS';
  const isVide = itemsCount === 0;
  
  // Calculer le temps écoulé
  const tempsEcoule = inventaire.finishedAt 
    ? Math.floor((new Date(inventaire.finishedAt).getTime() - new Date(inventaire.createdAt).getTime()) / 1000)
    : Math.floor((Date.now() - new Date(inventaire.createdAt).getTime()) / 1000);
  
  const formatTemps = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          
          {/* Header avec nom et statut */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {inventaire.nom}
              </h3>
              {inventaire.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {inventaire.description}
                </p>
              )}
            </div>
            <InventaireStatusBadge status={inventaire.status} />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-semibold text-gray-900">{itemsCount}</div>
              <div className="text-xs text-gray-500">produits</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-lg font-semibold text-gray-900">{formatTemps(tempsEcoule)}</div>
              <div className="text-xs text-gray-500">{isEnCours ? 'en cours' : 'durée'}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                {isEnCours ? 'Créé' : 'Terminé'}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(
                  isEnCours ? inventaire.createdAt : inventaire.finishedAt || inventaire.createdAt
                ).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isEnCours ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = `/inventaire/${inventaire.id}`}
                className="flex-1"
              >
                Continuer
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/inventaire/${inventaire.id}`}
                className="flex-1"
              >
                <Eye className="w-4 h-4" />
                Voir
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(inventaire.id, inventaire.nom)}
              disabled={isVide || isExportLoading}
              title={isVide ? 'Inventaire vide' : 'Exporter CSV'}
            >
              <Download className="w-4 h-4" />
            </Button>
            
            {isVide && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(inventaire.id)}
                disabled={isDeleteLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Supprimer inventaire vide"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Alerte si vide */}
          {isVide && isEnCours && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">Aucun produit scanné</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Page Principale
export default function InventairePage() {
  const [statusFilter, setStatusFilter] = useState<InventaireStatus | 'ALL'>('ALL');
  
  // Hooks
  const { data, isLoading, error } = useInventaires({ status: statusFilter });
  const deleteMutation = useDeleteInventaire();
  const exportMutation = useExportInventaire();

  const inventaires = data?.data || [];

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cet inventaire vide ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleExport = async (id: string, nom: string) => {
    try {
      await exportMutation.mutateAsync({ inventaireId: id, inventaireName: nom });
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des inventaires...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Erreur de chargement</p>
          <p className="text-gray-600 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mes Inventaires
              </h1>
              <p className="text-gray-600">
                Gestion des inventaires produits avec scan continu
              </p>
            </div>
            
            <Button
              variant="primary"
              onClick={() => window.location.href = '/inventaire/nouveau'}
            >
              <Plus className="w-4 h-4" />
              Nouvel Inventaire
            </Button>
          </div>
        </header>

        {/* Filtres */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { value: 'ALL', label: 'Tous' },
              { value: 'EN_COURS', label: 'En cours' },
              { value: 'TERMINE', label: 'Terminés' },
              { value: 'ARCHIVE', label: 'Archivés' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as InventaireStatus | 'ALL')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des inventaires */}
        {inventaires.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventaires.map((inventaire) => (
              <InventaireCard
                key={inventaire.id}
                inventaire={inventaire}
                onDelete={handleDelete}
                onExport={handleExport}
                isDeleteLoading={deleteMutation.isPending}
                isExportLoading={exportMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === 'ALL' ? 'Aucun inventaire' : `Aucun inventaire ${statusFilter.toLowerCase()}`}
              </h3>
              <p className="text-gray-600 mb-6">
                Créez votre premier inventaire pour commencer le comptage
              </p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/inventaire/nouveau'}
              >
                <Plus className="w-4 h-4" />
                Nouvel Inventaire
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}