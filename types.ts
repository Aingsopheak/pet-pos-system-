
export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: number;
  pin: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock: number;
  threshold?: number;
  supplierName: string;
  price: number;
  barcode: string;
  image?: string;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
}

export interface CartItem extends Product {
  quantity: number;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalDiscount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card';
  processedBy?: string; // User ID
  syncStatus?: 'synced' | 'pending';
}

export interface InventoryLog {
  id: string;
  productId: string;
  change: number;
  reason: string;
  timestamp: number;
}
