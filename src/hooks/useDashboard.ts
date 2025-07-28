// src/hooks/useDashboard.ts
import { useState, useMemo, useEffect } from 'react';
import type { DashboardFilters, SignalementStatus } from '@/lib/types';
import { useSignalements, useDeleteSignalement, useBulkUpdateStatus } from './useSignalements';

// Hook pour debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDashboard() {
  // États des filtres
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    status: 'ALL',
    urgency: 'ALL',
    datePeremptionFrom: '',
    datePeremptionTo: '',
    quantiteMin: '',
    quantiteMax: ''
  });
  
  // Debounce pour les champs de saisie
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedDateFrom = useDebounce(filters.datePeremptionFrom, 800);
  const debouncedDateTo = useDebounce(filters.datePeremptionTo, 800);
  const debouncedQuantiteMin = useDebounce(filters.quantiteMin, 800);
  const debouncedQuantiteMax = useDebounce(filters.quantiteMax, 800);
  
  // États de l'interface
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<SignalementStatus | null>(null);
  
  // Filtres finaux avec debounce
  const finalFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch,
    datePeremptionFrom: debouncedDateFrom,
    datePeremptionTo: debouncedDateTo,
    quantiteMin: debouncedQuantiteMin,
    quantiteMax: debouncedQuantiteMax
  }), [
    filters.status, 
    filters.urgency, 
    debouncedSearch, 
    debouncedDateFrom, 
    debouncedDateTo,
    debouncedQuantiteMin,
    debouncedQuantiteMax
  ]);

  // Hooks React Query
  const { data: signalementsData, isLoading, error } = useSignalements(1, 100, finalFilters);
  const deleteMutation = useDeleteSignalement();
  const bulkUpdateMutation = useBulkUpdateStatus();

  const signalements = signalementsData?.data || [];

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

  // Gestion des filtres
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
      // Ligne 1 : Code EAN et quantité
      csvLines.push(`${item.codeBarres}; ${item.quantite}`);
      
      // Ligne 2 : Date péremption
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
  const hasActiveFilters = Object.values(finalFilters).some(f => f && f !== 'ALL');

  // Valeurs debouncées pour l'UI
  const debouncedValues = {
    search: debouncedSearch,
    dateFrom: debouncedDateFrom,
    dateTo: debouncedDateTo,
    quantiteMin: debouncedQuantiteMin,
    quantiteMax: debouncedQuantiteMax
  };

  return {
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
    clearSelection: () => setSelectedIds([])
  };
}