import { useState } from 'react';
import { FolderOpen, Plus, Pencil, Trash2, ArrowRight, ImageIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import ImageUpload from '@/components/ImageUpload';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import type { SupplierCategory } from '@/hooks/useSuppliers';
import { categorySupplierIds, type CategoryLink } from '@/lib/supplierCategories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const empty = { name: '', description: '', image_url: '' };

export default function SupplierCategories({ categories, links, refresh, onConsult }: {
  categories: SupplierCategory[]; links: CategoryLink[]; refresh: () => Promise<void>; onConsult: (id: string) => void;
}) {
  const { lang } = useLanguage();
  const { canViewPurchases: canManage, isAdmin } = usePermissions();
  const fr = lang === 'fr';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<SupplierCategory | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const startCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  };

  const startEdit = (category: SupplierCategory) => {
    setEditing(category.id);
    setForm({ name: category.name, description: category.description, image_url: category.image_url || '' });
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name || busy) return;
    setBusy(true);
    const data = { name, description: form.description.trim(), image_url: form.image_url || null };
    const result = editing
      ? await supabase.from('supplier_categories').update(data).eq('id', editing).select('id').single()
      : await supabase.from('supplier_categories').insert(data).select('id').single();
    if (result.error) toast.error(result.error.message);
    else { await refresh(); setOpen(false); toast.success(fr ? 'Catégorie enregistrée' : 'تم حفظ الفئة'); }
    setBusy(false);
  };

  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    const { data, error } = await supabase.from('supplier_categories').delete().eq('id', deleting.id).select('id').single();
    if (error) toast.error(error.message);
    else if (data) { await refresh(); setDeleting(null); toast.success(fr ? 'Catégorie supprimée' : 'تم حذف الفئة'); }
    setBusy(false);
  };

  const visibleCategories = categories.filter(category =>
    `${category.name} ${category.description}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const deletingCount = deleting ? categorySupplierIds(links, deleting.id).length : 0;

  return <section className="space-y-5 mb-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold flex items-center gap-2"><FolderOpen className="h-5 w-5 text-primary" />{fr ? 'Catégories' : 'الفئات'} <span className="text-muted-foreground text-sm">({categories.length})</span></h2>
      {canManage && categories.length > 0 && <Button size="lg" className="w-full sm:w-auto gap-2" onClick={startCreate}><Plus className="h-5 w-5" />{fr ? 'Créer une nouvelle catégorie' : 'إنشاء فئة جديدة'}</Button>}
    </div>
    {categories.length === 0 ? <div className="rounded-xl border-2 border-dashed px-6 py-12 text-center">
      <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
      <p className="font-medium">{fr ? 'Aucune catégorie pour le moment' : 'لا توجد فئات حالياً'}</p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">{fr ? 'Créez votre première catégorie pour organiser vos fournisseurs. Vous choisissez librement son nom, sa description et son image.' : 'أنشئ فئتك الأولى لتنظيم الموردين. اختر الاسم والوصف والصورة بحرية.'}</p>
      {canManage
        ? <Button size="lg" className="mt-5 gap-2" onClick={startCreate}><Plus className="h-5 w-5" />{fr ? 'Créer une nouvelle catégorie' : 'إنشاء فئة جديدة'}</Button>
        : <p className="text-xs text-muted-foreground mt-4">{fr ? 'Un administrateur ou un magasinier peut créer des catégories.' : 'يمكن للمسؤول أو أمين المخزن إنشاء الفئات.'}</p>}
    </div> : <>
      {categories.length > 3 && <Input aria-label={fr ? 'Rechercher une catégorie' : 'البحث عن فئة'} placeholder={fr ? 'Rechercher une catégorie…' : 'البحث عن فئة…'} value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCategories.map(category => {
          const supplierCount = categorySupplierIds(links, category.id).length;
          return <Card key={category.id} className="rounded-xl overflow-hidden flex flex-col">
            {category.image_url
              ? <img src={category.image_url} alt={category.name} className="w-full aspect-[16/9] object-cover" />
              : <div className="aspect-[16/9] bg-muted flex items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground" /></div>}
            <CardContent className="p-4 flex flex-col gap-3 flex-1">
              <div className="space-y-1.5 flex-1">
                <h3 className="font-semibold break-words">{category.name}</h3>
                {category.description
                  ? <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{category.description}</p>
                  : <p className="text-sm text-muted-foreground italic">{fr ? 'Aucune description' : 'لا يوجد وصف'}</p>}
                <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Users className="h-4 w-4 shrink-0" />{supplierCount} {fr ? (supplierCount === 1 ? 'fournisseur associé' : 'fournisseurs associés') : 'مورد مرتبط'}</p>
              </div>
              <Button className="w-full gap-2" onClick={() => onConsult(category.id)}>{fr ? 'Consulter' : 'عرض'}<ArrowRight className="h-4 w-4" /></Button>
              {(canManage || isAdmin) && <div className="flex flex-wrap gap-2">
                {canManage && <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => startEdit(category)}><Pencil className="h-3.5 w-3.5" />{fr ? 'Modifier' : 'تعديل'}</Button>}
                {isAdmin && <Button variant="outline" size="sm" className="flex-1 gap-1 text-destructive hover:text-destructive" onClick={() => setDeleting(category)}><Trash2 className="h-3.5 w-3.5" />{fr ? 'Supprimer' : 'حذف'}</Button>}
              </div>}
            </CardContent>
          </Card>;
        })}
      </div>
      {visibleCategories.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">{fr ? 'Aucune catégorie ne correspond à votre recherche.' : 'لا توجد فئة تطابق بحثك.'}</p>}
    </>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? (fr ? 'Modifier la catégorie' : 'تعديل الفئة') : (fr ? 'Créer une nouvelle catégorie' : 'إنشاء فئة جديدة')}</DialogTitle><DialogDescription>{fr ? 'Catégorie fournisseur' : 'فئة الموردين'}</DialogDescription></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="category-name">{fr ? 'Nom de la catégorie' : 'اسم الفئة'}</Label><Input id="category-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="category-description">{fr ? 'Description' : 'الوصف'}</Label><Textarea id="category-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>{fr ? 'Image personnalisée' : 'صورة مخصصة'}</Label>
            <ImageUpload key={editing || 'new'} currentUrl={form.image_url} onUploaded={image_url => setForm(current => ({ ...current, image_url }))} folder="supplier-categories" previewClassName="w-full max-w-xs aspect-[16/9] rounded-xl" />
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>{fr ? 'Annuler' : 'إلغاء'}</Button><Button type="submit" disabled={busy || !form.name.trim()}>{busy ? '…' : (fr ? 'Enregistrer' : 'حفظ')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!deleting} onOpenChange={value => { if (!value && !busy) setDeleting(null); }}><AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{fr ? 'Supprimer cette catégorie ?' : 'حذف هذه الفئة؟'}</AlertDialogTitle><AlertDialogDescription>{deleting?.name} — {deletingCount > 0
        ? (fr ? `${deletingCount} fournisseur(s) seront conservés ; seules leurs associations à cette catégorie seront retirées.` : `سيتم الاحتفاظ بـ ${deletingCount} مورد وحذف ارتباطهم بهذه الفئة فقط.`)
        : (fr ? 'Cette catégorie est vide. Les fournisseurs ne seront pas modifiés.' : 'هذه الفئة فارغة. لن يتم تعديل الموردين.')}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel disabled={busy}>{fr ? 'Annuler' : 'إلغاء'}</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={remove}>{fr ? 'Supprimer' : 'حذف'}</Button></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </section>;
}
