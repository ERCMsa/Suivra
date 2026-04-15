import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Product, StockMovement, DamageReport } from '@/hooks/useInventory';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';
import { Package, TrendingUp, Eye } from 'lucide-react';

interface DashboardChartsProps {
  products: Product[];
  movements: StockMovement[];
  damageReports: DamageReport[];
}

const GRADIENT_COLORS = [
  { start: '#6366f1', end: '#a78bfa' },
  { start: '#f59e0b', end: '#fbbf24' },
  { start: '#10b981', end: '#34d399' },
  { start: '#ef4444', end: '#f87171' },
  { start: '#8b5cf6', end: '#c4b5fd' },
  { start: '#ec4899', end: '#f9a8d4' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const DashboardCharts = ({ products, movements, damageReports }: DashboardChartsProps) => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Stock by category
  const byCategory: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.type.split('/')[0].trim();
    byCategory[cat] = (byCategory[cat] || 0) + p.quantity;
  });
  const categoryData = Object.entries(byCategory)
    .map(([name, value], i) => ({ name, value, fill: GRADIENT_COLORS[i % GRADIENT_COLORS.length].start }))
    .sort((a, b) => b.value - a.value);

  // Movements over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const movementsByDay = last7Days.map((day) => {
    const dayMovements = movements.filter((m) => m.created_at.slice(0, 10) === day);
    return {
      day: day.slice(5),
      [t.in]: dayMovements.filter((m) => m.type === 'in').reduce((s, m) => s + m.quantity, 0),
      [t.out]: dayMovements.filter((m) => m.type === 'out').reduce((s, m) => s + m.quantity, 0),
    };
  });

  // Top 9 products: most moved (used) products, then most recent
  const movementCount: Record<string, number> = {};
  movements.forEach((m) => {
    movementCount[m.product_id] = (movementCount[m.product_id] || 0) + m.quantity;
  });

  const topProducts = [...products]
    .filter((p) => p.image_url)
    .sort((a, b) => {
      const aCount = movementCount[a.id] || 0;
      const bCount = movementCount[b.id] || 0;
      if (bCount !== aCount) return bCount - aCount;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 9);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stock by category */}
        <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t.chartStockByCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" barCategoryGap="20%">
                <defs>
                  {categoryData.map((_, i) => (
                    <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={GRADIENT_COLORS[i % GRADIENT_COLORS.length].start} />
                      <stop offset="100%" stopColor={GRADIENT_COLORS[i % GRADIENT_COLORS.length].end} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={`url(#barGrad${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Movement trend */}
        <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t.chartMovementTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={movementsByDay}>
                <defs>
                  <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey={t.in} stroke="#10b981" strokeWidth={2.5} fill="url(#gradIn)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                <Area type="monotone" dataKey={t.out} stroke="#ef4444" strokeWidth={2.5} fill="url(#gradOut)" dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Materials Gallery 3x3 */}
        <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t.topMaterials || 'المواد الأكثر استعمالاً'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {topProducts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {topProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-muted/30 border border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:scale-[1.03]"
                    onClick={() => setSelectedImage(product.image_url)}
                  >
                    <img
                      src={product.image_url!}
                      alt={product.designation}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-1.5">
                      <p className="text-[9px] font-semibold text-white leading-tight line-clamp-2">{product.designation}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Package className="h-2.5 w-2.5 text-white/80" />
                        <span className="text-[8px] text-white/80">{product.quantity} {product.unit}</span>
                      </div>
                    </div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-3 w-3 text-white drop-shadow-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-2">
                <Package className="h-8 w-8 opacity-40" />
                <p className="text-xs">{t.noProducts || 'لا توجد صور للمواد'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-lg p-2">
          {selectedImage && (
            <img src={selectedImage} alt="Product" className="w-full h-auto rounded-lg object-contain max-h-[70vh]" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardCharts;
