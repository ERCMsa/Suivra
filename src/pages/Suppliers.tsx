import { useState } from 'react';
import Header from '@/components/Header';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useInventory } from '@/hooks/useInventory';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Building2, Plus, Trash2, Edit2, Phone, MessageCircle, Star, ChevronRight, Package, X,
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import SupplierAvatar from '@/components/SupplierAvatar';
import { useLanguage as useLang } from '@/hooks/useLanguage';

const Suppliers = () => {
  const { t, lang } = useLanguage();
  const { suppliers, supplierProducts, isLoading, getProductsForSupplier, addSupplier, updateSupplier, deleteSupplier, linkSupplierToProduct, unlinkSupplierFromProduct, markSupplierUsed } = useSuppliers();
  const { products } = useInventory();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', category: '', phone: '', email: '', address: '', image_url: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', category: '', phone: '', email: '', address: '', notes: '', image_url: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignProductId, setAssignProductId] = useState('');

  const labels = lang === 'fr' ? {
    title: 'Fournisseurs',
    subtitle: 'Gérer les fournisseurs et leurs produits',
    add: 'Ajouter un fournisseur',
    name: 'Nom',
    category: 'Catégorie',
    phone: 'Téléphone',
    email: 'Email',
    address: 'Adresse',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    whatsapp: 'WhatsApp',
    recommended: 'Recommandé',
    products: 'Produits fournis',
    noProducts: 'Aucun produit associé',
    addProduct: 'Ajouter un produit',
    chooseProduct: 'Choisir un produit',
    search: 'Rechercher...',
    noSuppliers: 'Aucun fournisseur',
    noSuppliersDesc: 'Ajoutez votre premier fournisseur',
    confirmDelete: 'Supprimer ce fournisseur ?',
    noPhone: 'Pas de téléphone',
    unlink: 'Retirer',
  } : {
    title: 'الموردون',
    subtitle: 'إدارة الموردين والمنتجات التي يبيعونها',
    add: 'إضافة مورد',
    name: 'الاسم',
    category: 'الفئة',
    phone: 'الهاتف',
    email: 'البريد',
    address: 'العنوان',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    whatsapp: 'واتساب',
    recommended: 'موصى به',
    products: 'المنتجات الموردة',
    noProducts: 'لا توجد منتجات مرتبطة',
    addProduct: 'إضافة منتج',
    chooseProduct: 'اختر منتجاً',
    search: 'بحث...',
    noSuppliers: 'لا يوجد موردون',
    noSuppliersDesc: 'أضف أول مورد',
    confirmDelete: 'حذف هذا المورد؟',
    noPhone: 'لا يوجد رقم',
    unlink: 'فصل',
  };

  const handleAdd = async () => {
    if (!newSupplier.name) return;
    const ok = await addSupplier(newSupplier);
    if (ok) {
      toast.success(lang === 'fr' ? 'Fournisseur ajouté' : 'تمت إضافة المورد');
      setNewSupplier({ name: '', category: '', phone: '', email: '', address: '', image_url: '' });
      setAddOpen(false);
    }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setEditData({
      name: s.name, category: s.category || '', phone: s.phone || '',
      email: s.email || '', address: s.address || '', notes: s.notes || '',
      image_url: s.image_url || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const ok = await updateSupplier(editingId, editData);
    if (ok) {
      toast.success(lang === 'fr' ? 'Fournisseur modifié' : 'تم التعديل');
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteSupplier(id);
    if (ok) toast.success(lang === 'fr' ? 'Fournisseur supprimé' : 'تم الحذف');
  };

  const handleAssign = async (supplierId: string) => {
    if (!assignProductId) return;
    const already = supplierProducts.some(sp => sp.supplier_id === supplierId && sp.product_id === assignProductId);
    if (already) {
      toast.info(lang === 'fr' ? 'Déjà lié' : 'مرتبط مسبقاً');
      setAssigningId(null);
      setAssignProductId('');
      return;
    }
    const ok = await linkSupplierToProduct(supplierId, assignProductId);
    if (ok) {
      await markSupplierUsed(supplierId, assignProductId);
      toast.success(lang === 'fr' ? 'Produit ajouté' : 'تمت إضافة المنتج');
      setAssigningId(null);
      setAssignProductId('');
      setExpandedId(supplierId);
    }
  };

  const handleUnlink = async (supplierId: string, productId: string) => {
    const ok = await unlinkSupplierFromProduct(supplierId, productId);
    if (ok) toast.success(lang === 'fr' ? 'Lien retiré' : 'تم الفصل');
  };

  const getSupplierItems = (supplierId: string) => {
    const ids = getProductsForSupplier(supplierId);
    return ids.map(pid => products.find(p => p.id === pid)).filter(Boolean) as typeof products;
  };

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Title + Add */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {labels.title}
            </h2>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />{labels.add}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{labels.add}</DialogTitle>
                <DialogDescription>{lang === 'fr' ? 'Informations du fournisseur' : 'بيانات المورد'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <SupplierAvatar
                    name={newSupplier.name || '?'}
                    imageUrl={newSupplier.image_url}
                    size="lg"
                    interactive={false}
                    showTooltip={false}
                  />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {lang === 'fr' ? 'Photo (optionnelle)' : 'صورة (اختيارية)'}
                    </p>
                    <ImageUpload
                      currentUrl={newSupplier.image_url}
                      onUploaded={(url) => setNewSupplier({ ...newSupplier, image_url: url })}
                      folder="suppliers"
                    />
                  </div>
                </div>
                <Input placeholder={labels.name} value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                <Input placeholder={labels.category} value={newSupplier.category} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })} />
                <Input placeholder={labels.phone} value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                <Input placeholder={labels.email} value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                <Input placeholder={labels.address} value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                <Button onClick={handleAdd} className="w-full">{labels.add}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Input
          placeholder={labels.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm mb-4"
        />

        {/* Suppliers List */}
        {filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{labels.noSuppliers}</p>
              <p className="text-sm">{labels.noSuppliersDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(supplier => (
              <Card key={supplier.id} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {editingId === supplier.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <SupplierAvatar
                          name={editData.name || supplier.name}
                          imageUrl={editData.image_url}
                          size="lg"
                          interactive={false}
                          showTooltip={false}
                        />
                        <ImageUpload
                          currentUrl={editData.image_url}
                          onUploaded={(url) => setEditData({ ...editData, image_url: url })}
                          folder="suppliers"
                        />
                      </div>
                      <Input placeholder={labels.name} value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-8 text-sm" />
                      <Input placeholder={labels.category} value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} className="h-8 text-sm" />
                      <Input placeholder={labels.phone} value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-8 text-sm" />
                      <Input placeholder={labels.email} value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="h-8 text-sm" />
                      <Input placeholder={labels.address} value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} className="h-8 text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 flex-1 text-xs" onClick={handleSaveEdit}>{labels.save}</Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingId(null)}>{labels.cancel}</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <SupplierAvatar
                            name={supplier.name}
                            imageUrl={supplier.image_url}
                            phone={supplier.phone}
                            category={supplier.category}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{supplier.name}</span>
                              {supplier.is_recommended && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 text-amber-600 border-amber-200">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  {labels.recommended}
                                </Badge>
                              )}
                            </div>
                            {supplier.category && <span className="text-xs text-muted-foreground block">{supplier.category}</span>}
                            {supplier.email && <span className="text-xs text-muted-foreground block truncate">{supplier.email}</span>}
                            {supplier.address && <span className="text-xs text-muted-foreground block truncate">{supplier.address}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(supplier)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                                <AlertDialogDescription>{labels.confirmDelete}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(supplier.id)}>{labels.delete}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {supplier.phone ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 gap-2 text-xs"
                            onClick={() => window.open(`tel:${supplier.phone}`, '_self')}
                          >
                            <Phone className="h-3.5 w-3.5 text-blue-500" />
                            {supplier.phone}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            onClick={() => {
                              const msg = encodeURIComponent(`Hello, ${supplier.name}`);
                              window.open(`https://wa.me/${supplier.phone!.replace(/[^0-9+]/g, '')}?text=${msg}`, '_blank');
                            }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {labels.whatsapp}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">{labels.noPhone}</p>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs gap-1"
                          onClick={() => {
                            setAssigningId(assigningId === supplier.id ? null : supplier.id);
                            setAssignProductId('');
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          {labels.addProduct}
                        </Button>
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

                      {assigningId === supplier.id && (
                        <div className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-2">
                          <Select value={assignProductId} onValueChange={setAssignProductId}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={labels.chooseProduct} />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.designation} · {p.type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button size="sm" className="h-8 flex-1 text-xs" onClick={() => handleAssign(supplier.id)}>
                              {lang === 'fr' ? 'Ajouter' : 'إضافة'}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAssigningId(null); setAssignProductId(''); }}>
                              {labels.cancel}
                            </Button>
                          </div>
                        </div>
                      )}

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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => handleUnlink(supplier.id, product.id)}
                                  title={labels.unlink}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Suppliers;
