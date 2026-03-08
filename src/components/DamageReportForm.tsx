import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Product } from '@/hooks/useInventory';
import { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';

interface DamageReportFormProps {
  products: Product[];
  employees: Employee[];
  onSubmit: (data: {
    product_id: string;
    description: string;
    severity: string;
    responsible_person: string;
    responsible_team: string;
    quantity_damaged: number;
    action_taken: string;
    notes: string;
  }) => Promise<any>;
}

const DamageReportForm = ({ products, employees, onSubmit }: DamageReportFormProps) => {
  const { t } = useLanguage();

  const deptLabel = (d: string) => {
    const map: Record<string, string> = {
      production: t.deptProduction,
      maintenance: t.deptMaintenance,
      administration: t.deptAdministration,
      montage: t.deptMontage,
      civil_engineering: t.deptCivilEngineering,
    };
    return map[d] || d;
  };
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    description: '',
    severity: 'medium',
    responsible_person: '',
    responsible_team: '',
    quantity_damaged: 1,
    action_taken: '',
    notes: '',
  });

  const severities = [
    { value: 'low', label: t.severityLow },
    { value: 'medium', label: t.severityMedium },
    { value: 'high', label: t.severityHigh },
    { value: 'critical', label: t.severityCritical },
  ];

  const handleSubmit = async () => {
    if (!form.product_id || !form.description) {
      toast.error(t.fillRequired);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      toast.success(t.damageReportAdded);
      setForm({
        product_id: '',
        description: '',
        severity: 'medium',
        responsible_person: '',
        responsible_team: '',
        quantity_damaged: 1,
        action_taken: '',
        notes: '',
      });
      setOpen(false);
    } catch {
      toast.error(t.damageReportFail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2 rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          {t.reportDamage}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t.reportDamage}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{t.damagedItem} *</Label>
            <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
              <SelectTrigger className="rounded-xl mt-1">
                <SelectValue placeholder={t.selectItem} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.designation}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t.damageDescription} *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t.damageDescPlaceholder}
              className="rounded-xl mt-1"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.damageSeverity}</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severities.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.quantityDamaged}</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity_damaged}
                onChange={(e) => setForm({ ...form, quantity_damaged: Number(e.target.value) })}
                className="rounded-xl mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.responsiblePerson}</Label>
              <Select
                value={form.responsible_person}
                onValueChange={(v) => {
                  const emp = employees.find((e) => e.full_name === v);
                  setForm({
                    ...form,
                    responsible_person: v,
                    responsible_team: emp ? deptLabel(emp.department) : form.responsible_team,
                  });
                }}
              >
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder={t.responsiblePersonPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => e.status === 'active').map((e) => (
                    <SelectItem key={e.id} value={e.full_name}>
                      {e.full_name} — {deptLabel(e.department)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.responsibleTeam}</Label>
              <Input
                value={form.responsible_team}
                readOnly
                className="rounded-xl mt-1 bg-muted"
              />
            </div>
          </div>

          <div>
            <Label>{t.actionTaken}</Label>
            <Textarea
              value={form.action_taken}
              onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
              placeholder={t.actionTakenPlaceholder}
              className="rounded-xl mt-1"
              maxLength={500}
            />
          </div>

          <div>
            <Label>{t.notes}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t.notesPlaceholder}
              className="rounded-xl mt-1"
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? t.loading : t.submitDamageReport}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DamageReportForm;
