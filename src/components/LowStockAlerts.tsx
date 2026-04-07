import { AlertCircle, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Product } from '@/hooks/useInventory';
import { useNavigate } from 'react-router-dom';

interface LowStockAlertsProps {
  products: Product[];
}

const LowStockAlerts = ({ products }: LowStockAlertsProps) => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const lowStockProducts = products.filter((p) => {
    const minQty = p.min_quantity || 0;
    return minQty > 0 && p.quantity <= minQty;
  });

  if (lowStockProducts.length === 0) return null;

  return (
    <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
            <span className="font-semibold text-sm text-destructive">{t.lowStockAlert} ({lowStockProducts.length.toLocaleString('fr-FR')})</span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5 text-xs"
            onClick={() => navigate('/purchase-requests')}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {lang === 'fr' ? 'Voir les achats' : 'عرض المشتريات'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {lowStockProducts.map((p) => (
            <Badge key={p.id} variant="destructive" className="text-xs gap-1.5 py-1">
              {p.designation}
              <span className="opacity-70">({p.quantity.toLocaleString('fr-FR')} / {(p.min_quantity || 0).toLocaleString('fr-FR')})</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LowStockAlerts;
