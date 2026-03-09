import { useState } from 'react';
import { ClipboardList, Check, X, Clock, Package, User, Calendar } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { useProfiles } from '@/hooks/useProfiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { WithdrawalRequest } from '@/hooks/useWithdrawalRequests';
import { toast } from 'sonner';

interface WithdrawalRequestsProps {
  requests: WithdrawalRequest[];
  products: Product[];
  employees: Employee[];
  onCreateRequest: (data: { product_id: string; requested_by: string; department: string; quantity: number; reason: string }) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const WithdrawalRequests = ({ requests, products, employees, onCreateRequest, onApprove, onReject }: WithdrawalRequestsProps) => {
  const { t } = useLanguage();
  const { getProfileByUserId } = useProfiles();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', requested_by: '', department: '', quantity: 1, reason: '' });

  const deptLabel = (d: string) => {
    const map: Record<string, string> = {
      production: t.deptProduction, maintenance: t.deptMaintenance, administration: t.deptAdministration,
      montage: t.deptMontage, civil_engineering: t.deptCivilEngineering,
    };
    return map[d] || d;
  };

  const getProductName = (id: string) => products.find((p) => p.id === id)?.designation || '—';

  const statusStyle = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return '';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'pending': return t.reqPending;
      case 'approved': return t.reqApproved;
      case 'rejected': return t.reqRejected;
      default: return s;
    }
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.requested_by || form.quantity < 1) { toast.error(t.fillRequired); return; }
    try {
      await onCreateRequest(form);
      toast.success(t.reqCreated);
      setForm({ product_id: '', requested_by: '', department: '', quantity: 1, reason: '' });
      setOpen(false);
    } catch { toast.error(t.reqCreateFail); }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t.withdrawalRequests} ({requests.length.toLocaleString('fr-FR')})
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-xl text-xs">
                <ClipboardList className="h-3.5 w-3.5" />
                {t.newRequest}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader><DialogTitle>{t.newRequest}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">{t.pdfItem} *</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t.selectItem} /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.designation}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t.reqRequestedBy} *</Label>
                  <Select value={form.requested_by} onValueChange={(v) => {
                    const emp = employees.find((e) => e.full_name === v);
                    setForm({ ...form, requested_by: v, department: emp ? deptLabel(emp.department) : '' });
                  }}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t.responsiblePersonPlaceholder} /></SelectTrigger>
                    <SelectContent>{employees.filter((e) => e.status === 'active').map((e) => <SelectItem key={e.id} value={e.full_name}>{e.full_name} — {deptLabel(e.department)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{t.quantity}</Label>
                    <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">{t.responsibleTeam}</Label>
                    <Input value={form.department} readOnly className="rounded-xl mt-1 bg-muted" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{t.reqReason}</Label>
                  <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t.reqReasonPlaceholder} className="rounded-xl mt-1" maxLength={300} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
                  <Button className="flex-1 rounded-xl" onClick={handleSubmit}>{t.submit}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">{t.noRequests}</p>
          </div>
        ) : (
          requests.map((r) => {
            const creatorProfile = r.created_by ? getProfileByUserId(r.created_by) : null;
            return (
            <div key={r.id} className="rounded-xl border p-3 bg-card hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-sm">{getProductName(r.product_id)}</span>
                    <Badge variant="outline" className="text-xs">{r.quantity.toLocaleString('fr-FR')} {t.unit}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
                    {creatorProfile && (
                      <span className="flex items-center gap-1">
                        <UserAvatar name={creatorProfile.display_name} avatarUrl={creatorProfile.avatar_url} size="sm" />
                      </span>
                    )}
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.requested_by}</span>
                    {r.department && <span>{r.department}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {r.reason && <p className="text-xs text-muted-foreground italic">{r.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${statusStyle(r.status)}`}>{statusLabel(r.status)}</Badge>
                  {r.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50 rounded-lg" onClick={() => onApprove(r.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => onReject(r.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default WithdrawalRequests;
