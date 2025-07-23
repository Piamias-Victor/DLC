// src/components/organisms/SignalementForm.tsx
'use client';

import { useState } from 'react';
import { Package, Calendar, Hash, Send, AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { BarcodeInput } from '../molecules/BarcodeInput';
import { Badge } from '../atoms/Badge';
import { ParsedCode } from '@/lib/types';

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
  className?: string;
}

export function SignalementForm({ 
  onSubmit, 
  onError, 
  isLoading = false,
  className = ""
}: SignalementFormProps) {
  const [formData, setFormData] = useState<SignalementData>({
    codeBarres: '',
    quantite: '',
    datePeremption: '',
    commentaire: ''
  });
  
  const [errors, setErrors] = useState<Partial<SignalementData>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Gérer le scan de code-barres
  const handleScan = (code: string, parsedData?: ParsedCode) => {
    let processedCode = code;
    let autoDate = formData.datePeremption;
    
    // Traitement spécial pour Data Matrix
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
      codeBarres: processedCode,
      datePeremption: autoDate
    }));
    
    // Clear error si il y en avait une
    if (errors.codeBarres) {
      setErrors(prev => ({ ...prev, codeBarres: undefined }));
    }
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<SignalementData> = {};
    
    if (!formData.codeBarres.trim()) {
      newErrors.codeBarres = 'Code-barres requis';
    }
    
    if (!formData.quantite.trim()) {
      newErrors.quantite = 'Quantité requise';
    } else if (parseInt(formData.quantite) <= 0) {
      newErrors.quantite = 'Quantité doit être > 0';
    }
    
    if (!formData.datePeremption) {
      newErrors.datePeremption = 'Date de péremption requise';
    } else {
      const today = new Date();
      const expDate = new Date(formData.datePeremption);
      if (expDate <= today) {
        newErrors.datePeremption = 'Date doit être future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onError?.('Veuillez corriger les erreurs du formulaire');
      return;
    }

    onSubmit(formData);
    
    // Reset form après succès
    setFormData({
      codeBarres: '',
      quantite: '',
      datePeremption: '',
      commentaire: ''
    });
    setErrors({});
    
    // Remettre le focus sur l'input de scan après délai court
    setTimeout(() => {
      const scanInput = document.querySelector('input[placeholder*="code-barres"]') as HTMLInputElement;
      scanInput?.focus();
    }, 100);
  };

  // Calculer l'urgence basée sur la date
  const calculateUrgency = () => {
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
  const isFormValid = formData.codeBarres.trim() && 
                      formData.quantite.trim() && 
                      parseInt(formData.quantite) > 0 && 
                      formData.datePeremption &&
                      Object.keys(errors).length === 0;

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardHeader
        title="Nouveau Signalement"
        subtitle="Produit à date courte détecté"
        icon={<Package className="w-6 h-6 text-blue-600" />}
        action={
          showSuccess && (
            <Badge variant="success" className="animate-scale-in">
              Code scanné ✓
            </Badge>
          )
        }
      />

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Scanner de code-barres */}
          <BarcodeInput
            onScan={handleScan}
            onError={onError}
            autoFocus={true}
          />
          
          {/* Code actuel affiché */}
          {formData.codeBarres && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-blue-600 uppercase">
                    Code produit
                  </span>
                  <div className="font-mono text-lg text-blue-900 mt-0.5">
                    {formData.codeBarres}
                  </div>
                </div>
                {urgency && (
                  <UrgencyIndicator level={urgency} />
                )}
              </div>
            </div>
          )}

          {/* Quantité et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantité"
              type="number"
              min="1"
              value={formData.quantite}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, quantite: e.target.value }));
                if (errors.quantite) {
                  setErrors(prev => ({ ...prev, quantite: undefined }));
                }
              }}
              leftIcon={<Hash className="w-4 h-4" />}
              placeholder="Ex: 15"
              error={errors.quantite}
            />

            <Input
              label="Date de péremption"
              type="date"
              value={formData.datePeremption}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, datePeremption: e.target.value }));
                if (errors.datePeremption) {
                  setErrors(prev => ({ ...prev, datePeremption: undefined }));
                }
              }}
              leftIcon={<Calendar className="w-4 h-4" />}
              error={errors.datePeremption}
            />
          </div>

          {/* Commentaire optionnel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={formData.commentaire}
              onChange={(e) => setFormData(prev => ({ ...prev, commentaire: e.target.value }))}
              placeholder="Informations complémentaires..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 resize-none"
            />
          </div>

          {/* Bouton de soumission */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            loadingText="Envoi en cours..."
            disabled={!isFormValid}
            className="w-full"
          >
            <Send className="w-4 h-4" />
            Envoyer le Signalement
          </Button>

          {/* Résumé rapide */}
          {isFormValid && (
            <div className="p-4 bg-gray-50 rounded-lg border animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 mb-1">Résumé du signalement</p>
                  <p className="text-gray-600">
                    {formData.quantite} unité(s) expire(nt) le{' '}
                    {new Date(formData.datePeremption).toLocaleDateString('fr-FR')}
                    {urgency && (
                      <span className="ml-2">
                        • Urgence: <UrgencyText level={urgency} />
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          
        </form>
      </CardContent>
    </Card>
  );
}

// Composants auxiliaires
interface UrgencyIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical';
}

function UrgencyIndicator({ level }: UrgencyIndicatorProps) {
  const configs = {
    low: { color: 'text-green-600', bg: 'bg-green-100', label: 'Faible' },
    medium: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Moyen' },
    high: { color: 'text-red-600', bg: 'bg-red-100', label: 'Élevé' },
    critical: { color: 'text-red-700', bg: 'bg-red-200', label: 'Critique' }
  };
  
  const config = configs[level];
  
  return (
    <div className={`px-2 py-1 rounded-full ${config.bg} ${config.color} text-xs font-medium`}>
      {config.label}
    </div>
  );
}

function UrgencyText({ level }: UrgencyIndicatorProps) {
  const labels = {
    low: 'faible',
    medium: 'moyenne', 
    high: 'élevée',
    critical: 'critique'
  };
  
  return <span className="font-medium">{labels[level]}</span>;
}