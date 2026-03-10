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

      // Header border
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 25);

      // Company info
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ERCMsa', 14, 18);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Etude et Realisation de Constructions Metalliques Salhi Adel', 14, 22);
      doc.text('Sidi Salem Nord 08 n° 02 Ouled Moussa BOUMEDRES ALGERIE', 14, 26);
      doc.text('contact@ercmsalhi.com', 14, 30);

      // Reference & Date
      doc.setFontSize(9);
      doc.text(`Reference: ${d.reference}`, 14, 45);

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('DECHARGE', 105, 45, { align: 'center' });

      const dateStr = new Date(d.date_out).toLocaleDateString('fr-FR');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ouled Moussa: ${dateStr}`, 196, 45, { align: 'right' });

      // Employee info box
      doc.setLineWidth(0.3);
      doc.rect(14, 55, 182, 20);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Matricule', 50, 62);
      doc.text('NOM ET PRENOM', 90, 62);
      doc.text('FONCTION', 140, 62);

      doc.setFontSize(10);
      doc.text(emp.employee_id || '-', 50, 70);
      doc.text(emp.full_name.toUpperCase(), 90, 70);
      doc.text((emp.position || emp.department).toUpperCase(), 140, 70);

      // Items table
      (doc as any).autoTable({
        startY: 85,
        head: [['N', 'Designation', 'Quantite']],
        body: [[1, prod.designation, d.quantity]],
        styles: { font: 'helvetica', halign: 'center', fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.3, lineColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        margin: { left: 14, right: 14 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Regulatory text box
      doc.setLineWidth(0.3);
      doc.rect(14, finalY, 182, 55);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Avis important :', 18, finalY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const notice = "Le receptionnaire reconnait avoir recu les materiaux ou equipements ci-dessus et assume l'entiere responsabilite de leur conservation et de leur bonne utilisation. Il est interdit de transferer le materiel recu a un tiers sans autorisation prealable du responsable du stock ou de la direction. Le receptionnaire est tenu de restituer les equipements recuperables des la fin des travaux ou sur demande de la direction. En cas de perte ou de deterioration non justifiee, il supportera les frais de reparation ou de remplacement conformement aux reglements internes de l'entreprise. Cette decharge constitue une preuve officielle de reception et sera conservee dans un dossier dedie au receptionnaire. La signature de ce document vaut acceptation pleine et entiere de ces conditions.";
      const lines = doc.splitTextToSize(notice, 174);
      doc.text(lines, 18, finalY + 16);

      // Signature boxes
      const sigY = finalY + 65;
      doc.setLineWidth(0.3);
      doc.rect(14, sigY, 88, 30);
      doc.rect(108, sigY, 88, 30);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURE DE CONCERNE', 58, sigY + 8, { align: 'center' });
      doc.text("L'ACCUSE DE RESPONSABLE DE STOCK / MAGASINIER", 152, sigY + 8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Signature et empreinte', 58, sigY + 25, { align: 'center' });
      doc.text('Signature et Cachet', 152, sigY + 25, { align: 'center' });

      // Footer
      doc.setFontSize(7);
      doc.text('Document genere automatiquement - A conserver', 105, 285, { align: 'center' });

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
                      <TableCell className="text-center text-sm">{prod?.designation || '-'}</TableCell>
                      <TableCell className="text-center text-sm font-semibold">{d.quantity}</TableCell>
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
