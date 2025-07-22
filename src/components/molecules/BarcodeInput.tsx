'use client';

import { useState, useRef, useEffect } from 'react';
import { ScanLine, X } from 'lucide-react';

interface BarcodeInputProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function BarcodeInput({
  onScan,
  placeholder = "Scannez ou tapez le code-barres...",
  autoFocus = true,
  className = ""
}: BarcodeInputProps) {
  
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gestion changement valeur
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsValid(newValue.trim().length > 0 ? true : null);
    
    // 🚀 Enregistrement automatique dès qu'il y a du contenu
    if (newValue.trim()) {
      onScan(newValue.trim());
    }
  };

  // Gestion Enter (optionnel maintenant)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      const code = value.trim();
      onScan(code);
      setValue(''); // Clear après scan Enter
      setIsValid(null);
    }
  };

  // Bouton clear
  const handleClear = () => {
    setValue('');
    setIsValid(null);
    inputRef.current?.focus();
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
            w-full pl-12 pr-12 py-4 text-lg font-mono
            border-2 rounded-lg transition-all duration-200
            ${isValid === true ? 'border-green-500 bg-green-50' : ''}
            ${isValid === false ? 'border-red-500 bg-red-50' : ''}
            ${isValid === null ? 'border-gray-300 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20' : ''}
          `}
        />

        {/* Clear button */}
        {value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Info temps réel */}
      <div className="text-sm text-gray-500">
        {value.length > 0 ? `${value.length} caractères` : 'En attente de scan...'}
      </div>

    </div>
  );
}