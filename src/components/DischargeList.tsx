import { useState, useMemo } from 'react';
import { FileCheck, RotateCcw, FileText, Search, Package, Trash2, Eye, X, Filter, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Discharge } from '@/hooks/useDischarges';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import EditDischargeForm from './EditDischargeForm';
import PartialReturnDialog from './PartialReturnDialog';
import { PDF_FONT, setupPdfFont } from '@/lib/pdfFonts';

interface DischargeListProps {
  discharges: Discharge[];
  products: Product[];
  employees: Employee[];
  onMarkReturned: (id: string, productId: string, quantity: number) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onEditDischarge?: (
    id: string,
    data: { employee_id?: string; project?: string | null; notes?: string | null; items?: { id?: string; product_id: string; quantity: number }[] },
    onStockAdjust?: (productId: string, delta: number) => Promise<void>
  ) => Promise<void>;
  onPartialReturn?: (
    dischargeId: string,
    returns: { item_id: string; product_id: string; quantity: number; new_returned_total: number }[]
  ) => Promise<void>;
  onStockAdjust?: (productId: string, delta: number) => Promise<void>;
  onStockReturn?: (productId: string, quantity: number) => Promise<void>;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const DischargeList = ({ discharges, products, employees, onMarkReturned, onCancel, onEditDischarge, onPartialReturn, onStockAdjust, onStockReturn }: DischargeListProps) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const filtered = useMemo(() => {
    return discharges.filter(d => {
      const emp = getEmployee(d.employee_id);
      const prod = getProduct(d.product_id);
      const term = search.toLowerCase();
      const matchesSearch = !term ||
        d.reference.toLowerCase().includes(term) ||
        (emp?.full_name || '').toLowerCase().includes(term) ||
        (prod?.designation || '').toLowerCase().includes(term) ||
        (d.project || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [discharges, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const recentDischarges = discharges.slice(0, 5);

  const handleReturn = async (d: Discharge) => {
    try {
      await onMarkReturned(d.id, d.product_id, d.quantity);
      toast.success(t.dischargeReturned);
    } catch {
      toast.error(t.dischargeFail);
    }
  };

  const handleCancel = async (d: Discharge) => {
    if (!onCancel) return;
    try {
      await onCancel(d.id);
      toast.success(t.dischargeCancelled || 'Décharge annulée');
    } catch {
      toast.error(t.dischargeFail);
    }
  };

  const generatePDF = async (d: Discharge) => {
    const emp = getEmployee(d.employee_id);
    const prod = getProduct(d.product_id);
    if (!emp || !prod) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      await setupPdfFont(doc);
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ====== EN-TÊTE OFFICIEL FOR-MGX-04 ======
      const headerY = 8;
      const headerH = 22;
      const logoW = 38;
      const rightW = 60;
      const titleX = 10 + logoW;
      const titleW = pageW - 20 - logoW - rightW;

      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.rect(10, headerY, pageW - 20, headerH);
      doc.line(10 + logoW, headerY, 10 + logoW, headerY + headerH);
      doc.line(pageW - 10 - rightW, headerY, pageW - 10 - rightW, headerY + headerH);
      doc.line(10, headerY + headerH - 6, 10 + logoW, headerY + headerH - 6);
      doc.line(titleX, headerY + headerH / 2, titleX + titleW, headerY + headerH / 2);
      doc.line(pageW - 10 - rightW, headerY + headerH / 3, pageW - 10, headerY + headerH / 3);
      doc.line(pageW - 10 - rightW, headerY + (headerH / 3) * 2, pageW - 10, headerY + (headerH / 3) * 2);
      const rightLabelW = 24;
      doc.line(pageW - 10 - rightW + rightLabelW, headerY, pageW - 10 - rightW + rightLabelW, headerY + headerH);

      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.src = '/images/ercm-logo.png';
        });
        doc.addImage(logoImg, 'PNG', 12, headerY + 1, logoW - 4, headerH - 8);
      } catch {}

      doc.setFontSize(6);
      doc.setFont(PDF_FONT, 'normal');
      doc.text('Page 1 sur 1', 12, headerY + headerH - 2);

      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(11);
      doc.text('Formulaire', titleX + titleW / 2, headerY + headerH / 2 - 2, { align: 'center' });
      doc.text('Entrée / Sortie matériel', titleX + titleW / 2, headerY + headerH / 2 + 5, { align: 'center' });

      const rLabelX = pageW - 10 - rightW + 2;
      const rValueX = pageW - 10 - rightW + rightLabelW + 2;
      const rowH = headerH / 3;
      doc.setFontSize(8);
      doc.setFont(PDF_FONT, 'bold');
      doc.text('Référence :', rLabelX, headerY + rowH / 2 + 1);
      doc.text('Date :', rLabelX, headerY + rowH * 1.5 + 1);
      doc.text('Version :', rLabelX, headerY + rowH * 2.5 + 1);
      doc.setFont(PDF_FONT, 'normal');
      doc.text('FOR-MGX-04', rValueX, headerY + rowH / 2 + 1);
      doc.text(new Date().toLocaleDateString('fr-FR'), rValueX, headerY + rowH * 1.5 + 1);
      doc.text('00', rValueX, headerY + rowH * 2.5 + 1);

      // ====== TITRE DOCUMENT + STATUT ======
      let y = headerY + headerH + 6;
      doc.setFontSize(15);
      doc.setFont(PDF_FONT, 'bold');
      doc.text('ENTRÉE / SORTIE DE MATÉRIEL', pageW / 2, y, { align: 'center' });
      y += 6;

      const statusLabel = d.status === 'returned' ? 'RETOURNÉ'
        : d.status === 'partially_returned' ? 'RETOUR PARTIEL'
        : d.status === 'cancelled' ? 'ANNULÉ'
        : 'SORTIE EN COURS';
      const statusColor: [number, number, number] = d.status === 'returned' ? [200, 240, 200]
        : d.status === 'partially_returned' ? [255, 230, 190]
        : d.status === 'cancelled' ? [255, 200, 200]
        : [255, 240, 180];
      doc.setFillColor(...statusColor);
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      const sbW = 60, sbH = 7;
      doc.rect((pageW - sbW) / 2, y, sbW, sbH, 'FD');
      doc.setFontSize(10);
      doc.setFont(PDF_FONT, 'bold');
      doc.text(`STATUT : ${statusLabel}`, pageW / 2, y + 5, { align: 'center' });
      y += sbH + 5;

      // Infos générales
      const dateOut = new Date(d.date_out).toLocaleDateString('fr-FR');
      const timeOut = new Date(d.date_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      doc.setFontSize(9);
      doc.setFont(PDF_FONT, 'normal');
      doc.text(`Référence : ${d.reference}`, 14, y);
      doc.text(`Date sortie : ${dateOut}    Heure : ${timeOut}`, pageW - 14, y, { align: 'right' });
      y += 5;
      doc.text(`Utilisateur : ${emp.full_name}`, 14, y);
      doc.text(`Fonction : ${emp.position || emp.department || '-'}`, pageW - 14, y, { align: 'right' });
      y += 5;
      if (d.project) {
        doc.setFont(PDF_FONT, 'bold');
        doc.text(`Projet : ${d.project}`, 14, y);
        doc.setFont(PDF_FONT, 'normal');
        y += 5;
      }

      // ====== TABLEAU MATÉRIEL ======
      const its = (d.items && d.items.length > 0) ? d.items : [{ id: '', product_id: d.product_id, quantity: d.quantity, returned_quantity: 0 } as any];
      const rows = its.map((it: any, idx) => {
        const p = products.find(pp => pp.id === it.product_id);
        const ret = Number(it.returned_quantity || 0);
        const rem = Number(it.quantity) - ret;
        return [idx + 1, p?.designation || '-', p?.type || '-', it.quantity, ret, rem, it.return_condition || '-'];
      });
      (doc as any).autoTable({
        startY: y,
        head: [['N°', 'Désignation', 'Référence', 'Qté Sortie', 'Qté Retour', 'Reste', 'État retour']],
        body: rows,
        styles: { font: PDF_FONT, fontSize: 9, halign: 'center', cellPadding: 2.5, lineWidth: 0.25, lineColor: [0, 0, 0] },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.3, lineColor: [0, 0, 0] },
        columnStyles: { 1: { halign: 'left' }, 2: { halign: 'left' } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 4;

      if (d.notes) {
        doc.setFontSize(8);
        doc.setFont(PDF_FONT, 'bold');
        doc.text('Observations sortie :', 14, y);
        doc.setFont(PDF_FONT, 'normal');
        const nLines = doc.splitTextToSize(d.notes, pageW - 28);
        doc.text(nLines, 14, y + 4);
        y += 4 + nLines.length * 4;
      }
      y += 3;

      // ====== SECTION RETOUR DU MATÉRIEL ======
      const returnedItems = its.filter((i: any) => Number(i.returned_quantity || 0) > 0);
      const retBoxH = 32;
      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.rect(14, y, pageW - 28, retBoxH);
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y, pageW - 28, 6, 'FD');
      doc.setFontSize(9);
      doc.setFont(PDF_FONT, 'bold');
      doc.text('RETOUR DU MATÉRIEL', pageW / 2, y + 4.2, { align: 'center' });

      const retDate = d.date_returned ? new Date(d.date_returned) : null;
      const retDateStr = retDate ? retDate.toLocaleDateString('fr-FR') : '....................';
      const retTimeStr = retDate ? retDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '..........';
      const retCondition = returnedItems.map((i: any) => i.return_condition).filter(Boolean).join(', ') || '....................';
      const retObs = returnedItems.map((i: any) => i.return_observation).filter(Boolean).join(' ; ') || '....................';

      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(8.5);
      let ry = y + 11;
      doc.text(`Date de retour : ${retDateStr}`, 17, ry);
      doc.text(`Heure : ${retTimeStr}`, pageW / 2 + 10, ry);
      ry += 5;
      doc.text(`État du matériel : ${retCondition}`, 17, ry);
      ry += 5;
      const obsLines = doc.splitTextToSize(`Observation : ${retObs}`, pageW - 34);
      doc.text(obsLines, 17, ry);
      ry += obsLines.length * 4 + 1;
      doc.text('Responsable de retour : ....................................................', 17, ry);

      y += retBoxH + 5;

      // ====== ZONE SIGNATURES (4 cases) ======
      const sigW = (pageW - 28 - 6) / 4;
      const sigH = 28;
      const sigLabels = ['Signature Magasinier', 'Signature Responsable', "Signature Utilisateur", 'Signature lors du retour'];
      for (let i = 0; i < 4; i++) {
        const sx = 14 + i * (sigW + 2);
        doc.setLineWidth(0.3);
        doc.rect(sx, y, sigW, sigH);
        doc.setFillColor(245, 245, 245);
        doc.rect(sx, y, sigW, 5, 'FD');
        doc.setFontSize(7.5);
        doc.setFont(PDF_FONT, 'bold');
        doc.text(sigLabels[i], sx + sigW / 2, y + 3.5, { align: 'center' });
      }
      y += sigH + 4;

      // Pied de page
      doc.setFontSize(7);
      doc.setFont(PDF_FONT, 'italic');
      doc.text("Document généré automatiquement — Fiche de circulation du matériel — À conserver", pageW / 2, pageH - 8, { align: 'center' });

      doc.save(`fiche_entree_sortie_${d.reference}.pdf`);
      toast.success(t.exportSuccess);
    } catch (err) {
      console.error(err);
      toast.error(t.exportFail);
    }
  };

  const renderRow = (d: Discharge) => {
    const emp = getEmployee(d.employee_id);
    const prod = getProduct(d.product_id);
    const isActive = d.status === 'active';
    const isCancelled = d.status === 'cancelled';
    const isPartial = d.status === 'partially_returned';
    const isReturned = d.status === 'returned';
    const canEditOrReturn = isActive || isPartial;

    return (
      <TableRow key={d.id} className={`hover:bg-secondary/20 transition-colors ${isCancelled ? 'opacity-50' : ''}`}>
        <TableCell className="text-center">
          {prod?.image_url ? (
            <div 
              className="w-[60px] h-[48px] mx-auto rounded-lg overflow-hidden cursor-pointer hover:scale-110 transition-transform border border-border/40 bg-secondary/20"
              onClick={() => setZoomedImage(prod.image_url)}
            >
              <img src={prod.image_url} alt={prod.designation} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-[60px] h-[48px] mx-auto rounded-lg bg-secondary/30 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
        </TableCell>
        <TableCell className="text-center text-xs font-mono">{d.reference}</TableCell>
        <TableCell className="text-center text-sm font-medium">
          <div>{emp?.full_name || '-'}</div>
          {d.project && <div className="text-[10px] text-muted-foreground mt-0.5 font-normal">📋 {d.project}</div>}
        </TableCell>
        <TableCell className="text-sm max-w-[200px]">
          <p className="line-clamp-2">
            {d.items && d.items.length > 1 
              ? d.items.map(i => products.find(p => p.id === i.product_id)?.designation || '-').join(', ')
              : prod?.designation || '-'
            }
          </p>
        </TableCell>
        <TableCell className="text-center text-sm font-semibold">
          {(() => {
            const its = d.items && d.items.length > 0 ? d.items : [{ quantity: d.quantity, returned_quantity: 0 } as any];
            const totalQ = its.reduce((s, i) => s + Number(i.quantity), 0);
            const totalR = its.reduce((s, i) => s + Number((i as any).returned_quantity || 0), 0);
            return (
              <div>
                <div>{its.map(i => i.quantity).join(' + ')}</div>
                {totalR > 0 && totalR < totalQ && (
                  <div className="text-[10px] text-amber-600 mt-0.5 font-normal">↩ {totalR}/{totalQ}</div>
                )}
              </div>
            );
          })()}
        </TableCell>
        <TableCell className="text-center text-xs">{new Date(d.date_out).toLocaleDateString('fr-FR')}</TableCell>
        <TableCell className="text-center">
          <Badge className={
            isCancelled ? 'bg-red-100 text-red-800' :
            isPartial ? 'bg-orange-100 text-orange-800' :
            isActive ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }>
            {isCancelled ? (t.dischargeCancelledStatus || 'Annulé')
              : isPartial ? ((t as any).dischargePartiallyReturned || 'Partiel')
              : isActive ? t.dischargeActive : t.dischargeReturnedStatus}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => generatePDF(d)} title="Imprimer fiche ENTRÉE / SORTIE">
              <FileText className="h-4 w-4 text-primary" />
            </Button>
            {canEditOrReturn && onEditDischarge && (
              <EditDischargeForm
                discharge={d}
                products={products}
                employees={employees}
                onSave={onEditDischarge}
                onStockAdjust={onStockAdjust}
              />
            )}
            {canEditOrReturn && onPartialReturn && onStockReturn && (
              <PartialReturnDialog
                discharge={d}
                products={products}
                employees={employees}
                onConfirm={onPartialReturn}
                onStockReturn={onStockReturn}
              />
            )}
            {canEditOrReturn && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-success hover:bg-success/10" title={t.markReturned}>
                      <FileCheck className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.confirmReturn}</AlertDialogTitle>
                      <AlertDialogDescription>{t.confirmReturnDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction className="rounded-xl bg-success text-success-foreground" onClick={() => handleReturn(d)}>
                        {t.markReturned}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {onCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" title={t.cancelDischarge || 'Annuler'}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.cancelDischargeTitle || 'Annuler la décharge'}</AlertDialogTitle>
                        <AlertDialogDescription>{t.cancelDischargeDesc || 'Cette action est irréversible. Le stock sera restauré automatiquement.'}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground" onClick={() => handleCancel(d)}>
                          {t.confirmCancelDischarge || 'Confirmer l\'annulation'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const tableHeaders = (
    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
      <TableHead className="text-center text-xs font-semibold w-[80px]">Image</TableHead>
      <TableHead className="text-center text-xs font-semibold">{t.dischargeRef}</TableHead>
      <TableHead className="text-center text-xs font-semibold">{t.empFullName}</TableHead>
      <TableHead className="text-center text-xs font-semibold">{t.designation}</TableHead>
      <TableHead className="text-center text-xs font-semibold">{t.quantity}</TableHead>
      <TableHead className="text-center text-xs font-semibold">{t.date}</TableHead>
      <TableHead className="text-center text-xs font-semibold">{t.empStatus}</TableHead>
      <TableHead className="text-center text-xs font-semibold">{t.actions}</TableHead>
    </TableRow>
  );

  return (
    <>
      {/* Dashboard preview: last 5 */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-5 w-5 text-primary" />
              {t.dischargeList} ({discharges.length})
            </CardTitle>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setModalOpen(true)}>
              <Eye className="h-4 w-4" />
              {t.viewAllDischarges || 'Voir tout'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentDischarges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">{t.noDischarges}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>{tableHeaders}</TableHeader>
                <TableBody>
                  {recentDischarges.map(renderRow)}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden rounded-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {t.dischargeList} ({filtered.length})
            </DialogTitle>
          </DialogHeader>
          
          {/* Filters bar */}
          <div className="flex items-center gap-3 flex-wrap py-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchDischarge}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="ps-9 rounded-xl text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] rounded-xl text-sm">
                <Filter className="h-3.5 w-3.5 me-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses || 'Tous les statuts'}</SelectItem>
                <SelectItem value="active">{t.dischargeActive}</SelectItem>
                <SelectItem value="returned">{t.dischargeReturnedStatus}</SelectItem>
                <SelectItem value="cancelled">{t.dischargeCancelledStatus || 'Annulé'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[100px] rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(n => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">{t.noDischarges}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>{tableHeaders}</TableHeader>
                <TableBody>
                  {paginated.map(renderRow)}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} / {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Button key={p} size="sm" variant={page === p ? 'default' : 'ghost'} className="h-8 w-8 rounded-lg text-xs" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  );
                })}
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image zoom modal */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-2">
          {zoomedImage && (
            <img src={zoomedImage} alt="" className="w-full h-auto rounded-xl object-contain max-h-[70vh]" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DischargeList;
