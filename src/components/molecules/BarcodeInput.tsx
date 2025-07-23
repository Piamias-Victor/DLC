'use client';

import { useState, useRef, useEffect } from 'react';
import { ScanLine, X } from 'lucide-react';
import { parseCode, ParsedCode } from '@/lib/utils/codeParser';

interface BarcodeInputProps {
  onScan: (code: string, parsedData?: ParsedCode) => void;
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
  const [parsedData, setParsedData] = useState<ParsedCode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (newValue.trim()) {
      setIsValid(true);
      
      // Parser le code
      const parsed = parseCode(newValue.trim());
      setParsedData(parsed);
      
      // Envoyer le code + données parsées
      onScan(newValue.trim(), parsed);
    } else {
      setIsValid(null);
      setParsedData(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      setValue('');
      setIsValid(null);
      setParsedData(null);
    }
  };

  const handleClear = () => {
    setValue('');
    setIsValid(null);
    setParsedData(null);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const getTypeColor = (type: ParsedCode['codeType']) => {
    switch (type) {
      case 'EAN13': return 'text-blue-600';
      case 'DATA_MATRIX': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      
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
            ${isValid === null ? 'border-gray-300 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20' : ''}
          `}
        />

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

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {value.length > 0 ? `${value.length} caractères` : 'En attente de scan...'}
        </span>
        
        {parsedData && (
          <span className={`font-medium ${getTypeColor(parsedData.codeType)}`}>
            {parsedData.codeType} ✓
          </span>
        )}
      </div>

    </div>
  );
}