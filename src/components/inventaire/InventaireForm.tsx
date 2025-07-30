'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Hash, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { UrgencyCalculator } from '@/lib/services/urgencyCalculator';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { BarcodeInput } from '../molecules/BarcodeInput';

interface InventaireFormProps {
  inventaireId: string;
  onItemAdded: () => void;
  clearTrigger: number;
}

interface FormData {
  ean13: string;
  quantite: string;
  datePeremption: string;
}

interface FormErrors {
  ean13?: string;
  quantite?: string;
  datePeremption?: string;
}

const initialFormData: FormData = {
  ean13: '',
  quantite: '1',
  datePeremption: ''
};

export function InventaireForm({ inventaireId, onItemAdded, clearTrigger }: InventaireFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [internalClearTrigger, setInternalClearTrigger] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDoublon, setShowDoublon] = useState(false);
  
  // 🆕 États pour la nouvelle logique
  const [previousCode, setPreviousCode] = useState<string>('');
  const [isAutoValidating, setIsAutoValidating] = useState(false);

  const quantiteInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Calculateur d'urgence simple
  const getUrgency = () => {
    if (!formData.datePeremption) return null;
    const today = new Date();
    const expDate = new Date(formData.datePeremption);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'critical';
    if (diffDays <= 15) return 'high';
    if (diffDays <= 30) return 'medium';
    return 'low';
  };

  const urgency = getUrgency();

  // Mutation pour ajouter un item
  const addItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/inventaires/${inventaireId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ean13: data.ean13,
          quantite: parseInt(data.quantite),
          datePeremption: data.datePeremption || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'ajout');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['inventaire-items', inventaireId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['inventaire-stats', inventaireId] 
      });

      if (data.isDuplicate) {
        setShowDoublon(true);
        setTimeout(() => setShowDoublon(false), 3000);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }

      resetForm();
      
      // Callback onItemAdded
      onItemAdded();
    },
    onError: (error) => {
      console.error('Erreur ajout item:', error);
    }
  });

  // 🆕 Fonction de reset du formulaire
  const resetForm = useCallback(() => {
    setFormData({
      ean13: '',
      quantite: '1',
      datePeremption: ''
    });
    setErrors({});
    setPreviousCode('');
    setInternalClearTrigger(prev => prev + 1);
    setIsAutoValidating(false);
  }, []);

  // 🆕 Auto-validation quand le code change
  const autoValidateIfNeeded = useCallback(async (newCode: string) => {
    if (previousCode && previousCode !== newCode && formData.ean13) {
      setIsAutoValidating(true);
      
      try {
        await addItemMutation.mutateAsync({
          ean13: previousCode,
          quantite: formData.quantite || '1',
          datePeremption: formData.datePeremption
        });
      } catch (error) {
        console.error('Erreur auto-validation:', error);
        setIsAutoValidating(false);
      }
    }
  }, [previousCode, formData, addItemMutation]);

  // 🆕 Gestion du scan avec logique améliorée
  const handleScan = useCallback(async (code: string) => {
    console.log('🔍 Scan reçu:', code);
    
    // Si c'est le même code que celui en cours
    if (formData.ean13 === code) {
      const currentQuantite = parseInt(formData.quantite) || 0;
      const newQuantite = currentQuantite + 1;
      
      setFormData(prev => ({
        ...prev,
        quantite: newQuantite.toString()
      }));
      
      console.log('📈 Quantité incrémentée:', newQuantite);
      return;
    }

    // Si c'est un nouveau code différent
    if (formData.ean13 && formData.ean13 !== code) {
      await autoValidateIfNeeded(code);
    }

    // Charger le nouveau code
    setFormData(prev => ({
      ...prev,
      ean13: code,
      quantite: '1'
    }));
    
    setPreviousCode(code);
    
    setTimeout(() => {
      quantiteInputRef.current?.focus();
    }, 100);
    
  }, [formData.ean13, formData.quantite, autoValidateIfNeeded]);

  // Mise à jour des champs
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validation manuelle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ean13.trim()) {
      setErrors({ ean13: 'Code-barres requis' });
      return;
    }

    if (!formData.quantite.trim() || parseInt(formData.quantite) < 1) {
      setErrors({ quantite: 'Quantité invalide' });
      return;
    }

    await addItemMutation.mutateAsync(formData);
  };

  // Reset sur clearTrigger
  useEffect(() => {
    if (clearTrigger > 0) {
      resetForm();
    }  
  }, [clearTrigger, resetForm]);

  return (
    <div className="space-y-6">
      
      {/* Messages de feedback */}
      {showSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 text-sm font-medium">
            Produit ajouté avec succès !
          </span>
        </div>
      )}

      {showDoublon && addItemMutation.data && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <div className="flex-1">
            <span className="text-orange-800 text-sm font-medium">
              {addItemMutation.data.message}
            </span>
          </div>
        </div>
      )}

      {isAutoValidating && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <div className="w-4 h-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-blue-800 text-sm font-medium">
            Validation automatique en cours...
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Scanner de code-barres */}
        <BarcodeInput
          onScan={handleScan}
          clearTrigger={internalClearTrigger}
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
              {urgency && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  urgency === 'critical' ? 'bg-red-100 text-red-700' :
                  urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                  urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {urgency === 'critical' ? 'CRITIQUE' :
                   urgency === 'high' ? 'ÉLEVÉ' :
                   urgency === 'medium' ? 'MOYEN' : 'BON'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Champs de saisie */}
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
            placeholder="Ex: 15"
            error={errors.quantite}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                dateInputRef.current?.focus();
              }
            }}
            className={parseInt(formData.quantite) > 1 ? 'ring-2 ring-green-300' : ''}
          />

          <Input
            ref={dateInputRef}
            label="Date de péremption"
            type="date"
            value={formData.datePeremption}
            onChange={(e) => updateField('datePeremption', e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.datePeremption}
            hint="Optionnelle - Pour créer un signalement"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={addItemMutation.isPending || isAutoValidating}
          disabled={!formData.ean13.trim() || !formData.quantite.trim()}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          {formData.datePeremption ? 'Ajouter + Créer Signalement' : 'Ajouter au Stock'}
        </Button>

        {addItemMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {addItemMutation.error.message}
          </div>
        )}

      </form>

      {/* Aide utilisateur */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Mode d emploi rapide :</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Même code plusieurs fois :</strong> Quantité s incrémente automatiquement</li>
          <li>• <strong>Nouveau code :</strong> Validation automatique de la ligne précédente</li>
          <li>• <strong>Bouton Ajouter :</strong> Validation manuelle possible à tout moment</li>
        </ul>
      </div>

    </div>
  );
}