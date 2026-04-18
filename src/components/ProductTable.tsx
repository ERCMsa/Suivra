import { useState } from 'react';
import { Search, Trash2, PackageOpen, MoreHorizontal, ArrowUpCircle, ArrowDownCircle, History, Pencil, Eye, Building2, Phone, MessageCircle, Star, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product, StockMovement } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { Supplier } from '@/hooks/useSuppliers';
import StockMovementForm from './StockMovementForm';
import MovementHistory from './MovementHistory';
import EditProductForm from './EditProductForm';
import SupplierAvatar from './SupplierAvatar';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface ProductTableProps {
  products: Product[];
  movements: StockMovement[];
  onDelete: (id: string) => void;
  onStockMovement: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string, takenBy?: string) => void;
  onRefresh: () => void;
  employees?: Employee[];
  suppliers?: Supplier[];
  supplierProducts?: { supplier_id: string; product_id: string }[];
}

const INITIAL_DISPLAY_COUNT = 10;

const ProductTable = ({ products, movements, onDelete, onStockMovement, onRefresh, employees = [], suppliers = [], supplierProducts = [] }: ProductTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [supplierModalProduct, setSupplierModalProduct] = useState<Product | null>(null);
  const { t, lang } = useLanguage();

  const getLinkedSuppliers = (productId: string) => {
    const linkedIds = supplierProducts.filter(sp => sp.product_id === productId).map(sp => sp.supplier_id);
    return suppliers.filter(s => linkedIds.includes(s.id));
  };

  const filteredProducts = products.filter(
    (product) =>
      product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((product as any).brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = filteredProducts.length > INITIAL_DISPLAY_COUNT;

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success(t.productDeleted);
  };

  const getProductMovements = (productId: string) => movements.filter((m) => m.product_id === productId);

  return (
    <Card className="shadow-card border-0 overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out backwards', animationDelay: '0.2s' }}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">{t.productList} ({filteredProducts.length})</CardTitle>
            {hasMore && (
              <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setShowAll(!showAll)}>
                <Eye className="h-4 w-4" />
                {showAll ? `Réduire` : `Voir tout`}
              </Button>
            )}
          </div>
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
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.brandLabel}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.type}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.color}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.locationLabel}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.unitCol}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">{t.quantity}</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground w-14">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-secondary/20 transition-colors border-border/30 cursor-pointer" onClick={() => setSupplierModalProduct(product)}>
                    <TableCell className="text-center">
                      {(product as any).image_url ? (
                        <img src={(product as any).image_url} alt="" className="w-9 h-9 rounded-lg object-cover mx-auto" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-muted/50 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-center text-sm">{product.designation}</TableCell>
                    <TableCell className="text-center text-sm">
                      {(product as any).brand ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2 py-0.5 text-xs">
                          {(product as any).brand_logo && <img src={(product as any).brand_logo} alt="" className="w-4 h-4 rounded object-contain" />}
                          {(product as any).brand}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm">{product.type}</TableCell>
                    <TableCell className="text-center text-sm">
                      {product.color ? (
                        <span className="inline-flex items-center rounded-lg bg-secondary/60 px-2 py-0.5 text-xs">{product.color}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span className="inline-flex items-center rounded-lg bg-accent/60 px-2 py-0.5 text-xs font-medium">{(product as any).location || 'Magasin'}</span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{product.unit}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-0.5 text-sm font-semibold text-primary">
                        {product.quantity.toLocaleString('fr-FR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <EditProductForm product={product} onUpdated={onRefresh} asMenuItem />
                            <StockMovementForm product={product} type="in" onSubmit={onStockMovement} employees={employees} />
                            <StockMovementForm product={product} type="out" onSubmit={onStockMovement} employees={employees} />
                            <MovementHistory product={product} movements={getProductMovements(product.id)} />
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive gap-2">
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {t.delete}
                                </DropdownMenuItem>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Supplier Modal for clicked product */}
      <Dialog open={!!supplierModalProduct} onOpenChange={() => setSupplierModalProduct(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {supplierModalProduct && (supplierModalProduct as any).image_url ? (
                <img src={(supplierModalProduct as any).image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted" />
              )}
              <div>
                <span className="block">{supplierModalProduct?.designation}</span>
                {supplierModalProduct && (supplierModalProduct as any).brand && (
                  <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                    {(supplierModalProduct as any).brand_logo && <img src={(supplierModalProduct as any).brand_logo} alt="" className="w-4 h-4 rounded object-contain" />}
                    {(supplierModalProduct as any).brand}
                  </span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {supplierModalProduct && getLinkedSuppliers(supplierModalProduct.id).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{lang === 'fr' ? 'Aucun fournisseur associé' : 'لا يوجد مورد مرتبط'}</p>
                <p className="text-xs mt-1">{lang === 'fr' ? 'Associez des fournisseurs depuis la Fenêtre d\'Achat' : 'اربط الموردين من نافذة الشراء'}</p>
              </div>
            ) : (
              supplierModalProduct && getLinkedSuppliers(supplierModalProduct.id).map(supplier => (
                <Card key={supplier.id} className="rounded-xl">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <SupplierAvatar
                        name={supplier.name}
                        imageUrl={(supplier as any).image_url}
                        phone={supplier.phone}
                        category={supplier.category}
                        productName={supplierModalProduct?.designation}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{supplier.name}</span>
                          {supplier.is_recommended && (
                            <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 text-amber-600 border-amber-200">
                              <Star className="h-3 w-3 fill-amber-400" />
                            </Badge>
                          )}
                        </div>
                        {supplier.category && <span className="text-xs text-muted-foreground">{supplier.category}</span>}
                      </div>
                    </div>
                    {supplier.phone && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 flex-1 gap-2 text-xs" onClick={() => window.open(`tel:${supplier.phone}`, '_self')}>
                          <Phone className="h-3.5 w-3.5 text-blue-500" />
                          {supplier.phone}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          onClick={() => {
                            const msg = encodeURIComponent(`Hello, I would like info about: ${supplierModalProduct?.designation}`);
                            window.open(`https://wa.me/${supplier.phone!.replace(/[^0-9+]/g, '')}?text=${msg}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProductTable;
