// src/app/signalement/page.tsx
'use client';

import { useState } from 'react';
import { Package, Calendar, Hash } from 'lucide-react';

import { SignalementData, SignalementWithId } from '@/lib/types';
import { ParsedCode } from '@/lib/types';
import { Button } from '@/components/atoms/Button';
import { Card, CardHeader, CardContent } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { BarcodeInput } from '@/components/molecules/BarcodeInput';

export default function SignalementPage() {
  const [formData, setFormData] = useState<SignalementData>({
    codeBarres: '',
    quantite: '',
    datePeremption: '',
    commentaire: ''
  });
  
  const [historique, setHistorique] = useState<SignalementWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = (code: string, parsedData?: ParsedCode) => {
    let processedCode = code;
    let autoDate = formData.datePeremption;
    
    // Traitement Data Matrix
    if (parsedData?.codeType === 'DATA_MATRIX') {
      if (parsedData.gtin) {
        processedCode = parsedData.gtin;
      }
      if (parsedData.expirationDate) {
        autoDate = parsedData.expirationDate;
      }
    }
    
    setFormData(prev => ({ 
      ...prev, 
      codeBarres: processedCode,
      datePeremption: autoDate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codeBarres.trim() || !formData.quantite.trim() || 
        parseInt(formData.quantite) <= 0 || !formData.datePeremption) {
      return;
    }

    setIsLoading(true);
    
    // Simulation envoi
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newSignalement: SignalementWithId = {
      ...formData,
      id: `SIG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR')
    };

    setHistorique(prev => [newSignalement, ...prev]);
    
    // Reset form
    setFormData({
      codeBarres: '',
      quantite: '',
      datePeremption: '',
      commentaire: ''
    });
    
    setIsLoading(false);
  };

  const isFormValid = formData.codeBarres.trim() && 
                      formData.quantite.trim() && 
                      parseInt(formData.quantite) > 0 && 
                      formData.datePeremption;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="content py-8">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Signalement Produits
          </h1>
          <p className="text-gray-600">
            Scanner • Quantité • Date de péremption
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Formulaire */}
          <Card>
            <CardHeader
              title="Nouveau Signalement"
              icon={<Package className="w-6 h-6 text-blue-600" />}
            />

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Scanner */}
                <BarcodeInput
                  onScan={handleScan}
                  autoFocus={true}
                />
                
                {/* Code scanné */}
                {formData.codeBarres && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs font-medium text-blue-600 uppercase mb-1">
                      Code produit
                    </div>
                    <div className="font-mono text-lg text-blue-900">
                      {formData.codeBarres}
                    </div>
                  </div>
                )}

                {/* Quantité et Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Quantité"
                    type="number"
                    min="1"
                    value={formData.quantite}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, quantite: e.target.value }))}
                    leftIcon={<Hash className="w-4 h-4" />}
                    placeholder="Ex: 15"
                  />

                  <Input
                    label="Date de péremption"
                    type="date"
                    value={formData.datePeremption}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, datePeremption: e.target.value }))}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={!isFormValid}
                  className="w-full"
                >
                  Envoyer Signalement
                </Button>

              </form>
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader
              title={`Historique (${historique.length})`}
              subtitle="Signalements envoyés"
              icon={<Package className="w-6 h-6" />}
            />

            <CardContent>
              {historique.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historique.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                          {item.id}
                        </code>
                        <span className="text-sm text-gray-500">{item.timestamp}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Code:</span>
                          <div className="font-mono text-gray-900 mt-1">{item.codeBarres}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Quantité:</span>
                          <div className="font-medium text-gray-900 mt-1">{item.quantite}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Péremption:</span>
                          <div className="font-medium text-gray-900 mt-1">
                            {new Date(item.datePeremption).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun signalement</p>
                  <p className="text-sm">Scannez votre premier produit</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}