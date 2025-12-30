
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Minus, Trash2, CreditCard, Banknote, PackageOpen, 
  ShoppingCart, ScanLine, CheckCircle2, Truck, ToggleLeft, ToggleRight, 
  Tag, Eye, EyeOff, Zap, Camera, X, Keyboard, AlertCircle, CheckCircle
} from 'lucide-react';
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

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
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
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [lastScannedItem, setLastScannedItem] = useState<Product | null>(null);
  
  const barcodeRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!completedSale && !isScannerOpen) {
      barcodeRef.current?.focus();
    }
  }, [completedSale, isScannerOpen]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (notificationTimeoutRef.current) window.clearTimeout(notificationTimeoutRef.current);
    setNotification({ message, type });
    notificationTimeoutRef.current = window.setTimeout(() => setNotification(null), 3000);
  };

  // Camera Scanner Logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: number | null = null;

    const startScanner = async () => {
      setScannerError(null);
      setLastScannedItem(null);
      try {
        // Fix: Use spread with any cast for non-standard focusMode to bypass strict MediaTrackConstraints check
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            ...({ focusMode: 'continuous' } as any)
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'ean_13', 'qr_code', 'ean_8', 'upc_a', 'upc_e'],
          });

          interval = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const detectedBarcode = barcodes[0].rawValue;
                  const handled = handleBarcodeDetected(detectedBarcode);
                  if (handled) {
                    setIsSuccessFlash(true);
                    setTimeout(() => {
                      setIsSuccessFlash(false);
                      setIsScannerOpen(false);
                    }, 500);
                  }
                }
              } catch (e) {
                console.error("Detection error:", e);
              }
            }
          }, 300);
        } else {
          setScannerError("Native Barcode Detection is not supported in this browser.");
        }
      } catch (err) {
        setScannerError("Unable to access camera. Please check permissions.");
        console.error("Camera access denied:", err);
      }
    };

    if (isScannerOpen) {
      startScanner();
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (interval) clearInterval(interval);
    };
  }, [isScannerOpen]);

  const handleBarcodeDetected = (code: string): boolean => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      if (product.stock > 0) {
        addToCart(product);
        setLastScannedItem(product);
        showNotification(`Added ${product.name}`, 'success');
        return true;
      } else {
        showNotification(`${product.name} is out of stock!`, 'error');
        return false;
      }
    } else {
      showNotification(`Product not found: ${code}`, 'error');
      return false;
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleBarcodeDetected(barcodeInput);
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
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' ? 'bg-teal-600 text-white' : 
          notification.type === 'error' ? 'bg-red-600 text-white' : 
          'bg-slate-800 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      {/* Product Catalog */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="flex-shrink-0 flex gap-2">
            <form onSubmit={handleBarcodeSubmit} className="relative group flex-1 xl:w-48">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 w-5 h-5 group-focus-within:scale-110 transition-transform" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Type Barcode..."
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 shadow-sm rounded-xl focus:border-teal-500 focus:ring-0 outline-none font-mono text-sm"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              <span className="absolute -top-2 right-2 px-1.5 bg-slate-400 text-[8px] text-white rounded-md font-bold uppercase tracking-widest">Manual</span>
            </form>
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-3 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all flex items-center gap-2 group active:scale-95"
            >
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-bold text-sm">Scan</span>
            </button>
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
                className={`group bg-white rounded-2xl shadow-sm border p-3 transition-all cursor-pointer flex flex-col h-full 
                  ${product.stock === 0 ? 'opacity-60 grayscale cursor-not-allowed' : 'active:scale-95'}
                  ${showDiscountUI ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-transparent hover:border-teal-500'}
                `}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 relative">
                  <img 
                    src={product.image || `https://picsum.photos/seed/${product.id}/200/200`} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {showDiscountUI && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg animate-bounce z-10">
                      <Tag className="w-3 h-3 fill-current" />
                      {product.discountType === 'percent' ? `-${product.discountValue}%` : `-$${product.discountValue}`}
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
                    <span className={`font-black text-base ${showDiscountUI ? 'text-amber-600' : 'text-teal-600'}`}>
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

      {/* Barcode Scanner View */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-[110] p-6 backdrop-blur-xl animate-in fade-in duration-300">
           {/* Success Flash Effect */}
           {isSuccessFlash && <div className="fixed inset-0 bg-white z-[120] animate-out fade-out duration-500" />}

           <div className="relative w-full max-w-lg aspect-[4/3] rounded-[40px] overflow-hidden border-4 border-teal-500 shadow-2xl bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              
              {/* Scanning UI Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                 <div className="w-72 h-48 border-2 border-teal-400/50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-teal-500/5 animate-pulse" />
                    <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] absolute top-0 animate-[scan_3s_ease-in-out_infinite]" />
                 </div>
                 <p className="mt-12 text-teal-400 font-black text-sm uppercase tracking-[0.4em] drop-shadow-md animate-pulse">Position Barcode in Center</p>
              </div>

              {/* Feedback Preview for last scanned item */}
              {lastScannedItem && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300 min-w-[280px]">
                  <img src={lastScannedItem.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                  <div>
                    <h4 className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{lastScannedItem.name}</h4>
                    <p className="text-[10px] font-bold text-teal-600">${lastScannedItem.price.toFixed(2)} • ADDED</p>
                  </div>
                </div>
              )}

              {/* Error UI */}
              {scannerError && (
                <div className="absolute inset-x-0 bottom-0 p-8 bg-black/80 backdrop-blur-md text-center">
                  <p className="text-red-400 text-sm font-bold mb-4">{scannerError}</p>
                  <button 
                    onClick={() => { setIsScannerOpen(false); barcodeRef.current?.focus(); }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase mx-auto"
                  >
                    <Keyboard className="w-4 h-4" />
                    Switch to Manual Input
                  </button>
                </div>
              )}

              <button 
                onClick={() => setIsScannerOpen(false)} 
                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md active:scale-90"
              >
                <X className="w-8 h-8" />
              </button>
           </div>
           
           <div className="mt-8 flex flex-col items-center gap-4 text-center max-w-xs">
              <h3 className="text-white font-black italic text-xl">SMART SCANNER</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">Ensure the barcode is well-lit and aligned within the guide frame.</p>
              <button 
                onClick={() => { setIsScannerOpen(false); barcodeRef.current?.focus(); }}
                className="mt-2 text-teal-400 hover:text-teal-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              >
                <Keyboard className="w-4 h-4" />
                Manual Entry Instead
              </button>
           </div>
        </div>
      )}

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

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(192px); }
        }
      `}</style>
    </div>
  );
};

export default POS;
