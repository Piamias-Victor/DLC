'use client';

import { useState } from 'react';
import { BarcodeInput } from '@/components/molecules/BarcodeInput';
import { Package, Calendar, Hash, Send } from 'lucide-react';

interface SignalementData {
  codeBarres: string;
  quantite: string;
  datePeremption: string;
  commentaire?: string;
}

interface SignalementFormProps {
  onSubmit: (data: SignalementData) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export function SignalementForm({ onSubmit, onError, isLoading = false }: SignalementFormProps) {
  const [formData, setFormData] = useState<SignalementData>({
    codeBarres: '',
    quantite: '1',
    datePeremption: '',
    commentaire: ''
  });

  const handleScan = (code: string) => {
    setFormData(prev => ({ ...prev, codeBarres: code }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codeBarres.trim() || !formData.quantite.trim() || !formData.datePeremption) {
      onError?.('Tous les champs requis doivent être remplis');
      return;
    }

    onSubmit(formData);
    setFormData({ codeBarres: '', quantite: '1', datePeremption: '', commentaire: '' });
  };

  // Check si le formulaire est valide
  const isFormValid = formData.codeBarres.trim() && formData.quantite.trim() && formData.datePeremption;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-pharmacy-500" />
        <h2 className="text-xl font-semibold">Nouveau Signalement</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Scanner */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Code-Barres *</label>
          <BarcodeInput 
            onScan={handleScan} 
            onError={onError}
            key="barcode-input" 
          />
          {formData.codeBarres && (
            <div className="mt-2 p-2 bg-green-50 rounded border">
              <code className="text-green-800 font-mono">{formData.codeBarres}</code>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />Quantité *
            </label>
            <input
              type="text"
              value={formData.quantite}
              onChange={(e) => setFormData(prev => ({ ...prev, quantite: e.target.value }))}
              className="input-field"
              placeholder="Ex: 15"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />Date péremption *
            </label>
            <input
              type="date"
              value={formData.datePeremption}
              onChange={(e) => setFormData(prev => ({ ...prev, datePeremption: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full py-3 text-base font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-pharmacy-500 hover:bg-pharmacy-600 text-white"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline mr-2"></div>
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 inline mr-2" />
              Envoyer Signalement
            </>
          )}
        </button>

      </form>
    </div>
  );
}