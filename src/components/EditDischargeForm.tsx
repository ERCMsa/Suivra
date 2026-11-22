import { useState, useEffect } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Discharge } from '@/hooks/useDischarges';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface EditDischargeFormProps {
  discharge: Discharge;
  products: Product[];
  employees: Employee[];
  onSave: (
    id: string,
    data: {
      employee_id?: string;
      project?: string | null;
      notes?: string | null;
      has_delivery_note?: boolean;
      delivery_destination?: string | null;
      delivery_driver?: string | null;
      delivery_vehicle_plate?: string | null;
      items?: { id?: string; product_id: string; quantity: number }[];
    },
    onStockAdjust?: (productId: string, delta: number) => Promise<void>
  ) => Promise<void>;
  onStockAdjust?: (productId: string, delta: number) => Promise<void>;
}

interface EditableItem {
  id?: string;
  product_id: string;
  quantity: number;
}

const EditDischargeForm = ({ discharge, products, employees, onSave, onStockAdjust }: EditDischargeFormProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(discharge.employee_id);
  const [project, setProject] = useState(discharge.project || '');
  const [notes, setNotes] = useState(discharge.notes || '');
  const [destination, setDestination] = useState(discharge.delivery_destination || '');
  const [driver, setDriver] = useState(discharge.delivery_driver || '');
  const [plate, setPlate] = useState(discharge.delivery_vehicle_plate || '');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmployeeId(discharge.employee_id);
      setProject(discharge.project || '');
      setNotes(discharge.notes || '');
      setDestination(discharge.delivery_destination || '');
      setDriver(discharge.delivery_driver || '');
      setPlate(discharge.delivery_vehicle_plate || '');
      const init: EditableItem[] = (discharge.items && discharge.items.length > 0)
        ? discharge.items.map(i => ({ id: i.id, product_id: i.product_id, quantity: Number(i.quantity) }))
        : [{ product_id: discharge.product_id, quantity: Number(discharge.quantity) }];
      setItems(init);
    }
  }, [open, discharge]);

  const activeEmployees = employees.filter(e => e.status === 'active');
  const getProduct = (id: string) => products.find(p => p.id === id);

  const updateItem = (idx: number, field: keyof EditableItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };
  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };
  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);

  const handleSave = async () => {
    if (!employeeId || items.some(i => !i.product_id || i.quantity <= 0)) {
      toast.error(t.fillRequired);
      return;
    }
    // Validate stock for increased/added items
    for (const it of items) {
      const original = discharge.items?.find(o => o.id === it.id);
      const delta = it.quantity - (original ? Number(original.quantity) : 0);
      const prod = getProduct(it.product_id);
      if (delta > 0 && prod && delta > prod.quantity) {
        toast.error(`${t.insufficientStock}: ${prod.designation}`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(
        discharge.id,
        {
          employee_id: employeeId,
          project: project || null,
          notes: notes || null,
          ...(discharge.has_delivery_note
            ? {
                has_delivery_note: true,
                delivery_destination: destination.trim() || null,
                delivery_driver: driver.trim() || null,
                delivery_vehicle_plate: plate.trim() || null,
              }
            : {}),
          items,
        },
        onStockAdjust,
      );
      toast.success((t as any).dischargeUpdated || 'Modifié');
      setOpen(false);
    } catch {
      toast.error(t.dischargeFail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" title={(t as any).editDischarge} onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-600" />
            {(t as any).editDischarge} — {discharge.reference}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{(t as any).editDischargeDesc}</p>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{t.dischargeEmployee} *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeEmployees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name} {e.employee_id ? `(#${e.employee_id})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{(t as any).dischargeProject || 'Projet'}</Label>
            <Input value={project} onChange={e => setProject(e.target.value)} className="rounded-xl mt-1" maxLength={150} />
          </div>

          {discharge.has_delivery_note && (
            <div className="space-y-3 rounded-xl border border-dashed border-amber-300/70 bg-amber-50/40 dark:bg-amber-950/20 p-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{t.deliveryStepTitle}</p>
              <div>
                <Label>{t.deliveryDestination}</Label>
                <Input value={destination} onChange={e => setDestination(e.target.value)} className="rounded-xl mt-1" maxLength={150} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t.deliveryDriver}</Label>
                  <Input value={driver} onChange={e => setDriver(e.target.value)} className="rounded-xl mt-1" maxLength={100} />
                </div>
                <div>
                  <Label>{t.deliveryVehiclePlate}</Label>
                  <Input value={plate} onChange={e => setPlate(e.target.value)} className="rounded-xl mt-1" maxLength={50} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t.dischargeProducts}</Label>
              <Button type="button" size="sm" variant="outline" className="gap-1 rounded-xl text-xs h-7" onClick={addItem}>
                <Plus className="h-3 w-3" /> {t.addItem}
              </Button>
            </div>
            {items.map((item, idx) => {
              const prod = getProduct(item.product_id);
              const originalQty = item.id ? Number(discharge.items?.find(o => o.id === item.id)?.quantity || 0) : 0;
              const availableMax = (prod?.quantity || 0) + originalQty;
              return (
                <div key={idx} className="rounded-xl border border-border/60 p-3 space-y-2 bg-secondary/10">
                  <div className="flex items-center gap-2">
                    <Select value={item.product_id} onValueChange={v => updateItem(idx, 'product_id', v)}>
                      <SelectTrigger className="rounded-xl text-sm flex-1"><SelectValue placeholder={t.selectItem} /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {products.filter(p => p.quantity > 0 || p.id === item.product_id).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.designation} ({t.currentStock}: {p.quantity})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      max={availableMax || 999}
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
                </div>
              );
            })}
          </div>

          <div>
            <Label>{t.notes}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl mt-1" rows={2} maxLength={500} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button className="flex-1 rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? t.loading : ((t as any).saveChanges || 'Enregistrer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDischargeForm;
