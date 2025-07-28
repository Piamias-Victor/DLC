// src/app/api/rotations/import/route.ts - Avec template normalisé
import { NextRequest, NextResponse } from 'next/server';
import { RotationService } from '@/lib/services/rotationService';
import { UrgencyCalculator } from '@/lib/services/urgencyCalculator';

// POST /api/rotations/import - Import CSV avec normalisation EAN13
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Fichier CSV requis' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv')) {
      return NextResponse.json(
        { error: 'Seuls les fichiers CSV sont acceptés' },
        { status: 400 }
      );
    }

    // Lire le contenu du fichier
    const csvContent = await file.text();
    
    if (!csvContent.trim()) {
      return NextResponse.json(
        { error: 'Fichier CSV vide' },
        { status: 400 }
      );
    }

    // Parser le CSV
    const rotationData = RotationService.parseRotationCSV(csvContent);
    
    if (rotationData.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide trouvée dans le CSV' },
        { status: 400 }
      );
    }

    if (rotationData.length > 10000) {
      return NextResponse.json(
        { error: 'Maximum 10000 lignes par import' },
        { status: 400 }
      );
    }

    console.log(`📁 Import démarré: ${rotationData.length} lignes à traiter`);

    // Importer les rotations (avec normalisation automatique)
    const importResult = await RotationService.importRotations(rotationData);

    // Recalculer les urgences pour les produits impactés
    let recalculatedCount = 0;
    const recalculateUrgencies = formData.get('recalculateUrgencies') === 'true';
    
    if (recalculateUrgencies && importResult.success > 0) {
      try {
        console.log('⚡ Début recalcul urgences...');
        const recalcResult = await UrgencyCalculator.recalculateAllUrgencies();
        recalculatedCount = recalcResult.processed;
        console.log(`✅ Urgences recalculées: ${recalculatedCount}`);
      } catch (error) {
        console.warn('Erreur recalcul urgences après import:', error);
      }
    }

    return NextResponse.json({
      import: importResult,
      recalculatedUrgencies: recalculatedCount,
      summary: {
        totalProcessed: rotationData.length,
        successful: importResult.success,
        failed: importResult.errors.length,
        created: importResult.created,
        updated: importResult.updated
      },
      normalisation: {
        message: 'Les codes EAN13 ont été automatiquement normalisés (suppression des zéros de tête)',
        exemples: [
          'CSV: "03400930029985" → Base: "3400930029985"',
          'CSV: "0012345678901" → Base: "12345678901"'
        ]
      }
    });

  } catch (error) {
    console.error('Erreur import rotations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/rotations/import - Template CSV avec exemples normalisés
export async function GET() {
  try {
    // Template avec exemples de codes avec zéros de tête
    const template = RotationService.generateTemplate();

    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': 'attachment; filename="template_rotations.csv"'
      }
    });

  } catch (error) {
    console.error('Erreur génération template:', error);
    return NextResponse.json(
      { error: 'Erreur génération template' },
      { status: 500 }
    );
  }
}