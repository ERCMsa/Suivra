import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import ProductForm from '@/components/ProductForm';
import ProductTable from '@/components/ProductTable';
import ExportButtons from '@/components/ExportButtons';
import DamageReportForm from '@/components/DamageReportForm';
import DamageReportList from '@/components/DamageReportList';
import DamageStats from '@/components/DamageStats';
import DashboardCharts from '@/components/DashboardCharts';
import LowStockAlerts from '@/components/LowStockAlerts';
import WithdrawalRequests from '@/components/WithdrawalRequests';
import { useInventory } from '@/hooks/useInventory';
import { useEmployees } from '@/hooks/useEmployees';
import { useWithdrawalRequests } from '@/hooks/useWithdrawalRequests';
import { useLanguage } from '@/hooks/useLanguage';

const Index = () => {
  const { t } = useLanguage();
  const {
    products, movements, damageReports, isLoading, addProduct, deleteProduct,
    addStockMovement, bulkImport, addDamageReport, getTotalStock, getTotalSurface, refresh,
  } = useInventory();
  const { employees } = useEmployees();
  const { requests, createRequest, approveRequest, rejectRequest } = useWithdrawalRequests();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
        <LowStockAlerts products={products} />
        <StatsCards products={products} movements={movements} totalStock={getTotalStock()} totalSurface={getTotalSurface()} />
        <DashboardCharts products={products} movements={movements} damageReports={damageReports} />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ProductForm onSubmit={addProduct} />
            <DamageReportForm products={products} employees={employees} onSubmit={addDamageReport} />
          </div>
          <ExportButtons products={products} movements={movements} onImport={bulkImport} />
        </div>
        <ProductTable products={products} movements={movements} onDelete={deleteProduct} onStockMovement={addStockMovement} onRefresh={refresh} />
        <WithdrawalRequests requests={requests} products={products} employees={employees} onCreateRequest={createRequest} onApprove={approveRequest} onReject={rejectRequest} />
        <DamageStats reports={damageReports} />
        <DamageReportList reports={damageReports} products={products} />
      </main>
      <footer className="border-t border-border/50 py-5 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground/60">
          {t.footer} © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
