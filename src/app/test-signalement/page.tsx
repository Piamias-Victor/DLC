// src/app/test-signalement/page.tsx
'use client';

import { useState } from 'react';

import { SignalementData, SignalementWithId, UrgencyLevel } from '@/lib/types';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardHeader } from '@/components/atoms/Card';
import { SignalementForm } from '@/components/organisms/SignalementForm';
import { Package, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';

export default function TestSignalementPage() {
  const [signalements, setSignalements] = useState<SignalementWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    processed: 0
  });

  const calculateUrgency = (datePeremption: string): UrgencyLevel => {
    const today = new Date();
    const expDate = new Date(datePeremption);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'critical';
    if (diffDays <= 15) return 'high';
    if (diffDays <= 30) return 'medium';
    return 'low';
  };

  const handleSubmit = async (data: SignalementData) => {
    setIsLoading(true);
    
    // Simulation délai réseau
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const urgency = calculateUrgency(data.datePeremption);
    const newSignalement: SignalementWithId = {
      ...data,
      id: `SIG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      urgency,
      status: 'pending'
    };

    setSignalements(prev => [newSignalement, ...prev.slice(0, 9)]);
    
    // Mise à jour des stats
    setStats(prev => ({
      total: prev.total + 1,
      critical: prev.critical + (urgency === 'critical' ? 1 : 0),
      processed: prev.processed
    }));
    
    setIsLoading(false);
  };

  const handleError = (error: string) => {
    console.error('Erreur:', error);
  };

  const clearHistory = () => {
    setSignalements([]);
    setStats({ total: 0, critical: 0, processed: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="content py-8">
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Test Signalement Pharmacie
          </h1>
          <p className="text-lg text-gray-600">
            Interface modernisée • Design System Apple/Vercel
          </p>
        </header>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total"
            value={stats.total}
            icon={<Package className="w-5 h-5" />}
            variant="default"
          />
          <StatCard
            title="Critiques"
            value={stats.critical}
            icon={<AlertCircle className="w-5 h-5" />}
            variant="error"
          />
          <StatCard
            title="Traités"
            value={stats.processed}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="success"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Formulaire */}
          <div className="space-y-6">
            <SignalementForm
              onSubmit={handleSubmit}
              onError={handleError}
              isLoading={isLoading}
            />
            
            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Instructions de test
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>EAN13:</strong> Tapez 13 chiffres (ex: 3401579826789)</li>
                  <li>• <strong>Data Matrix:</strong> Tapez 01123456789012341725123010LOT123</li>
                  <li>• <strong>Scanner:</strong> L input reste focusé pour scanner directement</li>
                  <li>• Les dates sont auto-remplies depuis les Data Matrix</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Historique */}
          <Card>
            <CardHeader
              title={`Signalements (${signalements.length})`}
              subtitle="Historique en temps réel"
              icon={<Package className="w-6 h-6" />}
              action={
                signalements.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    Effacer
                  </Button>
                )
              }
            />

            <CardContent>
              {signalements.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {signalements.map((sig) => (
                    <SignalementCard key={sig.id} signalement={sig} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Composants auxiliaires
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: 'default' | 'success' | 'error';
}

function StatCard({ title, value, icon, variant }: StatCardProps) {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200'
  };
  
  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600', 
    error: 'text-red-600'
  };
  
  return (
    <Card className={`${variants[variant]} hover:shadow-md transition-all duration-200`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`${iconColors[variant]}`}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface SignalementCardProps {
  signalement: SignalementWithId;
}

function SignalementCard({ signalement }: SignalementCardProps) {
  const urgencyConfig = {
    low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    medium: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    critical: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' }
  };
  
  const config = urgencyConfig[signalement.urgency || 'low'];
  
  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border} animate-slide-up`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
            {signalement.id}
          </code>
          <Badge variant="primary" size="sm">
            {signalement.urgency?.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {signalement.timestamp}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Code:</span>
          <code className="font-mono text-gray-900">{signalement.codeBarres}</code>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantité:</span>
          <span className="font-medium">{signalement.quantite}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Péremption:</span>
          <span className="font-medium">
            {new Date(signalement.datePeremption).toLocaleDateString('fr-FR')}
          </span>
        </div>
        
        {signalement.commentaire && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 italic">
              {signalement.commentaire}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Aucun signalement
      </h3>
      <p className="text-gray-500 mb-4">
        Scannez votre premier code-barres pour commencer
      </p>
      <div className="inline-flex items-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        En attente...
      </div>
    </div>
  );
}