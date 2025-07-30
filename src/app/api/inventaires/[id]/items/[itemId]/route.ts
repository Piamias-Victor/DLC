// src/app/api/inventaires/[id]/items/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { InventaireItemUpdateSchema } from '@/lib/validations/inventaire';
import { z } from 'zod';

// PUT /api/inventaires/[id]/items/[itemId] - Modifier quantité d'un item
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    const body = await request.json();
    const validatedData = InventaireItemUpdateSchema.parse(body);

    console.log(`📝 Modification item ${itemId} dans inventaire ${id}:`, validatedData);

    // Vérifier que l'inventaire existe et est modifiable
    const inventaire = await prisma.inventaire.findUnique({
      where: { id }
    });

    if (!inventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    if (inventaire.status !== 'EN_COURS') {
      return NextResponse.json(
        { error: 'Impossible de modifier un inventaire terminé' },
        { status: 403 }
      );
    }

    // Vérifier que l'item existe et appartient à cet inventaire
    const existingItem = await prisma.inventaireItem.findUnique({
      where: { id: itemId }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    if (existingItem.inventaireId !== id) {
      return NextResponse.json(
        { error: 'Ce produit n\'appartient pas à cet inventaire' },
        { status: 403 }
      );
    }

    // Mettre à jour la quantité
    const updatedItem = await prisma.inventaireItem.update({
      where: { id: itemId },
      data: {
        quantite: validatedData.quantite,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Item modifié: ${itemId} - ${existingItem.ean13} (${existingItem.quantite} → ${updatedItem.quantite})`);

    return NextResponse.json({
      ...updatedItem,
      message: `Quantité modifiée: ${existingItem.quantite} → ${updatedItem.quantite}`
    });

  } catch (error) {
    console.error('Erreur PUT item:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventaires/[id]/items/[itemId] - Supprimer un item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    
    console.log(`🗑️ Suppression item ${itemId} dans inventaire ${id}`);

    // Vérifier que l'inventaire existe et est modifiable
    const inventaire = await prisma.inventaire.findUnique({
      where: { id }
    });

    if (!inventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    if (inventaire.status !== 'EN_COURS') {
      return NextResponse.json(
        { error: 'Impossible de supprimer des produits d\'un inventaire terminé' },
        { status: 403 }
      );
    }

    // Vérifier que l'item existe et appartient à cet inventaire
    const existingItem = await prisma.inventaireItem.findUnique({
      where: { id: itemId }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    if (existingItem.inventaireId !== id) {
      return NextResponse.json(
        { error: 'Ce produit n\'appartient pas à cet inventaire' },
        { status: 403 }
      );
    }

    // Supprimer l'item
    await prisma.inventaireItem.delete({
      where: { id: itemId }
    });

    console.log(`✅ Item supprimé: ${itemId} - ${existingItem.ean13} (${existingItem.quantite})`);

    return NextResponse.json({
      success: true,
      message: `Produit ${existingItem.ean13} supprimé (${existingItem.quantite} unités)`
    });

  } catch (error) {
    console.error('Erreur DELETE item:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}