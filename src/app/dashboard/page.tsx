// src/app/dashboard/page.tsx - Version complète avec import rotations
'use client';

import { useState } from 'react';
import { Download, AlertTriangle, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardFiltersComponent } from '@/components/dashboard/DashboardFilters';
import { BulkActions } from '@/components/dashboard/BulkActions';
import { SignalementsTable } from '@/components/dashboard/SignalementsTable';
import { ConfirmBulkActionModal } from '@/components/dashboard/ConfirmBulkActionModal';
import { RotationImportModal } from '@/components/rotation/RotationImportModal';
import { useDashboard } from '@/hooks/useDashboard';
import { useRecalculateUrgencies } from '@/hooks/rotation/useRotations';

export default function DashboardPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  
  const {
    // États
    filters,
    selectedIds,
    showConfirmModal,
    bulkAction,
    signalements,
    isLoading,
    error,
    hasActiveFilters,
    
    // Mutations
    deleteMutation,
    bulkUpdateMutation,
    
    // Actions
    handleSelectAll,
    handleSelectOne,
    handleBulkAction,
    confirmBulkAction,
    updateFilters,
    clearFilters,
    handleDelete,
    handleExport,
    
    // Modal actions
    setShowConfirmModal,
    setBulkAction,
    clearSelection
  } = useDashboard();

  // Hook pour recalcul des urgences
  const recalculateMutation = useRecalculateUrgencies();

  const handleRecalculateAll = async () => {
    if (confirm('Recalculer toutes les urgences ? Cela peut prendre quelques secondes.')) {
      try {
        const result = await recalculateMutation.mutateAsync({ all: true });
        alert(`Recalcul terminé !\n- Traités: ${result.processed}\n- Avec rotation: ${result.withRotation}\n- Auto-vérifiés: ${result.autoVerified}`);
      } catch (error) {
        console.error('Erreur recalcul:', error);
        alert('Erreur lors du recalcul des urgences');
      }
    }
  };

  const handleImportSuccess = () => {
    setShowImportModal(false);
    // Les données se rechargeront automatiquement grâce à React Query
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des signalements...</p>
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
      <div className="content py-8">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Signalements
              </h1>
              <p className="text-gray-600">
                Vue d ensemble avec filtres, rotations et actions groupées
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* Bouton Recalcul urgences */}
              <Button 
                variant="outline" 
                onClick={handleRecalculateAll}
                isLoading={recalculateMutation.isPending}
                className="flex items-center gap-2"
                title="Recalculer toutes les urgences avec les rotations"
              >
                <RefreshCw className="w-4 h-4" />
                Recalculer urgences
              </Button>

              {/* Bouton Import rotations */}
              <Button 
                variant="outline" 
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Rotations
              </Button>

              {/* Bouton Export */}
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>

              {/* Bouton Nouveau signalement */}
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/signalement'}
              >
                Nouveau Signalement
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Statistiques */}
          <DashboardStats signalements={signalements} />

          {/* Filtres */}
          <DashboardFiltersComponent
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
            isLoading={isLoading}
          />

          {/* Actions groupées */}
          <BulkActions
            selectedCount={selectedIds.length}
            onBulkAction={handleBulkAction}
            onClearSelection={clearSelection}
            isLoading={bulkUpdateMutation.isPending}
          />

          {/* Table des signalements */}
          <SignalementsTable
            signalements={signalements}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onDelete={handleDelete}
            isDeleteLoading={deleteMutation.isPending}
            hasActiveFilters={hasActiveFilters}
          />

        </div>

        {/* Modal de confirmation pour actions groupées */}
        {showConfirmModal && bulkAction && (
          <ConfirmBulkActionModal
            selectedCount={selectedIds.length}
            newStatus={bulkAction}
            onConfirm={confirmBulkAction}
            onCancel={() => {
              setShowConfirmModal(false);
              setBulkAction(null);
            }}
            isLoading={bulkUpdateMutation.isPending}
          />
        )}

        {/* Modal d'import des rotations */}
        {showImportModal && (
          <RotationImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={handleImportSuccess}
          />
        )}

      </div>
    </div>
  );
}