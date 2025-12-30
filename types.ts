
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
}

export interface InventoryLog {
  id: string;
  productId: string;
  change: number;
  reason: string;
  timestamp: number;
}
