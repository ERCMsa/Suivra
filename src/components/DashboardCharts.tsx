import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Product, StockMovement, DamageReport } from '@/hooks/useInventory';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

interface DashboardChartsProps {
  products: Product[];
  movements: StockMovement[];
  damageReports: DamageReport[];
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardCharts = ({ products, movements, damageReports }: DashboardChartsProps) => {
  const { t } = useLanguage();

  // Stock by category
  const byCategory: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.type.split('/')[0].trim();
    byCategory[cat] = (byCategory[cat] || 0) + p.quantity;
  });
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

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
    const label = r.severity;
    bySeverity[label] = (bySeverity[label] || 0) + 1;
  });
  const severityData = Object.entries(bySeverity).map(([name, value]) => ({ name, value }));

  const sevLabel = (s: string) => {
    const map: Record<string, string> = { low: t.severityLow, medium: t.severityMedium, high: t.severityHigh, critical: t.severityCritical };
    return map[s] || s;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Stock by category */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.chartStockByCategory}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Movement trend */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.chartMovementTrend}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={movementsByDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey={t.in} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey={t.out} stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Damage by severity */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.chartDamageBySeverity}</CardTitle>
        </CardHeader>
        <CardContent>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData.map((d) => ({ ...d, name: sevLabel(d.name) }))} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">{t.noDamageReports}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
