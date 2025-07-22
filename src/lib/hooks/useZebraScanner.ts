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

  // Gestion des événements clavier
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!state.isListening) return;

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

  // Démarrer l'écoute
  const startListening = useCallback(() => {
    setState(prev => ({ ...prev, isListening: true }));
    setBuffer('');
    if (timeoutId) clearTimeout(timeoutId);
  }, [timeoutId]);

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    setState(prev => ({ ...prev, isListening: false }));
    setBuffer('');
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  // Gestion des événements
  useEffect(() => {
    if (state.isListening) {
      document.addEventListener('keypress', handleKeyPress);
      return () => document.removeEventListener('keypress', handleKeyPress);
    }
  }, [state.isListening, handleKeyPress]);

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
    clearBuffer: () => setBuffer('')
  };
}