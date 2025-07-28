// src/app/api/signalements/test-urgency/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { UrgencyCalculator } from '@/lib/services/urgencyCalculator';
import { RotationService } from '@/lib/services/rotationService';

// POST /api/signalements/test-urgency - Test du calcul d'urgence
export async function POST(request: NextRequest) {
  try {
    const { signalementId } = await request.json();

    if (!signalementId) {
      return NextResponse.json(
        { error: 'signalementId requis' },
        { status: 400 }
      );
    }

    // Récupérer le signalement
    const signalement = await prisma.signalement.findUnique({
      where: { id: signalementId }
    });

    if (!signalement) {
      return NextResponse.json(
        { error: 'Signalement non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer la rotation si elle existe
    const rotation = await RotationService.getRotationByEan13(signalement.codeBarres);

    // Calculer l'urgence selon les deux méthodes
    const calculClassique = UrgencyCalculator.calculateClassicUrgency(
      signalement.quantite,
      signalement.datePeremption
    );

    let calculAvecRotation = null;
    if (rotation) {
      calculAvecRotation = UrgencyCalculator.calculateUrgencyWithRotation(
        signalement.quantite,
        signalement.datePeremption,
        Number(rotation.rotationMensuelle)
      );
    }

    // Appliquer le nouveau calcul
    await UrgencyCalculator.updateSignalementUrgency(signalementId);

    // Récupérer le signalement mis à jour
    const signalementUpdated = await prisma.signalement.findUnique({
      where: { id: signalementId }
    });

    return NextResponse.json({
      signalement: {
        avant: {
          urgenceCalculee: signalement.urgenceCalculee,
          probabiliteEcoulement: signalement.probabiliteEcoulement,
          status: signalement.status
        },
        apres: {
          urgenceCalculee: signalementUpdated?.urgenceCalculee,
          probabiliteEcoulement: signalementUpdated?.probabiliteEcoulement,
          status: signalementUpdated?.status
        }
      },
      rotation: rotation ? {
        ean13: rotation.ean13,
        rotationMensuelle: Number(rotation.rotationMensuelle),
        derniereMAJ: rotation.derniereMAJ
      } : null,
      calculs: {
        classique: {
          urgence: calculClassique.urgence,
          reasoning: calculClassique.reasoning
        },
        avecRotation: calculAvecRotation ? {
          urgence: calculAvecRotation.urgence,
          probabiliteEcoulement: calculAvecRotation.probabiliteEcoulement,
          shouldAutoVerify: calculAvecRotation.shouldAutoVerify,
          reasoning: calculAvecRotation.reasoning
        } : null
      },
      tests: {
        rotationTrouvee: !!rotation,
        calculAvecRotation: !!calculAvecRotation,
        autoVerifieActive: calculAvecRotation?.shouldAutoVerify || false,
        changementStatut: signalement.status !== signalementUpdated?.status
      }
    });

  } catch (error) {
    console.error('Erreur test urgence:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/signalements/test-urgency - Test en masse
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Récupérer quelques signalements pour test
    const signalements = await prisma.signalement.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const results = [];

    for (const signalement of signalements) {
      const rotation = await RotationService.getRotationByEan13(signalement.codeBarres);
      
      const calculClassique = UrgencyCalculator.calculateClassicUrgency(
        signalement.quantite,
        signalement.datePeremption
      );

      let calculAvecRotation = null;
      if (rotation) {
        calculAvecRotation = UrgencyCalculator.calculateUrgencyWithRotation(
          signalement.quantite,
          signalement.datePeremption,
          Number(rotation.rotationMensuelle)
        );
      }

      results.push({
        signalement: {
          id: signalement.id,
          codeBarres: signalement.codeBarres,
          quantite: signalement.quantite,
          datePeremption: signalement.datePeremption,
          status: signalement.status,
          urgenceCalculee: signalement.urgenceCalculee,
          probabiliteEcoulement: signalement.probabiliteEcoulement
        },
        rotation: rotation ? {
          rotationMensuelle: Number(rotation.rotationMensuelle)
        } : null,
        calculs: {
          classique: calculClassique,
          avecRotation: calculAvecRotation
        },
        recommandations: {
          urgenceRecommandee: calculAvecRotation?.urgence || calculClassique.urgence,
          statusRecommande: calculAvecRotation?.shouldAutoVerify ? 'A_VERIFIER' : signalement.status,
          actionSuggere: calculAvecRotation?.shouldAutoVerify ? 'AUTO_VERIFY' : 'MANUAL_REVIEW'
        }
      });
    }

    return NextResponse.json({
      results,
      stats: {
        total: signalements.length,
        avecRotation: results.filter(r => r.rotation).length,
        autoVerifiable: results.filter(r => r.calculs.avecRotation?.shouldAutoVerify).length,
        changementUrgence: results.filter(r => 
          r.calculs.classique.urgence !== (r.calculs.avecRotation?.urgence || r.calculs.classique.urgence)
        ).length
      }
    });

  } catch (error) {
    console.error('Erreur test urgence masse:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}