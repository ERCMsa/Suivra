import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Product, StockMovement, ProductFormData } from '@/hooks/useInventory';
import { useLanguage } from '@/hooks/useLanguage';

interface ExportButtonsProps {
  products: Product[];
  movements: StockMovement[];
  onImport?: (items: ProductFormData[]) => Promise<void>;
}

const ExportButtons = ({ products, movements, onImport }: ExportButtonsProps) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ProductFormData[]>([]);
  const [importing, setImporting] = useState(false);

  const getProductRows = () =>
    products.map((p) => ({
      [t.designation]: p.designation,
      [t.type]: p.type,
      [t.color]: p.color,
      [t.unitCol]: p.unit,
      [t.quantity]: p.quantity,
    }));

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(getProductRows());
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock');
      XLSX.writeFile(wb, `inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
    }
  };

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // === En-tête cartouche FOR-MGX-05 ===
      const headerY = 8;
      const headerH = 22;
      const logoW = 40;
      const rightW = 70;
      const titleX = 10 + logoW;
      const titleW = pageWidth - 10 - logoW - rightW - 10;

      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.rect(10, headerY, pageWidth - 20, headerH);
      doc.line(10 + logoW, headerY, 10 + logoW, headerY + headerH);
      doc.line(pageWidth - 10 - rightW, headerY, pageWidth - 10 - rightW, headerY + headerH);
      doc.line(10, headerY + headerH - 6, 10 + logoW, headerY + headerH - 6);
      doc.line(titleX, headerY + headerH / 2, titleX + titleW, headerY + headerH / 2);
      doc.line(pageWidth - 10 - rightW, headerY + headerH / 3, pageWidth - 10, headerY + headerH / 3);
      doc.line(pageWidth - 10 - rightW, headerY + (headerH / 3) * 2, pageWidth - 10, headerY + (headerH / 3) * 2);
      const rightLabelW = 26;
      doc.line(pageWidth - 10 - rightW + rightLabelW, headerY, pageWidth - 10 - rightW + rightLabelW, headerY + headerH);

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
      doc.setFont('helvetica', 'normal');
      doc.text('Page 1 sur 1', 12, headerY + headerH - 2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Formulaire', titleX + titleW / 2, headerY + headerH / 2 - 2, { align: 'center' });
      doc.text('Inventaire matériel', titleX + titleW / 2, headerY + headerH / 2 + 5, { align: 'center' });

      const rLabelX = pageWidth - 10 - rightW + 2;
      const rValueX = pageWidth - 10 - rightW + rightLabelW + 2;
      const rowH = headerH / 3;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Référence :', rLabelX, headerY + rowH / 2 + 1);
      doc.text('Date :', rLabelX, headerY + rowH * 1.5 + 1);
      doc.text('Version :', rLabelX, headerY + rowH * 2.5 + 1);
      doc.setFont('helvetica', 'normal');
      doc.text('FOR-MGX-05', rValueX, headerY + rowH / 2 + 1);
      doc.text(new Date().toLocaleDateString('fr-FR'), rValueX, headerY + rowH * 1.5 + 1);
      doc.text('00', rValueX, headerY + rowH * 2.5 + 1);

      const headers = ['N°', t.designation, t.type, t.color, t.unitCol, t.quantity];
      const rows = products.map((p, i) => [i + 1, p.designation, p.type, p.color, p.unit, p.quantity]);
      (doc as any).autoTable({
        startY: headerY + headerH + 5,
        head: [headers],
        body: rows,
        styles: { font: 'helvetica', halign: 'center', fontSize: 9, cellPadding: 2, lineWidth: 0.2, lineColor: [0, 0, 0] },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.3, lineColor: [0, 0, 0] },
        margin: { left: 10, right: 10 },
      });

      doc.save(`inventaire_general_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
    }
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const templateData = [
        { designation: 'Gants de sécurité', type: 'EPI / معدات الحماية', color: 'Neuf / جديد', unit: 'paire / زوج', quantity: 50 },
        { designation: 'Perceuse électrique', type: 'Outillage / عدة', color: 'Bon état / حالة جيدة', unit: 'unité / وحدة', quantity: 3 },
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'import_template.xlsx');
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      if (jsonData.length === 0) {
        toast.error('الملف فارغ');
        return;
      }

      const mapped: ProductFormData[] = jsonData.map((row) => ({
        designation: String(row.designation || row['التسمية'] || row['Désignation'] || ''),
        type: String(row.type || row['الفئة'] || row['Catégorie'] || row['النوع'] || row['Type'] || ''),
        color: String(row.color || row['الحالة'] || row['État'] || row['اللون'] || row['Couleur'] || ''),
        unit: String(row.unit || row['الوحدة'] || row['Unité'] || 'unité / وحدة'),
        quantity: Number(row.quantity || row['الكمية'] || row['Quantité'] || 0),
        thickness: 0,
        length: 0,
        width: 0,
      }));

      const valid = mapped.filter((item) => item.designation && item.type);
      if (valid.length === 0) {
        toast.error('لم يتم العثور على بيانات صالحة في الملف');
        return;
      }

      setPreviewData(valid);
      setImportOpen(true);
    } catch {
      toast.error('خطأ في قراءة الملف');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = async () => {
    if (!onImport || previewData.length === 0) return;
    setImporting(true);
    try {
      await onImport(previewData);
      toast.success(`تم استيراد ${previewData.length} مادة بنجاح`);
      setImportOpen(false);
      setPreviewData([]);
    } catch {
      toast.error('فشل في استيراد البيانات');
    }
    setImporting(false);
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={exportExcel} className="rounded-xl gap-1.5 text-xs h-9 border-border/60 hover:bg-secondary/50">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-xl gap-1.5 text-xs h-9 border-border/60 hover:bg-secondary/50">
          <FileText className="h-3.5 w-3.5" />
          PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl gap-1.5 text-xs h-9 border-border/60 hover:bg-success/10 text-success hover:text-success">
          <Upload className="h-3.5 w-3.5" />
          استيراد Excel
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-success" />
              معاينة البيانات ({previewData.length} مادة)
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">#</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.designation}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.type}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.color}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.unitCol}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.quantity}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((item, i) => (
                  <TableRow key={i} className="hover:bg-secondary/20">
                    <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{item.designation}</TableCell>
                    <TableCell className="text-center text-sm">{item.type}</TableCell>
                    <TableCell className="text-center text-sm">{item.color || '-'}</TableCell>
                    <TableCell className="text-center text-sm">{item.unit}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-primary">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="rounded-xl gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              تحميل نموذج
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setImportOpen(false)} className="rounded-xl text-xs">{t.cancel}</Button>
              <Button size="sm" onClick={handleImportConfirm} disabled={importing} className="rounded-xl text-xs gap-1.5 bg-success text-success-foreground hover:bg-success/90">
                <Upload className="h-3.5 w-3.5" />
                {importing ? 'جارٍ الاستيراد...' : `استيراد ${previewData.length} مادة`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportButtons;
