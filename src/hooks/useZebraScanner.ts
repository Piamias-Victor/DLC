import { useEffect, useCallback, useState } from 'react';

interface ZebraScannerOptions {
 onScan: (code: string) => void;
 onError?: (error: string) => void;
 minLength?: number; // Longueur minimum du code
 maxLength?: number; // Longueur maximum du code
 timeout?: number; // Timeout entre caractères (ms)
}

interface ZebraScannerState {
 isListening: boolean;
 lastScanned: string | null;
 scanCount: number;
}

export function useZebraScanner(options: ZebraScannerOptions) {
 const [state, setState] = useState<ZebraScannerState>({
   isListening: false,
   lastScanned: null,
   scanCount: 0
 });

 const [buffer, setBuffer] = useState('');
 const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
 const [lastInputValue, setLastInputValue] = useState('');

 const {
   onScan,
   onError,
   minLength = 8,
   maxLength = 20,
   timeout = 100
 } = options;

 // Traitement du buffer complet
 const processBuffer = useCallback((scannedCode: string) => {
   const cleanCode = scannedCode.trim();
   
   // Validation longueur
   if (cleanCode.length < minLength || cleanCode.length > maxLength) {
     onError?.(`Code invalide: longueur ${cleanCode.length} (attendu ${minLength}-${maxLength})`);
     return;
   }

   // Validation EAN13 si 13 caractères
   if (cleanCode.length === 13 && !/^\d{13}$/.test(cleanCode)) {
     onError?.('Code EAN13 invalide: doit contenir 13 chiffres');
     return;
   }

   setState(prev => ({
     ...prev,
     lastScanned: cleanCode,
     scanCount: prev.scanCount + 1
   }));

   onScan(cleanCode);
 }, [onScan, onError, minLength, maxLength]);

 // Gestion des événements clavier (méthode 1 - scan caractère par caractère)
 const handleKeyPress = useCallback((event: KeyboardEvent) => {
   if (!state.isListening) return;

   console.log('⌨️ Key pressed:', { key: event.key, code: event.code, target: event.target?.constructor?.name });

   // Enter = fin de scan
   if (event.key === 'Enter') {
     if (timeoutId) clearTimeout(timeoutId);
     
     if (buffer.length > 0) {
       processBuffer(buffer);
       setBuffer('');
     }
     return;
   }

   // Ignorer les touches de contrôle
   if (event.key.length > 1) return;

   // Ajouter au buffer
   const newBuffer = buffer + event.key;
   setBuffer(newBuffer);

   // Reset timeout
   if (timeoutId) clearTimeout(timeoutId);
   
   const newTimeoutId = setTimeout(() => {
     if (newBuffer.length >= minLength) {
       processBuffer(newBuffer);
     }
     setBuffer('');
   }, timeout);
   
   setTimeoutId(newTimeoutId);
 }, [state.isListening, buffer, timeoutId, timeout, processBuffer, minLength]);

 // Gestion des événements input (méthode 2 - scan direct dans input)
 const handleInputEvent = useCallback((event: Event) => {
   if (!state.isListening) return;
   
   const inputEvent = event as InputEvent;
   if (inputEvent.target && 'value' in inputEvent.target) {
     const target = inputEvent.target as HTMLInputElement;
     const value = target.value;
     
     console.log('📝 Input event:', { value, length: value.length, lastValue: lastInputValue });
     
     // Éviter les doublons et traiter seulement si nouveau contenu significatif
     if (value && value !== lastInputValue && value.length >= minLength) {
       setLastInputValue(value);
       processBuffer(value);
       
       // Clear l'input après traitement pour éviter accumulation
       setTimeout(() => {
         target.value = '';
         setLastInputValue('');
       }, 50);
     }
   }
 }, [state.isListening, lastInputValue, processBuffer, minLength]);

 // Gestion focus/paste pour certains modèles qui "collent" le code
 const handlePaste = useCallback((event: ClipboardEvent) => {
   if (!state.isListening) return;
   
   const pastedText = event.clipboardData?.getData('text');
   console.log('📋 Paste event:', { pastedText });
   
   if (pastedText && pastedText.length >= minLength) {
     event.preventDefault();
     processBuffer(pastedText);
   }
 }, [state.isListening, processBuffer, minLength]);

 // Démarrer l'écoute
 const startListening = useCallback(() => {
   console.log('🎯 Starting scanner listeners');
   setState(prev => ({ ...prev, isListening: true }));
   setBuffer('');
   setLastInputValue('');
   if (timeoutId) clearTimeout(timeoutId);
 }, [timeoutId]);

 // Arrêter l'écoute
 const stopListening = useCallback(() => {
   console.log('⏹️ Stopping scanner listeners');
   setState(prev => ({ ...prev, isListening: false }));
   setBuffer('');
   setLastInputValue('');
   if (timeoutId) {
     clearTimeout(timeoutId);
     setTimeoutId(null);
   }
 }, [timeoutId]);

 // Gestion des événements - MULTI-MÉTHODES pour compatibilité maximale
 useEffect(() => {
   if (state.isListening) {
     console.log('📡 Activating all scanner listeners');
     
     // Méthode 1: Scan caractère par caractère (anciens modèles)
     document.addEventListener('keypress', handleKeyPress);
     
     // Méthode 2: Scan direct dans input (nouveaux modèles)
     document.addEventListener('input', handleInputEvent);
     
     // Méthode 3: Paste automatique (certains modèles)
     document.addEventListener('paste', handlePaste);
     
     return () => {
       console.log('🔇 Removing all scanner listeners');
       document.removeEventListener('keypress', handleKeyPress);
       document.removeEventListener('input', handleInputEvent);
       document.removeEventListener('paste', handlePaste);
     };
   }
 }, [state.isListening, handleKeyPress, handleInputEvent, handlePaste]);

 // Cleanup
 useEffect(() => {
   return () => {
     if (timeoutId) clearTimeout(timeoutId);
   };
 }, [timeoutId]);

 return {
   ...state,
   buffer,
   startListening,
   stopListening,
   clearBuffer: () => {
     setBuffer('');
     setLastInputValue('');
   }
 };
}