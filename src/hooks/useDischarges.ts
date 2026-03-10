import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Discharge {
  id: string;
  reference: string;
  employee_id: string;
  product_id: string;
  quantity: number;
  date_out: string;
  date_returned: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useDischarges = () => {
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDischarges = useCallback(async () => {
    const { data } = await supabase.from('discharges').select('*').order('created_at', { ascending: false });
    if (data) setDischarges(data as Discharge[]);
  }, []);

  useEffect(() => {
    fetchDischarges().then(() => setIsLoading(false));
  }, [fetchDischarges]);

  const generateReference = (employeeId: string) => {
    const now = new Date();
    const count = discharges.filter(d => d.employee_id === employeeId).length + 1;
    return `dch_${count.toString().padStart(3, '0')}_${now.getFullYear()}`;
  };

  const createDischarge = async (data: {
    employee_id: string;
    product_id: string;
    quantity: number;
    notes?: string;
  }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const reference = generateReference(data.employee_id);
    
    const { data: newDischarge, error } = await supabase.from('discharges').insert({
      ...data,
      reference,
      created_by: user?.id,
    } as any).select().single();

    if (error) throw error;
    await fetchDischarges();
    return newDischarge as Discharge;
  };

  const markReturned = async (id: string) => {
    const { error } = await supabase.from('discharges').update({
      status: 'returned',
      date_returned: new Date().toISOString(),
    } as any).eq('id', id);
    if (error) throw error;
    await fetchDischarges();
  };

  return { discharges, isLoading, createDischarge, markReturned, fetchDischarges };
};
