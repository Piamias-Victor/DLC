// src/hooks/useDashboard.ts - Version simplifiée sans auto-debounce
import { useState, useMemo } from 'react';
import type { DashboardFilters, SignalementStatus } from '@/lib/types';
import { useSignalements, useDeleteSignalement, useBulkUpdateStatus } from './useSignalements';

export function useDashboard() {
  // États des filtres - appliqués manuellement
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    status: 'ALL',
    urgency: 'ALL',
    datePeremptionFrom: '',
    datePeremptionTo: '',
    quantiteMin: '',
    quantiteMax: ''
  });
  
  // États de l'interface
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<SignalementStatus | null>(null);
  
  // Préparation des filtres pour l'API
  const apiFilters = useMemo(() => ({
    ...filters,
    // Sérialiser les arrays pour l'URL
    status: Array.isArray(filters.status) ? JSON.stringify(filters.status) : filters.status,
    urgency: Array.isArray(filters.urgency) ? JSON.stringify(filters.urgency) : filters.urgency
  }), [filters]);

  // Hooks React Query
  const signalementsQuery = useSignalements(1, 100, apiFilters as Partial<DashboardFilters & { status: string; urgency: string }>);
  const deleteMutation = useDeleteSignalement();
  const bulkUpdateMutation = useBulkUpdateStatus();

  const signalements = signalementsQuery.data?.data || [];

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(signalements.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  // Actions groupées
  const handleBulkAction = (action: SignalementStatus) => {
    setBulkAction(action);
    setShowConfirmModal(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    
    try {
      await bulkUpdateMutation.mutateAsync({
        signalementIds: selectedIds,
        newStatus: bulkAction
      });
      
      setSelectedIds([]);
      setShowConfirmModal(false);
      setBulkAction(null);
    } catch (error) {
      console.error('Erreur bulk update:', error);
    }
  };

  // Gestion des filtres - application manuelle
  const updateFilters = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      urgency: 'ALL',
      datePeremptionFrom: '',
      datePeremptionTo: '',
      quantiteMin: '',
      quantiteMax: ''
    });
  };

  // Actions individuelles
  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce signalement ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  // Export CSV
  const handleExport = () => {
    const csvLines: string[] = [];
    
    signalements.forEach(item => {
      csvLines.push(`${item.codeBarres}; ${item.quantite}`);
      const datePeremption = new Date(item.datePeremption).toLocaleDateString('fr-FR');
      csvLines.push(datePeremption);
    });
    
    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signalements-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' || key === 'urgency') {
      return value !== 'ALL';
    }
    return value && value !== '';
  });

  return {
    // États
    filters,
    selectedIds,
    showConfirmModal,
    bulkAction,
    signalements,
    isLoading: signalementsQuery.isLoading,
    error: signalementsQuery.error,
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
    clearSelection: () => setSelectedIds([])
  };
}