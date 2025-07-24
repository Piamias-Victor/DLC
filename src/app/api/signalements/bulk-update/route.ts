// src/app/api/signalements/bulk-update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { BulkUpdateStatusSchema } from '@/lib/validations/signalement';
import { z } from 'zod';

// POST /api/signalements/bulk-update - Changement d'état en masse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    const validatedData = BulkUpdateStatusSchema.parse(body);
    
    // Vérifier que tous les signalements existent
    const existingSignalements = await prisma.signalement.findMany({
      where: {
        id: {
          in: validatedData.signalementIds
        }
      },
      select: { id: true }
    });

    if (existingSignalements.length !== validatedData.signalementIds.length) {
      return NextResponse.json(
        { error: 'Certains signalements n\'existent pas' },
        { status: 404 }
      );
    }

    // Effectuer la mise à jour en masse
    const result = await prisma.signalement.updateMany({
      where: {
        id: {
          in: validatedData.signalementIds
        }
      },
      data: {
        status: validatedData.newStatus,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      newStatus: validatedData.newStatus
    });

  } catch (error) {
    console.error('Erreur bulk update signalements:', error);
    
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