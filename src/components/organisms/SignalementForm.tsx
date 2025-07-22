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
    quantite: '1',
    datePeremption: '',
    commentaire: ''
  });

  const handleScan = (code: string, parsedData?: ParsedCode) => {
    console.log('🔍 Code scanné reçu:', code);
    console.log('📊 Données parsées reçues:', parsedData);
    
    // Si pas de données parsées, parser nous-mêmes
    if (!parsedData && code.length > 13) {
      console.log('🔧 Parsing manuel du code Data Matrix');
      
      let processedCode = code;
      let autoDate = '';
      
      // Extraction GTIN (AI 01) - 14 caractères après "01"
      if (code.startsWith('01')) {
        const gtin = code.substring(2, 16); // Position 2 à 15 (14 caractères)
        processedCode = gtin;
        console.log('📦 GTIN extrait:', gtin);
      }
      
      // Extraction manuelle de la date (AI 17)
      const dateMatch = code.match(/17(\d{6})/);
      if (dateMatch) {
        const dateStr = dateMatch[1]; // YYMMDD
        console.log('📅 Date trouvée:', dateStr);
        
        // Conversion YYMMDD vers YYYY-MM-DD
        const yy = parseInt(dateStr.substring(0, 2));
        const mm = dateStr.substring(2, 4);
        const dd = dateStr.substring(4, 6);
        const year = yy < 50 ? 2000 + yy : 1900 + yy;
        autoDate = `${year}-${mm}-${dd}`;
        
        console.log('📅 Date convertie:', autoDate);
      }
      
      // Auto-remplissage avec GTIN + date
      setFormData(prev => ({ 
        ...prev, 
        codeBarres: processedCode,
        datePeremption: autoDate || prev.datePeremption
      }));
      
      console.log('✅ GTIN:', processedCode, 'Date:', autoDate);
      return;
    }
    
    // Fonctionnement normal
    setFormData(prev => ({ ...prev, codeBarres: code }));
    
    // Auto-remplissage date si détectée dans Data Matrix
    if (parsedData?.expirationDate && parsedData.codeType === 'DATA_MATRIX') {
      console.log('📅 Auto-remplissage date:', parsedData.expirationDate);
      setFormData(prev => ({ 
        ...prev, 
        codeBarres: parsedData.processedCode || code,
        datePeremption: parsedData.expirationDate || prev.datePeremption
      }));
    }
    
    console.log('✅ Code mis à jour dans formData');
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
          <BarcodeInput onScan={handleScan} onError={onError} />
          {formData.codeBarres && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <code className="text-green-800 font-mono text-sm">{formData.codeBarres}</code>
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