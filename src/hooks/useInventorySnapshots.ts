import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { InventoryQuantityEntry, SnapshotKind } from '@/lib/inventory';

export type InventorySnapshot = {
  id: string;
  save_order: number;
  snapshot_type: SnapshotKind;
  captured_at: string;
  created_by: string | null;
  created_by_name: string | null;
  material_count: number;
  total_quantity: number;
  note: string | null;
  request_id: string;
  created_at: string;
};

export type InventorySnapshotItem = {
  id: string;
  snapshot_id: string;
  product_id: string | null;
  reference: string;
  designation: string;
  unit: string;
  quantity: number;
  sort_order: number;
  created_at: string;
};

type PostgrestLikeError = { code?: string; message?: string; details?: string; hint?: string } | null;

/**
 * The history tables are added by an additive migration. Until it is applied
 * the page must keep working for the current inventory instead of crashing.
 */
const isMissingHistoryTable = (error: PostgrestLikeError): boolean => {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  return /could not find the table|relation .* does not exist/i.test(error.message || '');
};

export const useInventorySnapshots = () => {
  const [snapshots, setSnapshots] = useState<InventorySnapshot[]>([]);
  const [snapshotItems, setSnapshotItems] = useState<InventorySnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestItemsRequest = useRef(0);

  const fetchSnapshots = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('inventory_snapshots')
      .select('*')
      .order('save_order', { ascending: false });

    if (fetchError) {
      setHistoryAvailable(!isMissingHistoryTable(fetchError));
      setError(fetchError.message);
      setSnapshots([]);
      return;
    }

    setHistoryAvailable(true);
    setError(null);
    setSnapshots((data ?? []) as InventorySnapshot[]);
  }, []);

  const fetchSnapshotItems = useCallback(async (snapshotId: string) => {
    const request = latestItemsRequest.current + 1;
    latestItemsRequest.current = request;
    setIsLoadingItems(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('inventory_snapshot_items')
        .select('*')
        .eq('snapshot_id', snapshotId)
        .order('sort_order', { ascending: true });

      // A newer snapshot was selected while this request was in flight.
      if (request !== latestItemsRequest.current) return [];

      if (fetchError) {
        setSnapshotItems([]);
        setError(fetchError.message);
        return [];
      }

      const items = (data ?? []) as InventorySnapshotItem[];
      setSnapshotItems(items);
      return items;
    } finally {
      if (request === latestItemsRequest.current) setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchSnapshots();
      setIsLoading(false);
    };
    load();
  }, [fetchSnapshots]);

  /**
   * Saves a complete inventory snapshot. `requestId` is generated once per
   * confirmation and reused on retries so the RPC can never create duplicates.
   */
  const saveInventory = useCallback(
    async (entries: InventoryQuantityEntry[], requestId: string, note?: string) => {
      setIsSaving(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc('save_inventory_snapshot', {
          _request_id: requestId,
          _items: entries as unknown as Json,
          _note: note?.trim() ? note.trim() : null,
        });

        if (rpcError) throw rpcError;
        if (!data) throw new Error('Inventory snapshot was not saved');

        await fetchSnapshots();
        return data as string;
      } catch (saveError) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : (saveError as PostgrestLikeError)?.message || 'Inventory snapshot was not saved';
        setError(message);
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchSnapshots],
  );

  return {
    snapshots,
    snapshotItems,
    isLoading,
    isLoadingItems,
    isSaving,
    historyAvailable,
    error,
    fetchSnapshots,
    fetchSnapshotItems,
    saveInventory,
    clearSnapshotItems: () => setSnapshotItems([]),
  };
};
