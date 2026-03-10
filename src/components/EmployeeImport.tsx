import { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmployeeFormData } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface EmployeeImportProps {
  onImport: (employees: EmployeeFormData[]) => Promise<void>;
}

const EmployeeImport = ({ onImport }: EmployeeImportProps) => {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<EmployeeFormData[]>([]);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = [
        { full_name: 'BAHRI AMIR', employee_id: '78', department: 'production', position: 'Conducteur de grue', phone: '0555123456', email: '', status: 'active', notes: '' },
        { full_name: 'KHALED SALIM', employee_id: '45', department: 'maintenance', position: 'Soudeur', phone: '0666789012', email: '', status: 'active', notes: '' },
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      XLSX.writeFile(wb, 'employees_template.xlsx');
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      if (!json.length) { toast.error(t.emptyFile); return; }

      const mapped: EmployeeFormData[] = json.map(row => ({
        full_name: String(row.full_name || row['الاسم الكامل'] || row['Nom complet'] || row['NOM ET PRENOM'] || ''),
        employee_id: String(row.employee_id || row['رقم التعريف'] || row['Matricule'] || row['matricule'] || ''),
        department: String(row.department || row['القسم'] || row['Département'] || row['departement'] || 'production'),
        position: String(row.position || row['المنصب'] || row['Poste'] || row['FONCTION'] || row['fonction'] || ''),
        phone: String(row.phone || row['الهاتف'] || row['Téléphone'] || row['telephone'] || ''),
        email: String(row.email || row['البريد الإلكتروني'] || row['Email'] || ''),
        status: String(row.status || row['الحالة'] || row['Statut'] || 'active'),
        notes: String(row.notes || row['ملاحظات'] || row['Notes'] || ''),
      }));

      const valid = mapped.filter(e => e.full_name.trim());
      if (!valid.length) { toast.error(t.noValidData); return; }

      setPreview(valid);
      setOpen(true);
    } catch {
      toast.error(t.fileReadError);
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleConfirm = async () => {
    setImporting(true);
    try {
      await onImport(preview);
      toast.success(`${t.importSuccess} (${preview.length})`);
      setOpen(false);
      setPreview([]);
    } catch {
      toast.error(t.importFail);
    }
    setImporting(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="rounded-xl gap-1.5 text-xs h-9 border-border/60 hover:bg-success/10 text-success hover:text-success">
        <Upload className="h-3.5 w-3.5" />
        {t.importEmployeesExcel}
      </Button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-success" />
              {t.previewEmployees} ({preview.length})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-center text-xs font-semibold">#</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.empFullName}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.empId}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.empDepartment}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.empPosition}</TableHead>
                  <TableHead className="text-center text-xs font-semibold">{t.empPhone}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((emp, i) => (
                  <TableRow key={i} className="hover:bg-secondary/20">
                    <TableCell className="text-center text-xs">{i + 1}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{emp.full_name}</TableCell>
                    <TableCell className="text-center text-sm">{emp.employee_id || '-'}</TableCell>
                    <TableCell className="text-center text-sm">{emp.department}</TableCell>
                    <TableCell className="text-center text-sm">{emp.position || '-'}</TableCell>
                    <TableCell className="text-center text-sm">{emp.phone || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="rounded-xl gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              {t.downloadTemplate}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-xl text-xs">{t.cancel}</Button>
              <Button size="sm" onClick={handleConfirm} disabled={importing} className="rounded-xl text-xs gap-1.5 bg-success text-success-foreground hover:bg-success/90">
                <Upload className="h-3.5 w-3.5" />
                {importing ? t.loading : `${t.importEmployees} (${preview.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmployeeImport;
