
import React, { useState, useRef, useMemo } from 'react';
import { 
  Edit2, Trash2, Plus, Search, FileDown, Scan, FileUp, 
  ArrowUpDown, ChevronUp, ChevronDown, X
} from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';

interface InventoryProps {
  products: Product[];
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdd: (product: Product) => void;
  onBulkImport: (products: Product[]) => void;
}

type SortKey = 'name' | 'barcode' | 'category' | 'stock';
type SortDirection = 'asc' | 'desc' | null;

const Inventory: React.FC<InventoryProps> = ({ products, onUpdate, onDelete, onAdd, onBulkImport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig(direction ? { key, direction } : null);
  };

  const processedProducts = useMemo(() => {
    let items = [...products].filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig && sortConfig.direction) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [products, searchTerm, sortConfig]);

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    if (sortConfig.direction === 'asc') return <ChevronUp className="w-3.5 h-3.5 text-teal-600" />;
    if (sortConfig.direction === 'desc') return <ChevronDown className="w-3.5 h-3.5 text-teal-600" />;
    return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const stockVal = parseInt(formData.get('stock') as string) || 0;
    
    const data: any = {
      name: formData.get('name'),
      category: formData.get('category'),
      barcode: formData.get('barcode'),
      price: parseFloat(formData.get('price') as string),
      stock: stockVal,
      supplierName: formData.get('supplierName') || 'Internal',
      status: stockVal === 0 ? 'Out of Stock' : stockVal < 10 ? 'Low Stock' : 'In Stock',
      image: editingProduct?.image || `https://picsum.photos/seed/${formData.get('barcode')}/200/200`
    };

    if (editingProduct) {
      onUpdate({ ...editingProduct, ...data });
    } else {
      onAdd({ ...data, id: Date.now().toString() });
    }
    
    closeModals();
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const exportCSV = () => {
    const headers = ['Product', 'Barcode', 'Category', 'Status', 'Stock', 'Supplier Name', 'Price'];
    const rows = products.map(p => [
      `"${p.name}"`, p.barcode, p.category, p.status, p.stock, `"${p.supplierName}"`, p.price
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "pet_store_inventory.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) return;
      const parseCSVLine = (line: string) => {
        const result = [];
        let cur = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
          else cur += char;
        }
        result.push(cur.trim());
        return result;
      };
      const importedItems: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 6) continue;
        const stock = parseInt(cols[4]) || 0;
        importedItems.push({
          id: `imp-${Date.now()}-${i}`,
          name: cols[0],
          barcode: cols[1],
          category: CATEGORIES.includes(cols[2]) ? cols[2] : CATEGORIES[1],
          stock,
          supplierName: cols[5],
          price: parseFloat(cols[6]) || 0,
          status: stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock',
          image: `https://picsum.photos/seed/${cols[1]}/200/200`
        });
      }
      onBulkImport(importedItems);
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
            Showing {processedProducts.length} items
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4"><button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-teal-600 group">Product Name {getSortIcon('name')}</button></th>
                <th className="px-6 py-4"><button onClick={() => handleSort('barcode')} className="flex items-center gap-2 hover:text-teal-600 group">Barcode {getSortIcon('barcode')}</button></th>
                <th className="px-6 py-4"><button onClick={() => handleSort('category')} className="flex items-center gap-2 hover:text-teal-600 group">Category {getSortIcon('category')}</button></th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center"><button onClick={() => handleSort('stock')} className="flex items-center gap-2 mx-auto hover:text-teal-600 group">Stock {getSortIcon('stock')}</button></th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedProducts.map(product => {
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} className="w-8 h-8 rounded-lg bg-slate-100 object-cover" />
                        <span className="font-medium text-slate-800 text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit"><Scan className="w-3 h-3 text-teal-500" />{product.barcode}</div></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">{product.category}</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                        product.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'In Stock' ? 'bg-green-500' : product.status === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'}`} />
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">{product.stock}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(product.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 bg-teal-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                  <input name="name" defaultValue={editingProduct?.name || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">SKU / Barcode</label>
                  <input name="barcode" defaultValue={editingProduct?.barcode || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select name="category" defaultValue={editingProduct?.category || CATEGORIES[1]} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sale Price ($)</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Stock Quantity</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Supplier</label>
                  <input name="supplierName" defaultValue={editingProduct?.supplierName || ''} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModals} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-lg bg-teal-600 hover:bg-teal-700">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
