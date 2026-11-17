import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { supplierCategoryIds } from '@/lib/supplierCategories';

export interface SupplierCategory {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_recommended: boolean;
  image_url: string | null;
  created_at: string;
  category_ids: string[];
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  last_used_at: string | null;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [categoryLinks, setCategoryLinks] = useState<{ supplier_id: string; category_id: string }[]>([]);

  const fetchSuppliers = useCallback(async () => {
    const [{ data: s, error: se }, { data: sp, error: spe }, { data: c, error: ce }, { data: links, error: le }] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('supplier_products').select('*'),
      supabase.from('supplier_categories').select('*').order('name'),
      supabase.from('supplier_category_links').select('*'),
    ]);
    const error = se || spe || ce || le;
    if (error) toast.error(error.message);
    if (c) setCategories(c);
    if (links) setCategoryLinks(links);
    if (s && c && links) setSuppliers(s.map(supplier => {
      const ids = supplierCategoryIds(links, supplier.id);
      return { ...supplier, category_ids: ids, category: c.filter(category => ids.includes(category.id)).map(category => category.name).join(', ') };
    }));
    if (sp) setSupplierProducts(sp as SupplierProduct[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const getSuppliersForProduct = useCallback((productId: string, linkedOnly = false) => {
    const linkedIds = supplierProducts
      .filter(sp => sp.product_id === productId)
      .sort((a, b) => {
        if (a.last_used_at && b.last_used_at) return b.last_used_at.localeCompare(a.last_used_at);
        if (a.last_used_at) return -1;
        return 1;
      })
      .map(sp => sp.supplier_id);

    const linked = linkedIds.map(id => suppliers.find(s => s.id === id)).filter(Boolean) as Supplier[];
    
    if (linkedOnly) return linked;
    
    // If no linked suppliers, suggest by category match
    if (linked.length === 0) {
      return suppliers.slice(0, 3);
    }
    return linked;
  }, [suppliers, supplierProducts]);

  const getProductsForSupplier = useCallback((supplierId: string) => {
    return supplierProducts
      .filter(sp => sp.supplier_id === supplierId)
      .map(sp => sp.product_id);
  }, [supplierProducts]);

  const addSupplier = async (data: { name: string; category?: string; category_ids?: string[]; phone?: string; email?: string; address?: string; notes?: string; is_recommended?: boolean; image_url?: string }) => {
    const { category_ids = [], category: _legacy, ...fields } = data;
    const { error } = await supabase.rpc('save_supplier_with_categories', { _id: null as unknown as string, _data: fields, _category_ids: category_ids });
    if (error) toast.error(error.message);
    if (!error) await fetchSuppliers();
    return !error;
  };

  const updateSupplier = async (id: string, data: Partial<Supplier>) => {
    const { category_ids, category: _legacy, ...fields } = data;
    const { error } = await supabase.rpc('save_supplier_with_categories', { _id: id, _data: fields, ...category_ids ? { _category_ids: category_ids } : { _category_ids: null as unknown as string[] } });
    if (error) toast.error(error.message);
    if (!error) await fetchSuppliers();
    return !error;
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) await fetchSuppliers();
    return !error;
  };

  const linkSupplierToProduct = async (supplierId: string, productId: string) => {
    const alreadyLinked = supplierProducts.some(
      (item) => item.supplier_id === supplierId && item.product_id === productId,
    );

    if (alreadyLinked) {
      return true;
    }

    const { error } = await supabase
      .from('supplier_products')
      .insert({ supplier_id: supplierId, product_id: productId } as any);

    if (!error) await fetchSuppliers();
    return !error;
  };

  const unlinkSupplierFromProduct = async (supplierId: string, productId: string) => {
    const { error } = await supabase.from('supplier_products').delete().eq('supplier_id', supplierId).eq('product_id', productId);
    if (!error) await fetchSuppliers();
    return !error;
  };

  const markSupplierUsed = async (supplierId: string, productId: string) => {
    await supabase.from('supplier_products')
      .update({ last_used_at: new Date().toISOString() } as any)
      .eq('supplier_id', supplierId)
      .eq('product_id', productId);
    await fetchSuppliers();
  };

  return {
    categories,
    categoryLinks,
    suppliers,
    supplierProducts,
    isLoading,
    fetchSuppliers,
    getSuppliersForProduct,
    getProductsForSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    linkSupplierToProduct,
    unlinkSupplierFromProduct,
    markSupplierUsed,
  };
};
