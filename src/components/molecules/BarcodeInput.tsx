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
   const [lastProcessed, setLastProcessed] = useState('');
   const internalInputRef = useRef<HTMLInputElement>(null);

   useImperativeHandle(ref, () => internalInputRef.current!, []);

   const validateAndParse = (code: string) => {
     if (!code.trim()) {
       setIsValid(null);
       setParsedData(null);
       setError('');
       return;
     }

     const cleanCode = code.trim();

     // Éviter le double traitement
     if (cleanCode === lastProcessed) return;
     setLastProcessed(cleanCode);

     try {
       const parsed = parseCode(cleanCode);
       setParsedData(parsed);
       setIsValid(true);
       setError('');
       onScan(cleanCode, parsed);
     } catch (err) {
       setIsValid(false);
       setError('Code invalide');
       onError?.(`Erreur de parsing: ${err}`);
     }
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const newValue = e.target.value;
     setValue(newValue);

     // Reset des états d'erreur si on efface
     if (!newValue.trim()) {
       setIsValid(null);
       setParsedData(null);
       setError('');
       setLastProcessed('');
       return;
     }

     // Auto-traitement si assez long (scan Zebra rapide)
     if (newValue.length >= 8) {
       // Délai court pour s'assurer que le scan est complet
       setTimeout(() => {
         validateAndParse(newValue);
       }, 50);
     }
   };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter' && value.trim()) {
       e.preventDefault();
       if (value.length >= 8) {
         validateAndParse(value);         
       }
     }
   };

   const handleClear = () => {
     setValue('');
     setIsValid(null);
     setParsedData(null);
     setError('');
     setLastProcessed('');
     internalInputRef.current?.focus();
   };

   const handleFocus = () => {
     // Sélectionner tout le texte au focus (pratique pour remplacement)
     internalInputRef.current?.select();
   };

   // Autofocus initial
   useEffect(() => {
     if (autoFocus && internalInputRef.current) {
       internalInputRef.current.focus();
     }
   }, [autoFocus]);

   // Clear trigger externe
   useEffect(() => {
     if (clearTrigger > 0) {
       setValue('');
       setIsValid(null);
       setParsedData(null);
       setError('');
       setLastProcessed('');
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
       tabIndex={-1}
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
         autoComplete="off"
         spellCheck={false}
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