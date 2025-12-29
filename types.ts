
export interface Product {
  id: string;
  name: string;
  category: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock: number;
  supplierName: string;
  price: number;
  barcode: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
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
