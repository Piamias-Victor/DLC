// src/components/signalement/CodeDisplay.tsx
import { UrgencyIndicator } from './UrgencyComponents';

interface CodeDisplayProps {
  codeBarres: string;
  urgency: 'low' | 'medium' | 'high' | 'critical' | null;
}

export function CodeDisplay({ codeBarres, urgency }: CodeDisplayProps) {
  if (!codeBarres) return null;

  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-blue-600 uppercase">
            Code produit
          </span>
          <div className="font-mono text-lg text-blue-900 mt-0.5">
            {codeBarres}
          </div>
        </div>
        {urgency && (
          <UrgencyIndicator level={urgency} />
        )}
      </div>
    </div>
  );
}