import { useState } from 'react';
import { History, User, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Discharge } from '@/hooks/useDischarges';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';

interface EquipmentHistoryProps {
  discharges: Discharge[];
  products: Product[];
  employees: Employee[];
}

const EquipmentHistory = ({ discharges, products, employees }: EquipmentHistoryProps) => {
  const { t } = useLanguage();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [expanded, setExpanded] = useState(true);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  // Get all products that have been in at least one discharge
  const productsWithHistory = products.filter(p =>
    discharges.some(d => d.product_id === p.id || d.items?.some(i => i.product_id === p.id))
  );

  // Get history for selected product
  const productHistory = selectedProductId
    ? discharges
        .filter(d => d.product_id === selectedProductId || d.items?.some(i => i.product_id === selectedProductId))
        .sort((a, b) => new Date(a.date_out).getTime() - new Date(b.date_out).getTime())
    : [];

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <History className="h-5 w-5 text-primary" />
            {t.equipmentHistory}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="max-w-xs rounded-xl text-sm">
              <SelectValue placeholder={t.selectEquipment} />
            </SelectTrigger>
            <SelectContent>
              {productsWithHistory.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.designation}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {!selectedProductId ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t.selectEquipmentPrompt}</p>
          ) : productHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t.noEquipmentHistory}</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 start-4 w-0.5 bg-border" />
              <div className="space-y-4">
                {productHistory.map((d, idx) => {
                  const emp = getEmployee(d.employee_id);
                  const isActive = d.status === 'active';
                  const itemQty = d.items?.find(i => i.product_id === selectedProductId)?.quantity || d.quantity;
                  return (
                    <div key={d.id} className="relative flex gap-4 ps-10">
                      {/* Timeline dot */}
                      <div className={`absolute start-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${isActive ? 'bg-amber-500' : 'bg-green-500'}`} />
                      <div className={`flex-1 rounded-xl border p-3 ${isActive ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-sm">{emp?.full_name || '-'}</span>
                            {emp?.employee_id && <span className="text-xs text-muted-foreground">#{emp.employee_id}</span>}
                          </div>
                          <Badge className={isActive ? 'bg-amber-100 text-amber-800 text-xs' : 'bg-green-100 text-green-800 text-xs'}>
                            {isActive ? t.dischargeActive : t.dischargeReturnedStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-amber-600" />
                            {t.takenOn}: {new Date(d.date_out).toLocaleDateString('fr-FR')}
                          </span>
                          {d.date_returned && (
                            <span className="flex items-center gap-1">
                              <ArrowLeft className="h-3 w-3 text-green-600" />
                              {t.returnedOn}: {new Date(d.date_returned).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          <span>{t.quantity}: <b>{itemQty}</b></span>
                          <span className="text-xs font-mono">{d.reference}</span>
                        </div>
                        {d.notes && <p className="text-xs text-muted-foreground mt-1 italic">{d.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default EquipmentHistory;
