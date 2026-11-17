import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { supplierCategoryIds } from '@/lib/supplierCategories';

export interface SupplierCategory {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
}

export interface SupplierContact {
  id: string;
  supplier_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SupplierContactInput = {
  name: string;
  role?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  is_primary?: boolean;
};

export interface Supplier {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  wilaya: string | null;
  commune: string | null;
  notes: string | null;
  is_recommended: boolean;
  image_url: string | null;
  created_at: string;
  category_ids: string[];
  contacts: SupplierContact[];
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  last_used_at: string | null;
}

export interface SupplierInput {
  name: string;
  category?: string;
  category_ids?: string[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  wilaya?: string;
  commune?: string;
  notes?: string;
  is_recommended?: boolean;
  image_url?: string;
  contacts?: SupplierContactInput[];
  product_ids?: string[];
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
    // Contacts are an additive feature: a missing migration must not hide the
    // suppliers that are already stored in the central directory.
    const { data: contacts } = await supabase.from('supplier_contacts').select('*').order('created_at');
    const error = se || spe || ce || le;
    if (error) toast.error(error.message);
    if (c) setCategories(c);
    if (links) setCategoryLinks(links);
    if (s && c && links) {
      const contactsBySupplier = new Map<string, SupplierContact[]>();
      (contacts || []).forEach(contact => {
        const list = contactsBySupplier.get(contact.supplier_id) || [];
        list.push(contact as SupplierContact);
        contactsBySupplier.set(contact.supplier_id, list);
      });
      setSuppliers(s.map(supplier => {
        const ids = supplierCategoryIds(links, supplier.id);
        return {
          ...supplier,
          whatsapp: supplier.whatsapp ?? null,
          wilaya: supplier.wilaya ?? null,
          commune: supplier.commune ?? null,
          category_ids: ids,
          category: c.filter(category => ids.includes(category.id)).map(category => category.name).join(', '),
          contacts: contactsBySupplier.get(supplier.id) || [],
        };
      }));
    }
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

  const addSupplier = async (data: SupplierInput) => {
    const { category_ids = [], category: _legacy, contacts, product_ids, ...fields } = data;
    const { error } = await supabase.rpc('save_supplier_with_categories', {
      _id: null as unknown as string,
      _data: fields as Json,
      _category_ids: category_ids,
      ...(contacts !== undefined ? { _contacts: contacts as unknown as Json } : {}),
      ...(product_ids !== undefined ? { _product_ids: product_ids } : {}),
    });
    if (error) toast.error(error.message);
    if (!error) await fetchSuppliers();
    return !error;
  };

  const updateSupplier = async (id: string, data: Partial<SupplierInput>) => {
    const { category_ids, category: _legacy, contacts, product_ids, ...fields } = data;
    const { error } = await supabase.rpc('save_supplier_with_categories', {
      _id: id,
      _data: fields as Json,
      ...(category_ids !== undefined ? { _category_ids: category_ids } : {}),
      ...(contacts !== undefined ? { _contacts: contacts as unknown as Json } : {}),
      ...(product_ids !== undefined ? { _product_ids: product_ids } : {}),
    });
    if (error) toast.error(error.message);
    if (!error) await fetchSuppliers();
    return !error;
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) toast.error(error.message);
    if (!error) await fetchSuppliers();
    return !error;
  };

  /**
   * Associates existing suppliers with a category without touching their
   * central record. ON CONFLICT DO NOTHING makes repeated calls idempotent.
   */
  const linkSuppliersToCategory = async (supplierIds: string[], categoryId: string) => {
    const uniqueIds = [...new Set(supplierIds)];
    if (uniqueIds.length === 0) return true;
    const { error } = await supabase
      .from('supplier_category_links')
      .upsert(
        uniqueIds.map(supplier_id => ({ supplier_id, category_id: categoryId })),
        { onConflict: 'supplier_id,category_id', ignoreDuplicates: true },
      );
    if (error) toast.error(error.message);
    if (!error) await fetchSuppliers();
    return !error;
  };

  /** Removes only the link between a supplier and a category. */
  const unlinkSupplierFromCategory = async (supplierId: string, categoryId: string) => {
    const { error } = await supabase
      .from('supplier_category_links')
      .delete()
      .eq('supplier_id', supplierId)
      .eq('category_id', categoryId);
    if (error) toast.error(error.message);
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
      .insert({ supplier_id: supplierId, product_id: productId });

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
      .update({ last_used_at: new Date().toISOString() })
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
    linkSuppliersToCategory,
    unlinkSupplierFromCategory,
    linkSupplierToProduct,
    unlinkSupplierFromProduct,
    markSupplierUsed,
  };
};
