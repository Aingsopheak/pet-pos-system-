
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, BrainCircuit, Lightbulb, MessageSquare } from 'lucide-react';
import { getInventoryInsights, getChatResponse } from '../services/geminiService';
import { Product, Sale } from '../types';

interface AIChatProps {
  products: Product[];
  sales: Sale[];
}

const AIChat: React.FC<AIChatProps> = ({ products, sales }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', parts: string }[]>([
    { role: 'model', parts: 'Hello! I am your PawPrint Business Advisor. I have analyzed your current inventory and sales. How can I help you optimize your store today?' }
  ]);
  const [input, setInput] = useState('');
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial inventory insight
    const fetchInsights = async () => {
      setInsightLoading(true);
      const text = await getInventoryInsights(products, sales);
      setInsights(text);
      setInsightLoading(false);
    };
    fetchInsights();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: userMessage }]);
    setLoading(true);

    const response = await getChatResponse(messages, userMessage);
    setMessages(prev => [...prev, { role: 'model', parts: response }]);
    setLoading(false);
  };

  const quickTips = [
    "What should I restock first?",
    "How was my sales performance today?",
    "Suggest a weekend promotion",
    "How to improve cat toy sales?"
  ];

  return (
    <div className="h-full bg-slate-100 p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
      {/* Sidebar: AI Insights */}
      <div className="w-full md:w-80 space-y-6 flex-shrink-0">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-lg">Smart Insights</h3>
          </div>
          {insightLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-2 bg-teal-400/30 rounded w-full"></div>
              <div className="h-2 bg-teal-400/30 rounded w-3/4"></div>
              <div className="h-2 bg-teal-400/30 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed opacity-90 whitespace-pre-line prose-invert">
              {insights}
            </div>
          )}
          <button 
            onClick={async () => {
                setInsightLoading(true);
                const text = await getInventoryInsights(products, sales);
                setInsights(text);
                setInsightLoading(false);
            }}
            className="mt-6 w-full py-2 bg-teal-500/30 hover:bg-teal-500/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <BrainCircuit className="w-4 h-4" />
            Refresh Analysis
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hidden md:block">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Strategy Tips
          </h4>
          <ul className="space-y-2">
            {quickTips.map((tip, i) => (
              <li key={i}>
                <button 
                  onClick={() => setInput(tip)}
                  className="w-full text-left text-xs p-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-teal-600 border border-transparent hover:border-slate-200 transition-all"
                >
                  {tip}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Business Assistant</h3>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online & Analyzing</p>
            </div>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                m.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
              }`}>
                {m.parts}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              placeholder="Ask anything about your store..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            AI recommendations are based on your inventory data. Always verify critical business decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper component for Bot icon since it's used in AIChat too
const Bot: React.FC<{className?: string}> = ({className}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
  </svg>
);

export default AIChat;
