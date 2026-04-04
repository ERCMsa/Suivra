import { useState } from 'react';
import { FileCheck, RotateCcw, FileText, Search, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
}

const DischargeList = ({ discharges, products, employees, onMarkReturned }: DischargeListProps) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const filtered = discharges.filter(d => {
    const emp = getEmployee(d.employee_id);
    const prod = getProduct(d.product_id);
    const term = search.toLowerCase();
    return (
      d.reference.toLowerCase().includes(term) ||
      (emp?.full_name || '').toLowerCase().includes(term) ||
      (prod?.designation || '').toLowerCase().includes(term)
    );
  });

  const handleReturn = async (d: Discharge) => {
    try {
      await onMarkReturned(d.id, d.product_id, d.quantity);
      toast.success(t.dischargeReturned);
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

      // Header box with company info
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 30);

      // Company info - left side
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ERCMSA', 14, 18);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Etude Realisation Constructions Metaliques  Salhi ADEL', 14, 23);
      doc.text('SIDI SALEM NORD LOT 08 N° Q2 OULED MOUSSA BOUMERDES', 14, 27);
      doc.text('ercmsalhisteel@Email.com', 14, 31);
      doc.setFontSize(6);
      doc.text('N° RC : 35/00-3674152  A 17    N° Art : 35204129121', 14, 35);
      doc.text('N° IF : 191163800093114         N° Art : 35204129121', 14, 38);

      // Title - DÉCHARGE
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const dateStr = new Date(d.date_out).toLocaleDateString('fr-FR');
      doc.text('DÉCHARGE', 80, 55);
      doc.setFontSize(11);
      doc.text(`DATE : ${dateStr}`, 150, 55);

      // Items table
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

      // Arabic regulatory text
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

      // Employee info + signature boxes
      const sigY = textY + 8;
      
      // Left box - Employee info & signature
      doc.setLineWidth(0.4);
      doc.rect(14, sigY, 88, 40);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`NOM ET PRENOM :  ${emp.full_name.toUpperCase()}`, 18, sigY + 10);
      doc.text(`FONCTION : ${(emp.position || emp.department).toUpperCase()}`, 18, sigY + 20);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Signature et empreinte', 58, sigY + 35, { align: 'center' });

      // Right box - Stock manager signature
      doc.rect(108, sigY, 88, 40);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("L'ACCUSÉ DE RESPONSABLE DE STOCK / MAGASINIER", 110, sigY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text('Signature et Cachet', 152, sigY + 35, { align: 'center' });

      // Footer
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

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-5 w-5 text-primary" />
            {t.dischargeList} ({discharges.length})
          </CardTitle>
          <Input
            placeholder={t.searchDischarge}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs rounded-xl text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">{t.noDischarges}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-center text-xs font-semibold">{t.dischargeRef}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.empFullName}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.designation}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.quantity}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.date}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.empStatus}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => {
                  const emp = getEmployee(d.employee_id);
                  const prod = getProduct(d.product_id);
                  const isActive = d.status === 'active';
                  return (
                    <TableRow key={d.id} className="hover:bg-secondary/20">
                      <TableCell className="text-center text-xs font-mono">{d.reference}</TableCell>
                      <TableCell className="text-center text-sm font-medium">{emp?.full_name || '-'}</TableCell>
                      <TableCell className="text-center text-sm">
                        {d.items && d.items.length > 1 
                          ? d.items.map(i => products.find(p => p.id === i.product_id)?.designation || '-').join(', ')
                          : prod?.designation || '-'
                        }
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold">
                        {d.items && d.items.length > 1 
                          ? d.items.map(i => i.quantity).join(' + ')
                          : d.quantity
                        }
                      </TableCell>
                      <TableCell className="text-center text-xs">{new Date(d.date_out).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={isActive ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                          {isActive ? t.dischargeActive : t.dischargeReturnedStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => generatePDF(d)} title="PDF">
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                          {isActive && (
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
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DischargeList;
