// src/components/dashboard/DashboardStats.tsx
import { Package, Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../atoms/Card';
import { Signalement } from '@/lib/types';

interface DashboardStatsProps {
  signalements: Signalement[];
}

interface Stats {
  total: number;
  enAttente: number;
  enCours: number;
  critique: number;
  recent: number;
}

function calculateStats(signalements: Signalement[]): Stats {
  return {
    total: signalements.length,
    enAttente: signalements.filter(s => s.status === 'EN_ATTENTE').length,
    enCours: signalements.filter(s => s.status === 'EN_COURS').length,
    critique: signalements.filter(s => getUrgency(s.datePeremption, s.quantite) === 'critical').length,
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
      icon: Package,
      color: 'text-blue-600'
    },
    {
      label: 'En attente',
      value: stats.enAttente,
      icon: Calendar,
      color: 'text-gray-600'
    },
    {
      label: 'En cours',
      value: stats.enCours,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      label: 'Critiques',
      value: stats.critique,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      label: 'Aujourd\'hui',
      value: stats.recent,
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {statItems.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color === 'text-gray-600' ? 'text-gray-600' : stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}