
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Edit2, Trash2, Plus, Search, FileDown, Scan, FileUp, 
  ArrowUpDown, ChevronUp, ChevronDown, X, Camera, Upload, Image as ImageIcon,
  Settings, Bell, Info, Tag, Zap, AlertTriangle, Percent, DollarSign, ChevronLeft, ChevronRight
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
}

type SortKey = 'name' | 'barcode' | 'category' | 'stock' | 'price' | 'discountValue';
type SortDirection = 'asc' | 'desc' | null;

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  onUpdate, 
  onDelete, 
  onAdd, 
  onBulkImport,
  stockThreshold,
  setStockThreshold
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formImage, setFormImage] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formDiscountType, setFormDiscountType] = useState<'percent' | 'fixed'>('percent');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset to first page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

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

  const filteredItems = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const sortedItems = useMemo(() => {
    let items = [...filteredItems];
    if (sortConfig && sortConfig.direction) {
      items.sort((a, b) => {
        const aValue = (a[sortConfig.key] ?? 0) as any;
        const bValue = (b[sortConfig.key] ?? 0) as any;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [filteredItems, sortConfig]);

  // Paginated Results
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    if (sortConfig.direction === 'asc') return <ChevronUp className="w-3.5 h-3.5 text-teal-600" />;
    if (sortConfig.direction === 'desc') return <ChevronDown className="w-3.5 h-3.5 text-teal-600" />;
    return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
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

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const stockVal = parseInt(formData.get('stock') as string) || 0;
    const thresholdVal = formData.get('threshold') ? parseInt(formData.get('threshold') as string) : undefined;
    const discountVal = formData.get('discountValue') ? parseFloat(formData.get('discountValue') as string) : 0;
    
    const data: any = {
      name: formData.get('name'),
      category: formData.get('category'),
      barcode: formBarcode,
      price: parseFloat(formData.get('price') as string),
      stock: stockVal,
      threshold: thresholdVal,
      discountType: formDiscountType,
      discountValue: discountVal,
      supplierName: formData.get('supplierName') || 'Internal',
      image: formImage || `https://picsum.photos/seed/${formBarcode}/200/200`
    };

    if (editingProduct) {
      onUpdate({ ...editingProduct, ...data });
    } else {
      onAdd({ ...data, id: Date.now().toString() });
    }
    
    closeModals();
  };

  const handleDeleteConfirmed = () => {
    if (deleteConfirmationId) {
      onDelete(deleteConfirmationId);
      setDeleteConfirmationId(null);
    }
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsScannerOpen(false);
    setIsSettingsOpen(false);
    setDeleteConfirmationId(null);
    setEditingProduct(null);
    setFormImage('');
    setFormBarcode('');
    setFormDiscountType('percent');
  };

  const exportCSV = () => {
    const headers = ['Product', 'Barcode', 'Category', 'Status', 'Stock', 'Threshold', 'Supplier Name', 'Price', 'Discount Type', 'Discount Value'];
    const rows = products.map(p => [
      `"${p.name}"`, `"${p.barcode}"`, `"${p.category}"`, `"${p.status}"`, p.stock, p.threshold ?? 'Global', `"${p.supplierName}"`, p.price, p.discountType ?? 'percent', p.discountValue ?? 0
    ]);
    const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "pet_store_inventory.csv");
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
      if (lines.length < 2) {
        alert("The CSV file seems to be empty or missing data rows.");
        return;
      }

      const parseCSVLine = (line: string) => {
        const result = [];
        let cur = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { 
            result.push(cur.trim().replace(/^"|"$/g, '')); 
            cur = ''; 
          }
          else cur += char;
        }
        result.push(cur.trim().replace(/^"|"$/g, ''));
        return result;
      };

      const importedItems: Product[] = [];
      const timestamp = Date.now();

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 7) continue;

        const name = cols[0];
        const barcode = cols[1];
        const category = cols[2];
        const stock = parseInt(cols[4]) || 0;
        const threshold = cols[5] && !isNaN(parseInt(cols[5])) ? parseInt(cols[5]) : undefined;
        const supplierName = cols[6];
        const price = parseFloat(cols[7]) || 0;
        const discType = (cols[8] as 'percent' | 'fixed') || 'percent';
        const discVal = parseFloat(cols[9]) || 0;

        if (!name || !barcode) continue;

        importedItems.push({
          id: `imp-${timestamp}-${i}`,
          name,
          barcode,
          category: CATEGORIES.includes(category) ? category : CATEGORIES[1],
          stock,
          threshold,
          supplierName,
          price,
          discountType: discType,
          discountValue: discVal,
          status: stock === 0 ? 'Out of Stock' : stock <= (threshold ?? stockThreshold) ? 'Low Stock' : 'In Stock',
          image: `https://picsum.photos/seed/${barcode}/200/200`
        });
      }

      if (importedItems.length > 0) {
        onBulkImport(importedItems);
        alert(`Successfully imported ${importedItems.length} products.`);
      } else {
        alert("No valid products were found in the CSV file.");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Catalog</h2>
          <p className="text-slate-500">Manage products, barcodes, and stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
            title="Global Notification Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm">
            <FileUp className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm">
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => { setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name, category or barcode..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Items: {sortedItems.length}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4"><button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-teal-600 group">Product Name {getSortIcon('name')}</button></th>
                <th className="px-6 py-4"><button onClick={() => handleSort('barcode')} className="flex items-center gap-2 hover:text-teal-600 group">Barcode {getSortIcon('barcode')}</button></th>
                <th className="px-6 py-4"><button onClick={() => handleSort('category')} className="flex items-center gap-2 hover:text-teal-600 group">Category {getSortIcon('category')}</button></th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center"><button onClick={() => handleSort('stock')} className="flex items-center gap-2 mx-auto hover:text-teal-600 group">Stock {getSortIcon('stock')}</button></th>
                <th className="px-6 py-4"><button onClick={() => handleSort('price')} className="flex items-center gap-2 hover:text-teal-600 group">Price {getSortIcon('price')}</button></th>
                <th className="px-6 py-4"><button onClick={() => handleSort('discountValue')} className="flex items-center gap-2 hover:text-teal-600 group">Discount {getSortIcon('discountValue')}</button></th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map(product => {
                const effectiveThreshold = product.threshold ?? stockThreshold;
                const isLowStock = product.stock <= effectiveThreshold && product.stock > 0;
                const hasCatalogDiscount = product.discountValue !== undefined && product.discountValue > 0;
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={product.image} className="w-8 h-8 rounded-lg bg-slate-100 object-cover border border-slate-200" />
                          {hasCatalogDiscount && <Tag className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 fill-amber-500" />}
                        </div>
                        <span className="font-medium text-slate-800 text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit"><Scan className="w-3 h-3 text-teal-500" />{product.barcode}</div></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">{product.category}</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.stock > effectiveThreshold ? 'bg-green-100 text-green-700' :
                        product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.stock > effectiveThreshold ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        {product.stock === 0 ? 'Out of Stock' : product.stock <= effectiveThreshold ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-semibold text-sm ${isLowStock ? 'text-amber-600' : product.stock === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          {product.stock}
                        </span>
                        {isLowStock && (
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter mt-0.5" title={`Threshold: ${effectiveThreshold}`}>Below Limit</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {hasCatalogDiscount ? (
                        <div className="flex items-center gap-1.5 text-teal-600 font-bold text-xs uppercase">
                          <Zap className="w-3 h-3 fill-current" />
                          {product.discountValue}{product.discountType === 'percent' ? '%' : '$'} Off
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium text-xs italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirmationId(product.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400 italic">No products found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
              >
                {[10, 25, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedItems.length)} of {sortedItems.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-teal-600 disabled:opacity-30 disabled:hover:text-slate-600 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-sm">
              Page {currentPage} of {totalPages || 1}
            </div>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-teal-600 disabled:opacity-30 disabled:hover:text-slate-600 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 italic uppercase tracking-tight">Delete Product?</h3>
              <p className="text-sm text-slate-500 mb-8">
                Are you sure you want to remove <span className="font-bold text-slate-800">"{products.find(p => p.id === deleteConfirmationId)?.name}"</span>? 
                This action cannot be undone and will affect your inventory logs.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmationId(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirmed}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-red-200"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-teal-50/50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                Global Alert Settings
              </h3>
              <button onClick={closeModals} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Stock Threshold</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={stockThreshold} 
                    onChange={(e) => setStockThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                  />
                  <div className="text-[10px] text-slate-400 font-bold w-16 leading-tight">Units or less</div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Default limit for products without a specific threshold.</p>
              </div>
              <button onClick={closeModals} className="w-full py-3 bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-slate-100 bg-teal-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-teal-600 text-white rounded-xl">
                  {editingProduct ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                {editingProduct ? 'Edit Inventory Item' : 'Create New Product'}
              </h3>
              <button onClick={closeModals} className="p-2 text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                   <div className="w-32 h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-teal-500 transition-all">
                      {formImage ? (
                        <img src={formImage} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                           <ImageIcon className="w-8 h-8 mb-1" />
                           <span className="text-[10px] font-bold uppercase">Upload Photo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                         <Camera className="w-6 h-6" />
                      </div>
                   </div>
                   <input 
                    type="file" 
                    ref={photoInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                   />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Click to upload product image</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Item Name</label>
                  <input name="name" defaultValue={editingProduct?.name || ''} required placeholder="e.g. Organic Hamster Treats" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">SKU / Barcode</label>
                  <div className="flex gap-2">
                    <input 
                      name="barcode" 
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      required 
                      placeholder="Scan or type..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm transition-all shadow-sm" 
                    />
                    <button 
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="p-3 bg-teal-50 text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-100 transition-all shadow-sm flex items-center justify-center"
                      title="Scan Barcode"
                    >
                      <Scan className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Category</label>
                  <select name="category" defaultValue={editingProduct?.category || CATEGORIES[1]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-medium transition-all shadow-sm">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Unit Price ($)</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price || ''} required placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-bold transition-all shadow-sm" />
                </div>
              </div>

              {/* Enhanced Catalog Discount Selection */}
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 shadow-inner space-y-4">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Catalog Discount Settings
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight px-1">Discount Type</label>
                    <div className="flex p-1 bg-white/60 border border-amber-200 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setFormDiscountType('percent')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                          formDiscountType === 'percent' 
                          ? 'bg-amber-500 text-white shadow-md' 
                          : 'text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        <Percent className="w-3 h-3" />
                        Percentage
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormDiscountType('fixed')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                          formDiscountType === 'fixed' 
                          ? 'bg-amber-500 text-white shadow-md' 
                          : 'text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        Amount
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight px-1">
                      {formDiscountType === 'percent' ? 'Rate (%)' : 'Amount ($)'}
                    </label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 transition-all">
                      <input 
                        name="discountValue" 
                        type="number" 
                        step="0.01" 
                        defaultValue={editingProduct?.discountValue || 0} 
                        className="w-full px-4 py-3 bg-transparent border-none outline-none text-sm font-bold text-amber-600" 
                        placeholder="0"
                      />
                      <div className="px-3 text-amber-300">
                        {formDiscountType === 'percent' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight px-1">Stock Alert Limit</label>
                  <input name="threshold" type="number" defaultValue={editingProduct?.threshold || ''} placeholder={`Global: ${stockThreshold}`} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-bold transition-all shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Stock Level</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-bold transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Main Supplier</label>
                  <input name="supplierName" defaultValue={editingProduct?.supplierName || ''} required placeholder="Supplier Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all shadow-sm" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModals} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] p-6">
           <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden border-4 border-teal-500 shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                 <div className="w-64 h-32 border-2 border-teal-400/50 rounded-lg flex items-center justify-center relative">
                    <div className="absolute w-full h-0.5 bg-red-500/50 shadow-[0_0_10px_red] animate-pulse" />
                 </div>
              </div>
              <div className="absolute top-4 left-4 right-4 text-center">
                 <p className="text-white text-xs font-black uppercase tracking-widest drop-shadow-md">Align barcode within the frame</p>
              </div>
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
