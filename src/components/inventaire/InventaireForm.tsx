// src/components/inventaire/InventaireForm.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Hash, Plus, AlertCircle, CheckCircle, Undo } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { BarcodeInput } from '../molecules/BarcodeInput';
import { useAddInventaireItem } from '@/hooks/useInventaire';
import { ParsedCode } from '@/lib/types';
import { InventaireItemFormData } from '@/lib/types/inventaire';


interface InventaireFormProps {
  inventaireId: string;
  onItemAdded: () => void;
  clearTrigger: number;
  lastAddedItem?: any;
}

export function InventaireForm({ 
  inventaireId, 
  onItemAdded, 
  clearTrigger,
  lastAddedItem 
}: InventaireFormProps) {
  const addItemMutation = useAddInventaireItem(inventaireId);
  const quantiteInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<InventaireItemFormData>({
    ean13: '',
    quantite: '1'
  });

  const [errors, setErrors] = useState<Partial<InventaireItemFormData>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDoublon, setShowDoublon] = useState(false);

  // Reset du formulaire lors du clearTrigger
  useEffect(() => {
    if (clearTrigger > 0) {
      setFormData({ ean13: '', quantite: '1' });
      setErrors({});
      setShowSuccess(false);
      setShowDoublon(false);
    }
  }, [clearTrigger]);

  // Affichage des messages de succès/doublon
  useEffect(() => {
    if (addItemMutation.isSuccess && addItemMutation.data) {
      const response = addItemMutation.data;
      
      if (response.isDoublon) {
        setShowDoublon(true);
        setTimeout(() => setShowDoublon(false), 3000);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    }
  }, [addItemMutation.isSuccess, addItemMutation.data]);

  // Gestion du scan de code-barres
  const handleScan = (code: string, parsedData?: ParsedCode) => {
    let processedCode = code;
    
    // Traitement spécial pour Data Matrix
    if (parsedData?.codeType === 'DATA_MATRIX' && parsedData.gtin) {
      processedCode = parsedData.gtin;
    }
    
    setFormData(prev => ({ ...prev, ean13: processedCode }));
    
    // Clear error si il y en avait une
    if (errors.ean13) {
      setErrors(prev => ({ ...prev, ean13: undefined }));
    }
    
    // Focus sur quantité après scan
    setTimeout(() => {
      quantiteInputRef.current?.focus();
      quantiteInputRef.current?.select();
    }, 100);
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<InventaireItemFormData> = {};
    
    if (!formData.ean13.trim()) {
      newErrors.ean13 = 'Code-barres requis';
    } else if (formData.ean13.trim().length < 8) {
      newErrors.ean13 = 'Code trop court (minimum 8 caractères)';
    }
    
    if (!formData.quantite.trim()) {
      newErrors.quantite = 'Quantité requise';
    } else {
      const quantite = parseInt(formData.quantite);
      if (isNaN(quantite) || quantite <= 0) {
        newErrors.quantite = 'Quantité doit être > 0';
      } else if (quantite > 9999) {
        newErrors.quantite = 'Quantité maximum: 9999';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await addItemMutation.mutateAsync({
        ean13: formData.ean13.trim(),
        quantite: parseInt(formData.quantite)
      });
      
      // Reset du formulaire
      setFormData({ ean13: '', quantite: '1' });
      setErrors({});
      
      // Callback de succès
      onItemAdded();
      
    } catch (error) {
      console.error('Erreur ajout item:', error);
    }
  };

  // Mise à jour des champs
  const updateField = (field: keyof InventaireItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Messages de feedback */}
      {showSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 text-sm font-medium">
            Produit ajouté avec succès !
          </span>
        </div>
      )}

      {showDoublon && addItemMutation.data && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3 animate-slide-down">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <div className="flex-1">
            <span className="text-orange-800 text-sm font-medium">
              {addItemMutation.data.message}
            </span>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Scanner de code-barres */}
        <BarcodeInput
          onScan={handleScan}
          clearTrigger={clearTrigger}
          autoFocus={true}
          placeholder="Scannez ou tapez le code-barres..."
          label="Code-Barres EAN13"
        />

        {/* Code actuel affiché */}
        {formData.ean13 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-blue-600 uppercase">
                  Code produit
                </span>
                <div className="font-mono text-lg text-blue-900 mt-0.5">
                  {formData.ean13}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quantité */}
        <Input
          ref={quantiteInputRef}
          label="Quantité"
          type="number"
          min="1"
          max="9999"
          value={formData.quantite}
          onChange={(e) => updateField('quantite', e.target.value)}
          leftIcon={<Hash className="w-4 h-4" />}
          placeholder="1"
          error={errors.quantite}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(e);
            }
          }}
        />

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={addItemMutation.isPending}
            loadingText="Ajout..."
            disabled={!formData.ean13.trim() || !formData.quantite.trim()}
            className="flex-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter Produit
          </Button>
          
          {lastAddedItem && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              title="Annuler le dernier ajout"
              className="px-4"
            >
              <Undo className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Aide rapide */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Astuce :</strong> Après scan, appuyez sur Entrée pour valider</p>
          <p>🔄 <strong>Doublons :</strong> Les quantités seront automatiquement additionnées</p>
        </div>

        {/* Erreur générale */}
        {addItemMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {addItemMutation.error.message}
          </div>
        )}

      </form>
    </div>
  );
}