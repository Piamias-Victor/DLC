// src/hooks/useExportInventaire.ts
import { useMutation } from '@tanstack/react-query';

// ✅ EXPORT CSV
const exportInventaireCSV = async (inventaireId: string): Promise<Blob> => {
  const response = await fetch(`/api/inventaires/${inventaireId}/export`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de l\'export');
  }
  
  return response.blob();
};

// ✅ TÉLÉCHARGEMENT AUTOMATIQUE
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ✅ GÉNÉRATION NOM FICHIER
const generateFilename = (inventaireName?: string): string => {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .substring(0, 13); // YYYYMMDD_HHMM
  
  const safeName = inventaireName
    ? inventaireName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
    : 'inventaire';
  
  return `${safeName}_${timestamp}.csv`;
};

// ✅ HOOK EXPORT
export function useExportInventaire() {
  return useMutation({
    mutationFn: async ({ 
      inventaireId, 
      inventaireName 
    }: { 
      inventaireId: string; 
      inventaireName?: string;
    }) => {
      console.log(`📥 Début export CSV: ${inventaireId}`);
      
      // Télécharger le CSV
      const blob = await exportInventaireCSV(inventaireId);
      
      // Générer le nom de fichier
      const filename = generateFilename(inventaireName);
      
      // Téléchargement automatique
      downloadBlob(blob, filename);
      
      console.log(`✅ Export terminé: ${filename}`);
      
      return { filename, size: blob.size };
    },
    onError: (error) => {
      console.error('❌ Erreur export CSV:', error);
    }
  });
}