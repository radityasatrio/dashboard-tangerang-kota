import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Sector 
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  FileCheck2, 
  Building2, 
  Users,
  PieChart as PieChartIcon
} from 'lucide-react';
import { LaporanItem } from '../services/types';
import { TabKey } from './Sidebar';

const RechartsPie = Pie as any;

interface LaporanStatusDonutChartProps {
  laporans: LaporanItem[];
  onNavigate?: (tab: TabKey) => void;
}

export const LaporanStatusDonutChart: React.FC<LaporanStatusDonutChartProps> = ({
  laporans,
  onNavigate,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Compute statistics
  const stats = useMemo(() => {
    let terverifikasi = 0;
    let diproses = 0;
    let pending = 0;
    let desaCount = 0;
    let timCount = 0;

    laporans.forEach((item) => {
      if (item.category === 'Laporan Desa') desaCount++;
      if (item.category === 'Laporan TIM') timCount++;

      const s = (item.status as string) || 'Terverifikasi';
      if (s === 'Terverifikasi') {
        terverifikasi++;
      } else if (s === 'Diterima' || s === 'Diproses') {
        diproses++;
      } else {
        pending++;
      }
    });

    const total = laporans.length;

    const chartData = [
      {
        name: 'Terverifikasi',
        value: terverifikasi,
        color: '#10B981', // Emerald
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        badgeColor: 'bg-emerald-500',
        desc: 'Dokumen telah diperiksa dan disetujui sah',
        icon: CheckCircle2,
      },
      {
        name: 'Diproses',
        value: diproses,
        color: '#3B82F6', // Blue
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        badgeColor: 'bg-blue-500',
        desc: 'Dokumen diterima dan sedang diarsipkan',
        icon: FileCheck2,
      },
      {
        name: 'Pending',
        value: pending,
        color: '#F59E0B', // Amber
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        badgeColor: 'bg-amber-500',
        desc: 'Menunggu verifikasi lanjutan atau kelengkapan',
        icon: Clock,
      },
    ];

    return {
      terverifikasi,
      diproses,
      pending,
      total,
      desaCount,
      timCount,
      chartData,
    };
  }, [laporans]);

  // Active hover sector rendering
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="transition-all duration-300 drop-shadow-md"
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 9}
          outerRadius={outerRadius + 12}
          fill={fill}
          opacity={0.35}
        />
      </g>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const emptyPlaceholder = [{ name: 'Belum Ada Laporan', value: 1, color: '#E2E8F0' }];
  const pieData = stats.total === 0 ? emptyPlaceholder : stats.chartData;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-tight">
              Statistik Status Laporan Daerah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi proporsi status laporan kegiatan Desa & Unit TIM
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('laporan')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-center"
          >
            <span>Buka Modul Laporan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content: Donut Chart + Status Cards */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full h-64 sm:h-72 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = stats.total > 0 ? Math.round((data.value / stats.total) * 100) : 0;
                      return (
                        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-slate-700">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: data.color }}
                            />
                            {data.name}
                          </p>
                          <p className="mt-1 text-slate-300 font-semibold">
                            {data.value} Berkas ({pct}%)
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {data.desc}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <RechartsPie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={stats.total === 0 ? 0 : 4}
                  dataKey="value"
                  activeIndex={stats.total > 0 && activeIndex !== null ? activeIndex : undefined}
                  activeShape={stats.total > 0 ? renderActiveShape : undefined}
                  onMouseEnter={stats.total > 0 ? onPieEnter : undefined}
                  onMouseLeave={stats.total > 0 ? onPieLeave : undefined}
                  cursor={stats.total > 0 ? "pointer" : "default"}
                  animationDuration={800}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="transition-all duration-200"
                    />
                  ))}
                </RechartsPie>
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 leading-none">
                {activeIndex !== null ? stats.chartData[activeIndex].value : stats.total}
              </span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1.5">
                {activeIndex !== null 
                  ? stats.chartData[activeIndex].name 
                  : stats.total === 0 
                  ? 'Belum Ada Berkas' 
                  : 'Total Laporan'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {activeIndex !== null
                  ? `${stats.total > 0 ? Math.round((stats.chartData[activeIndex].value / stats.total) * 100) : 0}% porsi`
                  : stats.total === 0
                  ? 'Menunggu Unggahan'
                  : `${stats.desaCount} Desa • ${stats.timCount} TIM`}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-1">
            Arahkan kursor atau sentuh bagian cincin untuk melihat rincian
          </p>
        </div>

        {/* Right: Status Metric Cards & Details */}
        <div className="lg:col-span-7 space-y-3">
          {stats.chartData.map((item, idx) => {
            const isHovered = activeIndex === idx;
            const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
            const IconComponent = item.icon;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? `${item.bgColor} ${item.borderColor} shadow-sm ring-2 ring-offset-1 ring-${item.color}`
                    : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${item.badgeColor} shadow-2xs`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          {item.name}
                        </h4>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.bgColor} ${item.textColor} border ${item.borderColor}`}>
                          {pct}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">
                      {item.value}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      berkas
                    </span>
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="mt-3 w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Sub-Summary Chips: Desa vs TIM */}
          {stats.total === 0 ? (
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Belum ada data laporan masuk. Grafik statistik akan otomatis membaca dan bertambah begitu berkas diunggah.</span>
              </span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('laporan')}
                  className="shrink-0 font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer text-left"
                >
                  Unggah Sekarang →
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Laporan Wilayah Desa: <b className="text-slate-900">{stats.desaCount} berkas</b>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Users className="w-4 h-4 text-teal-600" />
                  Laporan Unit TIM: <b className="text-slate-900">{stats.timCount} berkas</b>
                </span>
              </div>

              <span className="text-[11px] font-semibold text-slate-500">
                Total {stats.total} Dokumen Terintegrasi
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
