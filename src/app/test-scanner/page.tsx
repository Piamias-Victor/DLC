'use client';

import { useState } from 'react';
import { BarcodeInput } from '@/components/molecules/BarcodeInput';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestScannerPage() {
  const [scannedCodes, setScannedCodes] = useState<{code: string, time: string}[]>([]);
  const [errors, setErrors] = useState<{error: string, time: string}[]>([]);

  const handleScan = (code: string) => {
    const time = new Date().toLocaleTimeString();
    setScannedCodes(prev => [{code, time}, ...prev.slice(0, 9)]);
    console.log('Code scanné:', code);
  };

  const handleError = (error: string) => {
    const time = new Date().toLocaleTimeString();
    setErrors(prev => [{error, time}, ...prev.slice(0, 4)]);
    console.error('Erreur scan:', error);
  };

  const clearHistory = () => {
    setScannedCodes([]);
    setErrors([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center py-6">
          <h1 className="text-3xl font-bold text-pharmacy-700 mb-2">
            Scanner Zebra - Input Mode
          </h1>
          <p className="text-gray-600">
            L input reste focusé, scannez directement avec le Zebra
          </p>
        </header>

        {/* Scanner Input */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Scanner de Code-Barres</h2>
          <BarcodeInput
            onScan={handleScan}
            onError={handleError}
            placeholder="🔍 Scannez ou tapez le code-barres + Entrée..."
            autoFocus={true}
            minLength={8}
            maxLength={20}
          />
          
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Instructions:</strong> L input est auto-focusé. 
              Scannez avec le Zebra ou tapez manuellement puis appuyez sur Entrée.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Codes scannés */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                Codes Scannés ({scannedCodes.length})
              </h3>
              {scannedCodes.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            
            {scannedCodes.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {scannedCodes.map((scan, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200"
                  >
                    <div>
                      <code className="font-mono text-pharmacy-700 text-lg block">
                        {scan.code}
                      </code>
                      <span className="text-xs text-gray-500">{scan.time}</span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun code scanné</p>
                <p className="text-sm">Scannez votre premier code-barres</p>
              </div>
            )}
          </div>

          {/* Erreurs */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Erreurs ({errors.length})
            </h3>
            
            {errors.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {errors.map((err, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-red-50 rounded border border-red-200"
                  >
                    <p className="text-red-700 text-sm font-medium">{err.error}</p>
                    <span className="text-xs text-gray-500">{err.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune erreur</p>
              </div>
            )}
          </div>

        </div>

        {/* Stats */}
        {(scannedCodes.length > 0 || errors.length > 0) && (
          <div className="card bg-gray-50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{scannedCodes.length}</div>
                <div className="text-sm text-gray-500">Scans réussis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{errors.length}</div>
                <div className="text-sm text-gray-500">Erreurs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {((scannedCodes.length / (scannedCodes.length + errors.length)) * 100 || 0).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-500">Taux de réussite</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}