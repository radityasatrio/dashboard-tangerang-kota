import React, { useState, useMemo } from 'react';
import { 
  FolderArchive, 
  UploadCloud, 
  Search, 
  Filter, 
  ExternalLink, 
  X, 
  FileText, 
  FolderGit2, 
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Lock
} from 'lucide-react';
import { LaporanItem, LaporanCategory, LaporanStatus } from '../services/types';
import { 
  LAPORAN_DESA_LIST, 
  LAPORAN_TIM_LIST, 
  DEFAULT_CONFIG,
  GOOGLE_SCRIPT_URL
} from '../services/config';
import { uploadLaporanViaAppsScript } from '../services/workspace';

export const BULAN_LIST = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const TAHUN_LIST = ['2024', '2025', '2026', '2027', '2028', '2029'] as const;

interface LaporanViewProps {
  laporans: LaporanItem[];
  onLaporanAdded: (laporan: LaporanItem) => void;
  appsScriptUrl?: string;
  isAdminLoggedIn?: boolean;
  onOpenAdminLogin?: () => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  laporans,
  onLaporanAdded,
  appsScriptUrl = DEFAULT_CONFIG.appsScriptUrl,
  isAdminLoggedIn = false,
  onOpenAdminLogin,
}) => {
  // Filter States
  const [selectedType, setSelectedType] = useState<string>('Semua');
  const [selectedEntity, setSelectedEntity] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Upload Modal Form States (Bulan & Tahun Dropdown)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<LaporanCategory>('Laporan Desa');
  const [formEntity, setFormEntity] = useState<string>(LAPORAN_DESA_LIST[0]);
  const [formStatus, setFormStatus] = useState<LaporanStatus>('Terverifikasi');
  const [title, setTitle] = useState('');
  const [formMonth, setFormMonth] = useState<string>('Oktober');
  const [formYear, setFormYear] = useState<string>('2026');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleResetFilters = () => {
    setSelectedType('Semua');
    setSelectedEntity('Semua');
    setSelectedStatus('Semua');
    setSelectedMonth('Semua');
    setSelectedYear('Semua');
    setSearchKeyword('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        setFormError('Ukuran file maksimal adalah 50MB.');
        setFile(null);
        return;
      }
      setFormError('');
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const computedPeriod = `${formMonth} ${formYear}`;
    if (!title.trim() || !formMonth || !formYear || !file) {
      setFormError('Mohon lengkapi judul laporan, pilih periode (bulan & tahun), dan pilih berkas.');
      return;
    }

    setFormError('');
    setIsUploading(true);

    try {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const tagPrefix = formType === 'Laporan Desa' ? 'DESA' : 'TIM';
      const entityClean = formEntity.replace(/[^a-zA-Z0-9]/g, '');
      const driveFileName = `[${tagPrefix}_${entityClean}_${todayStr}]_${cleanFileName}`;

      let driveUrl = `https://drive.google.com/drive/folders/${DEFAULT_CONFIG.driveFolderId}`;
      let driveId = 'drive-lap-' + Date.now();

      // Read file to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1] || '');
        };
        reader.readAsDataURL(file);
      });
      const fileBase64 = await base64Promise;

      const targetScriptUrl = appsScriptUrl || GOOGLE_SCRIPT_URL;

      try {
        const gasResult = await uploadLaporanViaAppsScript(
          {
            action: 'upload_laporan',
            id: 'lap-' + Date.now(),
            title: title.trim(),
            category: formType,
            entityName: formEntity,
            status: formStatus,
            period: computedPeriod,
            description: description.trim(),
            opd: `${formType} - ${formEntity}`,
            fileName: driveFileName,
            fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
            fileBase64,
            fileMimeType: file.type || 'application/pdf',
            folderId: DEFAULT_CONFIG.driveFolderId,
            uploadedBy: `Admin ${formEntity}`,
          },
          targetScriptUrl
        );

        if (gasResult.fileUrl) {
          driveUrl = gasResult.fileUrl;
        }
        if (gasResult.fileId) {
          driveId = gasResult.fileId;
        }
      } catch (gasErr) {
        console.warn('Apps Script upload note:', gasErr);
      }

      const monthIndex = BULAN_LIST.indexOf(formMonth as any);
      const monthNumStr = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : '01';

      const newLaporan: LaporanItem = {
        id: 'lap-' + Date.now(),
        title: title.trim(),
        category: formType,
        entityName: formEntity,
        status: formStatus,
        period: computedPeriod,
        periodDate: `${formYear}-${monthNumStr}-01`,
        description: description.trim(),
        opd: `${formType} - ${formEntity}`,
        fileName: driveFileName,
        fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        driveFileId: driveId,
        driveFileUrl: driveUrl,
        uploadedBy: `Admin ${formEntity}`,
        uploadedAt: new Date().toISOString(),
      };

      onLaporanAdded(newLaporan);

      setTitle('');
      setDescription('');
      setFile(null);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengunggah laporan.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filtered reports
  const filteredLaporans = useMemo(() => {
    return laporans.filter((item) => {
      // 1. Jenis Laporan filter
      if (selectedType !== 'Semua' && item.category !== selectedType) {
        return false;
      }

      // 2. Entity filter (Desa or TIM)
      if (selectedEntity !== 'Semua' && item.entityName !== selectedEntity) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'Semua') {
        const itemStatus = item.status || 'Terverifikasi';
        if (itemStatus !== selectedStatus) {
          return false;
        }
      }

      // 4. Period filter: Bulan & Tahun
      if (selectedMonth !== 'Semua' && !item.period.toLowerCase().includes(selectedMonth.toLowerCase())) {
        return false;
      }
      if (selectedYear !== 'Semua' && !item.period.includes(selectedYear)) {
        return false;
      }

      // 5. Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesEntity = (item.entityName || '').toLowerCase().includes(q);
        const matchesPeriod = item.period.toLowerCase().includes(q);
        const matchesStatus = (item.status || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesEntity && !matchesPeriod && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [laporans, selectedType, selectedEntity, selectedStatus, selectedMonth, selectedYear, searchKeyword]);

  const hasActiveFilters = 
    selectedType !== 'Semua' || 
    selectedEntity !== 'Semua' || 
    selectedStatus !== 'Semua' || 
    selectedMonth !== 'Semua' || 
    selectedYear !== 'Semua' || 
    searchKeyword.trim() !== '';

  // Render Status Badge
  const renderStatusBadge = (status?: LaporanStatus) => {
    const s = status || 'Terverifikasi';
    switch (s) {
      case 'Terverifikasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Terverifikasi
          </span>
        );
      case 'Diterima':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Diterima
          </span>
        );
      case 'Menunggu Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Review
          </span>
        );
      case 'Perlu Revisi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {s}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Laporan Daerah
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5 text-teal-600" />
              Drive: ...yblmr
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Arsip dokumen dan laporan resmi dari wilayah Desa dan Unit TIM terintegrasi di Google Drive.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isAdminLoggedIn) {
              onOpenAdminLogin?.();
              return;
            }
            setFormType('Laporan Desa');
            setFormEntity(LAPORAN_DESA_LIST[0]);
            setFormStatus('Terverifikasi');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
        >
          {isAdminLoggedIn ? <UploadCloud className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{isAdminLoggedIn ? 'Unggah Laporan Baru' : 'Unggah Laporan (Admin)'}</span>
        </button>
      </div>

      {/* Filter Control Bar (All in Dropdown & Search) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-teal-600" />
            Filter Laporan
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filter
            </button>
          )}
        </div>

        {/* Row 1: Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Dropdown Nama Desa */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Pilih Desa:
            </label>
            <select
              value={LAPORAN_DESA_LIST.includes(selectedEntity as any) ? selectedEntity : 'Semua'}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedEntity(val);
                if (val !== 'Semua') {
                  setSelectedType('Laporan Desa');
                }
              }}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden"
            >
              <option value="Semua">Semua Desa</option>
              {LAPORAN_DESA_LIST.map((desa) => (
                <option key={desa} value={desa}>
                  {desa}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dropdown Nama TIM */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Pilih TIM:
            </label>
            <select
              value={LAPORAN_TIM_LIST.includes(selectedEntity as any) ? selectedEntity : 'Semua'}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedEntity(val);
                if (val !== 'Semua') {
                  setSelectedType('Laporan TIM');
                }
              }}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden"
            >
              <option value="Semua">Semua TIM</option>
              {LAPORAN_TIM_LIST.map((tim) => (
                <option key={tim} value={tim}>
                  {tim}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Dropdown Status Laporan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Status Laporan:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden"
            >
              <option value="Semua">Semua Status</option>
              <option value="Terverifikasi">Terverifikasi</option>
              <option value="Diterima">Diterima</option>
              <option value="Menunggu Review">Menunggu Review</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
            </select>
          </div>

          {/* 4. Dropdown Bulan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Bulan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden"
            >
              <option value="Semua">Semua Bulan</option>
              {BULAN_LIST.map((bln) => (
                <option key={bln} value={bln}>
                  {bln}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Dropdown Tahun */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden"
            >
              <option value="Semua">Semua Tahun</option>
              {TAHUN_LIST.map((thn) => (
                <option key={thn} value={thn}>
                  {thn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Search Bar */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari berdasarkan judul laporan, ringkasan isi, atau nama berkas..."
            className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Laporan List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLaporans.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2.5">
            <FolderArchive className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">
              {laporans.length === 0 
                ? 'Belum ada dokumen laporan yang diunggah' 
                : 'Tidak ada dokumen laporan yang sesuai filter'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {laporans.length === 0
                ? 'Seluruh laporan yang diunggah dari 9 Desa dan 6 Unit TIM akan otomatis tercatat dan tersimpan di Google Drive.'
                : 'Silakan atur kembali kata kunci pencarian atau reset filter untuk menampilkan semua dokumen.'}
            </p>
            {laporans.length === 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('Laporan Desa');
                    setFormEntity(LAPORAN_DESA_LIST[0]);
                    setFormStatus('Terverifikasi');
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Unggah Laporan Pertama</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLaporans.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Status Laporan & Nama Desa/TIM */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Laporan Saja */}
                    {renderStatusBadge(item.status)}

                    {/* Nama Desa/TIM saja */}
                    {item.entityName && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.entityName}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Periode: {item.period}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {item.title}
                  </h4>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Meta info: file name, size, uploaded date */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="font-mono text-slate-500 font-medium">
                      📄 {item.fileName}
                    </span>
                    {item.fileSize && (
                      <span>• {item.fileSize}</span>
                    )}
                    <span>
                      • Diunggah {new Date(item.uploadedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions: Open in Google Drive (Khusus Admin) */}
                {isAdminLoggedIn && (
                  <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                    <a
                      href={item.driveFileUrl || `https://drive.google.com/drive/folders/${DEFAULT_CONFIG.driveFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-2xs hover:text-blue-700"
                      title="Buka Dokumen di Google Drive"
                    >
                      <FolderGit2 className="w-4 h-4 text-sky-600" />
                      <span>Buka di Drive</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Laporan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
                <UploadCloud className="w-5 h-5 text-teal-600" />
                Unggah Laporan Baru
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {formError}
                </div>
              )}

              {/* 1. Jenis Laporan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Jenis Laporan:
                </label>
                <select
                  value={formType}
                  onChange={(e) => {
                    const t = e.target.value as LaporanCategory;
                    setFormType(t);
                    setFormEntity(t === 'Laporan Desa' ? LAPORAN_DESA_LIST[0] : LAPORAN_TIM_LIST[0]);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                >
                  <option value="Laporan Desa">Laporan Desa</option>
                  <option value="Laporan TIM">Laporan TIM</option>
                </select>
              </div>

              {/* 2. Pilih Desa atau TIM (Nama saja) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. {formType === 'Laporan Desa' ? 'Pilih Nama Desa:' : 'Pilih Nama TIM:'}
                </label>
                <select
                  value={formEntity}
                  onChange={(e) => setFormEntity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                >
                  {formType === 'Laporan Desa'
                    ? LAPORAN_DESA_LIST.map((desa) => (
                        <option key={desa} value={desa}>
                          {desa}
                        </option>
                      ))
                    : LAPORAN_TIM_LIST.map((tim) => (
                        <option key={tim} value={tim}>
                          {tim}
                        </option>
                      ))}
                </select>
              </div>

              {/* 3. Status Laporan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Status Laporan:
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as LaporanStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                >
                  <option value="Terverifikasi">Terverifikasi</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Menunggu Review">Menunggu Review</option>
                  <option value="Perlu Revisi">Perlu Revisi</option>
                </select>
              </div>

              {/* 4. Judul Laporan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  4. Judul Laporan:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Laporan Kegiatan Pengajian & Pembinaan Generus Bulan Oktober 2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              {/* 5. Periode Laporan (Bulan & Tahun Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  5. Periode Laporan (Bulan & Tahun):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Pilih Bulan:
                    </label>
                    <select
                      value={formMonth}
                      onChange={(e) => setFormMonth(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                    >
                      {BULAN_LIST.map((bln) => (
                        <option key={bln} value={bln}>
                          {bln}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Pilih Tahun:
                    </label>
                    <select
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                    >
                      {TAHUN_LIST.map((thn) => (
                        <option key={thn} value={thn}>
                          {thn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-semibold">Periode Dokumen:</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                    {formMonth} {formYear}
                  </span>
                </div>
              </div>

              {/* 6. Ringkasan Deskripsi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  6. Ringkasan / Deskripsi Isi Laporan:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan intisari capaian kegiatan, jumlah peserta/jamaah, atau evaluasi program..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              {/* 7. Unggah File Dokumen */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  7. Unggah File Dokumen (PDF, XLSX, DOCX):
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center bg-slate-50/50 transition-colors">
                  <input
                    type="file"
                    id="laporanFileInput"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.zip"
                    className="hidden"
                  />
                  <label
                    htmlFor="laporanFileInput"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    <UploadCloud className="w-7 h-7 text-teal-600" />
                    <span className="font-semibold text-slate-700">
                      {file ? file.name : 'Pilih file dokumen laporan'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Maksimal ukuran file 50 MB
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Arsipkan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
