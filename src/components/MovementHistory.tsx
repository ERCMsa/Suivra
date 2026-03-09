import { History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Product, StockMovement } from '@/hooks/useInventory';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { useProfiles } from '@/hooks/useProfiles';
import UserAvatar from '@/components/UserAvatar';

interface MovementHistoryProps {
  product: Product;
  movements: StockMovement[];
}

const MovementHistory = ({ product, movements }: MovementHistoryProps) => {
  const { t, lang } = useLanguage();
  const { getProfileByUserId } = useProfiles();
  const sortedMovements = [...movements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"><History className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base"><History className="h-5 w-5" />{t.movementHistory} - {product.designation}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {sortedMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-2xl bg-muted/50 p-4"><History className="h-8 w-8 text-muted-foreground/50" /></div>
              <h3 className="mt-4 text-sm font-medium">{t.noMovements}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.noMovementsDesc}</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30 hover:bg-secondary/30 border-0">
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.movementType}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.quantity}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.length}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.width}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.surface}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.date}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.operatedBy}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.notes}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMovements.map((movement) => (
                    <TableRow key={movement.id} className="hover:bg-secondary/20 transition-colors border-border/30">
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {movement.type === 'in' ? (
                            <><ArrowUpCircle className="h-4 w-4 text-success" /><span className="text-success text-sm">{t.in}</span></>
                          ) : (
                            <><ArrowDownCircle className="h-4 w-4 text-destructive" /><span className="text-destructive text-sm">{t.out}</span></>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-sm">{movement.quantity}</TableCell>
                      <TableCell className="text-center text-sm">{movement.length} {t.m}</TableCell>
                      <TableCell className="text-center text-sm">{movement.width} {t.m}</TableCell>
                      <TableCell className="text-center font-medium text-sm">{movement.surface} {t.m2}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: lang === 'ar' ? ar : fr })}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-center text-xs">{movement.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovementHistory;
