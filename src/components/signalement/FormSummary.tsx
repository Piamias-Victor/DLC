// src/components/signalement/FormSummary.tsx
import { AlertCircle } from 'lucide-react';
import { UrgencyText } from './UrgencyComponents';

interface FormSummaryProps {
  quantite: string;
  datePeremption: string;
  urgency: 'low' | 'medium' | 'high' | 'critical' | null;
  isFormValid: boolean;
}

export function FormSummary({ quantite, datePeremption, urgency, isFormValid }: FormSummaryProps) {
  if (!isFormValid) return null;

  return (
    <div className="p-4 bg-gray-50 rounded-lg border animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-gray-900 mb-1">Résumé du signalement</p>
          <p className="text-gray-600">
            {quantite} unité(s) expire(nt) le{' '}
            {new Date(datePeremption).toLocaleDateString('fr-FR')}
            {urgency && (
              <span className="ml-2">
                • Urgence: <UrgencyText level={urgency} />
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}