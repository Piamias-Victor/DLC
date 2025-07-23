// src/components/ui/Badge.tsx
import { forwardRef } from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    variant = 'default',
    size = 'md',
    dot = false,
    className = '',
    children,
    ...props 
  }, ref) => {
    
    const baseClasses = 'inline-flex items-center font-medium rounded-full';
    
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-orange-100 text-orange-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-sky-100 text-sky-800'
    };
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-0.5 text-xs gap-1.5',
      lg: 'px-3 py-1 text-sm gap-2'
    };
    
    const dotColors = {
      default: 'bg-gray-400',
      primary: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-orange-500',
      error: 'bg-red-500',
      info: 'bg-sky-500'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
    
    return (
      <span
        ref={ref}
        className={classes}
        {...props}
      >
        {dot && (
          <div className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Badge spécialisé pour urgence
interface UrgencyBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
}

export function UrgencyBadge({ level, className = '' }: UrgencyBadgeProps) {
  const configs = {
    low: { variant: 'success' as const, label: 'FAIBLE', dot: true },
    medium: { variant: 'warning' as const, label: 'MOYEN', dot: true },
    high: { variant: 'error' as const, label: 'ÉLEVÉ', dot: true },
    critical: { variant: 'error' as const, label: 'CRITIQUE', dot: true }
  };
  
  const config = configs[level];
  
  return (
    <Badge 
      variant={config.variant} 
      dot={config.dot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}