import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Edit3 
} from 'lucide-react';
import { ProposalItem, ProposalStatus } from '../services/types';
import { ConfirmModal } from './ConfirmModal';

interface CekProposalViewProps {
  proposals: ProposalItem[];
  onUpdateStatus: (ticketNumber: string, newStatus: ProposalStatus, notes: string) => Promise<void>;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
}

export const CekProposalView: React.FC<CekProposalViewProps> = ({
  proposals,
  onUpdateStatus,
  onOpenAdminLogin,
  isAdminLoggedIn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);

  // Status edit modal & confirmation dialog states
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<ProposalStatus>('Sedang Ditinjau');
  const [statusNotes, setStatusNotes] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'Disetujui':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Disetujui
          </span>
        );
      case 'Sedang Ditinjau':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Sedang Ditinjau
          </span>
        );
      case 'Butuh Revisi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Butuh Revisi
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Antrean
          </span>
        );
    }
  };

  const filteredProposals = proposals.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.ticketNumber.toLowerCase().includes(q) ||
      item.applicantName.toLowerCase().includes(q) ||
      item.organization.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q)
    );
  });

  const handleOpenStatusEdit = (prop: ProposalItem) => {
    if (!isAdminLoggedIn) {
      onOpenAdminLogin();
      return;
    }
    setSelectedProposal(prop);
    setNewStatus(prop.status);
    setStatusNotes(prop.statusNotes || '');
    setIsEditingStatus(true);
  };

  const handleTriggerConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedProposal) return;
    setIsConfirmOpen(false);
    try {
      await onUpdateStatus(selectedProposal.ticketNumber, newStatus, statusNotes);
      setIsEditingStatus(false);
      setSelectedProposal((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              statusNotes: statusNotes,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Cek Status Proposal & Pelacakan Tiket
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Masukkan Nomor Tiket Registrasi (contoh: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">PRP-202610...</code>) atau Nama Pemohon untuk melacak tahapan verifikasi.
          </p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nomor tiket, nama pemohon, instansi, atau judul proposal..."
            className="w-full text-xs sm:text-sm font-medium pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Selected Proposal Detailed Tracker Card */}
      {selectedProposal && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-6 space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {selectedProposal.ticketNumber}
                </span>
                {getStatusBadge(selectedProposal.status)}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">
                {selectedProposal.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenStatusEdit(selectedProposal)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                {isAdminLoggedIn ? 'Ubah Status Verifikator' : 'Login Admin untuk Ubah Status'}
              </button>
            </div>
          </div>

          {/* Visual Timeline Tracker */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Visual Timeline Progres Verifikasi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
              {/* Step 1: Pengajuan */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  1. Pengajuan Masuk
                </div>
                <p className="text-[11px] text-slate-500">
                  {new Date(selectedProposal.submittedAt).toLocaleDateString('id-ID')}
                </p>
              </div>

              {/* Step 2: Validasi Administrasi */}
              <div
                className={`p-3 bg-white rounded-xl border shadow-2xs ${
                  ['Sedang Ditinjau', 'Butuh Revisi', 'Disetujui', 'Ditolak'].includes(selectedProposal.status)
                    ? 'border-emerald-200 text-emerald-800'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  {['Sedang Ditinjau', 'Butuh Revisi', 'Disetujui', 'Ditolak'].includes(selectedProposal.status) ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  2. Review Berkas
                </div>
                <p className="text-[11px] text-slate-500">Pemeriksaan teknis OPD</p>
              </div>

              {/* Step 3: Verifikasi Lapangan */}
              <div
                className={`p-3 bg-white rounded-xl border shadow-2xs ${
                  ['Disetujui', 'Ditolak'].includes(selectedProposal.status)
                    ? 'border-emerald-200 text-emerald-800'
                    : selectedProposal.status === 'Butuh Revisi'
                    ? 'border-amber-300 text-amber-800'
                    : selectedProposal.status === 'Sedang Ditinjau'
                    ? 'border-sky-300 text-sky-800'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  {selectedProposal.status === 'Disetujui' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : selectedProposal.status === 'Butuh Revisi' ? (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  3. Keputusan Tim
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedProposal.status === 'Butuh Revisi' ? 'Menunggu revisi berkas' : 'Rekomendasi teknis'}
                </p>
              </div>

              {/* Step 4: Penetapan SK */}
              <div
                className={`p-3 bg-white rounded-xl border shadow-2xs ${
                  selectedProposal.status === 'Disetujui'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                    : selectedProposal.status === 'Ditolak'
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 font-bold'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 text-xs mb-1">
                  {selectedProposal.status === 'Disetujui' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : selectedProposal.status === 'Ditolak' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  4. Penetapan Akhir
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedProposal.status === 'Disetujui'
                    ? 'Disetujui & Masuk Anggaran'
                    : selectedProposal.status === 'Ditolak'
                    ? 'Tidak Memenuhi Syarat'
                    : 'Menunggu Disposisi'}
                </p>
              </div>
            </div>
          </div>

          {/* Details & Drive Document Button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-700 block">Informasi Pemohon:</span>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">Nama:</span> {selectedProposal.applicantName}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">Lembaga:</span> {selectedProposal.organization}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">Kontak:</span> {selectedProposal.phone} • {selectedProposal.email}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">Usulan Anggaran:</span> Rp {selectedProposal.budget.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-700 block">Catatan Verifikator / Petugas:</span>
              <p className="text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200 text-xs">
                "{selectedProposal.statusNotes || 'Belum ada catatan khusus dari verifikator.'}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proposals List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Seluruh Pengajuan ({filteredProposals.length} proposal)
          </h3>
          <span className="text-xs text-slate-500">Klik baris untuk melihat timeline pelacakan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Nama Pemohon & Lembaga</th>
                <th className="py-3 px-4">Judul Proposal</th>
                <th className="py-3 px-4">Anggaran</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Belum ada proposal yang masuk.</p>
                    <p className="text-xs mt-1">Saat masyarakat atau instansi mengajukan proposal, berkas dan tiket akan otomatis muncul di sini.</p>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedProposal(item)}
                    className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                      selectedProposal?.id === item.id ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {item.ticketNumber}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.applicantName}</div>
                      <div className="text-[11px] text-slate-500">{item.organization}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-800 font-medium">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700">
                      Rp {item.budget.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProposal(item);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      {isEditingStatus && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Perbarui Status Proposal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nomor Tiket: <span className="font-mono font-bold text-blue-700">{selectedProposal.ticketNumber}</span>
            </p>

            <form onSubmit={handleTriggerConfirm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Status Baru:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ProposalStatus)}
                  className="w-full font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                >
                  <option value="Antrean">Antrean</option>
                  <option value="Sedang Ditinjau">Sedang Ditinjau</option>
                  <option value="Butuh Revisi">Butuh Revisi</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Verifikator / Petugas:
                </label>
                <textarea
                  rows={3}
                  required
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Instruksi revisi, hasil verifikasi teknis, atau nomor disposisi..."
                  className="w-full font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingStatus(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Konfirmasi Perubahan Status Proposal"
        message={`Apakah Anda yakin ingin mengubah status tiket ${selectedProposal?.ticketNumber} menjadi "${newStatus}"?`}
        confirmLabel="Ya, Perbarui Status"
        cancelLabel="Batal"
        onConfirm={handleConfirmUpdate}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
