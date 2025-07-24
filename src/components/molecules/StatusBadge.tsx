// src/components/molecules/StatusBadge.tsx
import { Badge } from '../atoms/Badge';
import { STATUS_CONFIG, STATUS_COLORS } from '@/lib/constants/status';
import type { SignalementStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: SignalementStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const colors = STATUS_COLORS[config.color];
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}
      title={config.description}
    >
      {config.label}
    </span>
  );
}

// Composant pour le sélecteur de statut
interface StatusSelectorProps {
  currentStatus: SignalementStatus;
  onStatusChange: (newStatus: SignalementStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function StatusSelector({ 
  currentStatus, 
  onStatusChange, 
  disabled = false,
  className = '' 
}: StatusSelectorProps) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value as SignalementStatus)}
      disabled={disabled}
      className={`text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      {Object.values(STATUS_CONFIG).map((config) => (
        <option key={config.value} value={config.value}>
          {config.label}
        </option>
      ))}
    </select>
  );
}