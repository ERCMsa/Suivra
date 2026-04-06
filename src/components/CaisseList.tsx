import { useState } from 'react';
import { Box, Plus, Trash2, Edit2, CheckCircle, AlertTriangle, XCircle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import type { useCaisses } from '@/hooks/useCaisses';
import type { Product } from '@/hooks/useInventory';

interface Props {
  caisseHook: ReturnType<typeof useCaisses>;
  products: Product[];
  onSelectCaisse: (id: string) => void;
}

const CaisseList = ({ caisseHook, products, onSelectCaisse }: Props) => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const isFr = lang === 'fr';

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await caisseHook.createCaisse(name.trim(), desc.trim());
      toast({ title: isFr ? 'Caisse créée avec succès' : 'تم إنشاء الصندوق بنجاح' });
      setName(''); setDesc(''); setOpen(false);
    } catch { toast({ title: isFr ? 'Erreur' : 'خطأ', variant: 'destructive' }); }
  };

  const handleEdit = async () => {
    if (!editId || !editName.trim()) return;
    try {
      await caisseHook.updateCaisse(editId, { name: editName.trim(), description: editDesc.trim() });
      toast({ title: t.editSuccess });
      setEditOpen(false);
    } catch { toast({ title: t.editFail, variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    try {
      await caisseHook.deleteCaisse(id);
      toast({ title: isFr ? 'Caisse supprimée' : 'تم حذف الصندوق' });
    } catch { toast({ title: isFr ? 'Erreur' : 'خطأ', variant: 'destructive' }); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1"><CheckCircle className="h-3 w-3" />{isFr ? 'Complète' : 'مكتملة'}</Badge>;
      case 'missing': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1"><AlertTriangle className="h-3 w-3" />{isFr ? 'Articles manquants' : 'عناصر ناقصة'}</Badge>;
      case 'damaged': return <Badge className="bg-red-500/10 text-red-600 border-red-200 gap-1"><XCircle className="h-3 w-3" />{isFr ? 'Articles endommagés' : 'عناصر تالفة'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{isFr ? 'Gestion des Caisses' : 'إدارة الصناديق'}</h2>
          <p className="text-sm text-muted-foreground">{isFr ? 'Gérez vos boîtes à outils et leur contenu' : 'إدارة صناديق الأدوات ومحتوياتها'}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {isFr ? 'Nouvelle Caisse' : 'صندوق جديد'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isFr ? 'Créer une nouvelle caisse' : 'إنشاء صندوق جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder={isFr ? 'Nom de la caisse (ex: Caisse 1)' : 'اسم الصندوق (مثال: صندوق 1)'} value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder={isFr ? 'Description (optionnel)' : 'وصف (اختياري)'} value={desc} onChange={e => setDesc(e.target.value)} />
              <Button onClick={handleCreate} className="w-full">{isFr ? 'Créer' : 'إنشاء'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{caisseHook.caisses.filter(c => c.status === 'complete').length}</p>
              <p className="text-xs text-emerald-600">{isFr ? 'Complètes' : 'مكتملة'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{caisseHook.caisses.filter(c => c.status === 'missing').length}</p>
              <p className="text-xs text-amber-600">{isFr ? 'Manquantes' : 'ناقصة'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-700">{caisseHook.caisses.filter(c => c.status === 'damaged').length}</p>
              <p className="text-xs text-red-600">{isFr ? 'Endommagées' : 'تالفة'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Caisse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {caisseHook.caisses.map(caisse => {
          const items = caisseHook.getCaisseItems(caisse.id);
          const totalItems = items.reduce((s, i) => s + i.quantity, 0);
          return (
            <Card key={caisse.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onSelectCaisse(caisse.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Box className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{caisse.name}</CardTitle>
                      {caisse.description && <p className="text-xs text-muted-foreground">{caisse.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditId(caisse.id); setEditName(caisse.name); setEditDesc(caisse.description); setEditOpen(true); }}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                          <AlertDialogDescription>{isFr ? 'Cette caisse et son contenu seront supprimés.' : 'سيتم حذف هذا الصندوق ومحتوياته.'}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(caisse.id)}>{t.delete}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>{items.length} {isFr ? 'types' : 'نوع'} · {totalItems} {isFr ? 'pcs' : 'قطعة'}</span>
                  </div>
                  {getStatusBadge(caisse.status)}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {caisseHook.caisses.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Box className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isFr ? 'Aucune caisse créée' : 'لا توجد صناديق'}</p>
              <p className="text-xs mt-1">{isFr ? 'Commencez par créer votre première caisse' : 'ابدأ بإنشاء أول صندوق'}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isFr ? 'Modifier la caisse' : 'تعديل الصندوق'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={editName} onChange={e => setEditName(e.target.value)} />
            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder={isFr ? 'Description' : 'وصف'} />
            <Button onClick={handleEdit} className="w-full">{t.save}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaisseList;
