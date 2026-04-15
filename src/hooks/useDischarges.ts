import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DischargeItem {
  id: string;
  discharge_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

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
  items?: DischargeItem[];
}

export const useDischarges = () => {
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDischarges = useCallback(async () => {
    const { data } = await supabase.from('discharges').select('*').order('created_at', { ascending: false });
    if (!data) return;
    
    // Fetch items for all discharges
    const ids = data.map(d => d.id);
    const { data: items } = await supabase.from('discharge_items').select('*').in('discharge_id', ids.length > 0 ? ids : ['none']);
    
    const dischargesWithItems = (data as Discharge[]).map(d => ({
      ...d,
      items: (items as DischargeItem[] || []).filter(i => i.discharge_id === d.id),
    }));
    
    setDischarges(dischargesWithItems);
  }, []);

  useEffect(() => {
    fetchDischarges().then(() => setIsLoading(false));
  }, [fetchDischarges]);

  const generateReference = async () => {
    const now = new Date();
    const year = now.getFullYear();
    // Get the actual count from the database for the current year
    const { count } = await supabase
      .from('discharges')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31T23:59:59`);
    const nextNum = (count || 0) + 1;
    return `DCH-${nextNum.toString().padStart(4, '0')}-${year}`;
  };

  const createDischarge = async (data: {
    employee_id: string;
    product_id: string;
    quantity: number;
    notes?: string;
    additional_items?: { product_id: string; quantity: number }[];
  }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const reference = await generateReference();
    
    const { data: newDischarge, error } = await supabase.from('discharges').insert({
      employee_id: data.employee_id,
      product_id: data.product_id,
      quantity: data.quantity,
      notes: data.notes,
      reference,
      created_by: user?.id,
    } as any).select().single();

    if (error) throw error;

    // Insert additional items
    if (data.additional_items && data.additional_items.length > 0 && newDischarge) {
      const allItems = [
        { discharge_id: (newDischarge as any).id, product_id: data.product_id, quantity: data.quantity },
        ...data.additional_items.map(item => ({
          discharge_id: (newDischarge as any).id,
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      ];
      await supabase.from('discharge_items').insert(allItems as any);
    } else if (newDischarge) {
      // Single item - still store in discharge_items for consistency
      await supabase.from('discharge_items').insert({
        discharge_id: (newDischarge as any).id,
        product_id: data.product_id,
        quantity: data.quantity,
      } as any);
    }

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
