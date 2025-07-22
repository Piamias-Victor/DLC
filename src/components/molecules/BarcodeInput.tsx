'use client';

import { useState, useRef, useEffect } from 'react';
import { ScanLine, X, Check } from 'lucide-react';

interface BarcodeInputProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  minLength?: number;
  maxLength?: number;
  className?: string;
}

export function BarcodeInput({
  onScan,
  onError,
  placeholder = "Scannez ou tapez le code-barres...",
  autoFocus = true,
  minLength = 8,
  maxLength = 20,
  className = ""
}: BarcodeInputProps) {
  
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validation du code
  const validateCode = (code: string): boolean => {
    const clean = code.trim();
    
    if (clean.length < minLength || clean.length > maxLength) {
      onError?.(`Code invalide: ${clean.length} caractères (attendu ${minLength}-${maxLength})`);
      return false;
    }

    // Validation EAN13 si 13 caractères
    if (clean.length === 13 && !/^\d{13}$/.test(clean)) {
      onError?.('Code EAN13 invalide: doit contenir 13 chiffres');
      return false;
    }

    return true;
  };

  // Gestion changement valeur
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Validation temps réel
    if (newValue.length >= minLength) {
      const valid = validateCode(newValue);
      setIsValid(valid);
    } else {
      setIsValid(null);
    }
  };

  // Gestion Enter (scan terminé)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      const code = value.trim();
      
      if (validateCode(code)) {
        onScan(code);
        setValue(''); // Clear après scan réussi
        setIsValid(null);
      }
    }
  };

  // Bouton clear
  const handleClear = () => {
    setValue('');
    setIsValid(null);
    inputRef.current?.focus();
  };

  // Bouton validation manuelle
  const handleSubmit = () => {
    if (value.trim() && validateCode(value.trim())) {
      onScan(value.trim());
      setValue('');
      setIsValid(null);
    }
  };

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Re-focus si on clique ailleurs puis revient
  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select(); // Sélectionne tout le texte
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* Input principal */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <ScanLine className="w-5 h-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`
            w-full pl-12 pr-20 py-4 text-lg font-mono
            border-2 rounded-lg transition-all duration-200
            ${isValid === true ? 'border-green-500 bg-green-50' : ''}
            ${isValid === false ? 'border-red-500 bg-red-50' : ''}
            ${isValid === null ? 'border-gray-300 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20' : ''}
          `}
        />

        {/* Indicateurs droite */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {value && (
            <>
              {isValid === true && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {isValid === false && (
                <X className="w-5 h-5 text-red-500" />
              )}
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                type="button"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isValid === false}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Valider le Code
        </button>
        
        <button
          onClick={handleClear}
          className="btn-secondary px-6"
          type="button"
        >
          Clear
        </button>
      </div>

      {/* Info temps réel */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {value.length > 0 ? `${value.length} caractères` : 'En attente...'}
        </span>
        
        {value.length === 13 && (
          <span className="text-green-600 font-medium">
            Format EAN13 ✓
          </span>
        )}
      </div>

    </div>
  );
}