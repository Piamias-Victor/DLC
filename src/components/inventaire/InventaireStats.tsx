// src/components/inventaire/InventaireStats.tsx
'use client';

import { useState, useEffect } from 'react';
import { Package, Hash, Clock, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { INVENTAIRE_STATUS_CONFIG, INVENTAIRE_STATUS_COLORS } from '@/lib/constants/inventaire';
import type { InventaireWithItems, InventaireStatus } from '@/lib/types/inventaire';
import { useUpdateInventaire } from '@/hooks/useInventaire';

interface InventaireStatsProps {
  inventaire: InventaireWithItems & { stats?: any };
  realtime?: boolean;
}

export function InventaireStats({ inventaire, realtime = true }: InventaireStatsProps) {
  const updateMutation = useUpdateInventaire();
  
  const [isEditingNom, setIsEditingNom] = useState(false);
  const [editingNom, setEditingNom] = useState(inventaire.nom);
  const [timer, setTimer] = useState<string>('00:00:00');

  // Statistiques calculées
  const stats = inventaire.stats || {
    totalProduits: 0,
    totalQuantite: 0,
    totalItems: 0
  };

  // Timer en temps réel
  useEffect(() => {
    if (!realtime || inventaire.status !== 'EN_COURS') return;

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(inventaire.createdAt);
      const diffMs = now.getTime() - start.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      
      setTimer(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    // Mise à jour immédiate
    updateTimer();
    
    // Puis chaque seconde
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [inventaire.createdAt, inventaire.status, realtime]);

  // Timer statique pour inventaires terminés
  useEffect(() => {
    if (inventaire.status === 'TERMINE' && inventaire.finishedAt) {
      const start = new Date(inventaire.createdAt);
      const end = new Date(inventaire.finishedAt);
      const diffMs = end.getTime() - start.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      
      setTimer(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }
  }, [inventaire.createdAt, inventaire.finishedAt, inventaire.status]);

  // Sauvegarder le nom modifié
  const handleSaveNom = async () => {
    if (editingNom.trim() === inventaire.nom) {
      setIsEditingNom(false);
      return;
    }
    
    if (editingNom.trim().length < 3) {
      alert('Le nom doit contenir au moins 3 caractères');
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id: inventaire.id,
        data: { nom: editingNom.trim() }
      });
      setIsEditingNom(false);
    } catch (error) {
      console.error('Erreur modification nom:', error);
      alert('Erreur lors de la modification');
      setEditingNom(inventaire.nom); // Reset
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingNom(inventaire.nom);
    setIsEditingNom(false);
  };

  // Configuration du statut
  const statusConfig = INVENTAIRE_STATUS_CONFIG[inventaire.status];
  const statusColors = INVENTAIRE_STATUS_COLORS[statusConfig.color];

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        
        {/* Header avec nom et statut */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {isEditingNom ? (
              <div className="flex items-center gap-3 mb-2">
                <Input
                  value={editingNom}
                  onChange={(e) => setEditingNom(e.target.value)}
                  className="text-xl font-bold max-w-md"
                  maxLength={100}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNom();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveNom}
                  disabled={updateMutation.isPending}
                  className="text-green-600 hover:bg-green-50"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                  className="text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {inventaire.nom}
                </h1>
                {inventaire.status === 'EN_COURS' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNom(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            
            {inventaire.description && (
              <p className="text-gray-600">{inventaire.description}</p>
            )}
          </div>
          
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Timer */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {timer}
              </div>
              <div className="text-sm text-gray-600">
                {inventaire.status === 'EN_COURS' ? 'Temps écoulé' : 'Durée totale'}
              </div>
            </div>
          </div>

          {/* Produits distincts */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalProduits}
              </div>
              <div className="text-sm text-gray-600">
                Produits distincts
              </div>
            </div>
          </div>

          {/* Quantité totale */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Hash className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalQuantite}
              </div>
              <div className="text-sm text-gray-600">
                Unités comptées
              </div>
            </div>
          </div>

        </div>

        {/* Informations complémentaires */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Créé le {new Date(inventaire.createdAt).toLocaleString('fr-FR')}
            </div>
            
            {inventaire.status === 'TERMINE' && inventaire.finishedAt && (
              <div>
                Terminé le {new Date(inventaire.finishedAt).toLocaleString('fr-FR')}
              </div>
            )}
            
            {stats.totalItems > stats.totalProduits && (
              <div className="text-orange-600">
                {stats.totalItems - stats.totalProduits} scan(s) en doublon
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}