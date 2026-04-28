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

interface DischargeListProps {
  discharges: Discharge[];
  products: Product[];
  employees: Employee[];
  onMarkReturned: (id: string, productId: string, quantity: number) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const DischargeList = ({ discharges, products, employees, onMarkReturned, onCancel }: DischargeListProps) => {
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

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 30);

      // Add company logo on the right side (rectangular)
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.src = '/images/ercm-logo.png';
        });
        doc.addImage(logoImg, 'PNG', 170, 12, 28, 18);
      } catch {
        // If logo fails to load, continue without it
      }

      const textStartX = 14;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ERCMSA', textStartX, 18);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Etude Realisation Constructions Metaliques  Salhi ADEL', textStartX, 23);
      doc.text('SIDI SALEM NORD LOT 08 N° Q2 OULED MOUSSA BOUMERDES', textStartX, 27);
      doc.text('ercmsalhisteel@Email.com', textStartX, 31);
      doc.setFontSize(6);
      doc.text('N° RC : 35/00-3674152  A 17    N° Art : 35204129121', textStartX, 35);
      doc.text('N° IF : 191163800093114         N° Art : 35204129121', textStartX, 38);

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const dateStr = new Date(d.date_out).toLocaleDateString('fr-FR');
      doc.text('DÉCHARGE', 80, 55);
      doc.setFontSize(11);
      doc.text(`DATE : ${dateStr}`, 150, 55);

      if (d.project) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`PROJET : ${d.project.toUpperCase()}`, 14, 62);
      }

      const allItems = d.items && d.items.length > 0 
        ? d.items.map((item, idx) => {
            const itemProd = products.find(p => p.id === item.product_id);
            return [idx + 1, itemProd?.designation?.toUpperCase() || '-', item.quantity];
          })
        : [[1, prod.designation.toUpperCase(), d.quantity]];

      (doc as any).autoTable({
        startY: 65,
        head: [['N°', 'DESIGNATION', 'QUANTITÉ']],
        body: allItems,
        styles: { font: 'helvetica', halign: 'center', fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.4, lineColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { lineWidth: 0.4, lineColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 130, halign: 'left' }, 2: { cellWidth: 30 } },
        margin: { left: 14, right: 14 },
      });

      let finalY = (doc as any).lastAutoTable.finalY + 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Avis important :', 14, finalY + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const notices = [
        "Le réceptionnaire reconnaît avoir reçu les matériaux ou équipements mentionnés ci-dessus et assume l'entière responsabilité de leur conservation et de leur bonne utilisation.",
        "Il est interdit de transférer le matériel reçu à un tiers sans autorisation préalable du responsable du stock ou de la direction.",
        "Le réceptionnaire est tenu de restituer les équipements récupérables dès la fin des travaux ou sur demande de la direction.",
        "En cas de perte ou de détérioration non justifiée, le réceptionnaire supportera les frais de réparation ou de remplacement conformément aux règlements internes de l'entreprise.",
        "Cette décharge constitue une preuve officielle de réception et sera conservée dans un dossier dédié au réceptionnaire.",
        "- La signature de ce document vaut acceptation pleine et entière de ces conditions."
      ];
      
      let textY = finalY + 12;
      notices.forEach(notice => {
        const lines = doc.splitTextToSize(notice, 180);
        doc.text(lines, 14, textY);
        textY += lines.length * 3.5 + 1;
      });

      const sigY = textY + 8;
      
      doc.setLineWidth(0.4);
      doc.rect(14, sigY, 88, 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`NOM ET PRENOM :  ${emp.full_name.toUpperCase()}`, 18, sigY + 10);
      doc.text(`FONCTION : ${(emp.position || emp.department).toUpperCase()}`, 18, sigY + 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Signature et empreinte', 58, sigY + 35, { align: 'center' });

      doc.rect(108, sigY, 88, 40);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("L'ACCUSÉ DE RESPONSABLE DE STOCK / MAGASINIER", 110, sigY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text('Signature et Cachet', 152, sigY + 35, { align: 'center' });

      const footerY = sigY + 50;
      doc.setLineWidth(0.3);
      doc.line(14, footerY, 196, footerY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Document généré automatiquement - A conserver', 105, footerY + 5, { align: 'center' });

      doc.save(`decharge_${d.reference}.pdf`);
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
    }
  };

  const renderRow = (d: Discharge) => {
    const emp = getEmployee(d.employee_id);
    const prod = getProduct(d.product_id);
    const isActive = d.status === 'active';
    const isCancelled = d.status === 'cancelled';

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
          {d.items && d.items.length > 1 
            ? d.items.map(i => i.quantity).join(' + ')
            : d.quantity
          }
        </TableCell>
        <TableCell className="text-center text-xs">{new Date(d.date_out).toLocaleDateString('fr-FR')}</TableCell>
        <TableCell className="text-center">
          <Badge className={
            isCancelled ? 'bg-red-100 text-red-800' :
            isActive ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }>
            {isCancelled ? (t.dischargeCancelledStatus || 'Annulé') : isActive ? t.dischargeActive : t.dischargeReturnedStatus}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => generatePDF(d)} title="PDF">
              <FileText className="h-4 w-4 text-primary" />
            </Button>
            {isActive && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-success hover:bg-success/10" title={t.markReturned}>
                      <RotateCcw className="h-4 w-4" />
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
