
import React, { useState } from 'react';
import { Dog, Key, User as UserIcon, LogIn, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsLoading(true);
    setError(null);

    // Simulate auth delay
    setTimeout(() => {
      // Validate PIN
      if (password === selectedUser.pin) {
        onLogin(selectedUser);
      } else {
        setError("Invalid Access PIN. Please try again.");
        setPassword('');
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <Dog className="absolute -top-10 -left-10 w-64 h-64 text-teal-500 rotate-12" />
        <Sparkles className="absolute top-1/4 right-10 w-32 h-32 text-indigo-500" />
        <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[40px] shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-500 text-white rounded-3xl shadow-xl shadow-teal-500/20 mb-6 transform hover:rotate-6 transition-transform">
              <Dog className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-white italic tracking-tight">PAWPRINT POS</h1>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Retail Terminal Login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-300 uppercase tracking-widest px-1">Select User Profile</label>
              <div className="grid grid-cols-2 gap-3">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setSelectedUser(u); setError(null); }}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${
                      selectedUser?.id === u.id 
                      ? 'bg-teal-500 border-teal-400 text-white shadow-lg' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                      <img src={u.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black leading-none">{u.name}</p>
                      <p className={`text-[8px] uppercase font-bold mt-1 ${selectedUser?.id === u.id ? 'text-teal-100' : 'text-slate-500'}`}>{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-300 uppercase tracking-widest px-1">Access PIN</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <input 
                  type="password" 
                  placeholder="Enter your security PIN"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 px-1 text-red-400 text-[10px] font-bold uppercase animate-bounce">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={!selectedUser || isLoading || !password}
              className="w-full py-5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Access Terminal
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            Secure & Encrypted Session
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-8">
          PawPrint Retail Systems • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Login;
