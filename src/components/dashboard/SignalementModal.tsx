// src/components/dashboard/SignalementModal.tsx
import { Package, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { StatusBadge } from '../molecules/StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { Signalement } from '@/lib/types';

interface SignalementModalProps {
  signalement: Signalement;
  onClose: () => void;
}

export function SignalementModal({ signalement, onClose }: SignalementModalProps) {
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
                  <UrgencyBadge datePeremption={signalement.datePeremption} quantite={signalement.quantite} />
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