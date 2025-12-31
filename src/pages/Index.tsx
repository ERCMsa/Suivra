import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import ProductForm from '@/components/ProductForm';
import ProductTable from '@/components/ProductTable';
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <StatsCards
            products={products}
            movements={movements}
            totalStock={getTotalStock()}
            totalSurface={getTotalSurface()}
          />

          {/* Actions */}
          <div className="flex justify-start">
            <ProductForm onSubmit={addProduct} />
          </div>

          {/* Products Table */}
          <ProductTable
            products={products}
            movements={movements}
            onDelete={deleteProduct}
            onStockMovement={addStockMovement}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          نظام إدارة المخزون © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
