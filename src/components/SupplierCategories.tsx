import { useState } from 'react';
import { FolderOpen, Plus, Pencil, Trash2, ArrowRight, ImageIcon } from 'lucide-react';
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

  const save = async () => {
    if (!form.name.trim() || busy) return;
    setBusy(true);
    const data = { ...form, name: form.name.trim(), image_url: form.image_url || null };
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

  return <section className="space-y-5 mb-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold flex items-center gap-2"><FolderOpen className="h-5 w-5 text-primary" />{fr ? 'Catégories' : 'الفئات'} <span className="text-muted-foreground text-sm">({categories.length})</span></h2>
      {canManage && <Button className="gap-2 whitespace-normal h-auto min-h-10 py-2 text-start" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 shrink-0" />{fr ? 'Créer une nouvelle catégorie' : 'إنشاء فئة جديدة'}</Button>}
    </div>
    {categories.length === 0 ? <div className="py-10 text-center border border-dashed rounded-lg text-muted-foreground"><FolderOpen className="h-10 w-10 mx-auto mb-3" /><p>{fr ? 'Aucune catégorie' : 'لا توجد فئات'}</p></div> : <>
      <Input aria-label={fr ? 'Rechercher une catégorie' : 'البحث عن فئة'} placeholder={fr ? 'Rechercher une catégorie…' : 'البحث عن فئة…'} value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.filter(c => `${c.name} ${c.description}`.toLowerCase().includes(search.toLowerCase())).map(category => <Card key={category.id} className="rounded-lg overflow-hidden">
          {category.image_url ? <img src={category.image_url} alt={category.name} className="w-full aspect-[16/9] object-cover" /> : <div className="aspect-[16/9] bg-muted flex items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground" /></div>}
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold break-words">{category.name}</h3>
            {category.description && <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{category.description}</p>}
            <p className="text-sm text-muted-foreground">{categorySupplierIds(links, category.id).length} {fr ? 'fournisseur(s)' : 'مورد'}</p>
            <Button variant="outline" className="w-full gap-2" onClick={() => onConsult(category.id)}>{fr ? 'Consulter' : 'عرض'}<ArrowRight className="h-4 w-4" /></Button>
            {(canManage || isAdmin) && <div className="flex flex-wrap gap-2">
              {canManage && <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setEditing(category.id); setForm({ name: category.name, description: category.description, image_url: category.image_url || '' }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" />{fr ? 'Modifier' : 'تعديل'}</Button>}
              {isAdmin && <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => setDeleting(category)}><Trash2 className="h-3.5 w-3.5" />{fr ? 'Supprimer' : 'حذف'}</Button>}
            </div>}
          </CardContent>
        </Card>)}
      </div>
    </>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? (fr ? 'Modifier la catégorie' : 'تعديل الفئة') : (fr ? 'Créer une nouvelle catégorie' : 'إنشاء فئة جديدة')}</DialogTitle><DialogDescription>{fr ? 'Catégorie fournisseur' : 'فئة الموردين'}</DialogDescription></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="category-name">{fr ? 'Nom de la catégorie' : 'اسم الفئة'}</Label><Input id="category-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="category-description">{fr ? 'Description' : 'الوصف'}</Label><Textarea id="category-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-2"><Label>{fr ? 'Image personnalisée' : 'صورة مخصصة'}</Label><ImageUpload key={editing || 'new'} currentUrl={form.image_url} onUploaded={image_url => setForm(current => ({ ...current, image_url }))} folder="supplier-categories" /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>{fr ? 'Annuler' : 'إلغاء'}</Button><Button type="submit" disabled={busy || !form.name.trim()}>{busy ? '…' : (fr ? 'Enregistrer' : 'حفظ')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!deleting} onOpenChange={value => { if (!value && !busy) setDeleting(null); }}><AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{fr ? 'Supprimer cette catégorie ?' : 'حذف هذه الفئة؟'}</AlertDialogTitle><AlertDialogDescription>{deleting?.name} — {fr ? 'Les fournisseurs seront conservés ; seules leurs associations à cette catégorie seront retirées.' : 'سيتم الاحتفاظ بالموردين وحذف ارتباطهم بهذه الفئة فقط.'}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel disabled={busy}>{fr ? 'Annuler' : 'إلغاء'}</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={remove}>{fr ? 'Supprimer' : 'حذف'}</Button></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </section>;
}