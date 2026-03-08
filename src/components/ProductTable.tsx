import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, StockMovement } from '@/hooks/useInventory';
import StockMovementForm from './StockMovementForm';
import MovementHistory from './MovementHistory';
import { toast } from 'sonner';

interface ProductTableProps {
  products: Product[];
  movements: StockMovement[];
  onDelete: (id: string) => void;
  onStockMovement: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string) => void;
}

const ProductTable = ({ products, movements, onDelete, onStockMovement }: ProductTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(
    (product) =>
      product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success('تم حذف المنتج بنجاح');
  };

  const getProductMovements = (productId: string) => movements.filter((m) => m.product_id === productId);

  return (
    <Card className="shadow-card animate-slide-up border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">قائمة المنتجات</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="بحث عن منتج..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4"><Search className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="mt-4 text-lg font-medium">لا توجد منتجات</h3>
            <p className="mt-1 text-sm text-muted-foreground">{searchTerm ? 'لم يتم العثور على منتجات تطابق البحث' : 'ابدأ بإضافة منتج جديد'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="gradient-header hover:bg-primary/90">
                  <TableHead className="text-center text-primary-foreground font-semibold">التسمية</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">النوع</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">اللون</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">السمك</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">الوحدة</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">الكمية</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">الطول</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">العرض</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">المساحة</TableHead>
                  <TableHead className="text-center text-primary-foreground font-semibold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                    <TableCell className="font-medium text-center">{product.designation}</TableCell>
                    <TableCell className="text-center">{product.type}</TableCell>
                    <TableCell className="text-center">{product.color || '-'}</TableCell>
                    <TableCell className="text-center">{product.thickness} مم</TableCell>
                    <TableCell className="text-center">{product.unit}</TableCell>
                    <TableCell className="text-center font-semibold">{product.quantity.toLocaleString('ar-SA')}</TableCell>
                    <TableCell className="text-center">{product.length} م</TableCell>
                    <TableCell className="text-center">{product.width} م</TableCell>
                    <TableCell className="text-center font-semibold text-primary">{product.surface.toLocaleString('ar-SA')} م²</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <StockMovementForm product={product} type="in" onSubmit={onStockMovement} />
                        <StockMovementForm product={product} type="out" onSubmit={onStockMovement} />
                        <MovementHistory product={product} movements={getProductMovements(product.id)} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>سيتم حذف المنتج "{product.designation}" نهائياً مع جميع حركات المخزون المرتبطة به.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductTable;
