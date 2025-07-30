// src/components/inventaire/InventaireItemsList.tsx
'use client';

import { useState } from 'react';
import { Package, Edit2, Trash2, Save, X, Hash } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import type { InventaireItem } from '@/lib/types/inventaire';
import { useUpdateInventaireItem, useDeleteInventaireItem } from '@/hooks/useInventaire';

interface InventaireItemsListProps {
  inventaireId: string;
  items: InventaireItem[];
  isLoading: boolean;
}

interface EditingItem {
  id: string;
  quantite: string;
}

export function InventaireItemsList({ 
  inventaireId, 
  items, 
  isLoading 
}: InventaireItemsListProps) {
  const updateItemMutation = useUpdateInventaireItem(inventaireId);
  const deleteItemMutation = useDeleteInventaireItem(inventaireId);
  
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  // Démarrer l'édition
  const startEdit = (item: InventaireItem) => {
    setEditingItem({
      id: item.id,
      quantite: item.quantite.toString()
    });
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingItem(null);
  };

  // Sauvegarder la modification
  const saveEdit = async () => {
    if (!editingItem) return;
    
    const newQuantite = parseInt(editingItem.quantite);
    
    if (isNaN(newQuantite) || newQuantite <= 0 || newQuantite > 9999) {
      alert('Quantité invalide (1-9999)');
      return;
    }
    
    try {
      await updateItemMutation.mutateAsync({
        itemId: editingItem.id,
        quantite: newQuantite
      });
      setEditingItem(null);
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('Erreur lors de la modification');
    }
  };

  // Supprimer un item
  const handleDelete = async (item: InventaireItem) => {
    if (confirm(`Supprimer ${item.ean13} (${item.quantite} unités) ?`)) {
      try {
        await deleteItemMutation.mutateAsync(item.id);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Détecter les doublons (même EAN13)
  const getItemCount = (ean13: string) => {
    return items.filter(item => item.ean13 === ean13).length;
  };

  // Calculer le total par EAN13
  const getTotalQuantite = (ean13: string) => {
    return items
      .filter(item => item.ean13 === ean13)
      .reduce((sum, item) => sum + item.quantite, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Produits Scannés" />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={`Produits Scannés (${items.length})`}
        subtitle="Derniers ajouts en premier"
        icon={<Package className="w-6 h-6" />}
      />
      
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                itemCount={getItemCount(item.ean13)}
                totalQuantite={getTotalQuantite(item.ean13)}
                isEditing={editingItem?.id === item.id}
                editingQuantite={editingItem?.quantite || ''}
                onEditQuantite={(value: string) => 
                  setEditingItem(prev => prev ? { ...prev, quantite: value } : null)
                }
                onStartEdit={() => startEdit(item)}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDelete={() => handleDelete(item)}
                isUpdateLoading={updateItemMutation.isPending}
                isDeleteLoading={deleteItemMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun produit scanné</p>
            <p className="text-sm mt-1">Commencez par scanner un code-barres</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant Item Row
interface ItemRowProps {
  item: InventaireItem;
  itemCount: number;
  totalQuantite: number;
  isEditing: boolean;
  editingQuantite: string;
  onEditQuantite: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isUpdateLoading: boolean;
  isDeleteLoading: boolean;
}

function ItemRow({
  item,
  itemCount,
  totalQuantite,
  isEditing,
  editingQuantite,
  onEditQuantite,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isUpdateLoading,
  isDeleteLoading
}: ItemRowProps) {
  const hasDoublons = itemCount > 1;
  
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      hasDoublons ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
    }`}>
      
      {/* Header avec code et temps */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
            {item.ean13}
          </code>
          
          {hasDoublons && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {itemCount}x scanné (total: {totalQuantite})
            </span>
          )}
        </div>
        
        <span className="text-xs text-gray-500">
          {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      {/* Quantité et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="1"
                max="9999"
                value={editingQuantite}
                onChange={(e) => onEditQuantite(e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
              />
              <span className="text-sm text-gray-600">unités</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-lg font-semibold text-gray-900">
                {item.quantite}
              </span>
              <span className="text-sm text-gray-600">unités</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveEdit}
                disabled={isUpdateLoading}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                disabled={isUpdateLoading}
                className="text-gray-600 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onStartEdit}
                disabled={isUpdateLoading || isDeleteLoading}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Modifier quantité"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isUpdateLoading || isDeleteLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}