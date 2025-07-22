'use client';

import { useState } from 'react';
import { ZebraScanner } from '@/components/molecules/ZebraScanner';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestScannerPage() {
  const [scannedCodes, setScannedCodes] = useState<{code: string, time: string}[]>([]);
  const [errors, setErrors] = useState<{error: string, time: string}[]>([]);

  const handleScan = (code: string) => {
    const time = new Date().toLocaleTimeString();
    setScannedCodes(prev => [{code, time}, ...prev.slice(0, 9)]);
  };

  const handleError = (error: string) => {
    const time = new Date().toLocaleTimeString();
    setErrors(prev => [{error, time}, ...prev.slice(0, 4)]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center py-6">
          <h1 className="text-3xl font-bold text-pharmacy-700 mb-2">
            Test Scanner Zebra
          </h1>
          <p className="text-gray-600">
            Test du scanner de code-barres Zebra intégré
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Scanner */}
          <div>
            <ZebraScanner
              onScan={handleScan}
              onError={handleError}
              autoStart={false}
            />
          </div>

          {/* Historique */}
          <div className="space-y-6">
            
            {/* Codes scannés */}
            {scannedCodes.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-500" />
                  Codes scannés ({scannedCodes.length})
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {scannedCodes.map((scan, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-green-50 rounded border"
                    >
                      <div>
                        <code className="font-mono text-pharmacy-700 text-lg block">
                          {scan.code}
                        </code>
                        <span className="text-xs text-gray-500">{scan.time}</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Erreurs */}
            {errors.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Erreurs ({errors.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {errors.map((err, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-red-50 rounded border border-red-200"
                    >
                      <p className="text-red-700 text-sm">{err.error}</p>
                      <span className="text-xs text-gray-500">{err.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {scannedCodes.length === 0 && errors.length === 0 && (
              <div className="card text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucun scan effectué</p>
                <p className="text-sm">Activez le scanner et scannez un code</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}