
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Shield, User as UserIcon, Plus, Trash2, Edit2, ShieldAlert, BadgeCheck, X, Key, Eye, EyeOff, Camera, Image as ImageIcon } from 'lucide-react';

interface UsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Users: React.FC<UsersProps> = ({ users, setUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [formAvatar, setFormAvatar] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingUser) {
      setFormAvatar(editingUser.avatar || '');
    } else {
      setFormAvatar('');
    }
  }, [editingUser, isModalOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const pin = formData.get('pin') as string;

    // Use uploaded avatar or fallback to auto-generated one
    const finalAvatar = formAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { 
        ...u, 
        name, 
        username, 
        role, 
        pin,
        avatar: finalAvatar
      } : u));
    } else {
      setUsers(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        name,
        username,
        role,
        pin,
        avatar: finalAvatar
      }]);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setShowPin(false);
    setFormAvatar('');
  };

  const deleteUser = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Team Management</h2>
          <p className="text-slate-500">Control staff permissions and terminal access</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-20">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 group hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50">
                  <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{user.name}</h3>
                  <p className="text-sm text-slate-400 font-medium">@{user.username}</p>
                </div>
              </div>
              <div className={`p-2 rounded-xl ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                {user.role === 'ADMIN' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</span>
                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${user.role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-teal-600 text-white'}`}>
                  {user.role}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal PIN</span>
                <span className="text-xs font-mono font-bold text-slate-600">••••{user.pin.slice(-2)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {user.role === 'ADMIN' ? (
                  <>
                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-indigo-500" /> Full System</span>
                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-indigo-500" /> Analytics</span>
                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-indigo-500" /> Inventory</span>
                  </>
                ) : (
                  <>
                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-teal-500" /> Sales Terminal</span>
                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-teal-500" /> History</span>
                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center gap-1 text-slate-300 line-through"><ShieldAlert className="w-3 h-3" /> No Admin</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button 
                onClick={() => deleteUser(user.id)}
                className="flex items-center justify-center p-2.5 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 italic uppercase">
                {editingUser ? 'Update Staff Member' : 'New Staff Member'}
              </h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-indigo-500 transition-all shadow-inner">
                      {formAvatar ? (
                        <img src={formAvatar} className="w-full h-full object-cover" alt="Avatar Preview" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                           <ImageIcon className="w-6 h-6 mb-1" />
                           <span className="text-[8px] font-bold uppercase">Upload</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                         <Camera className="w-5 h-5" />
                      </div>
                   </div>
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                   />
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Profile Picture</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Display Name</label>
                <input name="name" defaultValue={editingUser?.name || ''} required placeholder="e.g. Sarah Jones" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Username</label>
                <input name="username" defaultValue={editingUser?.username || ''} required placeholder="e.g. sarahj" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Terminal Access PIN</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    name="pin" 
                    type={showPin ? "text" : "password"}
                    defaultValue={editingUser?.pin || ''} 
                    required 
                    placeholder="e.g. 1234" 
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold font-mono" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Security Role</label>
                <select name="role" defaultValue={editingUser?.role || 'STAFF'} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold">
                  <option value="ADMIN">ADMIN - Full Access</option>
                  <option value="STAFF">STAFF - Sales & Inventory Read</option>
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase transition-all shadow-lg shadow-indigo-200">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
