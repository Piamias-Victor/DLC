// src/app/api/rotations/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RotationService } from '@/lib/services/rotationService';
import { UrgencyCalculator } from '@/lib/services/urgencyCalculator';

// POST /api/rotations/import - Import CSV des rotations
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

    // Importer les rotations
    const importResult = await RotationService.importRotations(rotationData);

    // Recalculer les urgences pour les produits impactés
    let recalculatedCount = 0;
    const recalculateUrgencies = formData.get('recalculateUrgencies') === 'true';
    
    if (recalculateUrgencies && importResult.success > 0) {
      try {
        const recalcResult = await UrgencyCalculator.recalculateAllUrgencies();
        recalculatedCount = recalcResult.processed;
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

// GET /api/rotations/import - Template CSV
export async function GET() {
  try {
    // Générer un template CSV
    const template = `ean13,rotationMensuelle
1234567890123,25.5
9876543210987,12.0
5555555555555,8.75`;

    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv',
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