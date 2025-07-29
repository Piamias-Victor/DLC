// src/components/dashboard/SignalementsTable.tsx - Avec tri cliquable et perte financière
import { useState } from 'react';
import { Package, Eye, Trash2, TrendingUp, Info, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { StatusBadge } from '../molecules/StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { UrgencyDisplay, RotationInfo } from '../rotation/UrgencyDisplay';
import { SignalementModal } from './SignalementModal';
import { calculerPerteFinanciere, formaterMontantPerte, getCouleurPerte } from '@/lib/utils/perteFinanciere';
import { Signalement, SortField, SortDirection, SortConfig, SignalementWithRotation } from '@/lib/types';

interface SignalementsTableProps {
  signalements: SignalementWithRotation[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  isDeleteLoading: boolean;
  hasActiveFilters: boolean;
}

// Configuration des colonnes triables AVEC perte financière
const SORTABLE_COLUMNS: Record<SortField, { label: string; tooltip?: string }> = {
  codeBarres: { label: 'Code', tooltip: 'Trier par code-barres' },
  quantite: { label: 'Quantité', tooltip: 'Trier par quantité' },
  datePeremption: { label: 'Péremption', tooltip: 'Trier par date de péremption' },
  status: { label: 'Statut', tooltip: 'Trier par statut' },
  urgenceCalculee: { label: 'Urgence calculée', tooltip: 'Trier par urgence' },
  probabiliteEcoulement: { label: 'Prob. écoulement', tooltip: 'Trier par probabilité d\'écoulement' },
  perteFinanciere: { label: 'Perte €', tooltip: 'Trier par montant de perte financière calculé' },
  createdAt: { label: 'Créé le', tooltip: 'Trier par date de création' }
};

export function SignalementsTable({
  signalements,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onDelete,
  isDeleteLoading,
  hasActiveFilters
}: SignalementsTableProps) {
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });

  // Fonction de tri
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Tri des signalements AVEC perte financière
  const sortedSignalements = [...signalements].sort((a, b) => {
    const { field, direction } = sortConfig;
    let aValue: any;
    let bValue: any;

    // 🆕 Tri spécial pour perte financière
    if (field === 'perteFinanciere') {
      const perteA = calculerPerteFinanciere(a);
      const perteB = calculerPerteFinanciere(b);
      aValue = perteA?.montantPerte || 0;
      bValue = perteB?.montantPerte || 0;
    }
    // Gestion spéciale pour certains champs
    else if (field === 'datePeremption' || field === 'createdAt') {
      aValue = new Date(a[field] as string | number | Date).getTime();
      bValue = new Date(b[field] as string | number | Date).getTime();
    } else if (field === 'quantite' || field === 'probabiliteEcoulement') {
      aValue = Number(a[field as keyof SignalementWithRotation]) || 0;
      bValue = Number(b[field as keyof SignalementWithRotation]) || 0;
    } else {
      aValue = a[field as keyof SignalementWithRotation];
      bValue = b[field as keyof SignalementWithRotation];
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = typeof bValue === 'string' ? bValue.toLowerCase() : '';
      }
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  });

  // Composant pour l'en-tête de colonne triable
  const SortableHeader = ({ field, children, className = '' }: { 
    field: SortField; 
    children: React.ReactNode;
    className?: string;
  }) => {
    const config = SORTABLE_COLUMNS[field];
    const isActive = sortConfig.field === field;
    
    return (
      <th 
        className={`text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
        onClick={() => handleSort(field)}
        title={config.tooltip}
      >
        <div className="flex items-center gap-2 select-none">
          <span>{children}</span>
          <div className="flex flex-col">
            {isActive ? (
              sortConfig.direction === 'asc' ? (
                <ChevronUp className="w-4 h-4 text-blue-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600" />
              )
            ) : (
              <ChevronsUpDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </th>
    );
  };

  return (
    <>
      <Card>
        <CardHeader
          title={`Signalements (${signalements.length})`}
          subtitle={
            hasActiveFilters 
              ? "Résultats filtrés" 
              : "Tous les signalements"
          }
          icon={<Package className="w-6 h-6" />}
          action={
            sortConfig.field !== 'createdAt' && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Trié par {SORTABLE_COLUMNS[sortConfig.field].label}
                {sortConfig.direction === 'desc' ? ' (décroissant)' : ' (croissant)'}
              </div>
            )
          }
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
                        onChange={(e) => onSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <SortableHeader field="codeBarres">Code</SortableHeader>
                    <SortableHeader field="quantite">Quantité</SortableHeader>
                    <SortableHeader field="datePeremption">Péremption</SortableHeader>
                    <SortableHeader field="status">Statut</SortableHeader>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Rotation</th>
                    <SortableHeader field="urgenceCalculee">Urgence calculée</SortableHeader>
                    <SortableHeader field="probabiliteEcoulement">Prob. écoulement</SortableHeader>
                    <SortableHeader field="perteFinanciere">Perte €</SortableHeader>
                    <SortableHeader field="createdAt">Créé le</SortableHeader>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSignalements.map((item) => (
                    <SignalementRow
                      key={item.id}
                      signalement={item}
                      isSelected={selectedIds.includes(item.id)}
                      onSelect={(checked) => onSelectOne(item.id, checked)}
                      onDelete={() => onDelete(item.id)}
                      onViewDetail={() => setSelectedSignalement(item)}
                      isDeleteLoading={isDeleteLoading}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun signalement trouvé</p>
              <p className="text-sm mt-1">
                {hasActiveFilters 
                  ? 'Modifiez vos filtres ou créez un nouveau signalement'
                  : 'Créez votre premier signalement'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détail signalement */}
      {selectedSignalement && (
        <SignalementModal 
          signalement={selectedSignalement}
          onClose={() => setSelectedSignalement(null)}
        />
      )}
    </>
  );
}

interface SignalementRowProps {
  signalement: SignalementWithRotation;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onViewDetail: () => void;
  isDeleteLoading: boolean;
}

function SignalementRow({
  signalement,
  isSelected,
  onSelect,
  onDelete,
  onViewDetail,
  isDeleteLoading
}: SignalementRowProps) {
  // État pour afficher le tooltip de rotation
  const [showRotationTooltip, setShowRotationTooltip] = useState(false);
  const [showPerteTooltip, setShowPerteTooltip] = useState(false);

  // Vraies données de rotation depuis le signalement étendu
  const signalementWithRotation = signalement as SignalementWithRotation;
  const rotation = signalementWithRotation.rotation;
  const hasRotation = !!rotation;
  const rotationValue = rotation ? Number(rotation.rotationMensuelle) : null;

  // 🆕 Calculer la perte financière
  const perteFinanciere = calculerPerteFinanciere(signalement);

  return (
    <tr 
      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <td className="py-4 px-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      
      <td className="py-4 px-4">
        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
          {signalement.codeBarres}
        </code>
      </td>
      
      <td className="py-4 px-4 font-medium">
        {signalement.quantite}
      </td>
      
      <td className="py-4 px-4">
        {new Date(signalement.datePeremption).toLocaleDateString('fr-FR')}
      </td>
      
      <td className="py-4 px-4">
        <StatusBadge status={signalement.status} />
      </td>
      
      {/* Colonne Rotation */}
      <td className="py-4 px-4 relative">
        <div 
          className="flex items-center gap-1"
          onMouseEnter={() => setShowRotationTooltip(true)}
          onMouseLeave={() => setShowRotationTooltip(false)}
        >
          {hasRotation ? (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 font-medium">{rotationValue}/mois</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>-</span>
            </div>
          )}
          
          {/* Tooltip rotation */}
          {showRotationTooltip && (
            <div className="absolute top-full left-0 mt-1 z-10 p-2 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap">
              {hasRotation 
                ? `Rotation mensuelle: ${rotationValue} unités`
                : 'Aucune rotation définie'
              }
            </div>
          )}
        </div>
      </td>
      
      {/* Colonne Urgence calculée */}
      <td className="py-4 px-4">
        {signalement.urgenceCalculee ? (
          <UrgencyDisplay 
            urgenceCalculee={signalement.urgenceCalculee as 'low' | 'medium' | 'high' | 'critical' | 'ecoulement'}
            showDetails={false}
          />
        ) : (
          <UrgencyBadge 
            datePeremption={signalement.datePeremption} 
            quantite={signalement.quantite} 
          />
        )}
      </td>
      
      {/* Colonne Probabilité écoulement */}
      <td className="py-4 px-4">
        {signalement.probabiliteEcoulement ? (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  Number(signalement.probabiliteEcoulement) >= 100 ? 'bg-cyan-500' :
                  Number(signalement.probabiliteEcoulement) >= 85 ? 'bg-green-500' :
                  Number(signalement.probabiliteEcoulement) >= 60 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Number(signalement.probabiliteEcoulement))}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${
              Number(signalement.probabiliteEcoulement) >= 100 ? 'text-cyan-700' :
              Number(signalement.probabiliteEcoulement) >= 85 ? 'text-green-700' :
              Number(signalement.probabiliteEcoulement) >= 60 ? 'text-orange-700' : 'text-red-700'
            }`}>
              {Number(signalement.probabiliteEcoulement).toFixed(0)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </td>
      
      {/* 🆕 Colonne Perte Financière */}
      <td className="py-4 px-4 relative">
        <div 
          className="flex items-center gap-1"
          onMouseEnter={() => setShowPerteTooltip(true)}
          onMouseLeave={() => setShowPerteTooltip(false)}
        >
          {perteFinanciere ? (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${getCouleurPerte(perteFinanciere.niveauPerte)}`}>
                {formaterMontantPerte(perteFinanciere.montantPerte)}
              </span>
              {perteFinanciere.niveauPerte === 'critical' && (
                <span className="text-red-600" title="Perte critique">⚠️</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
          
          {/* Tooltip perte financière */}
          {showPerteTooltip && perteFinanciere && (
            <div className="absolute top-full left-0 mt-1 z-10 p-2 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap">
              <div className="space-y-1">
                <div>Quantité perdue: {perteFinanciere.quantitePerdue.toFixed(1)} unités</div>
                <div>Prix unitaire: {rotation?.prixAchatUnitaire ? Number(rotation.prixAchatUnitaire).toFixed(2) : '?'}€</div>
                <div>Montant total: {formaterMontantPerte(perteFinanciere.montantPerte)}</div>
                <div className={`font-medium ${getCouleurPerte(perteFinanciere.niveauPerte)}`}>
                  Niveau: {perteFinanciere.niveauPerte}
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
      
      <td className="py-4 px-4 text-sm text-gray-600">
        {new Date(signalement.createdAt).toLocaleString('fr-FR')}
      </td>
      
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetail}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Voir détail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleteLoading}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}