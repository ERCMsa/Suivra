import { useState } from 'react';
import Header from '@/components/Header';
import { useSuppliers, type Supplier, type SupplierInput } from '@/hooks/useSuppliers';
import { useInventory } from '@/hooks/useInventory';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Building2, Plus, Trash2, Edit2, Phone, MessageCircle, Star, ChevronRight,
  Package, X, ArrowLeft, FolderOpen, Users, Mail, MapPin, UserMinus, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import SupplierAvatar from '@/components/SupplierAvatar';
import SupplierCategories from '@/components/SupplierCategories';
import AddSupplierToCategoryDialog from '@/components/AddSupplierToCategoryDialog';
import SupplierForm, { type SupplierFormValue } from '@/components/SupplierForm';
import { categorySupplierIds, supplierMatchesSearch } from '@/lib/supplierCategories';

const WhatsAppLink = (number: string, name: string) => {
  const message = encodeURIComponent(`Bonjour, ${name}`);
  window.open(`https://wa.me/${number.replace(/[^0-9+]/g, '')}?text=${message}`, '_blank');
};

const Suppliers = () => {
  const { t, lang } = useLanguage();
  const {
    suppliers, categories, categoryLinks, fetchSuppliers, supplierProducts, isLoading,
    getProductsForSupplier, addSupplier, updateSupplier, deleteSupplier,
    linkSuppliersToCategory, unlinkSupplierFromCategory,
    linkSupplierToProduct, unlinkSupplierFromProduct, markSupplierUsed,
  } = useSuppliers();
  const { products } = useInventory();
  const { canViewPurchases: canManage, isAdmin } = usePermissions();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignProductIds, setAssignProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const labels = lang === 'fr' ? {
    title: 'Fournisseurs',
    subtitle: 'Organisez vos fournisseurs par catégories',
    add: 'Ajouter un fournisseur',
    addToCategory: 'Ajouter un fournisseur à cette catégorie',
    name: 'Nom',
    phone: 'Téléphone',
    email: 'Email',
    address: 'Adresse',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer définitivement',
    edit: 'Modifier',
    whatsapp: 'WhatsApp',
    recommended: 'Recommandé',
    products: 'Produits fournis',
    noProducts: 'Aucun produit associé',
    addProduct: 'Ajouter un produit',
    search: 'Rechercher un fournisseur…',
    noSuppliers: 'Aucun fournisseur dans cette catégorie',
    noSuppliersDesc: 'Ajoutez un fournisseur existant ou créez une nouvelle fiche.',
    confirmDelete: 'Supprimer définitivement ce fournisseur ?',
    deleteDescription: 'La fiche centrale, ses contacts et toutes ses associations seront supprimés. Cette action est irréversible.',
    removeFromCategory: 'Retirer de la catégorie',
    confirmUnlink: 'Retirer ce fournisseur de la catégorie ?',
    unlinkDescription: 'Seule l’association avec cette catégorie sera supprimée. La fiche fournisseur et ses autres catégories restent intactes.',
    noPhone: 'Pas de téléphone',
    unlink: 'Retirer le produit',
    contacts: 'Contacts commerciaux',
    noContacts: 'Aucun contact commercial',
    categories: 'catégories',
  } : {
    title: 'الموردون',
    subtitle: 'نظّم مورديك حسب الفئات',
    add: 'إضافة مورد',
    addToCategory: 'إضافة مورد إلى هذه الفئة',
    name: 'الاسم',
    phone: 'الهاتف',
    email: 'البريد',
    address: 'العنوان',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف نهائي',
    edit: 'تعديل',
    whatsapp: 'واتساب',
    recommended: 'موصى به',
    products: 'المنتجات الموردة',
    noProducts: 'لا توجد منتجات مرتبطة',
    addProduct: 'إضافة منتج',
    search: 'البحث عن مورد…',
    noSuppliers: 'لا يوجد موردون في هذه الفئة',
    noSuppliersDesc: 'أضف مورداً موجوداً أو أنشئ بطاقة جديدة.',
    confirmDelete: 'حذف هذا المورد نهائياً؟',
    deleteDescription: 'سيتم حذف البطاقة المركزية وجهات الاتصال وجميع الارتباطات. لا يمكن التراجع عن هذا الإجراء.',
    removeFromCategory: 'إزالة من الفئة',
    confirmUnlink: 'إزالة هذا المورد من الفئة؟',
    unlinkDescription: 'سيتم حذف الارتباط بهذه الفئة فقط. تبقى بطاقة المورد وفئاته الأخرى كما هي.',
    noPhone: 'لا يوجد رقم',
    unlink: 'إزالة المنتج',
    contacts: 'جهات الاتصال التجارية',
    noContacts: 'لا توجد جهات اتصال تجارية',
    categories: 'فئات',
  };

  const openAdd = () => setAddOpen(true);

  const handleCreateNew = async (data: SupplierInput) => {
    if (!selectedCategory) return false;
    return addSupplier({ ...data, category_ids: [selectedCategory.id] });
  };

  const handleLinkExisting = async (supplierIds: string[]) => {
    if (!selectedCategory) return false;
    return linkSuppliersToCategory(supplierIds, selectedCategory.id);
  };

  const handleSaveEdit = async (value: SupplierFormValue) => {
    if (!editing) return false;
    const ok = await updateSupplier(editing.id, value);
    if (ok) {
      toast.success(lang === 'fr' ? 'Fournisseur modifié' : 'تم التعديل');
      setEditing(null);
    }
    return ok;
  };

  const handleUnlinkFromCategory = async (supplier: Supplier) => {
    if (!selectedCategory) return;
    const ok = await unlinkSupplierFromCategory(supplier.id, selectedCategory.id);
    if (ok) toast.success(lang === 'fr'
      ? `${supplier.name} retiré de la catégorie`
      : `تمت إزالة ${supplier.name} من الفئة`);
  };

  const handleDelete = async (supplier: Supplier) => {
    const ok = await deleteSupplier(supplier.id);
    if (ok) toast.success(lang === 'fr' ? 'Fournisseur supprimé définitivement' : 'تم حذف المورد نهائياً');
  };

  const handleAssign = async (supplierId: string) => {
    if (assignProductIds.length === 0) return;
    let added = 0;
    for (const pid of assignProductIds) {
      const already = supplierProducts.some(sp => sp.supplier_id === supplierId && sp.product_id === pid);
      if (already) continue;
      const ok = await linkSupplierToProduct(supplierId, pid);
      if (ok) {
        await markSupplierUsed(supplierId, pid);
        added++;
      }
    }
    toast.success(
      lang === 'fr'
        ? `${added} produit(s) ajouté(s)`
        : `تمت إضافة ${added} منتج`,
    );
    setAssigningId(null);
    setAssignProductIds([]);
    setProductSearch('');
    setExpandedId(supplierId);
  };

  const toggleProductSelection = (pid: string) => {
    setAssignProductIds(prev =>
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid],
    );
  };

  const handleUnlinkProduct = async (supplierId: string, productId: string) => {
    const ok = await unlinkSupplierFromProduct(supplierId, productId);
    if (ok) toast.success(lang === 'fr' ? 'Lien retiré' : 'تم الفصل');
  };

  const getSupplierItems = (supplierId: string) => {
    const ids = getProductsForSupplier(supplierId);
    return ids.map(pid => products.find(p => p.id === pid)).filter(Boolean) as typeof products;
  };

  const toFormValue = (supplier: Supplier): SupplierFormValue => ({
    name: supplier.name,
    image_url: supplier.image_url || '',
    phone: supplier.phone || '',
    whatsapp: supplier.whatsapp || '',
    email: supplier.email || '',
    address: supplier.address || '',
    wilaya: supplier.wilaya || '',
    commune: supplier.commune || '',
    notes: supplier.notes || '',
    contacts: supplier.contacts.map(contact => ({
      name: contact.name,
      role: contact.role || '',
      phone: contact.phone || '',
      whatsapp: contact.whatsapp || '',
      email: contact.email || '',
    })),
    product_ids: getProductsForSupplier(supplier.id),
  });

  const selectedCategory = categories.find(c => c.id === activeCategory);
  const categoryLinkedIds = selectedCategory
    ? new Set(categorySupplierIds(categoryLinks, selectedCategory.id))
    : new Set<string>();
  const categorySuppliers = suppliers.filter(supplier => categoryLinkedIds.has(supplier.id));
  const filtered = categorySuppliers.filter(supplier => supplierMatchesSearch(supplier, search));
  const categorySupplierCount = categorySuppliers.length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {labels.title}
          </h2>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>

        {!selectedCategory ? (
          <SupplierCategories
            categories={categories}
            links={categoryLinks}
            refresh={fetchSuppliers}
            onConsult={id => {
              setActiveCategory(id);
              setSearch('');
              requestAnimationFrame(() => document.getElementById('supplier-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }}
          />
        ) : (
          <section id="supplier-list" className="space-y-4">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => { setActiveCategory(null); setSearch(''); }}>
              <ArrowLeft className="h-4 w-4" />{lang === 'fr' ? 'Toutes les catégories' : 'كل الفئات'}
            </Button>

            <Card className="rounded-2xl overflow-hidden">
              {selectedCategory.image_url
                ? <img src={selectedCategory.image_url} alt={selectedCategory.name} className="w-full aspect-[21/9] object-cover" />
                : <div className="aspect-[21/9] bg-muted flex items-center justify-center"><FolderOpen className="h-12 w-12 text-muted-foreground" /></div>}
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold break-words">{selectedCategory.name}</h2>
                    {selectedCategory.description && <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap mt-1">{selectedCategory.description}</p>}
                  </div>
                  {canManage && (
                    <Button className="gap-2 shrink-0" onClick={openAdd}>
                      <Plus className="h-4 w-4" />{labels.add}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0" />
                  {categorySupplierCount} {lang === 'fr' ? (categorySupplierCount === 1 ? 'fournisseur associé' : 'fournisseurs associés') : 'مورد مرتبط'}
                </p>
              </CardContent>
            </Card>

            <Input
              placeholder={labels.search}
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="max-w-sm"
            />

            {filtered.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{labels.noSuppliers}</p>
                  <p className="text-sm">{labels.noSuppliersDesc}</p>
                  {canManage && (
                    <Button className="mt-4 gap-2" onClick={openAdd}>
                      <Plus className="h-4 w-4" />{labels.add}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(supplier => (
                  <Card key={supplier.id} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <SupplierAvatar
                            name={supplier.name}
                            imageUrl={supplier.image_url}
                            phone={supplier.phone}
                            whatsapp={supplier.whatsapp}
                            category={supplier.category}
                            address={[supplier.address, supplier.commune, supplier.wilaya].filter(Boolean).join(', ')}
                            size="md"
                            interactive={false}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm break-words">{supplier.name}</span>
                              {supplier.is_recommended && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 text-amber-600 border-amber-200">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  {labels.recommended}
                                </Badge>
                              )}
                            </div>
                            {supplier.category && <span className="text-xs text-muted-foreground block break-words">{supplier.category}</span>}
                            {supplier.email && <span className="text-xs text-muted-foreground block truncate">{supplier.email}</span>}
                            {supplier.address && <span className="text-xs text-muted-foreground block truncate">{supplier.address}</span>}
                            {(supplier.wilaya || supplier.commune) && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {[supplier.commune, supplier.wilaya].filter(Boolean).join(', ')}
                              </span>
                            )}
                            {supplier.notes && (
                              <span className="text-xs text-muted-foreground block whitespace-pre-wrap break-words mt-1">{supplier.notes}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {supplier.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 gap-2 text-xs"
                            onClick={() => window.open(`tel:${supplier.phone}`, '_self')}
                          >
                            <Phone className="h-3.5 w-3.5 text-blue-500" />
                            {supplier.phone}
                          </Button>
                        )}
                        {(supplier.whatsapp || supplier.phone) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            onClick={() => WhatsAppLink(supplier.whatsapp || supplier.phone || '', supplier.name)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {labels.whatsapp}
                          </Button>
                        )}
                        {supplier.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2 text-xs"
                            onClick={() => window.open(`mailto:${supplier.email}`, '_self')}
                          >
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            {labels.email}
                          </Button>
                        )}
                        {!supplier.phone && !supplier.whatsapp && !supplier.email && (
                          <p className="text-xs text-muted-foreground italic">{labels.noPhone}</p>
                        )}
                      </div>

                      {supplier.contacts.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <UserRound className="h-3 w-3" />{labels.contacts}
                          </p>
                          {supplier.contacts.map(contact => (
                            <div key={contact.id} className="rounded-lg bg-muted/40 p-2 flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">
                                  {contact.name || (lang === 'fr' ? 'Contact' : 'جهة اتصال')}
                                  {contact.role && <span className="font-normal text-muted-foreground"> · {contact.role}</span>}
                                </p>
                                {contact.email && <p className="text-[10px] text-muted-foreground truncate">{contact.email}</p>}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {contact.phone && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={contact.phone} onClick={() => window.open(`tel:${contact.phone}`, '_self')}>
                                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                                  </Button>
                                )}
                                {(contact.whatsapp || contact.phone) && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600" title="WhatsApp" onClick={() => WhatsAppLink(contact.whatsapp || contact.phone || '', contact.name || supplier.name)}>
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {contact.email && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={contact.email} onClick={() => window.open(`mailto:${contact.email}`, '_self')}>
                                    <Mail className="h-3.5 w-3.5 text-primary" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs gap-1"
                            onClick={() => {
                              const opening = assigningId !== supplier.id;
                              setAssigningId(opening ? supplier.id : null);
                              setAssignProductIds([]);
                              setProductSearch('');
                              if (opening) setExpandedId(null);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            {labels.addProduct}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-7 text-xs gap-1"
                          onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
                        >
                          <Package className="h-3 w-3" />
                          {labels.products} ({getSupplierItems(supplier.id).length})
                          <ChevronRight className={`h-3 w-3 transition-transform ${expandedId === supplier.id ? 'rotate-90' : ''}`} />
                        </Button>
                      </div>

                      {assigningId === supplier.id && (() => {
                        const linkedSet = new Set(getProductsForSupplier(supplier.id));
                        const available = products.filter(p => !linkedSet.has(p.id));
                        const filteredProducts = available.filter(p =>
                          !productSearch ||
                          p.designation.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.type || '').toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.brand || '').toLowerCase().includes(productSearch.toLowerCase()),
                        );
                        return (
                          <div className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-2">
                            <Input
                              placeholder={lang === 'fr' ? 'Rechercher un produit…' : 'البحث عن منتج…'}
                              value={productSearch}
                              onChange={event => setProductSearch(event.target.value)}
                              className="h-8 text-xs"
                            />
                            <div className="max-h-56 overflow-y-auto space-y-1 rounded-md bg-background p-1 border">
                              {filteredProducts.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground text-center py-3">
                                  {lang === 'fr' ? 'Aucun produit disponible' : 'لا توجد منتجات متاحة'}
                                </p>
                              ) : filteredProducts.map(p => {
                                const checked = assignProductIds.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors ${checked ? 'bg-primary/10' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleProductSelection(p.id)}
                                      className="h-3.5 w-3.5 accent-primary"
                                    />
                                    {p.image_url ? (
                                      <img src={p.image_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded bg-muted flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-medium truncate block">{p.designation}</span>
                                      <span className="text-[10px] text-muted-foreground">{p.type}{p.brand ? ` · ${p.brand}` : ''}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                {assignProductIds.length} {lang === 'fr' ? 'sélectionné(s)' : 'محدد'}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs"
                                  disabled={assignProductIds.length === 0}
                                  onClick={() => handleAssign(supplier.id)}
                                >
                                  {lang === 'fr' ? `Ajouter (${assignProductIds.length})` : `إضافة (${assignProductIds.length})`}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAssigningId(null); setAssignProductIds([]); setProductSearch(''); }}>
                                  {labels.cancel}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {expandedId === supplier.id && (
                        <div className="mt-2 space-y-1.5 border-t pt-2">
                          {getSupplierItems(supplier.id).length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">{labels.noProducts}</p>
                          ) : (
                            getSupplierItems(supplier.id).map(product => (
                              <div key={product.id} className="p-2 rounded-lg bg-muted/40 flex items-center gap-2">
                                {product.image_url ? (
                                  <img src={product.image_url} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-muted flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium truncate block">{product.designation}</span>
                                  <span className="text-[10px] text-muted-foreground">{product.type}</span>
                                </div>
                                {canManage && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-destructive"
                                    onClick={() => handleUnlinkProduct(supplier.id, product.id)}
                                    title={labels.unlink}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {(canManage || isAdmin) && (
                        <div className="flex flex-wrap gap-1.5 border-t pt-2">
                          {canManage && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditing(supplier)}>
                              <Edit2 className="h-3 w-3" />{labels.edit}
                            </Button>
                          )}
                          {canManage && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                  <UserMinus className="h-3 w-3" />{labels.removeFromCategory}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{labels.confirmUnlink}</AlertDialogTitle>
                                  <AlertDialogDescription>{labels.unlinkDescription}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUnlinkFromCategory(supplier)}>
                                    {labels.removeFromCategory}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto">
                                  <Trash2 className="h-3 w-3" />{labels.delete}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <span className="block font-medium text-foreground mb-1">{labels.confirmDelete}</span>
                                    {labels.deleteDescription}
                                    {supplier.category_ids.length > 1 && (
                                      <span className="block mt-2">
                                        {lang === 'fr'
                                          ? `Ce fournisseur est associé à ${supplier.category_ids.length} catégories.`
                                          : `هذا المورد مرتبط بـ ${supplier.category_ids.length} فئات.`}
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(supplier)}
                                  >
                                    {labels.delete}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedCategory && (
          <AddSupplierToCategoryDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            category={selectedCategory}
            categories={categories}
            suppliers={suppliers}
            links={categoryLinks}
            products={products}
            onLinkExisting={handleLinkExisting}
            onCreateNew={handleCreateNew}
          />
        )}

        <Dialog open={!!editing} onOpenChange={value => { if (!value) setEditing(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{lang === 'fr' ? 'Modifier le fournisseur' : 'تعديل المورد'}</DialogTitle>
              <DialogDescription>{editing?.name}</DialogDescription>
            </DialogHeader>
            {editing && (
              <SupplierForm
                key={editing.id}
                initial={toFormValue(editing)}
                products={products}
                submitLabel={labels.save}
                onSubmit={handleSaveEdit}
                onCancel={() => setEditing(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Suppliers;
