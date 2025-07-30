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

 // 🔧 CORRECTION: Bloquer TOUS les raccourcis clavier du navigateur
 const handleKeyPress = useCallback((event: KeyboardEvent) => {
   if (!state.isListening) return;

   console.log('⌨️ Key pressed:', { 
     key: event.key, 
     code: event.code,
     ctrlKey: event.ctrlKey,
     altKey: event.altKey,
     metaKey: event.metaKey,
     target: event.target?.constructor?.name 
   });

   // 🚨 BLOQUER ABSOLUMENT tous les raccourcis clavier du navigateur
   if (
     event.ctrlKey || 
     event.altKey || 
     event.metaKey || 
     event.shiftKey
   ) {
     console.log('🚫 Blocked browser shortcut:', event.key);
     event.preventDefault();
     event.stopPropagation();
     event.stopImmediatePropagation();
     return false;
   }

   // 🚫 FILTRAGE des caractères de contrôle
   const controlChars = [
     'Enter', 'Return', 'Tab', 'Escape', 'Backspace', 'Delete',
     'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
     'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'F1', 'F2', 'F3', 'F4', 'F5'
   ];

   // 🚫 Ignorer les caractères de contrôle ET les caractères \r, \n, \t
   if (
     controlChars.includes(event.key) || 
     event.key === '\r' || 
     event.key === '\n' || 
     event.key === '\t' ||
     event.key.length > 1 // Toute touche multi-caractères
   ) {
     // 🔥 IMPORTANTE: Empêcher la propagation pour éviter navigation
     event.preventDefault();
     event.stopPropagation();
     event.stopImmediatePropagation();
     
     // Si c'est Enter et qu'on a un buffer, traiter
     if (event.key === 'Enter' && buffer.length > 0) {
       if (timeoutId) clearTimeout(timeoutId);
       processBuffer(buffer);
       setBuffer('');
     }
     return false;
   }

   // ✅ Traiter SEULEMENT les caractères alphanumériques
   if (!/^[a-zA-Z0-9]$/.test(event.key)) {
     event.preventDefault();
     event.stopPropagation();
     return false;
   }

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

 // 🔧 CORRECTION: Input event avec meilleur filtrage
 const handleInputEvent = useCallback((event: Event) => {
   if (!state.isListening) return;
   
   const inputEvent = event as InputEvent;
   if (inputEvent.target && 'value' in inputEvent.target) {
     const target = inputEvent.target as HTMLInputElement;
     const value = target.value;
     
     console.log('📝 Input event:', { 
       value, 
       length: value.length, 
       lastValue: lastInputValue 
     });
     
     // 🔧 Nettoyer la valeur des caractères de contrôle
     const cleanValue = value.replace(/[\r\n\t]/g, '').trim();
     
     // Éviter les doublons et traiter seulement si nouveau contenu significatif
     if (cleanValue && cleanValue !== lastInputValue && cleanValue.length >= minLength) {
       setLastInputValue(cleanValue);
       processBuffer(cleanValue);
       
       // Clear l'input après traitement
       setTimeout(() => {
         target.value = '';
         setLastInputValue('');
       }, 50);
     }
   }
 }, [state.isListening, lastInputValue, processBuffer, minLength]);

 // 🔧 CORRECTION: Paste event avec nettoyage
 const handlePaste = useCallback((event: ClipboardEvent) => {
   if (!state.isListening) return;
   
   const pastedText = event.clipboardData?.getData('text');
   console.log('📋 Paste event:', { pastedText });
   
   if (pastedText) {
     // 🔧 Nettoyer le texte collé
     const cleanText = pastedText.replace(/[\r\n\t]/g, '').trim();
     
     if (cleanText.length >= minLength) {
       event.preventDefault();
       event.stopPropagation();
       processBuffer(cleanText);
     }
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

 // 🔧 CORRECTION: Événements optimisés avec capture maximale
 useEffect(() => {
   if (state.isListening) {
     console.log('📡 Activating all scanner listeners');
     
     // 🔥 TRIPLE PROTECTION: keydown, keyup ET keypress
     const eventOptions = { 
       capture: true, // Capturer en première phase
       passive: false // Permettre preventDefault
     };
     
     document.addEventListener('keydown', handleKeyPress, eventOptions);
     document.addEventListener('keyup', handleKeyPress, eventOptions);
     document.addEventListener('keypress', handleKeyPress, eventOptions);
     
     // Protection window level pour les raccourcis système
     window.addEventListener('keydown', handleKeyPress, eventOptions);
     
     // Méthode 2: Scan direct dans input (nouveaux modèles)
     document.addEventListener('input', handleInputEvent);
     
     // Méthode 3: Paste automatique (certains modèles)
     document.addEventListener('paste', handlePaste, eventOptions);
     
     return () => {
       console.log('🔇 Removing all scanner listeners');
       document.removeEventListener('keydown', handleKeyPress, eventOptions);
       document.removeEventListener('keyup', handleKeyPress, eventOptions);
       document.removeEventListener('keypress', handleKeyPress, eventOptions);
       window.removeEventListener('keydown', handleKeyPress, eventOptions);
       document.removeEventListener('input', handleInputEvent);
       document.removeEventListener('paste', handlePaste, eventOptions);
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