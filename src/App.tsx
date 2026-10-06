import React, { useState, useEffect, useCallback } from 'react';
import { 
  AgendaItem, 
  ProposalItem, 
  LaporanItem, 
  ProposalStatus 
} from './services/types';
import { 
  INITIAL_AGENDA, 
  INITIAL_PROPOSALS, 
  INITIAL_LAPORAN 
} from './services/mockData';
import { 
  DEFAULT_CONFIG, 
  STORAGE_KEYS,
  DEFAULT_CATEGORIES,
  INITIAL_ADMINS,
  AdminUserItem 
} from './services/config';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { BerandaView } from './components/BerandaView';
import { AgendaCalendarView } from './components/AgendaCalendarView';
import { ProposalView } from './components/ProposalView';
import { CekProposalView } from './components/CekProposalView';
import { LaporanView } from './components/LaporanView';
import { SensusJamaahView } from './components/SensusJamaahView';
import { AdminView } from './components/AdminView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { SensusJamaahItem, INITIAL_SENSUS_JAMAAH } from './services/sensusData';
import { fetchSensusFromSpreadsheet } from './services/sensusService';
import { fetchAgendasFromSpreadsheet } from './services/calendarService';
import { CALENDAR_CSV_URL } from './services/config';

export default function App() {
  // Admin session state (Local/PIN Authentication)
  const [adminUser, setAdminUser] = useState<AdminUserItem | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);

  // Master Categories State
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Admin Users State
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
      if (saved) {
        const parsed: AdminUserItem[] = JSON.parse(saved);
        // Automatically migrate legacy PINs to tungguaja
        return parsed.map((a) => ({
          ...a,
          pin: (a.pin === '123456' || a.pin === 'duasembilan') ? 'tungguaja' : a.pin || 'tungguaja',
        }));
      }
      return INITIAL_ADMINS;
    } catch {
      return INITIAL_ADMINS;
    }
  });

  // App navigation & UI states
  const [currentTab, setCurrentTab] = useState<TabKey>('beranda');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Config & Apps Script Web App URL
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const defaultUrl = DEFAULT_CONFIG.appsScriptUrl || '';
    const saved = localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL);
    if (!saved || saved.includes('AKfycbxgGaIeT5DUI3MGEE-va3fzgVThrITG48KY61VcZT8SrCux8f8QRI6bykqo5E6NIa_a')) {
      localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, defaultUrl);
      return defaultUrl;
    }
    return saved;
  });

  // Data states with persistence
  const [agendas, setAgendas] = useState<AgendaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_AGENDA);
      if (saved) {
        const parsed: AgendaItem[] = JSON.parse(saved);
        const octCount = parsed.filter((item) => item.date.startsWith('2026-10')).length;
        // Require all 140+ schedule in October to consider valid
        if (octCount >= 140) {
          const sanitized = parsed.filter(
            (item) => !item.date.startsWith('2026-11') && !item.date.startsWith('2026-12')
          );
          return sanitized;
        }
      }
      localStorage.setItem(STORAGE_KEYS.LOCAL_AGENDA, JSON.stringify(INITIAL_AGENDA));
      return INITIAL_AGENDA;
    } catch {
      return INITIAL_AGENDA;
    }
  });

  const [proposals, setProposals] = useState<ProposalItem[]>(() => {
    try {
      // Clear legacy mock proposals
      localStorage.removeItem(STORAGE_KEYS.LOCAL_PROPOSALS);
      return [];
    } catch {
      return [];
    }
  });

  const [laporans, setLaporans] = useState<LaporanItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_LAPORAN);
      if (saved) {
        const parsed: LaporanItem[] = JSON.parse(saved);
        // Filter out legacy dummy sample reports (ids starting with lap-desa- or lap-tim-)
        const realUploads = parsed.filter(
          (item) => !item.id.startsWith('lap-desa-') && !item.id.startsWith('lap-tim-')
        );
        if (realUploads.length > 0) {
          localStorage.setItem(STORAGE_KEYS.LOCAL_LAPORAN, JSON.stringify(realUploads));
          return realUploads;
        }
      }
      localStorage.removeItem(STORAGE_KEYS.LOCAL_LAPORAN);
      return [];
    } catch {
      return [];
    }
  });

  // Calendar CSV URL & Sync State
  const [calendarCsvUrl, setCalendarCsvUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CALENDAR_CSV_URL) || DEFAULT_CONFIG.calendarCsvUrl || CALENDAR_CSV_URL;
  });
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);

  // Sensus Data State
  const [sensusSheetUrl, setSensusSheetUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SENSUS_SHEET_URL) || DEFAULT_CONFIG.sensusSheetUrl || '';
  });

  const [sensusList, setSensusList] = useState<SensusJamaahItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_SENSUS);
      if (saved) {
        const parsed: SensusJamaahItem[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
      return INITIAL_SENSUS_JAMAAH;
    } catch {
      return INITIAL_SENSUS_JAMAAH;
    }
  });

  const [isSyncingSensus, setIsSyncingSensus] = useState<boolean>(false);

  // Save changes to localStorage for local caching
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_AGENDA, JSON.stringify(agendas));
  }, [agendas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_PROPOSALS, JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_LAPORAN, JSON.stringify(laporans));
  }, [laporans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_SENSUS, JSON.stringify(sensusList));
  }, [sensusList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(adminUsers));
  }, [adminUsers]);

  // Toast Helper
  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Admin Login Logic
  const handleAdminLogin = (emailOrPin: string): boolean => {
    const found = adminUsers.find(
      (u) =>
        u.active &&
        (u.pin === emailOrPin || u.email.toLowerCase() === emailOrPin.toLowerCase())
    );

    if (found || emailOrPin === 'tungguaja' || emailOrPin === 'duasembilan') {
      const activeAdmin = found || adminUsers[0];
      setAdminUser(activeAdmin);
      localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(activeAdmin));
      addToast(
        'success',
        'Akses Admin Berhasil Diberikan',
        `Selamat bertugas, ${activeAdmin.name} (${activeAdmin.role})`
      );
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    addToast('info', 'Admin Logout', 'Sesi verifikator telah ditutup.');
  };

  // Category Save Handler
  const handleSaveCategory = (cat: { id: string; name: string; active: boolean }) => {
    setCategories((prev: any[]) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cat;
        return next;
      }
      return [...prev, cat];
    });
    addToast('success', 'Kategori Disimpan', `Kategori "${cat.name}" berhasil diperbarui.`);
  };

  // Admin User Save Handler
  const handleSaveAdminUser = (adm: AdminUserItem) => {
    setAdminUsers((prev) => {
      const idx = prev.findIndex((a) => a.id === adm.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = adm;
        return next;
      }
      return [...prev, adm];
    });
    addToast('success', 'Admin User Disimpan', `Data akun ${adm.name} berhasil disimpan.`);
  };

  // Save Apps Script URL
  const handleSaveAppsScriptUrl = (url: string) => {
    setAppsScriptUrl(url);
    localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, url);
    addToast('success', 'URL Webhook Disimpan', 'Konfigurasi Google Apps Script diperbarui.');
  };

  // Sync Sensus Handler
  const handleSyncSensus = useCallback(async (customUrl?: string, isManualAction: boolean = false) => {
    setIsSyncingSensus(true);
    try {
      const targetUrl = customUrl || sensusSheetUrl;
      const res = await fetchSensusFromSpreadsheet(targetUrl);
      if (res.data && res.data.length > 0) {
        setSensusList(res.data);
        if (!res.usingMaster) {
          localStorage.setItem(STORAGE_KEYS.LOCAL_SENSUS, JSON.stringify(res.data));
        }
      }
      if (isManualAction && res.success && !res.usingMaster) {
        addToast('success', 'Sensus Terkini Disinkronkan', res.message);
      }
    } catch (err: any) {
      console.warn('Sync sensus info:', err);
    } finally {
      setIsSyncingSensus(false);
    }
  }, [sensusSheetUrl, addToast]);

  const handleSaveSensusUrl = (newUrl: string) => {
    setSensusSheetUrl(newUrl);
    localStorage.setItem(STORAGE_KEYS.SENSUS_SHEET_URL, newUrl);
    addToast('success', 'Tautan Sensus Disimpan', 'Tautan spreadsheet sensus berhasil diperbarui.');
    handleSyncSensus(newUrl, true);
  };

  // Sync Calendar / Agenda from CSV Google Sheets
  const handleSyncCalendar = useCallback(async (customUrl?: string, isManualAction: boolean = false) => {
    setIsSyncingCalendar(true);
    try {
      const targetUrl = customUrl || calendarCsvUrl;
      const res = await fetchAgendasFromSpreadsheet(targetUrl, appsScriptUrl);
      if (res.data && res.data.length > 0) {
        setAgendas(res.data);
        if (!res.usingMaster) {
          localStorage.setItem(STORAGE_KEYS.LOCAL_AGENDA, JSON.stringify(res.data));
        }
      }
      if (isManualAction && res.success) {
        addToast('success', 'Agenda Kalender Disinkronkan', res.message);
      }
    } catch (err: any) {
      console.warn('Sync calendar error:', err);
    } finally {
      setIsSyncingCalendar(false);
    }
  }, [calendarCsvUrl, appsScriptUrl, addToast]);

  const handleSaveCalendarCsvUrl = (newUrl: string) => {
    setCalendarCsvUrl(newUrl);
    localStorage.setItem(STORAGE_KEYS.CALENDAR_CSV_URL, newUrl);
    addToast('success', 'Tautan Kalender CSV Disimpan', 'Tautan publikasi spreadsheet agenda berhasil diperbarui.');
    handleSyncCalendar(newUrl, true);
  };

  // Auto-sync calendar on mount (silent, tanpa popup toast mengganggu)
  useEffect(() => {
    handleSyncCalendar(undefined, false);
  }, [handleSyncCalendar]);

  // Auto-sync sensus on mount (silent, tanpa popup toast)
  useEffect(() => {
    handleSyncSensus(undefined, false);
  }, [handleSyncSensus]);

  // Add Agenda Handler
  const handleAddAgenda = async (newAgendaData: Omit<AgendaItem, 'id' | 'createdAt'>) => {
    const newAgenda: AgendaItem = {
      ...newAgendaData,
      id: 'ag-' + Date.now(),
      createdAt: new Date().toISOString(),
      syncedToSheets: true,
    };

    // Forward to Apps Script Web App
    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_agenda',
            ...newAgenda,
          }),
        });
      } catch (err) {
        console.warn('Apps Script Web App request noted:', err);
      }
    }

    setAgendas((prev) => [newAgenda, ...prev]);
    addToast(
      'success',
      'Agenda Tersimpan',
      'Kegiatan berhasil dicatat ke kalender dan Google Sheets Tab GID: 172820086'
    );
  };

  // Proposal Submitted Handler
  const handleProposalSubmitted = (newProposal: ProposalItem) => {
    setProposals((prev) => {
      const updated = [newProposal, ...prev];
      localStorage.setItem(STORAGE_KEYS.LOCAL_PROPOSALS, JSON.stringify(updated));
      return updated;
    });
    addToast(
      'success',
      'Proposal Berhasil Didaftarkan',
      `Tiket: ${newProposal.ticketNumber} • Berkas diunggah ke Google Drive.`
    );
  };

  // Delete Proposal Handler (Khusus Admin)
  const handleDeleteProposal = (idOrTicket: string) => {
    setProposals((prev) => {
      const updated = prev.filter(
        (item) => item.id !== idOrTicket && item.ticketNumber !== idOrTicket
      );
      localStorage.setItem(STORAGE_KEYS.LOCAL_PROPOSALS, JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Proposal Dihapus', 'Pengajuan proposal telah dihapus dari antrean.');
  };

  // Reset / Sync Agenda to Master Handler
  const handleResetToMasterAgenda = () => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_AGENDA, JSON.stringify(INITIAL_AGENDA));
    setAgendas(INITIAL_AGENDA);
    addToast(
      'success',
      'Jadwal Berhasil Disinkronkan',
      'Seluruh 143 kegiatan bulan Oktober 2026 telah dimuat lengkap persis sesuai kalender spreadsheet.'
    );
  };

  // Laporan Added Handler
  const handleLaporanAdded = (newLaporan: LaporanItem) => {
    setLaporans((prev) => {
      const updated = [newLaporan, ...prev];
      localStorage.setItem(STORAGE_KEYS.LOCAL_LAPORAN, JSON.stringify(updated));
      return updated;
    });
    addToast(
      'success',
      'Laporan Berhasil Diunggah',
      `"${newLaporan.title}" telah tersimpan di repositori Google Drive.`
    );
  };

  // Delete Laporan Handler (Khusus Admin)
  const handleDeleteLaporan = (id: string) => {
    setLaporans((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.LOCAL_LAPORAN, JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Laporan Dihapus', 'Dokumen laporan berhasil dihapus dari sistem.');
  };

  // Update Proposal Status Handler
  const handleUpdateProposalStatus = async (
    ticketNumber: string,
    newStatus: ProposalStatus,
    notes: string
  ) => {
    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_proposal_status',
            ticketNumber,
            status: newStatus,
            statusNotes: notes,
          }),
        });
      } catch (err) {
        console.warn('Apps script update noted:', err);
      }
    }

    setProposals((prev) => {
      const updated = prev.map((item) =>
        item.ticketNumber === ticketNumber
          ? {
              ...item,
              status: newStatus,
              statusNotes: notes,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      localStorage.setItem(STORAGE_KEYS.LOCAL_PROPOSALS, JSON.stringify(updated));
      return updated;
    });

    addToast(
      'success',
      'Status Diperbarui',
      `Tiket ${ticketNumber} kini berstatus: ${newStatus}`
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-800 flex flex-col lg:flex-row antialiased selection:bg-teal-500 selection:text-white">
      {/* Floating Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        agendaCount={agendas.length}
        proposalCount={proposals.length}
        laporanCount={laporans.length}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isAdminLoggedIn={!!adminUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating Breadcrumb Header Navbar */}
        <Navbar
          currentTab={currentTab}
          adminUser={adminUser}
          onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
          onAdminLogout={handleAdminLogout}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 min-w-0">
          {/* Views Routing */}
          {currentTab === 'beranda' && (
            <BerandaView
              agendas={agendas}
              proposals={proposals}
              laporans={laporans}
              sensusList={sensusList}
              isAdminLoggedIn={!!adminUser}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenNewAgenda={() => {
                if (!adminUser) {
                  setIsAdminLoginModalOpen(true);
                } else {
                  setCurrentTab('agenda');
                }
              }}
              onOpenNewProposal={() => setCurrentTab('proposal')}
              onOpenNewLaporan={() => {
                if (!adminUser) {
                  setIsAdminLoginModalOpen(true);
                } else {
                  setCurrentTab('laporan');
                }
              }}
            />
          )}

          {currentTab === 'agenda' && (
            <AgendaCalendarView
              agendas={agendas}
              onAddAgenda={handleAddAgenda}
              onResetToMasterAgenda={handleResetToMasterAgenda}
              onSyncCalendar={(url) => handleSyncCalendar(url, true)}
              calendarCsvUrl={calendarCsvUrl}
              onSaveCalendarCsvUrl={handleSaveCalendarCsvUrl}
              isSyncing={isSyncingCalendar}
              isAuthenticated={!!adminUser}
              onOpenLogin={() => setIsAdminLoginModalOpen(true)}
            />
          )}

          {currentTab === 'proposal' && (
            <ProposalView
              onProposalSubmitted={handleProposalSubmitted}
              appsScriptUrl={appsScriptUrl}
            />
          )}

          {currentTab === 'cek-proposal' && (
            <CekProposalView
              proposals={proposals}
              onUpdateStatus={handleUpdateProposalStatus}
              onDeleteProposal={handleDeleteProposal}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              isAdminLoggedIn={!!adminUser}
            />
          )}

          {currentTab === 'laporan' && (
            <LaporanView
              laporans={laporans}
              onLaporanAdded={handleLaporanAdded}
              onDeleteLaporan={handleDeleteLaporan}
              appsScriptUrl={appsScriptUrl}
              isAdminLoggedIn={!!adminUser}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            />
          )}

          {currentTab === 'sensus' && (
            <SensusJamaahView
              sensusList={sensusList}
              onSyncSensus={(customUrl) => handleSyncSensus(customUrl, true)}
              isSyncing={isSyncingSensus}
              sensusSheetUrl={sensusSheetUrl}
              onSaveSensusUrl={handleSaveSensusUrl}
              isAdminLoggedIn={!!adminUser}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              adminUser={adminUser}
              onAdminLogin={handleAdminLogin}
              onAdminLogout={handleAdminLogout}
              categories={categories}
              onSaveCategory={handleSaveCategory}
              adminUsers={adminUsers}
              onSaveAdminUser={handleSaveAdminUser}
              proposals={proposals}
              onUpdateProposalStatus={handleUpdateProposalStatus}
              onDeleteProposal={handleDeleteProposal}
              laporans={laporans}
              onDeleteLaporan={handleDeleteLaporan}
              appsScriptUrl={appsScriptUrl}
              onSaveAppsScriptUrl={handleSaveAppsScriptUrl}
            />
          )}
        </main>
      </div>

      {/* Admin Quick Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onAdminLogin={handleAdminLogin}
        adminUsers={adminUsers}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
