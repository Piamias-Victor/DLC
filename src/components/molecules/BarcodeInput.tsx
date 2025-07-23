// src/components/molecules/BarcodeInput.tsx
'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScanLine, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { ParsedCode } from '@/lib/types';
import { parseCode } from '@/lib/utils/codeParser';

interface BarcodeInputProps {
  onScan: (code: string, parsedData?: ParsedCode) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  label?: string;
  clearTrigger?: number; // Prop pour déclencher le clear
}

export const BarcodeInput = forwardRef<HTMLInputElement, BarcodeInputProps>(
  ({
    onScan,
    onError,
    placeholder = "Scannez ou tapez le code-barres...",
    autoFocus = true,
    className = "",
    label = "Code-Barres",
    clearTrigger = 0
  }, ref) => {
    
    const [value, setValue] = useState('');
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [parsedData, setParsedData] = useState<ParsedCode | null>(null);
    const [error, setError] = useState<string>('');
    const internalInputRef = useRef<HTMLInputElement>(null);

    // Expose la ref de l'input interne
    useImperativeHandle(ref, () => internalInputRef.current!, []);

    const validateAndParse = (code: string) => {
      if (!code.trim()) {
        setIsValid(null);
        setParsedData(null);
        setError('');
        return;
      }

      try {
        const parsed = parseCode(code.trim());
        setParsedData(parsed);
        setIsValid(true);
        setError('');
        onScan(code.trim(), parsed);
      } catch (err) {
        setIsValid(false);
        setError('Code invalide');
        onError?.(`Erreur de parsing: ${err}`);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      validateAndParse(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim() && isValid) {
        handleClear();
      }
    };

    const handleClear = () => {
      setValue('');
      setIsValid(null);
      setParsedData(null);
      setError('');
      internalInputRef.current?.focus();
    };

    const handleFocus = () => {
      internalInputRef.current?.select();
    };

    // Effect pour l'autofocus initial
    useEffect(() => {
      if (autoFocus && internalInputRef.current) {
        internalInputRef.current.focus();
      }
    }, [autoFocus]);

    // Effect pour vider l'input quand clearTrigger change
    useEffect(() => {
      if (clearTrigger > 0) {
        setValue('');
        setIsValid(null);
        setParsedData(null);
        setError('');
      }
    }, [clearTrigger]);

    const getCodeTypeConfig = (type: ParsedCode['codeType']) => {
      switch (type) {
        case 'EAN13':
          return { variant: 'primary' as const, label: 'EAN13' };
        case 'DATA_MATRIX':
          return { variant: 'info' as const, label: 'Data Matrix' };
        default:
          return { variant: 'default' as const, label: 'Inconnu' };
      }
    };

    const rightIcon = value ? (
      <button
        onClick={handleClear}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>
    ) : null;

    const leftIcon = <ScanLine className="w-5 h-5" />;

    return (
      <div className={`space-y-3 ${className}`}>
        <Input
          ref={internalInputRef}
          label={label}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          variant={isValid === false ? 'error' : isValid === true ? 'success' : 'default'}
          error={error}
          className="font-mono text-base"
        />

        {/* Status & Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {value.length > 0 
              ? `${value.length} caractères` 
              : 'En attente de scan...'
            }
          </span>
          
          <div className="flex items-center gap-2">
            {isValid === true && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            
            {isValid === false && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            
            {parsedData && (
              <Badge 
                variant={getCodeTypeConfig(parsedData.codeType).variant}
                size="sm"
              >
                {getCodeTypeConfig(parsedData.codeType).label}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BarcodeInput.displayName = 'BarcodeInput';