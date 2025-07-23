'use client';

import { useState } from 'react';
import { BarcodeInput } from '@/components/molecules/BarcodeInput';
import { Package, Calendar, Hash, Send } from 'lucide-react';
import { ParsedCode } from '@/lib/utils/codeParser';

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
    quantite: '0',
    datePeremption: '',
    commentaire: ''
  });

  const handleScan = (code: string, parsedData?: ParsedCode) => {
    // Parsing manuel si Data Matrix (> 13 caractères)
    if (code.length > 13) {
      let processedCode = code;
      let autoDate = '';
      
      // GTIN (AI 01)
      if (code.startsWith('01')) {
        processedCode = code.substring(2, 16);
      }
      
      // Date (AI 17)
      const dateMatch = code.match(/17(\d{6})/);
      if (dateMatch) {
        const yy = parseInt(dateMatch[1].substring(0, 2));
        const mm = dateMatch[1].substring(2, 4);
        const dd = dateMatch[1].substring(4, 6);
        const year = yy < 50 ? 2000 + yy : 1900 + yy;
        autoDate = `${year}-${mm}-${dd}`;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        codeBarres: processedCode,
        datePeremption: autoDate || prev.datePeremption
      }));
    } else {
      setFormData(prev => ({ ...prev, codeBarres: code }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codeBarres.trim() || !formData.quantite.trim() || 
        parseInt(formData.quantite) <= 0 || !formData.datePeremption) {
      onError?.('Tous les champs requis doivent être remplis (quantité > 0)');
      return;
    }

    onSubmit(formData);
    setFormData({ codeBarres: '', quantite: '0', datePeremption: '', commentaire: '' });
  };

  const isFormValid = formData.codeBarres.trim() && 
                      formData.quantite.trim() && 
                      parseInt(formData.quantite) > 0 && 
                      formData.datePeremption;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-pharmacy-500" />
        <h2 className="text-xl font-semibold">Nouveau Signalement</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Code-Barres *</label>
          <BarcodeInput onScan={handleScan} onError={onError} />
          {formData.codeBarres && (
            <div className="mt-2 p-2 bg-green-50 rounded border">
              <code className="text-green-800 font-mono text-sm">{formData.codeBarres}</code>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />Quantité *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantite}
              onChange={(e) => setFormData(prev => ({ ...prev, quantite: e.target.value }))}
              className="input-field"
              placeholder="Ex: 15"
            />
          </div>

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

        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full py-3 text-base font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-pharmacy-500 hover:bg-pharmacy-600 text-white"
        >
          {isLoading ? 'Envoi...' : (
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