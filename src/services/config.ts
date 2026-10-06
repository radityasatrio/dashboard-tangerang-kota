import { TangerangConfig } from './types';

export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxy2yu2LKiJKhdHWd114_duDsaJds2POt0pYtsK862-ojd8KI9juJdBNq6ETTDKDErGXA/exec';
export const GAS_API_URL = GOOGLE_SCRIPT_URL;

export const DEFAULT_CONFIG: TangerangConfig = {
  spreadsheetId: '1NkJikjEDdJf6EG_t85ynGr-L6B4HvXOml_J-GihJrzM',
  sheetTabGid: '172820086',
  driveFolderId: '1HvlJnpjhDuzxwyRGFMYtu2h1DWHyblmr',
  appsScriptUrl: GOOGLE_SCRIPT_URL,
  sensusSheetUrl: 'https://docs.google.com/spreadsheets/d/1NkJikjEDdJf6EG_t85ynGr-L6B4HvXOml_J-GihJrzM/export?format=csv&gid=0',
};

export const STORAGE_KEYS = {
  APPS_SCRIPT_URL: 'tangerang_dashboard_gas_url',
  LOCAL_AGENDA: 'tangerang_dashboard_agenda',
  LOCAL_PROPOSALS: 'tangerang_dashboard_proposals',
  LOCAL_LAPORAN: 'tangerang_dashboard_laporan',
  LOCAL_SENSUS: 'tangerang_dashboard_sensus',
  SENSUS_SHEET_URL: 'tangerang_dashboard_sensus_url',
  ADMIN_USER: 'tangerang_dashboard_admin_user',
  CATEGORIES: 'tangerang_dashboard_categories',
  ADMIN_USERS: 'tangerang_dashboard_admin_list',
};

export const KEGIATAN_PENANGGUNG_JAWAB_LIST = [
  'Kelompok',
  'Desa',
  'PPG',
  'Yayasan dan Sekolah',
  'Pusat',
  'Senkom',
  'DPD',
  'Forsgi',
  'Daerah',
] as const;

export type PenanggungJawabKegiatan = (typeof KEGIATAN_PENANGGUNG_JAWAB_LIST)[number];

export interface PenanggungJawabStyle {
  label: PenanggungJawabKegiatan;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  calendarChipBg: string;
  calendarChipText: string;
  calendarChipBorder: string;
  accentBg: string;
  hex: string;
}

export const PENANGGUNG_JAWAB_STYLES: Record<PenanggungJawabKegiatan, PenanggungJawabStyle> = {
  Kelompok: {
    label: 'Kelompok',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    calendarChipBg: 'bg-emerald-50',
    calendarChipText: 'text-emerald-800',
    calendarChipBorder: 'border-emerald-300',
    accentBg: 'bg-emerald-600',
    hex: '#10b981',
  },
  Desa: {
    label: 'Desa',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    borderColor: 'border-sky-300',
    dotColor: 'bg-sky-500',
    calendarChipBg: 'bg-sky-50',
    calendarChipText: 'text-sky-800',
    calendarChipBorder: 'border-sky-300',
    accentBg: 'bg-sky-600',
    hex: '#0284c7',
  },
  PPG: {
    label: 'PPG',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-300',
    dotColor: 'bg-purple-500',
    calendarChipBg: 'bg-purple-50',
    calendarChipText: 'text-purple-800',
    calendarChipBorder: 'border-purple-300',
    accentBg: 'bg-purple-600',
    hex: '#9333ea',
  },
  'Yayasan dan Sekolah': {
    label: 'Yayasan dan Sekolah',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    dotColor: 'bg-amber-500',
    calendarChipBg: 'bg-amber-50',
    calendarChipText: 'text-amber-900',
    calendarChipBorder: 'border-amber-300',
    accentBg: 'bg-amber-600',
    hex: '#d97706',
  },
  Pusat: {
    label: 'Pusat',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-300',
    dotColor: 'bg-rose-500',
    calendarChipBg: 'bg-rose-50',
    calendarChipText: 'text-rose-800',
    calendarChipBorder: 'border-rose-300',
    accentBg: 'bg-rose-600',
    hex: '#e11d48',
  },
  Senkom: {
    label: 'Senkom',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    dotColor: 'bg-indigo-600',
    calendarChipBg: 'bg-indigo-50',
    calendarChipText: 'text-indigo-900',
    calendarChipBorder: 'border-indigo-300',
    accentBg: 'bg-indigo-600',
    hex: '#4f46e5',
  },
  DPD: {
    label: 'DPD',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    borderColor: 'border-teal-300',
    dotColor: 'bg-teal-600',
    calendarChipBg: 'bg-teal-50',
    calendarChipText: 'text-teal-900',
    calendarChipBorder: 'border-teal-300',
    accentBg: 'bg-teal-600',
    hex: '#0d9488',
  },
  Forsgi: {
    label: 'Forsgi',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    borderColor: 'border-orange-300',
    dotColor: 'bg-orange-500',
    calendarChipBg: 'bg-orange-50',
    calendarChipText: 'text-orange-900',
    calendarChipBorder: 'border-orange-300',
    accentBg: 'bg-orange-600',
    hex: '#ea580c',
  },
  Daerah: {
    label: 'Daerah',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    borderColor: 'border-cyan-300',
    dotColor: 'bg-cyan-600',
    calendarChipBg: 'bg-cyan-50',
    calendarChipText: 'text-cyan-950',
    calendarChipBorder: 'border-cyan-300',
    accentBg: 'bg-cyan-600',
    hex: '#0891b2',
  },
};

export function getPenanggungJawab(item: { opd?: string; title?: string }): PenanggungJawabKegiatan {
  const opdVal = item.opd || '';
  const opdLower = opdVal.toLowerCase();
  const titleLower = (item.title || '').toLowerCase();

  // Direct matches
  if (opdVal === 'Daerah') return 'Daerah';
  if (opdVal === 'DPD') return 'DPD';
  if (opdVal === 'Kelompok') return 'Kelompok';
  if (opdVal === 'Desa') return 'Desa';
  if (opdVal === 'PPG') return 'PPG';
  if (opdVal === 'Yayasan dan Sekolah' || opdVal.includes('Yayasan')) return 'Yayasan dan Sekolah';
  if (opdVal === 'Pusat') return 'Pusat';
  if (opdVal === 'Senkom' || opdVal.includes('Senkom')) return 'Senkom';
  if (opdVal === 'Forsgi' || opdVal.includes('FORSGI')) return 'Forsgi';

  // Keyword detection from title or opd
  if (opdLower.includes('kelompok') || titleLower.includes('kelompok')) return 'Kelompok';
  if (opdLower.includes('forsgi') || titleLower.includes('forsgi')) return 'Forsgi';
  if (opdLower.includes('senkom') || titleLower.includes('senkom')) return 'Senkom';
  if (
    opdLower.includes('ppg') ||
    titleLower.includes('ppg') ||
    titleLower.includes('generus') ||
    titleLower.includes('cabe rawit')
  ) {
    return 'PPG';
  }
  if (
    opdLower.includes('yayasan') ||
    opdLower.includes('sekolah') ||
    titleLower.includes('yayasan') ||
    titleLower.includes('sekolah') ||
    titleLower.includes('smp') ||
    titleLower.includes('sma') ||
    titleLower.includes('pondok')
  ) {
    return 'Yayasan dan Sekolah';
  }
  if (opdLower.includes('pusat') || titleLower.includes('pusat')) return 'Pusat';
  if (opdLower.includes('desa') || titleLower.includes('desa')) return 'Desa';
  if (opdLower.includes('dpd') || titleLower.includes('dpd')) return 'DPD';
  if (
    opdLower.includes('daerah') ||
    titleLower.includes('daerah') ||
    opdLower.includes('persinas') ||
    titleLower.includes('persinas') ||
    opdLower.includes('ub') ||
    opdLower.includes('muda-mudi') ||
    opdLower.includes('keputrian')
  ) {
    return 'Daerah';
  }

  return 'Daerah';
}

export const TANGERANG_OPD_LIST = [
  'Kelompok',
  'Desa',
  'PPG',
  'Yayasan dan Sekolah',
  'Pusat',
  'Senkom',
  'DPD',
  'Forsgi',
  'Daerah',
];

export const LAPORAN_DESA_LIST = [
  'Bonang',
  'BSD',
  'Cibodasari',
  'Cimone',
  'Kenanga',
  'Neglasari',
  'Panunggangan',
  'Tanah Tinggi',
  'Tangerang',
] as const;

export const LAPORAN_TIM_LIST = [
  'PPG',
  'DPD LDII',
  'SENKOM',
  'PERSINAS & ASAD',
  'PRAMUKA',
  'FORSGI',
] as const;

export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Laporan Desa', active: true },
  { id: 'cat-2', name: 'Laporan TIM', active: true },
];

export const LAPORAN_CATEGORIES = [
  'Laporan Desa',
  'Laporan TIM',
] as const;

export type AdminRole = 'Super Admin' | 'Admin Kalender' | 'Admin Laporan' | 'Admin Proposal' | 'Viewer';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  pin?: string;
}

export const INITIAL_ADMINS: AdminUserItem[] = [
  {
    id: 'adm-1',
    name: 'Administrator Utama',
    email: 'admin.puspem@tangerangkota.go.id',
    role: 'Super Admin',
    active: true,
    pin: 'duasembilan',
  },
  {
    id: 'adm-2',
    name: 'Petugas Verifikator Proposal',
    email: 'verifikator.hibah@tangerangkota.go.id',
    role: 'Admin Proposal',
    active: true,
    pin: 'duasembilan',
  },
  {
    id: 'adm-3',
    name: 'Operator Agenda Kedinasan',
    email: 'protokol@tangerangkota.go.id',
    role: 'Admin Kalender',
    active: true,
    pin: 'duasembilan',
  },
];
