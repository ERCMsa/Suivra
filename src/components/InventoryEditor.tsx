import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Eraser, Loader2, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import type { Product } from '@/hooks/useInventory';
import {
  createRequestId,
  formatDateTime,
  formatQuantity,
  materialReference,
  parseQuantityInput,
  summarizeInventoryDraft,
  type InventoryQuantityEntry,
} from '@/lib/inventory';

interface InventoryEditorProps {
  products: Product[];
  isFirstInventory: boolean;
  isSaving: boolean;
  canSave: boolean;
  historyAvailable: boolean;
  historyLoading: boolean;
  onSave: (entries: InventoryQuantityEntry[], requestId: string, note?: string) => Promise<void>;
}

const InventoryEditor = ({
  products,
  isFirstInventory,
  isSaving,
  canSave,
  historyAvailable,
  historyLoading,
  onSave,
}: InventoryEditorProps) => {
  const { lang } = useLanguage();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [onlyModified, setOnlyModified] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);

  const labels = lang === 'fr' ? {
    title: 'Inventaire actuel',
    subtitle: 'Saisissez la quantité réellement comptée pour chaque matériau. Les cellules vides conservent la quantité actuelle.',
    search: 'Rechercher un matériau…',
    onlyModified: 'Nouvelle quantité uniquement',
    clear: 'Effacer la saisie',
    reference: 'Référence',
    designation: 'Désignation',
    unit: 'Unité',
    current: 'Quantité actuelle',
    next: 'Nouvelle quantité',
    delta: 'Écart',
    save: 'Enregistrer l\'inventaire',
    saving: 'Enregistrement…',
    filled: 'saisis',
    changed: 'modifiés',
    empty: 'inchangés',
    invalid: 'invalides',
    noProducts: 'Aucun matériau',
    noProductsDesc: 'Ajoutez d\'abord des matériaux depuis la page principale.',
    noResults: 'Aucun matériau ne correspond à la recherche',
    invalidValue: 'Quantité invalide (nombre positif ou nul)',
    nothingToSave: 'Saisissez au moins une nouvelle quantité',
    fixInvalid: 'Corrigez les quantités invalides avant d\'enregistrer',
    confirmTitle: 'Enregistrer un nouvel inventaire ?',
    confirmDesc: 'Un snapshot complet et immuable de tous les matériaux sera créé à la date et l\'heure actuelles.',
    baseline: 'Premier inventaire : un snapshot initial contenant les quantités actuelles sera également conservé.',
    snapshotDate: 'Date du snapshot',
    snapshotType: 'Type',
    typeUpdated: 'Inventaire mis à jour',
    typeInitial: 'Inventaire initial',
    typeFirst: 'Initial + mis à jour',
    noteLabel: 'Note (optionnel)',
    notePlaceholder: 'Observation, référence du comptage…',
    cancel: 'Annuler',
    confirm: 'Confirmer l\'enregistrement',
    saved: 'Inventaire enregistré avec succès',
    saveFail: 'Échec de l\'enregistrement de l\'inventaire',
    immutable: 'Les snapshots précédents ne seront ni modifiés ni supprimés.',
    migrationPending: 'La table d\'historique n\'est pas encore disponible. Appliquez la migration pour activer l\'enregistrement.',
    noPermission: 'Vous n\'avez pas la permission d\'enregistrer un inventaire.',
    checkingHistory: 'Vérification de l\'historique…',
    totalAfter: 'Total après enregistrement',
  } : {
    title: 'الجرد الحالي',
    subtitle: 'أدخل الكمية المحسوبة فعلياً لكل مادة. الخلايا الفارغة تحتفظ بالكمية الحالية.',
    search: 'البحث عن مادة…',
    onlyModified: 'المواد المعدّلة فقط',
    clear: 'مسح الإدخال',
    reference: 'المرجع',
    designation: 'التسمية',
    unit: 'الوحدة',
    current: 'الكمية الحالية',
    next: 'الكمية الجديدة',
    delta: 'الفرق',
    save: 'حفظ الجرد',
    saving: 'جارٍ الحفظ…',
    filled: 'مدخلة',
    changed: 'معدّلة',
    empty: 'بدون تغيير',
    invalid: 'غير صالحة',
    noProducts: 'لا توجد مواد',
    noProductsDesc: 'أضف المواد أولاً من الصفحة الرئيسية.',
    noResults: 'لا توجد مواد تطابق البحث',
    invalidValue: 'كمية غير صالحة (عدد موجب أو صفر)',
    nothingToSave: 'أدخل كمية جديدة واحدة على الأقل',
    fixInvalid: 'صحّح الكميات غير الصالحة قبل الحفظ',
    confirmTitle: 'حفظ جرد جديد؟',
    confirmDesc: 'سيتم إنشاء نسخة كاملة غير قابلة للتعديل لكل المواد بتاريخ ووقت الحفظ.',
    baseline: 'هذا أول جرد: سيتم أيضاً حفظ نسخة أولية بالكميات الحالية.',
    snapshotDate: 'تاريخ الجرد',
    snapshotType: 'النوع',
    typeUpdated: 'جرد محدّث',
    typeInitial: 'الجرد الأولي',
    typeFirst: 'أولي + محدّث',
    noteLabel: 'ملاحظة (اختياري)',
    notePlaceholder: 'ملاحظة، مرجع الجرد…',
    cancel: 'إلغاء',
    confirm: 'تأكيد الحفظ',
    saved: 'تم حفظ الجرد بنجاح',
    saveFail: 'فشل حفظ الجرد',
    immutable: 'لن يتم تعديل أو حذف أي جرد سابق.',
    migrationPending: 'جدول السجل غير متوفر بعد. طبّق الترحيل لتفعيل الحفظ.',
    noPermission: 'ليس لديك صلاحية حفظ الجرد.',
    checkingHistory: 'جارٍ التحقق من السجل…',
    totalAfter: 'الإجمالي بعد الحفظ',
  };

  const summary = useMemo(() => summarizeInventoryDraft(products, drafts), [products, drafts]);

  const invalidIds = useMemo(() => {
    const ids = new Set<string>();
    for (const product of products) {
      const raw = drafts[product.id];
      if (raw === undefined || raw.trim() === '') continue;
      if (parseQuantityInput(raw).value === null) ids.add(product.id);
    }
    return ids;
  }, [products, drafts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(product => {
      if (onlyModified) {
        const raw = drafts[product.id];
        if (raw === undefined || raw.trim() === '') return false;
      }
      if (!query) return true;
      return [
        product.designation,
        materialReference(product),
        product.type,
        product.unit,
        product.brand,
      ].some(value => (value || '').toLowerCase().includes(query));
    });
  }, [products, drafts, onlyModified, search]);

  const disabledReason = !historyAvailable
    ? labels.migrationPending
    : historyLoading
      ? labels.checkingHistory
      : !canSave
        ? labels.noPermission
        : summary.invalid > 0
          ? labels.fixInvalid
          : summary.filled === 0
            ? labels.nothingToSave
            : null;

  const openConfirmation = () => {
    if (summary.invalid > 0) {
      toast.error(labels.fixInvalid);
      return;
    }
    if (summary.filled === 0) {
      toast.error(labels.nothingToSave);
      return;
    }
    setRequestId(current => current ?? createRequestId());
    setConfirmOpen(true);
  };

  const closeConfirmation = (open: boolean) => {
    if (isSaving) return;
    setConfirmOpen(open);
    if (!open) {
      setRequestId(null);
      setNote('');
    }
  };

  const handleConfirm = async () => {
    if (!requestId) return;
    try {
      await onSave(summary.entries, requestId, note);
      toast.success(labels.saved);
      setDrafts({});
      setNote('');
      setRequestId(null);
      setConfirmOpen(false);
      setOnlyModified(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : labels.saveFail);
    }
  };

  const updateDraft = (productId: string, value: string) => {
    setDrafts(previous => ({ ...previous, [productId]: value }));
  };

  const previewDelta = (product: Product) => {
    const parsed = parseQuantityInput(drafts[product.id] ?? '');
    if (parsed.value === null) return null;
    return Number((parsed.value - Number(product.quantity)).toFixed(3));
  };

  return (
    <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              {labels.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{labels.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl text-xs"
              onClick={() => setDrafts({})}
              disabled={summary.filled === 0 && summary.invalid === 0}
            >
              <Eraser className="h-3.5 w-3.5" />
              {labels.clear}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 rounded-xl text-xs bg-primary text-primary-foreground"
              onClick={openConfirmation}
              disabled={isSaving || !!disabledReason}
              title={disabledReason ?? labels.save}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isSaving ? labels.saving : labels.save}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <Badge variant="secondary" className="rounded-lg">{summary.filled} {labels.filled}</Badge>
            <Badge variant="outline" className="rounded-lg">{summary.changed} {labels.changed}</Badge>
            <Badge variant="outline" className="rounded-lg text-muted-foreground">{summary.empty} {labels.empty}</Badge>
            {summary.invalid > 0 && (
              <Badge variant="destructive" className="rounded-lg gap-1">
                <AlertTriangle className="h-3 w-3" />
                {summary.invalid} {labels.invalid}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-2.5" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={labels.search}
                className="h-8 pl-8 text-xs rounded-xl bg-secondary/50 border-0 rtl:pl-3 rtl:pr-8"
              />
            </div>
            <Button
              variant={onlyModified ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-xl text-xs"
              onClick={() => setOnlyModified(value => !value)}
            >
              {labels.onlyModified}
            </Button>
          </div>
        </div>

        {!historyAvailable && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-2.5 text-[11px] text-warning-foreground">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{labels.migrationPending}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-muted/50 p-5">
              <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="mt-4 text-sm font-medium">{labels.noProducts}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{labels.noProductsDesc}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">{labels.noResults}</div>
        ) : (
          <div className="max-h-[62vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-0">
                  <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-12">#</TableHead>
                  <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-28">{labels.reference}</TableHead>
                  <TableHead className="text-left text-[11px] font-semibold text-muted-foreground rtl:text-right">{labels.designation}</TableHead>
                  <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-28">{labels.unit}</TableHead>
                  <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-32">{labels.current}</TableHead>
                  <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-40">{labels.next}</TableHead>
                  <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-24">{labels.delta}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                  const invalid = invalidIds.has(product.id);
                  const delta = previewDelta(product);
                  return (
                    <TableRow key={product.id} className="border-border/30 hover:bg-secondary/10">
                      <TableCell className="text-center text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex rounded-md bg-secondary/60 px-2 py-0.5 font-mono text-[11px]">
                          {materialReference(product)}
                        </span>
                      </TableCell>
                      <TableCell className="text-left rtl:text-right">
                        <p className="text-sm font-medium leading-tight">{product.designation}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          {[product.type, product.brand].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{product.unit || '—'}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-0.5 text-sm font-semibold text-primary">
                          {formatQuantity(product.quantity)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          value={drafts[product.id] ?? ''}
                          onChange={event => updateDraft(product.id, event.target.value)}
                          inputMode="decimal"
                          autoComplete="off"
                          aria-invalid={invalid}
                          aria-label={`${labels.next} — ${product.designation}`}
                          className={`h-8 w-28 mx-auto rounded-lg text-center text-sm ${
                            invalid
                              ? 'border-destructive focus-visible:ring-destructive'
                              : 'bg-secondary/30 border-border/60 focus-visible:ring-1'
                          }`}
                        />
                        {invalid && (
                          <p className="mt-1 text-[10px] text-destructive leading-tight">{labels.invalidValue}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {delta === null ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : delta === 0 ? (
                          <span className="text-xs text-muted-foreground">0</span>
                        ) : (
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${
                            delta > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          }`}>
                            {delta > 0 ? '+' : ''}{formatQuantity(delta)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={closeConfirmation}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {labels.confirmTitle}
            </DialogTitle>
            <DialogDescription>{labels.confirmDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{labels.snapshotDate}</span>
                <span className="text-xs font-medium">{formatDateTime(new Date())}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{labels.snapshotType}</span>
                <span className="text-xs font-medium">{isFirstInventory ? labels.typeFirst : labels.typeUpdated}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{labels.filled}</span>
                <span className="text-xs font-medium">{summary.filled}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{labels.totalAfter}</span>
                <span className="text-xs font-semibold text-primary">{formatQuantity(summary.newTotal)}</span>
              </div>
            </div>

            {isFirstInventory && (
              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-[11px] text-foreground">
                <ClipboardList className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>{labels.baseline}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="inventory-note" className="text-xs">{labels.noteLabel}</Label>
              <Textarea
                id="inventory-note"
                value={note}
                onChange={event => setNote(event.target.value)}
                placeholder={labels.notePlaceholder}
                rows={2}
                maxLength={500}
                className="resize-none text-sm rounded-xl"
              />
            </div>

            <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {labels.immutable}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => closeConfirmation(false)} disabled={isSaving}>
              {labels.cancel}
            </Button>
            <Button className="rounded-xl gap-1.5" onClick={handleConfirm} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {labels.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InventoryEditor;
