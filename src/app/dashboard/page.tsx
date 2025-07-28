// src/app/dashboard/page.tsx - Version refactorisée
'use client';

import { Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardFiltersComponent } from '@/components/dashboard/DashboardFilters';
import { BulkActions } from '@/components/dashboard/BulkActions';
import { SignalementsTable } from '@/components/dashboard/SignalementsTable';
import { ConfirmBulkActionModal } from '@/components/dashboard/ConfirmBulkActionModal';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
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
    debouncedValues,
    
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
                Vue d ensemble avec filtres et actions groupées
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
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
            debouncedValues={debouncedValues}
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

        {/* Modal de confirmation */}
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

      </div>
    </div>
  );
}