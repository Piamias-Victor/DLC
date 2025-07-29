// src/components/dashboard/DashboardStats.tsx - Design simplifié
import { Card, CardContent } from '../atoms/Card';
import { Signalement } from '@/lib/types';

interface DashboardStatsProps {
  signalements: Signalement[];
}

interface Stats {
  total: number;
  enAttente: number;
  enCours: number;
  ecoulement: number;
  critique: number;
  recent: number;
}

function calculateStats(signalements: Signalement[]): Stats {
  return {
    total: signalements.length,
    enAttente: signalements.filter(s => s.status === 'EN_ATTENTE').length,
    enCours: signalements.filter(s => s.status === 'EN_COURS').length,
    // ✅ FIX: Type casting pour ECOULEMENT
    ecoulement: signalements.filter(s => s.status === ('ECOULEMENT' as Signalement['status'])).length,
    critique: signalements.filter(s => 
      s.urgenceCalculee === 'critical' || getUrgency(s.datePeremption, s.quantite) === 'critical'
    ).length,
    recent: signalements.filter(s => {
      const created = new Date(s.createdAt);
      const today = new Date();
      const diffTime = today.getTime() - created.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    }).length
  };
}

function getUrgency(datePeremption: string | Date, quantite: number): 'low' | 'medium' | 'high' | 'critical' {
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

export function DashboardStats({ signalements }: DashboardStatsProps) {
  const stats = calculateStats(signalements);

  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-l-slate-400'
    },
    {
      label: 'En attente',
      value: stats.enAttente,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-l-amber-400'
    },
    {
      label: 'En cours',
      value: stats.enCours,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-400'
    },
    {
      label: 'Écoulement',
      value: stats.ecoulement,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-l-emerald-400',
    },
    {
      label: 'Critiques',
      value: stats.critique,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-400'
    },
    {
      label: 'Aujourd\'hui',
      value: stats.recent,
      color: 'text-violet-700',
      bgColor: 'bg-violet-50',
      borderColor: 'border-l-violet-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat) => (
        <Card 
          key={stat.label} 
          className={`${stat.bgColor} border-l-4 ${stat.borderColor} hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-4">
            <div className="text-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}