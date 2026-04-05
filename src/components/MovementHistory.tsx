import { useState } from 'react';
import { History, ArrowUpCircle, ArrowDownCircle, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const sortedMovements = [...movements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const filteredMovements = sortedMovements.filter(m => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const takenBy = (m as any).taken_by || '';
    const profile = m.created_by ? getProfileByUserId(m.created_by) : null;
    return (
      takenBy.toLowerCase().includes(s) ||
      (profile?.display_name || '').toLowerCase().includes(s) ||
      (m.notes || '').toLowerCase().includes(s) ||
      m.type.toLowerCase().includes(s)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={e => e.preventDefault()} className="gap-2">
          <History className="h-3.5 w-3.5" />
          {t.movementHistory}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base"><History className="h-5 w-5" />{t.movementHistory} - {product.designation}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          {/* Search by person */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3 ltr:right-auto" />
            <Input
              placeholder={t.searchByPerson}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-9 ltr:pl-9 ltr:pr-3 h-9 text-sm rounded-xl bg-secondary/50 border-0 focus-visible:ring-1"
            />
          </div>

          {filteredMovements.length === 0 ? (
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
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.takenBy}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.date}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.operatedBy}</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.notes}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => {
                    const profile = movement.created_by ? getProfileByUserId(movement.created_by) : null;
                    const takenBy = (movement as any).taken_by;
                    return (
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
                      <TableCell className="text-center">
                        {takenBy ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <User className="h-3 w-3" />
                            {takenBy}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: lang === 'ar' ? ar : fr })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <UserAvatar name={profile?.display_name} avatarUrl={profile?.avatar_url} size="sm" />
                          <span className="text-xs text-muted-foreground">{profile?.display_name || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-center text-xs">{movement.notes || '-'}</TableCell>
                    </TableRow>
                    );
                  })}
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
