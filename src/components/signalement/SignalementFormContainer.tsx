// src/components/signalement/SignalementFormContainer.tsx
import { useState, useRef, useEffect } from 'react';
import { Package, Calendar, Hash, Send } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { BarcodeInput } from '../molecules/BarcodeInput';
import { CodeDisplay } from './CodeDisplay';
import { FormSummary } from './FormSummary';
import { useSignalementForm } from '@/hooks/useSignalementForm';
import type { SignalementData, ParsedCode } from '@/lib/types';

interface SignalementFormContainerProps {
  onSubmit: (data: SignalementCreateData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearTrigger: number;
}

interface SignalementCreateData {
  codeBarres: string;
  quantite: number;
  datePeremption: string;
  commentaire?: string;
}

export function SignalementFormContainer({ 
  onSubmit, 
  isLoading, 
  error,
  clearTrigger 
}: SignalementFormContainerProps) {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const {
    formData,
    errors,
    showSuccess,
    shouldRefocus,
    urgency,
    isFormValid,
    handleScan,
    updateField,
    setShouldRefocus
  } = useSignalementForm({
    onSubmit: async (data: SignalementData) => {
      await onSubmit({
        codeBarres: data.codeBarres.trim(),
        quantite: parseInt(data.quantite),
        datePeremption: data.datePeremption,
        commentaire: data.commentaire?.trim() || undefined
      });
    },
    onError: (error) => console.error(error),
    isLoading,
    clearTrigger
  });

  // Effect pour remettre le focus
  useEffect(() => {
    if (!isLoading && shouldRefocus) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        setShouldRefocus(false);
      }, 200);
    }
  }, [isLoading, shouldRefocus, setShouldRefocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    try {
      await onSubmit({
        codeBarres: formData.codeBarres.trim(),
        quantite: parseInt(formData.quantite),
        datePeremption: formData.datePeremption,
        commentaire: formData.commentaire?.trim() || undefined
      });
    } catch (err) {
      console.error('Erreur soumission:', err);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Nouveau Signalement"
        icon={<Package className="w-6 h-6 text-blue-600" />}
      />

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Scanner */}
          <BarcodeInput
            ref={barcodeInputRef}
            onScan={handleScan}
            autoFocus={true}
            clearTrigger={clearTrigger}
          />

          {/* Code affiché */}
          <CodeDisplay 
            codeBarres={formData.codeBarres}
            urgency={urgency}
          />

          {/* Quantité et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantité"
              type="number"
              min="1"
              value={formData.quantite}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateField('quantite', e.target.value);
              }}
              leftIcon={<Hash className="w-4 h-4" />}
              placeholder="Ex: 15"
              error={errors.quantite}
            />

            <Input
              label="Date de péremption"
              type="date"
              value={formData.datePeremption}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateField('datePeremption', e.target.value);
              }}
              leftIcon={<Calendar className="w-4 h-4" />}
              error={errors.datePeremption}
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
                updateField('commentaire', e.target.value);
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
            isLoading={isLoading}
            disabled={!isFormValid}
            className="w-full"
          >
            <Send className="w-4 h-4" />
            Envoyer Signalement
          </Button>

          {/* Résumé */}
          <FormSummary
            quantite={formData.quantite}
            datePeremption={formData.datePeremption}
            urgency={urgency}
            isFormValid={isFormValid}
          />

          {/* Erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

        </form>
      </CardContent>
    </Card>
  );
}