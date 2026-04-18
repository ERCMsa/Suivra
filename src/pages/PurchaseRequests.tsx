import { useState } from 'react';
import Header from '@/components/Header';
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests';
import { useInventory } from '@/hooks/useInventory';
import { useSuppliers } from '@/hooks/useSuppliers';
import LowStockAlerts from '@/components/LowStockAlerts';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ShoppingCart, RefreshCw, Plus, Trash2, Edit2, AlertTriangle,
  CheckCircle2, Package, Clock, Truck, FileText, Phone, MessageCircle,
  Star, ChevronRight, User, X, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import SupplierAvatar from '@/components/SupplierAvatar';

const PurchaseRequests = () => {
  const { t, lang } = useLanguage();
  const { requests, isLoading, autoDetectLowStock, updateStatus, updateRequest, deleteRequest, forceAdd } = usePurchaseRequests();
  const { products, addStockMovement } = useInventory();
  const { suppliers, supplierProducts, getSuppliersForProduct, getProductsForSupplier, addSupplier, updateSupplier, deleteSupplier, linkSupplierToProduct, markSupplierUsed } = useSuppliers();

  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [forceOpen, setForceOpen] = useState(false);
  const [forceProductId, setForceProductId] = useState('');
  const [forceQty, setForceQty] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', category: '', phone: '', email: '', image_url: '' });
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editSupplierData, setEditSupplierData] = useState({ name: '', category: '', phone: '', email: '', address: '', notes: '', image_url: '' });
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [assigningSupplierId, setAssigningSupplierId] = useState<string | null>(null);
  const [assignProductId, setAssignProductId] = useState('');
  const [editingProductStock, setEditingProductStock] = useState<string | null>(null);
  const [stockEditQty, setStockEditQty] = useState(0);
  const [stockEditType, setStockEditType] = useState<'in' | 'out'>('in');

  const labels = lang === 'fr' ? {
    title: 'Fenêtre d\'Achat',
    subtitle: 'Système de réapprovisionnement intelligent',
    scanNow: 'Analyser le stock',
    scanning: 'Analyse en cours...',
    forceAdd: 'Ajouter manuellement',
    pending: 'En attente',
    ordered: 'Commandé',
    received: 'Reçu',
    all: 'Tous',
    item: 'Article',
    currentStock: 'Stock',
    minThreshold: 'Seuil min.',
    suggestedQty: 'Qté suggérée',
    status: 'Statut',
    actions: 'Actions',
    noRequests: 'Aucune demande d\'achat',
    noRequestsDesc: 'Analysez le stock ou ajoutez manuellement',
    markOrdered: 'Commandé',
    markReceived: 'Reçu',
    edit: 'Modifier',
    delete: 'Supprimer',
    deleteConfirm: 'Supprimer cette demande ?',
    save: 'Enregistrer',
    cancel: 'Annuler',
    quantity: 'Quantité',
    notes: 'Notes',
    selectProduct: 'Choisir un article',
    add: 'Ajouter',
    detected: 'articles détectés en stock bas',
    allGood: 'Tous les stocks sont suffisants',
    pendingCount: 'En attente',
    orderedCount: 'Commandés',
    receivedCount: 'Reçus',
    searchPlaceholder: 'Rechercher...',
    exportPdf: 'Exporter PDF',
    purchaseList: 'Liste des achats',
    date: 'Date',
    supplier: 'Fournisseur',
    signature: 'Signature',
    suppliers: 'Fournisseurs',
    recommended: 'Recommandé',
    lastUsed: 'Dernier utilisé',
    callSupplier: 'Appeler',
    whatsapp: 'WhatsApp',
    noSuppliers: 'Aucun fournisseur lié',
    addSupplier: 'Ajouter un fournisseur',
    supplierName: 'Nom du fournisseur',
    category: 'Catégorie',
    phone: 'Téléphone',
    email: 'Email',
    urgent: 'Urgent',
    medium: 'Moyen',
    normal: 'Normal',
    selectSupplier: 'Sélectionner',
    createRequest: 'Créer la demande',
    backToList: 'Retour à la liste',
    supplierSelected: 'Fournisseur sélectionné',
    requestCreated: 'Demande créée avec succès',
    linkSupplier: 'Lier à ce produit',
    assignItem: 'Ajouter un article',
    chooseItem: 'Choisir un article',
    itemAddedToSupplier: 'Article ajouté au fournisseur',
    itemAlreadyLinked: 'Article déjà lié à ce fournisseur',
  } : {
    title: 'نافذة الشراء',
    subtitle: 'نظام إعادة الطلب الذكي',
    scanNow: 'فحص المخزون',
    scanning: 'جارٍ الفحص...',
    forceAdd: 'إضافة يدوية',
    pending: 'قيد الانتظار',
    ordered: 'تم الطلب',
    received: 'تم الاستلام',
    all: 'الكل',
    item: 'المادة',
    currentStock: 'المخزون',
    minThreshold: 'الحد الأدنى',
    suggestedQty: 'الكمية المقترحة',
    status: 'الحالة',
    actions: 'الإجراءات',
    noRequests: 'لا توجد طلبات شراء',
    noRequestsDesc: 'افحص المخزون أو أضف يدوياً',
    markOrdered: 'تم الطلب',
    markReceived: 'تم الاستلام',
    edit: 'تعديل',
    delete: 'حذف',
    deleteConfirm: 'حذف هذا الطلب؟',
    save: 'حفظ',
    cancel: 'إلغاء',
    quantity: 'الكمية',
    notes: 'ملاحظات',
    selectProduct: 'اختر مادة',
    add: 'إضافة',
    detected: 'مواد بمخزون منخفض',
    allGood: 'جميع المخزونات كافية',
    pendingCount: 'قيد الانتظار',
    orderedCount: 'تم طلبها',
    receivedCount: 'تم استلامها',
    searchPlaceholder: 'بحث...',
    exportPdf: 'تصدير PDF',
    purchaseList: 'قائمة المشتريات',
    date: 'التاريخ',
    supplier: 'المورد',
    signature: 'التوقيع',
    suppliers: 'الموردون',
    recommended: 'موصى به',
    lastUsed: 'آخر استخدام',
    callSupplier: 'اتصال',
    whatsapp: 'واتساب',
    noSuppliers: 'لا يوجد موردون مرتبطون',
    addSupplier: 'إضافة مورد',
    supplierName: 'اسم المورد',
    category: 'الفئة',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    urgent: 'عاجل',
    medium: 'متوسط',
    normal: 'عادي',
    selectSupplier: 'اختيار',
    createRequest: 'إنشاء الطلب',
    backToList: 'العودة للقائمة',
    supplierSelected: 'تم اختيار المورد',
    requestCreated: 'تم إنشاء الطلب بنجاح',
    linkSupplier: 'ربط بهذا المنتج',
    assignItem: 'إضافة مادة',
    chooseItem: 'اختر مادة',
    itemAddedToSupplier: 'تمت إضافة المادة إلى المورد',
    itemAlreadyLinked: 'هذه المادة مرتبطة بهذا المورد مسبقاً',
  };

  const getUrgencyLevel = (currentStock: number, minThreshold: number) => {
    if (currentStock === 0) return 'urgent';
    if (currentStock <= minThreshold * 0.5) return 'urgent';
    if (currentStock <= minThreshold) return 'medium';
    return 'normal';
  };

  const urgencyConfig = {
    urgent: { color: 'bg-red-500/10 text-red-600 border-red-200', dot: 'bg-red-500', label: labels.urgent },
    medium: { color: 'bg-amber-500/10 text-amber-600 border-amber-200', dot: 'bg-amber-500', label: labels.medium },
    normal: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500', label: labels.normal },
  };

  const handleScan = async () => {
    setScanning(true);
    const detected = await autoDetectLowStock();
    setScanning(false);
    if (detected.length > 0) {
      toast.success(`${detected.length} ${labels.detected}`);
    } else {
      toast.info(labels.allGood);
    }
  };

  const handleForceAdd = async () => {
    if (!forceProductId || forceQty <= 0) return;
    await forceAdd(forceProductId, forceQty);
    setForceOpen(false);
    setForceProductId('');
    setForceQty(1);
    toast.success(labels.requestCreated);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateRequest(editingId, { suggested_quantity: editQty, notes: editNotes });
    setEditingId(null);
    toast.success(lang === 'fr' ? 'Modification enregistrée' : 'تم الحفظ');
  };

  const handleWhatsApp = (phone: string, productName: string) => {
    const msg = encodeURIComponent(`Hello, I would like to request a quotation for: ${productName}`);
    window.open(`https://wa.me/${phone.replace(/[^0-9+]/g, '')}?text=${msg}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplierId(supplier.id);
    setEditSupplierData({
      name: supplier.name,
      category: supplier.category || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      image_url: supplier.image_url || '',
    });
  };

  const handleSaveSupplier = async () => {
    if (!editingSupplierId) return;
    const success = await updateSupplier(editingSupplierId, editSupplierData);
    if (success) {
      toast.success(lang === 'fr' ? 'Fournisseur modifié' : 'تم تعديل المورد');
      setEditingSupplierId(null);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    const success = await deleteSupplier(id);
    if (success) {
      toast.success(lang === 'fr' ? 'Fournisseur supprimé' : 'تم حذف المورد');
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) return;
    const success = await addSupplier(newSupplier);
    if (success) {
      toast.success(lang === 'fr' ? 'Fournisseur ajouté' : 'تمت إضافة المورد');
      setNewSupplier({ name: '', category: '', phone: '', email: '', image_url: '' });
      setAddSupplierOpen(false);
    }
  };

  const handleSelectSupplier = async (supplierId: string, productId: string) => {
    await markSupplierUsed(supplierId, productId);
    toast.success(labels.supplierSelected);
  };

  const handleLinkAndSelect = async (supplierId: string, productId: string) => {
    const alreadyLinked = isLinked(supplierId, productId);
    const success = alreadyLinked ? true : await linkSupplierToProduct(supplierId, productId);
    if (!success) return;
    await markSupplierUsed(supplierId, productId);
    toast.success(alreadyLinked ? labels.itemAlreadyLinked : labels.supplierSelected);
  };

  const handleAssignItemToSupplier = async (supplierId: string) => {
    if (!assignProductId) return;
    const alreadyLinked = isLinked(supplierId, assignProductId);
    const success = alreadyLinked ? true : await linkSupplierToProduct(supplierId, assignProductId);
    if (!success) return;
    await markSupplierUsed(supplierId, assignProductId);
    toast.success(alreadyLinked ? labels.itemAlreadyLinked : labels.itemAddedToSupplier);
    setAssigningSupplierId(null);
    setAssignProductId('');
    setExpandedSupplierId(supplierId);
  };

  const handleStockEdit = async (productId: string) => {
    if (stockEditQty <= 0) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (stockEditType === 'out' && stockEditQty > product.quantity) {
      toast.error(lang === 'fr' ? 'Stock insuffisant' : 'المخزون غير كافٍ');
      return;
    }
    await addStockMovement(productId, stockEditType, stockEditQty, product.length, product.width, lang === 'fr' ? 'Depuis fenêtre d\'achat' : 'من نافذة الشراء');
    toast.success(stockEditType === 'in'
      ? (lang === 'fr' ? 'Quantité ajoutée' : 'تمت إضافة الكمية')
      : (lang === 'fr' ? 'Quantité retirée' : 'تم سحب الكمية'));
    setEditingProductStock(null);
    setStockEditQty(0);
  };

  const exportPurchasePDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const pendingAndOrdered = requests.filter(r => r.status === 'pending' || r.status === 'ordered');
      if (pendingAndOrdered.length === 0) {
        toast.error(lang === 'fr' ? 'Aucun article à exporter' : 'لا توجد مواد للتصدير');
        return;
      }
      const doc = new jsPDF({ orientation: 'portrait' });
      const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ');
      doc.setFontSize(18);
      doc.setTextColor(66, 99, 235);
      doc.text(labels.purchaseList, 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`${labels.date}: ${today}`, 14, 32);
      doc.setDrawColor(66, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 36, 196, 36);
      const headers = ['#', labels.item, labels.currentStock, labels.minThreshold, labels.suggestedQty, labels.status, labels.notes];
      const rows = pendingAndOrdered.map((req, i) => {
        const product = products.find(p => p.id === req.product_id);
        return [String(i + 1), product?.designation || '—', String(req.current_stock), String(req.min_threshold), String(req.suggested_quantity), req.status === 'pending' ? labels.pending : labels.ordered, req.notes || '—'];
      });
      (doc as any).autoTable({ head: [headers], body: rows, startY: 42, styles: { font: 'helvetica', halign: 'center', fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: [66, 99, 235], halign: 'center', fontSize: 9 }, alternateRowStyles: { fillColor: [245, 247, 255] }, columnStyles: { 0: { cellWidth: 10 }, 1: { halign: 'left', cellWidth: 50 }, 6: { halign: 'left', cellWidth: 35 } } });
      const finalY = (doc as any).lastAutoTable?.finalY || 180;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${labels.supplier}: ______________________________`, 14, finalY + 20);
      doc.text(`${labels.signature}: ______________________________`, 14, finalY + 35);
      doc.text(`${labels.date}: ______________________________`, 120, finalY + 35);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${pendingAndOrdered.length} ${lang === 'fr' ? 'articles' : 'مادة'} — ${today}`, 105, 285, { align: 'center' });
      doc.save(`purchase_requests_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(lang === 'fr' ? 'PDF exporté avec succès' : 'تم تصدير PDF بنجاح');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur lors de l\'export' : 'خطأ في التصدير');
    }
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.designation || '—';

  const filtered = requests.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search) {
      const name = getProductName(r.product_id).toLowerCase();
      return name.includes(search.toLowerCase());
    }
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const orderedCount = requests.filter(r => r.status === 'ordered').length;
  const receivedCount = requests.filter(r => r.status === 'received').length;

  const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;
  const selectedRequest = selectedProductId ? requests.find(r => r.product_id === selectedProductId) : null;
  const productSuppliers = selectedProductId ? getSuppliersForProduct(selectedProductId, true) : [];

  // Get products linked to a supplier
  const getSupplierItems = (supplierId: string) => {
    const productIds = getProductsForSupplier(supplierId);
    return productIds.map(pid => products.find(p => p.id === pid)).filter(Boolean) as typeof products;
  };

  // Get last_used_at for a supplier-product pair
  const getLastUsed = (supplierId: string, productId: string) => {
    const sp = supplierProducts.find(s => s.supplier_id === supplierId && s.product_id === productId);
    return sp?.last_used_at;
  };

  const isLinked = (supplierId: string, productId: string) => {
    return supplierProducts.some(s => s.supplier_id === supplierId && s.product_id === productId);
  };

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
      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {labels.title}
            </h2>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleScan} disabled={scanning} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? labels.scanning : labels.scanNow}
            </Button>
            <Button variant="outline" onClick={exportPurchasePDF} className="gap-2">
              <FileText className="h-4 w-4" />
              {labels.exportPdf}
            </Button>
            <Dialog open={forceOpen} onOpenChange={setForceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />{labels.forceAdd}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{labels.forceAdd}</DialogTitle>
                  <DialogDescription>{lang === 'fr' ? 'Ajouter un article manuellement' : 'إضافة مادة يدوياً'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={forceProductId} onValueChange={setForceProductId}>
                    <SelectTrigger><SelectValue placeholder={labels.selectProduct} /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.designation} ({labels.currentStock}: {p.quantity})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} value={forceQty} onChange={e => setForceQty(Number(e.target.value))} placeholder={labels.quantity} />
                  <Button onClick={handleForceAdd} className="w-full">{labels.add}</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Building2 className="h-4 w-4" />{labels.addSupplier}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{labels.addSupplier}</DialogTitle>
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
                  <Input placeholder={labels.supplierName} value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                  <Input placeholder={labels.category} value={newSupplier.category} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })} />
                  <Input placeholder={labels.phone} value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                  <Input placeholder={labels.email} value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                  <Button onClick={handleAddSupplier} className="w-full">{labels.add}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">{labels.pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orderedCount}</p>
                <p className="text-xs text-muted-foreground">{labels.orderedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{receivedCount}</p>
                <p className="text-xs text-muted-foreground">{labels.receivedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-xs text-muted-foreground">{labels.all}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Single column purchase list */}
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder={labels.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'ordered', 'received'] as const).map(s => (
                <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)} className="gap-1.5">
                  {s === 'pending' && <Clock className="h-3.5 w-3.5" />}
                  {s === 'ordered' && <Truck className="h-3.5 w-3.5" />}
                  {s === 'received' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {s === 'all' ? labels.all : s === 'pending' ? labels.pending : s === 'ordered' ? labels.ordered : labels.received}
                  {s === 'pending' && pendingCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">{pendingCount}</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

            {/* Purchase Items */}
            {filtered.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{labels.noRequests}</p>
                  <p className="text-sm">{labels.noRequestsDesc}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filtered.map(req => {
                  const product = products.find(p => p.id === req.product_id);
                  const urgency = getUrgencyLevel(req.current_stock, req.min_threshold);
                  const uConfig = urgencyConfig[urgency];
                  const isSelected = selectedProductId === req.product_id;
                  const isEditing = editingId === req.id;

                  return (
                    <Card
                      key={req.id}
                      className={`rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}`}
                      onClick={() => !isEditing && setSelectedProductId(isSelected ? null : req.product_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Product Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Urgency dot */}
                            <div className={`h-3 w-3 rounded-full ${uConfig.dot} flex-shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold truncate">{product?.designation || '—'}</span>
                                <Badge variant="outline" className={`text-[10px] ${uConfig.color} border`}>
                                  {uConfig.label}
                                </Badge>
                              </div>
                              {product?.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                            </div>
                          </div>

                          {/* Center: Stock info */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <span className={`font-mono font-bold ${req.current_stock === 0 ? 'text-destructive' : ''}`}>
                                {req.current_stock}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">{labels.currentStock}</span>
                            </div>
                            <div className="text-center">
                              <span className="font-mono text-muted-foreground">{req.min_threshold}</span>
                              <span className="text-[10px] text-muted-foreground block">{labels.minThreshold}</span>
                            </div>
                            <div className="text-center">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min={1}
                                  value={editQty}
                                  onChange={e => { e.stopPropagation(); setEditQty(Number(e.target.value)); }}
                                  onClick={e => e.stopPropagation()}
                                  className="w-16 text-center h-7 text-sm"
                                />
                              ) : (
                                <span className="font-mono font-bold text-primary">{req.suggested_quantity}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground block">{labels.suggestedQty}</span>
                            </div>
                          </div>

                          {/* Supplier avatars */}
                          {(() => {
                            const linked = getSuppliersForProduct(req.product_id, true);
                            const linkedIds = new Set(linked.map(s => s.id));
                            const available = suppliers.filter(s => !linkedIds.has(s.id));

                            const AddPicker = (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={
                                      linked.length === 0
                                        ? "hidden sm:flex h-8 gap-1 text-[11px] border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                                        : "hidden sm:flex h-8 w-8 p-0 -ml-2 rounded-full border-dashed text-muted-foreground hover:text-primary hover:border-primary ring-2 ring-background shadow-md"
                                    }
                                    onClick={e => e.stopPropagation()}
                                    title={lang === 'fr' ? 'Ajouter un fournisseur' : 'إضافة مورد'}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    {linked.length === 0 && (lang === 'fr' ? 'Fournisseur' : 'مورد')}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-2" side="top" onClick={e => e.stopPropagation()}>
                                  <p className="text-xs font-semibold mb-2 px-1">
                                    {lang === 'fr' ? 'Lier un fournisseur' : 'ربط مورد'}
                                  </p>
                                  {available.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-3">
                                      {suppliers.length === 0
                                        ? (lang === 'fr' ? 'Aucun fournisseur. Créez-en un dans /suppliers' : 'لا يوجد موردون. أنشئ واحداً في صفحة الموردين')
                                        : (lang === 'fr' ? 'Tous les fournisseurs sont déjà liés' : 'جميع الموردين مرتبطون بالفعل')}
                                    </p>
                                  ) : (
                                    <div className="space-y-1 max-h-60 overflow-y-auto">
                                      {available.map(s => (
                                        <button
                                          key={s.id}
                                          type="button"
                                          className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted transition-colors text-left"
                                          onClick={() => handleLinkAndSelect(s.id, req.product_id)}
                                        >
                                          <SupplierAvatar
                                            name={s.name}
                                            imageUrl={s.image_url}
                                            size="sm"
                                            interactive={false}
                                            showTooltip={false}
                                          />
                                          <div className="min-w-0 flex-1">
                                            <span className="text-xs font-medium truncate block">{s.name}</span>
                                            {s.category && <span className="text-[10px] text-muted-foreground truncate block">{s.category}</span>}
                                          </div>
                                          <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </PopoverContent>
                              </Popover>
                            );

                            if (linked.length === 0) return AddPicker;

                            const visible = linked.slice(0, 3);
                            const extra = linked.length - visible.length;
                            return (
                              <div className="hidden sm:flex items-center" onClick={e => e.stopPropagation()}>
                                {visible.map((s, i) => (
                                  <div key={s.id} className={i > 0 ? '-ml-2' : ''}>
                                    <SupplierAvatar
                                      name={s.name}
                                      imageUrl={s.image_url}
                                      phone={s.phone}
                                      address={s.address}
                                      category={s.category}
                                      size="sm"
                                      productName={product?.designation}
                                    />
                                  </div>
                                ))}
                                {extra > 0 && (
                                  <div className="-ml-2 h-8 w-8 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background shadow-md">
                                    +{extra}
                                  </div>
                                )}
                                {AddPicker}
                              </div>
                            );
                          })()}

                          {/* Right: Status & Actions */}
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Badge
                              variant={req.status === 'pending' ? 'destructive' : req.status === 'ordered' ? 'default' : 'secondary'}
                              className="gap-1 text-[10px]"
                            >
                              {req.status === 'pending' && <Clock className="h-3 w-3" />}
                              {req.status === 'ordered' && <Truck className="h-3 w-3" />}
                              {req.status === 'received' && <CheckCircle2 className="h-3 w-3" />}
                              {req.status === 'pending' ? labels.pending : req.status === 'ordered' ? labels.ordered : labels.received}
                            </Badge>

                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button size="sm" className="h-7 text-xs" onClick={handleSaveEdit}>{labels.save}</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>{labels.cancel}</Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                {req.status === 'pending' && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateStatus(req.id, 'ordered')}>
                                    <Truck className="h-3 w-3" />
                                  </Button>
                                )}
                                {req.status === 'ordered' && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600" onClick={() => updateStatus(req.id, 'received')}>
                                    <CheckCircle2 className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(req.id); setEditQty(req.suggested_quantity); setEditNotes(req.notes || ''); }}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                                      <AlertDialogDescription>{labels.deleteConfirm}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteRequest(req.id)}>{labels.delete}</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Edit Notes */}
                        {isEditing && (
                          <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
                            <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder={labels.notes} className="text-xs min-h-[60px]" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default PurchaseRequests;
