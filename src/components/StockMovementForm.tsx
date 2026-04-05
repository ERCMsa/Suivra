import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface StockMovementFormProps {
  product: Product;
  type: 'in' | 'out';
  onSubmit: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string, takenBy?: string) => void;
  employees?: Employee[];
}

const StockMovementForm = ({ product, type, onSubmit, employees = [] }: StockMovementFormProps) => {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [length, setLength] = useState(product.length);
  const [width, setWidth] = useState(product.width);
  const [notes, setNotes] = useState('');
  const [takenBy, setTakenBy] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) { toast.error(t.quantityMustBePositive); return; }
    if (type === 'out' && quantity > product.quantity) { toast.error(t.insufficientStock); return; }
    if (!takenBy.trim()) { toast.error(t.takenByRequired); return; }
    setShowConfirm(true);
  };

  const confirmAction = () => {
    onSubmit(product.id, type, quantity, length, width, notes, takenBy);
    toast.success(type === 'in' ? t.quantityAdded : t.quantityRemoved);
    setOpen(false);
    setShowConfirm(false);
    setQuantity(0);
    setNotes('');
    setTakenBy('');
  };

  const isIn = type === 'in';
  const activeEmployees = employees.filter(e => e.status === 'active');

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className={`h-7 w-7 rounded-lg ${isIn ? 'text-success hover:bg-success/10' : 'text-destructive hover:bg-destructive/10'}`}>
            {isIn ? <ArrowUpCircle className="h-3.5 w-3.5" /> : <ArrowDownCircle className="h-3.5 w-3.5" />}
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {isIn ? <><ArrowUpCircle className="h-5 w-5 text-success" />{t.addQuantity}</> : <><ArrowDownCircle className="h-5 w-5 text-destructive" />{t.removeQuantity}</>}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div className={`rounded-xl p-3 ${isIn ? 'bg-success/5 border border-success/10' : 'bg-destructive/5 border border-destructive/10'}`}>
              <p className="text-sm font-medium">{product.designation}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.currentStock}: {product.quantity} {product.unit}</p>
            </div>

            {/* Taken By - MANDATORY */}
            <div className="space-y-1.5">
              <Label htmlFor="takenBy" className="text-xs font-semibold text-primary">{t.takenBy} *</Label>
              {activeEmployees.length > 0 ? (
                <Select value={takenBy} onValueChange={setTakenBy}>
                  <SelectTrigger className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1">
                    <SelectValue placeholder={t.selectResponsible} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.full_name}>
                        {emp.full_name} {emp.position ? `- ${emp.position}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="takenBy"
                  value={takenBy}
                  onChange={(e) => setTakenBy(e.target.value)}
                  placeholder={t.takenByPlaceholder}
                  className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1"
                  required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">{t.quantityLabel}</Label>
              <Input id="quantity" type="number" min="0" max={type === 'out' ? product.quantity : undefined} value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="length" className="text-xs">{t.lengthLabel}</Label>
                <Input id="length" type="number" step="0.01" min="0" value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 0)} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="width" className="text-xs">{t.widthLabel}</Label>
                <Input id="width" type="number" step="0.01" min="0" value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs text-muted-foreground">{t.surface}: <span className="font-bold text-primary">{(quantity * length * width).toFixed(2)} {t.m2}</span></p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">{t.notes}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder} className="resize-none rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-sm">{t.cancel}</Button>
              <Button type="submit" variant={isIn ? 'success' : 'destructive'} className="rounded-xl text-sm">{isIn ? t.submit : t.submitOut}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmAction}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmTakenBy.replace('{name}', takenBy).replace('{item}', product.designation).replace('{qty}', String(quantity))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className="rounded-xl">{t.confirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StockMovementForm;
