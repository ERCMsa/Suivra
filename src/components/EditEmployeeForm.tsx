import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

interface EditEmployeeFormProps {
  employee: Employee;
  onUpdated: () => void;
}

const EditEmployeeForm = ({ employee, onUpdated }: EditEmployeeFormProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: employee.full_name,
    employee_id: employee.employee_id || '',
    department: employee.department,
    position: employee.position || '',
    phone: employee.phone || '',
    email: employee.email || '',
    status: employee.status,
    notes: employee.notes || '',
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
    if (!form.full_name || !form.department) { toast.error(t.fillRequired); return; }
    const { error } = await supabase.from('employees').update(form as any).eq('id', employee.id);
    if (error) { toast.error(t.editFail); return; }
    toast.success(t.editSuccess);
    setOpen(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>{t.editEmployee}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">{t.empFullName} *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-xl mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t.empDepartment} *</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t.empStatus}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t.empPosition}</Label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t.empId}</Label>
              <Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="rounded-xl mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t.empPhone}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t.empEmail}</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t.notes}</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl mt-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button className="flex-1 rounded-xl" onClick={handleSubmit}>{t.save}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeForm;
