// src/app/dashboard/page.tsx - Version complète et propre
'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Calendar, 
  Hash, 
  Trash2, 
  Eye, 
  Filter,
  Search,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  Users,
  Settings
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardHeader, CardContent } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Badge } from '@/components/atoms/Badge';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { useSignalements, useDeleteSignalement, useBulkUpdateStatus, Signalement } from '@/lib/hooks/useSignalements';
import { STATUS_CONFIG } from '@/lib/constants/status';
import type { DashboardFilters, SignalementStatus, UrgencyLevel } from '@/lib/types';

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

export default function DashboardPage() {
  // États des filtres
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    status: 'ALL',
    urgency: 'ALL',
    datePeremptionFrom: '',
    datePeremptionTo: ''
  });
  
  // Debounce pour la recherche (500ms)
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedDateFrom = useDebounce(filters.datePeremptionFrom, 800);
  const debouncedDateTo = useDebounce(filters.datePeremptionTo, 800);
  
  // Filtres finaux avec debounce
  const finalFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch,
    datePeremptionFrom: debouncedDateFrom,
    datePeremptionTo: debouncedDateTo
  }), [filters.status, filters.urgency, debouncedSearch, debouncedDateFrom, debouncedDateTo]);
  
  // États de l'interface
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<SignalementStatus | null>(null);
  
  // Hooks React Query
  const { data: signalementsData, isLoading, error } = useSignalements(1, 100, finalFilters);
  const deleteMutation = useDeleteSignalement();
  const bulkUpdateMutation = useBulkUpdateStatus();

  const signalements = signalementsData?.data || [];
  
  // Statistiques calculées
  const stats = useMemo(() => {
    return {
      total: signalements.length,
      enAttente: signalements.filter(s => s.status === 'EN_ATTENTE').length,
      enCours: signalements.filter(s => s.status === 'EN_COURS').length,
      critique: signalements.filter(s => getUrgency(s.datePeremption, s.quantite) === 'critical').length,
      recent: signalements.filter(s => {
        const created = new Date(s.createdAt);
        const today = new Date();
        const diffTime = today.getTime() - created.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 1;
      }).length
    };
  }, [signalements]);

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
  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      urgency: 'ALL',
      datePeremptionFrom: '',
      datePeremptionTo: ''
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
      csvLines.push(`${item.codeBarres};${item.quantite}`);
      const datePeremption = new Date(item.datePeremption).toLocaleDateString('fr-FR');
      csvLines.push(datePeremption);
    });
    
    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.enAttente}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En cours</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critiques</p>
                    <p className="text-2xl font-bold text-red-600">{stats.critique}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aujourd hui</p>
                    <p className="text-2xl font-bold text-green-600">{stats.recent}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barre de filtres */}
          <Card>
            <CardHeader
              title="Filtres"
              action={
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Masquer' : 'Filtres'}
                  </Button>
                  {(filters.search || filters.status !== 'ALL' || filters.urgency !== 'ALL' || 
                    filters.datePeremptionFrom || filters.datePeremptionTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                    >
                      <X className="w-4 h-4" />
                      Effacer
                    </Button>
                  )}
                </div>
              }
            />
            
            {showFilters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Recherche */}
                  <div>
                    <Input
                      placeholder="Rechercher..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                    />
                    {filters.search && debouncedSearch !== filters.search && (
                      <p className="text-xs text-gray-500 mt-1">Recherche en cours...</p>
                    )}
                  </div>

                  {/* Statut */}
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 appearance-none"
                    >
                      <option value="ALL">Tous les statuts</option>
                      {Object.values(STATUS_CONFIG).map(config => (
                        <option key={config.value} value={config.value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Urgence */}
                  <div className="relative">
                    <select
                      value={filters.urgency}
                      onChange={(e) => updateFilter('urgency', e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 appearance-none"
                    >
                      <option value="ALL">Toutes urgences</option>
                      <option value="critical">Critique</option>
                      <option value="high">Élevé</option>
                      <option value="medium">Moyen</option>
                      <option value="low">Faible</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Date de péremption de */}
                  <div>
                    <Input
                      type="date"
                      placeholder="Date de"
                      value={filters.datePeremptionFrom}
                      onChange={(e) => updateFilter('datePeremptionFrom', e.target.value)}
                    />
                    {filters.datePeremptionFrom && debouncedDateFrom !== filters.datePeremptionFrom && (
                      <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>
                    )}
                  </div>

                  {/* Date de péremption à */}
                  <div>
                    <Input
                      type="date"
                      placeholder="Date à"
                      value={filters.datePeremptionTo}
                      onChange={(e) => updateFilter('datePeremptionTo', e.target.value)}
                    />
                    {filters.datePeremptionTo && debouncedDateTo !== filters.datePeremptionTo && (
                      <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Actions groupées - Nouveau design */}
          {selectedIds.length > 0 && (
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
                        {selectedIds.length} signalement{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
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
                        onClick={() => handleBulkAction(config.value)}
                        isLoading={bulkUpdateMutation.isPending}
                        className={`
                          ${config.value === 'EN_ATTENTE' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : ''}
                          ${config.value === 'EN_COURS' ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : ''}
                          ${config.value === 'A_DESTOCKER' ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : ''}
                          ${config.value === 'DETRUIT' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}
                        `}
                      >
                        <Settings className="w-4 h-4" />
                        {config.label}
                      </Button>
                    ))}
                    
                    <div className="w-px h-8 bg-gray-300 mx-2"></div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des signalements */}
          <Card>
            <CardHeader
              title={`Signalements (${signalements.length})`}
              subtitle={
                Object.values(finalFilters).some(f => f && f !== 'ALL') 
                  ? "Résultats filtrés" 
                  : "Tous les signalements"
              }
              icon={<Package className="w-6 h-6" />}
            />

            <CardContent>
              {signalements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === signalements.length && signalements.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Quantité</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Péremption</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Urgence</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Créé le</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signalements.map((item) => (
                        <tr 
                          key={item.id} 
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            selectedIds.includes(item.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {item.codeBarres}
                            </code>
                          </td>
                          <td className="py-4 px-4 font-medium">
                            {item.quantite}
                          </td>
                          <td className="py-4 px-4">
                            {new Date(item.datePeremption).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="py-4 px-4">
                            <UrgencyBadge level={getUrgency(item.datePeremption, item.quantite)} />
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(item.createdAt).toLocaleString('fr-FR')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedSignalement(item)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deleteMutation.isPending}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun signalement trouvé</p>
                  <p className="text-sm mt-1">
                    Modifiez vos filtres ou créez un nouveau signalement
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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

        {/* Modal détail signalement */}
        {selectedSignalement && (
          <SignalementModal 
            signalement={selectedSignalement}
            onClose={() => setSelectedSignalement(null)}
          />
        )}

      </div>
    </div>
  );
}

// Composants auxiliaires
function getUrgency(datePeremption: string | Date, quantite: number): 'low' | 'medium' | 'high' | 'critical' {
  const today = new Date();
  const expDate = new Date(datePeremption);
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) return 'critical';
  if (quantite >= 50 && diffDays <= 120) return 'critical';
  if (diffDays > 30 && diffDays <= 75) {
    if (quantite >= 10) return 'high';
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  if (diffDays > 75 && diffDays <= 180) {
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  return 'low';
}

function UrgencyBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const configs = {
    low: { variant: 'success' as const, label: 'Faible' },
    medium: { variant: 'warning' as const, label: 'Moyen' },
    high: { variant: 'error' as const, label: 'Élevé' },
    critical: { variant: 'error' as const, label: 'Critique' }
  };
  
  const config = configs[level];
  
  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}

// Modal de confirmation pour les actions groupées
function ConfirmBulkActionModal({
  selectedCount,
  newStatus,
  onConfirm,
  onCancel,
  isLoading
}: {
  selectedCount: number;
  newStatus: SignalementStatus;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const statusConfig = STATUS_CONFIG[newStatus];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader
          title="Confirmer l'action"
          icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
        />
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              Vous êtes sur le point de changer l état de{' '}
              <strong>{selectedCount} signalement(s)</strong> vers{' '}
              <StatusBadge status={newStatus} className="mx-1" />.
            </p>
            
            <p className="text-sm text-gray-600">
              {statusConfig.description}
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
                isLoading={isLoading}
                loadingText="Mise à jour..."
              >
                Confirmer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SignalementModal({ 
  signalement, 
  onClose 
}: { 
  signalement: Signalement; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader
          title="Détail du Signalement"
          icon={<Package className="w-6 h-6" />}
          action={
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          }
        />
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">ID</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                {signalement.id}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Code-barres</label>
              <p className="font-mono text-lg mt-1">{signalement.codeBarres}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Quantité</label>
                <p className="text-lg font-semibold mt-1">{signalement.quantite}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Statut</label>
                <div className="mt-1">
                  <StatusBadge status={signalement.status} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Urgence</label>
                <div className="mt-1">
                  <UrgencyBadge level={getUrgency(signalement.datePeremption, signalement.quantite)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date de péremption</label>
                <p className="text-lg mt-1">
                  {new Date(signalement.datePeremption).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            
            {signalement.commentaire && (
              <div>
                <label className="text-sm font-medium text-gray-600">Commentaire</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                  {signalement.commentaire}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-600">Créé le</label>
                <p className="text-gray-600 mt-1">
                  {new Date(signalement.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Modifié le</label>
                <p className="text-gray-600 mt-1">
                  {new Date(signalement.updatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}