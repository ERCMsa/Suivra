import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Building2, Briefcase, FileCheck, Package, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmployees } from '@/hooks/useEmployees';
import { useDischarges } from '@/hooks/useDischarges';
import { useInventory } from '@/hooks/useInventory';
import { useLanguage } from '@/hooks/useLanguage';

const EmployeeProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { employees } = useEmployees();
  const { discharges } = useDischarges();
  const { products } = useInventory();

  const employee = employees.find(e => e.id === id);
  const empDischarges = discharges.filter(d => d.employee_id === id);
  const activeDischarges = empDischarges.filter(d => d.status === 'active');
  const returnedDischarges = empDischarges.filter(d => d.status === 'returned');

  const getProduct = (pid: string) => products.find(p => p.id === pid);

  if (!employee) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate('/employees')}>
            <ArrowLeft className="h-4 w-4" /> {t.navEmployees}
          </Button>
          <p className="text-muted-foreground text-center py-12">{t.noEmployees}</p>
        </main>
      </div>
    );
  }

  const statusColor = employee.status === 'active' ? 'bg-green-100 text-green-800' : employee.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  // Collect all items from discharges (including multi-item)
  const getDischargeItems = (d: typeof empDischarges[0]) => {
    if (d.items && d.items.length > 0) return d.items;
    return [{ product_id: d.product_id, quantity: d.quantity }];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
        <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => navigate('/employees')}>
          <ArrowLeft className="h-4 w-4" /> {t.navEmployees}
        </Button>

        {/* Employee Info Card */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-6 flex-wrap">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{employee.full_name}</h1>
                  <Badge className={statusColor}>
                    {employee.status === 'active' ? t.empStatusActive : employee.status === 'on_leave' ? t.empStatusOnLeave : t.empStatusInactive}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {employee.employee_id && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" /> #{employee.employee_id}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {employee.department}
                  </div>
                  {employee.position && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" /> {employee.position}
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" /> {employee.phone}
                    </div>
                  )}
                  {employee.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" /> {employee.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{empDischarges.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.totalDischarges}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{activeDischarges.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.currentEquipment}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{returnedDischarges.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.returnedEquipment}</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Equipment */}
        {activeDischarges.length > 0 && (
          <Card className="rounded-2xl border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-700">
                <Package className="h-5 w-5" />
                {t.currentEquipment}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50/50">
                      <TableHead className="text-center text-xs">{t.dischargeRef}</TableHead>
                      <TableHead className="text-center text-xs">{t.designation}</TableHead>
                      <TableHead className="text-center text-xs">{t.quantity}</TableHead>
                      <TableHead className="text-center text-xs">{t.takenOn}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDischarges.flatMap(d =>
                      getDischargeItems(d).map((item, idx) => {
                        const prod = getProduct(item.product_id);
                        return (
                          <TableRow key={`${d.id}-${idx}`}>
                            <TableCell className="text-center text-xs font-mono">{d.reference}</TableCell>
                            <TableCell className="text-center text-sm font-medium">{prod?.designation || '-'}</TableCell>
                            <TableCell className="text-center text-sm font-semibold">{item.quantity}</TableCell>
                            <TableCell className="text-center text-xs">{new Date(d.date_out).toLocaleDateString('fr-FR')}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Discharge History */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-5 w-5 text-primary" />
              {t.dischargeHistory} ({empDischarges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {empDischarges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.noDischarges}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30">
                      <TableHead className="text-center text-xs">{t.dischargeRef}</TableHead>
                      <TableHead className="text-center text-xs">{t.designation}</TableHead>
                      <TableHead className="text-center text-xs">{t.quantity}</TableHead>
                      <TableHead className="text-center text-xs">{t.takenOn}</TableHead>
                      <TableHead className="text-center text-xs">{t.returnedOn}</TableHead>
                      <TableHead className="text-center text-xs">{t.empStatus}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empDischarges.flatMap(d =>
                      getDischargeItems(d).map((item, idx) => {
                        const prod = getProduct(item.product_id);
                        const isActive = d.status === 'active';
                        return (
                          <TableRow key={`${d.id}-${idx}`} className="hover:bg-secondary/20">
                            <TableCell className="text-center text-xs font-mono">{d.reference}</TableCell>
                            <TableCell className="text-center text-sm">{prod?.designation || '-'}</TableCell>
                            <TableCell className="text-center text-sm font-semibold">{item.quantity}</TableCell>
                            <TableCell className="text-center text-xs">{new Date(d.date_out).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell className="text-center text-xs">{d.date_returned ? new Date(d.date_returned).toLocaleDateString('fr-FR') : '-'}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={isActive ? 'bg-amber-100 text-amber-800 text-xs' : 'bg-green-100 text-green-800 text-xs'}>
                                {isActive ? t.dischargeActive : t.dischargeReturnedStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmployeeProfile;
