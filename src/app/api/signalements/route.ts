// src/app/api/signalements/route.ts - Avec filtre pourcentage écoulement
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { SignalementCreateSchema } from '@/lib/validations/signalement';
import { UrgencyCalculator } from '@/lib/services/urgencyCalculator';
import { parseCode } from '@/lib/utils/codeParser';
import { z } from 'zod';

// GET /api/signalements - Liste avec filtres et support pourcentage écoulement
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
      urgenceCalculee: parseMultiSelectParam(searchParams.get('urgenceCalculee')),
      datePeremptionFrom: searchParams.get('datePeremptionFrom') || '',
      datePeremptionTo: searchParams.get('datePeremptionTo') || '',
      quantiteMin: searchParams.get('quantiteMin') || '',
      quantiteMax: searchParams.get('quantiteMax') || '',
      probabiliteEcoulementMax: searchParams.get('probabiliteEcoulementMax') || '', // 🔥 NOUVEAU
      avecRotation: searchParams.get('avecRotation') === 'true',
    };

    console.log('🔍 Filtres API avec pourcentage:', filters);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {};

    // Filtre par recherche
    if (filters.search) {
      whereConditions.OR = [
        { codeBarres: { contains: filters.search, mode: 'insensitive' } },
        { commentaire: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Filtre par statut - AVEC ECOULEMENT
    if (filters.status !== 'ALL' && Array.isArray(filters.status) && filters.status.length > 0) {
      whereConditions.status = { in: filters.status };
      console.log('📋 Filtre statut:', filters.status);
    }

    // Filtre par urgence calculée - AVEC ECOULEMENT
    if (filters.urgenceCalculee !== 'ALL' && Array.isArray(filters.urgenceCalculee) && filters.urgenceCalculee.length > 0) {
      whereConditions.urgenceCalculee = { in: filters.urgenceCalculee };
      console.log('⚡ Filtre urgence calculée:', filters.urgenceCalculee);
    }

    // 🔥 NOUVEAU : Filtre pourcentage d'écoulement MAX
    if (filters.probabiliteEcoulementMax && !isNaN(parseFloat(filters.probabiliteEcoulementMax))) {
      const maxPercentage = parseFloat(filters.probabiliteEcoulementMax);
      whereConditions.probabiliteEcoulement = {
        lte: maxPercentage
      };
      console.log(`💧 Filtre écoulement ≤ ${maxPercentage}%`);
    }

    // Filtre "sans rotation uniquement" (pas utilisé mais gardé pour compatibilité)
    if (filters.avecRotation) {
      const signalementsAvecRotation = await prisma.$queryRaw`
        SELECT s.id 
        FROM signalements s 
        INNER JOIN product_rotations pr ON s."codeBarres" = pr.ean13
      ` as { id: string }[];
      
      const idsAvecRotation = signalementsAvecRotation.map(s => s.id);
      whereConditions.id = { notIn: idsAvecRotation };
      console.log('🚫 Filtre sans rotation:', idsAvecRotation.length, 'exclus');
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

    console.log('🎯 Conditions WHERE finales:', JSON.stringify(whereConditions, null, 2));

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

    console.log(`📊 Résultats avec filtre pourcentage: ${signalements.length}/${total} signalements`);

    // Statistiques spéciales avec pourcentage
    const statsEcoulement = {
      totalEcoulement: signalements.filter(s => s.status === 'ECOULEMENT').length,
      urgenceEcoulement: signalements.filter(s => s.urgenceCalculee === 'ecoulement').length,
      probabilite100: signalements.filter(s => s.probabiliteEcoulement && Number(s.probabiliteEcoulement) >= 100).length,
      sansRotation: filters.avecRotation ? signalements.length : 0,
      // 🔥 NOUVELLES STATS POURCENTAGE
      filtrePourcentage: filters.probabiliteEcoulementMax ? {
        seuil: parseFloat(filters.probabiliteEcoulementMax),
        resultats: signalements.length,
        moyennePourcentage: signalements.length > 0 ? 
          signalements.reduce((sum, s) => sum + (Number(s.probabiliteEcoulement) || 0), 0) / signalements.length 
          : 0
      } : null
    };

    console.log('🌊 Stats écoulement avec pourcentage:', statsEcoulement);

    return NextResponse.json({
      data: signalements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: filters,
      stats: statsEcoulement
    });
  } catch (error) {
    console.error('Erreur GET signalements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/signalements - Création avec calcul d'urgence automatique
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

    console.log(`🆕 Création signalement: ${finalCodeBarres}`);

    // Créer le signalement
    const signalement = await prisma.signalement.create({
      data: {
        ...validatedData,
        codeBarres: finalCodeBarres
      }
    });

    console.log(`✅ Signalement créé: ${signalement.id}`);

    // Calcul automatique de l'urgence avec support ECOULEMENT
    try {
      console.log(`⚡ Calcul urgence pour: ${signalement.id}`);
      await UrgencyCalculator.updateSignalementUrgency(signalement.id);
      
      // Récupérer le signalement mis à jour
      const updatedSignalement = await prisma.signalement.findUnique({
        where: { id: signalement.id }
      });
      
      console.log(`🎯 Signalement final:`, {
        status: updatedSignalement?.status,
        urgenceCalculee: updatedSignalement?.urgenceCalculee,
        probabiliteEcoulement: updatedSignalement?.probabiliteEcoulement
      });
      
      return NextResponse.json(updatedSignalement || signalement, { status: 201 });
    } catch (urgencyError) {
      console.warn('Erreur calcul urgence:', urgencyError);
      // Retourner le signalement même si le calcul d'urgence échoue
      return NextResponse.json(signalement, { status: 201 });
    }

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