import { Package, Layers, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Product, StockMovement } from '@/hooks/useInventory';

interface StatsCardsProps {
  products: Product[];
  movements: StockMovement[];
  totalStock: number;
  totalSurface: number;
}

const StatsCards = ({ products, movements, totalStock, totalSurface }: StatsCardsProps) => {
  const inMovements = movements.filter((m) => m.type === 'in').length;
  const outMovements = movements.filter((m) => m.type === 'out').length;

  const stats = [
    { title: 'إجمالي المنتجات', value: products.length, unit: 'منتج', icon: Package, gradient: 'from-primary/10 to-primary/5', iconBg: 'bg-primary/12', iconColor: 'text-primary' },
    { title: 'إجمالي الكميات', value: totalStock, unit: 'وحدة', icon: Layers, gradient: 'from-accent/10 to-accent/5', iconBg: 'bg-accent/12', iconColor: 'text-accent' },
    { title: 'إجمالي المساحة', value: totalSurface, unit: 'م²', icon: BarChart3, gradient: 'from-success/10 to-success/5', iconBg: 'bg-success/12', iconColor: 'text-success' },
    { title: 'حركات الإدخال', value: inMovements, unit: 'عملية', icon: ArrowUpCircle, gradient: 'from-success/10 to-success/5', iconBg: 'bg-success/12', iconColor: 'text-success' },
    { title: 'حركات الإخراج', value: outMovements, unit: 'عملية', icon: ArrowDownCircle, gradient: 'from-destructive/10 to-destructive/5', iconBg: 'bg-destructive/12', iconColor: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className={`border-0 shadow-card hover:shadow-elevated transition-all duration-300 bg-gradient-to-br ${stat.gradient} overflow-hidden group`}
          style={{ animationDelay: `${index * 0.08}s`, animation: 'slideUp 0.4s ease-out backwards' }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {stat.value.toLocaleString('ar-SA')}
                </p>
                <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
              </div>
              <div className={`rounded-lg p-2 ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
