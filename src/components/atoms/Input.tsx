// src/components/ui/Input.tsx
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'success' | 'error';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    variant = 'default',
    className = '',
    ...props 
  }, ref) => {
    
    const baseClasses = 'w-full px-3 py-2.5 text-sm bg-white border rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors duration-200';
    
    const variants = {
      default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500'
    };
    
    const inputVariant = error ? 'error' : variant;
    const inputClasses = `${baseClasses} ${variants[inputVariant]} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`;
    
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600 animate-fade-in">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';