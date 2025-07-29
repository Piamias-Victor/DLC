// src/app/api/signalements/recalculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UrgencyCalculator } from '@/lib/services/urgencyCalculator';
import { RecalculateUrgencySchema } from '@/lib/validations/rotation';
import { z } from 'zod';

// POST /api/signalements/recalculate - Recalculer les urgences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RecalculateUrgencySchema.parse(body);

    let result;

    if (validatedData.all) {
      // Recalcul complet
      result = await UrgencyCalculator.recalculateAllUrgencies();
      
      return NextResponse.json({
        success: true,
        message: 'Recalcul complet effectué',
        stats: {
          processed: result.processed,
          withRotation: result.withRotation,
          withoutRotation: result.processed - result.withRotation
        }
      });

    } else if (validatedData.signalementIds) {
      // Recalcul sélectif
      let processed = 0;
      let errors = 0;

      for (const id of validatedData.signalementIds) {
        try {
          await UrgencyCalculator.updateSignalementUrgency(id);
          processed++;
        } catch (error) {
          console.error(`Erreur recalcul signalement ${id}:`, error);
          errors++;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Recalcul sélectif effectué',
        stats: {
          requested: validatedData.signalementIds.length,
          processed,
          errors
        }
      });
    }

    return NextResponse.json(
      { error: 'Aucune action spécifiée' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erreur recalcul urgences:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}