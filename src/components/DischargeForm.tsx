import { useState, useMemo, useRef, useEffect } from 'react';
import { FileCheck, Plus, Trash2, Search, CalendarIcon, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Product, ProductFormData } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DischargeItem {
  product_id: string;
  quantity: number;
}

interface DischargeFormProps {
  products: Product[];
  employees: Employee[];
  onSubmit: (data: { employee_id: string; product_id: string; quantity: number; notes?: string; date_out?: string; additional_items?: { product_id: string; quantity: number }[] }) => Promise<any>;
  onStockOut: (productId: string, type: 'in' | 'out', quantity: number, length: number, width: number, notes?: string) => void;
  onAddProduct?: (data: ProductFormData) => Promise<void>;
}

const DischargeForm = ({ products, employees, onSubmit, onStockOut, onAddProduct }: DischargeFormProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [items, setItems] = useState<DischargeItem[]>([{ product_id: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOut, setDateOut] = useState<Date>(new Date());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({ designation: '', type: 'Équipement', quantity: 0, color: '', thickness: 0, unit: 'وحدة', length: 0, width: 0 });
  const employeeRef = useRef<HTMLDivElement>(null);

  // Recent employees (from localStorage)
  const [recentEmployeeIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent-employees') || '[]');
    } catch { return []; }
  });

  const saveRecentEmployee = (id: string) => {
    const recent = [id, ...recentEmployeeIds.filter(r => r !== id)].slice(0, 3);
    localStorage.setItem('recent-employees', JSON.stringify(recent));
  };

  // Close employee dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (employeeRef.current && !employeeRef.current.contains(e.target as Node)) {
        setEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'active'), [employees]);
  
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return activeEmployees;
    const term = employeeSearch.toLowerCase();
    return activeEmployees.filter(e =>
      e.full_name.toLowerCase().includes(term) ||
      (e.employee_id || '').toLowerCase().includes(term) ||
      (e.position || '').toLowerCase().includes(term) ||
      e.department.toLowerCase().includes(term)
    );
  }, [activeEmployees, employeeSearch]);

  const recentEmployees = useMemo(() => {
    return recentEmployeeIds
      .map(id => activeEmployees.find(e => e.id === id))
      .filter(Boolean) as Employee[];
  }, [recentEmployeeIds, activeEmployees]);

  const selectedEmployee = employees.find(e => e.id === employeeId);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };
  const updateItem = (idx: number, field: keyof DischargeItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const getProduct = (id: string) => products.find(p => p.id === id);
  const usedProductIds = items.map(i => i.product_id).filter(Boolean);

  const handleSubmit = async () => {
    if (!employeeId || !items[0].product_id) {
      toast.error(t.fillRequired);
      return;
    }
    for (const item of items) {
      if (!item.product_id) continue;
      const prod = getProduct(item.product_id);
      if (item.quantity <= 0) { toast.error(t.quantityMustBePositive); return; }
      if (prod && item.quantity > prod.quantity) { toast.error(`${t.insufficientStock}: ${prod.designation}`); return; }
    }

    setIsSubmitting(true);
    try {
      const validItems = items.filter(i => i.product_id);
      const [first, ...rest] = validItems;

      const discharge = await onSubmit({
        employee_id: employeeId,
        product_id: first.product_id,
        quantity: first.quantity,
        notes: notes || undefined,
        date_out: dateOut.toISOString(),
        additional_items: rest.length > 0 ? rest : undefined,
      });

      for (const item of validItems) {
        const prod = getProduct(item.product_id);
        if (prod) {
          onStockOut(item.product_id, 'out', item.quantity, prod.length, prod.width, `Décharge: ${discharge?.reference || ''}`);
        }
      }

      saveRecentEmployee(employeeId);
      setOpen(false);
      setEmployeeId('');
      setEmployeeSearch('');
      setItems([{ product_id: '', quantity: 1 }]);
      setNotes('');
      setDateOut(new Date());
      toast.success(t.dischargeCreated);
    } catch {
      toast.error(t.dischargeFail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddData.designation || !quickAddData.type) {
      toast.error(t.fillRequired);
      return;
    }
    // Check duplicates
    const exists = products.find(p => p.designation.toLowerCase() === quickAddData.designation.toLowerCase());
    if (exists) {
      toast.error(t.duplicateProduct || 'Cet article existe déjà');
      return;
    }
    if (onAddProduct) {
      try {
        await onAddProduct(quickAddData as ProductFormData);
        toast.success(t.productAdded);
        setQuickAddOpen(false);
        setQuickAddData({ designation: '', type: 'Équipement', quantity: 0, color: '', thickness: 0, unit: 'وحدة', length: 0, width: 0 });
      } catch {
        toast.error(t.dischargeFail);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2 rounded-xl h-9 text-sm shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
            <FileCheck className="h-3.5 w-3.5" />
            {t.newDischarge}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-600" />
              {t.newDischarge}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Employee searchable select */}
            <div ref={employeeRef}>
              <Label>{t.dischargeEmployee} *</Label>
              <div className="relative mt-1">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={t.selectEmployee}
                    value={employeeSearch || (selectedEmployee ? `${selectedEmployee.full_name} ${selectedEmployee.employee_id ? `(#${selectedEmployee.employee_id})` : ''}` : '')}
                    onChange={e => {
                      setEmployeeSearch(e.target.value);
                      setEmployeeId('');
                      setEmployeeDropdownOpen(true);
                    }}
                    onFocus={() => setEmployeeDropdownOpen(true)}
                    className="ps-9 rounded-xl"
                  />
                </div>
                {employeeDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-xl shadow-lg max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150">
                    {/* Recent employees */}
                    {!employeeSearch && recentEmployees.length > 0 && (
                      <div className="p-2 border-b">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold px-2 mb-1">{t.recentEmployees || 'Récents'}</p>
                        {recentEmployees.map(emp => (
                          <button
                            key={emp.id}
                            className="w-full text-start px-3 py-2 rounded-lg hover:bg-accent text-sm flex items-center gap-2 transition-colors"
                            onClick={() => {
                              setEmployeeId(emp.id);
                              setEmployeeSearch('');
                              setEmployeeDropdownOpen(false);
                            }}
                          >
                            <span className="font-medium">{emp.full_name}</span>
                            {emp.employee_id && <span className="text-xs text-muted-foreground">#{emp.employee_id}</span>}
                            <Badge variant="outline" className="text-[10px] ms-auto">{emp.position || emp.department}</Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Search results count */}
                    {employeeSearch && (
                      <p className="text-[10px] text-muted-foreground px-4 py-1.5 border-b">
                        {filteredEmployees.length} {t.resultsFound || 'résultat(s)'}
                      </p>
                    )}
                    {filteredEmployees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t.noEmployeeFound || 'Aucun employé trouvé'}</p>
                    ) : (
                      filteredEmployees.slice(0, 20).map(emp => (
                        <button
                          key={emp.id}
                          className="w-full text-start px-3 py-2 hover:bg-accent text-sm flex items-center gap-2 transition-colors"
                          onClick={() => {
                            setEmployeeId(emp.id);
                            setEmployeeSearch('');
                            setEmployeeDropdownOpen(false);
                          }}
                        >
                          <span className="font-medium">{highlightMatch(emp.full_name, employeeSearch)}</span>
                          {emp.employee_id && <span className="text-xs text-muted-foreground">#{highlightMatch(emp.employee_id, employeeSearch)}</span>}
                          <Badge variant="outline" className="text-[10px] ms-auto">{highlightMatch(emp.position || emp.department, employeeSearch)}</Badge>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Date picker */}
            <div>
              <Label>{t.dischargeDate || 'Date de décharge'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl mt-1", !dateOut && "text-muted-foreground")}>
                    <CalendarIcon className="me-2 h-4 w-4" />
                    {dateOut ? format(dateOut, 'PPP', { locale: fr }) : 'Choisir une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateOut}
                    onSelect={d => d && setDateOut(d)}
                    disabled={date => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Products */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">{t.dischargeProducts}</Label>
                <div className="flex gap-2">
                  {onAddProduct && (
                    <Button type="button" size="sm" variant="outline" className="gap-1 rounded-xl text-xs h-7 border-dashed" onClick={() => setQuickAddOpen(true)}>
                      <Plus className="h-3 w-3" /> {t.quickAddProduct || 'Nouvel article'}
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="outline" className="gap-1 rounded-xl text-xs h-7" onClick={addItem}>
                    <Plus className="h-3 w-3" /> {t.addItem}
                  </Button>
                </div>
              </div>
              {items.map((item, idx) => {
                const prod = getProduct(item.product_id);
                return (
                  <div key={idx} className="rounded-xl border border-border/60 p-3 space-y-2 bg-secondary/10">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select value={item.product_id} onValueChange={v => updateItem(idx, 'product_id', v)}>
                          <SelectTrigger className="rounded-xl text-sm"><SelectValue placeholder={t.selectItem} /></SelectTrigger>
                          <SelectContent className="max-h-60">
                            <div className="p-2 sticky top-0 bg-popover">
                              <Input
                                placeholder={t.searchProduct}
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                className="h-8 text-xs rounded-lg"
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                            {products
                              .filter(p => p.quantity > 0 && (!usedProductIds.includes(p.id) || p.id === item.product_id))
                              .filter(p => !productSearch || p.designation.toLowerCase().includes(productSearch.toLowerCase()) || p.type.toLowerCase().includes(productSearch.toLowerCase()))
                              .map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex items-center gap-2">
                                  {p.image_url && <img src={p.image_url} alt="" className="w-5 h-5 rounded object-cover" />}
                                  <span>{p.designation}</span>
                                  <span className="text-muted-foreground">({t.currentStock}: {p.quantity})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={prod?.quantity || 999}
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="rounded-xl w-20 text-center"
                      />
                      {items.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {prod && (
                      <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 rounded-lg px-2 py-1">
                        {t.currentStock}: <span className="font-bold">{prod.quantity} {prod.unit}</span>
                        → {t.dischargeAfter}: <span className="font-bold">{prod.quantity - item.quantity}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <Label>{t.notes}</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="rounded-xl mt-1"
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
              <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t.loading : t.createDischarge}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Product Modal */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t.quickAddProduct || 'Ajouter un nouvel article'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t.typeLabel}</Label>
              <Select value={quickAddData.type} onValueChange={v => setQuickAddData(d => ({ ...d, type: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Équipement', 'Consommable', 'Vêtement', 'Outillage'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.designationLabel}</Label>
              <Input
                value={quickAddData.designation}
                onChange={e => setQuickAddData(d => ({ ...d, designation: e.target.value }))}
                placeholder={t.designationPlaceholder}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>{t.quantityLabel}</Label>
              <Input
                type="number"
                min={0}
                value={quickAddData.quantity}
                onChange={e => setQuickAddData(d => ({ ...d, quantity: parseInt(e.target.value) || 0 }))}
                className="rounded-xl mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setQuickAddOpen(false)}>{t.cancel}</Button>
            <Button className="rounded-xl" onClick={handleQuickAdd}>{t.quickAddAndUse || 'Enregistrer et utiliser'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DischargeForm;
