import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests';
import { useInventory } from '@/hooks/useInventory';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ShoppingCart, RefreshCw, Plus, Trash2, Edit2, AlertTriangle,
  CheckCircle2, Package, Clock, Truck, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const PurchaseRequests = () => {
  const { t, lang } = useLanguage();
  const { requests, isLoading, autoDetectLowStock, updateStatus, updateRequest, deleteRequest, forceAdd } = usePurchaseRequests();
  const { products } = useInventory();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [forceOpen, setForceOpen] = useState(false);
  const [forceProductId, setForceProductId] = useState('');
  const [forceQty, setForceQty] = useState(1);
  const [scanning, setScanning] = useState(false);

  const labels = lang === 'fr' ? {
    title: 'Demandes d\'Achat',
    subtitle: 'Système de réapprovisionnement automatique',
    scanNow: 'Analyser le stock',
    scanning: 'Analyse en cours...',
    forceAdd: 'Ajouter manuellement',
    pending: 'En attente',
    ordered: 'Commandé',
    received: 'Reçu',
    all: 'Tous',
    item: 'Article',
    currentStock: 'Stock actuel',
    minThreshold: 'Seuil min.',
    suggestedQty: 'Qté suggérée',
    status: 'Statut',
    actions: 'Actions',
    noRequests: 'Aucune demande d\'achat',
    noRequestsDesc: 'Le stock est suffisant ou aucune analyse n\'a été effectuée',
    markOrdered: 'Marquer commandé',
    markReceived: 'Marquer reçu',
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
    urgentItems: 'Articles urgents',
    searchPlaceholder: 'Rechercher...',
    exportPdf: 'Exporter PDF',
    purchaseList: 'Liste des achats',
    date: 'Date',
    supplier: 'Fournisseur',
    signature: 'Signature',
  } : {
    title: 'طلبات الشراء',
    subtitle: 'نظام إعادة الطلب التلقائي',
    scanNow: 'فحص المخزون',
    scanning: 'جارٍ الفحص...',
    forceAdd: 'إضافة يدوية',
    pending: 'قيد الانتظار',
    ordered: 'تم الطلب',
    received: 'تم الاستلام',
    all: 'الكل',
    item: 'المادة',
    currentStock: 'المخزون الحالي',
    minThreshold: 'الحد الأدنى',
    suggestedQty: 'الكمية المقترحة',
    status: 'الحالة',
    actions: 'الإجراءات',
    noRequests: 'لا توجد طلبات شراء',
    noRequestsDesc: 'المخزون كافٍ أو لم يتم إجراء فحص',
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
    urgentItems: 'مواد عاجلة',
    searchPlaceholder: 'بحث...',
    exportPdf: 'تصدير PDF',
    purchaseList: 'قائمة المشتريات',
    date: 'التاريخ',
    supplier: 'المورد',
    signature: 'التوقيع',
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
    toast.success(lang === 'fr' ? 'Demande ajoutée' : 'تمت إضافة الطلب');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateRequest(editingId, { suggested_quantity: editQty, notes: editNotes });
    setEditingId(null);
    toast.success(lang === 'fr' ? 'Modification enregistrée' : 'تم الحفظ');
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

      // Header
      doc.setFontSize(18);
      doc.setTextColor(66, 99, 235);
      doc.text(labels.purchaseList, 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`${labels.date}: ${today}`, 14, 32);

      doc.setDrawColor(66, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 36, 196, 36);

      // Table
      const headers = ['#', labels.item, labels.currentStock, labels.minThreshold, labels.suggestedQty, labels.status, labels.notes];
      const rows = pendingAndOrdered.map((req, i) => {
        const product = products.find(p => p.id === req.product_id);
        const statusLabel = req.status === 'pending' ? labels.pending : labels.ordered;
        return [
          String(i + 1),
          product?.designation || '—',
          String(req.current_stock),
          String(req.min_threshold),
          String(req.suggested_quantity),
          statusLabel,
          req.notes || '—',
        ];
      });

      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 42,
        styles: { font: 'helvetica', halign: 'center', fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [66, 99, 235], halign: 'center', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { halign: 'left', cellWidth: 50 },
          6: { halign: 'left', cellWidth: 35 },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 180;

      // Supplier & Signature area
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${labels.supplier}: ______________________________`, 14, finalY + 20);
      doc.text(`${labels.signature}: ______________________________`, 14, finalY + 35);
      doc.text(`${labels.date}: ______________________________`, 120, finalY + 35);

      // Footer
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

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      case 'ordered': return <Truck className="h-3.5 w-3.5" />;
      case 'received': return <CheckCircle2 className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'ordered': return 'default';
      case 'received': return 'secondary';
      default: return 'outline';
    }
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
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <Dialog open={forceOpen} onOpenChange={setForceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {labels.forceAdd}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{labels.forceAdd}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={forceProductId} onValueChange={setForceProductId}>
                    <SelectTrigger><SelectValue placeholder={labels.selectProduct} /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.designation} ({lang === 'fr' ? 'Stock' : 'مخزون'}: {p.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={forceQty}
                    onChange={e => setForceQty(Number(e.target.value))}
                    placeholder={labels.quantity}
                  />
                  <Button onClick={handleForceAdd} className="w-full">{labels.add}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{receivedCount}</p>
                <p className="text-xs text-muted-foreground">{labels.receivedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-xs text-muted-foreground">{labels.all}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={labels.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2">
            {['all', 'pending', 'ordered', 'received'].map(s => (
              <Button
                key={s}
                variant={filter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(s)}
                className="gap-1.5"
              >
                {s !== 'all' && statusIcon(s)}
                {s === 'all' ? labels.all : s === 'pending' ? labels.pending : s === 'ordered' ? labels.ordered : labels.received}
                {s === 'pending' && pendingCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">{pendingCount}</Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{labels.noRequests}</p>
                <p className="text-sm">{labels.noRequestsDesc}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{labels.item}</TableHead>
                    <TableHead className="text-center">{labels.currentStock}</TableHead>
                    <TableHead className="text-center">{labels.minThreshold}</TableHead>
                    <TableHead className="text-center">{labels.suggestedQty}</TableHead>
                    <TableHead className="text-center">{labels.status}</TableHead>
                    <TableHead className="text-center">{labels.notes}</TableHead>
                    <TableHead className="text-center">{labels.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(req => {
                    const product = products.find(p => p.id === req.product_id);
                    const isEditing = editingId === req.id;
                    const isUrgent = req.status === 'pending' && req.current_stock === 0;

                    return (
                      <TableRow key={req.id} className={isUrgent ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isUrgent && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
                            <div>
                              <span className="font-medium">{product?.designation || '—'}</span>
                              {product?.brand && (
                                <span className="text-xs text-muted-foreground block">{product.brand}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          <span className={req.current_stock === 0 ? 'text-destructive font-bold' : ''}>
                            {req.current_stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono">{req.min_threshold}</TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={1}
                              value={editQty}
                              onChange={e => setEditQty(Number(e.target.value))}
                              className="w-20 mx-auto text-center"
                            />
                          ) : (
                            <span className="font-mono font-bold text-primary">{req.suggested_quantity}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusVariant(req.status)} className="gap-1">
                            {statusIcon(req.status)}
                            {req.status === 'pending' ? labels.pending : req.status === 'ordered' ? labels.ordered : labels.received}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center max-w-[150px]">
                          {isEditing ? (
                            <Textarea
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              className="text-xs min-h-[60px]"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">{req.notes || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <Button size="sm" onClick={handleSaveEdit}>{labels.save}</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{labels.cancel}</Button>
                              </>
                            ) : (
                              <>
                                {req.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-xs"
                                    onClick={() => updateStatus(req.id, 'ordered')}
                                  >
                                    <Truck className="h-3 w-3" />
                                    {labels.markOrdered}
                                  </Button>
                                )}
                                {req.status === 'ordered' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-xs text-green-600"
                                    onClick={() => updateStatus(req.id, 'received')}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    {labels.markReceived}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingId(req.id);
                                    setEditQty(req.suggested_quantity);
                                    setEditNotes(req.notes || '');
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                                      <AlertDialogDescription>{labels.deleteConfirm}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteRequest(req.id)}>
                                        {labels.delete}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PurchaseRequests;
