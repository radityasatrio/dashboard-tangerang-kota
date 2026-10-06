import React from 'react';
import { 
  Home, 
  Calendar, 
  FileText, 
  Search, 
  Folder, 
  Shield, 
  HelpCircle,
  ExternalLink,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import { DEFAULT_CONFIG } from '../services/config';

export type TabKey = 'beranda' | 'agenda' | 'proposal' | 'cek-proposal' | 'laporan' | 'sensus' | 'admin';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  agendaCount: number;
  proposalCount: number;
  laporanCount: number;
  isOpen: boolean;
  onCloseMobile: () => void;
  isAdminLoggedIn: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  agendaCount,
  proposalCount,
  laporanCount,
  isOpen,
  onCloseMobile,
  isAdminLoggedIn,
}) => {
  const mainPages = [
    {
      key: 'beranda' as TabKey,
      label: 'Dashboard',
      icon: Home,
    },
    {
      key: 'agenda' as TabKey,
      label: 'Kalender Agenda',
      icon: Calendar,
      badge: agendaCount > 0 ? agendaCount : undefined,
    },
    {
      key: 'proposal' as TabKey,
      label: 'Pengajuan Proposal',
      icon: FileText,
    },
    {
      key: 'cek-proposal' as TabKey,
      label: 'Cek Status Proposal',
      icon: Search,
      badge: proposalCount > 0 ? proposalCount : undefined,
    },
    {
      key: 'laporan' as TabKey,
      label: 'Laporan Daerah',
      icon: Folder,
      badge: laporanCount > 0 ? laporanCount : undefined,
    },
    {
      key: 'sensus' as TabKey,
      label: 'Sensus Data Jamaah',
      icon: Users,
    },
  ];

  const accountPages = [
    {
      key: 'admin' as TabKey,
      label: 'Admin & Verifikasi',
      icon: Shield,
      highlight: true,
    },
  ];

  const handleNavClick = (key: TabKey) => {
    onSelectTab(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Floating Purity UI Sidebar */}
      <aside
        className={`fixed lg:sticky top-4 left-4 z-40 h-[calc(100vh-2rem)] w-64 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between transition-all duration-300 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-2 pb-1">
            <div className="flex items-center gap-3">
              {/* Purity UI stylized emblem */}
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/30 shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold text-xs tracking-wider text-slate-800 uppercase">
                  PURITY UI
                </h2>
                <p className="text-[10px] font-bold text-teal-600 tracking-wide">
                  TANGERANG KOTA
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

          {/* Section: PAGES */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Pages
            </div>
            <nav className="space-y-1">
              {mainPages.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] text-slate-800 font-bold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Purity UI signature icon container */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-teal-400 text-white shadow-md shadow-teal-400/30'
                            : 'bg-white text-teal-500 shadow-xs border border-slate-100 group-hover:bg-teal-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          isActive
                            ? 'bg-teal-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section: ACCOUNT PAGES */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Account Pages
            </div>
            <nav className="space-y-1">
              {accountPages.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] text-slate-800 font-bold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-teal-400 text-white shadow-md shadow-teal-400/30'
                            : 'bg-white text-teal-500 shadow-xs border border-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {isAdminLoggedIn && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Purity UI Bottom "Need Help?" Card - Khusus Admin */}
        {isAdminLoggedIn && (
          <div className="pt-3">
            <div className="rounded-2xl p-4 bg-linear-to-br from-teal-400 to-teal-600 text-white relative overflow-hidden shadow-lg shadow-teal-500/25">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-3">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-xs">Pusat Bantuan</h4>
              <p className="text-[10px] text-teal-100 leading-tight mt-1">
                Google Drive & Sheets terintegrasi aktif.
              </p>
              <a
                href={`https://drive.google.com/drive/folders/${DEFAULT_CONFIG.driveFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full py-2 bg-white text-slate-800 hover:bg-slate-50 font-extrabold text-[11px] rounded-xl tracking-wider uppercase text-center block shadow-sm transition-all"
              >
                Buka Google Drive
              </a>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
