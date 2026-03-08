import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WithdrawalRequest {
  id: string;
  product_id: string;
  requested_by: string;
  department: string | null;
  quantity: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useWithdrawalRequests = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
    if (data) setRequests(data as WithdrawalRequest[]);
  }, []);

  useEffect(() => {
    fetchRequests().then(() => setIsLoading(false));
  }, [fetchRequests]);

  const createRequest = async (data: { product_id: string; requested_by: string; department: string; quantity: number; reason: string }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('withdrawal_requests').insert({ ...data, created_by: user?.id } as any);
    if (error) throw error;
    await fetchRequests();
  };

  const approveRequest = async (id: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('withdrawal_requests').update({
      status: 'approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    } as any).eq('id', id);
    if (error) throw error;
    await fetchRequests();
  };

  const rejectRequest = async (id: string) => {
    const { error } = await supabase.from('withdrawal_requests').update({ status: 'rejected' } as any).eq('id', id);
    if (error) throw error;
    await fetchRequests();
  };

  return { requests, isLoading, createRequest, approveRequest, rejectRequest, fetchRequests };
};
