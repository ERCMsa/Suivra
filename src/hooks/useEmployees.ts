import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  full_name: string;
  employee_id: string | null;
  department: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  full_name: string;
  employee_id: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  status: string;
  notes: string;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (data) setEmployees(data as Employee[]);
  }, []);

  useEffect(() => {
    fetchEmployees().then(() => setIsLoading(false));
  }, [fetchEmployees]);

  const addEmployee = async (data: EmployeeFormData) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('employees').insert({
      ...data,
      created_by: user?.id,
    } as any);
    if (error) throw error;
    await fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
    await fetchEmployees();
  };

  const bulkImportEmployees = async (items: EmployeeFormData[]) => {
    const user = (await supabase.auth.getUser()).data.user;
    for (const data of items) {
      await supabase.from('employees').insert({
        ...data,
        created_by: user?.id,
      } as any);
    }
    await fetchEmployees();
  };

  return { employees, isLoading, addEmployee, deleteEmployee, bulkImportEmployees, fetchEmployees };
};
