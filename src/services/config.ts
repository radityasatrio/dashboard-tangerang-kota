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

export const TANGERANG_OPD_LIST = [
  'Pengurus Daerah Tangerang Kota',
  'PPG (Penggerak Pembina Generus) Kota Tangerang',
  'PERSINAS ASAD Kota Tangerang',
  'FORSGI (Forum Sepakbola Generasi Indonesia)',
  'Bidang Kepemudaan (Muda-Mudi Daerah)',
  'Bidang Keputrian (Pengajian Ibu-Ibu Daerah)',
  'Senkom Mitra Polri Kota Tangerang',
  'Yayasan & Lembaga Pendidikan (SMP/SMA)',
  'UB (Usaha Bersama) Daerah',
  'Sekretariat Daerah',
  'Bappeda Kota Tangerang',
  'Dinas Komunikasi dan Informatika (Diskominfo)',
  'Dinas Pendidikan',
  'Dinas Kesehatan',
  'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)',
  'Dinas Pemuda dan Olahraga (Dispora)',
  'Satuan Polisi Pamong Praja (Satpol PP)',
  'Dinas Perhubungan',
  'Masyarakat / Umum / Lembaga',
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
    pin: 'tungguaja',
  },
  {
    id: 'adm-2',
    name: 'Petugas Verifikator Proposal',
    email: 'verifikator.hibah@tangerangkota.go.id',
    role: 'Admin Proposal',
    active: true,
    pin: 'tungguaja',
  },
  {
    id: 'adm-3',
    name: 'Operator Agenda Kedinasan',
    email: 'protokol@tangerangkota.go.id',
    role: 'Admin Kalender',
    active: true,
    pin: 'tungguaja',
  },
];
