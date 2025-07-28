// src/app/signalement/page.tsx - Version refactorisée
'use client';

import { useState } from 'react';
import { SignalementFormContainer } from '@/components/signalement/SignalementFormContainer';
import { SignalementList } from '@/components/signalement/SignalementList';
import { useSignalements, useCreateSignalement, useDeleteSignalement } from '@/hooks/useSignalements';

interface SignalementCreateData {
  codeBarres: string;
  quantite: number;
  datePeremption: string;
  commentaire?: string;
}

export default function SignalementPage() {
  const [clearTrigger, setClearTrigger] = useState(0);

  // Hooks React Query
  const { data: signalementsData, isLoading: isLoadingList, error: errorList } = useSignalements();
  const createMutation = useCreateSignalement();
  const deleteMutation = useDeleteSignalement();

  const signalements = signalementsData?.data || [];

  const handleSubmit = async (data: SignalementCreateData) => {
    try {
      await createMutation.mutateAsync(data);
      
      // Déclencher le clear de l'input
      setClearTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Erreur création signalement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce signalement ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="content py-8">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Signalement Produits
          </h1>
          <p className="text-gray-600">
            Scanner • Quantité • Date de péremption
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Formulaire */}
          <SignalementFormContainer
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            error={createMutation.error?.message || null}
            clearTrigger={clearTrigger}
          />

          {/* Historique */}
          <SignalementList
            signalements={signalements}
            isLoading={isLoadingList}
            error={errorList}
            onDelete={handleDelete}
            isDeleteLoading={deleteMutation.isPending}
          />

        </div>
      </div>
    </div>
  );
}