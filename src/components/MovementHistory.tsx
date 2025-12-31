import { History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Product, StockMovement } from '@/types/inventory';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MovementHistoryProps {
  product: Product;
  movements: StockMovement[];
}

const MovementHistory = ({ product, movements }: MovementHistoryProps) => {
  const sortedMovements = [...movements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل الحركات - {product.designation}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {sortedMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-4">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">لا توجد حركات</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                لم يتم تسجيل أي حركات لهذا المنتج بعد
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">النوع</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">الطول</TableHead>
                    <TableHead className="text-center">العرض</TableHead>
                    <TableHead className="text-center">المساحة</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                    <TableHead className="text-center">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {movement.type === 'in' ? (
                            <>
                              <ArrowUpCircle className="h-4 w-4 text-success" />
                              <span className="text-success">إدخال</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownCircle className="h-4 w-4 text-destructive" />
                              <span className="text-destructive">إخراج</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {movement.quantity}
                      </TableCell>
                      <TableCell className="text-center">{movement.length} م</TableCell>
                      <TableCell className="text-center">{movement.width} م</TableCell>
                      <TableCell className="text-center font-medium">
                        {movement.surface} م²
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', {
                          locale: ar,
                        })}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-center text-sm">
                        {movement.notes || '-'}
                      </TableCell>
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
