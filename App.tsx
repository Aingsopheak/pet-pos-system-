
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
import { Settings as SettingsIcon, X, Palette, Check, WifiOff, CloudSync, RefreshCw } from 'lucide-react';

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

const THEME_COLORS = [
  { name: 'Emerald', class: 'bg-teal-600', border: 'border-teal-500' },
  { name: 'Royal', class: 'bg-indigo-600', border: 'border-indigo-500' },
  { name: 'Midnight', class: 'bg-slate-800', border: 'border-slate-700' },
  { name: 'Ruby', class: 'bg-rose-600', border: 'border-rose-500' },
  { name: 'Amber', class: 'bg-amber-600', border: 'border-amber-500' },
  { name: 'Violet', class: 'bg-violet-600', border: 'border-violet-500' },
];

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pawprint_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('pawprint_sales');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [systemUsers, setSystemUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pawprint_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  
  // Settings State
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState(5.00);
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [stockThreshold, setStockThreshold] = useState(10);
  const [terminalColor, setTerminalColor] = useState(() => {
    const saved = localStorage.getItem('pawprint_theme');
    return saved ? JSON.parse(saved) : THEME_COLORS[0];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Persistence Effects
  useEffect(() => localStorage.setItem('pawprint_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('pawprint_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('pawprint_users', JSON.stringify(systemUsers)), [systemUsers]);
  useEffect(() => localStorage.setItem('pawprint_theme', JSON.stringify(terminalColor)), [terminalColor]);

  // Connectivity Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      attemptSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const attemptSync = async () => {
    const pendingSales = sales.filter(s => s.syncStatus === 'pending');
    if (pendingSales.length === 0) return;

    setIsSyncing(true);
    // Simulate cloud sync delay
    setTimeout(() => {
      setSales(prev => prev.map(s => ({ ...s, syncStatus: 'synced' })));
      setIsSyncing(false);
    }, 2000);
  };

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
      processedBy: currentUser?.id,
      syncStatus: isOnline ? 'synced' : 'pending'
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
  }, [cart, currentDeliveryFee, totalDiscount, totalCartValue, stockThreshold, currentUser, isOnline]);

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
        terminalColor={terminalColor}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOnline={isOnline}
        isSyncing={isSyncing}
      />
      
      <main className="flex-1 overflow-hidden relative">
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase py-1 px-4 flex items-center justify-center gap-2 z-[45] tracking-widest animate-in slide-in-from-top duration-300">
            <WifiOff className="w-3 h-3" />
            Offline Mode: Sales are being saved locally and will sync when restored
          </div>
        )}

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
        {activeTab === 'assistant' && <AIChat products={products} sales={sales} isOnline={isOnline} />}
        {activeTab === 'users' && isAdmin && (
          <Users users={systemUsers} setUsers={setSystemUsers} />
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span>Role: {currentUser.role}</span>
          <span>Products: {products.length}</span>
          <span>Alerts: {lowStockItems.length}</span>
        </div>
        <div className="flex items-center gap-3">
          {isSyncing && <span className="flex items-center gap-1.5 text-indigo-500"><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing...</span>}
          <span>PawPrint Terminal v1.8.0-LocalSync</span>
        </div>
      </footer>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 italic uppercase flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-slate-400" />
                Terminal Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <Palette className="w-4 h-4" />
                  Navigation Theme
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setTerminalColor(color)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        terminalColor.name === color.name 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg shadow-sm ${color.class}`}></div>
                      <span className="text-[10px] font-bold text-slate-600">{color.name}</span>
                      {terminalColor.name === color.name && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
