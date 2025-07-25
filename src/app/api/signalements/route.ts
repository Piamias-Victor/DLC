// src/app/api/signalements/route.ts - Mise à jour avec filtre quantité
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { SignalementCreateSchema, DashboardFiltersSchema } from '@/lib/validations/signalement';
import { parseCode } from '@/lib/utils/codeParser';
import { z } from 'zod';

// GET /api/signalements - Liste des signalements avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Paramètres de filtres
    const filters = DashboardFiltersSchema.parse({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'ALL',
      urgency: searchParams.get('urgency') || 'ALL',
      datePeremptionFrom: searchParams.get('datePeremptionFrom') || '',
      datePeremptionTo: searchParams.get('datePeremptionTo') || '',
      quantiteMin: searchParams.get('quantiteMin') || '',
      quantiteMax: searchParams.get('quantiteMax') || '',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {};

    // Filtre par recherche (code-barres ou commentaire)
    if (filters.search) {
      whereConditions.OR = [
        { codeBarres: { contains: filters.search, mode: 'insensitive' } },
        { commentaire: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Filtre par statut
    if (filters.status !== 'ALL') {
      whereConditions.status = filters.status;
    }

    // Filtre par date de péremption
    if (filters.datePeremptionFrom || filters.datePeremptionTo) {
      whereConditions.datePeremption = {};
      
      if (filters.datePeremptionFrom) {
        whereConditions.datePeremption.gte = new Date(filters.datePeremptionFrom);
      }
      
      if (filters.datePeremptionTo) {
        // Ajouter 23:59:59 pour inclure toute la journée
        const endDate = new Date(filters.datePeremptionTo);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.datePeremption.lte = endDate;
      }
    }

    // NOUVEAU : Filtre par quantité
    if (filters.quantiteMin || filters.quantiteMax) {
      whereConditions.quantite = {};
      
      if (filters.quantiteMin && !isNaN(parseInt(filters.quantiteMin))) {
        whereConditions.quantite.gte = parseInt(filters.quantiteMin);
      }
      
      if (filters.quantiteMax && !isNaN(parseInt(filters.quantiteMax))) {
        whereConditions.quantite.lte = parseInt(filters.quantiteMax);
      }
    }

    // Exécution des requêtes
    const [signalements, total] = await Promise.all([
      prisma.signalement.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.signalement.count({ where: whereConditions })
    ]);

    // Post-traitement pour le filtre d'urgence côté serveur
    let filteredSignalements = signalements;
    
    if (filters.urgency !== 'ALL') {
      filteredSignalements = signalements.filter((s: { datePeremption: Date; quantite: number }) => {
        const urgency = calculateUrgency(s.datePeremption, s.quantite);
        return urgency === filters.urgency;
      });
    }

    return NextResponse.json({
      data: filteredSignalements,
      pagination: {
        page,
        limit,
        total: filters.urgency !== 'ALL' ? filteredSignalements.length : total,
        pages: Math.ceil((filters.urgency !== 'ALL' ? filteredSignalements.length : total) / limit)
      },
      filters: filters
    });
  } catch (error) {
    console.error('Erreur GET signalements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/signalements - Créer signalement (inchangé)
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

// Fonction utilitaire pour calculer l'urgence
function calculateUrgency(datePeremption: Date, quantite: number): 'low' | 'medium' | 'high' | 'critical' {
  const today = new Date();
  const expDate = new Date(datePeremption);
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) return 'critical';
  if (quantite >= 50 && diffDays <= 120) return 'critical';
  if (diffDays > 30 && diffDays <= 75) {
    if (quantite >= 10) return 'high';
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  if (diffDays > 75 && diffDays <= 180) {
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  return 'low';
}