import { Wrench, Users, TrendingUp, PackageOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Employee } from '@/hooks/useEmployees';
import { Product } from '@/hooks/useInventory';

interface Discharge {
  id: string;
  employee_id: string;
  product_id: string;
  quantity: number;
  status: string;
  reference: string;
  date_out: string;
  items?: { product_id: string; quantity: number }[];
}

interface DischargeStatsProps {
  discharges: Discharge[];
  products: Product[];
  employees: Employee[];
}

const DischargeStats = ({ discharges, products, employees }: DischargeStatsProps) => {
  const { t } = useLanguage();

  const activeDischarges = discharges.filter(d => d.status === 'active');
  
  // Count equipment out of stock
  const equipmentOut = activeDischarges.reduce((sum, d) => {
    const itemsQty = d.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    return sum + d.quantity + itemsQty;
  }, 0);

  // Top workers by discharge count
  const workerCounts: Record<string, number> = {};
  discharges.forEach(d => {
    workerCounts[d.employee_id] = (workerCounts[d.employee_id] || 0) + 1;
  });
  const topWorkers = Object.entries(workerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([empId, count]) => ({
      employee: employees.find(e => e.id === empId),
      count,
    }));

  const stats = [
    {
      title: t.totalDischarges,
      value: discharges.length,
      icon: Wrench,
      gradient: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-600',
      glow: 'bg-cyan-500',
      cardGradient: 'from-cyan-50/80 to-teal-50/40',
    },
    {
      title: t.dischargeActiveCount,
      value: activeDischarges.length,
      icon: PackageOpen,
      gradient: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600',
      glow: 'bg-rose-500',
      cardGradient: 'from-rose-50/80 to-pink-50/40',
    },
    {
      title: t.equipmentOutCount,
      value: equipmentOut,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600',
      glow: 'bg-orange-500',
      cardGradient: 'from-amber-50/80 to-orange-50/40',
    },
    {
      title: t.workersWithEquipment,
      value: new Set(activeDischarges.map(d => d.employee_id)).size,
      icon: Users,
      gradient: 'bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-600',
      glow: 'bg-indigo-500',
      cardGradient: 'from-indigo-50/80 to-purple-50/40',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className={`border-0 shadow-card hover:shadow-elevated transition-all duration-300 bg-gradient-to-br ${stat.cardGradient} overflow-hidden group cursor-default`} style={{ animationDelay: `${index * 0.08}s`, animation: 'slideUp 0.4s ease-out backwards' }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{stat.value.toLocaleString('fr-FR')}</p>
                </div>
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-2xl blur-lg opacity-40 ${stat.glow}`} />
                    <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${stat.gradient} shadow-lg`}>
                      <div className="absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/30 to-transparent" />
                      <stat.icon className="h-5 w-5 text-white relative z-10 drop-shadow-sm" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {topWorkers.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {t.topWorkersByUsage}
            </h3>
            <div className="space-y-2">
              {topWorkers.map(({ employee, count }, i) => (
                <div key={employee?.id || i} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <span className="text-sm font-medium">{employee?.full_name || '—'}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{count} {t.dischargeHistory.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DischargeStats;
