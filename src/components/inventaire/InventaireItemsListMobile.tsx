// src/components/inventaire/InventaireItemsListMobile.tsx
'use client';

import { useState } from 'react';
import { X, Package, Hash, Edit2, Trash2, Save } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import type { InventaireItem } from '@/lib/types/inventaire';
import { useUpdateInventaireItem, useDeleteInventaireItem } from '@/hooks/useInventaire';

interface InventaireItemsListMobileProps {
  items: InventaireItem[];
  onClose: () => void;
  readonly?: boolean;
}

export function InventaireItemsListMobile({ 
  items, 
  onClose, 
  readonly = false 
}: InventaireItemsListMobileProps) {
  
  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produits scannés</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun produit scanné</p>
          </div>
        </div>
      </div>
    );
  }

  // Regrouper les doublons (même EAN13)
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.ean13]) {
      acc[item.ean13] = {
        ean13: item.ean13,
        totalQuantite: 0,
        items: []
      };
    }
    acc[item.ean13].totalQuantite += item.quantite;
    acc[item.ean13].items.push(item);
    return acc;
  }, {} as Record<string, { ean13: string; totalQuantite: number; items: InventaireItem[] }>);

  const groupedList = Object.values(groupedItems);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0 z-50">
      <div className="bg-white rounded-t-lg w-full max-w-md max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Produits scannés ({groupedList.length})
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Liste scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {groupedList.map((group) => (
            <ProductGroup
              key={group.ean13}
              group={group}
              readonly={readonly}
            />
          ))}
        </div>

        {/* Footer stats */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-900">{groupedList.length}</div>
              <div className="text-gray-600">Produits</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {groupedList.reduce((sum, group) => sum + group.totalQuantite, 0)}
              </div>
              <div className="text-gray-600">Unités</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{items.length}</div>
              <div className="text-gray-600">Scans</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Composant groupe de produits
interface ProductGroupProps {
  group: { ean13: string; totalQuantite: number; items: InventaireItem[] };
  readonly: boolean;
}

function ProductGroup({ group, readonly }: ProductGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantite, setEditQuantite] = useState(group.totalQuantite.toString());
  
  const updateMutation = useUpdateInventaireItem(group.items[0].inventaireId);
  const deleteMutation = useDeleteInventaireItem(group.items[0].inventaireId);

  const hasDoublons = group.items.length > 1;

  const handleSave = async () => {
    const newQuantite = parseInt(editQuantite);
    if (isNaN(newQuantite) || newQuantite <= 0) {
      alert('Quantité invalide');
      return;
    }

    try {
      // Pour simplifier, on modifie le premier item avec la nouvelle quantité totale
      await updateMutation.mutateAsync({
        itemId: group.items[0].id,
        quantite: newQuantite
      });
      
      // Si il y avait des doublons, on les supprime
      if (hasDoublons) {
        for (let i = 1; i < group.items.length; i++) {
          await deleteMutation.mutateAsync(group.items[i].id);
        }
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Supprimer ${group.ean13} ?`)) {
      try {
        // Supprimer tous les items de ce groupe
        for (const item of group.items) {
          await deleteMutation.mutateAsync(item.id);
        }
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${hasDoublons ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
      
      {/* Code EAN13 */}
      <div className="mb-3">
        <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
          {group.ean13}
        </code>
        {hasDoublons && (
          <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
            {group.items.length} scans
          </span>
        )}
      </div>

      {/* Quantité et actions */}
      <div className="flex items-center justify-between">
        
        {/* Quantité */}
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-400" />
          {isEditing ? (
            <input
              type="number"
              min="1"
              max="9999"
              value={editQuantite}
              onChange={(e) => setEditQuantite(e.target.value)}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span className="text-lg font-semibold text-gray-900">
              {group.totalQuantite}
            </span>
          )}
          <span className="text-sm text-gray-600">unités</span>
        </div>

        {/* Actions */}
        {!readonly && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="text-green-600 hover:bg-green-50"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditQuantite(group.totalQuantite.toString());
                  }}
                  className="text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Détail des scans si doublons */}
      {hasDoublons && (
        <div className="mt-3 pt-3 border-t border-orange-200">
          <div className="text-xs text-orange-700 space-y-1">
            {group.items.map((item, index) => (
              <div key={item.id} className="flex justify-between">
                <span>Scan #{index + 1}</span>
                <span>{item.quantite} unités</span>
                <span>{new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}