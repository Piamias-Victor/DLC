// src/components/inventaire/InventaireFormMobile.tsx - Version épurée scanette
'use client';

import { useState, useRef, useEffect } from 'react';
import { Hash, Plus, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { BarcodeInput } from '../molecules/BarcodeInput';
import { useAddInventaireItem } from '@/hooks/useInventaire';
import { ParsedCode } from '@/lib/types';

interface InventaireFormMobileProps {
  inventaireId: string;
  onItemAdded: () => void;
  clearTrigger: number;
}

interface InventaireItemFormData {
  ean13: string;
  quantite: string;
  datePeremption: string;
}

export function InventaireFormMobile({ 
  inventaireId, 
  onItemAdded, 
  clearTrigger
}: InventaireFormMobileProps) {
  const addItemMutation = useAddInventaireItem(inventaireId);
  const quantiteInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<InventaireItemFormData>({
    ean13: '',
    quantite: '1',
    datePeremption: ''
  });

  const [errors, setErrors] = useState<Partial<InventaireItemFormData>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset du formulaire
  useEffect(() => {
    if (clearTrigger > 0) {
      setFormData({ ean13: '', quantite: '1', datePeremption: '' });
      setErrors({});
      setShowSuccess(false);
    }
  }, [clearTrigger]);

  // Message de succès
  useEffect(() => {
    if (addItemMutation.isSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  }, [addItemMutation.isSuccess]);

  // Gestion du scan
  const handleScan = (code: string, parsedData?: ParsedCode) => {
    let processedCode = code;
    let autoDate = formData.datePeremption;
    
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
      ean13: processedCode,
      datePeremption: autoDate
    }));
    
    if (errors.ean13) {
      setErrors(prev => ({ ...prev, ean13: undefined }));
    }
    
    // Focus sur quantité
    setTimeout(() => {
      quantiteInputRef.current?.focus();
      quantiteInputRef.current?.select();
    }, 100);
  };

  // Validation simple
  const validateForm = (): boolean => {
    const newErrors: Partial<InventaireItemFormData> = {};
    
    if (!formData.ean13.trim()) {
      newErrors.ean13 = 'Code requis';
    }
    
    if (!formData.quantite.trim() || parseInt(formData.quantite) <= 0) {
      newErrors.quantite = 'Quantité > 0';
    }
    
    if (formData.datePeremption) {
      const today = new Date();
      const expDate = new Date(formData.datePeremption);
      if (expDate <= today) {
        newErrors.datePeremption = 'Date future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const itemData = {
        ean13: formData.ean13.trim(),
        quantite: parseInt(formData.quantite),
        datePeremption: formData.datePeremption ? formData.datePeremption : null
      };
      
      await addItemMutation.mutateAsync(itemData);
      
      // Reset
      setFormData({ ean13: '', quantite: '1', datePeremption: '' });
      setErrors({});
      onItemAdded();
      
    } catch (error) {
      console.error('Erreur ajout item:', error);
    }
  };

  // Mise à jour champ
  const updateField = (field: keyof InventaireItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Calcul urgence simple
  const getUrgency = () => {
    if (!formData.datePeremption) return null;
    const today = new Date();
    const expDate = new Date(formData.datePeremption);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return { level: 'critical', label: 'CRITIQUE', color: 'text-red-600' };
    if (diffDays <= 15) return { level: 'high', label: 'ÉLEVÉ', color: 'text-orange-600' };
    if (diffDays <= 30) return { level: 'medium', label: 'MOYEN', color: 'text-yellow-600' };
    return { level: 'low', label: 'FAIBLE', color: 'text-green-600' };
  };

  const urgency = getUrgency();

  return (
    <div className="space-y-4">
      
      {/* Message succès */}
      {showSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 text-sm font-medium">
            ✅ Ajouté {addItemMutation.data?.signalement?.created ? '+ Signalement créé' : ''}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Scanner */}
        <BarcodeInput
          onScan={handleScan}
          clearTrigger={clearTrigger}
          autoFocus={true}
          placeholder="Scanner code-barres..."
          label="Code-Barres"
        />

        {/* Code affiché */}
        {formData.ean13 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-blue-900">
                {formData.ean13}
              </div>
              {urgency && (
                <span className={`text-xs font-medium ${urgency.color}`}>
                  {urgency.label}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quantité et Date */}
        <div className="space-y-3">
          <Input
            ref={quantiteInputRef}
            label="Quantité"
            type="number"
            min="1"
            max="9999"
            value={formData.quantite}
            onChange={(e) => updateField('quantite', e.target.value)}
            leftIcon={<Hash className="w-4 h-4" />}
            error={errors.quantite}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                dateInputRef.current?.focus();
              }
            }}
          />

          <Input
            ref={dateInputRef}
            label="Date péremption (optionnelle)"
            type="date"
            value={formData.datePeremption}
            onChange={(e) => updateField('datePeremption', e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.datePeremption}
            hint="Pour créer un signalement"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={addItemMutation.isPending}
          disabled={!formData.ean13.trim() || !formData.quantite.trim()}
          className="w-full"
        >
          <Plus className="w-4 h-4" />
          {formData.datePeremption ? 'Ajouter + Signaler' : 'Ajouter'}
        </Button>

        {/* Erreur */}
        {addItemMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {addItemMutation.error.message}
          </div>
        )}

      </form>
    </div>
  );
}