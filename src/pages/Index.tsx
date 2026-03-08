import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import ProductForm from '@/components/ProductForm';
import ProductTable from '@/components/ProductTable';
import ExportButtons from '@/components/ExportButtons';
import { useInventory } from '@/hooks/useInventory';

const Index = () => {
  const {
    products,
    movements,
    isLoading,
    addProduct,
    deleteProduct,
    addStockMovement,
    getTotalStock,
    getTotalSurface,
  } = useInventory();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
        <StatsCards products={products} movements={movements} totalStock={getTotalStock()} totalSurface={getTotalSurface()} />
        
        <div className="flex items-center justify-between gap-3">
          <ProductForm onSubmit={addProduct} />
          <ExportButtons products={products} movements={movements} />
        </div>
        
        <ProductTable products={products} movements={movements} onDelete={deleteProduct} onStockMovement={addStockMovement} />
      </main>
      
      <footer className="border-t border-border/50 py-5 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground/60">
          نظام إدارة المخزون © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
