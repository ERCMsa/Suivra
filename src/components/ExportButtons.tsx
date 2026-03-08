import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Product, StockMovement } from '@/hooks/useInventory';
import { useLanguage } from '@/hooks/useLanguage';

interface ExportButtonsProps {
  products: Product[];
  movements: StockMovement[];
}

const ExportButtons = ({ products, movements }: ExportButtonsProps) => {
  const { t } = useLanguage();

  const getProductRows = () =>
    products.map((p) => ({
      [t.designation]: p.designation,
      [t.type]: p.type,
      [t.color]: p.color,
      [t.thickness]: p.thickness,
      [t.unitCol]: p.unit,
      [t.quantity]: p.quantity,
      [t.length]: p.length,
      [t.width]: p.width,
      [t.surface]: p.surface,
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
      const doc = new jsPDF({ orientation: 'landscape' });
      const headers = [t.surface, t.width, t.length, t.quantity, t.unitCol, t.thickness, t.color, t.type, t.designation];
      const rows = products.map((p) => [p.surface, p.width, p.length, p.quantity, p.unit, p.thickness, p.color, p.type, p.designation]);
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        styles: { font: 'helvetica', halign: 'center', fontSize: 9 },
        headStyles: { fillColor: [66, 99, 235], halign: 'center' },
        margin: { top: 20 },
      });
      doc.save(`inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportExcel} className="rounded-xl gap-1.5 text-xs h-9 border-border/60 hover:bg-secondary/50">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-xl gap-1.5 text-xs h-9 border-border/60 hover:bg-secondary/50">
        <FileText className="h-3.5 w-3.5" />
        PDF
      </Button>
    </div>
  );
};

export default ExportButtons;
