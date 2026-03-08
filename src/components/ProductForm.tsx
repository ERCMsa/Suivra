import { useState } from 'react';
import { Plus } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductFormData } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
}

const PRODUCT_TYPES = [
  'Équipements / معدات',
  'Outillage / عدة',
  'Vêtements / ملابس',
  'Consommables / مستهلكات',
  'EPI / معدات الحماية',
  'Fournitures bureau / لوازم مكتبية',
  'Pièces détachées / قطع غيار',
  'Autres / أخرى',
];

const STATUSES = [
  'Neuf / جديد',
  'Bon état / حالة جيدة',
  'Usé / مستعمل',
  'En réparation / قيد الإصلاح',
  'Hors service / خارج الخدمة',
];

const UNITS = ['unité / وحدة', 'paire / زوج', 'boîte / علبة', 'lot / مجموعة', 'kg', 'litre / لتر', 'mètre / متر', 'rouleau / لفة'];

const ProductForm = ({ onSubmit }: ProductFormProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ProductFormData>({
    designation: '', type: '', color: '', thickness: 0, unit: 'unité / وحدة', quantity: 0, length: 0, width: 0,
  });
  const [reference, setReference] = useState('');
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.designation || !formData.type) {
      toast.error(t.fillRequired);
      return;
    }
    // Map new fields into existing DB columns
    onSubmit({
      ...formData,
      thickness: parseFloat(reference) || 0, // reference stored in thickness
      length: 0, // location info stored as text in notes context
      width: 0,
    });
    toast.success(t.productAdded);
    setOpen(false);
    setFormData({ designation: '', type: '', color: '', thickness: 0, unit: 'unité / وحدة', quantity: 0, length: 0, width: 0 });
    setReference('');
    setLocation('');
    setSupplier('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl h-9 text-sm shadow-sm">
          <Plus className="h-4 w-4" />
          {t.addNewProduct}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg">{t.addNewProduct}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="mt-3 space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="designation" className="text-xs">{t.designationLabel}</Label>
              <Input id="designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder={t.designationPlaceholder} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs">{t.typeLabel}</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="h-10 rounded-xl text-sm bg-secondary/30 border-0"><SelectValue placeholder={t.selectType} /></SelectTrigger>
                <SelectContent className="rounded-xl">{PRODUCT_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-xs">{t.colorLabel}</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger className="h-10 rounded-xl text-sm bg-secondary/30 border-0"><SelectValue placeholder={t.selectColor} /></SelectTrigger>
                <SelectContent className="rounded-xl">{STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-xs">{t.thicknessLabel}</Label>
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="REF-001" className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs">{t.unitLabel}</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger className="h-10 rounded-xl text-sm bg-secondary/30 border-0"><SelectValue placeholder={t.selectUnit} /></SelectTrigger>
                <SelectContent className="rounded-xl">{UNITS.map((unit) => (<SelectItem key={unit} value={unit}>{unit}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">{t.quantityLabel}</Label>
              <Input id="quantity" type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs">{t.lengthLabel}</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Magasin A, Bureau 3..." className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier" className="text-xs">{t.widthLabel}</Label>
              <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nom du fournisseur..." className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <p className="text-xs text-muted-foreground">{t.calculatedSurface}: <span className="font-bold text-primary">{formData.quantity} {formData.unit}</span></p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-sm">{t.cancel}</Button>
            <Button type="submit" className="rounded-xl text-sm">{t.addProduct}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
