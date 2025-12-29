
import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, Bot, Dog, History } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'pos', label: 'Sales Terminal', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'history', label: 'Sales History', icon: <History className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Analytics', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'assistant', label: 'AI Business Advisor', icon: <Bot className="w-5 h-5" /> },
  ];

  return (
    <header className="bg-teal-600 text-white shadow-md z-10">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg text-teal-600 shadow-lg">
            <Dog className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PawPrint POS</h1>
            <p className="text-[10px] uppercase tracking-wider opacity-80">Premium Pet Retail Management</p>
          </div>
        </div>

        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                activeTab === tab.id 
                ? 'bg-white text-teal-600 shadow-md' 
                : 'text-teal-100 hover:bg-teal-500/50'
              }`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden lg:block text-xs font-bold uppercase tracking-widest opacity-60">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
};

export default Header;
