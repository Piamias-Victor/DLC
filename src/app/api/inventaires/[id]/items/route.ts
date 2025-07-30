// src/app/api/inventaires/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { InventaireItemCreateSchema } from '@/lib/validations/inventaire';
import { parseCode } from '@/lib/utils/codeParser';
import { z } from 'zod';

// GET /api/inventaires/[id]/items - Liste des items d'un inventaire
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`📦 Récupération items inventaire: ${id}`);

    // Vérifier que l'inventaire existe
    const inventaire = await prisma.inventaire.findUnique({
      where: { id }
    });

    if (!inventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les items triés par ordre décroissant (plus récent en premier)
    const items = await prisma.inventaireItem.findMany({
      where: { inventaireId: id },
      orderBy: { ordre: 'desc' }
    });

    console.log(`📊 Items trouvés: ${items.length}`);

    return NextResponse.json({
      data: items,
      inventaire: {
        id: inventaire.id,
        nom: inventaire.nom,
        status: inventaire.status
      }
    });

  } catch (error) {
    console.error('Erreur GET items:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/inventaires/[id]/items - Ajouter un item (avec gestion doublons)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = InventaireItemCreateSchema.parse(body);

    console.log(`➕ Ajout item inventaire ${id}:`, validatedData);

    // Vérifier que l'inventaire existe et est EN_COURS
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
        { error: 'Impossible d\'ajouter des produits à un inventaire terminé' },
        { status: 403 }
      );
    }

    // Normaliser le code EAN13
    let finalEan13 = validatedData.ean13;
    try {
      const parsedCode = parseCode(validatedData.ean13);
      if (parsedCode.gtin) {
        finalEan13 = parsedCode.gtin;
      }
    } catch (err) {
      console.warn('Parsing code failed, using original:', err);
    }

    console.log(`🔄 Code normalisé: "${validatedData.ean13}" → "${finalEan13}"`);

    // 🔥 GESTION DES DOUBLONS - Addition automatique
    const existingItem = await prisma.inventaireItem.findFirst({
      where: { 
        inventaireId: id,
        ean13: finalEan13
      }
    });

    let item;
    let isDoublon = false;
    let previousQuantite = 0;

    if (existingItem) {
      // DOUBLON DÉTECTÉ - Addition des quantités
      isDoublon = true;
      previousQuantite = existingItem.quantite;
      const newQuantite = existingItem.quantite + validatedData.quantite;

      console.log(`🔄 Doublon détecté: ${finalEan13}, ${previousQuantite} + ${validatedData.quantite} = ${newQuantite}`);

      item = await prisma.inventaireItem.update({
        where: { id: existingItem.id },
        data: { 
          quantite: newQuantite,
          updatedAt: new Date()
        }
      });
    } else {
      // NOUVEAU PRODUIT - Calculer le prochain ordre
      const maxOrdre = await prisma.inventaireItem.findFirst({
        where: { inventaireId: id },
        orderBy: { ordre: 'desc' },
        select: { ordre: true }
      });

      const nextOrdre = (maxOrdre?.ordre || 0) + 1;

      item = await prisma.inventaireItem.create({
        data: {
          inventaireId: id,
          ean13: finalEan13,
          quantite: validatedData.quantite,
          ordre: nextOrdre
        }
      });

      console.log(`✅ Nouvel item créé: ${item.id} - ${finalEan13} (${validatedData.quantite})`);
    }

    // Réponse avec info doublon
    return NextResponse.json({
      ...item,
      isDoublon,
      previousQuantite,
      message: isDoublon 
        ? `Produit déjà scanné: +${validatedData.quantite} unités (total: ${item.quantite})`
        : `Nouveau produit ajouté: ${validatedData.quantite} unités`
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST item:', error);
    
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