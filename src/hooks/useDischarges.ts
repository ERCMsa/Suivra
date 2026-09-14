import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DischargeItem {
  id: string;
  discharge_id: string;
  product_id: string;
  quantity: number;
  returned_quantity: number;
  return_condition?: string | null;
  return_observation?: string | null;
  returned_at?: string | null;
  created_at: string;
}

export interface Discharge {
  id: string;
  reference: string;
  return_reference?: string | null;
  employee_id: string;
  product_id: string;
  quantity: number;
  date_out: string;
  date_returned: string | null;
  status: string;
  notes: string | null;
  project: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: DischargeItem[];
}

export const useDischarges = () => {
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDischarges = useCallback(async () => {
    const PAGE = 1000;

    // Fetch all discharges (paginated — PostgREST caps each request at 1000 rows)
    const allDischarges: Discharge[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('discharges')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error || !data) break;
      allDischarges.push(...(data as Discharge[]));
      if (data.length < PAGE) break;
    }

    // Fetch ALL items (paginated) so discharges never lose rows to the 1000-row cap
    const allItems: DischargeItem[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('discharge_items')
        .select('*')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error || !data) break;
      allItems.push(...(data as DischargeItem[]));
      if (data.length < PAGE) break;
    }

    const byDischarge = new Map<string, DischargeItem[]>();
    for (const it of allItems) {
      const list = byDischarge.get(it.discharge_id);
      if (list) list.push(it);
      else byDischarge.set(it.discharge_id, [it]);
    }

    setDischarges(allDischarges.map(d => ({ ...d, items: byDischarge.get(d.id) || [] })));
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
    project?: string;
    additional_items?: { product_id: string; quantity: number }[];
  }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const reference = await generateReference();
    
    const { data: newDischarge, error } = await supabase.from('discharges').insert({
      employee_id: data.employee_id,
      product_id: data.product_id,
      quantity: data.quantity,
      notes: data.notes,
      project: data.project,
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
    // Mark all items as fully returned
    const { data: items } = await supabase.from('discharge_items').select('*').eq('discharge_id', id);
    if (items) {
      for (const it of items as any[]) {
        await supabase.from('discharge_items').update({ returned_quantity: it.quantity } as any).eq('id', it.id);
      }
    }
    const { error } = await supabase.from('discharges').update({
      status: 'returned',
      date_returned: new Date().toISOString(),
    } as any).eq('id', id);
    if (error) throw error;
    await fetchDischarges();
  };

  const generateReturnReference = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const { count } = await supabase
      .from('discharges')
      .select('return_reference', { count: 'exact', head: true })
      .not('return_reference', 'is', null)
      .gte('updated_at', `${year}-01-01`)
      .lte('updated_at', `${year}-12-31T23:59:59`);
    const nextNum = (count || 0) + 1;
    return `BR-${nextNum.toString().padStart(4, '0')}-${year}`;
  };

  const partialReturn = async (
    dischargeId: string,
    returns: { item_id: string; product_id: string; quantity: number; new_returned_total: number; condition?: string; observation?: string }[]
  ): Promise<string | null> => {
    const nowIso = new Date().toISOString();
    for (const r of returns) {
      const update: any = { returned_quantity: r.new_returned_total, returned_at: nowIso };
      if (r.condition !== undefined) update.return_condition = r.condition;
      if (r.observation !== undefined) update.return_observation = r.observation;
      await supabase.from('discharge_items').update(update).eq('id', r.item_id);
    }
    const { data: allItems } = await supabase.from('discharge_items').select('*').eq('discharge_id', dischargeId);
    let returnRef: string | null = null;
    if (allItems) {
      const totalQty = (allItems as any[]).reduce((s, i) => s + Number(i.quantity), 0);
      const totalReturned = (allItems as any[]).reduce((s, i) => s + Number(i.returned_quantity || 0), 0);
      let newStatus = 'active';
      let dateReturned: string | null = null;
      if (totalReturned >= totalQty) {
        newStatus = 'returned';
        dateReturned = nowIso;
      } else if (totalReturned > 0) {
        newStatus = 'partially_returned';
      }
      const { data: dch } = await supabase.from('discharges').select('return_reference').eq('id', dischargeId).single();
      returnRef = (dch as any)?.return_reference || await generateReturnReference();
      await supabase.from('discharges').update({ status: newStatus, date_returned: dateReturned, return_reference: returnRef } as any).eq('id', dischargeId);
    }
    await fetchDischarges();
    return returnRef;
  };

  const updateDischarge = async (
    id: string,
    data: {
      employee_id?: string;
      project?: string | null;
      notes?: string | null;
      date_out?: string;
      items?: { id?: string; product_id: string; quantity: number }[];
    },
    onStockAdjust?: (productId: string, delta: number) => Promise<void>
  ) => {
    // Update main discharge record
    const updates: any = {};
    if (data.employee_id !== undefined) updates.employee_id = data.employee_id;
    if (data.project !== undefined) updates.project = data.project;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.date_out !== undefined) updates.date_out = data.date_out;
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('discharges').update(updates).eq('id', id);
      if (error) throw error;
    }

    // Update items if provided: compute deltas and adjust stock
    if (data.items) {
      const { data: existing } = await supabase.from('discharge_items').select('*').eq('discharge_id', id);
      const existingItems = (existing as any[]) || [];

      // For each new item, compare to existing
      for (const newItem of data.items) {
        const match = newItem.id ? existingItems.find(e => e.id === newItem.id) : null;
        if (match) {
          const delta = Number(newItem.quantity) - Number(match.quantity);
          if (delta !== 0) {
            await supabase.from('discharge_items').update({ quantity: newItem.quantity } as any).eq('id', match.id);
            if (onStockAdjust) await onStockAdjust(newItem.product_id, -delta); // delta positive = take more out
          }
        } else {
          // New item added
          await supabase.from('discharge_items').insert({
            discharge_id: id,
            product_id: newItem.product_id,
            quantity: newItem.quantity,
          } as any);
          if (onStockAdjust) await onStockAdjust(newItem.product_id, -newItem.quantity);
        }
      }

      // Remove items that no longer exist
      const keepIds = data.items.filter(i => i.id).map(i => i.id);
      for (const ex of existingItems) {
        if (!keepIds.includes(ex.id)) {
          await supabase.from('discharge_items').delete().eq('id', ex.id);
          if (onStockAdjust) await onStockAdjust(ex.product_id, Number(ex.quantity)); // restore
        }
      }

      // Sync the legacy product_id/quantity columns on discharges to first item
      const first = data.items[0];
      if (first) {
        await supabase.from('discharges').update({ product_id: first.product_id, quantity: first.quantity } as any).eq('id', id);
      }
    }

    await fetchDischarges();
  };

  return { discharges, isLoading, createDischarge, markReturned, partialReturn, updateDischarge, fetchDischarges };
};
