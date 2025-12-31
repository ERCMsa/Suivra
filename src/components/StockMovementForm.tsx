import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Product } from '@/types/inventory';
import { toast } from 'sonner';

interface StockMovementFormProps {
  product: Product;
  type: 'in' | 'out';
  onSubmit: (
    productId: string,
    type: 'in' | 'out',
    quantity: number,
    length: number,
    width: number,
    notes?: string
  ) => void;
}

const StockMovementForm = ({ product, type, onSubmit }: StockMovementFormProps) => {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [length, setLength] = useState(product.length);
  const [width, setWidth] = useState(product.width);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      toast.error('يجب أن تكون الكمية أكبر من صفر');
      return;
    }

    if (type === 'out' && quantity > product.quantity) {
      toast.error('الكمية المطلوبة أكبر من المخزون المتاح');
      return;
    }

    onSubmit(product.id, type, quantity, length, width, notes);
    toast.success(type === 'in' ? 'تم إدخال الكمية بنجاح' : 'تم إخراج الكمية بنجاح');
    setOpen(false);
    setQuantity(0);
    setNotes('');
  };

  const isIn = type === 'in';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant={isIn ? 'success' : 'destructive'}
          className="h-8 w-8"
        >
          {isIn ? (
            <ArrowUpCircle className="h-4 w-4" />
          ) : (
            <ArrowDownCircle className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIn ? (
              <>
                <ArrowUpCircle className="h-5 w-5 text-success" />
                إدخال كمية
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-5 w-5 text-destructive" />
                إخراج كمية
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{product.designation}</p>
            <p className="text-xs text-muted-foreground">
              المخزون الحالي: {product.quantity} {product.unit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">الكمية</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              max={type === 'out' ? product.quantity : undefined}
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">الطول (م)</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                min="0"
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">العرض (م)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                min="0"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              المساحة:{' '}
              <span className="font-bold text-foreground">
                {(quantity * length * width).toFixed(2)} م²
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية (اختياري)"
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant={isIn ? 'success' : 'destructive'}>
              {isIn ? 'إدخال' : 'إخراج'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockMovementForm;
