import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type StockMovement = Tables<'stock_movements'>;

export interface DamageReport {
  id: string;
  product_id: string;
  damage_date: string;
  description: string;
  severity: string;
  responsible_person: string | null;
  responsible_team: string | null;
  quantity_damaged: number;
  action_taken: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProductFormData {
  designation: string;
  type: string;
  color: string;
  thickness: number;
  unit: string;
  quantity: number;
  length: number;
  width: number;
}

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }, []);

  const fetchMovements = useCallback(async () => {
    const { data } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
    if (data) setMovements(data);
  }, []);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchProducts(), fetchMovements()]);
      setIsLoading(false);
    };
    load();
  }, [fetchProducts, fetchMovements]);

  const calculateSurface = (quantity: number, length: number, width: number) =>
    parseFloat((quantity * length * width).toFixed(2));

  const addProduct = async (data: ProductFormData) => {
    const surface = calculateSurface(data.quantity, data.length, data.width);
    const user = (await supabase.auth.getUser()).data.user;

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({ ...data, surface, created_by: user?.id })
      .select()
      .single();

    if (error || !newProduct) return null;

    await supabase.from('stock_movements').insert({
      product_id: newProduct.id,
      type: 'in',
      quantity: data.quantity,
      length: data.length,
      width: data.width,
      surface,
      notes: 'إضافة مخزون أولي',
      created_by: user?.id,
    });

    await Promise.all([fetchProducts(), fetchMovements()]);
    return newProduct;
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await Promise.all([fetchProducts(), fetchMovements()]);
  };

  const addStockMovement = async (
    productId: string,
    type: 'in' | 'out',
    quantity: number,
    length: number,
    width: number,
    notes?: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return null;

    const movementSurface = calculateSurface(quantity, length, width);
    const user = (await supabase.auth.getUser()).data.user;

    await supabase.from('stock_movements').insert({
      product_id: productId,
      type,
      quantity,
      length,
      width,
      surface: movementSurface,
      notes,
      created_by: user?.id,
    });

    const newQuantity = type === 'in' ? product.quantity + quantity : product.quantity - quantity;
    const safeQuantity = Math.max(0, newQuantity);
    const newSurface = calculateSurface(safeQuantity, product.length, product.width);

    await supabase.from('products').update({ quantity: safeQuantity, surface: newSurface }).eq('id', productId);

    await Promise.all([fetchProducts(), fetchMovements()]);
  };

  const bulkImport = async (items: ProductFormData[]) => {
    const user = (await supabase.auth.getUser()).data.user;
    for (const data of items) {
      const surface = calculateSurface(data.quantity, data.length, data.width);
      const { data: newProduct } = await supabase
        .from('products')
        .insert({ ...data, surface, created_by: user?.id })
        .select()
        .single();

      if (newProduct) {
        await supabase.from('stock_movements').insert({
          product_id: newProduct.id,
          type: 'in',
          quantity: data.quantity,
          length: data.length,
          width: data.width,
          surface,
          notes: 'استيراد من ملف Excel',
          created_by: user?.id,
        });
      }
    }
    await Promise.all([fetchProducts(), fetchMovements()]);
  };

  const getTotalStock = () => products.reduce((acc, p) => acc + p.quantity, 0);
  const getTotalSurface = () => parseFloat(products.reduce((acc, p) => acc + p.surface, 0).toFixed(2));

  return {
    products,
    movements,
    isLoading,
    addProduct,
    deleteProduct,
    addStockMovement,
    bulkImport,
    getTotalStock,
    getTotalSurface,
  };
};
