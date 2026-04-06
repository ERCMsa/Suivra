import { useState } from 'react';
import Header from '@/components/Header';
import { useCaisses } from '@/hooks/useCaisses';
import { useInventory } from '@/hooks/useInventory';
import { useEmployees } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';
import CaisseList from '@/components/CaisseList';
import CaisseDetail from '@/components/CaisseDetail';

const Caisses = () => {
  const { t } = useLanguage();
  const caisseHook = useCaisses();
  const { products, refresh: refreshInventory } = useInventory();
  const { employees } = useEmployees();
  const [selectedCaisseId, setSelectedCaisseId] = useState<string | null>(null);

  const selectedCaisse = caisseHook.caisses.find(c => c.id === selectedCaisseId);

  if (caisseHook.isLoading) {
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
        {selectedCaisse ? (
          <CaisseDetail
            caisse={selectedCaisse}
            caisseHook={caisseHook}
            products={products}
            employees={employees}
            onBack={() => setSelectedCaisseId(null)}
            onRefreshInventory={refreshInventory}
          />
        ) : (
          <CaisseList
            caisseHook={caisseHook}
            products={products}
            onSelectCaisse={setSelectedCaisseId}
          />
        )}
      </main>
      <footer className="border-t border-border/50 py-5 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground/60">
          {t.footer} © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Caisses;
