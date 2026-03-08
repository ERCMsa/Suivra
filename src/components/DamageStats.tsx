import { AlertTriangle, User, Building2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';

interface DamageReport {
  id: string;
  responsible_person: string | null;
  responsible_team: string | null;
  quantity_damaged: number;
  severity: string;
}

interface DamageStatsProps {
  reports: DamageReport[];
}

const DamageStats = ({ reports }: DamageStatsProps) => {
  const { t } = useLanguage();

  if (reports.length === 0) return null;

  // Stats by person
  const byPerson: Record<string, { count: number; qty: number }> = {};
  // Stats by team/department
  const byTeam: Record<string, { count: number; qty: number }> = {};

  reports.forEach((r) => {
    const person = r.responsible_person || t.unknown;
    if (!byPerson[person]) byPerson[person] = { count: 0, qty: 0 };
    byPerson[person].count++;
    byPerson[person].qty += r.quantity_damaged;

    const team = r.responsible_team || t.unknown;
    if (!byTeam[team]) byTeam[team] = { count: 0, qty: 0 };
    byTeam[team].count++;
    byTeam[team].qty += r.quantity_damaged;
  });

  const sortedPersons = Object.entries(byPerson).sort((a, b) => b[1].count - a[1].count);
  const sortedTeams = Object.entries(byTeam).sort((a, b) => b[1].count - a[1].count);

  const totalDamaged = reports.reduce((s, r) => s + r.quantity_damaged, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Summary */}
      <Card className="rounded-2xl sm:col-span-2">
        <CardContent className="pt-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-destructive">{reports.length.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-muted-foreground">{t.totalDamageReports}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{totalDamaged.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-muted-foreground">{t.totalDamagedItems}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{sortedPersons.length.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-muted-foreground">{t.personsInvolved}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Person */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-destructive" />
            {t.damageByPerson}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedPersons.map(([name, data]) => (
            <div key={name} className="flex items-center justify-between rounded-lg border p-2.5">
              <span className="text-sm font-medium truncate flex-1">{name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  {data.count.toLocaleString('fr-FR')} {t.damageCase}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {data.qty.toLocaleString('fr-FR')} {t.unit}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* By Team */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-destructive" />
            {t.damageByTeam}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedTeams.map(([name, data]) => (
            <div key={name} className="flex items-center justify-between rounded-lg border p-2.5">
              <span className="text-sm font-medium truncate flex-1">{name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  {data.count.toLocaleString('fr-FR')} {t.damageCase}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {data.qty.toLocaleString('fr-FR')} {t.unit}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DamageStats;
