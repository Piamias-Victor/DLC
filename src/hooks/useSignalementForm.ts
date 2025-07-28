// src/hooks/useSignalementForm.ts
import { useState, useEffect } from 'react';
import { ParsedCode, SignalementData } from '@/lib/types';

interface UseSignalementFormProps {
  onSubmit: (data: SignalementData) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
  clearTrigger?: number;
}

export function useSignalementForm({ 
  onSubmit, 
  onError, 
  isLoading = false,
  clearTrigger = 0 
}: UseSignalementFormProps) {
  const [formData, setFormData] = useState<SignalementData>({
    codeBarres: '',
    quantite: '',
    datePeremption: '',
    commentaire: ''
  });
  
  const [errors, setErrors] = useState<Partial<SignalementData>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [shouldRefocus, setShouldRefocus] = useState(false);
  const [lastProcessed, setLastProcessed] = useState('');

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

  // Calculer l'urgence basée sur la date
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

  // Soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onError?.('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setShouldRefocus(true);
    onSubmit(formData);
    
    // Reset form après succès
    resetForm();
  };

  // Reset du formulaire
  const resetForm = () => {
    setFormData({
      codeBarres: '',
      quantite: '',
      datePeremption: '',
      commentaire: ''
    });
    setErrors({});
    setLastProcessed('');
  };

  // Clear trigger externe
  useEffect(() => {
    if (clearTrigger > 0) {
      resetForm();
    }
  }, [clearTrigger]);

  // Mise à jour des champs
  const updateField = (field: keyof SignalementData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const urgency = calculateUrgency();
  const isFormValid: boolean = formData.codeBarres.trim() !== '' && 
                               formData.quantite.trim() !== '' && 
                               parseInt(formData.quantite) > 0 && 
                               formData.datePeremption !== '' &&
                               Object.keys(errors).length === 0;

  return {
    // État du formulaire
    formData,
    errors,
    showSuccess,
    shouldRefocus,
    urgency,
    isFormValid,
    
    // Actions
    handleScan,
    handleSubmit,
    updateField,
    resetForm,
    setShouldRefocus
  };
}