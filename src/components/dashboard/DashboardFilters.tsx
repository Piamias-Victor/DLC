// src/components/dashboard/DashboardFilters.tsx - Version avec bouton Appliquer
import { useState } from 'react';
import { Filter, Search, X, Hash, RefreshCw } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { MultiSelectFilter } from '../molecules/MultiSelectFilter';
import { STATUS_CONFIG } from '@/lib/constants/status';
import type { DashboardFilters, SignalementStatus, UrgencyLevel } from '@/lib/types';

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export function DashboardFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  isLoading = false
}: DashboardFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<DashboardFilters>(filters);

  const updateTempFilter = <K extends keyof DashboardFilters>(
    key: K, 
    value: DashboardFilters[K]
  ) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: DashboardFilters = {
      search: '',
      status: 'ALL',
      urgency: 'ALL',
      datePeremptionFrom: '',
      datePeremptionTo: '',
      quantiteMin: '',
      quantiteMax: ''
    };
    setTempFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' || key === 'urgency') {
      return value !== 'ALL';
    }
    return value && value !== '';
  });

  const hasPendingChanges = JSON.stringify(tempFilters) !== JSON.stringify(filters);

  // Options pour les filtres
  const statusOptions = Object.values(STATUS_CONFIG).map(config => ({
    value: config.value,
    label: config.label
  }));

  const urgencyOptions = [
    { value: 'critical', label: 'Critique' },
    { value: 'high', label: 'Élevé' },
    { value: 'medium', label: 'Moyen' },
    { value: 'low', label: 'Faible' }
  ];

  return (
    <Card>
      <CardHeader
        title="Filtres"
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Masquer' : 'Filtres'}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
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
          <div className="space-y-6">
            
            {/* Première ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Recherche</label>
                <Input
                  placeholder="Code ou commentaire..."
                  value={tempFilters.search}
                  onChange={(e) => updateTempFilter('search', e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              {/* Statut multi-sélection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <MultiSelectFilter
                  options={statusOptions}
                  selectedValues={tempFilters.status}
                  onChange={(values) => updateTempFilter('status', values as SignalementStatus[] | 'ALL')}
                  placeholder="Statuts"
                  allLabel="Tous les statuts"
                />
              </div>

              {/* Urgence multi-sélection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Urgence</label>
                <MultiSelectFilter
                  options={urgencyOptions}
                  selectedValues={tempFilters.urgency}
                  onChange={(values) => updateTempFilter('urgency', values as UrgencyLevel[] | 'ALL')}
                  placeholder="Urgences"
                  allLabel="Toutes urgences"
                />
              </div>

              {/* Date de péremption de */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date péremption (de)</label>
                <Input
                  type="date"
                  value={tempFilters.datePeremptionFrom}
                  onChange={(e) => updateTempFilter('datePeremptionFrom', e.target.value)}
                />
              </div>
            </div>

            {/* Deuxième ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date de péremption à */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date péremption (à)</label>
                <Input
                  type="date"
                  value={tempFilters.datePeremptionTo}
                  onChange={(e) => updateTempFilter('datePeremptionTo', e.target.value)}
                />
              </div>

              {/* Quantité minimum */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Quantité min</label>
                <Input
                  type="number"
                  placeholder="Ex: 5"
                  value={tempFilters.quantiteMin}
                  onChange={(e) => updateTempFilter('quantiteMin', e.target.value)}
                  leftIcon={<Hash className="w-4 h-4" />}
                  min="1"
                />
              </div>

              {/* Quantité maximum */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Quantité max</label>
                <Input
                  type="number"
                  placeholder="Ex: 100"
                  value={tempFilters.quantiteMax}
                  onChange={(e) => updateTempFilter('quantiteMax', e.target.value)}
                  leftIcon={<Hash className="w-4 h-4" />}
                  min="1"
                />
              </div>

              {/* Boutons d'action */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 opacity-0">Actions</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={applyFilters}
                    disabled={!hasPendingChanges}
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Appliquer
                  </Button>
                </div>
              </div>
            </div>

            {/* Indicateur des filtres actifs */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(filters.status) && filters.status.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                      Statuts: {filters.status.length}
                    </span>
                  )}
                  {Array.isArray(filters.urgency) && filters.urgency.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800 font-medium">
                      Urgences: {filters.urgency.length}
                    </span>
                  )}
                  {filters.search && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                      Recherche: &quot;{filters.search}&quot;
                    </span>
                  )}
                  {(filters.datePeremptionFrom || filters.datePeremptionTo) && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                      Dates filtrées
                    </span>
                  )}
                  {(filters.quantiteMin || filters.quantiteMax) && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 font-medium">
                      Quantités filtrées
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Indicateur de changements en attente */}
            {hasPendingChanges && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 Vous avez des modifications non appliquées. Cliquez sur &quot;Appliquer&quot; pour les activer.
                </p>
              </div>
            )}

          </div>
        </CardContent>
      )}
    </Card>
  );
}