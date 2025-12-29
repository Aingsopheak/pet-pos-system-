
import React, { useState, useMemo } from 'react';
import { Search, Calendar, CreditCard, Banknote, Eye, ArrowRight, Download } from 'lucide-react';
import { Sale } from '../types';
import Receipt from './Receipt';

interface SalesProps {
  sales: Sale[];
}

const Sales: React.FC<SalesProps> = ({ sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sales, searchTerm]);

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
          <button className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-slate-100">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-medium">
                        {new Date(sale.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <div className="flex -space-x-2">
                        {sale.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                            <img src={item.image} alt="" className="w-full h-full object-cover" title={item.name} />
                          </div>
                        ))}
                        {sale.items.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                            +{sale.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sale.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {sale.paymentMethod === 'Card' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-slate-900">${sale.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 text-slate-400 hover:text-teal-600 transition-colors bg-slate-50 rounded-lg group-hover:bg-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-10" />
                    <p>No transactions found for the search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <Receipt sale={selectedSale} onClose={() => setSelectedSale(null)} />
        </div>
      )}
    </div>
  );
};

export default Sales;
