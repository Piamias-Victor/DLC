// src/components/dashboard/SignalementsTable.tsx - Version avec rotation
import { useState } from 'react';
import { Package, Eye, Trash2, TrendingUp, Info } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { StatusBadge } from '../molecules/StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { UrgencyDisplay, RotationInfo } from '../rotation/UrgencyDisplay';
import { SignalementModal } from './SignalementModal';
import { Signalement } from '@/lib/types';

// Import du type étendu
interface SignalementWithRotation extends Signalement {
  rotation?: {
    id: string;
    ean13: string;
    rotationMensuelle: number;
    derniereMAJ: string;
  } | null;
}

interface SignalementsTableProps {
  signalements: SignalementWithRotation[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  isDeleteLoading: boolean;
  hasActiveFilters: boolean;
}

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
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Quantité</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Péremption</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Rotation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Urgence calculée</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Prob. écoulement</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Créé le</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signalements.map((item) => (
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

  // Vraies données de rotation depuis le signalement étendu
  const signalementWithRotation = signalement as SignalementWithRotation;
  const rotation = signalementWithRotation.rotation;
  const hasRotation = !!rotation;
  const rotationValue = rotation ? Number(rotation.rotationMensuelle) : null;

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
            urgenceCalculee={signalement.urgenceCalculee as 'low' | 'medium' | 'high' | 'critical'}
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
                  Number(signalement.probabiliteEcoulement) >= 85 ? 'bg-green-500' :
                  Number(signalement.probabiliteEcoulement) >= 60 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Number(signalement.probabiliteEcoulement))}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {Number(signalement.probabiliteEcoulement).toFixed(0)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
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