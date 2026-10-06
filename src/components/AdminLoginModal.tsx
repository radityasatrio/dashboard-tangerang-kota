import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  UserCheck, 
  ShieldAlert 
} from 'lucide-react';
import { AdminUserItem } from '../services/config';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogin: (emailOrPin: string) => boolean;
  adminUsers: AdminUserItem[];
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAdminLogin,
  adminUsers,
}) => {
  const [pinOrEmail, setPinOrEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinOrEmail.trim()) {
      setErrorMsg('Masukkan PIN atau Email Akun Admin.');
      return;
    }

    const success = onAdminLogin(pinOrEmail.trim());
    if (success) {
      setErrorMsg('');
      setPinOrEmail('');
      onClose();
    } else {
      setErrorMsg('PIN atau Email tidak cocok. Coba gunakan PIN default: duasembilan');
    }
  };

  const handleQuickLogin = (pin: string) => {
    const success = onAdminLogin(pin);
    if (success) {
      setErrorMsg('');
      setPinOrEmail('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Masuk Sebagai Admin
              </h3>
              <p className="text-xs text-slate-500">
                Pemerintah Kota Tangerang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              PIN Keamanan Admin (atau Email Petugas):
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={pinOrEmail}
                onChange={(e) => setPinOrEmail(e.target.value)}
                placeholder="Masukkan PIN (Default: duasembilan)"
                className="w-full text-xs font-medium pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Masuk ke Panel Admin
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Pilihan Masuk Cepat (Petugas Contoh):
          </p>
          <div className="space-y-1.5">
            {adminUsers.slice(0, 3).map((adm) => (
              <button
                key={adm.id}
                type="button"
                onClick={() => handleQuickLogin(adm.pin || 'duasembilan')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-700">
                    {adm.name}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {adm.role} • {adm.email}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  Masuk →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
