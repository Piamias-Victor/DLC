// src/app/api/inventaires/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// GET /api/inventaires/[id]/export - Export CSV format "ean13;quantite"
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`📥 Export CSV inventaire: ${id}`);

    // Vérifier que l'inventaire existe
    const inventaire = await prisma.inventaire.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!inventaire) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      );
    }

    // Agrégation par EAN13 (somme des quantités pour les doublons)
    const aggregatedData = new Map<string, number>();
    
    inventaire.items.forEach(item => {
      const currentQuantite = aggregatedData.get(item.ean13) || 0;
      aggregatedData.set(item.ean13, currentQuantite + item.quantite);
    });

    console.log(`📊 Agrégation: ${inventaire.items.length} items → ${aggregatedData.size} produits distincts`);

    // Générer le CSV sans en-tête, format "ean13;quantite"
    const csvLines: string[] = [];
    
    // Trier par EAN13 pour un export cohérent
    const sortedEntries = Array.from(aggregatedData.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    sortedEntries.forEach(([ean13, quantite]) => {
      csvLines.push(`${ean13};${quantite}`);
    });

    const csvContent = csvLines.join('\n');

    // Générer le nom de fichier avec timestamp
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .substring(0, 13); // YYYYMMDD_HHMM
    
    const filename = `inventaire_${timestamp}.csv`;

    console.log(`✅ Export généré: ${filename} (${csvLines.length} lignes)`);

    // Retourner le CSV avec les bons headers
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Erreur export CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export CSV' },
      { status: 500 }
    );
  }
}