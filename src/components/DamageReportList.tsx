import { AlertTriangle, User, Users, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { Product } from '@/hooks/useInventory';

interface DamageReport {
  id: string;
  product_id: string;
  damage_date: string;
  description: string;
  severity: string;
  responsible_person: string | null;
  responsible_team: string | null;
  quantity_damaged: number;
  action_taken: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

interface DamageReportListProps {
  reports: DamageReport[];
  products: Product[];
}

const DamageReportList = ({ reports, products }: DamageReportListProps) => {
  const { t } = useLanguage();

  const getProductName = (id: string) => products.find((p) => p.id === id)?.designation || '—';

  const severityColor = (s: string) => {
    switch (s) {
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'critical': return 'bg-red-200 text-red-900 border-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const severityLabel = (s: string) => {
    switch (s) {
      case 'low': return t.severityLow;
      case 'medium': return t.severityMedium;
      case 'high': return t.severityHigh;
      case 'critical': return t.severityCritical;
      default: return s;
    }
  };

  if (reports.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">{t.noDamageReports}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          {t.damageReports} ({reports.length.toLocaleString('fr-FR')})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl border p-4 space-y-2 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-sm">{getProductName(r.product_id)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(r.damage_date).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {t.quantityDamaged}: {r.quantity_damaged.toLocaleString('fr-FR')}
                </Badge>
                <Badge className={`text-xs ${severityColor(r.severity)}`}>
                  {severityLabel(r.severity)}
                </Badge>
              </div>
            </div>

            <p className="text-sm">{r.description}</p>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {r.responsible_person && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {r.responsible_person}
                </span>
              )}
              {r.responsible_team && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {r.responsible_team}
                </span>
              )}
            </div>

            {r.action_taken && (
              <div className="text-xs bg-muted/50 rounded-lg p-2 flex items-start gap-1">
                <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{r.action_taken}</span>
              </div>
            )}

            {r.notes && (
              <p className="text-xs text-muted-foreground italic">{r.notes}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DamageReportList;
