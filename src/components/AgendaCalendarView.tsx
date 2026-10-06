import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Building2, 
  X, 
  Check, 
  FileSpreadsheet, 
  Filter,
  Info,
  Printer,
  FileDown,
  RefreshCw,
  Lock
} from 'lucide-react';
import { AgendaItem } from '../services/types';
import { TANGERANG_OPD_LIST } from '../services/config';

interface AgendaCalendarViewProps {
  agendas: AgendaItem[];
  onAddAgenda: (newAgenda: Omit<AgendaItem, 'id' | 'createdAt'>) => Promise<void>;
  onResetToMasterAgenda?: () => void;
  isSyncing: boolean;
  isAuthenticated: boolean;
  onOpenLogin: () => void;
}

export const AgendaCalendarView: React.FC<AgendaCalendarViewProps> = ({
  agendas,
  onAddAgenda,
  onResetToMasterAgenda,
  isSyncing,
  isAuthenticated,
  onOpenLogin,
}) => {
  // Calendar date navigation (Default: Oktober 2026)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOpdFilter, setSelectedOpdFilter] = useState<string>('Semua');
  const [detailAgenda, setDetailAgenda] = useState<AgendaItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [opd, setOpd] = useState(TANGERANG_OPD_LIST[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar grid calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Handle cell click on date
  const handleDateClick = (day: number) => {
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(formattedDate);
    setDate(formattedDate);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time || !location.trim()) {
      setFormError('Mohon lengkapi judul kegiatan, tanggal, jam, dan lokasi.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      await onAddAgenda({
        title: title.trim(),
        date,
        time,
        location: location.trim(),
        description: description.trim(),
        opd,
      });

      // Reset form & close modal
      setTitle('');
      setDescription('');
      setLocation('');
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter agendas
  const filteredAgendas = agendas.filter((item) => {
    if (selectedOpdFilter !== 'Semua' && item.opd !== selectedOpdFilter) {
      return false;
    }
    return true;
  });

  // Print/Download agenda pdf helper
  const handlePrintAgenda = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Kalender Agenda Kota Tangerang
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Tab GID: 172820086
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Klik pada kotak tanggal kalender untuk menambahkan agenda kegiatan kedinasan secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* OPD Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedOpdFilter}
              onChange={(e) => setSelectedOpdFilter(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
            >
              <option value="Semua">Semua OPD / Instansi</option>
              {TANGERANG_OPD_LIST.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Cetak Agenda Button */}
          <button
            type="button"
            onClick={handlePrintAgenda}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Cetak atau Simpan Kalender sebagai PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>

          {/* Sync / Reset Master Button */}
          {onResetToMasterAgenda && (
            <button
              type="button"
              onClick={onResetToMasterAgenda}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Sinkronkan dan muat ulang seluruh 42 kegiatan Oktober dari Master Spreadsheet"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sinkronkan Master</span>
            </button>
          )}

          {/* New Agenda Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                onOpenLogin();
                return;
              }
              const todayStr = new Date().toISOString().split('T')[0];
              setDate(todayStr);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isAuthenticated ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isAuthenticated ? 'Tambah Agenda' : 'Tambah Agenda (Admin)'}
          </button>
        </div>
      </div>

      {/* 12-Month Quick Navigation Strip */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Jadwal 12 Bulan Tahun {year}:
          </span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {filteredAgendas.filter((a) => a.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} kegiatan terjadwal di {monthNames[month]} {year}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {monthNames.map((name, idx) => {
            const isSelected = month === idx;
            const countInMonth = filteredAgendas.filter((a) =>
              a.date.startsWith(`${year}-${String(idx + 1).padStart(2, '0')}`)
            ).length;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCurrentDate(new Date(year, idx, 1))}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-2 ring-blue-600/30'
                    : 'bg-slate-50 hover:bg-blue-50/50 hover:text-blue-700 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span className="truncate w-full">{name}</span>
                <span
                  className={`text-[10px] font-semibold mt-0.5 ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {countInMonth} kegiatan
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* Month Navigation Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs print:hidden"
            >
              Bulan Ini
            </button>
          </div>

          <div className="flex items-center gap-1.5 print:hidden">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-2xs border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-2xs border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center text-xs font-bold text-slate-600 py-2.5">
          {daysOfWeek.map((day, idx) => (
            <div key={day} className={idx === 0 ? 'text-rose-600' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {/* Previous month padding days */}
          {Array.from({ length: firstDayIndex }).map((_, index) => {
            const dayNum = daysInPrevMonth - firstDayIndex + index + 1;
            return (
              <div
                key={`prev-${index}`}
                className="min-h-24 sm:min-h-28 p-1.5 sm:p-2 bg-slate-50/50 text-slate-300 opacity-60"
              >
                <span className="text-xs font-semibold">{dayNum}</span>
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday =
              new Date().toISOString().split('T')[0] === dateStr;

            // Agendas on this date
            const dayAgendas = filteredAgendas.filter((a) => a.date === dateStr);

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(dayNum)}
                className={`min-h-24 sm:min-h-28 p-1.5 sm:p-2 transition-all cursor-pointer group relative flex flex-col justify-between hover:bg-blue-50/50 ${
                  isToday ? 'bg-blue-50/30' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 group-hover:text-blue-600'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayAgendas.length > 0 && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-200">
                      {dayAgendas.length}
                    </span>
                  )}
                </div>

                {/* Event tags list */}
                <div className="space-y-1 overflow-y-auto max-h-16 flex-1">
                  {dayAgendas.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailAgenda(ev);
                      }}
                      className="text-[10px] p-1 rounded bg-teal-50 border border-teal-200/80 text-teal-900 truncate font-medium hover:bg-teal-100 transition-colors"
                      title={`${ev.time} - ${ev.title} (${ev.location})`}
                    >
                      <span className="font-bold text-teal-700 mr-1">{ev.time}</span>
                      {ev.title}
                    </div>
                  ))}
                  {dayAgendas.length > 2 && (
                    <div className="text-[9px] text-slate-500 font-semibold pl-1">
                      +{dayAgendas.length - 2} kegiatan lainnya
                    </div>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 font-medium transition-opacity text-right print:hidden">
                  + Buat
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state notice if 0 events in this month */}
        {filteredAgendas.filter((a) => a.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length === 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 text-center space-y-1.5 print:hidden">
            <p className="text-xs font-bold text-slate-600">
              Belum ada agenda kegiatan terjadwal di bulan {monthNames[month]} {year}.
            </p>
            <p className="text-[11px] text-slate-400">
              Klik pada salah satu kotak tanggal di atas untuk menambahkan agenda kegiatan baru.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Detail Agenda */}
      {detailAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <CalendarIcon className="w-4 h-4" />
                Detail Agenda Kegiatan
              </div>
              <button
                type="button"
                onClick={() => setDetailAgenda(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <h3 className="text-base font-bold text-slate-900">
                {detailAgenda.title}
              </h3>

              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {new Date(detailAgenda.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  • Pukul {detailAgenda.time} WIB
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{detailAgenda.location}</span>
              </div>

              <div className="flex items-center gap-2 text-teal-800 font-medium">
                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{detailAgenda.opd}</span>
              </div>

              {detailAgenda.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 mt-2">
                  <span className="block font-bold text-slate-800 mb-1">Catatan / Deskripsi:</span>
                  <p className="leading-relaxed">{detailAgenda.description}</p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailAgenda(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Input Agenda Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Input Agenda Kegiatan Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tersimpan otomatis ke Google Sheets Tab GID: 172820086
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                {formError}
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Info Otorisasi: </span>
                  Masuk dengan Google disarankan agar data langsung tertulis ke Google Spreadsheet live milik Anda.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Kegiatan / Acara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Program Unggulan Kota Tangerang"
                  className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu / Jam (WIB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi / Ruang Pertemuan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Ruang Akhlakul Karimah, Lt. 2 Puspem Kota Tangerang"
                    className="w-full text-xs font-medium pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  OPD / Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <select
                  value={opd}
                  onChange={(e) => setOpd(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                >
                  {TANGERANG_OPD_LIST.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Catatan Agenda
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan tambahan, agenda pembahasan, peserta undangan..."
                  className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Menyimpan...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan ke Google Sheet
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
