import { useState } from 'react';
import { Search, Trash2, PackageOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, StockMovement } from '@/hooks/useInventory';
import StockMovementForm from './StockMovementForm';
import MovementHistory from './MovementHistory';
import EditProductForm from './EditProductForm';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface ProductTableProps {
  products: Product[];
  movements: StockMovement[];
  onDelete: (id: string) => void;
  onStockMovement: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string) => void;
  onRefresh: () => void;
}

const ProductTable = ({ products, movements, onDelete, onStockMovement, onRefresh }: ProductTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const filteredProducts = products.filter(
    (product) =>
      product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success(t.productDeleted);
  };

  const getProductMovements = (productId: string) => movements.filter((m) => m.product_id === productId);

  return (
    <Card className="shadow-card border-0 overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out backwards', animationDelay: '0.2s' }}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">{t.productList}</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3 ltr:right-auto" />
            <Input placeholder={t.searchProduct} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-9 ltr:pl-9 ltr:pr-3 h-9 text-sm rounded-xl bg-secondary/50 border-0 focus-visible:ring-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-muted/50 p-5"><PackageOpen className="h-10 w-10 text-muted-foreground/50" /></div>
            <h3 className="mt-4 text-sm font-medium text-foreground">{t.noProducts}</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-48">{searchTerm ? t.noSearchResults : t.startAdding}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                 <TableRow className="bg-secondary/30 hover:bg-secondary/30 border-0">
                   <TableHead className="text-center text-xs font-semibold text-muted-foreground w-12"></TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.designation}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.type}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.color}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.locationLabel}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.unitCol}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.quantity}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-secondary/20 transition-colors border-border/30">
                    <TableCell className="text-center">
                      {(product as any).image_url ? (
                        <img src={(product as any).image_url} alt="" className="w-9 h-9 rounded-lg object-cover mx-auto" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-muted/50 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-center text-sm">{product.designation}</TableCell>
                    <TableCell className="text-center text-sm">{product.type}</TableCell>
                    <TableCell className="text-center text-sm">
                      {product.color ? (
                        <span className="inline-flex items-center rounded-lg bg-secondary/60 px-2 py-0.5 text-xs">{product.color}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{product.unit}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-0.5 text-sm font-semibold text-primary">
                        {product.quantity.toLocaleString('fr-FR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-0.5">
                        <EditProductForm product={product} onUpdated={onRefresh} />
                        <StockMovementForm product={product} type="in" onSubmit={onStockMovement} />
                        <StockMovementForm product={product} type="out" onSubmit={onStockMovement} />
                        <MovementHistory product={product} movements={getProductMovements(product.id)} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                              <AlertDialogDescription>{t.deleteConfirm}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">{t.delete}</AlertDialogAction>
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
