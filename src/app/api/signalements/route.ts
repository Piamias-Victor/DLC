// src/app/api/signalements/route.ts - GET mis à jour pour multi-sélection
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { SignalementCreateSchema } from '@/lib/validations/signalement';
import { parseCode } from '@/lib/utils/codeParser';
import { z } from 'zod';

// GET /api/signalements - Liste avec filtres multi-sélection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Parsing des filtres multi-sélection
    const parseMultiSelectParam = (param: string | null) => {
      if (!param || param === 'ALL') return 'ALL';
      try {
        const parsed = JSON.parse(param);
        return Array.isArray(parsed) ? parsed : 'ALL';
      } catch {
        return param.split(',').filter(Boolean);
      }
    };

    const filters = {
      search: searchParams.get('search') || '',
      status: parseMultiSelectParam(searchParams.get('status')),
      urgency: parseMultiSelectParam(searchParams.get('urgency')),
      datePeremptionFrom: searchParams.get('datePeremptionFrom') || '',
      datePeremptionTo: searchParams.get('datePeremptionTo') || '',
      quantiteMin: searchParams.get('quantiteMin') || '',
      quantiteMax: searchParams.get('quantiteMax') || '',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {};

    // Filtre par recherche
    if (filters.search) {
      whereConditions.OR = [
        { codeBarres: { contains: filters.search, mode: 'insensitive' } },
        { commentaire: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Filtre par statut multi-sélection
    if (filters.status !== 'ALL' && Array.isArray(filters.status) && filters.status.length > 0) {
      whereConditions.status = { in: filters.status };
    }

    // Filtre par date de péremption
    if (filters.datePeremptionFrom || filters.datePeremptionTo) {
      whereConditions.datePeremption = {};
      
      if (filters.datePeremptionFrom) {
        whereConditions.datePeremption.gte = new Date(filters.datePeremptionFrom);
      }
      
      if (filters.datePeremptionTo) {
        const endDate = new Date(filters.datePeremptionTo);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.datePeremption.lte = endDate;
      }
    }

    // Filtre par quantité
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

    // Post-traitement pour le filtre d'urgence multi-sélection
    let filteredSignalements = signalements;
    
    if (filters.urgency !== 'ALL' && Array.isArray(filters.urgency) && filters.urgency.length > 0) {
      filteredSignalements = signalements.filter((s: { datePeremption: Date; quantite: number }) => {
        const urgency = calculateUrgency(s.datePeremption, s.quantite);
        return filters.urgency.includes(urgency);
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

// POST inchangé...
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = SignalementCreateSchema.parse(body);
    
    let finalCodeBarres = validatedData.codeBarres;
    try {
      const parsedCode = parseCode(validatedData.codeBarres);
      if (parsedCode.gtin) {
        finalCodeBarres = parsedCode.gtin;
      }
    } catch (err) {
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