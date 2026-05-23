import { useState, useEffect } from 'react';
import { RotateCcw, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Discharge } from '@/hooks/useDischarges';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface PartialReturnDialogProps {
  discharge: Discharge;
  products: Product[];
  employees?: Employee[];
  onConfirm: (
    dischargeId: string,
    returns: { item_id: string; product_id: string; quantity: number; new_returned_total: number; condition?: string; observation?: string }[]
  ) => Promise<string | null | void>;
  onStockReturn: (productId: string, quantity: number) => Promise<void>;
}

type ReturnState = { qty: number; condition: string; observation: string };

const CONDITIONS = [
  { value: 'bon', label: 'Bon état', color: 'bg-green-100 text-green-800' },
  { value: 'endommage', label: 'Endommagé', color: 'bg-amber-100 text-amber-800' },
  { value: 'perdu', label: 'Perdu', color: 'bg-red-100 text-red-800' },
];

const PartialReturnDialog = ({ discharge, products, employees, onConfirm, onStockReturn }: PartialReturnDialogProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Record<string, ReturnState>>({});
  const [submitting, setSubmitting] = useState(false);

  const items = discharge.items && discharge.items.length > 0
    ? discharge.items
    : [{ id: discharge.id, product_id: discharge.product_id, quantity: discharge.quantity, returned_quantity: 0, discharge_id: discharge.id, created_at: '' }];

  useEffect(() => {
    if (open) {
      const init: Record<string, ReturnState> = {};
      items.forEach(it => { init[it.id] = { qty: 0, condition: 'bon', observation: '' }; });
      setState(init);
    }
  }, [open]);

  const getProduct = (id: string) => products.find(p => p.id === id);
  const employee = employees?.find(e => e.id === discharge.employee_id);

  const generateBonRetourPDF = async (returnRef: string, processed: { item_id: string; product_id: string; quantity: number; condition?: string; observation?: string }[]) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header cartouche
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 30);

      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.src = '/images/ercm-logo.png';
        });
        doc.addImage(logoImg, 'PNG', 170, 12, 28, 18);
      } catch {}

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ERCMSA', 14, 18);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Etude Realisation Constructions Metaliques  Salhi ADEL', 14, 23);
      doc.text('SIDI SALEM NORD LOT 08 N° Q2 OULED MOUSSA BOUMERDES', 14, 27);
      doc.text('ercmsalhisteel@Email.com', 14, 31);

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BON DE RETOUR MATÉRIEL', 105, 52, { align: 'center' });

      // Info block
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleDateString('fr-FR');
      doc.text(`N° : ${returnRef}`, 14, 64);
      doc.text(`Date : ${dateStr}`, 105, 64);
      doc.text(`Réf. Sortie : ${discharge.reference}`, 14, 70);
      if (employee) doc.text(`Utilisateur : ${employee.full_name}`, 105, 70);
      if (discharge.project) doc.text(`Projet : ${discharge.project}`, 14, 76);
      const dateOut = new Date(discharge.date_out).toLocaleDateString('fr-FR');
      doc.text(`Date sortie : ${dateOut}`, 105, 76);

      // Table
      const rows = processed.map((r, i) => {
        const prod = getProduct(r.product_id);
        const cond = CONDITIONS.find(c => c.value === r.condition)?.label || '-';
        return [i + 1, prod?.designation || '-', prod?.thickness || '-', r.quantity, cond, r.observation || ''];
      });

      (doc as any).autoTable({
        startY: 84,
        head: [['N°', 'Désignation', 'Référence', 'Qté retournée', 'État', 'Observation']],
        body: rows,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [40, 70, 120], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
        margin: { left: 14, right: 14 },
      });

      let finalY = (doc as any).lastAutoTable.finalY + 10;

      // Signatures
      doc.setLineWidth(0.4);
      doc.rect(14, finalY, 88, 35);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Utilisateur (retour)', 18, finalY + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (employee) doc.text(employee.full_name, 18, finalY + 14);
      doc.text('Signature :', 18, finalY + 30);

      doc.rect(108, finalY, 88, 35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Magasinier / Responsable stock', 112, finalY + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Signature et cachet :', 112, finalY + 30);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('Document généré automatiquement - ERCM SA', 105, 285, { align: 'center' });

      doc.save(`bon_retour_${returnRef}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleConfirm = async () => {
    const toProcess = items
      .filter(it => (state[it.id]?.qty || 0) > 0)
      .map(it => {
        const s = state[it.id];
        const newTotal = Number(it.returned_quantity || 0) + s.qty;
        return {
          item_id: it.id,
          product_id: it.product_id,
          quantity: s.qty,
          new_returned_total: newTotal,
          condition: s.condition,
          observation: s.observation,
        };
      });

    if (toProcess.length === 0) {
      toast.error(t.fillRequired);
      return;
    }

    setSubmitting(true);
    try {
      const returnRef = await onConfirm(discharge.id, toProcess);
      // Restore stock only for items returned in good condition (damaged/lost stays out)
      for (const r of toProcess) {
        if (r.condition === 'bon') {
          await onStockReturn(r.product_id, r.quantity);
        }
      }
      if (returnRef) {
        await generateBonRetourPDF(returnRef, toProcess);
      }
      toast.success((t as any).partialReturnSuccess || 'Retour enregistré');
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(t.dischargeFail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
        title="Entrée matériel (retour)"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-600" />
            ENTRÉE MATÉRIEL — Retour
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Réf. sortie : <b>{discharge.reference}</b>
            {employee && <> · Utilisateur : <b>{employee.full_name}</b></>}
            {discharge.project && <> · Projet : <b>{discharge.project}</b></>}
          </p>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {items.map(it => {
            const prod = getProduct(it.product_id);
            const total = Number(it.quantity);
            const alreadyReturned = Number(it.returned_quantity || 0);
            const remaining = total - alreadyReturned;
            const s = state[it.id] || { qty: 0, condition: 'bon', observation: '' };

            return (
              <div key={it.id} className="rounded-xl border border-border/60 p-3 space-y-3 bg-secondary/10">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-medium text-sm">{prod?.designation || '-'}</div>
                    {prod?.thickness && <div className="text-[11px] text-muted-foreground">Réf : {prod.thickness}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Sortie : {total}</Badge>
                    {alreadyReturned > 0 && <Badge className="text-[10px] bg-green-100 text-green-800">Rendu : {alreadyReturned}</Badge>}
                    <Badge className="text-[10px] bg-amber-100 text-amber-800">Restant : {remaining}</Badge>
                  </div>
                </div>

                {remaining > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[11px]">Qté à retourner</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          value={s.qty}
                          onChange={e => {
                            const v = Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0));
                            setState(r => ({ ...r, [it.id]: { ...s, qty: v } }));
                          }}
                          className="rounded-xl h-9 text-center"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-9 px-2"
                          onClick={() => setState(r => ({ ...r, [it.id]: { ...s, qty: remaining } }))}
                        >Max</Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[11px]">État du matériel</Label>
                      <Select value={s.condition} onValueChange={v => setState(r => ({ ...r, [it.id]: { ...s, condition: v } }))}>
                        <SelectTrigger className="rounded-xl h-9 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px]">Observation</Label>
                      <Textarea
                        value={s.observation}
                        onChange={e => setState(r => ({ ...r, [it.id]: { ...s, observation: e.target.value } }))}
                        placeholder="Remarque (optionnel)..."
                        className="rounded-xl h-9 min-h-9 mt-1 text-xs resize-none"
                        rows={1}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-success">✓ Entièrement retourné</p>
                )}
              </div>
            );
          })}

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-2 text-[11px] text-muted-foreground flex items-center gap-2">
            <FileDown className="h-3.5 w-3.5 text-primary" />
            Un <b>Bon de Retour Matériel</b> sera généré automatiquement en PDF à la validation.
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? t.loading : 'Valider le retour + PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartialReturnDialog;
