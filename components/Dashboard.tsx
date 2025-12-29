
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, DollarSign, Package, Calendar, FileText, Download, ChevronRight } from 'lucide-react';
import { Sale, Product } from '../types';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('daily');

  // Logic to filter sales based on period
  const filteredSales = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    return sales.filter(s => {
      const diff = now - s.timestamp;
      if (reportPeriod === 'daily') return diff <= dayMs;
      if (reportPeriod === 'weekly') return diff <= dayMs * 7;
      if (reportPeriod === 'monthly') return diff <= dayMs * 30;
      return true;
    });
  }, [sales, reportPeriod]);

  // Key Metrics for filtered sales
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = filteredSales.length;
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  // Top Selling Products Calculation
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!counts[item.id]) {
          counts[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        counts[item.id].quantity += item.quantity;
        counts[item.id].revenue += item.quantity * item.price;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  // Chart data: Sales by hour or day depending on period
  const chartData = useMemo(() => {
    if (reportPeriod === 'daily') {
      return Array.from({ length: 12 }, (_, i) => {
        const hour = i + 8; // 8 AM onwards
        const amount = filteredSales
          .filter(s => new Date(s.timestamp).getHours() === hour)
          .reduce((sum, s) => sum + s.total, 0);
        return { name: `${hour}:00`, amount };
      });
    } else {
      // Group by day for weekly/monthly
      const days: Record<string, number> = {};
      filteredSales.forEach(s => {
        const d = new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        days[d] = (days[d] || 0) + s.total;
      });
      return Object.entries(days).map(([name, amount]) => ({ name, amount }));
    }
  }, [filteredSales, reportPeriod]);

  const COLORS = ['#0d9488', '#0891b2', '#0284c7', '#0369a1', '#075985'];

  return (
    <div className="p-6 bg-slate-50 h-full overflow-y-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Business Dashboard</h2>
          <p className="text-slate-500">Sales performance and top products summary</p>
        </div>
        
        <div className="flex items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start">
          {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setReportPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                reportPeriod === p 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-teal-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">${totalRevenue.toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-1">Total in {reportPeriod} period</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sales</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalTransactions}</h3>
          <p className="text-xs text-slate-500 mt-1">Transactions processed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Basket</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">${avgTransactionValue.toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-1">Revenue per customer</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{products.length}</h3>
          <p className="text-xs text-slate-500 mt-1">Active items in stock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Sales Activity Analysis
            </h3>
            <button className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1">
              <Download className="w-3 h-3" />
              Download Report
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Top 5 Best Sellers
          </h3>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 italic text-sm">No sales data yet</div>
            ) : (
              topProducts.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group cursor-default">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.quantity} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">${item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {topProducts.length > 0 && (
            <button className="w-full mt-8 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 transition-colors">
              View Detailed Product Stats
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Period Comparison Visualization (Mini Pie) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6">Payment Method Split</h3>
            <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={[
                           { name: 'Cash', value: filteredSales.filter(s => s.paymentMethod === 'Cash').length },
                           { name: 'Card', value: filteredSales.filter(s => s.paymentMethod === 'Card').length }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={10}
                        dataKey="value"
                     >
                        <Cell fill="#f59e0b" />
                        <Cell fill="#0d9488" />
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-teal-600 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-xl font-bold mb-2">Performance Summary</h3>
               <p className="text-teal-100 text-sm mb-6 leading-relaxed">
                  Your store is currently seeing a {reportPeriod} revenue of <strong>${totalRevenue.toFixed(0)}</strong> with an average ticket size of <strong>${avgTransactionValue.toFixed(2)}</strong>. 
                  {topProducts.length > 0 ? ` ${topProducts[0].name} is currently your star performer.` : ''}
               </p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
                     <p className="text-[10px] font-bold text-teal-300 uppercase">Growth</p>
                     <p className="text-xl font-bold">+12.5%</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
                     <p className="text-[10px] font-bold text-teal-300 uppercase">Target</p>
                     <p className="text-xl font-bold">88%</p>
                  </div>
               </div>
            </div>
            <TrendingUp className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 rotate-12" />
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
