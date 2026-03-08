import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Product, StockMovement } from '@/hooks/useInventory';

interface ExportButtonsProps {
  products: Product[];
  movements: StockMovement[];
}

const ExportButtons = ({ products, movements }: ExportButtonsProps) => {
  const getProductRows = () =>
    products.map((p) => ({
      التسمية: p.designation,
      النوع: p.type,
      اللون: p.color,
      السماكة: p.thickness,
      الوحدة: p.unit,
      الكمية: p.quantity,
      الطول: p.length,
      العرض: p.width,
      المساحة: p.surface,
    }));

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(getProductRows());
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'المخزون');
      XLSX.writeFile(wb, `inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('تم تصدير الملف بنجاح');
    } catch {
      toast.error('فشل تصدير الملف');
    }
  };

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape' });

      const headers = ['المساحة', 'العرض', 'الطول', 'الكمية', 'الوحدة', 'السماكة', 'اللون', 'النوع', 'التسمية'];
      const rows = products.map((p) => [
        p.surface,
        p.width,
        p.length,
        p.quantity,
        p.unit,
        p.thickness,
        p.color,
        p.type,
        p.designation,
      ]);

      (doc as any).autoTable({
        head: [headers],
        body: rows,
        styles: { font: 'helvetica', halign: 'center', fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246], halign: 'center' },
        margin: { top: 20 },
      });

      doc.save(`inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('تم تصدير الملف بنجاح');
    } catch {
      toast.error('فشل تصدير الملف');
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportExcel}>
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF}>
        <FileText className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
};

export default ExportButtons;
