import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Discharge } from '@/hooks/useDischarges';
import { Product } from '@/hooks/useInventory';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface PartialReturnDialogProps {
  discharge: Discharge;
  products: Product[];
  onConfirm: (
    dischargeId: string,
    returns: { item_id: string; product_id: string; quantity: number; new_returned_total: number }[]
  ) => Promise<void>;
  onStockReturn: (productId: string, quantity: number) => Promise<void>;
}

const PartialReturnDialog = ({ discharge, products, onConfirm, onStockReturn }: PartialReturnDialogProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [returns, setReturns] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const items = discharge.items && discharge.items.length > 0
    ? discharge.items
    : [{ id: discharge.id, product_id: discharge.product_id, quantity: discharge.quantity, returned_quantity: 0, discharge_id: discharge.id, created_at: '' }];

  useEffect(() => {
    if (open) {
      const init: Record<string, number> = {};
      items.forEach(it => { init[it.id] = 0; });
      setReturns(init);
    }
  }, [open]);

  const getProduct = (id: string) => products.find(p => p.id === id);

  const handleConfirm = async () => {
    const toProcess = items
      .filter(it => (returns[it.id] || 0) > 0)
      .map(it => {
        const qtyNow = returns[it.id];
        const newTotal = Number(it.returned_quantity || 0) + qtyNow;
        return { item_id: it.id, product_id: it.product_id, quantity: qtyNow, new_returned_total: newTotal };
      });

    if (toProcess.length === 0) {
      toast.error(t.fillRequired);
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(discharge.id, toProcess);
      // Restore stock for each returned qty
      for (const r of toProcess) {
        await onStockReturn(r.product_id, r.quantity);
      }
      toast.success((t as any).partialReturnSuccess || 'OK');
      setOpen(false);
    } catch {
      toast.error(t.dischargeFail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
        title={(t as any).partialReturn}
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-600" />
            {(t as any).partialReturnTitle}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{(t as any).partialReturnDesc}</p>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {items.map(it => {
            const prod = getProduct(it.product_id);
            const total = Number(it.quantity);
            const alreadyReturned = Number(it.returned_quantity || 0);
            const remaining = total - alreadyReturned;
            const value = returns[it.id] || 0;
            return (
              <div key={it.id} className="rounded-xl border border-border/60 p-3 space-y-2 bg-secondary/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{prod?.designation || '-'}</div>
                  <Badge variant="outline" className="text-[10px]">
                    {total} {prod?.unit || ''}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {alreadyReturned > 0 && <span>✅ {(t as any).alreadyReturned}: {alreadyReturned}</span>}
                  <span className="ms-auto font-semibold text-foreground">{(t as any).remainingQty}: {remaining}</span>
                </div>
                {remaining > 0 ? (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">{(t as any).returnNow}:</Label>
                    <Input
                      type="number"
                      min={0}
                      max={remaining}
                      value={value}
                      onChange={e => {
                        const v = Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0));
                        setReturns(r => ({ ...r, [it.id]: v }));
                      }}
                      className="rounded-xl w-24 h-8 text-center"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={() => setReturns(r => ({ ...r, [it.id]: remaining }))}
                    >
                      Max
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-success">✓ {(t as any).dischargeReturnedStatus}</p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? t.loading : ((t as any).confirmPartialReturn || 'Confirmer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartialReturnDialog;
