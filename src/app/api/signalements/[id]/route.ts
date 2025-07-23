// src/app/api/signalements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { SignalementUpdateSchema } from '@/lib/validations/signalement';
import { z } from 'zod';

// GET /api/signalements/[id] - Détail signalement
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const signalement = await prisma.signalement.findUnique({
      where: { id }
    });

    if (!signalement) {
      return NextResponse.json(
        { error: 'Signalement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(signalement);
  } catch (error) {
    console.error('Erreur GET signalement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/signalements/[id] - Modifier signalement
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = SignalementUpdateSchema.parse(body);

    const signalement = await prisma.signalement.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(signalement);
  } catch (error) {
    console.error('Erreur PUT signalement:', error);
    
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

// DELETE /api/signalements/[id] - Supprimer signalement
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    await prisma.signalement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE signalement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}