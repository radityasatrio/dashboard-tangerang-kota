import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Printer, 
  RefreshCw, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Building2, 
  UserCheck, 
  Baby, 
  GraduationCap, 
  Heart, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Settings, 
  X, 
  Calendar,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SensusJamaahItem } from '../services/sensusData';
import { DEFAULT_CONFIG } from '../services/config';

interface SensusJamaahViewProps {
  sensusList: SensusJamaahItem[];
  onSyncSensus: (customUrl?: string) => Promise<void>;
  isSyncing: boolean;
  sensusSheetUrl: string;
  onSaveSensusUrl: (newUrl: string) => void;
  isAdminLoggedIn: boolean;
}

const RechartsPie = Pie as any;

export const SensusJamaahView: React.FC<SensusJamaahViewProps> = ({
  sensusList,
  onSyncSensus,
  isSyncing,
  sensusSheetUrl,
  onSaveSensusUrl,
  isAdminLoggedIn,
}) => {
  // Filters
  const [selectedDesa, setSelectedDesa] = useState<string>('Semua');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(sensusSheetUrl);

  // Distinct Desa list
  const desaList = useMemo(() => {
    const set = new Set<string>();
    sensusList.forEach((item) => {
      if (item.desa) set.add(item.desa);
    });
    return Array.from(set).sort();
  }, [sensusList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return sensusList.filter((item) => {
      const matchDesa = selectedDesa === 'Semua' || item.desa.toUpperCase() === selectedDesa.toUpperCase();
      const matchSearch = !searchKeyword.trim() || 
        item.kelompok.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.desa.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchDesa && matchSearch;
    });
  }, [sensusList, selectedDesa, searchKeyword]);

  // Totals of filtered items
  const totals = useMemo(() => {
    const acc = {
      kk: 0,
      balitaL: 0,
      balitaP: 0,
      paudL: 0,
      paudP: 0,
      cabeRawitL: 0,
      cabeRawitP: 0,
      preRemajaL: 0,
      preRemajaP: 0,
      remajaL: 0,
      remajaP: 0,
      pranikahL: 0,
      pranikahP: 0,
      menikahL: 0,
      menikahP: 0,
      duda: 0,
      janda: 0,
      lansiaL: 0,
      lansiaP: 0,
      totalL: 0,
      totalP: 0,
      grandTotal: 0,
      generusTotal: 0,
    };

    filteredList.forEach((item) => {
      acc.kk += item.jumlahKK;
      acc.balitaL += item.generus.balitaL;
      acc.balitaP += item.generus.balitaP;
      acc.paudL += item.generus.paudL;
      acc.paudP += item.generus.paudP;
      acc.cabeRawitL += item.generus.cabeRawitL;
      acc.cabeRawitP += item.generus.cabeRawitP;
      acc.preRemajaL += item.generus.preRemajaL;
      acc.preRemajaP += item.generus.preRemajaP;
      acc.remajaL += item.generus.remajaL;
      acc.remajaP += item.generus.remajaP;
      acc.pranikahL += item.generus.pranikahL;
      acc.pranikahP += item.generus.pranikahP;

      acc.menikahL += item.menikahL;
      acc.menikahP += item.menikahP;
      acc.duda += item.duda;
      acc.janda += item.janda;
      acc.lansiaL += item.lansiaL;
      acc.lansiaP += item.lansiaP;

      acc.totalL += item.totalL;
      acc.totalP += item.totalP;
      acc.grandTotal += item.total;
    });

    acc.generusTotal = 
      acc.balitaL + acc.balitaP + 
      acc.paudL + acc.paudP + 
      acc.cabeRawitL + acc.cabeRawitP + 
      acc.preRemajaL + acc.preRemajaP + 
      acc.remajaL + acc.remajaP + 
      acc.pranikahL + acc.pranikahP;

    return acc;
  }, [filteredList]);

  // Generus Breakdown Chart Data
  const generusChartData = useMemo(() => {
    return [
      { name: 'Balita (0-4)', value: totals.balitaL + totals.balitaP, color: '#38BDF8' },
      { name: 'PAUD (5-6)', value: totals.paudL + totals.paudP, color: '#34D399' },
      { name: 'Cabe Rawit (SD)', value: totals.cabeRawitL + totals.cabeRawitP, color: '#FBBF24' },
      { name: 'Pre Remaja (SMP)', value: totals.preRemajaL + totals.preRemajaP, color: '#FB923C' },
      { name: 'Remaja (SMA)', value: totals.remajaL + totals.remajaP, color: '#F472B6' },
      { name: 'Pranikah (Muda-Mudi)', value: totals.pranikahL + totals.pranikahP, color: '#818CF8' },
    ];
  }, [totals]);

  // Desa Breakdown Chart Data
  const desaChartData = useMemo(() => {
    const map = new Map<string, number>();
    sensusList.forEach((item) => {
      const current = map.get(item.desa) || 0;
      map.set(item.desa, current + item.total);
    });

    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [sensusList]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = () => {
    try {
      setIsExportingPdf(true);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const todayStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Header Banner Title
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('LAPORAN SENSUS DATA JAMAAH KOTA TANGERANG', 14, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(
        `Pengurus Daerah Tangerang Kota • Tanggal Ekspor: ${todayStr} • Filter Wilayah: ${
          selectedDesa === 'Semua' ? 'Seluruh Wilayah (9 Desa)' : `Desa ${selectedDesa}`
        }`,
        14,
        20
      );

      // KPI Summary Row in PDF
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 148, 136); // teal-600
      doc.text(
        `Total Jamaah: ${totals.grandTotal.toLocaleString('id-ID')} Jiwa  |  Total KK: ${totals.kk.toLocaleString(
          'id-ID'
        )}  |  Generus: ${totals.generusTotal.toLocaleString(
          'id-ID'
        )}  |  L: ${totals.totalL.toLocaleString('id-ID')}  |  P: ${totals.totalP.toLocaleString('id-ID')}`,
        14,
        26
      );

      // Headers (3 tiers matching table structure)
      const head = [
        [
          { content: 'No', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Desa', rowSpan: 3, styles: { halign: 'left', valign: 'middle' } },
          { content: 'Kelompok', rowSpan: 3, styles: { halign: 'left', valign: 'middle' } },
          { content: 'KK', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Sensus Generus', colSpan: 12, styles: { halign: 'center' } },
          { content: 'Menikah', colSpan: 2, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Duda', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Janda', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Lansia', colSpan: 2, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Total Jamaah', colSpan: 2, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Total', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
        ],
        [
          { content: 'Balita', colSpan: 2, styles: { halign: 'center' } },
          { content: 'PAUD', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Cabe Rwt', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Pre Rem', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Remaja', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Pranikah', colSpan: 2, styles: { halign: 'center' } },
        ],
        [
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
          { content: 'L', styles: { halign: 'center' } },
          { content: 'P', styles: { halign: 'center' } },
        ],
      ];

      const body = filteredList.map((item, idx) => [
        idx + 1,
        item.desa,
        item.kelompok,
        item.jumlahKK,
        item.generus.balitaL || 0,
        item.generus.balitaP || 0,
        item.generus.paudL || 0,
        item.generus.paudP || 0,
        item.generus.cabeRawitL || 0,
        item.generus.cabeRawitP || 0,
        item.generus.preRemajaL || 0,
        item.generus.preRemajaP || 0,
        item.generus.remajaL || 0,
        item.generus.remajaP || 0,
        item.generus.pranikahL || 0,
        item.generus.pranikahP || 0,
        item.menikahL || 0,
        item.menikahP || 0,
        item.duda || 0,
        item.janda || 0,
        item.lansiaL || 0,
        item.lansiaP || 0,
        item.totalL,
        item.totalP,
        item.total,
      ]);

      const foot = [
        [
          { content: `TOTAL KESELURUHAN (${filteredList.length} Kelompok)`, colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
          { content: totals.kk.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold' } },
          { content: totals.balitaL.toString(), styles: { halign: 'center' } },
          { content: totals.balitaP.toString(), styles: { halign: 'center' } },
          { content: totals.paudL.toString(), styles: { halign: 'center' } },
          { content: totals.paudP.toString(), styles: { halign: 'center' } },
          { content: totals.cabeRawitL.toString(), styles: { halign: 'center' } },
          { content: totals.cabeRawitP.toString(), styles: { halign: 'center' } },
          { content: totals.preRemajaL.toString(), styles: { halign: 'center' } },
          { content: totals.preRemajaP.toString(), styles: { halign: 'center' } },
          { content: totals.remajaL.toString(), styles: { halign: 'center' } },
          { content: totals.remajaP.toString(), styles: { halign: 'center' } },
          { content: totals.pranikahL.toString(), styles: { halign: 'center' } },
          { content: totals.pranikahP.toString(), styles: { halign: 'center' } },
          { content: totals.menikahL.toString(), styles: { halign: 'center' } },
          { content: totals.menikahP.toString(), styles: { halign: 'center' } },
          { content: totals.duda.toString(), styles: { halign: 'center' } },
          { content: totals.janda.toString(), styles: { halign: 'center' } },
          { content: totals.lansiaL.toString(), styles: { halign: 'center' } },
          { content: totals.lansiaP.toString(), styles: { halign: 'center' } },
          { content: totals.totalL.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold' } },
          { content: totals.totalP.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold' } },
          { content: totals.grandTotal.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold', fillColor: [13, 148, 136] } },
        ],
      ];

      autoTable(doc, {
        head: head as any,
        body: body as any,
        foot: foot as any,
        startY: 30,
        theme: 'grid',
        styles: {
          fontSize: 6.5,
          cellPadding: 1,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
          font: 'helvetica',
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 6,
        },
        footStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 6.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      const fileName = `Sensus_Jamaah_Tangerang_${selectedDesa === 'Semua' ? 'Semua_Desa' : selectedDesa}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSensusUrl(tempUrl);
    setIsUrlModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header Banner & Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            Data Kependudukan Daerah
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
            Sensus Data Jamaah Tangerang Kota
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl">
            Rekapitulasi resmi jumlah jiwa, kepala keluarga (KK), generus, pasangan menikah, dan lansia di 9 Desa & 52 Kelompok se-Kota Tangerang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {/* Download Direct PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-70"
            title="Unduh langsung file laporan sensus resmi dalam format .pdf"
          >
            <Download className={`w-4 h-4 text-teal-300 ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
          </button>

          {/* Cetak / Print Button */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95"
            title="Buka pratinjau cetak resmi sistem peramban"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak</span>
          </button>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => onSyncSensus()}
            disabled={isSyncing}
            className={`inline-flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-400/25 transition-all cursor-pointer active:scale-95 ${
              isSyncing ? 'opacity-70 cursor-wait' : ''
            }`}
            title="Sinkronkan pembaruan terkini langsung dari Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
          </button>

          {/* Settings URL Button (Admin only) */}
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={() => {
                setTempUrl(sensusSheetUrl);
                setIsUrlModalOpen(true);
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              title="Atur Tautan Spreadsheet Sensus"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Cards (Purity UI 4-Card Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 print:grid-cols-4">
        {/* Card 1: Total Jamaah */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Jamaah
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">
                {totals.grandTotal.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-teal-600">
                Jiwa
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block mt-1">
              {totals.totalL.toLocaleString('id-ID')} L • {totals.totalP.toLocaleString('id-ID')} P
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 print:hidden">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 2: Jumlah KK */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Kepala Keluarga (KK)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">
                {totals.kk.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-slate-400">
                KK
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Rata-rata 3.6 jiwa / KK
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 print:hidden">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 3: Total Generus */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Generus (0 - Pranikah)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">
                {totals.generusTotal.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-emerald-500">
                {totals.grandTotal > 0 ? Math.round((totals.generusTotal / totals.grandTotal) * 100) : 0}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Balita hingga Usia Mandiri
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 print:hidden">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 4: Jamaah Menikah & Lansia */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Menikah & Lansia
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">
                {(totals.menikahL + totals.menikahP).toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Menikah
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              {totals.lansiaL + totals.lansiaP} Lansia (60+ th)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/25 shrink-0 print:hidden">
            <Heart className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* 3. Visual Charts (Hidden during printing) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Left (5 cols): Komposisi Generus Donut */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-tight">
              Komposisi Generus Daerah
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Proporsi jenjang pembinaan caberawit hingga pranikah
            </p>
          </div>

          <div className="h-64 my-2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = totals.generusTotal > 0 ? Math.round((data.value / totals.generusTotal) * 100) : 0;
                      return (
                        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl">
                          <p className="font-bold">{data.name}</p>
                          <p className="mt-0.5 text-teal-300 font-semibold">{data.value.toLocaleString('id-ID')} Jiwa ({pct}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <RechartsPie
                  data={generusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                >
                  {generusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 leading-none">
                {totals.generusTotal.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Generus
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {generusChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600 text-[11px] font-medium">{item.name}: <b>{item.value}</b></span>
              </div>
            ))}
          </div>
        </div>

        {/* Right (7 cols): Bar Chart Per Desa */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-tight">
              Peringkat Jumlah Jamaah per Wilayah Desa
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Total populasi jamaah di 9 wilayah Desa binaan Kota Tangerang
            </p>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={desaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="name" 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0} 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`${val.toLocaleString('id-ID')} Jiwa`, 'Total Jamaah']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="total" fill="#4FD1C5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Bar (Hidden during printing) */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Desa Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDesa}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua">Semua Desa (9 Desa)</option>
              {desaList.map((desa) => (
                <option key={desa} value={desa}>
                  Desa {desa}
                </option>
              ))}
            </select>
          </div>

          {/* Search Kelompok */}
          <div className="relative w-56 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari nama kelompok..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold justify-between md:justify-end">
          <span>Menampilkan <b>{filteredList.length}</b> dari 52 Kelompok</span>
          {(selectedDesa !== 'Semua' || searchKeyword) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDesa('Semua');
                setSearchKeyword('');
              }}
              className="text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 5. Master Data Sensus Table */}
      <div className="bg-white rounded-3xl shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Printable Official Header (Only shown when printing) */}
        <div className="hidden print:block p-6 text-center border-b-2 border-slate-800 mb-4">
          <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
            LAPORAN SENSUS DATA JAMAAH KOTA TANGERANG
          </h1>
          <p className="text-xs font-bold text-slate-700 mt-0.5">
            Pengurus Daerah Tangerang Kota • Tahun 2026
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • Filter: {selectedDesa === 'Semua' ? 'Seluruh Wilayah' : `Desa ${selectedDesa}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              {/* Main Table Header Category */}
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold text-center">
                <th className="py-2.5 px-2 text-left" rowSpan={3}>No</th>
                <th className="py-2.5 px-2 text-left" rowSpan={3}>Desa</th>
                <th className="py-2.5 px-2 text-left" rowSpan={3}>Kelompok</th>
                <th className="py-2.5 px-2 text-center" rowSpan={3}>Jml KK</th>
                <th className="py-1.5 px-2 text-center bg-teal-50/60 text-teal-800" colSpan={12}>
                  Sensus Generus
                </th>
                <th className="py-1.5 px-2 text-center bg-blue-50/60 text-blue-800" colSpan={2} rowSpan={2}>
                  Menikah
                </th>
                <th className="py-2.5 px-1.5 text-center" rowSpan={3}>Duda</th>
                <th className="py-2.5 px-1.5 text-center" rowSpan={3}>Janda</th>
                <th className="py-1.5 px-2 text-center bg-amber-50/60 text-amber-800" colSpan={2} rowSpan={2}>
                  Lansia (60+)
                </th>
                <th className="py-1.5 px-2 text-center bg-slate-100 text-slate-800" colSpan={2} rowSpan={2}>
                  Seluruh Jamaah
                </th>
                <th className="py-2.5 px-2 text-center bg-teal-100 text-teal-900 font-black" rowSpan={3}>
                  Total
                </th>
              </tr>

              {/* Sub-Header 1: Generus Categories */}
              <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-center text-[10px]">
                <th colSpan={2} className="py-1 px-1 bg-teal-50/40">Balita</th>
                <th colSpan={2} className="py-1 px-1 bg-teal-50/40">PAUD</th>
                <th colSpan={2} className="py-1 px-1 bg-teal-50/40">Cabe Rawit (SD)</th>
                <th colSpan={2} className="py-1 px-1 bg-teal-50/40">Pre-Remaja (SMP)</th>
                <th colSpan={2} className="py-1 px-1 bg-teal-50/40">Remaja (SMA)</th>
                <th colSpan={2} className="py-1 px-1 bg-teal-50/40">Pranikah</th>
              </tr>

              {/* Sub-Header 2: Gender L / P */}
              <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 text-center font-extrabold text-[9px]">
                {/* Generus L/P */}
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                {/* Menikah L/P */}
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                {/* Lansia L/P */}
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
                {/* Total L/P */}
                <th className="py-1 px-1">L</th>
                <th className="py-1 px-1">P</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.map((item) => (
                <tr key={`${item.desa}-${item.kelompok}`} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-2 text-slate-400 font-mono text-[10px]">{item.no}</td>
                  <td className="py-2 px-2 font-bold text-slate-800 whitespace-nowrap">{item.desa}</td>
                  <td className="py-2 px-2 font-semibold text-slate-700 whitespace-nowrap">{item.kelompok}</td>
                  <td className="py-2 px-2 text-center font-bold text-slate-800 bg-slate-50/40">{item.jumlahKK || '-'}</td>

                  {/* Generus Columns */}
                  <td className="py-2 px-1 text-center">{item.generus.balitaL || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.balitaP || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.paudL || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.paudP || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.cabeRawitL || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.cabeRawitP || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.preRemajaL || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.preRemajaP || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.remajaL || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.remajaP || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.pranikahL || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.generus.pranikahP || '-'}</td>

                  {/* Menikah */}
                  <td className="py-2 px-1 text-center bg-blue-50/20">{item.menikahL || '-'}</td>
                  <td className="py-2 px-1 text-center bg-blue-50/20">{item.menikahP || '-'}</td>

                  {/* Duda & Janda */}
                  <td className="py-2 px-1 text-center">{item.duda || '-'}</td>
                  <td className="py-2 px-1 text-center">{item.janda || '-'}</td>

                  {/* Lansia */}
                  <td className="py-2 px-1 text-center bg-amber-50/20">{item.lansiaL || '-'}</td>
                  <td className="py-2 px-1 text-center bg-amber-50/20">{item.lansiaP || '-'}</td>

                  {/* Total L / P */}
                  <td className="py-2 px-1 text-center font-semibold bg-slate-50">{item.totalL}</td>
                  <td className="py-2 px-1 text-center font-semibold bg-slate-50">{item.totalP}</td>

                  {/* Grand Total */}
                  <td className="py-2 px-2 text-center font-black text-teal-700 bg-teal-50/50">
                    {item.total}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total Footer Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-[11px] border-t-2 border-slate-700">
                <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-left">
                  TOTAL KESELURUHAN ({filteredList.length} Kelompok)
                </td>
                <td className="py-3 px-2 text-center bg-slate-800 text-teal-300">
                  {totals.kk.toLocaleString('id-ID')}
                </td>

                {/* Generus Totals */}
                <td className="py-3 px-1 text-center">{totals.balitaL}</td>
                <td className="py-3 px-1 text-center">{totals.balitaP}</td>
                <td className="py-3 px-1 text-center">{totals.paudL}</td>
                <td className="py-3 px-1 text-center">{totals.paudP}</td>
                <td className="py-3 px-1 text-center">{totals.cabeRawitL}</td>
                <td className="py-3 px-1 text-center">{totals.cabeRawitP}</td>
                <td className="py-3 px-1 text-center">{totals.preRemajaL}</td>
                <td className="py-3 px-1 text-center">{totals.preRemajaP}</td>
                <td className="py-3 px-1 text-center">{totals.remajaL}</td>
                <td className="py-3 px-1 text-center">{totals.remajaP}</td>
                <td className="py-3 px-1 text-center">{totals.pranikahL}</td>
                <td className="py-3 px-1 text-center">{totals.pranikahP}</td>

                {/* Menikah */}
                <td className="py-3 px-1 text-center bg-blue-900/40 text-blue-200">{totals.menikahL}</td>
                <td className="py-3 px-1 text-center bg-blue-900/40 text-blue-200">{totals.menikahP}</td>

                {/* Duda & Janda */}
                <td className="py-3 px-1 text-center">{totals.duda}</td>
                <td className="py-3 px-1 text-center">{totals.janda}</td>

                {/* Lansia */}
                <td className="py-3 px-1 text-center bg-amber-900/40 text-amber-200">{totals.lansiaL}</td>
                <td className="py-3 px-1 text-center bg-amber-900/40 text-amber-200">{totals.lansiaP}</td>

                {/* Total L / P */}
                <td className="py-3 px-1 text-center bg-slate-800 text-teal-300">{totals.totalL.toLocaleString('id-ID')}</td>
                <td className="py-3 px-1 text-center bg-slate-800 text-teal-300">{totals.totalP.toLocaleString('id-ID')}</td>

                {/* Grand Total */}
                <td className="py-3 px-2 text-center bg-teal-500 text-white font-black text-xs">
                  {totals.grandTotal.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Print Sign-off Box (Only shown when printing) */}
        <div className="hidden print:grid grid-cols-3 gap-6 p-8 pt-12 text-center text-xs text-slate-800">
          <div>
            <p className="font-semibold">Mengetahui,</p>
            <p className="font-bold mt-0.5">Ketua Daerah Tangerang Kota</p>
            <div className="h-16" />
            <p className="font-bold underline">H. Pembina Daerah</p>
          </div>
          <div>
            <p className="font-semibold">Verifikasi Data,</p>
            <p className="font-bold mt-0.5">Sekretaris Daerah</p>
            <div className="h-16" />
            <p className="font-bold underline">Sekretariat Daerah</p>
          </div>
          <div>
            <p className="font-semibold">Penyusun Sensus,</p>
            <p className="font-bold mt-0.5">Koordinator Sensus & IT</p>
            <div className="h-16" />
            <p className="font-bold underline">Tim Sensus Jamaah</p>
          </div>
        </div>
      </div>

      {/* 6. Settings Modal: Link Spreadsheet Sensus (Admin only) */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <FileSpreadsheet className="w-5 h-5 text-teal-500" />
                Pengaturan Tautan Spreadsheet Sensus
              </div>
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  URL Google Spreadsheet Sensus
                </label>
                <input
                  type="url"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=0"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-hidden font-mono text-[11px]"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Masukkan link Google Spreadsheet (pastikan akses publik "Siapa saja yang memiliki link dapat melihat" atau format CSV). Sistem akan otomatis membaca perubahan data setiap bulan dari link ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-md shadow-teal-500/25 cursor-pointer"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
