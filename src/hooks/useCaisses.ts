import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Caisse {
  id: string;
  name: string;
  description: string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaisseItem {
  id: string;
  caisse_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CaisseMovement {
  id: string;
  caisse_id: string;
  product_id: string;
  type: string; // 'add' | 'remove' | 'damage' | 'replace' | 'return_stock' | 'init'
  quantity: number;
  reason: string | null;
  responsible_person: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export const useCaisses = () => {
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [caisseItems, setCaisseItems] = useState<CaisseItem[]>([]);
  const [movements, setMovements] = useState<CaisseMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCaisses = useCallback(async () => {
    const { data } = await supabase.from('caisses').select('*').order('name');
    if (data) setCaisses(data as Caisse[]);
  }, []);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from('caisse_items').select('*');
    if (data) setCaisseItems(data as CaisseItem[]);
  }, []);

  const fetchMovements = useCallback(async () => {
    const { data } = await supabase.from('caisse_movements').select('*').order('created_at', { ascending: false });
    if (data) setMovements(data as CaisseMovement[]);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchCaisses(), fetchItems(), fetchMovements()]);
  }, [fetchCaisses, fetchItems, fetchMovements]);

  useEffect(() => {
    refresh().then(() => setIsLoading(false));
  }, [refresh]);

  const createCaisse = async (name: string, description?: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('caisses').insert({
      name,
      description: description || '',
      created_by: user?.id,
    } as any);
    if (error) throw error;
    await fetchCaisses();
  };

  const updateCaisse = async (id: string, data: { name?: string; description?: string; status?: string }) => {
    const { error } = await supabase.from('caisses').update(data as any).eq('id', id);
    if (error) throw error;
    await fetchCaisses();
  };

  const deleteCaisse = async (id: string) => {
    const { error } = await supabase.from('caisses').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const addItemToCaisse = async (
    caisseId: string,
    productId: string,
    quantity: number,
    responsiblePerson: string,
    deductFromStock: boolean = true,
    notes?: string,
    type: string = 'add'
  ) => {
    const user = (await supabase.auth.getUser()).data.user;

    // Check if item already exists in caisse
    const existing = caisseItems.find(i => i.caisse_id === caisseId && i.product_id === productId);
    if (existing) {
      await supabase.from('caisse_items').update({
        quantity: existing.quantity + quantity,
      } as any).eq('id', existing.id);
    } else {
      await supabase.from('caisse_items').insert({
        caisse_id: caisseId,
        product_id: productId,
        quantity,
      } as any);
    }

    // Log movement
    await supabase.from('caisse_movements').insert({
      caisse_id: caisseId,
      product_id: productId,
      type,
      quantity,
      responsible_person: responsiblePerson,
      notes,
      created_by: user?.id,
    } as any);

    // Deduct from main stock if needed
    if (deductFromStock) {
      const { data: product } = await supabase.from('products').select('quantity, length, width').eq('id', productId).single();
      if (product) {
        const newQty = Math.max(0, product.quantity - quantity);
        const newSurface = parseFloat((newQty * product.length * product.width).toFixed(2));
        await supabase.from('products').update({ quantity: newQty, surface: newSurface }).eq('id', productId);
      }
    }

    await refresh();
  };

  const removeItemFromCaisse = async (
    caisseId: string,
    productId: string,
    quantity: number,
    responsiblePerson: string,
    returnToStock: boolean = false,
    reason?: string
  ) => {
    const user = (await supabase.auth.getUser()).data.user;
    const existing = caisseItems.find(i => i.caisse_id === caisseId && i.product_id === productId);
    if (!existing) return;

    const newQty = existing.quantity - quantity;
    if (newQty <= 0) {
      await supabase.from('caisse_items').delete().eq('id', existing.id);
    } else {
      await supabase.from('caisse_items').update({ quantity: newQty } as any).eq('id', existing.id);
    }

    await supabase.from('caisse_movements').insert({
      caisse_id: caisseId,
      product_id: productId,
      type: 'remove',
      quantity,
      responsible_person: responsiblePerson,
      reason,
      created_by: user?.id,
    } as any);

    if (returnToStock) {
      const { data: product } = await supabase.from('products').select('quantity, length, width').eq('id', productId).single();
      if (product) {
        const newStockQty = product.quantity + quantity;
        const newSurface = parseFloat((newStockQty * product.length * product.width).toFixed(2));
        await supabase.from('products').update({ quantity: newStockQty, surface: newSurface }).eq('id', productId);
      }
    }

    await refresh();
  };

  const reportDamage = async (
    caisseId: string,
    productId: string,
    quantity: number,
    responsiblePerson: string,
    reason: string,
    destination: 'maintenance' | 'stock',
    replacementProductId?: string,
    replacementQuantity?: number
  ) => {
    const user = (await supabase.auth.getUser()).data.user;

    // Remove damaged item from caisse
    const existing = caisseItems.find(i => i.caisse_id === caisseId && i.product_id === productId);
    if (existing) {
      const newQty = existing.quantity - quantity;
      if (newQty <= 0) {
        await supabase.from('caisse_items').delete().eq('id', existing.id);
      } else {
        await supabase.from('caisse_items').update({ quantity: newQty } as any).eq('id', existing.id);
      }
    }

    // Log damage movement
    await supabase.from('caisse_movements').insert({
      caisse_id: caisseId,
      product_id: productId,
      type: 'damage',
      quantity,
      responsible_person: responsiblePerson,
      reason,
      notes: `Destination: ${destination}`,
      created_by: user?.id,
    } as any);

    // If returning to stock
    if (destination === 'stock') {
      const { data: product } = await supabase.from('products').select('quantity, length, width').eq('id', productId).single();
      if (product) {
        const newStockQty = product.quantity + quantity;
        const newSurface = parseFloat((newStockQty * product.length * product.width).toFixed(2));
        await supabase.from('products').update({ quantity: newStockQty, surface: newSurface }).eq('id', productId);
      }
    }

    // Add replacement if specified
    if (replacementProductId && replacementQuantity) {
      await addItemToCaisse(caisseId, replacementProductId, replacementQuantity, responsiblePerson, true, 'Remplacement suite à dommage', 'replace');
    }

    await refresh();
  };

  const initializeCaisse = async (caisseId: string, items: { product_id: string; quantity: number }[], responsiblePerson: string) => {
    const user = (await supabase.auth.getUser()).data.user;

    for (const item of items) {
      // Insert or update item
      const existing = caisseItems.find(i => i.caisse_id === caisseId && i.product_id === item.product_id);
      if (existing) {
        await supabase.from('caisse_items').update({ quantity: item.quantity } as any).eq('id', existing.id);
      } else {
        await supabase.from('caisse_items').insert({
          caisse_id: caisseId,
          product_id: item.product_id,
          quantity: item.quantity,
        } as any);
      }

      // Log init movement (no stock deduction for initialization)
      await supabase.from('caisse_movements').insert({
        caisse_id: caisseId,
        product_id: item.product_id,
        type: 'init',
        quantity: item.quantity,
        responsible_person: responsiblePerson,
        notes: 'Initialisation manuelle',
        created_by: user?.id,
      } as any);
    }

    await refresh();
  };

  const getCaisseItems = (caisseId: string) => caisseItems.filter(i => i.caisse_id === caisseId);
  const getCaisseMovements = (caisseId: string) => movements.filter(m => m.caisse_id === caisseId);

  const updateCaisseStatus = async (caisseId: string) => {
    const items = getCaisseItems(caisseId);
    const hasDamaged = movements.some(m => m.caisse_id === caisseId && m.type === 'damage' && 
      !movements.some(m2 => m2.caisse_id === caisseId && m2.product_id === m.product_id && m2.type === 'replace' && m2.created_at > m.created_at));
    
    let status = 'complete';
    if (hasDamaged) status = 'damaged';
    else if (items.length === 0) status = 'missing';
    
    await updateCaisse(caisseId, { status });
  };

  return {
    caisses,
    caisseItems,
    movements,
    isLoading,
    createCaisse,
    updateCaisse,
    deleteCaisse,
    addItemToCaisse,
    removeItemFromCaisse,
    reportDamage,
    initializeCaisse,
    getCaisseItems,
    getCaisseMovements,
    updateCaisseStatus,
    refresh,
  };
};
