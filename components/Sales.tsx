
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, CreditCard, Banknote, Eye, ArrowRight, Download, ArrowUpDown, ChevronUp, ChevronDown, Clock, ChevronLeft, ChevronRight, CloudSync, CheckCircle } from 'lucide-react';
import { Sale } from '../types';
import Receipt from './Receipt';

interface SalesProps {
  sales: Sale[];
}

type SortKey = 'id' | 'timestamp' | 'total' | 'items';
type SortDirection = 'asc' | 'desc' | null;

const Sales: React.FC<SalesProps> = ({ sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'timestamp', direction: 'desc' });
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when search or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key, direction });
  };

  const filteredSales = useMemo(() => {
    let result = sales.filter(s => 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig.direction) {
      result.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortConfig.key) {
          case 'id': aVal = a.id; bVal = b.id; break;
          case 'timestamp': aVal = a.timestamp; bVal = b.timestamp; break;
          case 'total': aVal = a.total; bVal = b.total; break;
          case 'items': aVal = a.items.length; bVal = b.items.length; break;
          default: aVal = 0; bVal = 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [sales, searchTerm, sortConfig]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key || !sortConfig.direction) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-teal-600" /> : <ChevronDown className="w-3 h-3 text-teal-600" />;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales Transactions</h2>
          <p className="text-slate-500">Track and review your store's transaction history</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by ID or product..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all active:scale-95" title="Export CSV">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Scrollable area for the sales table */}
        <div className="flex-1 overflow-auto relative scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-slate-100">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    ID {getSortIcon('id')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('timestamp')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    <Calendar className="w-3 h-3" /> Date & Time {getSortIcon('timestamp')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">
                  <button onClick={() => handleSort('items')} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                    Items {getSortIcon('items')}
                  </button>
                </th>
                <th className="px-6 py-4 bg-white">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right bg-white">
                  <button onClick={() => handleSort('total')} className="flex items-center gap-1 ml-auto hover:text-teal-600 transition-colors">
                    Total {getSortIcon('total')}
                  </button>
                </th>
                <th className="px-6 py-4 text-center bg-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100 uppercase">
                      #{sale.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 font-bold leading-none mb-1">
                          {new Date(sale.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                          {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {sale.items.length} {sale.items.length === 1 ? 'Item' : 'Items'}
                      </span>
                      <div className="flex -space-x-2">
                        {sale.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                            <img src={item.image} alt="" className="w-full h-full object-cover" title={item.name} />
                          </div>
                        ))}
                        {sale.items.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shadow-sm">
                            +{sale.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      sale.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {sale.paymentMethod === 'Card' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {sale.syncStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        <CloudSync className="w-3 h-3" /> Pending Sync
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                        <CheckCircle className="w-3 h-3" /> Synced
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-slate-900 tracking-tight">${sale.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 text-slate-400 hover:text-teal-600 transition-colors bg-white rounded-lg shadow-sm border border-slate-100 active:scale-90"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                      <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching history</p>
                    <p className="text-xs text-slate-300 mt-1 italic">Try adjusting your search query</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length}
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

      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="animate-in zoom-in-95 duration-200">
            <Receipt sale={selectedSale} onClose={() => setSelectedSale(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
