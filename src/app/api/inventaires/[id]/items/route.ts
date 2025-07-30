// src/app/api/inventaires/[id]/items/route.ts - Avec création automatique de signalement
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { parseCode } from '@/lib/utils/codeParser';
import { UrgencyCalculator } from '@/lib/services/urgencyCalculator';
import { z } from 'zod';

// 🆕 Schema avec date de péremption optionnelle
const InventaireItemCreateWithDateSchema = z.object({
  ean13: z.string()
    .min(8, 'Code EAN13 trop court (minimum 8 caractères)')
    .max(20, 'Code EAN13 trop long (maximum 20 caractères)')
    .regex(/^[0-9]+$/, 'Le code EAN13 doit contenir uniquement des chiffres')
    .transform(val => val.trim()),
  quantite: z.number()
    .min(1, 'La quantité doit être supérieure à 0')
    .max(9999, 'La quantité ne peut pas dépasser 9999')
    .int('La quantité doit être un nombre entier'),
  datePeremption: z.string()
    .optional()
    .nullable()
    .transform(val => {
      if (!val || val === '') return null;
      const date = new Date(val);
      if (isNaN(date.getTime())) return null;
      return date;
    })
});

// GET /api/inventaires/[id]/items - Liste des items d'un inventaire (inchangé)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`📦 Récupération items inventaire: ${id}`);

    const inventaire = await prisma.inventaire.findUnique({
      where: { id }
    });

    if (!inventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

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

// 🆕 POST avec création automatique de signalement
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = InventaireItemCreateWithDateSchema.parse(body);

    console.log(`➕ Ajout item inventaire ${id} avec signalement:`, {
      ean13: validatedData.ean13,
      quantite: validatedData.quantite,
      avecDate: !!validatedData.datePeremption
    });

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

    // GESTION DES DOUBLONS - Addition automatique (inchangé)
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
      // DOUBLON DÉTECTÉ
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
      // NOUVEAU PRODUIT
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

    // 🆕 CRÉATION AUTOMATIQUE DU SIGNALEMENT (si date fournie)
    let signalementCreated = false;
    let signalementId = null;
    let signalementError = null;

    if (validatedData.datePeremption) {
      try {
        console.log(`🚨 Création signalement automatique pour: ${finalEan13}`);
        
        const signalement = await prisma.signalement.create({
          data: {
            codeBarres: finalEan13,
            quantite: validatedData.quantite,
            datePeremption: validatedData.datePeremption,
            commentaire: `Créé automatiquement depuis inventaire "${inventaire.nom}"`,
            status: 'EN_ATTENTE'
          }
        });

        signalementId = signalement.id;
        signalementCreated = true;

        console.log(`✅ Signalement créé: ${signalement.id}`);

        // 🔥 Calcul automatique de l'urgence
        try {
          await UrgencyCalculator.updateSignalementUrgency(signalement.id);
          console.log(`⚡ Urgence calculée pour signalement: ${signalement.id}`);
        } catch (urgencyError) {
          console.warn('Erreur calcul urgence:', urgencyError);
          // Pas grave, on continue
        }

      } catch (error) {
        console.error('Erreur création signalement:', error);
        signalementError = String(error);
        // On ne fait pas échouer l'ajout d'item pour autant
      }
    }

    // Réponse avec toutes les informations
    return NextResponse.json({
      ...item,
      isDoublon,
      previousQuantite,
      message: isDoublon 
        ? `Produit déjà scanné: +${validatedData.quantite} unités (total: ${item.quantite})`
        : `Nouveau produit ajouté: ${validatedData.quantite} unités`,
      // 🆕 Informations sur le signalement
      signalement: {
        created: signalementCreated,
        id: signalementId,
        error: signalementError,
        message: signalementCreated 
          ? '🚨 Signalement créé automatiquement'
          : validatedData.datePeremption 
            ? `❌ Erreur création signalement: ${signalementError}`
            : '💡 Pas de signalement (date non fournie)'
      }
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