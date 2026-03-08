import { useState } from 'react';
import { Pencil } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

const PRODUCT_TYPES = [
  'Équipements / معدات', 'Outillage / عدة', 'Vêtements / ملابس',
  'Consommables / مستهلكات', 'EPI / معدات الحماية', 'Fournitures bureau / لوازم مكتبية',
  'Pièces détachées / قطع غيار', 'Autres / أخرى',
];
const STATUSES = ['Neuf / جديد', 'Bon état / حالة جيدة', 'Usé / مستعمل', 'En réparation / قيد الإصلاح', 'Hors service / خارج الخدمة'];
const UNITS = ['unité / وحدة', 'paire / زوج', 'boîte / علبة', 'lot / مجموعة', 'kg', 'litre / لتر', 'mètre / متر', 'rouleau / لفة'];
const LOCATIONS = ['Magasin', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5', 'Box 6', 'Box 7', 'Box 8'];

interface EditProductFormProps {
  product: Product;
  onUpdated: () => void;
}

const EditProductForm = ({ product, onUpdated }: EditProductFormProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    designation: product.designation,
    type: product.type,
    color: product.color,
    unit: product.unit,
    quantity: product.quantity,
    min_quantity: (product as any).min_quantity || 0,
    image_url: (product as any).image_url || '',
    location: (product as any).location || 'Magasin',
  });

  const handleSubmit = async () => {
    if (!form.designation || !form.type) { toast.error(t.fillRequired); return; }
    const { error } = await supabase.from('products').update({
      designation: form.designation,
      type: form.type,
      color: form.color,
      unit: form.unit,
      quantity: form.quantity,
      min_quantity: form.min_quantity,
      image_url: form.image_url || null,
      location: form.location,
    } as any).eq('id', product.id);
    if (error) { toast.error(t.editFail); return; }
    toast.success(t.editSuccess);
    setOpen(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>{t.editProduct}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">{t.designationLabel}</Label>
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="rounded-xl mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t.typeLabel}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t.colorLabel}</Label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{t.unitLabel}</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t.quantityLabel}</Label>
              <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t.minQuantity}</Label>
              <Input type="number" min={0} value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })} className="rounded-xl mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t.locationLabel}</Label>
            <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <ImageUpload currentUrl={form.image_url} onUploaded={(url) => setForm({ ...form, image_url: url })} folder="products" />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button className="flex-1 rounded-xl" onClick={handleSubmit}>{t.save}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductForm;
