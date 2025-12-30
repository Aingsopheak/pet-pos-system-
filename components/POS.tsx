
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, PackageOpen, ShoppingCart, ScanLine, CheckCircle2, Truck, ToggleLeft, ToggleRight, Tag, Eye, EyeOff, Zap } from 'lucide-react';
import { Product, CartItem, Sale } from '../types';
import { CATEGORIES } from '../constants';
import Receipt from './Receipt';

interface POSProps {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  processCheckout: (method: 'Cash' | 'Card') => Sale | undefined;
  deliveryEnabled: boolean;
  setDeliveryEnabled: (enabled: boolean) => void;
  deliveryPrice: number;
  setDeliveryPrice: (price: number) => void;
  globalDiscountEnabled: boolean;
  setGlobalDiscountEnabled: (enabled: boolean) => void;
  globalDiscountType: 'percent' | 'fixed';
  setGlobalDiscountType: (type: 'percent' | 'fixed') => void;
  globalDiscountValue: number;
  setGlobalDiscountValue: (value: number) => void;
}

const POS: React.FC<POSProps> = ({ 
  products, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateCartQuantity,
  processCheckout,
  deliveryEnabled,
  setDeliveryEnabled,
  deliveryPrice,
  setDeliveryPrice,
  globalDiscountEnabled,
  setGlobalDiscountEnabled,
  globalDiscountType,
  setGlobalDiscountType,
  globalDiscountValue,
  setGlobalDiscountValue
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showDiscountControls, setShowDiscountControls] = useState(true);
  
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!completedSale) {
      barcodeRef.current?.focus();
    }
  }, [completedSale]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      if (product.stock > 0) {
        addToCart(product);
      } else {
        alert(`${product.name} is out of stock!`);
      }
    } else {
      alert(`No product found with barcode: ${barcodeInput}`);
    }
    setBarcodeInput('');
  };

  const handleCheckout = (method: 'Cash' | 'Card') => {
    const sale = processCheckout(method);
    if (sale) {
      setCompletedSale(sale);
    }
  };

  const getItemDiscountedTotal = (item: CartItem) => {
    const baseTotal = item.price * item.quantity;
    if (!item.discountValue || item.discountValue <= 0) return baseTotal;
    if (item.discountType === 'percent') {
      return baseTotal * (1 - item.discountValue / 100);
    } else {
      // Assuming fixed catalog discount is per unit
      return Math.max(0, (item.price - item.discountValue) * item.quantity);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemDiscountedTotal(item), 0);
  
  const globalDiscountAmount = useMemo(() => {
    if (!globalDiscountEnabled || globalDiscountValue <= 0) return 0;
    if (globalDiscountType === 'percent') {
      return subtotal * (globalDiscountValue / 100);
    }
    return Math.min(subtotal, globalDiscountValue);
  }, [globalDiscountEnabled, globalDiscountValue, globalDiscountType, subtotal]);

  const total = Math.max(0, subtotal - globalDiscountAmount + (deliveryEnabled ? deliveryPrice : 0));

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-100 overflow-hidden relative">
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="flex-shrink-0">
            <form onSubmit={handleBarcodeSubmit} className="relative group">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 w-5 h-5 group-focus-within:scale-110 transition-transform" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan Barcode..."
                className="w-full xl:w-48 pl-10 pr-4 py-3 bg-teal-50 border-2 border-teal-100 shadow-sm rounded-xl focus:border-teal-500 focus:ring-0 outline-none font-mono text-sm"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              <span className="absolute -top-2 right-2 px-1.5 bg-teal-500 text-[8px] text-white rounded-md font-bold uppercase tracking-widest">Scanner</span>
            </form>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name..."
              className="w-full pl-10 pr-4 py-3 bg-white border-0 shadow-sm rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-3 bg-white border-0 shadow-sm rounded-xl focus:ring-2 focus:ring-teal-500 outline-none min-w-[140px] font-medium text-slate-700"
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {filteredProducts.map(product => {
            // Hide discount UI if catalog discount is 0
            const hasCatalogDiscount = product.discountValue !== undefined && product.discountValue > 0;
            const showDiscountUI = showDiscountControls && hasCatalogDiscount;

            const salePrice = hasCatalogDiscount 
              ? (product.discountType === 'percent' 
                  ? product.price * (1 - product.discountValue! / 100) 
                  : Math.max(0, product.price - product.discountValue!))
              : product.price;

            return (
              <div 
                key={product.id}
                onClick={() => product.stock > 0 && addToCart(product)}
                className={`group bg-white rounded-2xl shadow-sm border border-transparent hover:border-teal-500 p-3 transition-all cursor-pointer flex flex-col h-full ${product.stock === 0 ? 'opacity-60 grayscale cursor-not-allowed' : 'active:scale-95'}`}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 relative">
                  <img 
                    src={product.image || `https://picsum.photos/seed/${product.id}/200/200`} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {showDiscountUI && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg animate-pulse">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      DISCOUNT
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-slate-500">
                    {product.barcode}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2 leading-tight h-10">{product.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">{product.category}</p>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-col">
                    {showDiscountUI && (
                      <span className="text-[10px] text-slate-400 line-through decoration-red-400/50">${product.price.toFixed(2)}</span>
                    )}
                    <span className="text-teal-600 font-black text-base">
                      ${(showDiscountControls ? salePrice : product.price).toFixed(2)}
                    </span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                    product.stock > 10 ? 'bg-green-100 text-green-700' : 
                    product.stock > 0 ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {product.stock > 0 ? `${product.stock} pcs` : 'Sold Out'}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
              <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No matches for your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full md:w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl relative z-20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 italic">
            SHOPPING CART
            <span className="bg-teal-600 text-white text-[10px] px-2 py-1 rounded-md not-italic font-bold">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </h2>
          
          <button 
            onClick={() => setShowDiscountControls(!showDiscountControls)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              showDiscountControls 
              ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' 
              : 'bg-slate-100 text-slate-500 border border-slate-200 opacity-60 hover:opacity-100'
            }`}
          >
            {showDiscountControls ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Promo: {showDiscountControls ? 'On' : 'Off'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-100">
                <ShoppingCart className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-center font-bold text-xs uppercase tracking-widest">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => {
              const hasItemDiscount = item.discountValue !== undefined && item.discountValue > 0;
              const showItemDiscount = showDiscountControls && hasItemDiscount;
              
              return (
                <div key={item.id} className="flex flex-col gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 group animate-in slide-in-from-right-4 duration-200">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate leading-none mb-1">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">${item.price.toFixed(2)} unit</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 rounded-md hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 rounded-md hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end">
                      <div className="flex flex-col">
                        {showItemDiscount && (
                          <span className="text-[10px] text-slate-400 line-through">${(item.price * item.quantity).toFixed(2)}</span>
                        )}
                        <p className="text-sm font-black text-slate-900">
                          ${(showDiscountControls ? getItemDiscountedTotal(item) : item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  {/* Visual indication of fixed catalog discount if active */}
                  {showItemDiscount && (
                    <div className="text-[10px] font-bold text-teal-600 flex items-center gap-1 mt-1 bg-teal-50 w-fit px-1.5 py-0.5 rounded">
                      <Zap className="w-3 h-3 fill-current" />
                      {item.discountValue}{item.discountType === 'percent' ? '%' : '$'} Catalog Discount applied
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-slate-900 text-white rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.1)] space-y-4">
          
          {showDiscountControls && (
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center gap-3">
                  <Tag className={`w-5 h-5 ${globalDiscountEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Global Discount</span>
              </div>
              <div className="flex items-center gap-3">
                  {globalDiscountEnabled && (
                    <div className="flex items-center bg-white/10 rounded-lg px-2 py-1 border border-white/20">
                      <input 
                        type="number" 
                        value={globalDiscountValue} 
                        onChange={(e) => setGlobalDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-12 bg-transparent text-xs font-black text-amber-400 outline-none p-0 border-none"
                      />
                      <button 
                        onClick={() => setGlobalDiscountType(globalDiscountType === 'percent' ? 'fixed' : 'percent')}
                        className="ml-1 text-[10px] font-black text-slate-400 hover:text-white"
                      >
                        {globalDiscountType === 'percent' ? '%' : '$'}
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => setGlobalDiscountEnabled(!globalDiscountEnabled)}
                    className="transition-all active:scale-90"
                  >
                    {globalDiscountEnabled ? (
                      <ToggleRight className="w-8 h-8 text-amber-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group">
             <div className="flex items-center gap-3">
                <Truck className={`w-5 h-5 ${deliveryEnabled ? 'text-teal-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Delivery</span>
             </div>
             <div className="flex items-center gap-3">
                {deliveryEnabled && (
                  <div className="flex items-center bg-white/10 rounded-lg px-2 py-1 border border-white/20">
                    <span className="text-[10px] font-bold text-slate-400 mr-1">$</span>
                    <input 
                      type="number" 
                      value={deliveryPrice} 
                      onChange={(e) => setDeliveryPrice(parseFloat(e.target.value) || 0)}
                      className="w-12 bg-transparent text-xs font-black text-teal-400 outline-none p-0 border-none"
                    />
                  </div>
                )}
                <button 
                  onClick={() => setDeliveryEnabled(!deliveryEnabled)}
                  className="transition-all active:scale-90"
                >
                  {deliveryEnabled ? (
                    <ToggleRight className="w-8 h-8 text-teal-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
             </div>
          </div>

          <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            {showDiscountControls && globalDiscountAmount > 0 && (
              <div className="flex justify-between text-amber-400 italic">
                <span>Global Discount</span>
                <span>-${globalDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {deliveryEnabled && (
              <div className="flex justify-between text-teal-400">
                <span>Delivery Fee</span>
                <span>+${deliveryPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-black text-white pt-2 border-t border-white/10 mt-2">
              <span className="italic">TOTAL</span>
              <span className="text-teal-400 font-mono tracking-tighter">
                ${(showDiscountControls ? total : subtotal + (deliveryEnabled ? deliveryPrice : 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              disabled={cart.length === 0}
              onClick={() => handleCheckout('Cash')}
              className="flex items-center justify-center gap-2 py-4 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
            >
              <Banknote className="w-5 h-5" />
              CASH
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => handleCheckout('Card')}
              className="flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
            >
              <CreditCard className="w-5 h-5" />
              CARD
            </button>
          </div>
        </div>
      </div>

      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="max-w-md w-full animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-teal-400 mx-auto mb-4 drop-shadow-lg" />
              <h2 className="text-3xl font-black text-white italic">SALE COMPLETED!</h2>
              <p className="text-teal-200 font-bold uppercase tracking-widest text-xs">Transaction ID: #{completedSale.id.toUpperCase()}</p>
            </div>
            
            <Receipt sale={completedSale} />
            
            <button 
              onClick={() => setCompletedSale(null)}
              className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-xl active:scale-95"
            >
              NEW TRANSACTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
