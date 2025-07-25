// src/components/molecules/BarcodeInput.tsx - Version simplifiée
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
  clearTrigger?: number;
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
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const internalInputRef = useRef<HTMLInputElement>(null);

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

    // SIMPLE : Juste l'événement input natif comme pour quantité
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setDebugInfo(prev => [...prev.slice(-3), `Change: "${newValue}" (${newValue.length})`]);
      setValue(newValue);
      
      // Auto-traitement si assez long (scan rapide)
      if (newValue.length >= 8) {
        validateAndParse(newValue);
      }
    };

    // Enter pour forcer le traitement
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      setDebugInfo(prev => [...prev.slice(-3), `Key: ${e.key}`]);
      
      if (e.key === 'Enter' && value.trim() && value.length >= 8) {
        validateAndParse(value);
        handleClear();
      }
    };

    const handleClear = () => {
      setValue('');
      setIsValid(null);
      setParsedData(null);
      setError('');
      setDebugInfo([]);
      internalInputRef.current?.focus();
    };

    // Autofocus
    useEffect(() => {
      if (autoFocus && internalInputRef.current) {
        internalInputRef.current.focus();
      }
    }, [autoFocus]);

    // Clear trigger
    useEffect(() => {
      if (clearTrigger > 0) {
        setValue('');
        setIsValid(null);
        setParsedData(null);
        setError('');
        setDebugInfo([]);
      }
    }, [clearTrigger]);

    const rightIcon = value ? (
      <button
        onClick={handleClear}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>
    ) : null;

    return (
      <div className={`space-y-3 ${className}`}>
        <Input
          ref={internalInputRef}
          label={label}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          leftIcon={<ScanLine className="w-5 h-5" />}
          rightIcon={rightIcon}
          variant={isValid === false ? 'error' : isValid === true ? 'success' : 'default'}
          error={error}
          className="font-mono text-base"
        />

        {/* Debug visuel */}
        {debugInfo.length > 0 && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p className="font-medium">Debug:</p>
            {debugInfo.map((info, i) => (
              <p key={i} className="text-gray-600">{info}</p>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {value.length > 0 ? `${value.length} caractères` : 'En attente...'}
          </span>
          
          <div className="flex items-center gap-2">
            {isValid === true && <CheckCircle className="w-4 h-4 text-green-500" />}
            {isValid === false && <AlertCircle className="w-4 h-4 text-red-500" />}
            {parsedData && (
              <Badge variant="primary" size="sm">
                {parsedData.codeType}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BarcodeInput.displayName = 'BarcodeInput';