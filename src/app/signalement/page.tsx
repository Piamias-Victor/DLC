// src/app/signalement/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Package, Calendar, Hash, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardHeader, CardContent } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { BarcodeInput } from '@/components/molecules/BarcodeInput';
import { useSignalements, useCreateSignalement, useDeleteSignalement } from '@/lib/hooks/useSignalements';
import type { SignalementData, ParsedCode } from '@/lib/types';

export default function SignalementPage() {
  const [formData, setFormData] = useState<SignalementData>({
    codeBarres: '',
    quantite: '',
    datePeremption: '',
    commentaire: ''
  });
  
  const [shouldRefocus, setShouldRefocus] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Hooks React Query
  const { data: signalementsData, isLoading: isLoadingList, error: errorList } = useSignalements();
  const createMutation = useCreateSignalement();
  const deleteMutation = useDeleteSignalement();

  const signalements = signalementsData?.data || [];

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

    setShouldRefocus(true);
    
    try {
      await createMutation.mutateAsync({
        codeBarres: formData.codeBarres.trim(),
        quantite: parseInt(formData.quantite),
        datePeremption: formData.datePeremption, // Envoi string, transformation côté serveur
        commentaire: formData.commentaire?.trim() || undefined
      });
      
      // Reset form après succès
      setFormData({
        codeBarres: '',
        quantite: '',
        datePeremption: '',
        commentaire: ''
      });
      
      // Déclencher le clear de l'input
      setClearTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Erreur création signalement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce signalement ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  // Effect pour remettre le focus quand la mutation se termine
  useEffect(() => {
    if (!createMutation.isPending && shouldRefocus) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        setShouldRefocus(false);
      }, 200);
    }
  }, [createMutation.isPending, shouldRefocus]);

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
                {/* <BarcodeInput
                  ref={barcodeInputRef}
                  onScan={handleScan}
                  autoFocus={true}
                  clearTrigger={clearTrigger}
                />                 */}

<input 
  type="text" 
  placeholder="Test direct Zebra"
  onChange={(e) => console.log('Direct input:', e.target.value)}
  className="w-full p-2 border rounded"
/>
                {/* Quantité et Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Quantité"
                    type="number"
                    min="1"
                    value={formData.quantite}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, quantite: e.target.value }));
                    }}
                    leftIcon={<Hash className="w-4 h-4" />}
                    placeholder="Ex: 15"
                  />

                  <Input
                    label="Date de péremption"
                    type="date"
                    value={formData.datePeremption}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, datePeremption: e.target.value }));
                    }}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  />
                </div>

                {/* Commentaire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={formData.commentaire}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, commentaire: e.target.value }));
                    }}
                    placeholder="Informations complémentaires..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={createMutation.isPending}
                  disabled={!isFormValid}
                  className="w-full"
                >
                  Envoyer Signalement
                </Button>

                {/* Erreur */}
                {createMutation.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {createMutation.error.message}
                  </div>
                )}

              </form>
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader
              title={`Historique (${signalements.length})`}
              subtitle="Signalements enregistrés"
              icon={<Package className="w-6 h-6" />}
            />

            <CardContent>
              {isLoadingList ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-600">Chargement...</span>
                </div>
              ) : errorList ? (
                <div className="text-center py-12 text-red-600">
                  <p>Erreur de chargement</p>
                  <p className="text-sm">{errorList.message}</p>
                </div>
              ) : signalements.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {signalements.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                          {item.id}
                        </code>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleString('fr-FR')}
                          </span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

                      {item.commentaire && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-gray-600 text-sm">Commentaire:</span>
                          <p className="text-gray-900 text-sm mt-1">{item.commentaire}</p>
                        </div>
                      )}
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