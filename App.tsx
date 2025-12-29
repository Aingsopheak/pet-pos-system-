
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

  // Derived state
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const totalCartValue = subtotal + tax;

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
      return [...prevCart, { ...product, quantity: 1 }];
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

    // Create a new sale record with full pricing details
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      items: [...cart],
      subtotal: subtotal,
      tax: tax,
      total: totalCartValue,
      paymentMethod,
    };

    // Update products stock
    setProducts(prevProducts => prevProducts.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        const newStock = Math.max(0, p.stock - cartItem.quantity);
        return {
          ...p,
          stock: newStock,
          status: newStock === 0 ? 'Out of Stock' : newStock < 10 ? 'Low Stock' : 'In Stock'
        };
      }
      return p;
    }));

    setSales(prev => [newSale, ...prev]);
    setCart([]);
    
    // Returning the sale so POS can show receipt
    return newSale;
  }, [cart, subtotal, tax, totalCartValue]);

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const bulkUpdateProducts = (importedProducts: Product[]) => {
    setProducts(prev => {
      const updated = [...prev];
      importedProducts.forEach(imported => {
        const existingIdx = updated.findIndex(p => p.barcode === imported.barcode);
        if (existingIdx !== -1) {
          updated[existingIdx] = { ...updated[existingIdx], ...imported, id: updated[existingIdx].id };
        } else {
          updated.push(imported);
        }
      });
      return updated;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-hidden">
        {activeTab === 'pos' && (
          <POS 
            products={products} 
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateCartQuantity={updateCartQuantity}
            processCheckout={processCheckout}
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
          <span>Low Stock: {products.filter(p => p.status !== 'In Stock').length}</span>
        </div>
        <div>
          <span>PawPrint Terminal v1.1.0</span>
        </div>
      </footer>
    </div>
  );
}
