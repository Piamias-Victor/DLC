// src/app/api/inventaires/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { InventaireUpdateSchema } from '@/lib/validations/inventaire';
import { z } from 'zod';

// GET /api/inventaires/[id] - Détail inventaire avec tous ses items
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`🔍 Récupération inventaire: ${id}`);

    const inventaire = await prisma.inventaire.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { ordre: 'desc' } // Plus récent en premier
        },
        _count: {
          select: { items: true }
        }
      }
    });

    if (!inventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    // Calculer les statistiques
    const totalQuantite = inventaire.items.reduce((sum, item) => sum + item.quantite, 0);
    const produitsDistincts = new Set(inventaire.items.map(item => item.ean13)).size;

    console.log(`📊 Inventaire "${inventaire.nom}": ${produitsDistincts} produits, ${totalQuantite} unités`);

    return NextResponse.json({
      ...inventaire,
      stats: {
        totalProduits: produitsDistincts,
        totalQuantite,
        totalItems: inventaire.items.length
      }
    });

  } catch (error) {
    console.error('Erreur GET inventaire:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/inventaires/[id] - Modifier nom/description inventaire
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = InventaireUpdateSchema.parse(body);

    console.log(`📝 Modification inventaire: ${id}`, validatedData);

    // Vérifier que l'inventaire existe
    const existingInventaire = await prisma.inventaire.findUnique({
      where: { id }
    });

    if (!existingInventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'inventaire n'est pas archivé
    if (existingInventaire.status === 'ARCHIVE') {
      return NextResponse.json(
        { error: 'Impossible de modifier un inventaire archivé' },
        { status: 403 }
      );
    }

    // Mettre à jour
    const inventaire = await prisma.inventaire.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    console.log(`✅ Inventaire modifié: ${inventaire.id} - "${inventaire.nom}"`);

    return NextResponse.json(inventaire);

  } catch (error) {
    console.error('Erreur PUT inventaire:', error);
    
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

// DELETE /api/inventaires/[id] - Supprimer inventaire
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`🗑️ Suppression inventaire: ${id}`);

    // Vérifier que l'inventaire existe
    const existingInventaire = await prisma.inventaire.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    if (!existingInventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher la suppression si l'inventaire contient des items
    if (existingInventaire._count.items > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer un inventaire contenant des produits',
          details: `Cet inventaire contient ${existingInventaire._count.items} produits`
        },
        { status: 409 }
      );
    }

    // Supprimer l'inventaire (les items seront supprimés automatiquement grâce à onDelete: Cascade)
    await prisma.inventaire.delete({
      where: { id }
    });

    console.log(`✅ Inventaire supprimé: ${id}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur DELETE inventaire:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}