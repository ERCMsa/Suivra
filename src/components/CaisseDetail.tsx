import { useState } from 'react';
import { ArrowLeft, Plus, Minus, AlertTriangle, History, Package, RefreshCw, Settings2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import type { Caisse, useCaisses } from '@/hooks/useCaisses';
import type { Product } from '@/hooks/useInventory';
import type { Tables } from '@/integrations/supabase/types';

type Employee = Tables<'employees'>;

interface Props {
  caisse: Caisse;
  caisseHook: ReturnType<typeof useCaisses>;
  products: Product[];
  employees: Employee[];
  onBack: () => void;
  onRefreshInventory: () => Promise<any>;
}

const CaisseDetail = ({ caisse, caisseHook, products, employees, onBack, onRefreshInventory }: Props) => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isFr = lang === 'fr';
  const items = caisseHook.getCaisseItems(caisse.id);
  const movements = caisseHook.getCaisseMovements(caisse.id);

  // Add item state
  const [addOpen, setAddOpen] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addPerson, setAddPerson] = useState('');
  const [addSearch, setAddSearch] = useState('');

  // Remove item state
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeProductId, setRemoveProductId] = useState('');
  const [removeQty, setRemoveQty] = useState(1);
  const [removePerson, setRemovePerson] = useState('');
  const [returnToStock, setReturnToStock] = useState(false);

  // Damage state
  const [damageOpen, setDamageOpen] = useState(false);
  const [damageProductId, setDamageProductId] = useState('');
  const [damageQty, setDamageQty] = useState(1);
  const [damagePerson, setDamagePerson] = useState('');
  const [damageReason, setDamageReason] = useState('');
  const [damageDestination, setDamageDestination] = useState<'maintenance' | 'stock'>('maintenance');
  const [replaceProductId, setReplaceProductId] = useState('');
  const [replaceQty, setReplaceQty] = useState(1);

  // Init state
  const [initOpen, setInitOpen] = useState(false);
  const [initItems, setInitItems] = useState<{ product_id: string; quantity: number }[]>([{ product_id: '', quantity: 1 }]);
  const [initPerson, setInitPerson] = useState('');
  const [initSearch, setInitSearch] = useState('');

  // Movement search
  const [movSearch, setMovSearch] = useState('');

  const getProductName = (id: string) => products.find(p => p.id === id)?.designation || '—';

  const filteredProducts = products.filter(p =>
    p.designation.toLowerCase().includes(addSearch.toLowerCase()) || p.type.toLowerCase().includes(addSearch.toLowerCase())
  );

  const filteredInitProducts = products.filter(p =>
    p.designation.toLowerCase().includes(initSearch.toLowerCase()) || p.type.toLowerCase().includes(initSearch.toLowerCase())
  );

  const handleAdd = async () => {
    if (!addProductId || !addPerson.trim()) {
      toast({ title: isFr ? 'Remplissez tous les champs' : 'أملأ جميع الحقول', variant: 'destructive' });
      return;
    }
    try {
      await caisseHook.addItemToCaisse(caisse.id, addProductId, addQty, addPerson.trim(), true);
      await onRefreshInventory();
      toast({ title: isFr ? 'Article ajouté à la caisse' : 'تمت إضافة العنصر للصندوق' });
      setAddOpen(false); setAddProductId(''); setAddQty(1); setAddPerson(''); setAddSearch('');
    } catch { toast({ title: isFr ? 'Erreur' : 'خطأ', variant: 'destructive' }); }
  };

  const handleRemove = async () => {
    if (!removeProductId || !removePerson.trim()) return;
    try {
      await caisseHook.removeItemFromCaisse(caisse.id, removeProductId, removeQty, removePerson.trim(), returnToStock);
      if (returnToStock) await onRefreshInventory();
      toast({ title: isFr ? 'Article retiré' : 'تم إزالة العنصر' });
      setRemoveOpen(false); setRemoveProductId(''); setRemoveQty(1); setRemovePerson('');
    } catch { toast({ title: isFr ? 'Erreur' : 'خطأ', variant: 'destructive' }); }
  };

  const handleDamage = async () => {
    if (!damageProductId || !damagePerson.trim() || !damageReason.trim()) return;
    try {
      await caisseHook.reportDamage(
        caisse.id, damageProductId, damageQty, damagePerson.trim(), damageReason.trim(),
        damageDestination, replaceProductId || undefined, replaceProductId ? replaceQty : undefined
      );
      if (damageDestination === 'stock' || replaceProductId) await onRefreshInventory();
      toast({ title: isFr ? 'Dommage enregistré' : 'تم تسجيل التلف' });
      setDamageOpen(false); setDamageProductId(''); setDamageQty(1); setDamagePerson(''); setDamageReason('');
      setReplaceProductId(''); setReplaceQty(1);
    } catch { toast({ title: isFr ? 'Erreur' : 'خطأ', variant: 'destructive' }); }
  };

  const handleInit = async () => {
    if (!initPerson.trim()) return;
    const validItems = initItems.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) return;
    try {
      await caisseHook.initializeCaisse(caisse.id, validItems, initPerson.trim());
      toast({ title: isFr ? 'Caisse initialisée' : 'تم تهيئة الصندوق' });
      setInitOpen(false); setInitItems([{ product_id: '', quantity: 1 }]); setInitPerson('');
    } catch { toast({ title: isFr ? 'Erreur' : 'خطأ', variant: 'destructive' }); }
  };

  const getMovementLabel = (type: string) => {
    const labels: Record<string, string> = isFr
      ? { add: 'Ajout', remove: 'Retrait', damage: 'Dommage', replace: 'Remplacement', init: 'Initialisation', return_stock: 'Retour stock' }
      : { add: 'إضافة', remove: 'إزالة', damage: 'تلف', replace: 'استبدال', init: 'تهيئة', return_stock: 'إرجاع للمخزن' };
    return labels[type] || type;
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'add': case 'init': case 'replace': return 'bg-emerald-100 text-emerald-700';
      case 'remove': case 'return_stock': return 'bg-blue-100 text-blue-700';
      case 'damage': return 'bg-red-100 text-red-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredMovements = movements.filter(m =>
    getProductName(m.product_id).toLowerCase().includes(movSearch.toLowerCase()) ||
    (m.responsible_person || '').toLowerCase().includes(movSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{caisse.name}</h2>
          {caisse.description && <p className="text-sm text-muted-foreground">{caisse.description}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{isFr ? 'Ajouter article' : 'إضافة عنصر'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isFr ? 'Ajouter un article à la caisse' : 'إضافة عنصر للصندوق'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder={isFr ? 'Rechercher un article...' : 'بحث عن عنصر...'} value={addSearch} onChange={e => setAddSearch(e.target.value)} />
              </div>
              <Select value={addProductId} onValueChange={setAddProductId}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Choisir l\'article' : 'اختر العنصر'} /></SelectTrigger>
                <SelectContent>
                  {filteredProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.designation} ({isFr ? 'Stock' : 'مخزون'}: {p.quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" min={1} value={addQty} onChange={e => setAddQty(Number(e.target.value))} placeholder={isFr ? 'Quantité' : 'الكمية'} />
              <Select value={addPerson} onValueChange={setAddPerson}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Responsable' : 'المسؤول'} /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map(e => (
                    <SelectItem key={e.id} value={e.full_name}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} className="w-full">{isFr ? 'Ajouter (déduit du stock)' : 'إضافة (خصم من المخزن)'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5"><Minus className="h-4 w-4" />{isFr ? 'Retirer article' : 'إزالة عنصر'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isFr ? 'Retirer un article' : 'إزالة عنصر'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={removeProductId} onValueChange={setRemoveProductId}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Choisir l\'article' : 'اختر العنصر'} /></SelectTrigger>
                <SelectContent>
                  {items.map(i => (
                    <SelectItem key={i.product_id} value={i.product_id}>{getProductName(i.product_id)} (x{i.quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" min={1} value={removeQty} onChange={e => setRemoveQty(Number(e.target.value))} />
              <Select value={removePerson} onValueChange={setRemovePerson}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Responsable' : 'المسؤول'} /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map(e => (
                    <SelectItem key={e.id} value={e.full_name}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={returnToStock} onChange={e => setReturnToStock(e.target.checked)} className="rounded" />
                {isFr ? 'Retourner au stock principal' : 'إرجاع للمخزن الرئيسي'}
              </label>
              <Button onClick={handleRemove} className="w-full">{isFr ? 'Retirer' : 'إزالة'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={damageOpen} onOpenChange={setDamageOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"><AlertTriangle className="h-4 w-4" />{isFr ? 'Signaler dommage' : 'إبلاغ عن تلف'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{isFr ? 'Signaler un dommage' : 'إبلاغ عن تلف'}</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Select value={damageProductId} onValueChange={setDamageProductId}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Article endommagé' : 'العنصر التالف'} /></SelectTrigger>
                <SelectContent>
                  {items.map(i => (
                    <SelectItem key={i.product_id} value={i.product_id}>{getProductName(i.product_id)} (x{i.quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" min={1} value={damageQty} onChange={e => setDamageQty(Number(e.target.value))} placeholder={isFr ? 'Quantité endommagée' : 'الكمية التالفة'} />
              <Select value={damagePerson} onValueChange={setDamagePerson}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Responsable (obligatoire)' : 'المسؤول (إلزامي)'} /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map(e => (
                    <SelectItem key={e.id} value={e.full_name}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea value={damageReason} onChange={e => setDamageReason(e.target.value)} placeholder={isFr ? 'Raison du dommage (obligatoire)' : 'سبب التلف (إلزامي)'} />
              <Select value={damageDestination} onValueChange={v => setDamageDestination(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">{isFr ? 'Maintenance' : 'الصيانة'}</SelectItem>
                  <SelectItem value="stock">{isFr ? 'Retour au stock' : 'إرجاع للمخزن'}</SelectItem>
                </SelectContent>
              </Select>
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">{isFr ? 'Remplacement (optionnel)' : 'استبدال (اختياري)'}</p>
                <Select value={replaceProductId} onValueChange={setReplaceProductId}>
                  <SelectTrigger><SelectValue placeholder={isFr ? 'Article de remplacement' : 'عنصر بديل'} /></SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.quantity > 0).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.designation} ({isFr ? 'Stock' : 'مخزون'}: {p.quantity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {replaceProductId && <Input type="number" min={1} value={replaceQty} onChange={e => setReplaceQty(Number(e.target.value))} />}
              </div>
              <Button onClick={handleDamage} className="w-full" variant="destructive">{isFr ? 'Enregistrer le dommage' : 'تسجيل التلف'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={initOpen} onOpenChange={setInitOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5"><Settings2 className="h-4 w-4" />{isFr ? 'Initialiser' : 'تهيئة'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{isFr ? 'Initialisation manuelle de la caisse' : 'تهيئة الصندوق يدوياً'}</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">{isFr ? 'Définissez le contenu actuel sans déduire du stock (pour les caisses existantes)' : 'حدد المحتوى الحالي دون خصم من المخزن (للصناديق الموجودة مسبقاً)'}</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder={isFr ? 'Rechercher...' : 'بحث...'} value={initSearch} onChange={e => setInitSearch(e.target.value)} />
              </div>
              {initItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select value={item.product_id} onValueChange={v => { const copy = [...initItems]; copy[idx].product_id = v; setInitItems(copy); }}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={isFr ? 'Article' : 'عنصر'} /></SelectTrigger>
                    <SelectContent>
                      {filteredInitProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.designation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} className="w-20" value={item.quantity} onChange={e => { const copy = [...initItems]; copy[idx].quantity = Number(e.target.value); setInitItems(copy); }} />
                  {initItems.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => setInitItems(initItems.filter((_, i) => i !== idx))}>×</Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setInitItems([...initItems, { product_id: '', quantity: 1 }])} className="w-full gap-1">
                <Plus className="h-3 w-3" />{isFr ? 'Ajouter un article' : 'إضافة عنصر'}
              </Button>
              <Select value={initPerson} onValueChange={setInitPerson}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Responsable' : 'المسؤول'} /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map(e => (
                    <SelectItem key={e.id} value={e.full_name}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleInit} className="w-full">{isFr ? 'Initialiser la caisse' : 'تهيئة الصندوق'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items" className="gap-1.5"><Package className="h-4 w-4" />{isFr ? 'Contenu' : 'المحتوى'}</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-4 w-4" />{isFr ? 'Historique' : 'السجل'}</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isFr ? 'Articles dans la caisse' : 'عناصر الصندوق'} ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{isFr ? 'Caisse vide' : 'صندوق فارغ'}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isFr ? 'Article' : 'العنصر'}</TableHead>
                      <TableHead>{isFr ? 'Catégorie' : 'الفئة'}</TableHead>
                      <TableHead>{isFr ? 'Quantité' : 'الكمية'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => {
                      const product = products.find(p => p.id === item.product_id);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{product?.designation || '—'}</TableCell>
                          <TableCell><Badge variant="outline">{product?.type || '—'}</Badge></TableCell>
                          <TableCell>{item.quantity}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{isFr ? 'Historique des mouvements' : 'سجل الحركات'}</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 h-8 text-xs" placeholder={isFr ? 'Rechercher...' : 'بحث...'} value={movSearch} onChange={e => setMovSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{isFr ? 'Aucun mouvement' : 'لا توجد حركات'}</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredMovements.map(m => (
                    <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <Badge className={`${getMovementColor(m.type)} text-xs shrink-0`}>{getMovementLabel(m.type)}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{getProductName(m.product_id)} × {m.quantity}</p>
                        {m.responsible_person && <p className="text-xs text-muted-foreground">{isFr ? 'Par' : 'بواسطة'}: {m.responsible_person}</p>}
                        {m.reason && <p className="text-xs text-muted-foreground">{isFr ? 'Raison' : 'السبب'}: {m.reason}</p>}
                        {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(m.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'ar-SA')} {new Date(m.created_at).toLocaleTimeString(isFr ? 'fr-FR' : 'ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaisseDetail;
