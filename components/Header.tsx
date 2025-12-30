
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Bot, Dog, History, Bell, AlertTriangle, Users as UsersIcon, LogOut, ChevronDown } from 'lucide-react';
import { Product, User } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  lowStockItems: Product[];
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, lowStockItems, user, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = user.role === 'ADMIN';

  const tabs = [
    { id: 'pos', label: 'Sales', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
    ...(isAdmin ? [
      { id: 'dashboard', label: 'Analytics', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'users', label: 'Staff', icon: <UsersIcon className="w-5 h-5" /> }
    ] : []),
    { id: 'assistant', label: 'AI Advisor', icon: <Bot className="w-5 h-5" /> },
  ];

  return (
    <header className="bg-teal-600 text-white shadow-md z-[60] relative">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg text-teal-600 shadow-lg">
            <Dog className="w-6 h-6" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold tracking-tight">PawPrint POS</h1>
            <p className="text-[10px] uppercase tracking-wider opacity-80">Premium Retail Terminal</p>
          </div>
        </div>

        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                activeTab === tab.id 
                ? 'bg-white text-teal-600 shadow-md scale-105' 
                : 'text-teal-100 hover:bg-teal-500/50'
              }`}
            >
              {tab.icon}
              <span className="hidden xl:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-teal-100 hover:text-white transition-colors relative"
            >
              <Bell className="w-6 h-6" />
              {lowStockItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-teal-600">
                  {lowStockItems.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[70] text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm">Stock Alerts</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {lowStockItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400"><p className="text-xs font-bold uppercase tracking-widest">No stock alerts</p></div>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer" onClick={() => { setActiveTab('inventory'); setShowNotifications(false); }}>
                        <div className="flex items-center gap-3">
                          <img src={item.image} className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate leading-none mb-1">{item.name}</p>
                            <p className={`text-[10px] font-black uppercase tracking-tight ${item.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                              {item.stock === 0 ? 'Out of Stock' : `${item.stock} units remaining`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-teal-500/50 mx-1 hidden md:block"></div>

          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-teal-700/50 p-1.5 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white/20 shadow-sm bg-teal-800 flex items-center justify-center">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Dog className="w-4 h-4" />}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold leading-none">{user.name}</p>
                <p className="text-[9px] uppercase tracking-widest opacity-70 font-black">{user.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[70] text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-xs font-bold">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">@{user.username}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {(showNotifications || showUserMenu) && <div className="fixed inset-0 z-50" onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}></div>}
    </header>
  );
};

export default Header;
