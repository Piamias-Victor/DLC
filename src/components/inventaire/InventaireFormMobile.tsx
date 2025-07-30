'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hash } from 'crypto';
import { CheckCircle, AlertCircle, Calendar, Plus } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';


interface InventaireFormMobileProps {
  inventaireId: string;
  onItemAdded: () => void;
  clearTrigger: number;
}

interface FormData {
  ean13: string;
  quantite: string;
  datePeremption: string;
}

const initialFormData: FormData = {
  ean13: '',
  quantite: '1',
  datePeremption: ''
};

export function InventaireFormMobile({ inventaireId, onItemAdded, clearTrigger }: InventaireFormMobileProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDoublon, setShowDoublon] = useState(false);
  const [isAutoValidating, setIsAutoValidating] = useState(false);
  
  // 🎯 SIMPLE: Un seul input invisible pour capturer les scans
  const scanInputRef = useRef<HTMLInputElement>(null);
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
      onItemAdded();
    },
    onError: (error) => {
      console.error('Erreur ajout item:', error);
      setIsAutoValidating(false);
    }
  });

  // Reset du formulaire
  const resetForm = useCallback(() => {
    setFormData({
      ean13: '',
      quantite: '1',
      datePeremption: ''
    });
    setErrors({});
    setIsAutoValidating(false);
    
    // 🎯 IMPORTANT: Refocus sur l'input de scan invisible
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 100);
  }, []);

  // 🎯 LOGIQUE PRINCIPALE: Traitement d'un code scanné
  const handleScan = useCallback(async (scannedCode: string) => {
    console.log('🔍 Code scanné:', scannedCode);
    
    // Nettoyer le code
    const cleanCode = scannedCode.trim();
    if (!cleanCode || cleanCode.length < 8) return;
    
    // CAS 1: Même code que celui en cours → Incrémenter quantité
    if (formData.ean13 === cleanCode) {
      const currentQuantite = parseInt(formData.quantite) || 0;
      const newQuantite = currentQuantite + 1;
      
      setFormData(prev => ({
        ...prev,
        quantite: newQuantite.toString()
      }));
      
      console.log('📈 Quantité incrémentée à:', newQuantite);
      return;
    }
    
    // CAS 2: Nouveau code ET on a déjà un code → Auto-valider l'ancien
    if (formData.ean13 && formData.ean13 !== cleanCode) {
      console.log('⚡ Auto-validation de:', formData.ean13);
      setIsAutoValidating(true);
      
      try {
        await addItemMutation.mutateAsync({
          ean13: formData.ean13,
          quantite: formData.quantite || '1',
          datePeremption: formData.datePeremption
        });
        // Le reset se fait dans onSuccess
      } catch (error) {
        console.error('Erreur auto-validation:', error);
        setIsAutoValidating(false);
      }
    }
    
    // CAS 3: Premier scan OU après validation → Nouveau code
    if (!isAutoValidating) {
      setFormData(prev => ({
        ...prev,
        ean13: cleanCode,
        quantite: '1'
      }));
      console.log('🆕 Nouveau code chargé:', cleanCode);
    }
    
  }, [formData.ean13, formData.quantite, formData.datePeremption, addItemMutation, isAutoValidating]);

  // 🎯 GESTION DE L'INPUT DE SCAN INVISIBLE
  const handleScanInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Le scanner envoie généralement tout d'un coup avec un Enter
    // On traite dès qu'on a assez de caractères
    if (value.length >= 8) {
      handleScan(value);
      // Vider l'input invisible
      e.target.value = '';
    }
  }, [handleScan]);

  // 🎯 GESTION DU ENTER DANS L'INPUT DE SCAN
  const handleScanInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value;
      if (value.length >= 8) {
        handleScan(value);
        (e.target as HTMLInputElement).value = '';
      }
    }
  }, [handleScan]);

  // Mise à jour des champs normaux
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validation manuelle (bouton)
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

  // Focus automatique sur l'input de scan au démarrage et après reset
  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  // Reset sur clearTrigger externe
  useEffect(() => {
    if (clearTrigger > 0) {
      resetForm();
    }  
  }, [clearTrigger, resetForm]);

  return (
    <div className="space-y-4">
      
      {/* 🎯 INPUT INVISIBLE POUR CAPTURER LES SCANS */}
      <input
        ref={scanInputRef}
        type="text"
        onChange={handleScanInputChange}
        onKeyDown={handleScanInputKeyDown}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        autoComplete="off"
        tabIndex={-1}
      />
      
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

      {isAutoValidating && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <div className="w-4 h-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-blue-800 text-sm font-medium">
            Validation automatique en cours...
          </span>
        </div>
      )}

      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Code scanné affiché */}
        {formData.ean13 ? (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-blue-600 uppercase">
                  Code produit
                </span>
                <div className="font-mono text-lg text-blue-900 mt-1">
                  {formData.ean13}
                </div>
              </div>
              {urgency && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  urgency === 'critical' ? 'bg-red-100 text-red-700' :
                  urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                  urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {urgency === 'critical' ? 'CRITIQUE' :
                   urgency === 'high' ? 'ÉLEVÉ' :
                   urgency === 'medium' ? 'MOYEN' : 'BON'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <span className="text-gray-500 text-sm">
              📱 Scannez un produit pour commencer
            </span>
          </div>
        )}

        {/* Champs de saisie */}
        <div className="space-y-3">
          <Input
            ref={quantiteInputRef}
            label="Quantité"
            type="number"
            min="1"
            max="9999"
            value={formData.quantite}
            onChange={(e) => updateField('quantite', e.target.value)}
            // leftIcon={<Hash className="w-4 h-4" />}
            error={errors.quantite}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                dateInputRef.current?.focus();
              }
            }}
            onBlur={() => {
              // 🎯 IMPORTANT: Refocus sur le scan après édition manuelle
              setTimeout(() => {
                scanInputRef.current?.focus();
              }, 100);
            }}
            className={parseInt(formData.quantite) > 1 ? '!ring-2 !ring-green-300' : ''}
          />

          <Input
            ref={dateInputRef}
            label="Date péremption (optionnelle)"
            type="date"
            value={formData.datePeremption}
            onChange={(e) => updateField('datePeremption', e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.datePeremption}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
            onBlur={() => {
              // 🎯 IMPORTANT: Refocus sur le scan après édition manuelle
              setTimeout(() => {
                scanInputRef.current?.focus();
              }, 100);
            }}
          />
        </div>

        {/* Bouton de validation */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={addItemMutation.isPending || isAutoValidating}
          disabled={!formData.ean13.trim() || !formData.quantite.trim()}
          className="w-full"
          onClick={() => {
            // 🎯 IMPORTANT: Refocus sur le scan après validation manuelle
            setTimeout(() => {
              scanInputRef.current?.focus();
            }, 200);
          }}
        >
          <Plus className="w-4 h-4" />
          {formData.datePeremption ? 'Ajouter + Signaler' : 'Ajouter'}
        </Button>

        {addItemMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {addItemMutation.error.message}
          </div>
        )}

      </form>

      {/* Instructions claires */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">📱 Mode scanner :</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Scannez directement</strong> - Pas besoin de cliquer nulle part</li>
          <li>• <strong>Même code 2x</strong> - Quantité passe à 2</li>
          <li>• <strong>Nouveau code</strong> - Valide l ancien automatiquement</li>
          <li>• <strong>Édition manuelle</strong> - Cliquez sur Quantité pour modifier</li>
        </ul>
      </div>

    </div>
  );
}