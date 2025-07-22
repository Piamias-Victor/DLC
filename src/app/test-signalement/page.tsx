'use client';

import { useState } from 'react';
import { SignalementForm } from '@/components/organisms/SignalementForm';
import { Package, Clock } from 'lucide-react';

interface SignalementData {
  codeBarres: string;
  quantite: string;
  datePeremption: string;
  commentaire?: string;
}

interface SignalementWithId extends SignalementData {
  id: string;
  timestamp: string;
}

export default function TestSignalementPage() {
  const [signalements, setSignalements] = useState<SignalementWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: SignalementData) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newSignalement: SignalementWithId = {
      ...data,
      id: `SIG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR')
    };

    setSignalements(prev => [newSignalement, ...prev.slice(0, 9)]);
    setIsLoading(false);
  };

  const handleError = (error: string) => {
    console.error('Erreur:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="text-center py-6">
          <h1 className="text-3xl font-bold text-pharmacy-700 mb-2">
            Test Formulaire Signalement
          </h1>
          <p className="text-gray-600">Scanner + Quantité + Date + Validation</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          
          <SignalementForm
            onSubmit={handleSubmit}
            onError={handleError}
            isLoading={isLoading}
          />

          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Signalements ({signalements.length})
            </h3>

            {signalements.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {signalements.map((sig) => (
                  <div key={sig.id} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{sig.id}</span>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Code:</span>
                        <code className="font-mono">{sig.codeBarres}</code>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantité:</span>
                        <span>{sig.quantite}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Péremption:</span>
                        <span>{new Date(sig.datePeremption).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{sig.timestamp}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucun signalement</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}