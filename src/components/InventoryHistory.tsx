import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  Loader2,
  Lock,
  PackageOpen,
  Printer,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import type { Product } from '@/hooks/useInventory';
import type { InventorySnapshot, InventorySnapshotItem } from '@/hooks/useInventorySnapshots';
import {
  formatDateTime,
  formatQuantity,
  snapshotDelta,
  snapshotTypeLabel,
} from '@/lib/inventory';
import { downloadInventoryReport, printInventoryReport } from '@/lib/inventoryReport';

interface InventoryHistoryProps {
  snapshots: InventorySnapshot[];
  items: InventorySnapshotItem[];
  products: Product[];
  isLoading: boolean;
  isLoadingItems: boolean;
  historyAvailable: boolean;
  error: string | null;
  onFetchItems: (snapshotId: string) => Promise<unknown>;
}

const InventoryHistory = ({
  snapshots,
  items,
  products,
  isLoading,
  isLoadingItems,
  historyAvailable,
  error,
  onFetchItems,
}: InventoryHistoryProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'print' | null>(null);
  const { lang } = useLanguage();

  const labels = useMemo(() => {
    return lang === 'fr' ? {
      title: 'Historique des inventaires',
      subtitle: 'Chaque enregistrement est un snapshot complet, daté et immuable. Sélectionnez un inventaire pour consulter ses quantités exactes.',
      noHistory: 'Aucun inventaire enregistré',
      noHistoryDesc: 'Le premier enregistrement créera le snapshot initial et le premier inventaire mis à jour.',
      selectPrompt: 'Sélectionnez un inventaire',
      selectPromptDesc: 'Choisissez un snapshot dans la liste pour afficher ses matériaux.',
      snapshot: 'Snapshot',
      date: 'Date et heure',
      type: 'Type',
      materials: 'Matériaux',
      materialsShort: 'matériaux',
      totalQty: 'Quantité totale',
      by: 'Enregistré par',
      note: 'Note',
      reference: 'Référence',
      designation: 'Désignation',
      unit: 'Unité',
      historicalQty: 'Quantité au snapshot',
      currentQty: 'Quantité actuelle',
      delta: 'Écart actuel',
      readOnly: 'Lecture seule — snapshot historique',
      download: 'Télécharger PDF',
      print: 'Imprimer',
      previous: 'Plus ancien',
      newer: 'Plus récent',
      pdfSuccess: 'Rapport PDF généré',
      pdfFail: 'Impossible de générer le rapport PDF',
      printFail: 'Impossible d\'ouvrir la fenêtre d\'impression',
      migrationPending: 'La table d\'historique n\'est pas encore disponible. Appliquez la migration des snapshots d\'inventaire.',
      loadFail: 'Impossible de charger l\'historique',
      deletedMaterial: 'Matériau supprimé',
      emptySnapshot: 'Ce snapshot ne contient aucun matériau.',
    } : {
      title: 'سجل الجرد',
      subtitle: 'كل عملية حفظ هي نسخة كاملة ومؤرخة وغير قابلة للتعديل. اختر جرداً لعرض كمياته بالتفصيل.',
      noHistory: 'لا يوجد جرد محفوظ',
      noHistoryDesc: 'أول عملية حفظ ستنشئ النسخة الأولية وأول جرد محدّث.',
      selectPrompt: 'اختر جرداً',
      selectPromptDesc: 'اختر نسخة من القائمة لعرض موادها.',
      snapshot: 'النسخة',
      date: 'التاريخ والوقت',
      type: 'النوع',
      materials: 'المواد',
      materialsShort: 'مواد',
      totalQty: 'إجمالي الكميات',
      by: 'سجّلها',
      note: 'ملاحظة',
      reference: 'المرجع',
      designation: 'التسمية',
      unit: 'الوحدة',
      historicalQty: 'الكمية في الجرد',
      currentQty: 'الكمية الحالية',
      delta: 'الفرق الحالي',
      readOnly: 'للقراءة فقط — نسخة تاريخية',
      download: 'تحميل PDF',
      print: 'طباعة',
      previous: 'الأقدم',
      newer: 'الأحدث',
      pdfSuccess: 'تم إنشاء تقرير PDF',
      pdfFail: 'تعذّر إنشاء تقرير PDF',
      printFail: 'تعذّر فتح نافذة الطباعة',
      migrationPending: 'جدول السجل غير متوفر بعد. طبّق ترحيل نسخ الجرد.',
      loadFail: 'تعذّر تحميل السجل',
      deletedMaterial: 'مادة محذوفة',
      emptySnapshot: 'هذه النسخة لا تحتوي على مواد.',
    };
  }, [lang]);

  const selectedIndex = snapshots.findIndex(snapshot => snapshot.id === selectedId);
  const selected = selectedIndex >= 0 ? snapshots[selectedIndex] : null;
  const topId = snapshots[0]?.id ?? null;
  const previousTopId = useRef<string | null>(null);

  useEffect(() => {
    if (!topId) {
      previousTopId.current = null;
      setSelectedId(null);
      return;
    }
    // A newly saved snapshot becomes the selected one automatically.
    if (previousTopId.current !== topId) {
      previousTopId.current = topId;
      setSelectedId(topId);
      return;
    }
    if (!selectedId || !snapshots.some(snapshot => snapshot.id === selectedId)) {
      setSelectedId(topId);
    }
  }, [snapshots, topId, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    void onFetchItems(selectedId);
  }, [selectedId, onFetchItems]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(product => map.set(product.id, product));
    return map;
  }, [products]);

  const runExport = async (mode: 'pdf' | 'print') => {
    if (!selected) return;
    setExporting(mode);
    try {
      if (mode === 'pdf') {
        await downloadInventoryReport({ snapshot: selected, items, lang });
        toast.success(labels.pdfSuccess);
      } else {
        await printInventoryReport({ snapshot: selected, items, lang });
      }
    } catch (exportError) {
      toast.error(
        exportError instanceof Error && exportError.message
          ? exportError.message
          : mode === 'pdf' ? labels.pdfFail : labels.printFail,
      );
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!historyAvailable) {
    return (
      <Card className="rounded-2xl border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-5 text-sm">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="font-medium">{labels.migrationPending}</p>
            {error && <p className="text-xs text-muted-foreground mt-1">{error}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-2xl bg-muted/50 p-5">
            <History className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-4 text-sm font-medium">{labels.noHistory}</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">{labels.noHistoryDesc}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Snapshot list */}
      <Card className="rounded-2xl border-0 shadow-card overflow-hidden self-start">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {labels.title}
            <Badge variant="secondary" className="ms-auto rounded-lg text-[10px]">{snapshots.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[62vh] overflow-y-auto divide-y divide-border/40">
            {snapshots.map(snapshot => {
              const active = snapshot.id === selectedId;
              return (
                <button
                  key={snapshot.id}
                  type="button"
                  onClick={() => setSelectedId(snapshot.id)}
                  className={`w-full text-start p-3 transition-colors ${active ? 'bg-primary/8' : 'hover:bg-secondary/40'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${active ? 'text-primary' : ''}`}>
                      {formatDateTime(snapshot.captured_at)}
                    </span>
                    <Badge
                      variant={snapshot.snapshot_type === 'initial' ? 'outline' : 'secondary'}
                      className={`rounded-lg text-[10px] ${snapshot.snapshot_type === 'initial' ? 'border-primary/30 text-primary' : ''}`}
                    >
                      {snapshotTypeLabel(snapshot.snapshot_type, lang)}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{snapshot.material_count} {labels.materialsShort}</span>
                    <span>·</span>
                    <span>{formatQuantity(snapshot.total_quantity)}</span>
                  </div>
                  {snapshot.created_by_name && (
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/80 truncate">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{snapshot.created_by_name}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Snapshot detail */}
      <Card className="rounded-2xl border-0 shadow-card overflow-hidden">
        {!selected ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-medium">{labels.selectPrompt}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{labels.selectPromptDesc}</p>
          </CardContent>
        ) : (
          <>
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold flex flex-wrap items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    {formatDateTime(selected.captured_at)}
                    <Badge
                      variant={selected.snapshot_type === 'initial' ? 'outline' : 'secondary'}
                      className={`rounded-lg text-[10px] ${selected.snapshot_type === 'initial' ? 'border-primary/30 text-primary' : ''}`}
                    >
                      {snapshotTypeLabel(selected.snapshot_type, lang)}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg text-[10px] gap-1 text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      {labels.readOnly}
                    </Badge>
                  </CardTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{labels.materials}: <strong className="text-foreground">{selected.material_count}</strong></span>
                    <span>{labels.totalQty}: <strong className="text-foreground">{formatQuantity(selected.total_quantity)}</strong></span>
                    {selected.created_by_name && <span>{labels.by}: {selected.created_by_name}</span>}
                  </div>
                  {selected.note && (
                    <p className="mt-2 rounded-lg bg-secondary/40 px-2.5 py-1.5 text-[11px] text-muted-foreground whitespace-pre-wrap">
                      {labels.note}: {selected.note}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs gap-1.5"
                    onClick={() => runExport('pdf')}
                    disabled={isLoadingItems || exporting !== null || items.length === 0}
                  >
                    {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {labels.download}
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 rounded-xl text-xs gap-1.5"
                    onClick={() => runExport('print')}
                    disabled={isLoadingItems || exporting !== null || items.length === 0}
                  >
                    {exporting === 'print' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                    {labels.print}
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl text-xs gap-1"
                  onClick={() => setSelectedId(snapshots[selectedIndex + 1].id)}
                  disabled={selectedIndex < 0 || selectedIndex >= snapshots.length - 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                  {labels.previous}
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {selectedIndex + 1} / {snapshots.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl text-xs gap-1"
                  onClick={() => setSelectedId(snapshots[selectedIndex - 1].id)}
                  disabled={selectedIndex <= 0}
                >
                  {labels.newer}
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoadingItems ? (
                <div className="p-4 space-y-2">
                  {[0, 1, 2, 3].map(row => <Skeleton key={row} className="h-8 w-full" />)}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PackageOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">{labels.emptySnapshot}</p>
                </div>
              ) : (
                <div className="max-h-[52vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                      <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-0">
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-12">#</TableHead>
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-28">{labels.reference}</TableHead>
                        <TableHead className="text-left text-[11px] font-semibold text-muted-foreground rtl:text-right">{labels.designation}</TableHead>
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-24">{labels.unit}</TableHead>
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-32">{labels.historicalQty}</TableHead>
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-32">{labels.currentQty}</TableHead>
                        <TableHead className="text-center text-[11px] font-semibold text-muted-foreground w-24">{labels.delta}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => {
                        const current = item.product_id ? productById.get(item.product_id) : undefined;
                        const delta = current ? snapshotDelta(Number(item.quantity), Number(current.quantity)) : null;
                        return (
                          <TableRow key={item.id} className="border-border/30">
                            <TableCell className="text-center text-xs text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex rounded-md bg-secondary/60 px-2 py-0.5 font-mono text-[11px]">{item.reference}</span>
                            </TableCell>
                            <TableCell className="text-left rtl:text-right">
                              <p className="text-sm font-medium leading-tight">{item.designation}</p>
                              {!current && (
                                <p className="text-[10px] text-muted-foreground leading-tight">{labels.deletedMaterial}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">{item.unit || '—'}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-0.5 text-sm font-semibold text-primary">
                                {formatQuantity(item.quantity)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {current ? formatQuantity(current.quantity) : '—'}
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
          </>
        )}
      </Card>
    </div>
  );
};

export default InventoryHistory;
