
import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import { Product, CartItem, Sale } from './types';
import Header from './components/Header';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import Sales from './components/Sales';

type Tab = 'pos' | 'inventory' | 'dashboard' | 'assistant' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Delivery & Discount State
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState(5.00);
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);

  // Notification / Global Threshold State
  const [stockThreshold, setStockThreshold] = useState(10);

  // Helper to determine status based on individual or global threshold
  const getProductStatus = (p: Partial<Product>, globalThreshold: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    const stock = p.stock ?? 0;
    const threshold = p.threshold ?? globalThreshold;
    if (stock === 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  // Helper to calculate discounted price for an item
  const getItemDiscountedTotal = (item: CartItem) => {
    const baseTotal = item.price * item.quantity;
    if (!item.discountValue || item.discountValue <= 0) return baseTotal;
    
    if (item.discountType === 'percent') {
      return baseTotal * (1 - item.discountValue / 100);
    } else {
      // Fixed discount is per item quantity or total? 
      // Usually catalog discounts are per unit. Let's assume per unit for consistency.
      return Math.max(0, (item.price - item.discountValue) * item.quantity);
    }
  };

  // Derived state
  const subtotal = cart.reduce((sum, item) => sum + getItemDiscountedTotal(item), 0);
  
  const calculateGlobalDiscount = () => {
    if (!globalDiscountEnabled || globalDiscountValue <= 0) return 0;
    if (globalDiscountType === 'percent') {
      return subtotal * (globalDiscountValue / 100);
    }
    return Math.min(subtotal, globalDiscountValue);
  };

  const totalDiscount = (cart.reduce((sum, item) => {
    const base = item.price * item.quantity;
    return sum + (base - getItemDiscountedTotal(item));
  }, 0)) + calculateGlobalDiscount();

  const currentDeliveryFee = deliveryEnabled ? deliveryPrice : 0;
  const totalCartValue = Math.max(0, subtotal - calculateGlobalDiscount() + currentDeliveryFee);

  const lowStockItems = products.filter(p => p.stock <= (p.threshold ?? stockThreshold));

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [{ 
        ...product, 
        quantity: 1, 
        discountType: product.discountType || 'percent', 
        discountValue: product.discountValue || 0 
      }, ...prevCart];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const processCheckout = useCallback((paymentMethod: 'Cash' | 'Card') => {
    if (cart.length === 0) return;

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      items: [...cart],
      subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      deliveryFee: currentDeliveryFee,
      totalDiscount: totalDiscount,
      total: totalCartValue,
      paymentMethod,
    };

    setProducts(prevProducts => prevProducts.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        const newStock = Math.max(0, p.stock - cartItem.quantity);
        return {
          ...p,
          stock: newStock,
          status: getProductStatus({ ...p, stock: newStock }, stockThreshold)
        };
      }
      return p;
    }));

    setSales(prev => [newSale, ...prev]);
    setCart([]);
    setDeliveryEnabled(false);
    setGlobalDiscountEnabled(false);
    setGlobalDiscountValue(0);
    
    return newSale;
  }, [cart, currentDeliveryFee, totalDiscount, totalCartValue, stockThreshold]);

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? {
      ...updatedProduct,
      status: getProductStatus(updatedProduct, stockThreshold)
    } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, {
      ...newProduct,
      status: getProductStatus(newProduct, stockThreshold)
    }]);
  };

  const bulkUpdateProducts = (importedProducts: Product[]) => {
    setProducts(prev => {
      const updated = [...prev];
      importedProducts.forEach(imported => {
        const existingIdx = updated.findIndex(p => p.barcode === imported.barcode);
        if (existingIdx !== -1) {
          updated[existingIdx] = { 
            ...updated[existingIdx], 
            ...imported, 
            id: updated[existingIdx].id,
            status: getProductStatus(imported, stockThreshold)
          };
        } else {
          updated.push({
            ...imported,
            status: getProductStatus(imported, stockThreshold)
          });
        }
      });
      return updated;
    });
  };

  useEffect(() => {
    setProducts(prev => prev.map(p => ({
      ...p,
      status: getProductStatus(p, stockThreshold)
    })));
  }, [stockThreshold]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lowStockItems={lowStockItems}
      />
      
      <main className="flex-1 overflow-hidden">
        {activeTab === 'pos' && (
          <POS 
            products={products} 
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateCartQuantity={updateCartQuantity}
            processCheckout={processCheckout}
            deliveryEnabled={deliveryEnabled}
            setDeliveryEnabled={setDeliveryEnabled}
            deliveryPrice={deliveryPrice}
            setDeliveryPrice={setDeliveryPrice}
            globalDiscountEnabled={globalDiscountEnabled}
            setGlobalDiscountEnabled={setGlobalDiscountEnabled}
            globalDiscountType={globalDiscountType}
            setGlobalDiscountType={setGlobalDiscountType}
            globalDiscountValue={globalDiscountValue}
            setGlobalDiscountValue={setGlobalDiscountValue}
          />
        )}

        {activeTab === 'history' && (
          <Sales 
            sales={sales}
          />
        )}
        
        {activeTab === 'inventory' && (
          <Inventory 
            products={products} 
            onUpdate={updateProduct} 
            onDelete={deleteProduct}
            onAdd={addProduct}
            onBulkImport={bulkUpdateProducts}
            stockThreshold={stockThreshold}
            setStockThreshold={setStockThreshold}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            sales={sales} 
            products={products}
          />
        )}

        {activeTab === 'assistant' && (
          <AIChat 
            products={products}
            sales={sales}
          />
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <div className="flex gap-4">
          <span>Products: {products.length}</span>
          <span>Low Stock: {lowStockItems.length}</span>
        </div>
        <div>
          <span>PawPrint Terminal v1.6.0</span>
        </div>
      </footer>
    </div>
  );
}
