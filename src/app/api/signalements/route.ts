// src/app/api/signalements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { SignalementCreateSchema } from '@/lib/validations/signalement';
import { parseCode } from '@/lib/utils/codeParser';
import z from 'zod';

// GET /api/signalements - Liste des signalements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const [signalements, total] = await Promise.all([
      prisma.signalement.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.signalement.count()
    ]);

    return NextResponse.json({
      data: signalements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur GET signalements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/signalements - Créer signalement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    const validatedData = SignalementCreateSchema.parse(body);
    
    // Parser le code pour extraire l'EAN13 si Data Matrix
    let finalCodeBarres = validatedData.codeBarres;
    try {
      const parsedCode = parseCode(validatedData.codeBarres);
      if (parsedCode.gtin) {
        finalCodeBarres = parsedCode.gtin; // Utiliser l'EAN13 extrait
      }
    } catch (err) {
      // Si parsing échoue, garder le code original
      console.warn('Parsing code failed, using original:', err);
    }

    const signalement = await prisma.signalement.create({
      data: {
        ...validatedData,
        codeBarres: finalCodeBarres
      }
    });

    return NextResponse.json(signalement, { status: 201 });
  } catch (error) {
    console.error('Erreur POST signalement:', error);
    
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