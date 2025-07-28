// src/app/api/rotations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RotationService } from '@/lib/services/rotationService';
import { ProductRotationSchema, RotationFiltersSchema } from '@/lib/validations/rotation';
import { z } from 'zod';

// GET /api/rotations - Liste des rotations avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = RotationFiltersSchema.parse({
      search: searchParams.get('search') || '',
      rotationMin: searchParams.get('rotationMin') || '',
      rotationMax: searchParams.get('rotationMax') || '',
      dateMAJFrom: searchParams.get('dateMAJFrom') || '',
      dateMAJTo: searchParams.get('dateMAJTo') || '',
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    });

    const { rotations, total } = await RotationService.getAllRotations(
      filters.limit,
      filters.offset
    );

    // Filtrage côté application si nécessaire
    let filteredRotations = rotations;
    
    if (filters.search) {
      filteredRotations = filteredRotations.filter(r =>
        r.ean13.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.rotationMin) {
      const min = parseFloat(filters.rotationMin);
      filteredRotations = filteredRotations.filter(r =>
        Number(r.rotationMensuelle) >= min
      );
    }

    if (filters.rotationMax) {
      const max = parseFloat(filters.rotationMax);
      filteredRotations = filteredRotations.filter(r =>
        Number(r.rotationMensuelle) <= max
      );
    }

    const stats = await RotationService.getRotationStats();

    return NextResponse.json({
      data: filteredRotations,
      pagination: {
        total: filteredRotations.length,
        limit: filters.limit,
        offset: filters.offset
      },
      stats,
      filters
    });

  } catch (error) {
    console.error('Erreur GET rotations:', error);
    
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

// POST /api/rotations - Créer/modifier une rotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ProductRotationSchema.parse(body);

    const rotation = await RotationService.upsertRotation(
      validatedData.ean13,
      validatedData.rotationMensuelle
    );

    return NextResponse.json(rotation, { status: 201 });

  } catch (error) {
    console.error('Erreur POST rotation:', error);
    
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

// DELETE /api/rotations - Supprimer une rotation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      );
    }

    await RotationService.deleteRotation(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur DELETE rotation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}