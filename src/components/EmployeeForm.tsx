import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { EmployeeFormData } from '@/hooks/useEmployees';
import { toast } from 'sonner';

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => Promise<void>;
}

const EmployeeForm = ({ onSubmit }: EmployeeFormProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<EmployeeFormData>({
    full_name: '',
    employee_id: '',
    department: '',
    position: '',
    phone: '',
    email: '',
    status: 'active',
    notes: '',
  });

  const departments = [
    { value: 'production', label: t.deptProduction },
    { value: 'maintenance', label: t.deptMaintenance },
    { value: 'administration', label: t.deptAdministration },
    { value: 'montage', label: t.deptMontage },
    { value: 'civil_engineering', label: t.deptCivilEngineering },
  ];

  const statuses = [
    { value: 'active', label: t.empStatusActive },
    { value: 'inactive', label: t.empStatusInactive },
    { value: 'on_leave', label: t.empStatusOnLeave },
  ];

  const handleSubmit = async () => {
    if (!form.full_name || !form.department) {
      toast.error(t.fillRequired);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      toast.success(t.employeeAdded);
      setForm({ full_name: '', employee_id: '', department: '', position: '', phone: '', email: '', status: 'active', notes: '' });
      setOpen(false);
    } catch {
      toast.error(t.employeeAddFail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 rounded-xl">
          <UserPlus className="h-4 w-4" />
          {t.addEmployee}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.addEmployee}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{t.empFullName} *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder={t.empFullNamePlaceholder}
              className="rounded-xl mt-1"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.empDepartment} *</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder={t.selectDepartment} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.empId}</Label>
              <Input
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                placeholder={t.empIdPlaceholder}
                className="rounded-xl mt-1"
                maxLength={50}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.empPosition}</Label>
              <Input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder={t.empPositionPlaceholder}
                className="rounded-xl mt-1"
                maxLength={100}
              />
            </div>
            <div>
              <Label>{t.empStatus}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.empPhone}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.empPhonePlaceholder}
                className="rounded-xl mt-1"
                maxLength={20}
              />
            </div>
            <div>
              <Label>{t.empEmail}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t.empEmailPlaceholder}
                className="rounded-xl mt-1"
                maxLength={100}
              />
            </div>
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
            <Button className="flex-1 rounded-xl" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t.loading : t.addEmployee}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeForm;
