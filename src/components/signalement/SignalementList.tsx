// src/components/signalement/SignalementList.tsx
import { Loader2, Trash2, Package } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { Signalement } from '@/lib/types';

interface SignalementListProps {
  signalements: Signalement[];
  isLoading: boolean;
  error: Error | null;
  onDelete: (id: string) => void;
  isDeleteLoading: boolean;
}

export function SignalementList({ 
  signalements, 
  isLoading, 
  error, 
  onDelete, 
  isDeleteLoading 
}: SignalementListProps) {
  return (
    <Card>
      <CardHeader
        title={`Historique (${signalements.length})`}
        subtitle="Signalements enregistrés"
        icon={<Package className="w-6 h-6" />}
      />

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p>Erreur de chargement</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : signalements.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {signalements.map((item) => (
              <SignalementItem
                key={item.id}
                signalement={item}
                onDelete={onDelete}
                isDeleteLoading={isDeleteLoading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun signalement</p>
            <p className="text-sm">Scannez votre premier produit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SignalementItemProps {
  signalement: Signalement;
  onDelete: (id: string) => void;
  isDeleteLoading: boolean;
}

function SignalementItem({ signalement, onDelete, isDeleteLoading }: SignalementItemProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <code className="text-sm font-mono bg-white px-2 py-1 rounded">
          {signalement.id}
        </code>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {new Date(signalement.createdAt).toLocaleString('fr-FR')}
          </span>
          <button
            onClick={() => onDelete(signalement.id)}
            disabled={isDeleteLoading}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Code:</span>
          <div className="font-mono text-gray-900 mt-1">{signalement.codeBarres}</div>
        </div>
        <div>
          <span className="text-gray-600">Quantité:</span>
          <div className="font-medium text-gray-900 mt-1">{signalement.quantite}</div>
        </div>
        <div>
          <span className="text-gray-600">Péremption:</span>
          <div className="font-medium text-gray-900 mt-1">
            {new Date(signalement.datePeremption).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {signalement.commentaire && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-gray-600 text-sm">Commentaire:</span>
          <p className="text-gray-900 text-sm mt-1">{signalement.commentaire}</p>
        </div>
      )}
    </div>
  );
}