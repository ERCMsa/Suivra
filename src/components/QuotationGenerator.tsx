import { useState, useMemo, useRef } from 'react';
import { FileText, Image as ImageIcon, Send, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useSuppliers, type Supplier } from '@/hooks/useSuppliers';
import type { Product } from '@/hooks/useInventory';
import companyLogo from '@/assets/logo.png';

interface QuotationGeneratorProps {
  products: Product[];
  defaultProductIds?: string[];
  defaultQuantities?: Record<string, number>;
  trigger?: React.ReactNode;
}

interface QuoteLine {
  productId: string;
  qty: number;
  selected: boolean;
}

const QuotationGenerator = ({ products, defaultProductIds = [], defaultQuantities = {}, trigger }: QuotationGeneratorProps) => {
  const { lang } = useLanguage();
  const { suppliers } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const t = lang === 'fr' ? {
    title: 'Générer un devis',
    desc: 'Sélectionnez le fournisseur et les articles pour créer un devis',
    selectSupplier: 'Choisir un fournisseur',
    searchProducts: 'Rechercher un article…',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    item: 'Article',
    qty: 'Qté',
    unit: 'Unité',
    selected: 'sélectionné(s)',
    exportPdf: 'Exporter PDF',
    exportJpg: 'Exporter JPG',
    sendWa: 'Envoyer WhatsApp',
    noSupplier: 'Veuillez choisir un fournisseur',
    noItems: 'Veuillez sélectionner au moins un article',
    success: 'Document généré',
    errorGen: 'Erreur lors de la génération',
    quoteRequest: 'DEMANDE DE DEVIS',
    to: 'À',
    from: 'De',
    date: 'Date',
    ref: 'Réf.',
    designation: 'Désignation',
    quantity: 'Quantité',
    notes: 'Merci de nous transmettre votre meilleure offre commerciale (prix, délai, conditions de paiement).',
    signature: 'Signature & Cachet',
    company: 'ERCMsa',
    triggerLabel: 'Devis personnalisé',
  } : {
    title: 'إنشاء طلب عرض سعر',
    desc: 'اختر المورد والمنتجات لإنشاء طلب عرض سعر مخصص',
    selectSupplier: 'اختر مورداً',
    searchProducts: 'ابحث عن مادة…',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء الكل',
    item: 'المادة',
    qty: 'الكمية',
    unit: 'الوحدة',
    selected: 'محددة',
    exportPdf: 'تصدير PDF',
    exportJpg: 'تصدير JPG',
    sendWa: 'إرسال واتساب',
    noSupplier: 'يرجى اختيار مورد',
    noItems: 'يرجى تحديد منتج واحد على الأقل',
    success: 'تم إنشاء الملف',
    errorGen: 'خطأ في الإنشاء',
    quoteRequest: 'طلب عرض سعر',
    to: 'إلى',
    from: 'من',
    date: 'التاريخ',
    ref: 'مرجع',
    designation: 'التسمية',
    quantity: 'الكمية',
    notes: 'يرجى موافاتنا بأفضل عرض تجاري (السعر، المهلة، شروط الدفع).',
    signature: 'التوقيع والختم',
    company: 'ERCMsa',
    triggerLabel: 'عرض سعر مخصص',
  };

  // Initialize lines when dialog opens
  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const initial: QuoteLine[] = products.map(p => ({
        productId: p.id,
        qty: defaultQuantities[p.id] || (p.min_quantity > p.quantity ? p.min_quantity - p.quantity : 1),
        selected: defaultProductIds.includes(p.id),
      }));
      setLines(initial);
      setSupplierId('');
      setSearch('');
    }
  };

  const supplier = suppliers.find(s => s.id === supplierId);

  const filteredLines = useMemo(() => {
    const q = search.toLowerCase().trim();
    return lines.filter(l => {
      const p = products.find(pp => pp.id === l.productId);
      if (!p) return false;
      if (!q) return true;
      return p.designation.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
    });
  }, [lines, products, search]);

  const selectedLines = lines.filter(l => l.selected);
  const allFilteredSelected = filteredLines.length > 0 && filteredLines.every(l => l.selected);

  const toggleLine = (productId: string) => {
    setLines(prev => prev.map(l => l.productId === productId ? { ...l, selected: !l.selected } : l));
  };

  const updateQty = (productId: string, qty: number) => {
    setLines(prev => prev.map(l => l.productId === productId ? { ...l, qty: Math.max(1, qty) } : l));
  };

  const toggleAllFiltered = () => {
    const next = !allFilteredSelected;
    const ids = new Set(filteredLines.map(l => l.productId));
    setLines(prev => prev.map(l => ids.has(l.productId) ? { ...l, selected: next } : l));
  };

  const validate = () => {
    if (!supplier) { toast.error(t.noSupplier); return false; }
    if (selectedLines.length === 0) { toast.error(t.noItems); return false; }
    return true;
  };

  const buildRef = () => {
    const d = new Date();
    return `Q-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Load image as base64 to embed in PDF
  const loadImageAsDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(img, 0, 0);
        try { resolve(canvas.toDataURL('image/png')); }
        catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error('img load'));
      img.src = url;
    });
  };

  const exportPDF = async () => {
    if (!validate()) return;
    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const ref = buildRef();
      const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'fr-DZ');

      // Logos
      try {
        const cLogo = await loadImageAsDataUrl(companyLogo);
        doc.addImage(cLogo, 'PNG', 14, 10, 28, 28);
      } catch { /* ignore */ }

      if (supplier?.image_url) {
        try {
          const sLogo = await loadImageAsDataUrl(supplier.image_url);
          doc.addImage(sLogo, 'PNG', 168, 10, 28, 28);
        } catch { /* ignore */ }
      }

      // Title
      doc.setFontSize(16);
      doc.setTextColor(66, 99, 235);
      doc.text(t.quoteRequest, 105, 22, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${t.ref}: ${ref}`, 105, 30, { align: 'center' });
      doc.text(`${t.date}: ${today}`, 105, 35, { align: 'center' });

      // Divider
      doc.setDrawColor(66, 99, 235);
      doc.setLineWidth(0.4);
      doc.line(14, 44, 196, 44);

      // From / To
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text(`${t.from}:`, 14, 52);
      doc.text(`${t.to}:`, 110, 52);
      doc.setFont('helvetica', 'normal');
      doc.text(t.company, 14, 58);
      doc.text(supplier!.name, 110, 58);
      if (supplier!.category) doc.text(supplier!.category, 110, 63);
      if (supplier!.phone) doc.text(`Tel: ${supplier!.phone}`, 110, 68);
      if (supplier!.address) {
        const addr = doc.splitTextToSize(supplier!.address, 80);
        doc.text(addr, 110, 73);
      }

      // Items table
      const headers = ['#', t.designation, t.quantity, t.unit];
      const rows = selectedLines.map((l, i) => {
        const p = products.find(pp => pp.id === l.productId)!;
        return [String(i + 1), p.designation + (p.brand ? ` (${p.brand})` : ''), String(l.qty), p.unit || '-'];
      });
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 90,
        styles: { font: 'helvetica', halign: 'center', fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [66, 99, 235], halign: 'center' },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        columnStyles: { 0: { cellWidth: 12 }, 1: { halign: 'left' }, 2: { cellWidth: 25 }, 3: { cellWidth: 30 } },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 180;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const noteLines = doc.splitTextToSize(t.notes, 180);
      doc.text(noteLines, 14, finalY + 12);

      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`${t.signature}:`, 14, finalY + 35);
      doc.line(14, finalY + 50, 90, finalY + 50);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${t.company} — ${ref}`, 105, 287, { align: 'center' });

      doc.save(`devis_${supplier!.name.replace(/\s+/g, '_')}_${ref}.pdf`);
      toast.success(t.success);
    } catch (e) {
      console.error(e);
      toast.error(t.errorGen);
    } finally {
      setGenerating(false);
    }
  };

  const exportJPG = async () => {
    if (!validate()) return;
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis_${supplier!.name.replace(/\s+/g, '_')}_${buildRef()}.jpg`;
      a.click();
      toast.success(t.success);
    } catch (e) {
      console.error(e);
      toast.error(t.errorGen);
    } finally {
      setGenerating(false);
    }
  };

  const sendWhatsApp = () => {
    if (!validate()) return;
    if (!supplier?.phone) {
      toast.error(lang === 'fr' ? 'Aucun numéro de téléphone' : 'لا يوجد رقم هاتف');
      return;
    }
    const itemsText = selectedLines.map((l, i) => {
      const p = products.find(pp => pp.id === l.productId)!;
      return `${i + 1}. ${p.designation} — ${l.qty} ${p.unit || ''}`;
    }).join('\n');
    const msg = encodeURIComponent(
      `${t.quoteRequest}\n${t.ref}: ${buildRef()}\n${t.from}: ${t.company}\n\n${itemsText}\n\n${t.notes}`
    );
    window.open(`https://wa.me/${supplier.phone.replace(/[^0-9+]/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            {t.triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.desc}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 overflow-hidden flex-1">
          {/* LEFT: form */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectSupplier} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.category ? ` — ${s.category}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchProducts}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <Button variant="ghost" size="sm" onClick={toggleAllFiltered} className="h-7 gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {allFilteredSelected ? t.deselectAll : t.selectAll}
              </Button>
              <Badge variant="secondary">{selectedLines.length} {t.selected}</Badge>
            </div>

            <div className="border rounded-lg overflow-y-auto flex-1 min-h-[240px]">
              {filteredLines.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">—</div>
              ) : (
                <ul className="divide-y">
                  {filteredLines.map(l => {
                    const p = products.find(pp => pp.id === l.productId)!;
                    return (
                      <li key={l.productId} className="flex items-center gap-2 p-2 hover:bg-muted/40">
                        <Checkbox
                          checked={l.selected}
                          onCheckedChange={() => toggleLine(l.productId)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.designation}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {p.brand || '—'} • {lang === 'fr' ? 'Stock' : 'المخزون'}: {p.quantity}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          value={l.qty}
                          onChange={e => updateQty(l.productId, Number(e.target.value))}
                          disabled={!l.selected}
                          className="w-20 h-8 text-sm text-center"
                        />
                        <span className="text-[11px] text-muted-foreground w-10 truncate">{p.unit}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT: live preview (also used as JPG source) */}
          <div className="overflow-y-auto border rounded-lg bg-muted/20 p-3">
            <div ref={previewRef} className="bg-white text-black p-6 mx-auto" style={{ width: '100%', maxWidth: '420px', minHeight: '560px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              <div className="flex items-start justify-between mb-4">
                <img src={companyLogo} alt="ERCMsa" style={{ height: 56, width: 'auto' }} />
                {supplier?.image_url ? (
                  <img src={supplier.image_url} alt={supplier.name} style={{ height: 56, width: 56, objectFit: 'contain' }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ height: 56, width: 56, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#64748b' }}>
                    {supplier?.name?.[0] || '?'}
                  </div>
                )}
              </div>
              <h2 style={{ textAlign: 'center', color: '#4263eb', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t.quoteRequest}</h2>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 11, marginBottom: 14 }}>
                {t.ref}: {buildRef()} • {t.date}: {new Date().toLocaleDateString()}
              </p>
              <div style={{ borderTop: '1px solid #4263eb', marginBottom: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 14 }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{t.from}:</p>
                  <p>{t.company}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700 }}>{t.to}:</p>
                  <p>{supplier?.name || '—'}</p>
                  {supplier?.phone && <p>{supplier.phone}</p>}
                  {supplier?.address && <p style={{ maxWidth: 160 }}>{supplier.address}</p>}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#4263eb', color: 'white' }}>
                    <th style={{ padding: 6, textAlign: 'center' }}>#</th>
                    <th style={{ padding: 6, textAlign: 'left' }}>{t.designation}</th>
                    <th style={{ padding: 6, textAlign: 'center' }}>{t.qty}</th>
                    <th style={{ padding: 6, textAlign: 'center' }}>{t.unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLines.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 12, textAlign: 'center', color: '#94a3b8' }}>—</td></tr>
                  ) : selectedLines.map((l, i) => {
                    const p = products.find(pp => pp.id === l.productId)!;
                    return (
                      <tr key={l.productId} style={{ background: i % 2 ? '#f5f7ff' : 'white' }}>
                        <td style={{ padding: 6, textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ padding: 6 }}>{p.designation}{p.brand ? ` (${p.brand})` : ''}</td>
                        <td style={{ padding: 6, textAlign: 'center' }}>{l.qty}</td>
                        <td style={{ padding: 6, textAlign: 'center' }}>{p.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p style={{ fontSize: 10, color: '#475569', marginTop: 16 }}>{t.notes}</p>
              <div style={{ marginTop: 28 }}>
                <p style={{ fontSize: 11, fontWeight: 700 }}>{t.signature}:</p>
                <div style={{ borderBottom: '1px solid #94a3b8', width: '60%', height: 28 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={sendWhatsApp} disabled={generating} className="gap-2">
            <Send className="h-4 w-4" />
            {t.sendWa}
          </Button>
          <Button variant="outline" onClick={exportJPG} disabled={generating} className="gap-2">
            <ImageIcon className="h-4 w-4" />
            {t.exportJpg}
          </Button>
          <Button onClick={exportPDF} disabled={generating} className="gap-2">
            <FileText className="h-4 w-4" />
            {t.exportPdf}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationGenerator;
