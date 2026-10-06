export type UserRole = 'admin' | 'verifikator' | 'pemohon' | 'opd';

export interface AgendaItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  description: string;
  opd: string;
  createdAt: string;
  syncedToSheets?: boolean;
}

export type ProposalStatus = 'Antrean' | 'Sedang Ditinjau' | 'Butuh Revisi' | 'Disetujui' | 'Ditolak';

export interface ProposalItem {
  id: string;
  ticketNumber: string; // PRP-YYYYMMDD-XXXX
  applicantName: string;
  organization: string;
  title: string;
  budget: number;
  phone: string;
  email: string;
  fileName: string;
  driveFileId?: string;
  driveFileUrl?: string;
  status: ProposalStatus;
  statusNotes?: string;
  submittedAt: string;
  updatedAt: string;
}

export type LaporanCategory = 
  | 'Laporan Desa'
  | 'Laporan TIM'
  | string;

export type LaporanStatus = 'Terverifikasi' | 'Diterima' | 'Menunggu Review' | 'Perlu Revisi';

export interface LaporanItem {
  id: string;
  title: string;
  category: LaporanCategory;
  entityName: string; // e.g. 'Bonang', 'BSD', 'PPG', 'SENKOM', etc.
  status?: LaporanStatus;
  period: string; // e.g. 'Triwulan III 2026', 'Oktober 2026'
  periodDate?: string; // ISO date for filtering YYYY-MM-DD
  description: string;
  opd: string;
  fileName: string;
  fileSize?: string;
  driveFileId?: string;
  driveFileUrl?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface TangerangConfig {
  spreadsheetId: string;
  sheetTabGid: string;
  driveFolderId: string;
  appsScriptUrl?: string;
  sensusSheetUrl?: string;
}
