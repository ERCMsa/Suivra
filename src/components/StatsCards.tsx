import { Package, Layers, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Product, StockMovement } from '@/types/inventory';

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
    {
      title: 'إجمالي المنتجات',
      value: products.length,
      unit: 'منتج',
      icon: Package,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'إجمالي الكميات',
      value: totalStock,
      unit: 'وحدة',
      icon: Layers,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'إجمالي المساحة',
      value: totalSurface,
      unit: 'م²',
      icon: Layers,
      color: 'bg-success/10 text-success',
    },
    {
      title: 'حركات الإدخال',
      value: inMovements,
      unit: 'عملية',
      icon: ArrowUpCircle,
      color: 'bg-success/10 text-success',
    },
    {
      title: 'حركات الإخراج',
      value: outMovements,
      unit: 'عملية',
      icon: ArrowDownCircle,
      color: 'bg-destructive/10 text-destructive',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="shadow-card animate-slide-up border-0"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {stat.value.toLocaleString('ar-SA')}
                  <span className="mr-1 text-sm font-normal text-muted-foreground">
                    {stat.unit}
                  </span>
                </p>
              </div>
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
