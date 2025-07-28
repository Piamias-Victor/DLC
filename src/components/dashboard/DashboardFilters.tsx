// src/components/dashboard/DashboardFilters.tsx
import { useState } from 'react';
import { Filter, Search, X, ChevronDown, Hash } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { STATUS_CONFIG } from '@/lib/constants/status';
import type { DashboardFilters } from '@/lib/types';

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onClearFilters: () => void;
  debouncedValues: {
    search: string;
    dateFrom: string;
    dateTo: string;
    quantiteMin: string;
    quantiteMax: string;
  };
}

export function DashboardFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  debouncedValues 
}: DashboardFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(f => f && f !== 'ALL');

  return (
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
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
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
          {/* Première ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Recherche */}
            <div>
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              {filters.search && debouncedValues.search !== filters.search && (
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
              {filters.datePeremptionFrom && debouncedValues.dateFrom !== filters.datePeremptionFrom && (
                <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>
              )}
            </div>
          </div>

          {/* Deuxième ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date de péremption à */}
            <div>
              <Input
                type="date"
                placeholder="Date à"
                value={filters.datePeremptionTo}
                onChange={(e) => updateFilter('datePeremptionTo', e.target.value)}
              />
              {filters.datePeremptionTo && debouncedValues.dateTo !== filters.datePeremptionTo && (
                <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>
              )}
            </div>

            {/* Quantité minimum */}
            <div>
              <Input
                type="number"
                placeholder="Quantité min"
                value={filters.quantiteMin}
                onChange={(e) => updateFilter('quantiteMin', e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                min="1"
              />
              {filters.quantiteMin && debouncedValues.quantiteMin !== filters.quantiteMin && (
                <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>
              )}
            </div>

            {/* Quantité maximum */}
            <div>
              <Input
                type="number"
                placeholder="Quantité max"
                value={filters.quantiteMax}
                onChange={(e) => updateFilter('quantiteMax', e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                min="1"
              />
              {filters.quantiteMax && debouncedValues.quantiteMax !== filters.quantiteMax && (
                <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>
              )}
            </div>

            {/* Espace vide pour alignement */}
            <div></div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}