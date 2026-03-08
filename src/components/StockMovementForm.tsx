import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Product } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface StockMovementFormProps {
  product: Product;
  type: 'in' | 'out';
  onSubmit: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string) => void;
}

const StockMovementForm = ({ product, type, onSubmit }: StockMovementFormProps) => {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [length, setLength] = useState(product.length);
  const [width, setWidth] = useState(product.width);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) { toast.error('يجب أن تكون الكمية أكبر من صفر'); return; }
    if (type === 'out' && quantity > product.quantity) { toast.error('الكمية المطلوبة أكبر من المخزون المتاح'); return; }
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
          variant="ghost"
          className={`h-8 w-8 rounded-lg ${isIn ? 'text-success hover:bg-success/10' : 'text-destructive hover:bg-destructive/10'}`}
        >
          {isIn ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isIn ? <><ArrowUpCircle className="h-5 w-5 text-success" />إدخال كمية</> : <><ArrowDownCircle className="h-5 w-5 text-destructive" />إخراج كمية</>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className={`rounded-xl p-3 ${isIn ? 'bg-success/5 border border-success/10' : 'bg-destructive/5 border border-destructive/10'}`}>
            <p className="text-sm font-medium">{product.designation}</p>
            <p className="text-xs text-muted-foreground mt-0.5">المخزون الحالي: {product.quantity} {product.unit}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity" className="text-xs">الكمية</Label>
            <Input id="quantity" type="number" min="0" max={type === 'out' ? product.quantity : undefined} value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="length" className="text-xs">الطول (م)</Label>
              <Input id="length" type="number" step="0.01" min="0" value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 0)} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="width" className="text-xs">العرض (م)</Label>
              <Input id="width" type="number" step="0.01" min="0" value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <p className="text-xs text-muted-foreground">المساحة: <span className="font-bold text-primary">{(quantity * length * width).toFixed(2)} م²</span></p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">ملاحظات</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية (اختياري)" className="resize-none rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-sm">إلغاء</Button>
            <Button type="submit" variant={isIn ? 'success' : 'destructive'} className="rounded-xl text-sm">{isIn ? 'إدخال' : 'إخراج'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockMovementForm;
