import React, { useMemo } from 'react';
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
  Heart
} from 'lucide-react';
import { AgendaItem, ProposalItem, LaporanItem } from '../services/types';
import { SensusJamaahItem } from '../services/sensusData';
import { TabKey } from './Sidebar';
import { LaporanStatusDonutChart } from './LaporanStatusDonutChart';

interface BerandaViewProps {
  agendas: AgendaItem[];
  proposals: ProposalItem[];
  laporans: LaporanItem[];
  sensusList?: SensusJamaahItem[];
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
  onNavigate,
  onOpenNewAgenda,
  onOpenNewProposal,
  onOpenNewLaporan,
}) => {
  // Compute metric stats & today reference
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // e.g. "2026-10-05"
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

  // Kegiatan terdekat dari hari ini (mendatang)
  const upcomingAgendas = useMemo(() => {
    const futureOrToday = agendas.filter((a) => a.date >= todayStr);
    const pool = futureOrToday.length > 0 ? futureOrToday : agendas;

    return [...pool]
      .sort((a, b) => {
        const dComp = a.date.localeCompare(b.date);
        if (dComp !== 0) return dComp;
        return (a.time || '').localeCompare(b.time || '');
      })
      .slice(0, 5);
  }, [agendas, todayStr]);

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
      {/* 1. Hero Welcome Banner (Di Paling Atas dengan Gambar Masjid) */}
      <div className="rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-[0_20px_27px_0_rgba(0,0,0,0.08)] relative overflow-hidden bg-slate-950 border border-slate-700/50">
        {/* Background Image: Masjid Megah */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1600&q=80')`
          }}
        />
        {/* Elegant Gradient Overlay for high text contrast */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/92 via-slate-900/78 to-teal-950/45" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide text-teal-200 border border-white/20 mb-3.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            Portal Terpadu Pelayanan Kota Tangerang
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md">
            Welcome to Univers Tangerang Kota
          </h2>

          {/* Quick Actions Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenNewAgenda}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-teal-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Agenda</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewProposal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-100 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Upload Proposal</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewLaporan}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs sm:text-sm font-bold rounded-xl backdrop-blur-md transition-all cursor-pointer active:scale-95"
            >
              <Folder className="w-4 h-4 text-teal-300" />
              <span>Upload Laporan</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('sensus')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs sm:text-sm font-bold rounded-xl backdrop-blur-md transition-all cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4 text-teal-300" />
              <span>Sensus Jamaah</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Purity UI 4 Mini Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Agenda */}
        <div 
          onClick={() => onNavigate('agenda')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Agenda Terjadwal
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-800">
                {agendaThisMonth}
              </span>
              <span className="text-[11px] font-bold text-emerald-500">
                +143 di Okt
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
              kegiatan bulan ini
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Card 2: Sensus Jamaah */}
        <div 
          onClick={() => onNavigate('sensus')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Sensus Jamaah
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-800">
                {sensusTotals.grandTotal > 0 ? sensusTotals.grandTotal.toLocaleString('id-ID') : '2.759'}
              </span>
              <span className="text-[11px] font-bold text-teal-600">
                Jiwa
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
              {sensusTotals.kk > 0 ? sensusTotals.kk.toLocaleString('id-ID') : '765'} KK • 9 Desa
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Card 3: Total Proposal */}
        <div 
          onClick={() => onNavigate('cek-proposal')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Proposal Masuk
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-800">
                {proposalMasuk}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                berkas
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
              antrean pendaftaran
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Card 4: Proposal Disetujui */}
        <div 
          onClick={() => onNavigate('cek-proposal')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Status Disetujui
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-800">
                {proposalDisetujui}
              </span>
              <span className="text-[11px] font-bold text-teal-600">
                {proposalMasuk > 0 ? Math.round((proposalDisetujui / proposalMasuk) * 100) : 0}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
              telah diverifikasi
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* 3. Purity UI Row: Agenda Daerah Timeline (7 cols) + Inspiration Card (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 cols): Purity UI Activity Timeline for Agenda */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                  Agenda Daerah Tangerang Kota
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Kegiatan terdekat yang terjadwal di kalender daerah
                </p>
              </div>
              <button
                onClick={() => onNavigate('agenda')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Kalender</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {upcomingAgendas.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Belum ada agenda terdekat.</p>
              ) : (
                upcomingAgendas.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5 group"
                  >
                    {/* Purity UI date pill */}
                    <div className="shrink-0 text-center bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 min-w-12 group-hover:border-teal-300 transition-colors">
                      <span className="block text-[10px] uppercase font-extrabold text-teal-600">
                        {new Date(item.date).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="block text-base font-black text-slate-800 leading-none mt-0.5">
                        {new Date(item.date).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                          {item.title}
                        </h4>
                        {getDaysDiffBadge(item.date)}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.time} WIB
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-48">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {item.location}
                        </span>
                      </div>
                      <span className="inline-block mt-1 text-[11px] font-semibold text-slate-500">
                        {item.opd}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (5 cols): Purity UI Inspiration Card */}
        <div className="lg:col-span-5 bg-linear-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-7 text-white shadow-[0_20px_27px_0_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col justify-between min-h-72">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300 mb-4 border border-white/10">
            <Quote className="w-5 h-5" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-400/20 inline-block mb-2">
              Inspirasi Luhur
            </span>
            <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug">
              "Kebaikan yang Tertata Rapi Mengalirkan Keberkahan Tanpa Henti"
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-2 italic">
              Satukan tekad dengan 29 Karakter Luhur: rukun, kompak, jujur, amanah, hemat, dan kerja keras, demi kebaikan jamaah dan generasi masa depan.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-teal-300 font-bold">
            <span>29 Karakter Luhur Jamaah</span>
            <span className="text-white/60 text-[11px] font-normal">Kota Tangerang</span>
          </div>
        </div>
      </div>

      {/* 4. Sensus Data Jamaah Dashboard Widget */}
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
              Rekapitulasi resmi kependudukan di 9 Desa & {sensusTotals.kelompokCount || 52} Kelompok binaan
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('sensus')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4 text-teal-300" />
              <span>Buka Data Sensus & Unduh PDF</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 4 Highlight Micro-KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-5 border-b border-slate-100">
          {/* Total Jamaah */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Jiwa</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.grandTotal > 0 ? sensusTotals.grandTotal.toLocaleString('id-ID') : '2.759'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {sensusTotals.totalL > 0 ? sensusTotals.totalL.toLocaleString('id-ID') : '1.385'} L • {sensusTotals.totalP > 0 ? sensusTotals.totalP.toLocaleString('id-ID') : '1.374'} P
            </div>
          </div>

          {/* Kepala Keluarga */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kepala Keluarga (KK)</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.kk > 0 ? sensusTotals.kk.toLocaleString('id-ID') : '765'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Rata-rata 3.6 jiwa / KK
            </div>
          </div>

          {/* Generus */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Generus Terbina</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.generusTotal > 0 ? sensusTotals.generusTotal.toLocaleString('id-ID') : '1.306'}
            </div>
            <div className="text-[11px] text-teal-600 font-bold mt-0.5">
              {Math.round((sensusTotals.generusTotal / (sensusTotals.grandTotal || 2759)) * 100)}% generasi muda
            </div>
          </div>

          {/* Menikah & Lansia */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Menikah & Lansia</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {sensusTotals.menikah > 0 ? sensusTotals.menikah.toLocaleString('id-ID') : '1.373'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {sensusTotals.lansia > 0 ? sensusTotals.lansia.toLocaleString('id-ID') : '42'} Lansia (60+ th)
            </div>
          </div>
        </div>

        {/* Detailed Breakdown: Desa & Jenjang Generus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          {/* Left: 9 Desa Distribution */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Sebaran Jamaah di 9 Desa
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Tertinggi ke Terendah</span>
            </div>
            <div className="space-y-2.5">
              {(sensusTotals.desaList.length > 0 ? sensusTotals.desaList : [
                { name: 'BONANG', total: 602 },
                { name: 'BSD', total: 472 },
                { name: 'CIBODASARI', total: 384 },
                { name: 'CIMONE', total: 320 },
                { name: 'KENANGA', total: 278 },
                { name: 'NEGLASARI', total: 242 },
                { name: 'PANUNGGANGAN', total: 195 },
                { name: 'TANAH TINGGI', total: 156 },
                { name: 'TANGERANG', total: 110 },
              ]).slice(0, 9).map((d) => {
                const totalBase = sensusTotals.grandTotal || 2759;
                const pct = (d.total / totalBase) * 100;
                return (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 w-28 shrink-0 truncate">
                      {d.name}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <div className="text-right w-20 shrink-0">
                      <span className="text-xs font-black text-slate-800">{d.total.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Jenjang Generus */}
          <div className="lg:col-span-5 bg-slate-50/60 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Komposisi Generus ({sensusTotals.generusTotal > 0 ? sensusTotals.generusTotal.toLocaleString('id-ID') : '1.306'} Jiwa)
                </h4>
                <GraduationCap className="w-4 h-4 text-teal-600" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Balita (0-4 th)</span>
                  <span className="text-base font-black text-slate-800">{sensusTotals.balita || 288}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">PAUD (5-6 th)</span>
                  <span className="text-base font-black text-slate-800">{sensusTotals.paud || 142}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Cabe Rawit (SD)</span>
                  <span className="text-base font-black text-slate-800">{sensusTotals.cabeRawit || 364}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Pre Remaja (SMP)</span>
                  <span className="text-base font-black text-slate-800">{sensusTotals.preRemaja || 188}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Remaja (SMA)</span>
                  <span className="text-base font-black text-slate-800">{sensusTotals.remaja || 172}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Pranikah</span>
                  <span className="text-base font-black text-slate-800">{sensusTotals.pranikah || 152}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('sensus')}
              className="mt-4 w-full py-2.5 px-3 bg-teal-400 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span>Lihat Detail Sensus 52 Kelompok</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
