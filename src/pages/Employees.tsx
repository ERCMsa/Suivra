import Header from '@/components/Header';
import EmployeeForm from '@/components/EmployeeForm';
import EmployeeList from '@/components/EmployeeList';
import { useEmployees } from '@/hooks/useEmployees';
import { useLanguage } from '@/hooks/useLanguage';

const Employees = () => {
  const { t } = useLanguage();
  const { employees, isLoading, addEmployee, deleteEmployee, fetchEmployees } = useEmployees();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t.employeesSection}</h2>
          <EmployeeForm onSubmit={addEmployee} />
        </div>
        <EmployeeList employees={employees} onDelete={deleteEmployee} />
      </main>
      <footer className="border-t border-border/50 py-5 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground/60">
          {t.footer} © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Employees;
