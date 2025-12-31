export interface Product {
  id: string;
  designation: string;
  type: string;
  color: string;
  thickness: number;
  unit: string;
  quantity: number;
  length: number;
  width: number;
  surface: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  length: number;
  width: number;
  surface: number;
  date: Date;
  notes?: string;
}

export type ProductFormData = Omit<Product, 'id' | 'surface' | 'createdAt' | 'updatedAt'>;
