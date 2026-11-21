import { useMemo, useState } from 'react';
import { ClipboardList, History, Layers, PackageCheck, RefreshCw, ShieldAlert, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import InventoryEditor from '@/components/InventoryEditor';
import InventoryHistory from '@/components/InventoryHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/hooks/useInventory';
import { useInventorySnapshots } from '@/hooks/useInventorySnapshots';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateTime, formatQuantity } from '@/lib/inventory';
import type { InventoryQuantityEntry } from '@/lib/inventory';

const Inventory = () => {
  const { lang } = useLanguage();
  const { canViewInventory, canSaveInventory } = usePermissions();
  const { products, isLoading: productsLoading, refresh } = useInventory();
  const {
    snapshots,
    snapshotItems,
    isLoading: historyLoading,
    isLoadingItems,
    isSaving,
    historyAvailable,
    error,
    fetchSnapshots,
    fetchSnapshotItems,
    saveInventory,
  } = useInventorySnapshots();

  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [refreshing, setRefreshing] = useState(false);

  const labels = lang === 'fr' ? {
    title: 'Gestion de l\'inventaire',
    subtitle: 'Comptez le stock réel, enregistrez des snapshots complets et consultez l\'historique immuable.',
    currentTab: 'Inventaire actuel',
    historyTab: 'Historique',
    materials: 'Matériaux',
    materialsDesc: 'référencés dans le stock',
    totalQty: 'Quantité totale',
    totalQtyDesc: 'toutes unités confondues',
    lastSnapshot: 'Dernier inventaire',
    lastSnapshotDesc: 'snapshot le plus récent',
    snapshots: 'Snapshots',
    snapshotsDesc: 'enregistrements conservés',
    noSnapshot: 'Aucun snapshot',
    refresh: 'Actualiser',
    accessDenied: 'Accès restreint',
    accessDeniedDesc: 'Cette page est réservée aux administrateurs et aux magasiniers.',
    loading: 'Chargement de l\'inventaire…',
    firstInventory: 'Premier inventaire : le stock actuel sera conservé comme baseline.',
  } : {
    title: 'إدارة الجرد',
    subtitle: 'احسب المخزون الفعلي، احفظ نسخاً كاملة واطّلع على سجل غير قابل للتعديل.',
    currentTab: 'الجرد الحالي',
    historyTab: 'السجل',
    materials: 'المواد',
    materialsDesc: 'مسجلة في المخزون',
    totalQty: 'إجمالي الكميات',
    totalQtyDesc: 'جميع الوحدات',
    lastSnapshot: 'آخر جرد',
    lastSnapshotDesc: 'أحدث نسخة محفوظة',
    snapshots: 'النسخ',
    snapshotsDesc: 'سجلات محفوظة',
    noSnapshot: 'لا توجد نسخة',
    refresh: 'تحديث',
    accessDenied: 'وصول مقيّد',
    accessDeniedDesc: 'هذه الصفحة مخصصة للمديرين وأمناء المخزن.',
    loading: 'جارٍ تحميل الجرد…',
    firstInventory: 'أول جرد: سيتم الاحتفاظ بالمخزون الحالي كنسخة أولية.',
  };

  const totalQuantity = useMemo(
    () => products.reduce((total, product) => total + (Number(product.quantity) || 0), 0),
    [products],
  );

  const latestSnapshot = snapshots[0] ?? null;
  const isFirstInventory = !historyLoading && historyAvailable && snapshots.length === 0;

  const handleSave = async (entries: InventoryQuantityEntry[], requestId: string, note?: string) => {
    await saveInventory(entries, requestId, note);
    await refresh();
    setTab('history');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), fetchSnapshots()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-5 max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              {labels.title}
            </h2>
            <p className="text-sm text-muted-foreground max-w-3xl">{labels.subtitle}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl text-xs self-start"
            onClick={handleRefresh}
            disabled={productsLoading || historyLoading || refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${productsLoading || historyLoading || refreshing ? 'animate-spin' : ''}`} />
            {labels.refresh}
          </Button>
        </div>

        {!canViewInventory ? (
          <Card className="rounded-2xl border-0 shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-destructive/10 p-5">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{labels.accessDenied}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{labels.accessDeniedDesc}</p>
            </CardContent>
          </Card>
        ) : productsLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{labels.loading}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border-0 shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{labels.materials}</p>
                    <p className="text-xl font-bold leading-tight">{products.length}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{labels.materialsDesc}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-success/10 p-2.5">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{labels.totalQty}</p>
                    <p className="text-xl font-bold leading-tight">{formatQuantity(totalQuantity)}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{labels.totalQtyDesc}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-accent p-2.5">
                    <PackageCheck className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{labels.lastSnapshot}</p>
                    <p className="text-sm font-bold leading-tight truncate">
                      {latestSnapshot ? formatDateTime(latestSnapshot.captured_at) : labels.noSnapshot}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{labels.lastSnapshotDesc}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-secondary p-2.5">
                    <History className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{labels.snapshots}</p>
                    <p className="text-xl font-bold leading-tight">{snapshots.length}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{labels.snapshotsDesc}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {isFirstInventory && (
              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
                <ClipboardList className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>{labels.firstInventory}</span>
              </div>
            )}

            <Tabs value={tab} onValueChange={value => setTab(value as 'current' | 'history')} className="space-y-3">
              <TabsList className="rounded-xl">
                <TabsTrigger value="current" className="rounded-lg text-xs gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {labels.currentTab}
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg text-xs gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  {labels.historyTab}
                  <Badge variant="secondary" className="ms-1 rounded-md px-1.5 py-0 text-[10px]">{snapshots.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-0" forceMount>
                <InventoryEditor
                  products={products}
                  isFirstInventory={isFirstInventory}
                  isSaving={isSaving}
                  canSave={canSaveInventory}
                  historyAvailable={historyAvailable}
                  historyLoading={historyLoading}
                  onSave={handleSave}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <InventoryHistory
                  snapshots={snapshots}
                  items={snapshotItems}
                  products={products}
                  isLoading={historyLoading}
                  isLoadingItems={isLoadingItems}
                  historyAvailable={historyAvailable}
                  error={error}
                  onFetchItems={fetchSnapshotItems}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default Inventory;
