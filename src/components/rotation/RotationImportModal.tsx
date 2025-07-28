// src/components/rotation/RotationImportModal.tsx - Version corrigée
import { useState, useRef } from 'react';
import { Upload, Download, X, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardContent } from '../atoms/Card';
import { useImportRotations, useDownloadTemplate } from '@/hooks/rotation/useRotations';

interface RotationImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportError {
  line: number;
  ean13: string;
  error: string;
}

interface ImportResultData {
  success: number;
  errors: ImportError[];
  updated: number;
  created: number;
  recalculatedUrgencies: number;
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    created: number;
    updated: number;
  };
}

export function RotationImportModal({ onClose, onSuccess }: RotationImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recalculateUrgencies, setRecalculateUrgencies] = useState(true);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportRotations();
  const templateMutation = useDownloadTemplate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const result = await importMutation.mutateAsync({
        file: selectedFile,
        recalculate: recalculateUrgencies
      });
      
      setImportResult(result);
      
      // Fermer automatiquement seulement si vraiment réussi
      if (result.created > 0 || result.updated > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur import:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await templateMutation.mutateAsync();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_rotations.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement template:', error);
    }
  };

  // Logique d'affichage corrigée
  const getImportStatus = () => {
    if (!importResult) return null;
    
    const hasCreatedOrUpdated = importResult.created > 0 || importResult.updated > 0;
    const hasErrors = importResult.errors && importResult.errors.length > 0;
    const totalProcessed = importResult.summary?.totalProcessed || 0;
    
    if (hasCreatedOrUpdated && !hasErrors) {
      return { type: 'success', message: 'Import réussi' };
    } else if (hasCreatedOrUpdated && hasErrors) {
      return { type: 'warning', message: 'Import partiellement réussi' };
    } else if (!hasCreatedOrUpdated && hasErrors) {
      return { type: 'error', message: 'Import échoué' };
    } else if (!hasCreatedOrUpdated && totalProcessed === 0) {
      return { type: 'error', message: 'Aucune donnée trouvée' };
    } else {
      return { type: 'info', message: 'Aucune modification nécessaire' };
    }
  };

  const importStatus = getImportStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader
          title="Import des Rotations"
          subtitle="Fichier CSV avec EAN13 et rotation mensuelle"
          icon={<Upload className="w-6 h-6 text-blue-600" />}
          action={
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          }
        />

        <CardContent>
          <div className="space-y-6">
            
            {/* Template */}
            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Template CSV</p>
                    <p className="text-xs text-blue-700">Format: ean13,rotationMensuelle</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Séparateurs acceptés: virgule (,) point-virgule (;) tabulation
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  isLoading={templateMutation.isPending}
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
              </div>
            </div>

            {/* Sélection fichier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier CSV
              </label>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">Cliquez pour sélectionner un fichier CSV</p>
                    <p className="text-xs text-gray-500">ou glissez-déposez ici</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={recalculateUrgencies}
                  onChange={(e) => setRecalculateUrgencies(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Recalculer les urgences automatiquement
                  </span>
                  <p className="text-xs text-gray-500">
                    Recommandé pour mettre à jour les signalements existants
                  </p>
                </div>
              </label>
            </div>

            {/* Résultat import */}
            {importResult && importStatus && (
              <div className={`p-4 rounded-lg border ${
                importStatus.type === 'success' ? 'bg-green-50 border-green-200' :
                importStatus.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                importStatus.type === 'info' ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {importStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                  {importStatus.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                  {importStatus.type === 'info' && <Info className="w-5 h-5 text-blue-600 mt-0.5" />}
                  {importStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {importStatus.message}
                    </p>
                    
                    <div className="mt-2 text-sm space-y-1">
                      <p>📁 Fichier traité: {importResult.summary?.totalProcessed || 0} lignes</p>
                      
                      {importResult.created > 0 && (
                        <p className="text-green-700">✅ Créés: {importResult.created}</p>
                      )}
                      
                      {importResult.updated > 0 && (
                        <p className="text-blue-700">🔄 Mis à jour: {importResult.updated}</p>
                      )}
                      
                      {importResult.errors && importResult.errors.length > 0 && (
                        <p className="text-red-700">❌ Erreurs: {importResult.errors.length}</p>
                      )}
                      
                      {importResult.recalculatedUrgencies > 0 && (
                        <p className="text-purple-700">⚡ Urgences recalculées: {importResult.recalculatedUrgencies}</p>
                      )}
                      
                      {importResult.created === 0 && importResult.updated === 0 && importResult.errors.length === 0 && (
                        <p className="text-blue-700">ℹ️ Toutes les rotations étaient déjà à jour</p>
                      )}
                    </div>

                    {/* Affichage des erreurs */}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          📋 Détail des erreurs ({importResult.errors.length})
                        </summary>
                        <div className="mt-2 max-h-32 overflow-y-auto bg-white rounded p-2 border">
                          {importResult.errors.slice(0, 10).map((error: ImportError, i: number) => (
                            <div key={i} className="text-xs text-red-600 mb-1">
                              <span className="font-mono bg-red-100 px-1 rounded">Ligne {error.line}</span>
                              <span className="mx-1">EAN13: {error.ean13}</span>
                              <span className="text-red-700">→ {error.error}</span>
                            </div>
                          ))}
                          {importResult.errors.length > 10 && (
                            <p className="text-xs text-gray-500 italic">
                              ... et {importResult.errors.length - 10} autres erreurs
                            </p>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Conseil si aucune rotation créée/modifiée */}
                    {importResult.created === 0 && importResult.updated === 0 && importResult.summary?.totalProcessed > 0 && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
                        <p className="font-medium text-yellow-800">💡 Conseils de dépannage :</p>
                        <ul className="text-yellow-700 mt-1 space-y-0.5">
                          <li>• Vérifiez le format CSV (séparateur, encoding UTF-8)</li>
                          <li>• Les EAN13 doivent être différents des valeurs existantes</li>
                          <li>• Les rotations doivent être des nombres positifs ≤ 1000</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={importMutation.isPending}
              >
                {importResult && (importResult.created > 0 || importResult.updated > 0) ? 'Fermer' : 'Annuler'}
              </Button>
              
              {!importResult && (
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!selectedFile || importMutation.isPending}
                  isLoading={importMutation.isPending}
                  loadingText="Import en cours..."
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </Button>
              )}
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}