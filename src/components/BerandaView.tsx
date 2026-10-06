import React, { useMemo, useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Folder, 
  Clock, 
  MapPin, 
  Sparkles, 
  Quote, 
  Plus, 
  Upload, 
  ChevronRight, 
  ShieldCheck, 
  Users,
  Building2,
  GraduationCap,
  Heart,
  Lock
} from 'lucide-react';
import { AgendaItem, ProposalItem, LaporanItem } from '../services/types';
import { SensusJamaahItem } from '../services/sensusData';
import { TabKey } from './Sidebar';
import { LaporanStatusDonutChart } from './LaporanStatusDonutChart';
import { getPenanggungJawab, PENANGGUNG_JAWAB_STYLES } from '../services/config';

interface BerandaViewProps {
  agendas: AgendaItem[];
  proposals: ProposalItem[];
  laporans: LaporanItem[];
  sensusList?: SensusJamaahItem[];
  isAdminLoggedIn?: boolean;
  onOpenAdminLogin?: () => void;
  onNavigate: (tab: TabKey) => void;
  onOpenNewAgenda: () => void;
  onOpenNewProposal: () => void;
  onOpenNewLaporan: () => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  agendas,
  proposals,
  laporans,
  sensusList = [],
  isAdminLoggedIn = false,
  onOpenAdminLogin,
  onNavigate,
  onOpenNewAgenda,
  onOpenNewProposal,
  onOpenNewLaporan,
}) => {
  // Real-time Clock & Date (Diperbarui setiap detik)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(() => new Date());
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'today' | 'tomorrow'>('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const y = currentDateTime.getFullYear();
    const m = String(currentDateTime.getMonth() + 1).padStart(2, '0');
    const d = String(currentDateTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDateTime]);

  const currentMonth = todayStr.slice(0, 7); // e.g. "2026-10"
  const agendaThisMonth = agendas.filter((a) => a.date.startsWith(currentMonth)).length || agendas.length;
  const proposalMasuk = proposals.length;
  const proposalDisetujui = proposals.filter((p) => p.status === 'Disetujui').length;

  // Sensus aggregation for Dashboard display
  const sensusTotals = useMemo(() => {
    let grandTotal = 0;
    let kk = 0;
    let totalL = 0;
    let totalP = 0;
    let balita = 0;
    let paud = 0;
    let cabeRawit = 0;
    let preRemaja = 0;
    let remaja = 0;
    let pranikah = 0;
    let menikah = 0;
    let lansia = 0;

    const desaCounts: Record<string, number> = {};

    (sensusList || []).forEach((item) => {
      grandTotal += item.total || 0;
      kk += item.jumlahKK || 0;
      totalL += item.totalL || 0;
      totalP += item.totalP || 0;

      const g = item.generus || ({} as any);
      balita += (g.balitaL || 0) + (g.balitaP || 0);
      paud += (g.paudL || 0) + (g.paudP || 0);
      cabeRawit += (g.cabeRawitL || 0) + (g.cabeRawitP || 0);
      preRemaja += (g.preRemajaL || 0) + (g.preRemajaP || 0);
      remaja += (g.remajaL || 0) + (g.remajaP || 0);
      pranikah += (g.pranikahL || 0) + (g.pranikahP || 0);

      menikah += (item.menikahL || 0) + (item.menikahP || 0);
      lansia += (item.lansiaL || 0) + (item.lansiaP || 0);

      const d = item.desa || 'Lainnya';
      desaCounts[d] = (desaCounts[d] || 0) + (item.total || 0);
    });

    const generusTotal = balita + paud + cabeRawit + preRemaja + remaja + pranikah;

    const desaList = Object.entries(desaCounts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    return {
      grandTotal,
      kk,
      totalL,
      totalP,
      generusTotal,
      balita,
      paud,
      cabeRawit,
      preRemaja,
      remaja,
      pranikah,
      menikah,
      lansia,
      desaList,
      kelompokCount: (sensusList || []).length,
    };
  }, [sensusList]);

  // Besok reference
  const tomorrowDate = useMemo(() => {
    const d = new Date(currentDateTime);
    d.setDate(d.getDate() + 1);
    return d;
  }, [currentDateTime]);

  const tomorrowStr = useMemo(() => {
    const y = tomorrowDate.getFullYear();
    const m = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrowDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [tomorrowDate]);

  const currentTimeStr = useMemo(() => {
    const h = String(currentDateTime.getHours()).padStart(2, '0');
    const m = String(currentDateTime.getMinutes()).padStart(2, '0');
    const s = String(currentDateTime.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [currentDateTime]);

  const currentHourMinute = useMemo(() => {
    const h = String(currentDateTime.getHours()).padStart(2, '0');
    const m = String(currentDateTime.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, [currentDateTime]);

  // Gabungan Agenda Hari Ini dan Besok
  const combinedAgendas = useMemo(() => {
    const matched = agendas.filter((a) => a.date === todayStr || a.date === tomorrowStr);
    if (matched.length > 0) {
      return matched.sort((a, b) => {
        const dComp = a.date.localeCompare(b.date);
        if (dComp !== 0) return dComp;
        return (a.time || '').localeCompare(b.time || '');
      });
    }

    // Fallback kegiatan terdekat mendatang jika hari ini & besok belum ada data
    const futureOrToday = agendas.filter((a) => a.date >= todayStr);
    return [...(futureOrToday.length > 0 ? futureOrToday : agendas)]
      .sort((a, b) => {
        const dComp = a.date.localeCompare(b.date);
        if (dComp !== 0) return dComp;
        return (a.time || '').localeCompare(b.time || '');
      })
      .slice(0, 8);
  }, [agendas, todayStr, tomorrowStr]);

  const todayCount = agendas.filter((a) => a.date === todayStr).length;
  const tomorrowCount = agendas.filter((a) => a.date === tomorrowStr).length;

  const displayedAgendas = useMemo(() => {
    if (agendaFilter === 'today') {
      return combinedAgendas.filter((a) => a.date === todayStr);
    }
    if (agendaFilter === 'tomorrow') {
      return combinedAgendas.filter((a) => a.date === tomorrowStr);
    }
    return combinedAgendas;
  }, [combinedAgendas, agendaFilter, todayStr, tomorrowStr]);

  // Helper badge selisih hari
  const getDaysDiffBadge = (dateStr: string) => {
    try {
      const dTarget = new Date(dateStr + 'T00:00:00');
      const dToday = new Date(todayStr + 'T00:00:00');
      const diffTime = dTarget.getTime() - dToday.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Hari Ini
          </span>
        );
      }
      if (diffDays === 1) {
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Besok
          </span>
        );
      }
      if (diffDays > 1 && diffDays <= 7) {
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            {diffDays} hari lagi
          </span>
        );
      }
      return null;
    } catch {
      return null;
    }
  };

  // Latest 4 proposals
  const recentProposals = [...proposals]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Welcome Banner (Dengan Gambar Masjid Megah & 4 Kartu Statistik Terintegrasi) */}
      <div className="rounded-3xl p-6 sm:p-8 lg:p-9 text-white shadow-[0_20px_27px_0_rgba(0,0,0,0.1)] relative overflow-hidden bg-slate-950 border border-slate-700/50">
        {/* Background Image: Masjid Megah */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1600&q=80')`
          }}
        />
        {/* Gradient Overlay for crystal-clear readability and contrast */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-900/85 to-teal-950/55" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide text-teal-200 border border-white/20 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            Portal Terpadu Pelayanan Kota Tangerang
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md">
            Welcome to Univers Tangerang Kota
          </h2>

          {/* 4 Kartu Statistik Terintegrasi di dalam Banner Masjid */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Agenda Terjadwal */}
            <div 
              onClick={() => onNavigate('agenda')}
              className="bg-white/10 hover:bg-white/18 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-lg group active:scale-95"
            >
              <div>
                <span className="text-[11px] font-extrabold text-teal-200 uppercase tracking-wider block">
                  Agenda Terjadwal
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {agendaThisMonth}
                  </span>
                  <span className="text-xs font-bold text-emerald-300">
                    +143 di Okt
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                  kegiatan bulan ini
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/30 border border-teal-300/30 text-teal-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Sensus Jamaah */}
            <div 
              onClick={() => onNavigate('sensus')}
              className="bg-white/10 hover:bg-white/18 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-lg group active:scale-95"
            >
              <div>
                <span className="text-[11px] font-extrabold text-teal-200 uppercase tracking-wider block">
                  Sensus Jamaah
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {sensusTotals.grandTotal > 0 ? sensusTotals.grandTotal.toLocaleString('id-ID') : '2.759'}
                  </span>
                  <span className="text-xs font-bold text-teal-300">
                    Jiwa
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                  {sensusTotals.kk > 0 ? sensusTotals.kk.toLocaleString('id-ID') : '765'} KK • 9 Desa
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/30 border border-teal-300/30 text-teal-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Proposal Masuk */}
            <div 
              onClick={() => onNavigate('cek-proposal')}
              className="bg-white/10 hover:bg-white/18 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-lg group active:scale-95"
            >
              <div>
                <span className="text-[11px] font-extrabold text-teal-200 uppercase tracking-wider block">
                  Proposal Masuk
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {proposalMasuk}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    berkas
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                  antrean pendaftaran
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/30 border border-teal-300/30 text-teal-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Status Disetujui */}
            <div 
              onClick={() => onNavigate('cek-proposal')}
              className="bg-white/10 hover:bg-white/18 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-lg group active:scale-95"
            >
              <div>
                <span className="text-[11px] font-extrabold text-teal-200 uppercase tracking-wider block">
                  Status Disetujui
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {proposalDisetujui}
                  </span>
                  <span className="text-xs font-bold text-emerald-300">
                    {proposalMasuk > 0 ? Math.round((proposalDisetujui / proposalMasuk) * 100) : 0}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                  telah diverifikasi
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/30 border border-teal-300/30 text-teal-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Agenda Daerah & Motivasi Harian (Bersebelahan & Ringkas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Agenda Daerah Timeline (Real-Time Gabungan Hari Ini & Besok) */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                    Agenda Daerah
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    {displayedAgendas.length} Kegiatan
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                  <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>
                      {currentDateTime.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 text-[10px] inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-teal-600" />
                    {currentTimeStr} WIB
                  </span>
                </div>
              </div>

              {/* Filter Tabs: Semua / Hari Ini / Besok */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setAgendaFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    agendaFilter === 'all'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({combinedAgendas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaFilter('today')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    agendaFilter === 'today'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${agendaFilter === 'today' ? 'bg-white' : 'bg-emerald-500'}`} />
                  Hari Ini ({todayCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaFilter('tomorrow')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    agendaFilter === 'tomorrow'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${agendaFilter === 'tomorrow' ? 'bg-white' : 'bg-blue-500'}`} />
                  Besok ({tomorrowCount})
                </button>
              </div>
            </div>

            {/* List Agenda Gabungan Hari Ini & Besok */}
            <div className="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {displayedAgendas.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">
                    {agendaFilter === 'today'
                      ? 'Tidak ada agenda kegiatan terjadwal untuk hari ini.'
                      : agendaFilter === 'tomorrow'
                      ? 'Tidak ada agenda kegiatan terjadwal untuk besok.'
                      : 'Belum ada agenda kegiatan terjadwal untuk hari ini dan besok.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('agenda')}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Buka Kalender Lengkap →</span>
                  </button>
                </div>
              ) : (
                displayedAgendas.map((item) => {
                  const d = new Date(item.date + 'T00:00:00');
                  const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
                  const isToday = item.date === todayStr;
                  const isTomorrow = item.date === tomorrowStr;

                  // Real-time status per kegiatan hari ini
                  let statusBadge = null;
                  if (isToday) {
                    const itemTime = item.time || '09:00';
                    const [startH, startM] = itemTime.split(':').map(Number);
                    const startMin = (startH || 0) * 60 + (startM || 0);
                    const nowMin = currentDateTime.getHours() * 60 + currentDateTime.getMinutes();
                    const diffMin = startMin - nowMin;

                    if (nowMin >= startMin && nowMin <= startMin + 120) {
                      statusBadge = (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          Hari Ini • Berlangsung
                        </span>
                      );
                    } else if (diffMin > 0 && diffMin <= 60) {
                      statusBadge = (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          Mulai dlm {diffMin} mnt
                        </span>
                      );
                    } else if (nowMin < startMin) {
                      statusBadge = (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Hari Ini • Mendatang
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                          Hari Ini • Selesai
                        </span>
                      );
                    }
                  } else if (isTomorrow) {
                    statusBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        Besok • {dayNum} {monthName}
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {dayNum} {monthName}
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="py-3 first:pt-0.5 last:pb-0.5 flex items-start gap-3 group"
                    >
                      {/* Tanggal & Hari Badge */}
                      <div
                        className={`shrink-0 text-center rounded-xl px-2.5 py-1.5 min-w-14 border transition-colors ${
                          isToday
                            ? 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900 group-hover:border-emerald-400'
                            : isTomorrow
                            ? 'bg-blue-50/90 border-blue-200/80 text-blue-900 group-hover:border-blue-400'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span
                          className={`block text-[9px] uppercase font-extrabold tracking-wider ${
                            isToday
                              ? 'text-emerald-700'
                              : isTomorrow
                              ? 'text-blue-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {dayName}, {monthName}
                        </span>
                        <span className="block text-base font-black leading-none mt-0.5">
                          {dayNum}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                            {item.title}
                          </h4>
                          {statusBadge}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {item.time || '09:00'} WIB
                          </span>
                          <span className="flex items-center gap-1 truncate max-w-52">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {item.location}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const pj = getPenanggungJawab(item);
                            const style = PENANGGUNG_JAWAB_STYLES[pj];
                            return (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${style.badgeBg} ${style.badgeText} ${style.borderColor}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
                                <span>{pj}</span>
                              </span>
                            );
                          })()}
                          {item.opd && item.opd !== getPenanggungJawab(item) && (
                            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-40">
                              {item.opd}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer info & link */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sinkronisasi real-time sesuai tanggal & waktu sistem
            </span>
            <button
              type="button"
              onClick={() => onNavigate('agenda')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Kalender Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Motivasi Luhur Card */}
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 text-white shadow-[0_20px_27px_0_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300 border border-white/10">
                <Quote className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-400/20">
                Inspirasi Luhur
              </span>
            </div>

            <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug">
              "Kebaikan yang Tertata Rapi Mengalirkan Keberkahan Tanpa Henti"
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-2 italic">
              Satukan tekad dengan 29 Karakter Luhur: rukun, kompak, jujur, amanah, hemat, dan kerja keras, demi kebaikan jamaah dan generasi masa depan.
            </p>
          </div>

          <div className="pt-3.5 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-teal-300 font-bold">
            <span>29 Karakter Luhur Jamaah</span>
            <span className="text-white/60 text-[11px] font-normal">Kota Tangerang</span>
          </div>
        </div>
      </div>

      {/* 3. Sensus Data Jamaah: Ringkasan Angka Kependudukan (Hanya Tampilkan Data Angka Saja) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Data Kependudukan Daerah</span>
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
              Sensus Data Jamaah Tangerang Kota
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Rekapitulasi data angka resmi kependudukan di 9 Desa dan {sensusTotals.kelompokCount || 52} Kelompok binaan
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('sensus')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Users className="w-4 h-4 text-teal-300" />
            <span>Lihat Sebaran, Komposisi & Grafik Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Highlight Angka Sensus Saja */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Total Jamaah */}
          <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 transition-colors">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Jiwa</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.grandTotal > 0 ? sensusTotals.grandTotal.toLocaleString('id-ID') : '2.759'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {sensusTotals.totalL > 0 ? sensusTotals.totalL.toLocaleString('id-ID') : '1.385'} L • {sensusTotals.totalP > 0 ? sensusTotals.totalP.toLocaleString('id-ID') : '1.374'} P
            </div>
          </div>

          {/* Kepala Keluarga */}
          <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 transition-colors">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kepala Keluarga (KK)</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.kk > 0 ? sensusTotals.kk.toLocaleString('id-ID') : '765'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Rata-rata 3.6 jiwa / KK
            </div>
          </div>

          {/* Generus */}
          <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 transition-colors">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Generus Terbina</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.generusTotal > 0 ? sensusTotals.generusTotal.toLocaleString('id-ID') : '1.306'}
            </div>
            <div className="text-[11px] text-teal-600 font-bold mt-0.5">
              {Math.round((sensusTotals.generusTotal / (sensusTotals.grandTotal || 2759)) * 100)}% generasi muda
            </div>
          </div>

          {/* Menikah & Lansia */}
          <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 transition-colors">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Menikah & Lansia</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.menikah > 0 ? sensusTotals.menikah.toLocaleString('id-ID') : '1.373'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {sensusTotals.lansia > 0 ? sensusTotals.lansia.toLocaleString('id-ID') : '42'} Lansia (60+ th)
            </div>
          </div>
        </div>

        {/* Catatan / Callout Informasi Navigasi Menu Sensus */}
        <div className="mt-4 p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Diagram grafik sebaran 9 desa, piramida komposisi jenjang generus, serta tabel data per kelompok dapat diakses lengkap pada menu <b>Sensus Data Jamaah</b>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sensus')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Buka Halaman Sensus & Grafik →
          </button>
        </div>
      </div>

      {/* 4. Menu Layanan & Upload Proposal (Sebelum Statistik Laporan - Tanpa Upload Admin) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Layanan Mandiri & Upload Proposal Warga</span>
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Pendaftaran proposal bantuan digital dan akses cepat informasi kependudukan
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Upload File Proposal (Publik) */}
          <button
            type="button"
            onClick={onOpenNewProposal}
            className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-xs hover:shadow-md transition-all text-left cursor-pointer group active:scale-95"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-white block truncate">Upload File Proposal</span>
              <p className="text-[10px] text-teal-100 truncate">Daftarkan permohonan bantuan</p>
            </div>
          </button>

          {/* 2. Cek Status Proposal */}
          <button
            type="button"
            onClick={() => onNavigate('cek-proposal')}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-slate-50/80 text-slate-800 shadow-xs hover:shadow-sm transition-all text-left cursor-pointer group active:scale-95"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-800 block truncate">Cek Status Proposal</span>
              <p className="text-[10px] text-slate-400 truncate">Lacak tiket verifikasi</p>
            </div>
          </button>

          {/* 3. Sensus Jamaah */}
          <button
            type="button"
            onClick={() => onNavigate('sensus')}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-slate-50/80 text-slate-800 shadow-xs hover:shadow-sm transition-all text-left cursor-pointer group active:scale-95"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-800 block truncate">Sensus Data Jamaah</span>
              <p className="text-[10px] text-slate-400 truncate">Data 52 kelompok & unduh PDF</p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Donut Chart: Laporan Status Statistics */}
      <div>
        <LaporanStatusDonutChart 
          laporans={laporans} 
          onNavigate={onNavigate} 
        />
      </div>

      {/* 5. Proposal Table in Purity UI Projects Style */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-tight">
              Proposal & Berkas Terkini
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Pengajuan dokumen dari warga & instansi terdaftar
            </p>
          </div>
          <button
            onClick={() => onNavigate('cek-proposal')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Cek Semua Proposal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recentProposals.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Belum ada proposal yang masuk</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Gunakan menu Pengajuan Proposal untuk mendaftarkan permohonan bantuan secara digital.
              </p>
              <button
                type="button"
                onClick={onOpenNewProposal}
                className="mt-2 text-xs font-bold text-teal-600 hover:text-teal-700 inline-block cursor-pointer"
              >
                + Ajukan Proposal Sekarang
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-extrabold">TIKET & PEMOHON</th>
                  <th className="pb-3 font-extrabold">JUDUL PROPOSAL</th>
                  <th className="pb-3 font-extrabold">ANGGARAN</th>
                  <th className="pb-3 font-extrabold">STATUS</th>
                  <th className="pb-3 font-extrabold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {recentProposals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/60 inline-block">
                        {item.ticketNumber}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                        {item.applicantName}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 max-w-xs truncate font-bold text-slate-800">
                      {item.title}
                    </td>
                    <td className="py-3.5 pr-4 font-mono font-semibold text-slate-700">
                      Rp {item.budget.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.status === 'Disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'Sedang Ditinjau'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.status === 'Antrean'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.status === 'Butuh Revisi' || item.status === 'Ditolak'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate('cek-proposal')}
                        className="text-xs font-bold text-teal-600 hover:text-teal-800"
                      >
                        Detail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
