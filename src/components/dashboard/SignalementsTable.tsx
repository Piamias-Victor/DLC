// src/components/dashboard/SignalementsTable.tsx
import { useState } from 'react';
import { Package, Eye, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { StatusBadge } from '../molecules/StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { SignalementModal } from './SignalementModal';
import { Signalement } from '@/lib/types';

interface SignalementsTableProps {
  signalements: Signalement[];
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
                          onChange={(e) => onSelectOne(item.id, e.target.checked)}
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
                        <UrgencyBadge datePeremption={item.datePeremption} quantite={item.quantite} />
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSignalement(item)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Voir détail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            disabled={isDeleteLoading}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
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