// src/components/ui/Button.tsx
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    loadingText,
    children, 
    className = '',
    disabled,
    ...props 
  }, ref) => {
    
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      secondary: 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200 focus:ring-gray-500',
      ghost: 'bg-transparent text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50 focus:ring-gray-500',
      outline: 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
    
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {isLoading ? loadingText || children : children}
      </button>
    );
  }
);

Button.displayName = 'Button';