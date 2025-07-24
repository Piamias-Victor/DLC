// src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { 
  Package, 
  Calendar, 
  Hash, 
  Trash2, 
  Eye, 
  Filter,
  Search,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardHeader, CardContent } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Badge } from '@/components/atoms/Badge';
import { useSignalements, useDeleteSignalement, Signalement } from '@/lib/hooks/useSignalements';

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  
  // Hooks React Query
  const { data: signalementsData, isLoading, error } = useSignalements(1, 100); // Plus de résultats
  const deleteMutation = useDeleteSignalement();

  const signalements = signalementsData?.data || [];
  
  // Filtrer par terme de recherche
  const filteredSignalements = signalements.filter(item =>
    item.codeBarres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.commentaire?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistiques
  const stats = {
    total: signalements.length,
    critique: signalements.filter(s => getUrgency(s.datePeremption, s.quantite) === 'critical').length,
    eleve: signalements.filter(s => getUrgency(s.datePeremption, s.quantite) === 'high').length,
    recent: signalements.filter(s => {
      const created = new Date(s.createdAt);
      const today = new Date();
      const diffTime = today.getTime() - created.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    }).length
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce signalement ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const handleExport = () => {
    // CSV simple : code;quantité (sans en-tête)
    const csvContent = filteredSignalements.map(item => [
      item.codeBarres,    // Code EAN13
      item.quantite       // Quantité
    ].join(';')).join('\n');
    
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Erreur de chargement</p>
          <p className="text-gray-600 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="content py-8">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Signalements
              </h1>
              <p className="text-gray-600">
                Vue d ensemble de tous les signalements
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/signalement'}
              >
                Nouveau Signalement
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critiques</p>
                    <p className="text-2xl font-bold text-red-600">{stats.critique}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Élevés</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.eleve}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aujourd hui</p>
                    <p className="text-2xl font-bold text-green-600">{stats.recent}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des signalements avec recherche intégrée */}
          <Card>
            <CardHeader
              title={`Signalements (${filteredSignalements.length})`}
              subtitle={searchTerm ? `Résultats pour "${searchTerm}"` : "Tous les signalements"}
              icon={<Package className="w-6 h-6" />}
              action={
                <div className="flex gap-3">
                  <div className="w-80">
                    <Input
                      placeholder="Rechercher par code-barres..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              }
            />

            <CardContent>
              {filteredSignalements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Quantité</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Péremption</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Urgence</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Créé le</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSignalements.map((item) => (
                        <tr 
                          key={item.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {item.codeBarres}
                            </code>
                          </td>
                          <td className="py-4 px-4 font-medium">
                            {item.quantite}
                          </td>
                          <td className="py-4 px-4">
                            {new Date(item.datePeremption).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-4 px-4">
                            <UrgencyBadge level={getUrgency(item.datePeremption, item.quantite)} />
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(item.createdAt).toLocaleString('fr-FR')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedSignalement(item)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deleteMutation.isPending}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun signalement trouvé</p>
                  {searchTerm && (
                    <p className="text-sm mt-1">
                      Essayez un autre terme de recherche
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Modal détail signalement */}
        {selectedSignalement && (
          <SignalementModal 
            signalement={selectedSignalement}
            onClose={() => setSelectedSignalement(null)}
          />
        )}

      </div>
    </div>
  );
}

// Composants auxiliaires
function getUrgency(datePeremption: string | Date, quantite: number): 'low' | 'medium' | 'high' | 'critical' {
  const today = new Date();
  const expDate = new Date(datePeremption);
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Logique spécifique selon tes exemples
  
  // CRITIQUE : < 30 jours OU grosse quantité (50+) dans les 4 mois
  if (diffDays <= 30) {
    return 'critical';
  }
  
  if (quantite >= 50 && diffDays <= 120) {
    return 'critical';
  }
  
  // ÉLEVÉ/HIGH : 30-75 jours selon quantité
  if (diffDays > 30 && diffDays <= 75) {
    if (quantite >= 10) return 'high';
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  
  // MOYEN : 75-180 jours avec quantité >= 5
  if (diffDays > 75 && diffDays <= 180) {
    if (quantite >= 5) return 'medium';
    return 'low';
  }
  
  // FAIBLE : > 180 jours OU petite quantité loin
  return 'low';
}

function UrgencyBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const configs = {
    low: { variant: 'success' as const, label: 'Faible' },
    medium: { variant: 'warning' as const, label: 'Moyen' },
    high: { variant: 'error' as const, label: 'Élevé' },
    critical: { variant: 'error' as const, label: 'Critique' }
  };
  
  const config = configs[level];
  
  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}

function SignalementModal({ 
  signalement, 
  onClose 
}: { 
  signalement: Signalement; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader
          title="Détail du Signalement"
          icon={<Package className="w-6 h-6" />}
          action={
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          }
        />
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">ID</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                {signalement.id}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Code-barres</label>
              <p className="font-mono text-lg mt-1">{signalement.codeBarres}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Quantité</label>
                <p className="text-lg font-semibold mt-1">{signalement.quantite}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Urgence</label>
                <div className="mt-1">
                  <UrgencyBadge level={getUrgency(signalement.datePeremption, signalement.quantite)} />
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Date de péremption</label>
              <p className="text-lg mt-1">
                {new Date(signalement.datePeremption).toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            {signalement.commentaire && (
              <div>
                <label className="text-sm font-medium text-gray-600">Commentaire</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                  {signalement.commentaire}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-600">Créé le</label>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(signalement.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}