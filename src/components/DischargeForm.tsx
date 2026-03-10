import { useState } from 'react';
import { FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface DischargeFormProps {
  products: Product[];
  employees: Employee[];
  onSubmit: (data: { employee_id: string; product_id: string; quantity: number; notes?: string }) => Promise<any>;
  onStockOut: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string) => void;
}

const DischargeForm = ({ products, employees, onSubmit, onStockOut }: DischargeFormProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = async () => {
    if (!employeeId || !productId) {
      toast.error(t.fillRequired);
      return;
    }
    if (quantity <= 0) {
      toast.error(t.quantityMustBePositive);
      return;
    }
    if (selectedProduct && quantity > selectedProduct.quantity) {
      toast.error(t.insufficientStock);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create discharge record
      const discharge = await onSubmit({ employee_id: employeeId, product_id: productId, quantity, notes: notes || undefined });
      
      // Perform stock out
      if (selectedProduct) {
        onStockOut(productId, 'out', quantity, selectedProduct.length, selectedProduct.width, `Décharge: ${discharge?.reference || ''}`);
      }

      setOpen(false);
      setEmployeeId('');
      setProductId('');
      setQuantity(1);
      setNotes('');
      toast.success(t.dischargeCreated);
    } catch {
      toast.error(t.dischargeFail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9 border-border/60 hover:bg-amber-50 text-amber-700 hover:text-amber-800">
          <FileCheck className="h-3.5 w-3.5" />
          {t.newDischarge}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-amber-600" />
            {t.newDischarge}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{t.dischargeEmployee} *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t.selectEmployee} /></SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.status === 'active').map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} {emp.employee_id ? `(#${emp.employee_id})` : ''} - {emp.position || emp.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t.dischargeProduct} *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t.selectItem} /></SelectTrigger>
              <SelectContent>
                {products.filter(p => p.quantity > 0).map(prod => (
                  <SelectItem key={prod.id} value={prod.id}>
                    {prod.designation} ({t.currentStock}: {prod.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t.quantityLabel}</Label>
            <Input
              type="number"
              min={1}
              max={selectedProduct?.quantity || 999}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="rounded-xl mt-1"
            />
          </div>

          {selectedProduct && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                {t.currentStock}: <span className="font-bold">{selectedProduct.quantity} {selectedProduct.unit}</span>
                → {t.dischargeAfter}: <span className="font-bold">{selectedProduct.quantity - quantity}</span>
              </p>
            </div>
          )}

          <div>
            <Label>{t.notes}</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="rounded-xl mt-1"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t.loading : t.createDischarge}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DischargeForm;
