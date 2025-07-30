// src/app/api/inventaires/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { InventaireCreateSchema, InventaireFiltersSchema } from '@/lib/validations/inventaire';
import { z } from 'zod';

// GET /api/inventaires - Liste des inventaires avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validation des filtres
    const filters = InventaireFiltersSchema.parse({
      status: searchParams.get('status') || 'ALL',
      search: searchParams.get('search') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    });

    console.log('🔍 Filtres inventaires:', filters);

    // Construction des conditions WHERE
    const whereConditions: any = {};

    // Filtre par statut
    if (filters.status !== 'ALL') {
      whereConditions.status = filters.status;
    }

    // Filtre par recherche (nom ou description)
    if (filters.search) {
      whereConditions.OR = [
        { nom: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Filtre par dates
    if (filters.dateFrom || filters.dateTo) {
      whereConditions.createdAt = {};
      
      if (filters.dateFrom) {
        whereConditions.createdAt.gte = new Date(filters.dateFrom);
      }
      
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.createdAt.lte = endDate;
      }
    }

    // Pagination
    const skip = (filters.page - 1) * filters.limit;

    // Récupération des inventaires avec leurs items
    const [inventaires, total] = await Promise.all([
      prisma.inventaire.findMany({
        where: whereConditions,
        include: {
          _count: {
            select: { items: true }
          }
        },
        orderBy: [
          { status: 'asc' }, // EN_COURS d'abord
          { createdAt: 'desc' }
        ],
        take: filters.limit,
        skip: skip
      }),
      prisma.inventaire.count({ where: whereConditions })
    ]);

    console.log(`📊 Inventaires trouvés: ${inventaires.length}/${total}`);

    return NextResponse.json({
      data: inventaires,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / filters.limit)
      },
      filters
    });

  } catch (error) {
    console.error('Erreur GET inventaires:', error);
    
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

// POST /api/inventaires - Créer un nouvel inventaire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = InventaireCreateSchema.parse(body);

    console.log('🆕 Création inventaire:', validatedData);

    // Vérifier qu'il n'y a pas déjà un inventaire EN_COURS
    const inventaireEnCours = await prisma.inventaire.findFirst({
      where: { status: 'EN_COURS' }
    });

    if (inventaireEnCours) {
      return NextResponse.json(
        { 
          error: 'Un inventaire est déjà en cours',
          details: `Inventaire "${inventaireEnCours.nom}" en cours depuis le ${inventaireEnCours.createdAt.toLocaleDateString('fr-FR')}`
        },
        { status: 409 } // Conflict
      );
    }

    // Créer le nouvel inventaire
    const inventaire = await prisma.inventaire.create({
      data: {
        nom: validatedData.nom,
        description: validatedData.description,
        status: 'EN_COURS'
      },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    console.log(`✅ Inventaire créé: ${inventaire.id} - "${inventaire.nom}"`);

    return NextResponse.json(inventaire, { status: 201 });

  } catch (error) {
    console.error('Erreur POST inventaire:', error);
    
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