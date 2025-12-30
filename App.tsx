
import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_PRODUCTS } from './constants';
import { Product, CartItem, Sale, User } from './types';
import Header from './components/Header';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import Sales from './components/Sales';
import Login from './components/Login';
import Users from './components/Users';

type Tab = 'pos' | 'inventory' | 'dashboard' | 'assistant' | 'history' | 'users';

const DEFAULT_USERS: User[] = [
  { 
    id: '1', 
    username: 'admin', 
    name: 'Store Owner', 
    role: 'ADMIN', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    pin: '123456789'
  },
  { 
    id: '2', 
    username: 'staff1', 
    name: 'Alex Cashier', 
    role: 'STAFF', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff1',
    pin: '1234'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [systemUsers, setSystemUsers] = useState<User[]>(DEFAULT_USERS);
  
  // Settings State
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState(5.00);
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [stockThreshold, setStockThreshold] = useState(10);

  const isAdmin = currentUser?.role === 'ADMIN';

  const getProductStatus = (p: Partial<Product>, globalThreshold: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    const stock = p.stock ?? 0;
    const threshold = p.threshold ?? globalThreshold;
    if (stock === 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getItemDiscountedTotal = (item: CartItem) => {
    const baseTotal = item.price * item.quantity;
    if (!item.discountValue || item.discountValue <= 0) return baseTotal;
    if (item.discountType === 'percent') {
      return baseTotal * (1 - item.discountValue / 100);
    } else {
      return Math.max(0, (item.price - item.discountValue) * item.quantity);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemDiscountedTotal(item), 0);
  const globalDiscountAmount = globalDiscountEnabled && globalDiscountValue > 0 
    ? (globalDiscountType === 'percent' ? subtotal * (globalDiscountValue / 100) : Math.min(subtotal, globalDiscountValue))
    : 0;
  
  const totalDiscount = (cart.reduce((sum, item) => {
    const base = item.price * item.quantity;
    return sum + (base - getItemDiscountedTotal(item));
  }, 0)) + globalDiscountAmount;

  const currentDeliveryFee = deliveryEnabled ? deliveryPrice : 0;
  const totalCartValue = Math.max(0, subtotal - globalDiscountAmount + currentDeliveryFee);

  const lowStockItems = products.filter(p => p.stock <= (p.threshold ?? stockThreshold));

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [{ ...product, quantity: 1, discountType: product.discountType || 'percent', discountValue: product.discountValue || 0 }, ...prev];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => setCart(prev => prev.filter(item => item.id !== productId)), []);
  const updateCartQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
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
      processedBy: currentUser?.id
    };

    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        const newStock = Math.max(0, p.stock - cartItem.quantity);
        return { ...p, stock: newStock, status: getProductStatus({ ...p, stock: newStock }, stockThreshold) };
      }
      return p;
    }));

    setSales(prev => [newSale, ...prev]);
    setCart([]);
    setDeliveryEnabled(false);
    setGlobalDiscountEnabled(false);
    return newSale;
  }, [cart, currentDeliveryFee, totalDiscount, totalCartValue, stockThreshold, currentUser]);

  const updateProduct = (updated: Product) => setProducts(prev => prev.map(p => p.id === updated.id ? { ...updated, status: getProductStatus(updated, stockThreshold) } : p));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const addProduct = (p: Product) => setProducts(prev => [...prev, { ...p, status: getProductStatus(p, stockThreshold) }]);
  const bulkUpdateProducts = (imported: Product[]) => setProducts(prev => {
    const updated = [...prev];
    imported.forEach(imp => {
      const idx = updated.findIndex(p => p.barcode === imp.barcode);
      if (idx !== -1) updated[idx] = { ...updated[idx], ...imp, id: updated[idx].id, status: getProductStatus(imp, stockThreshold) };
      else updated.push({ ...imp, status: getProductStatus(imp, stockThreshold) });
    });
    return updated;
  });

  const onLogout = () => {
    setCurrentUser(null);
    setActiveTab('pos');
  };

  if (!currentUser) {
    return <Login users={systemUsers} onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lowStockItems={lowStockItems}
        user={currentUser}
        onLogout={onLogout}
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

        {activeTab === 'history' && <Sales sales={sales} />}
        
        {activeTab === 'inventory' && (
          <Inventory 
            products={products} 
            onUpdate={updateProduct} 
            onDelete={deleteProduct}
            onAdd={addProduct}
            onBulkImport={bulkUpdateProducts}
            stockThreshold={stockThreshold}
            setStockThreshold={setStockThreshold}
            isAdmin={isAdmin}
          />
        )}
        
        {activeTab === 'dashboard' && isAdmin && <Dashboard sales={sales} products={products} />}
        {activeTab === 'assistant' && <AIChat products={products} sales={sales} />}
        {activeTab === 'users' && isAdmin && (
          <Users users={systemUsers} setUsers={setSystemUsers} />
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <div className="flex gap-4">
          <span>Role: {currentUser.role}</span>
          <span>Products: {products.length}</span>
          <span>Alerts: {lowStockItems.length}</span>
        </div>
        <div><span>PawPrint Terminal v1.7.0</span></div>
      </footer>
    </div>
  );
}
