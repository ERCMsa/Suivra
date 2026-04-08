import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Product, StockMovement, DamageReport } from '@/hooks/useInventory';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';

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

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

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

  // Damage by severity
  const bySeverity: Record<string, number> = {};
  damageReports.forEach((r) => {
    bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
  });
  const severityData = Object.entries(bySeverity).map(([name, value]) => ({ name, value }));

  const sevLabel = (s: string) => {
    const map: Record<string, string> = { low: t.severityLow, medium: t.severityMedium, high: t.severityHigh, critical: t.severityCritical };
    return map[s] || s;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Stock by category - Rounded Bar Chart with gradient */}
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

      {/* Movement trend - Area Chart with gradient fill */}
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

      {/* Damage by severity - Donut Chart */}
      <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t.chartDamageBySeverity}</CardTitle>
        </CardHeader>
        <CardContent>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  {severityData.map((_, i) => (
                    <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={GRADIENT_COLORS[i % GRADIENT_COLORS.length].start} />
                      <stop offset="100%" stopColor={GRADIENT_COLORS[i % GRADIENT_COLORS.length].end} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={severityData.map((d) => ({ ...d, name: sevLabel(d.name) }))}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  cornerRadius={6}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ strokeWidth: 1, stroke: 'hsl(var(--muted-foreground))' }}
                >
                  {severityData.map((_, i) => (
                    <Cell key={i} fill={`url(#pieGrad${i})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">{t.noDamageReports}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
