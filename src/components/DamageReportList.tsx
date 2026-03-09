import { AlertTriangle, User, Users, Calendar, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useProfiles } from '@/hooks/useProfiles';
import UserAvatar from '@/components/UserAvatar';
import { Product } from '@/hooks/useInventory';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

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
  const { t, lang } = useLanguage();
  const { getProfileByUserId } = useProfiles();

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

  const exportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Title
      doc.setFontSize(18);
      doc.setTextColor(180, 40, 40);
      doc.text(t.pdfTitle, doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${t.pdfGeneratedOn}: ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' }
      );

      // Summary line
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const totalQty = reports.reduce((s, r) => s + r.quantity_damaged, 0);
      doc.text(
        `${t.totalDamageReports}: ${reports.length} | ${t.totalDamagedItems}: ${totalQty}`,
        doc.internal.pageSize.getWidth() / 2, 32, { align: 'center' }
      );

      const headers = [
        [t.pdfDate, t.pdfItem, t.pdfDescription, t.pdfSeverity, t.pdfQty, t.pdfPerson, t.pdfTeam, t.pdfAction]
      ];

      const rows = reports.map((r) => [
        new Date(r.damage_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }),
        getProductName(r.product_id),
        r.description.substring(0, 60) + (r.description.length > 60 ? '...' : ''),
        severityLabel(r.severity),
        r.quantity_damaged.toLocaleString('fr-FR'),
        r.responsible_person || '—',
        r.responsible_team || '—',
        (r.action_taken || '—').substring(0, 40) + ((r.action_taken || '').length > 40 ? '...' : ''),
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 38,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: [180, 40, 40], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [252, 245, 245] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 35 },
          2: { cellWidth: 55 },
          3: { cellWidth: 22 },
          4: { cellWidth: 18 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
          7: { cellWidth: 45 },
        },
        didDrawPage: (data: any) => {
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `${t.pdfPage} ${(doc as any).internal.getCurrentPageInfo?.()?.pageNumber || data.pageNumber || ''}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
          );
          doc.text('ERCM SA', 14, doc.internal.pageSize.getHeight() - 8);
        },
      });

      doc.save(`rapport-dommages-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t.damageReports} ({reports.length.toLocaleString('fr-FR')})
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl text-xs" onClick={exportPdf}>
            <Download className="h-3.5 w-3.5" />
            {t.exportDamagePdf}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.map((r) => {
          const creatorProfile = r.created_by ? getProfileByUserId(r.created_by) : null;
          return (
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

            {creatorProfile && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                <UserAvatar name={creatorProfile.display_name} avatarUrl={creatorProfile.avatar_url} size="sm" />
                <span className="text-[11px] text-muted-foreground">{t.operatedBy}: {creatorProfile.display_name}</span>
              </div>
            )}
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DamageReportList;
