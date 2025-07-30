// src/app/inventaire/nouveau/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, FileText } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardHeader, CardContent } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import type { InventaireFormData } from '@/lib/types/inventaire';
import { useCreateInventaire } from '@/hooks/useInventaires';

export default function NouvelInventairePage() {
  const router = useRouter();
  const createMutation = useCreateInventaire();
  
  const [formData, setFormData] = useState<InventaireFormData>({
    nom: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<Partial<InventaireFormData>>({});

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<InventaireFormData> = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    } else if (formData.nom.trim().length < 3) {
      newErrors.nom = 'Le nom doit contenir au moins 3 caractères';
    } else if (formData.nom.trim().length > 100) {
      newErrors.nom = 'Le nom ne peut pas dépasser 100 caractères';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion du changement des champs
  const handleChange = (field: keyof InventaireFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const inventaire = await createMutation.mutateAsync({
        nom: formData.nom.trim(),
        description: formData.description?.trim() || undefined
      });
      
      // Redirection vers l'inventaire créé
      router.push(`/inventaire/${inventaire.id}`);
      
    } catch (error) {
      console.error('Erreur création inventaire:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header avec navigation */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouvel Inventaire
          </h1>
          <p className="text-gray-600">
            Créez un inventaire pour commencer le comptage de vos produits
          </p>
        </header>

        {/* Formulaire */}
        <Card>
          <CardHeader
            title="Informations de l'inventaire"
            icon={<Package className="w-6 h-6 text-blue-600" />}
          />
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Nom de l'inventaire */}
              <Input
                label="Nom de l'inventaire *"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Ex: Inventaire Vitamine Septembre 2025"
                leftIcon={<Package className="w-4 h-4" />}
                error={errors.nom}
                maxLength={100}
                autoFocus
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnelle)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Description ou notes sur cet inventaire..."
                    rows={4}
                    maxLength={500}
                    className="w-full pl-10 px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 resize-none"
                  />
                </div>
                
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1 animate-fade-in">
                    {errors.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Ajoutez des détails sur le contexte ou les objectifs de cet inventaire
                  </p>
                  <span className="text-xs text-gray-400">
                    {formData.description?.length || 0}/500
                  </span>
                </div>
              </div>

              {/* Informations importantes */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  📋 Informations importantes
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Un seul inventaire peut être EN_COURS à la fois</li>
                  <li>• Vous pourrez modifier le nom et la description plus tard</li>
                  <li>• L inventaire sera automatiquement daté et chronométré</li>
                  <li>• Les doublons seront automatiquement additionnés</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  Annuler
                </Button>
                
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createMutation.isPending}
                  loadingText="Création..."
                  disabled={!formData.nom.trim()}
                  className="flex-1"
                >
                  Créer l Inventaire
                </Button>
              </div>

              {/* Erreur générale */}
              {createMutation.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {createMutation.error.message}
                </div>
              )}

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}