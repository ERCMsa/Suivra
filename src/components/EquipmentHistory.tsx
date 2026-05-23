import { useState } from 'react';
import { History, User, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Discharge } from '@/hooks/useDischarges';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';

interface EquipmentHistoryProps {
  discharges: Discharge[];
  products: Product[];
  employees: Employee[];
}

const EquipmentHistory = ({ discharges, products, employees }: EquipmentHistoryProps) => {
  const { t } = useLanguage();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [expanded, setExpanded] = useState(true);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  // Get all products that have been in at least one discharge
  const productsWithHistory = products.filter(p =>
    discharges.some(d => d.product_id === p.id || d.items?.some(i => i.product_id === p.id))
  );

  // Get history for selected product
  const productHistory = selectedProductId
    ? discharges
        .filter(d => d.product_id === selectedProductId || d.items?.some(i => i.product_id === selectedProductId))
        .sort((a, b) => new Date(a.date_out).getTime() - new Date(b.date_out).getTime())
    : [];

  const handlePrintHistory = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header
      doc.setDrawColor(0); doc.setLineWidth(0.4);
      doc.rect(10, 10, 190, 22);
      try {
        const logoImg = new Image(); logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => { logoImg.onload = () => res(); logoImg.onerror = () => rej(); logoImg.src = '/images/ercm-logo.png'; });
        doc.addImage(logoImg, 'PNG', 170, 12, 28, 18);
      } catch {}
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('ERCMSA - HISTORIQUE DE MATÉRIEL', 14, 20);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(`Édité le : ${new Date().toLocaleString('fr-FR')}`, 14, 27);

      const prod = products.find(p => p.id === selectedProductId);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(`Matériel : ${prod?.designation || '-'}`, 14, 40);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Stock actuel : ${prod?.quantity ?? 0} ${prod?.unit || ''}`, 14, 46);

      // Aggregate movement totals from history for this product
      let totalOut = 0, totalReturned = 0;
      productHistory.forEach(d => {
        const item = d.items?.find(i => i.product_id === selectedProductId);
        const q = Number(item?.quantity || d.quantity);
        const r = Number(item?.returned_quantity || 0);
        totalOut += q; totalReturned += r;
      });
      doc.text(`Total sorties : ${totalOut}    |    Total retours : ${totalReturned}    |    En cours : ${totalOut - totalReturned}`, 14, 52);

      const rows = productHistory.map((d, i) => {
        const emp = getEmployee(d.employee_id);
        const item = d.items?.find(it => it.product_id === selectedProductId);
        const q = Number(item?.quantity || d.quantity);
        const r = Number(item?.returned_quantity || 0);
        return [
          i + 1,
          d.reference,
          new Date(d.date_out).toLocaleDateString('fr-FR'),
          emp?.full_name || '-',
          d.project || '-',
          q,
          r,
          d.date_returned ? new Date(d.date_returned).toLocaleDateString('fr-FR') : '-',
          d.status === 'returned' ? 'Retourné' : d.status === 'partially_returned' ? 'Partiel' : d.status === 'cancelled' ? 'Annulé' : 'En cours',
        ];
      });

      (doc as any).autoTable({
        startY: 58,
        head: [['N°', 'Réf.', 'Date sortie', 'Utilisateur', 'Projet', 'Qté', 'Rendu', 'Date retour', 'Statut']],
        body: rows,
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [40, 70, 120], textColor: 255, fontStyle: 'bold' },
        margin: { left: 10, right: 10 },
      });

      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} / ${totalPages}`, 105, 290, { align: 'center' });
      }

      doc.save(`historique_${prod?.designation || 'materiel'}_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success(t.exportSuccess);
    } catch (e) {
      console.error(e);
      toast.error(t.exportFail);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <History className="h-5 w-5 text-primary" />
            HISTORIQUE DE MATÉRIEL
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="max-w-xs rounded-xl text-sm w-[220px]">
                <SelectValue placeholder={t.selectEquipment} />
              </SelectTrigger>
              <SelectContent>
                {productsWithHistory.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.designation}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={handlePrintHistory}
              disabled={!selectedProductId || productHistory.length === 0}
            >
              <Printer className="h-4 w-4" />
              Imprimer Historique
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {!selectedProductId ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t.selectEquipmentPrompt}</p>
          ) : productHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t.noEquipmentHistory}</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 start-4 w-0.5 bg-border" />
              <div className="space-y-4">
                {productHistory.map((d, idx) => {
                  const emp = getEmployee(d.employee_id);
                  const isActive = d.status === 'active';
                  const itemQty = d.items?.find(i => i.product_id === selectedProductId)?.quantity || d.quantity;
                  return (
                    <div key={d.id} className="relative flex gap-4 ps-10">
                      {/* Timeline dot */}
                      <div className={`absolute start-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${isActive ? 'bg-amber-500' : 'bg-green-500'}`} />
                      <div className={`flex-1 rounded-xl border p-3 ${isActive ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-sm">{emp?.full_name || '-'}</span>
                            {emp?.employee_id && <span className="text-xs text-muted-foreground">#{emp.employee_id}</span>}
                          </div>
                          <Badge className={isActive ? 'bg-amber-100 text-amber-800 text-xs' : 'bg-green-100 text-green-800 text-xs'}>
                            {isActive ? t.dischargeActive : t.dischargeReturnedStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-amber-600" />
                            {t.takenOn}: {new Date(d.date_out).toLocaleDateString('fr-FR')}
                          </span>
                          {d.date_returned && (
                            <span className="flex items-center gap-1">
                              <ArrowLeft className="h-3 w-3 text-green-600" />
                              {t.returnedOn}: {new Date(d.date_returned).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          <span>{t.quantity}: <b>{itemQty}</b></span>
                          <span className="text-xs font-mono">{d.reference}</span>
                        </div>
                        {d.notes && <p className="text-xs text-muted-foreground mt-1 italic">{d.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default EquipmentHistory;
