import { useState, useEffect } from 'react';
import { Product, StockMovement, ProductFormData } from '@/types/inventory';

const STORAGE_KEY = 'inventory_products';
const MOVEMENTS_KEY = 'inventory_movements';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedProducts = localStorage.getItem(STORAGE_KEY);
    const savedMovements = localStorage.getItem(MOVEMENTS_KEY);
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
    if (savedMovements) {
      setMovements(JSON.parse(savedMovements));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }, [products, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
    }
  }, [movements, isLoading]);

  const calculateSurface = (quantity: number, length: number, width: number) => {
    return parseFloat((quantity * length * width).toFixed(2));
  };

  const addProduct = (data: ProductFormData) => {
    const surface = calculateSurface(data.quantity, data.length, data.width);
    const newProduct: Product = {
      ...data,
      id: generateId(),
      surface,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts((prev) => [...prev, newProduct]);
    
    // Add initial stock movement
    const movement: StockMovement = {
      id: generateId(),
      productId: newProduct.id,
      type: 'in',
      quantity: data.quantity,
      length: data.length,
      width: data.width,
      surface,
      date: new Date(),
      notes: 'إضافة مخزون أولي',
    };
    setMovements((prev) => [...prev, movement]);
    
    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<ProductFormData>) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id === id) {
          const updatedProduct = { ...product, ...data, updatedAt: new Date() };
          updatedProduct.surface = calculateSurface(
            updatedProduct.quantity,
            updatedProduct.length,
            updatedProduct.width
          );
          return updatedProduct;
        }
        return product;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
    setMovements((prev) => prev.filter((movement) => movement.productId !== id));
  };

  const addStockMovement = (
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
    
    const movement: StockMovement = {
      id: generateId(),
      productId,
      type,
      quantity,
      length,
      width,
      surface: movementSurface,
      date: new Date(),
      notes,
    };
    
    setMovements((prev) => [...prev, movement]);

    // Update product quantities
    const newQuantity = type === 'in' 
      ? product.quantity + quantity 
      : product.quantity - quantity;
    
    const newSurface = type === 'in'
      ? product.surface + movementSurface
      : product.surface - movementSurface;

    updateProduct(productId, { 
      quantity: Math.max(0, newQuantity),
    });

    // Recalculate surface based on new quantity
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            quantity: Math.max(0, newQuantity),
            surface: calculateSurface(Math.max(0, newQuantity), p.length, p.width),
            updatedAt: new Date(),
          };
        }
        return p;
      })
    );

    return movement;
  };

  const getProductMovements = (productId: string) => {
    return movements.filter((m) => m.productId === productId);
  };

  const getTotalStock = () => {
    return products.reduce((acc, product) => acc + product.quantity, 0);
  };

  const getTotalSurface = () => {
    return parseFloat(products.reduce((acc, product) => acc + product.surface, 0).toFixed(2));
  };

  return {
    products,
    movements,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addStockMovement,
    getProductMovements,
    getTotalStock,
    getTotalSurface,
  };
};
