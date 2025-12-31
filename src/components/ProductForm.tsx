import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductFormData } from '@/types/inventory';
import { toast } from 'sonner';

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
}

const PRODUCT_TYPES = [
  'PS Couverture',
  'PS Bardage',
  'Tôle ondulée',
  'Tôle nervurée',
  'Accessoires',
];

const COLORS = [
  'B3 (Blanc)',
  '9016 (Blanc pur)',
  '7016 (Gris anthracite)',
  '3000 (Rouge)',
  '5010 (Bleu)',
  '6005 (Vert)',
];

const UNITS = ['m²', 'ml', 'unité', 'kg'];

const ProductForm = ({ onSubmit }: ProductFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    designation: '',
    type: '',
    color: '',
    thickness: 0.4,
    unit: 'm²',
    quantity: 0,
    length: 0,
    width: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.designation || !formData.type) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    onSubmit(formData);
    toast.success('تمت إضافة المنتج بنجاح');
    setOpen(false);
    setFormData({
      designation: '',
      type: '',
      color: '',
      thickness: 0.4,
      unit: 'm²',
      quantity: 0,
      length: 0,
      width: 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-5 w-5" />
          إضافة منتج جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">إضافة منتج جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="designation">التسمية *</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                placeholder="مثال: PS Couverture TI70mm"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">النوع *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">اللون</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اللون" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thickness">السمك (مم)</Label>
              <Input
                id="thickness"
                type="number"
                step="0.1"
                min="0"
                value={formData.thickness}
                onChange={(e) =>
                  setFormData({ ...formData, thickness: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">الوحدة</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">الطول (م)</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                min="0"
                value={formData.length}
                onChange={(e) =>
                  setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">العرض (م)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                min="0"
                value={formData.width}
                onChange={(e) =>
                  setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              المساحة المحسوبة:{' '}
              <span className="font-bold text-foreground">
                {(formData.quantity * formData.length * formData.width).toFixed(2)} م²
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit">إضافة المنتج</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
