// src/app/api/inventaires/[id]/finish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { InventaireFinishSchema } from '@/lib/validations/inventaire';
import { z } from 'zod';

// POST /api/inventaires/[id]/finish - Finaliser un inventaire
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({})); // Body optionnel
    const { force = false } = InventaireFinishSchema.parse(body);

    console.log(`🏁 Finalisation inventaire: ${id} (force: ${force})`);

    // Vérifier que l'inventaire existe
    const inventaire = await prisma.inventaire.findUnique({
      where: { id },
      include: {
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

    // Vérifier que l'inventaire est EN_COURS
    if (inventaire.status !== 'EN_COURS') {
      return NextResponse.json(
        { error: 'Cet inventaire est déjà terminé' },
        { status: 409 }
      );
    }

    // Vérifier qu'il y a des items (sauf si force=true)
    if (inventaire._count.items === 0 && !force) {
      return NextResponse.json(
        { 
          error: 'Impossible de finaliser un inventaire vide',
          details: 'Ajoutez au moins un produit ou utilisez le paramètre force=true'
        },
        { status: 400 }
      );
    }

    // Finaliser l'inventaire
    const inventaireFinalise = await prisma.inventaire.update({
      where: { id },
      data: {
        status: 'TERMINE',
        finishedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        items: {
          orderBy: { ordre: 'desc' }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    // Calculer les statistiques finales
    const totalQuantite = inventaireFinalise.items.reduce((sum, item) => sum + item.quantite, 0);
    const produitsDistincts = new Set(inventaireFinalise.items.map(item => item.ean13)).size;
    const tempsEcoule = Math.floor((inventaireFinalise.finishedAt!.getTime() - inventaireFinalise.createdAt.getTime()) / 1000);

    console.log(`✅ Inventaire finalisé: "${inventaireFinalise.nom}"`, {
      produitsDistincts,
      totalQuantite,
      totalItems: inventaireFinalise._count.items,
      tempsEcoule: `${Math.floor(tempsEcoule / 3600)}h${Math.floor((tempsEcoule % 3600) / 60)}m`
    });

    return NextResponse.json({
      ...inventaireFinalise,
      stats: {
        totalProduits: produitsDistincts,
        totalQuantite,
        totalItems: inventaireFinalise._count.items,
        tempsEcoule
      },
      message: `Inventaire "${inventaireFinalise.nom}" finalisé avec succès`
    });

  } catch (error) {
    console.error('Erreur POST finish:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}