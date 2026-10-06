import React, { useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  Users, 
  Tag, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  FileCheck, 
  Search, 
  ExternalLink, 
  Globe, 
  Save, 
  Clock, 
  AlertCircle,
  ShieldCheck,
  Building,
  FolderArchive,
  FolderGit2
} from 'lucide-react';
import { AdminRole, AdminUserItem, DEFAULT_CATEGORIES } from '../services/config';
import { ProposalItem, ProposalStatus, LaporanItem } from '../services/types';
import { ConfirmModal } from './ConfirmModal';

interface CategoryItem {
  id: string;
  name: string;
  active: boolean;
}

interface AdminViewProps {
  adminUser: AdminUserItem | null;
  onAdminLogin: (emailOrPin: string) => boolean;
  onAdminLogout: () => void;
  categories: CategoryItem[];
  onSaveCategory: (cat: CategoryItem) => void;
  adminUsers: AdminUserItem[];
  onSaveAdminUser: (adm: AdminUserItem) => void;
  proposals: ProposalItem[];
  onUpdateProposalStatus: (ticket: string, status: ProposalStatus, notes: string) => Promise<void>;
  onDeleteProposal?: (idOrTicket: string) => void;
  laporans?: LaporanItem[];
  onDeleteLaporan?: (id: string) => void;
  appsScriptUrl: string;
  onSaveAppsScriptUrl: (url: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  adminUser,
  onAdminLogin,
  onAdminLogout,
  categories,
  onSaveCategory,
  adminUsers,
  onSaveAdminUser,
  proposals,
  onUpdateProposalStatus,
  onDeleteProposal,
  laporans = [],
  onDeleteLaporan,
  appsScriptUrl,
  onSaveAppsScriptUrl,
}) => {
  // Login State
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Active Tab
  const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'laporans' | 'categories' | 'users' | 'connection'>('proposals');

  // Proposal Quick Action Modal
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [newStatus, setNewStatus] = useState<ProposalStatus>('Sedang Ditinjau');
  const [statusNotes, setStatusNotes] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Proposal Delete Modal State
  const [proposalToDelete, setProposalToDelete] = useState<ProposalItem | null>(null);
  const [isDeleteProposalConfirmOpen, setIsDeleteProposalConfirmOpen] = useState(false);

  // Laporan Delete Modal State
  const [laporanToDelete, setLaporanToDelete] = useState<LaporanItem | null>(null);
  const [isDeleteLaporanConfirmOpen, setIsDeleteLaporanConfirmOpen] = useState(false);

  // Category Editor Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem>({ id: '', name: '', active: true });

  // Admin User Editor Modal
  const [isAdminUserModalOpen, setIsAdminUserModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserItem>({
    id: '',
    name: '',
    email: '',
    role: 'Admin Proposal',
    active: true,
    pin: '',
  });

  // GAS URL input
  const [inputGasUrl, setInputGasUrl] = useState(appsScriptUrl);
  const [gasSaved, setGasSaved] = useState(false);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setLoginError('Masukkan PIN atau Email Admin.');
      return;
    }
    const success = onAdminLogin(pinInput.trim());
    if (!success) {
      setLoginError('PIN atau Email tidak valid. (Gunakan PIN default: duasembilan)');
    } else {
      setLoginError('');
      setPinInput('');
    }
  };

  // If not logged in as Admin, show Admin Login Screen
  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-700 to-teal-700 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Portal Verifikator & Administrator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Khusus petugas berwenang Pemerintah Kota Tangerang
            </p>
          </div>
        </div>

        {loginError && (
          <div className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {loginError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              PIN Keamanan Admin (atau Email):
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN (Default: duasembilan)"
                className="w-full text-xs font-medium pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * Petunjuk verifikator: PIN contoh terpasang adalah <code className="font-mono font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded">duasembilan</code>.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Masuk ke Panel Administrasi
          </button>
        </form>
      </div>
    );
  }

  // Handle Proposal Status Confirmation
  const handleTriggerStatusChange = (prop: ProposalItem) => {
    setSelectedProposal(prop);
    setNewStatus(prop.status);
    setStatusNotes(prop.statusNotes || '');
    setIsConfirmOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedProposal) return;
    setIsConfirmOpen(false);
    await onUpdateProposalStatus(selectedProposal.ticketNumber, newStatus, statusNotes);
    setSelectedProposal(null);
  };

  return (
    <div className="space-y-6">
      {/* Admin Header with Profile and Role */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-base border border-blue-200">
            {adminUser.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">{adminUser.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {adminUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">{adminUser.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAdminLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar Admin
          </button>
        </div>
      </div>

      {/* Admin Subtabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('proposals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'proposals'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Verifikasi Proposal ({proposals.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('laporans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'laporans'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          Kelola Laporan ({laporans.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'categories'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          Master Kategori ({categories.length})
        </button>

        {adminUser.role === 'Super Admin' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Admin Users ({adminUsers.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSubTab('connection')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'connection'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          Koneksi Apps Script Web App
        </button>
      </div>

      {/* Tab 1: Proposal Quick Verification */}
      {activeSubTab === 'proposals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Meja Verifikasi Cepat Proposal
              </h3>
              <p className="text-xs text-slate-500">
                Pembaruan status langsung tersinkronisasi ke Google Spreadsheet
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">No. Tiket</th>
                  <th className="py-3 px-4">Pemohon</th>
                  <th className="py-3 px-4">Judul</th>
                  <th className="py-3 px-4">Anggaran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">Belum ada proposal yang masuk untuk diverifikasi.</p>
                      <p className="text-xs mt-1">Daftar pengajuan baru dari masyarakat atau instansi akan ditampilkan di sini.</p>
                    </td>
                  </tr>
                ) : (
                  proposals.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {item.ticketNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{item.organization}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-700">
                        {item.title}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        Rp {item.budget.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{item.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleTriggerStatusChange(item)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          Ubah Status
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProposalToDelete(item);
                            setIsDeleteProposalConfirmOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                          title="Hapus proposal"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Kelola Laporan Daerah */}
      {activeSubTab === 'laporans' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Manajemen & Penghapusan Laporan Masuk
              </h3>
              <p className="text-xs text-slate-500">
                Daftar arsip dokumen laporan dari 9 Desa dan 6 TIM daerah dengan akses hapus khusus admin
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Jenis & Entitas</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Judul Laporan</th>
                  <th className="py-3 px-4">Berkas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laporans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <FolderArchive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">Belum ada laporan yang tersimpan.</p>
                      <p className="text-xs mt-1">Laporan yang diunggah warga/desa akan tercatat di sini.</p>
                    </td>
                  </tr>
                ) : (
                  laporans.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{item.category}</span>
                        <span className="text-[11px] font-semibold text-slate-500">{item.entityName}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.period}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-800">
                        {item.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        📄 {item.fileName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap space-x-1.5">
                        <a
                          href={item.driveFileUrl || 'https://drive.google.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          title="Buka Dokumen di Google Drive"
                        >
                          <FolderGit2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Drive</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setLaporanToDelete(item);
                            setIsDeleteLaporanConfirmOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                          title="Hapus Dokumen Laporan"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Master Kategori */}
      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Master Kategori</h3>
              <p className="text-xs text-slate-500">
                Digunakan untuk klasifikasi laporan dan pengajuan proposal.
              </p>
            </div>
            {adminUser.role === 'Super Admin' && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategory({ id: '', name: '', active: true });
                  setIsCategoryModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{cat.name}</td>
                    <td className="py-3 px-4">
                      {cat.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {adminUser.role === 'Super Admin' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Admin Users */}
      {activeSubTab === 'users' && adminUser.role === 'Super Admin' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Manajemen Admin User</h3>
              <p className="text-xs text-slate-500">
                Kelola hak akses dan peran petugas di sistem Kota Tangerang.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingAdmin({
                  id: '',
                  name: '',
                  email: '',
                  role: 'Admin Proposal',
                  active: true,
                  pin: 'duasembilan',
                });
                setIsAdminUserModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Admin
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminUsers.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{adm.name}</td>
                    <td className="py-3 px-4 text-slate-600">{adm.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {adm.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {adm.active ? (
                        <span className="text-emerald-700 font-bold">Aktif</span>
                      ) : (
                        <span className="text-slate-400 font-bold">Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdmin(adm);
                          setIsAdminUserModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Connection & Live GAS Web App URL */}
      {activeSubTab === 'connection' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Koneksi Endpoint Google Apps Script Web App
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              URL eksekusi aktif dari deployment Google Apps Script Anda.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Web App URL Aktif:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={inputGasUrl}
                onChange={(e) => setInputGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => {
                  onSaveAppsScriptUrl(inputGasUrl.trim());
                  setGasSaved(true);
                  setTimeout(() => setGasSaved(false), 2500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
            {gasSaved && (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                URL berhasil disimpan ke konfigurasi lokal.
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 leading-relaxed">
            <span className="font-bold">Endpoint Pengujian: </span>
            Aplikasi secara otomatis menggunakan URL ini untuk mengeksekusi integrasi Google Drive Folder (ID: <code className="font-mono font-bold">1HvlJnpjhDuzxwyRGFMYtu2h1DWHyblmr</code>) dan Google Sheets (ID: <code className="font-mono font-bold">1NkJikjEDdJf6EG_t85ynGr-L6B4HvXOml_J-GihJrzM</code>).
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">
              {editingCategory.id ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kategori:</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status:</label>
                <select
                  value={editingCategory.active ? 'true' : 'false'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, active: e.target.value === 'true' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingCategory.name.trim()) {
                    onSaveCategory({
                      ...editingCategory,
                      id: editingCategory.id || 'cat-' + Date.now(),
                    });
                    setIsCategoryModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin User Editor Modal */}
      {isAdminUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">
              {editingAdmin.id ? 'Edit Admin User' : 'Tambah Admin User'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Petugas:</label>
                <input
                  type="text"
                  required
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi:</label>
                <input
                  type="email"
                  required
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Peran:</label>
                <select
                  value={editingAdmin.role}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value as AdminRole })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin Kalender">Admin Kalender</option>
                  <option value="Admin Laporan">Admin Laporan</option>
                  <option value="Admin Proposal">Admin Proposal</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Keamanan (Minimal 6 Digit):</label>
                <input
                  type="password"
                  value={editingAdmin.pin || ''}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, pin: e.target.value })}
                  placeholder="Kosongkan bila tidak diubah"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Akun:</label>
                <select
                  value={editingAdmin.active ? 'true' : 'false'}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, active: e.target.value === 'true' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsAdminUserModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingAdmin.name.trim() && editingAdmin.email.trim()) {
                    onSaveAdminUser({
                      ...editingAdmin,
                      id: editingAdmin.id || 'adm-' + Date.now(),
                    });
                    setIsAdminUserModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Status Change */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Konfirmasi Perubahan Status Verifikator"
        message={`Perbarui status tiket proposal ${selectedProposal?.ticketNumber} menjadi "${newStatus}"?`}
        confirmLabel="Ya, Perbarui"
        cancelLabel="Batal"
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Confirmation Dialog for Deleting Proposal */}
      <ConfirmModal
        isOpen={isDeleteProposalConfirmOpen}
        title="Hapus Pengajuan Proposal"
        message={`Apakah Anda yakin ingin menghapus proposal "${proposalToDelete?.title}" (No. Tiket: ${proposalToDelete?.ticketNumber})? Proposal ini akan dihapus permanen dari antrean verifikasi.`}
        confirmLabel="Ya, Hapus Proposal"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          if (proposalToDelete && onDeleteProposal) {
            onDeleteProposal(proposalToDelete.ticketNumber || proposalToDelete.id);
          }
          setIsDeleteProposalConfirmOpen(false);
          setProposalToDelete(null);
        }}
        onCancel={() => {
          setIsDeleteProposalConfirmOpen(false);
          setProposalToDelete(null);
        }}
      />

      {/* Confirmation Dialog for Deleting Laporan */}
      <ConfirmModal
        isOpen={isDeleteLaporanConfirmOpen}
        title="Hapus Dokumen Laporan"
        message={`Apakah Anda yakin ingin menghapus laporan "${laporanToDelete?.title}" (${laporanToDelete?.entityName})? Dokumen laporan ini akan dihapus dari sistem.`}
        confirmLabel="Ya, Hapus Laporan"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          if (laporanToDelete && onDeleteLaporan) {
            onDeleteLaporan(laporanToDelete.id);
          }
          setIsDeleteLaporanConfirmOpen(false);
          setLaporanToDelete(null);
        }}
        onCancel={() => {
          setIsDeleteLaporanConfirmOpen(false);
          setLaporanToDelete(null);
        }}
      />
    </div>
  );
};
