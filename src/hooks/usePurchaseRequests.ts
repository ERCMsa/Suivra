import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PurchaseRequest {
  id: string;
  product_id: string;
  current_stock: number;
  min_threshold: number;
  suggested_quantity: number;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const usePurchaseRequests = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data as PurchaseRequest[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const autoDetectLowStock = useCallback(async () => {
    // Fetch current products
    const { data: products } = await supabase.from('products').select('*');
    if (!products) return [];

    // Fetch existing pending/ordered requests
    const { data: existing } = await supabase
      .from('purchase_requests')
      .select('id, product_id, status')
      .in('status', ['pending', 'ordered']);

    const existingByProduct = new Map<string, { id: string; status: string }>();
    (existing || []).forEach((r: any) => existingByProduct.set(r.product_id, { id: r.id, status: r.status }));

    const user = (await supabase.auth.getUser()).data.user;
    const newRequests: any[] = [];
    const obsoletePendingIds: string[] = [];

    for (const product of products) {
      const isLow = product.min_quantity > 0 && product.quantity <= product.min_quantity;
      const existingReq = existingByProduct.get(product.id);

      if (isLow && !existingReq) {
        const suggested = Math.max(product.min_quantity * 2 - product.quantity, product.min_quantity);
        newRequests.push({
          product_id: product.id,
          current_stock: product.quantity,
          min_threshold: product.min_quantity,
          suggested_quantity: suggested,
          status: 'pending',
          created_by: user?.id,
        });
      } else if (!isLow && existingReq && existingReq.status === 'pending') {
        // Stock has been replenished — auto-cancel the obsolete pending request
        obsoletePendingIds.push(existingReq.id);
      }
    }

    if (obsoletePendingIds.length > 0) {
      await supabase.from('purchase_requests').delete().in('id', obsoletePendingIds);
    }

    if (newRequests.length > 0) {
      await supabase.from('purchase_requests').insert(newRequests);
    }

    if (newRequests.length > 0 || obsoletePendingIds.length > 0) {
      await fetchRequests();
    }

    return newRequests;
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('purchase_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    await fetchRequests();
  };

  const updateRequest = async (id: string, data: { suggested_quantity?: number; notes?: string }) => {
    await supabase
      .from('purchase_requests')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    await fetchRequests();
  };

  const deleteRequest = async (id: string) => {
    await supabase.from('purchase_requests').delete().eq('id', id);
    await fetchRequests();
  };

  const forceAdd = async (productId: string, quantity: number) => {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    if (!product) return;

    const user = (await supabase.auth.getUser()).data.user;
    await supabase.from('purchase_requests').insert({
      product_id: productId,
      current_stock: product.quantity,
      min_threshold: product.min_quantity,
      suggested_quantity: quantity,
      status: 'pending',
      created_by: user?.id,
    });
    await fetchRequests();
  };

  return {
    requests,
    isLoading,
    fetchRequests,
    autoDetectLowStock,
    updateStatus,
    updateRequest,
    deleteRequest,
    forceAdd,
  };
};
