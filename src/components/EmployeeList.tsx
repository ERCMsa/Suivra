import { Users, Phone, Mail, Trash2, Building2, User, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { Employee } from '@/hooks/useEmployees';
import EditEmployeeForm from './EditEmployeeForm';
import { useState } from 'react';
import { toast } from 'sonner';

interface EmployeeListProps {
  employees: Employee[];
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const EmployeeList = ({ employees, onDelete, onRefresh }: EmployeeListProps) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const exportEmployeesExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows = employees.map((e) => ({
        [t.empFullName]: e.full_name,
        [t.empId]: e.employee_id || '',
        [t.empDepartment]: deptLabel(e.department),
        [t.empPosition]: e.position || '',
        [t.empPhone]: e.phone || '',
        [t.empEmail]: e.email || '',
        [t.empStatus]: statusLabel(e.status),
        [t.notes]: e.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      XLSX.writeFile(wb, `employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(t.exportSuccess);
    } catch {
      toast.error(t.exportFail);
    }
  };

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

  const deptColor = (d: string) => {
    const map: Record<string, string> = {
      production: 'bg-blue-100 text-blue-800 border-blue-300',
      maintenance: 'bg-amber-100 text-amber-800 border-amber-300',
      administration: 'bg-purple-100 text-purple-800 border-purple-300',
      montage: 'bg-green-100 text-green-800 border-green-300',
      civil_engineering: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return map[d] || 'bg-muted text-muted-foreground';
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: t.empStatusActive,
      inactive: t.empStatusInactive,
      on_leave: t.empStatusOnLeave,
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
    };
    return map[s] || '';
  };

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by department
  const grouped = filtered.reduce<Record<string, Employee[]>>((acc, e) => {
    if (!acc[e.department]) acc[e.department] = [];
    acc[e.department].push(e);
    return acc;
  }, {});

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            {t.employeeList} ({employees.length.toLocaleString('fr-FR')})
          </CardTitle>
          <Input
            placeholder={t.searchEmployee}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs rounded-xl text-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">{employees.length === 0 ? t.noEmployees : t.noSearchResults}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dept, emps]) => (
              <div key={dept}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">{deptLabel(dept)}</h3>
                  <Badge variant="secondary" className="text-xs">{emps.length.toLocaleString('fr-FR')}</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {emps.map((emp) => (
                    <div key={emp.id} className="rounded-xl border p-3 bg-card hover:shadow-sm transition-shadow space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{emp.full_name}</p>
                            {emp.position && <p className="text-xs text-muted-foreground">{emp.position}</p>}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <EditEmployeeForm employee={emp} onUpdated={onRefresh} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                              <AlertDialogDescription>{t.deleteEmployeeConfirm}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground" onClick={() => onDelete(emp.id)}>
                                {t.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge className={`text-xs ${deptColor(emp.department)}`}>{deptLabel(emp.department)}</Badge>
                        <Badge className={`text-xs ${statusColor(emp.status)}`}>{statusLabel(emp.status)}</Badge>
                        {emp.employee_id && <Badge variant="outline" className="text-xs">#{emp.employee_id}</Badge>}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {emp.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {emp.phone}
                          </span>
                        )}
                        {emp.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {emp.email}
                          </span>
                        )}
                      </div>

                      {emp.notes && <p className="text-xs text-muted-foreground italic">{emp.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeList;
