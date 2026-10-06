import React from 'react';
import { 
  Search, 
  User, 
  Bell, 
  Menu, 
  LogOut, 
  Database, 
  FolderGit2 
} from 'lucide-react';
import { AdminUserItem } from '../services/config';
import { TabKey } from './Sidebar';

interface NavbarProps {
  currentTab: TabKey;
  adminUser: AdminUserItem | null;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  adminUser,
  onOpenAdminLogin,
  onAdminLogout,
  onToggleSidebar,
}) => {
  const getTabTitle = (tab: TabKey) => {
    switch (tab) {
      case 'beranda':
        return 'Dashboard';
      case 'agenda':
        return 'Kalender Agenda';
      case 'proposal':
        return 'Pengajuan Proposal';
      case 'cek-proposal':
        return 'Cek Status Proposal';
      case 'laporan':
        return 'Laporan Daerah';
      case 'sensus':
        return 'Sensus Data Jamaah';
      case 'admin':
        return 'Admin & Verifikasi';
      default:
        return 'Dashboard';
    }
  };

  const title = getTabTitle(currentTab);

  return (
    <header className="sticky top-4 z-30 px-4 sm:px-6 lg:px-8 mb-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 sm:py-3.5 sm:px-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Purity UI Breadcrumbs & Page Heading */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Pages</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{title}</span>
            </div>
            {/* Title */}
            <h1 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight mt-0.5">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Search, Integrations & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 justify-end">
          {/* Purity UI Search Box */}
          <div className="relative hidden sm:block w-44 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari sesuatu..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden transition-all"
            />
          </div>

          {/* Quick Integration Indicators - Khusus Admin */}
          {adminUser && (
            <div className="hidden xl:flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/60 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-slate-600">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Sheet: <code className="font-mono text-slate-700">172820086</code>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <FolderGit2 className="w-3.5 h-3.5 text-teal-500" />
                Drive: <code className="font-mono text-slate-700">...yblmr</code>
              </span>
            </div>
          )}

          {/* User Sign In / Profile Button in Purity UI style */}
          {adminUser ? (
            <div className="flex items-center gap-2 bg-teal-50/80 pl-2 pr-1.5 py-1 rounded-xl border border-teal-200 text-xs">
              <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {adminUser.name[0]}
              </div>
              <span className="font-bold text-slate-800 max-w-28 truncate hidden md:inline">
                {adminUser.name}
              </span>
              <button
                type="button"
                onClick={onAdminLogout}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                title="Keluar Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Masuk Admin</span>
            </button>
          )}

          {/* Notification Icon */}
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl relative transition-colors cursor-pointer"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-teal-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
};
