import { useState } from 'react';
import { FileCheck, Plus, Trash2 } from 'lucide-react';
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

interface DischargeItem {
  product_id: string;
  quantity: number;
}

interface DischargeFormProps {
  products: Product[];
  employees: Employee[];
  onSubmit: (data: { employee_id: string; product_id: string; quantity: number; notes?: string; additional_items?: { product_id: string; quantity: number }[] }) => Promise<any>;
  onStockOut: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string) => void;
}

const DischargeForm = ({ products, employees, onSubmit, onStockOut }: DischargeFormProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [items, setItems] = useState<DischargeItem[]>([{ product_id: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };
  const updateItem = (idx: number, field: keyof DischargeItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const getProduct = (id: string) => products.find(p => p.id === id);
  const usedProductIds = items.map(i => i.product_id).filter(Boolean);

  const handleSubmit = async () => {
    if (!employeeId || !items[0].product_id) {
      toast.error(t.fillRequired);
      return;
    }
    for (const item of items) {
      if (!item.product_id) continue;
      const prod = getProduct(item.product_id);
      if (item.quantity <= 0) { toast.error(t.quantityMustBePositive); return; }
      if (prod && item.quantity > prod.quantity) { toast.error(`${t.insufficientStock}: ${prod.designation}`); return; }
    }

    setIsSubmitting(true);
    try {
      const validItems = items.filter(i => i.product_id);
      const [first, ...rest] = validItems;

      const discharge = await onSubmit({
        employee_id: employeeId,
        product_id: first.product_id,
        quantity: first.quantity,
        notes: notes || undefined,
        additional_items: rest.length > 0 ? rest : undefined,
      });

      // Perform stock out for all items
      for (const item of validItems) {
        const prod = getProduct(item.product_id);
        if (prod) {
          onStockOut(item.product_id, 'out', item.quantity, prod.length, prod.width, `Décharge: ${discharge?.reference || ''}`);
        }
      }

      setOpen(false);
      setEmployeeId('');
      setItems([{ product_id: '', quantity: 1 }]);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t.dischargeProducts}</Label>
              <Button type="button" size="sm" variant="outline" className="gap-1 rounded-xl text-xs h-7" onClick={addItem}>
                <Plus className="h-3 w-3" /> {t.addItem}
              </Button>
            </div>
            {items.map((item, idx) => {
              const prod = getProduct(item.product_id);
              return (
                <div key={idx} className="rounded-xl border border-border/60 p-3 space-y-2 bg-secondary/10">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select value={item.product_id} onValueChange={v => updateItem(idx, 'product_id', v)}>
                        <SelectTrigger className="rounded-xl text-sm"><SelectValue placeholder={t.selectItem} /></SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.quantity > 0 && (!usedProductIds.includes(p.id) || p.id === item.product_id)).map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.designation} ({t.currentStock}: {p.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={prod?.quantity || 999}
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="rounded-xl w-20 text-center"
                    />
                    {items.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {prod && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                      {t.currentStock}: <span className="font-bold">{prod.quantity} {prod.unit}</span>
                      → {t.dischargeAfter}: <span className="font-bold">{prod.quantity - item.quantity}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

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
