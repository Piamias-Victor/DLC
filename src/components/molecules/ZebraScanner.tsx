import { ScanLine, Play, Square, Zap, AlertCircle } from 'lucide-react';
import { useZebraScanner } from '@/lib/hooks/useZebraScanner';

interface ZebraScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  className?: string;
}

export function ZebraScanner({ 
  onScan, 
  onError, 
  autoStart = false, 
  className = '' 
}: ZebraScannerProps) {
  
  const {
    isListening,
    lastScanned,
    scanCount,
    buffer,
    startListening,
    stopListening,
    clearBuffer
  } = useZebraScanner({
    onScan,
    onError,
    minLength: 8,
    maxLength: 20,
    timeout: 150
  });

  // Auto-start si demandé
  if (autoStart && !isListening) {
    startListening();
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Status Scanner */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <h3 className="font-semibold">Scanner Zebra</h3>
          </div>
          
          <div className="text-sm text-gray-500">
            Scans: {scanCount}
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex gap-3">
          {!isListening ? (
            <button
              onClick={startListening}
              className="btn-primary flex-1"
            >
              <Play className="w-4 h-4 inline mr-2" />
              Activer Scanner
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="btn-secondary flex-1"
            >
              <Square className="w-4 h-4 inline mr-2" />
              Désactiver
            </button>
          )}
          
          {buffer && (
            <button
              onClick={clearBuffer}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Buffer en cours */}
      {buffer && isListening && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Scan en cours...</span>
          </div>
          <div className="bg-white p-3 rounded border font-mono text-lg">
            {buffer}
            <span className="animate-pulse">|</span>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {buffer.length} caractères • Appuyez sur Enter ou attendez 150ms
          </p>
        </div>
      )}

      {/* Dernier code scanné */}
      {lastScanned && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <ScanLine className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">Dernier scan</span>
          </div>
          <div className="bg-white p-3 rounded border-2 border-green-300">
            <code className="text-xl font-mono text-green-800">
              {lastScanned}
            </code>
          </div>
          <p className="text-xs text-green-600 mt-2">
            {lastScanned.length === 13 ? 'EAN13 valide ✅' : `${lastScanned.length} caractères`}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-gray-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Instructions Zebra :</p>
            <ul className="space-y-1 text-xs">
              <li>• Activez le scanner avec le bouton</li>
              <li>• Scannez un code-barres avec le Zebra</li>
              <li>• Le code apparaîtra automatiquement</li>
              <li>• Format accepté : 8-20 caractères</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}