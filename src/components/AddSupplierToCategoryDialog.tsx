import { useEffect, useMemo, useState } from 'react';
import { Building2, FolderPlus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import SupplierAvatar from '@/components/SupplierAvatar';
import SupplierForm, { type SupplierFormValue } from '@/components/SupplierForm';
import { useLanguage } from '@/hooks/useLanguage';
import type { Supplier, SupplierCategory, SupplierInput } from '@/hooks/useSuppliers';
import type { Product } from '@/hooks/useInventory';
import { filterSuppliersForLinking, type CategoryLink } from '@/lib/supplierCategories';
import { toast } from 'sonner';

interface AddSupplierToCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SupplierCategory | null;
  categories: SupplierCategory[];
  suppliers: Supplier[];
  links: CategoryLink[];
  products: Product[];
  onLinkExisting: (supplierIds: string[]) => Promise<boolean>;
  onCreateNew: (data: SupplierInput) => Promise<boolean>;
}

const AddSupplierToCategoryDialog = ({
  open,
  onOpenChange,
  category,
  categories,
  suppliers,
  links,
  products,
  onLinkExisting,
  onCreateNew,
}: AddSupplierToCategoryDialogProps) => {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState('existing');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setFilter('all');
    setSelected([]);
    setTab('existing');
    setBusy(false);
  }, [open, category?.id]);

  const available = useMemo(() => {
    if (!category) return [];
    return filterSuppliersForLinking(suppliers, links, category.id, search, filter);
  }, [category, suppliers, links, search, filter]);

  const allVisibleSelected = available.length > 0 && available.every(supplier => selected.includes(supplier.id));

  const toggleSelected = (supplierId: string) => {
    setSelected(current => current.includes(supplierId)
      ? current.filter(id => id !== supplierId)
      : [...current, supplierId]);
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(available.map(supplier => supplier.id));
      setSelected(current => current.filter(id => !visibleIds.has(id)));
    } else {
      setSelected(current => [...new Set([...current, ...available.map(supplier => supplier.id)])]);
    }
  };

  const confirmExisting = async () => {
    if (!category || selected.length === 0 || busy) return;
    setBusy(true);
    const ok = await onLinkExisting(selected);
    setBusy(false);
    if (ok) {
      toast.success(fr
        ? `${selected.length} fournisseur(s) ajouté(s) à ${category.name}`
        : `تمت إضافة ${selected.length} مورد إلى ${category.name}`);
      onOpenChange(false);
    }
  };

  const createNew = async (value: SupplierFormValue) => {
    if (!category || busy) return false;
    const duplicate = suppliers.find(
      supplier => supplier.name.trim().toLowerCase() === value.name.trim().toLowerCase(),
    );
    if (duplicate) {
      toast.error(fr
        ? 'Un fournisseur porte déjà ce nom. Utilisez l’onglet « Fournisseur existant » pour le réutiliser.'
        : 'يوجد مورد بهذا الاسم بالفعل. استخدم علامة التبويب «مورد موجود» لإعادة استخدامه.');
      return false;
    }
    setBusy(true);
    const ok = await onCreateNew({
      name: value.name,
      image_url: value.image_url,
      phone: value.phone,
      whatsapp: value.whatsapp,
      email: value.email,
      address: value.address,
      wilaya: value.wilaya,
      commune: value.commune,
      notes: value.notes,
      contacts: value.contacts,
      product_ids: value.product_ids,
      category_ids: [category.id],
    });
    setBusy(false);
    if (ok) {
      toast.success(fr
        ? `Fournisseur créé et ajouté à ${category.name}`
        : `تم إنشاء المورد وإضافته إلى ${category.name}`);
      onOpenChange(false);
    }
    return ok;
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            {fr ? 'Ajouter un fournisseur' : 'إضافة مورد'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? (fr ? `Catégorie : ${category.name}` : `الفئة: ${category.name}`)
              : (fr ? 'Choisissez une catégorie' : 'اختر فئة')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">{fr ? 'Fournisseur existant' : 'مورد موجود'}</TabsTrigger>
            <TabsTrigger value="new">{fr ? 'Nouveau fournisseur' : 'مورد جديد'}</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {fr
                ? "Sélectionnez une ou plusieurs fiches de la base centrale. Aucun doublon ne sera créé."
                : 'اختر بطاقة أو أكثر من القاعدة المركزية. لن يتم إنشاء أي تكرار.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={fr ? 'Rechercher par nom, téléphone, e-mail…' : 'البحث بالاسم أو الهاتف أو البريد…'}
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{fr ? 'Tous les fournisseurs' : 'كل الموردين'}</SelectItem>
                  <SelectItem value="uncategorized">{fr ? 'Sans catégorie' : 'بدون فئة'}</SelectItem>
                  {categories.filter(item => item.id !== category?.id).map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {available.length} {fr ? (available.length === 1 ? 'fournisseur disponible' : 'fournisseurs disponibles') : 'مورد متاح'}
              </p>
              {available.length > 0 && (
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={toggleAllVisible}>
                  {allVisibleSelected
                    ? (fr ? 'Tout désélectionner' : 'إلغاء تحديد الكل')
                    : (fr ? 'Tout sélectionner' : 'تحديد الكل')}
                </Button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border divide-y">
              {available.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">
                    {fr ? 'Aucun fournisseur à associer' : 'لا يوجد موردون لإضافتهم'}
                  </p>
                  <p className="text-xs mt-1">
                    {fr
                      ? 'Tous les fournisseurs correspondent déjà, ou utilisez l’onglet « Nouveau fournisseur ».'
                      : 'جميع الموردين مرتبطون بالفعل، أو استخدم علامة التبويب «مورد جديد».'}
                  </p>
                </div>
              ) : available.map(supplier => {
                const checked = selected.includes(supplier.id);
                return (
                  <label
                    key={supplier.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${checked ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleSelected(supplier.id)} />
                    <SupplierAvatar
                      name={supplier.name}
                      imageUrl={supplier.image_url}
                      size="sm"
                      interactive={false}
                      showTooltip={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[supplier.phone, supplier.email, supplier.category].filter(Boolean).join(' · ') || (fr ? 'Aucune coordonnée' : 'لا توجد بيانات اتصال')}
                      </p>
                    </div>
                    {supplier.category && (
                      <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] max-w-32 truncate">
                        {supplier.category}
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {selected.length} {fr ? 'sélectionné(s)' : 'محدد'}
              </span>
              <Button onClick={confirmExisting} disabled={selected.length === 0 || busy} className="gap-2">
                {busy ? '…' : (fr ? `Associer (${selected.length})` : `ربط (${selected.length})`)}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="new">
            <SupplierForm
              key={category?.id || 'new'}
              products={products}
              submitLabel={fr ? 'Créer et associer' : 'إنشاء وربط'}
              busy={busy}
              onSubmit={createNew}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierToCategoryDialog;
