
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Edit2, Trash2, Plus, Search, FileDown, Scan, FileUp, 
  ArrowUpDown, ChevronUp, ChevronDown, X, Camera, Image as ImageIcon,
  Settings, Bell, Tag, Zap, AlertTriangle, Percent, DollarSign, ChevronLeft, ChevronRight, Lock, Filter
} from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';

interface InventoryProps {
  products: Product[];
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdd: (product: Product) => void;
  onBulkImport: (products: Product[]) => void;
  stockThreshold: number;
  setStockThreshold: (val: number) => void;
  isAdmin: boolean;
}

type SortKey = 'name' | 'barcode' | 'category' | 'stock' | 'price' | 'discountValue';
type SortDirection = 'asc' | 'desc' | null;

/**
 * A responsive image component that handles loading states, 
 * error fallbacks, and optimized rendering.
 */
const ResponsiveImage: React.FC<{ 
  src?: string; 
  alt?: string; 
  className?: string; 
  fallbackIcon?: React.ReactNode;
}> = ({ src, alt, className = "", fallbackIcon }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  const defaultIcon = fallbackIcon || <ImageIcon className="w-1/2 h-1/2 text-slate-300 opacity-50" />;

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        {defaultIcon}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <ImageIcon className="w-1/3 h-1/3 text-slate-200" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const Inventory: React.FC<InventoryProps> = ({ 
  products, onUpdate, onDelete, onAdd, onBulkImport, stockThreshold, setStockThreshold, isAdmin 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formImage, setFormImage] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formDiscountType, setFormDiscountType] = useState<'percent' | 'fixed'>('percent');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset to first page when search, filter or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, itemsPerPage]);

  useEffect(() => {
    if (editingProduct) {
      setFormImage(editingProduct.image || '');
      setFormBarcode(editingProduct.barcode || '');
      setFormDiscountType(editingProduct.discountType || 'percent');
    } else {
      setFormImage('');
      setFormBarcode('');
      setFormDiscountType('percent');
    }
  }, [editingProduct, isModalOpen]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: number | null = null;

    const startScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'ean_13', 'qr_code'],
          });

          interval = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  setFormBarcode(barcodes[0].rawValue);
                  setIsScannerOpen(false);
                }
              } catch (e) {
                console.error("Detection error:", e);
              }
            }
          }, 500);
        }
      } catch (err) {
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

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig(direction ? { key, direction } : null);
  };

  const sortedItems = useMemo(() => {
    let items = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortConfig && sortConfig.direction) {
      items.sort((a, b) => {
        const aVal = (a[sortConfig.key] ?? 0) as any;
        const bVal = (b[sortConfig.key] ?? 0) as any;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [products, searchTerm, filterCategory, sortConfig]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get('name'),
      category: formData.get('category'),
      barcode: formBarcode,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string) || 0,
      threshold: formData.get('threshold') ? parseInt(formData.get('threshold') as string) : undefined,
      discountType: formDiscountType,
      discountValue: parseFloat(formData.get('discountValue') as string) || 0,
      supplierName: formData.get('supplierName') || 'Internal',
      image: formImage || `https://picsum.photos/seed/${formBarcode || Date.now()}/200/200`
    };
    if (editingProduct) onUpdate({ ...editingProduct, ...data });
    else onAdd({ ...data, id: Date.now().toString() });
    closeModals();
  };

  const handleDeleteConfirmed = () => {
    if (deleteConfirmationId && isAdmin) {
      onDelete(deleteConfirmationId);
      setDeleteConfirmationId(null);
    }
  };

  const closeModals = () => {
    setIsModalOpen(false); setIsScannerOpen(false); setIsSettingsOpen(false);
    setDeleteConfirmationId(null); setEditingProduct(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportCSV = () => {
    const headers = ['Product', 'Barcode', 'Category', 'Stock', 'Threshold', 'Supplier Name', 'Price', 'Discount Type', 'Discount Value'];
    const rows = products.map(p => [
      `"${p.name}"`, `"${p.barcode}"`, `"${p.category}"`, p.stock, p.threshold ?? '', `"${p.supplierName}"`, p.price, p.discountType ?? 'percent', p.discountValue ?? 0
    ]);
    const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "pawprint_inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return;

      const importedItems: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 7) continue;

        importedItems.push({
          id: `imp-${Date.now()}-${i}`,
          name: cols[0],
          barcode: cols[1],
          category: cols[2],
          stock: parseInt(cols[3]) || 0,
          threshold: cols[4] ? parseInt(cols[4]) : undefined,
          supplierName: cols[5],
          price: parseFloat(cols[6]) || 0,
          discountType: (cols[7] as any) || 'percent',
          discountValue: parseFloat(cols[8]) || 0,
          status: 'In Stock',
          image: `https://picsum.photos/seed/${cols[1]}/200/200`
        });
      }
      onBulkImport(importedItems);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    if (sortConfig.direction === 'asc') return <ChevronUp className="w-3.5 h-3.5 text-teal-600" />;
    return <ChevronDown className="w-3.5 h-3.5 text-teal-600" />;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Catalog</h2>
          <p className="text-slate-500">View and {isAdmin ? 'manage' : 'monitor'} store products</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm" title="Stock Alerts"><Settings className="w-5 h-5" /></button>
              <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"><FileUp className="w-4 h-4" /> Import</button>
            </>
          )}
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"><FileDown className="w-4 h-4" /> Export</button>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium text-sm shadow-sm"><Plus className="w-4 h-4" /> Add Product</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none appearance-none shadow-sm font-medium"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {!isAdmin && <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100"><Lock className="w-3 h-3" /> Read Only Access</div>}
        </div>

        <div className="flex-1 overflow-auto relative scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-slate-100">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    Product Name {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('barcode')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    Barcode {getSortIcon('barcode')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('category')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    Category {getSortIcon('category')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">Status</th>
                <th className="px-6 py-4 text-center bg-white">
                  <button onClick={() => handleSort('stock')} className="flex items-center gap-1 mx-auto hover:text-teal-600 transition-colors">
                    Stock {getSortIcon('stock')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    Price {getSortIcon('price')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('discountValue')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    Discount {getSortIcon('discountValue')}
                  </button>
                </th>
                {isAdmin && <th className="px-6 py-4 text-right bg-white">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ResponsiveImage 
                        src={product.image} 
                        alt={product.name} 
                        className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm"
                        fallbackIcon={<ImageIcon className="w-4 h-4 text-slate-300 opacity-40" />}
                      />
                      <span className="font-semibold text-slate-800 text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{product.barcode}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight">{product.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${product.stock === 0 ? 'bg-red-100 text-red-700' : product.stock <= (product.threshold ?? stockThreshold) ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {product.stock === 0 ? 'Out of Stock' : product.stock <= (product.threshold ?? stockThreshold) ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-sm text-slate-700">{product.stock}</td>
                  <td className="px-6 py-4 font-black text-sm text-teal-600">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {product.discountValue && product.discountValue > 0 ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {product.discountType === 'percent' ? `${product.discountValue}% Off` : `$${product.discountValue} Off`}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">None</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {setEditingProduct(product); setIsModalOpen(true);}} className="p-2 text-slate-400 hover:text-teal-600 transition-colors bg-white rounded-lg border border-transparent hover:border-slate-200 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirmationId(product.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-transparent hover:border-slate-200 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-20 text-center text-slate-400 italic">No products found in this category.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Products per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedItems.length)} of {sortedItems.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-teal-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-700 px-3 bg-white border border-slate-200 py-1.5 rounded-lg shadow-sm">{currentPage} / {totalPages}</span>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-teal-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Alert Settings</h3>
              <button onClick={closeModals} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Threshold</label>
                <input 
                  type="number" 
                  value={stockThreshold} 
                  onChange={(e) => setStockThreshold(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button onClick={closeModals} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-teal-700 transition-all shadow-lg shadow-teal-100">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmationId && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 italic">DELETE PRODUCT?</h3>
            <p className="text-sm text-slate-500 mb-8">This action is irreversible. The item will be permanently purged from the catalog.</p>
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleDeleteConfirmed} className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal (Add/Edit) */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 italic uppercase">
                {editingProduct ? 'Edit Product Profile' : 'New Inventory Profile'}
              </h3>
              <button onClick={closeModals} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                   <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 overflow-hidden hover:border-teal-500 transition-all shadow-inner group">
                      <ResponsiveImage 
                        src={formImage} 
                        className="w-full h-full"
                        fallbackIcon={
                          <div className="text-center text-slate-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <span className="text-[8px] font-black uppercase">Upload</span>
                          </div>
                        }
                      />
                      <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                        <Camera className="w-6 h-6" />
                      </div>
                   </div>
                   <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Product Catalog Photo</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Product Name</label>
                  <input name="name" defaultValue={editingProduct?.name || ''} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-teal-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Barcode / SKU</label>
                  <div className="flex gap-2">
                    <input value={formBarcode} onChange={e => setFormBarcode(e.target.value)} required className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-mono focus:ring-2 focus:ring-teal-500 transition-all" />
                    <button type="button" onClick={() => setIsScannerOpen(true)} className="p-3 bg-teal-50 text-teal-600 rounded-xl border border-teal-200 hover:bg-teal-100 transition-colors"><Scan className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Category</label>
                  <select name="category" defaultValue={editingProduct?.category || CATEGORIES[1]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-teal-500 transition-all">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Unit Price ($)</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price || ''} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-black text-teal-600 focus:ring-2 focus:ring-teal-500 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Initial Stock</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-teal-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Alert Threshold</label>
                  <input name="threshold" type="number" defaultValue={editingProduct?.threshold || ''} placeholder={stockThreshold.toString()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-teal-500 transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Promo Pricing</label>
                <div className="flex gap-4">
                  <select value={formDiscountType} onChange={e => setFormDiscountType(e.target.value as any)} className="w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-black uppercase tracking-tighter focus:ring-2 focus:ring-teal-500 transition-all">
                    <option value="percent">% Off</option>
                    <option value="fixed">$ Flat</option>
                  </select>
                  <input name="discountValue" type="number" step="0.01" defaultValue={editingProduct?.discountValue || 0} className="flex-1 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl outline-none text-sm font-black text-amber-600 focus:ring-2 focus:ring-amber-500 transition-all" />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={closeModals} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase hover:bg-slate-200 transition-all">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Scanner View */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100] p-6 backdrop-blur-md">
           <div className="relative w-full max-w-md aspect-[3/4] rounded-[40px] overflow-hidden border-4 border-teal-500 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                 <div className="w-64 h-48 border-2 border-dashed border-teal-400/50 rounded-3xl flex items-center justify-center">
                    <div className="w-full h-1 bg-red-500/50 shadow-[0_0_20px_red] animate-pulse" />
                 </div>
                 <p className="mt-8 text-teal-400 font-black text-sm uppercase tracking-[0.3em] drop-shadow-lg">Scanning Barcode...</p>
              </div>
              <button onClick={() => setIsScannerOpen(false)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"><X className="w-6 h-6" /></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
