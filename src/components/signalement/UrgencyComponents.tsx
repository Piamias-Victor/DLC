// src/components/signalement/UrgencyComponents.tsx
interface UrgencyIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical';
}

export function UrgencyIndicator({ level }: UrgencyIndicatorProps) {
  const configs = {
    low: { color: 'text-green-600', bg: 'bg-green-100', label: 'Faible' },
    medium: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Moyen' },
    high: { color: 'text-red-600', bg: 'bg-red-100', label: 'Élevé' },
    critical: { color: 'text-red-700', bg: 'bg-red-200', label: 'Critique' }
  };
  
  const config = configs[level];
  
  return (
    <div className={`px-2 py-1 rounded-full ${config.bg} ${config.color} text-xs font-medium`}>
      {config.label}
    </div>
  );
}

export function UrgencyText({ level }: UrgencyIndicatorProps) {
  const labels = {
    low: 'faible',
    medium: 'moyenne', 
    high: 'élevée',
    critical: 'critique'
  };
  
  return <span className="font-medium">{labels[level]}</span>;
}