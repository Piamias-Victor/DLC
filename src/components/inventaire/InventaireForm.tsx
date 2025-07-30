'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Hash, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
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

export function InventaireFormMobile({ inventaireId, onItemAdded, clearTrigger }: InventaireFormMobileProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDoublon, setShowDoublon] = useState(false);
  
  // 🆕 États pour la nouvelle logique
  const [previousCode, setPreviousCode] = useState<string>('');
  const [isAutoValidating, setIsAutoValidating] = useState(false);
  
  // 🆕 États pour capture globale des scans
  const [scanBuffer, setScanBuffer] = useState<string>('');
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);

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
      // Invalider le cache
      queryClient.invalidateQueries({ 
        queryKey: ['inventaire-items', inventaireId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['inventaire-stats', inventaireId] 
      });

      // Gestion des messages
      if (data.isDuplicate) {
        setShowDoublon(true);
        setTimeout(() => setShowDoublon(false), 3000);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }

      // 🆕 Reset du formulaire après validation
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
      quantite: '1', // Reset à 1
      datePeremption: ''
    });
    setErrors({});
    setPreviousCode('');
    setIsAutoValidating(false);
  }, []);

  // 🆕 Auto-validation quand le code change
  const autoValidateIfNeeded = useCallback(async (newCode: string) => {
    if (previousCode && previousCode !== newCode && formData.ean13) {
      setIsAutoValidating(true);
      
      try {
        // Valider la ligne précédente
        await addItemMutation.mutateAsync({
          ean13: previousCode,
          quantite: formData.quantite || '1',
          datePeremption: formData.datePeremption
        });
        
        // Le reset se fait dans onSuccess
      } catch (error) {
        console.error('Erreur auto-validation:', error);
        setIsAutoValidating(false);
      }
    }
  }, [previousCode, formData, addItemMutation]);

  // 🆕 Fonction de traitement des scans
  const processScan = useCallback(async (code: string) => {
    console.log('🔍 Scan traité:', code);
    
    // Si c'est le même code que celui en cours
    if (formData.ean13 === code) {
      // Incrémenter la quantité
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
      // Auto-valider la ligne actuelle
      await autoValidateIfNeeded(code);
    }

    // Charger le nouveau code
    setFormData(prev => ({
      ...prev,
      ean13: code,
      quantite: '1' // Reset à 1 pour le nouveau produit
    }));
    
    setPreviousCode(code);
    
  }, [formData.ean13, formData.quantite, autoValidateIfNeeded]);

  // 🆕 Capture globale des scans au niveau de la page
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      
      // Si c'est un champ input/textarea, ignorer (sauf si c'est clairement un scan)
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Détecter un scan : caractères rapides ou Enter après une séquence
      const isLikelyScan = timeDiff < 50 || (isScanning && timeDiff < 100);
      
      if (event.key === 'Enter') {
        // Si on a un buffer et qu'on était en train de scanner
        if (scanBuffer.length >= 8 && isScanning) {
          event.preventDefault();
          event.stopPropagation();
          
          // Valider le code scanné
          if (/^\d{8,}$/.test(scanBuffer)) {
            processScan(scanBuffer);
          }
          
          // Reset
          setScanBuffer('');
          setIsScanning(false);
        }
        return;
      }
      
      // Ignorer les touches de contrôle
      if (event.key.length > 1) return;
      
      // Si c'est dans un input ET que ce n'est pas un scan rapide, laisser faire
      if (isInputField && !isLikelyScan) {
        return;
      }
      
      // Si c'est un scan rapide, intercepter même dans les inputs
      if (isLikelyScan && isInputField) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Ajouter au buffer
      const newBuffer = scanBuffer + event.key;
      setScanBuffer(newBuffer);
      setIsScanning(true);
      setLastKeyTime(currentTime);
      
      // Reset automatique après timeout
      setTimeout(() => {
        setScanBuffer('');
        setIsScanning(false);
      }, 200);
    };

    // Ajouter l'écouteur global
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [scanBuffer, lastKeyTime, isScanning, processScan]);

  // Mise à jour des champs
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  // Reset sur clearTrigger externe
  useEffect(() => {
    if (clearTrigger > 0) {
      resetForm();
    }  
  }, [clearTrigger, resetForm]);

  return (
    <div className="space-y-4">
      
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

      {/* Indicateur d'auto-validation */}
      {isAutoValidating && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <div className="w-4 h-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-blue-800 text-sm font-medium">
            Validation automatique en cours...
          </span>
        </div>
      )}

      {/* 🆕 Indicateur de scan en cours */}
      {isScanning && scanBuffer.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <div className="w-4 h-4 animate-pulse bg-yellow-400 rounded-full"></div>
          <span className="text-yellow-800 text-sm font-medium">
            📱 Scan en cours: {scanBuffer}
          </span>
        </div>
      )}

      {/* Formulaire simplifié */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Code affiché (plus besoin de BarcodeInput complexe) */}
        {formData.ean13 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-blue-600 uppercase">
                  Code scanné
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
            // 🆕 Indicateur visuel si quantité > 1
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
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={addItemMutation.isPending || isAutoValidating}
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

      {/* 🆕 Instructions utilisateur */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Mode scanner :</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>📱 <strong>Scannez depuis n importe où</strong> - Pas besoin de cliquer dans un champ</li>
          <li>🔄 <strong>Même code plusieurs fois</strong> - Quantité s incrémente automatiquement</li>
          <li>⚡ <strong>Nouveau code</strong> - Validation automatique de la ligne précédente</li>
          <li>✋ <strong>Bouton Ajouter</strong> - Validation manuelle possible</li>
        </ul>
      </div>

    </div>
  );
}