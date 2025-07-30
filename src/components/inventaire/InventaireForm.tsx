// src/components/inventaire/InventaireForm.tsx - Avec date de péremption
'use client';

import { useState, useRef, useEffect } from 'react';
import { Hash, Plus, AlertCircle, CheckCircle, Undo, Calendar } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { BarcodeInput } from '../molecules/BarcodeInput';
import { useAddInventaireItem } from '@/hooks/useInventaire';
import { ParsedCode } from '@/lib/types';

interface InventaireFormProps {
  inventaireId: string;
  onItemAdded: () => void;
  clearTrigger: number;
  lastAddedItem?: any;
}

// 🆕 Interface étendue avec date de péremption
interface InventaireItemFormData {
  ean13: string;
  quantite: string;
  datePeremption: string; // 🆕 NOUVEAU: Date de péremption
}

export function InventaireForm({ 
  inventaireId, 
  onItemAdded, 
  clearTrigger,
  lastAddedItem 
}: InventaireFormProps) {
  const addItemMutation = useAddInventaireItem(inventaireId);
  const quantiteInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 🆕 État du formulaire avec date
  const [formData, setFormData] = useState<InventaireItemFormData>({
    ean13: '',
    quantite: '1',
    datePeremption: '' // 🆕 NOUVEAU
  });

  const [errors, setErrors] = useState<Partial<InventaireItemFormData>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDoublon, setShowDoublon] = useState(false);

  // Reset du formulaire lors du clearTrigger
  useEffect(() => {
    if (clearTrigger > 0) {
      setFormData({ ean13: '', quantite: '1', datePeremption: '' });
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
    let autoDate = formData.datePeremption;
    
    // 🆕 Traitement spécial pour Data Matrix avec date d'expiration
    if (parsedData?.codeType === 'DATA_MATRIX') {
      if (parsedData.gtin) {
        processedCode = parsedData.gtin;
      }
      if (parsedData.expirationDate) {
        autoDate = parsedData.expirationDate;
        console.log('📅 Date auto-détectée depuis Data Matrix:', autoDate);
      }
    }
    
    setFormData(prev => ({ 
      ...prev, 
      ean13: processedCode,
      datePeremption: autoDate
    }));
    
    // Clear error si il y en avait une
    if (errors.ean13) {
      setErrors(prev => ({ ...prev, ean13: undefined }));
    }
    
    // Focus logique : quantité si pas de date auto, sinon date si vide, sinon quantité
    setTimeout(() => {
      if (!autoDate) {
        quantiteInputRef.current?.focus();
      } else if (!formData.datePeremption) {
        dateInputRef.current?.focus();
      } else {
        quantiteInputRef.current?.focus();
      }
      quantiteInputRef.current?.select();
    }, 100);
  };

  // 🆕 Validation du formulaire avec date
  const validateForm = (): boolean => {
    const newErrors: Partial<InventaireItemFormData> = {};
    
    // Validation EAN13
    if (!formData.ean13.trim()) {
      newErrors.ean13 = 'Code-barres requis';
    } else if (formData.ean13.trim().length < 8) {
      newErrors.ean13 = 'Code trop court (minimum 8 caractères)';
    }
    
    // Validation quantité
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
    
    // 🆕 Validation date de péremption (optionnelle)
    if (formData.datePeremption) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(formData.datePeremption);
      expDate.setHours(0, 0, 0, 0);
      
      if (expDate <= today) {
        newErrors.datePeremption = 'Date doit être future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🆕 Soumission avec création de signalement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Préparation des données pour l'API
      const itemData = {
        ean13: formData.ean13.trim(),
        quantite: parseInt(formData.quantite),
        // 🆕 Passer la date pour créer le signalement
        datePeremption: formData.datePeremption || null
      };
      
      await addItemMutation.mutateAsync(itemData);
      
      // Reset du formulaire
      setFormData({ ean13: '', quantite: '1', datePeremption: '' });
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

  // 🆕 Calculer l'urgence basée sur la date
  const calculateUrgency = (): 'low' | 'medium' | 'high' | 'critical' | null => {
    if (!formData.datePeremption) return null;
    
    const today = new Date();
    const expDate = new Date(formData.datePeremption);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'critical';
    if (diffDays <= 15) return 'high';
    if (diffDays <= 30) return 'medium';
    return 'low';
  };

  const urgency = calculateUrgency();

  return (
    <div className="space-y-6">
      
      {/* Messages de feedback */}
      {showSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 text-sm font-medium">
            ✅ Produit ajouté à l inventaire + 🚨 Signalement créé !
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

        {/* Code actuel affiché avec urgence */}
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
              {urgency && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  urgency === 'critical' ? 'bg-red-100 text-red-700' :
                  urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                  urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {urgency === 'critical' ? 'CRITIQUE' :
                   urgency === 'high' ? 'ÉLEVÉ' :
                   urgency === 'medium' ? 'MOYEN' : 'FAIBLE'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quantité et Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                if (!formData.datePeremption) {
                  dateInputRef.current?.focus();
                } else {
                  handleSubmit(e);
                }
              }
            }}
          />

          {/* 🆕 Date de péremption */}
          <Input
            ref={dateInputRef}
            label="Date de péremption (optionnelle)"
            type="date"
            value={formData.datePeremption}
            onChange={(e) => updateField('datePeremption', e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.datePeremption}
            hint="Laissez vide si inconnue"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* 🆕 Résumé avec signalement */}
        {formData.ean13 && formData.quantite && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 mb-1">Actions à effectuer</p>
                <div className="space-y-1 text-gray-600">
                  <p>📦 <strong>Inventaire:</strong> {formData.quantite} unité(s) de {formData.ean13}</p>
                  {formData.datePeremption ? (
                    <p>🚨 <strong>Signalement:</strong> Créé automatiquement (expire le {new Date(formData.datePeremption).toLocaleDateString('fr-FR')})</p>
                  ) : (
                    <p>💡 <strong>Conseil:</strong> Ajoutez la date pour créer un signalement automatique</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={addItemMutation.isPending}
            loadingText="Traitement..."
            disabled={!formData.ean13.trim() || !formData.quantite.trim()}
            className="flex-1"
          >
            <Plus className="w-4 h-4" />
            {formData.datePeremption ? 'Ajouter + Signaler' : 'Ajouter à l\'Inventaire'}
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
          <p>💡 <strong>Workflow :</strong> Scanner → Quantité → Date (optionnelle) → Entrée</p>
          <p>🔄 <strong>Doublons :</strong> Les quantités sont automatiquement additionnées</p>
          <p>🚨 <strong>Signalement :</strong> Créé automatiquement si date de péremption renseignée</p>
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