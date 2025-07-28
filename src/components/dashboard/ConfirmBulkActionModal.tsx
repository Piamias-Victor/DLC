// src/components/dashboard/ConfirmBulkActionModal.tsx
import { AlertTriangle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { StatusBadge } from '../molecules/StatusBadge';
import { STATUS_CONFIG } from '@/lib/constants/status';
import type { SignalementStatus } from '@/lib/types';

interface ConfirmBulkActionModalProps {
  selectedCount: number;
  newStatus: SignalementStatus;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ConfirmBulkActionModal({
  selectedCount,
  newStatus,
  onConfirm,
  onCancel,
  isLoading
}: ConfirmBulkActionModalProps) {
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