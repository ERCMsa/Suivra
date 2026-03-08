import { Package, Layers, ArrowUpCircle, ArrowDownCircle, ClipboardList, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Product, StockMovement } from '@/hooks/useInventory';
import { useLanguage } from '@/hooks/useLanguage';

interface StatsCardsProps {
  products: Product[];
  movements: StockMovement[];
  totalStock: number;
  totalSurface: number;
}

interface GlassIconProps {
  icon: LucideIcon;
  gradient: string;
  glow: string;
}

const GlassIcon = ({ icon: Icon, gradient, glow }: GlassIconProps) => (
  <div className="relative">
    <div className={`absolute inset-0 rounded-2xl blur-lg opacity-40 ${glow}`} />
    <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${gradient} shadow-lg`}>
      <div className="absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/30 to-transparent" />
      <Icon className="h-5 w-5 text-white relative z-10 drop-shadow-sm" strokeWidth={2.2} />
    </div>
  </div>
);

const StatsCards = ({ products, movements, totalStock }: StatsCardsProps) => {
  const { t } = useLanguage();
  const inMovements = movements.filter((m) => m.type === 'in').length;
  const outMovements = movements.filter((m) => m.type === 'out').length;

  const stats = [
    { title: t.totalProducts, value: products.length, unit: t.product, icon: Package, gradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600', glow: 'bg-blue-500', cardGradient: 'from-blue-50/80 to-indigo-50/40' },
    { title: t.totalQuantity, value: totalStock, unit: t.unit, icon: Layers, gradient: 'bg-gradient-to-br from-violet-400 via-purple-500 to-purple-600', glow: 'bg-purple-500', cardGradient: 'from-violet-50/80 to-purple-50/40' },
    { title: t.inMovements, value: inMovements, unit: t.operation, icon: ArrowUpCircle, gradient: 'bg-gradient-to-br from-emerald-400 via-green-500 to-green-600', glow: 'bg-green-500', cardGradient: 'from-emerald-50/80 to-green-50/40' },
    { title: t.outMovements, value: outMovements, unit: t.operation, icon: ArrowDownCircle, gradient: 'bg-gradient-to-br from-orange-400 via-red-500 to-rose-600', glow: 'bg-red-500', cardGradient: 'from-orange-50/80 to-rose-50/40' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={stat.title} className={`border-0 shadow-card hover:shadow-elevated transition-all duration-300 bg-gradient-to-br ${stat.cardGradient} overflow-hidden group cursor-default`} style={{ animationDelay: `${index * 0.08}s`, animation: 'slideUp 0.4s ease-out backwards' }}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{stat.value.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-muted-foreground/70">{stat.unit}</p>
              </div>
              <div className="group-hover:scale-110 transition-transform duration-300">
                <GlassIcon icon={stat.icon} gradient={stat.gradient} glow={stat.glow} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
