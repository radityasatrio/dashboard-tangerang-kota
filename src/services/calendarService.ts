import { AgendaItem } from './types';
import { FULL_12_MONTHS_AGENDA } from './fullAgendaData';
import { DEFAULT_CONFIG, GOOGLE_SCRIPT_URL, STORAGE_KEYS } from './config';

export interface FetchAgendaResult {
  success: boolean;
  data: AgendaItem[];
  message: string;
  usingMaster: boolean;
}

/**
 * Robust RFC 4180 CSV line parser supporting quoted fields and escaped quotes
 */
function splitCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, '$1'));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"(.*)"$/, '$1'));
  return result;
}

const MONTH_NAMES_ID: Record<string, string> = {
  januari: '01', jan: '01',
  februari: '02', feb: '02',
  maret: '03', mar: '03',
  april: '04', apr: '04',
  mei: '05',
  juni: '06', jun: '06',
  juli: '07', jul: '07',
  agustus: '08', agu: '08', ags: '08',
  september: '09', sep: '09',
  oktober: '10', okt: '10',
  november: '11', nov: '11',
  desember: '12', des: '12',
};

/**
 * Standardize any Indonesian or ISO date string into YYYY-MM-DD
 */
export function normalizeDateString(raw: string, defaultYear: number = 2026, defaultMonth: number = 10): string {
  if (!raw) return '';
  const cleaned = raw.trim();

  // Format YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Format like "6 Oktober 2026" or "Selasa, 6 Oktober 2026"
  const textMatch = cleaned.match(/(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{4}))?/);
  if (textMatch) {
    const d = textMatch[1].padStart(2, '0');
    const monthWord = textMatch[2].toLowerCase();
    const m = MONTH_NAMES_ID[monthWord] || String(defaultMonth).padStart(2, '0');
    const y = textMatch[3] || String(defaultYear);
    return `${y}-${m}-${d}`;
  }

  // If only a day number like "6" or "15"
  const dayOnly = parseInt(cleaned, 10);
  if (!isNaN(dayOnly) && dayOnly >= 1 && dayOnly <= 31) {
    return `${defaultYear}-${String(defaultMonth).padStart(2, '0')}-${String(dayOnly).padStart(2, '0')}`;
  }

  return '';
}

/**
 * Auto-classify OPD or organizing body based on title keywords
 */
export function inferOpdFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('asad') || t.includes('persinas') || t.includes('beladiri') || t.includes('pencak')) {
    return 'PERSINAS ASAD Kota Tangerang';
  }
  if (t.includes('forsgi') || t.includes('sepakbola') || t.includes('festival forsgi') || t.includes('liga')) {
    return 'FORSGI (Forum Sepakbola Generasi Indonesia)';
  }
  if (t.includes('ppg') || t.includes('generus') || t.includes('cai') || t.includes('cabe rawit') || t.includes('pra nikah')) {
    return 'PPG (Penggerak Pembina Generus) Kota Tangerang';
  }
  if (t.includes('muda-mudi') || t.includes('mm') || t.includes('remaja') || t.includes('pemuda')) {
    return 'Bidang Kepemudaan (Muda-Mudi Daerah)';
  }
  if (t.includes('ibu-ibu') || t.includes('keputrian') || t.includes('wanita') || t.includes('putri')) {
    return 'Bidang Keputrian (Pengajian Ibu-Ibu Daerah)';
  }
  if (t.includes('senkom') || t.includes('rescue') || t.includes('mitra polri') || t.includes('kamtibmas')) {
    return 'Senkom Mitra Polri Kota Tangerang';
  }
  if (t.includes('smp') || t.includes('sma') || t.includes('pondok') || t.includes('mpls') || t.includes('yayasan') || t.includes('murid')) {
    return 'Yayasan & Lembaga Pendidikan (SMP/SMA)';
  }
  if (/\bub\b/i.test(title) || t.includes('usaha bersama') || t.includes('koperasi')) {
    return 'UB (Usaha Bersama) Daerah';
  }
  if (t.includes('desa') || t.includes('sambung desa')) {
    return 'Pengurus Daerah Tangerang Kota';
  }
  return 'Pengurus Daerah Tangerang Kota';
}

/**
 * Infer event time from text or return sensible default
 */
export function inferTimeFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('subuh')) return '05:00';
  if (t.includes('ashar')) return '15:30';
  if (t.includes('dzuhur') || t.includes('siang')) return '13:00';
  if (t.includes('isya') || t.includes('malam') || t.includes('ba\'da isya')) return '19:30';
  if (t.includes('pagi')) return '08:00';
  if (t.includes('sore')) return '16:00';
  return '09:00';
}

/**
 * Parse Calendar Grid rows (Indonesian 7-column calendar format)
 * Columns: Minggu (0), Senin (1), Selasa (2), Rabu (3), Kamis (4), Jum'at (5), Sabtu (6)
 */
export function parseGridRows(rows: string[][], year: number = 2026, month: number = 10): AgendaItem[] {
  const items: AgendaItem[] = [];
  let currentDates: number[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 5) continue;

    // Check if this row is a day-numbers row (contains numbers 1..31 across columns)
    const numMatches = row.map((cell) => {
      const n = parseInt(cell.trim(), 10);
      return !isNaN(n) && n >= 1 && n <= 31 ? n : null;
    });

    const validNums = numMatches.filter((n) => n !== null);
    if (validNums.length >= 4) {
      // This is a date header row!
      currentDates = numMatches.map((n) => n || 0);
      continue;
    }

    // If we have an active week header, parse agenda items in each column
    if (currentDates.length >= 7) {
      for (let col = 0; col < 7; col++) {
        const dayNum = currentDates[col];
        if (!dayNum || dayNum < 1 || dayNum > 31) continue;

        const cellText = (row[col] || '').trim();
        if (!cellText || cellText === '-' || cellText === '1970-01-01') continue;

        // Skip plain numbers or header labels
        if (/^\d+$/.test(cellText)) continue;
        if (cellText.toLowerCase().includes('minggu') || cellText.toLowerCase().includes('senin')) continue;

        // Format clean title
        const cleanTitle = cellText.replace(/^\[\d+\]\s*/, '').trim();
        if (!cleanTitle) continue;

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const timeStr = inferTimeFromTitle(cleanTitle);
        const opdStr = inferOpdFromTitle(cleanTitle);

        items.push({
          id: `ag-grid-${dateStr}-${col}-${items.length + 1}`,
          title: cleanTitle,
          date: dateStr,
          time: timeStr,
          location: cleanTitle.toLowerCase().includes('online') ? 'Online (Zoom / Meet)' : 'Pusat Daerah Tangerang Kota',
          description: `Agenda kegiatan ${cleanTitle}`,
          opd: opdStr,
          createdAt: new Date().toISOString(),
          syncedToSheets: true,
        });
      }
    }
  }

  return items;
}

/**
 * Parse standard tabular CSV rows (Header: Tanggal, Waktu, Judul, Lokasi, OPD, etc.)
 */
export function parseTabularRows(rows: string[][]): AgendaItem[] {
  if (rows.length < 2) return [];

  // Inspect first 3 rows to find header row
  let headerIndex = -1;
  let dateCol = -1;
  let timeCol = -1;
  let titleCol = -1;
  let locCol = -1;
  let opdCol = -1;
  let descCol = -1;

  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r].map((c) => c.toLowerCase().trim());
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val.includes('tanggal') || val.includes('date') || val === 'tgl') dateCol = c;
      if (val.includes('waktu') || val.includes('jam') || val.includes('time') || val === 'pukul') timeCol = c;
      if (val.includes('kegiatan') || val.includes('acara') || val.includes('agenda') || val.includes('judul') || val.includes('title')) titleCol = c;
      if (val.includes('lokasi') || val.includes('tempat') || val.includes('location')) locCol = c;
      if (val.includes('opd') || val.includes('bidang') || val.includes('penyelenggara') || val.includes('pelaksana')) opdCol = c;
      if (val.includes('keterangan') || val.includes('deskripsi') || val.includes('catatan')) descCol = c;
    }
    if (titleCol !== -1 && (dateCol !== -1 || timeCol !== -1)) {
      headerIndex = r;
      break;
    }
  }

  if (headerIndex === -1 || titleCol === -1) {
    return [];
  }

  const items: AgendaItem[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawTitle = (row[titleCol] || '').trim();
    if (!rawTitle) continue;

    const rawDate = dateCol !== -1 ? (row[dateCol] || '').trim() : '';
    const normDate = normalizeDateString(rawDate) || '2026-10-01';

    const rawTime = timeCol !== -1 ? (row[timeCol] || '').trim() : '';
    const timeClean = rawTime.match(/\b\d{1,2}[:.]\d{2}\b/) 
      ? rawTime.match(/\b\d{1,2}[:.]\d{2}\b/)![0].replace('.', ':').padStart(5, '0')
      : inferTimeFromTitle(rawTitle);

    const location = locCol !== -1 && row[locCol] ? row[locCol].trim() : 'Pusat Daerah Tangerang Kota';
    const opd = opdCol !== -1 && row[opdCol] ? row[opdCol].trim() : inferOpdFromTitle(rawTitle);
    const description = descCol !== -1 && row[descCol] ? row[descCol].trim() : `Kegiatan ${rawTitle}`;

    items.push({
      id: `ag-csv-${r}-${Date.now()}`,
      title: rawTitle,
      date: normDate,
      time: timeClean,
      location,
      description,
      opd,
      createdAt: new Date().toISOString(),
      syncedToSheets: true,
    });
  }

  return items;
}

/**
 * Main flexible parser for Agenda CSV text or JSON strings
 */
export function parseAgendaCsv(rawContent: string, defaultYear: number = 2026, defaultMonth: number = 10): AgendaItem[] {
  if (!rawContent || typeof rawContent !== 'string') return [];

  const trimmed = rawContent.trim();

  // Guard against HTML error/redirect pages
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('class="document-root"')) {
    return [];
  }

  // Guard against JSON responses
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      if (Array.isArray(parsedJson)) {
        return parseAgendaJsonArray(parsedJson);
      }
      if (parsedJson && parsedJson.data && Array.isArray(parsedJson.data)) {
        return parseAgendaJsonArray(parsedJson.data);
      }
    } catch {
      // Not JSON, continue to CSV parsing
    }
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const tableRows = lines.map((l) => splitCsvLine(l, delimiter));

  // 1. Try Tabular parsing first
  const tabularResult = parseTabularRows(tableRows);
  if (tabularResult.length >= 3) {
    return tabularResult;
  }

  // 2. Try Calendar Grid parsing
  const gridResult = parseGridRows(tableRows, defaultYear, defaultMonth);
  if (gridResult.length > 0) {
    return gridResult;
  }

  return tabularResult.length > 0 ? tabularResult : [];
}

/**
 * Helper to parse objects returned from Google Apps Script Web App
 */
export function parseAgendaJsonArray(rawItems: any[]): AgendaItem[] {
  if (!rawItems || rawItems.length === 0) return [];

  // Check if rows are objects with {id, title, date, time, location, description, opd}
  // representing the 7 columns of the spreadsheet grid
  const rowStrings: string[][] = rawItems.map((item) => {
    if (Array.isArray(item)) return item.map((x) => String(x || ''));
    if (typeof item === 'object') {
      return [
        String(item.id ?? ''),
        String(item.title ?? ''),
        String(item.date ?? ''),
        String(item.time ?? ''),
        String(item.location ?? ''),
        String(item.description ?? ''),
        String(item.opd ?? ''),
      ];
    }
    return [];
  });

  const gridParsed = parseGridRows(rowStrings, 2026, 10);
  if (gridParsed.length > 0) {
    return gridParsed;
  }

  // Tabular fallback
  return parseTabularRows(rowStrings);
}

/**
 * Fetch Agenda from Google Sheets CSV with multi-stage fallback:
 * 1. Direct CSV download from Google Sheets
 * 2. Google Apps Script Web App action=get_agenda (bypasses Google login cookies)
 * 3. Master 12 Months full data fallback
 */
export async function fetchAgendasFromSpreadsheet(
  customCsvUrl?: string,
  customGasUrl?: string
): Promise<FetchAgendaResult> {
  const csvUrl =
    customCsvUrl ||
    (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CALENDAR_CSV_URL) : null) ||
    DEFAULT_CONFIG.calendarCsvUrl ||
    `https://docs.google.com/spreadsheets/d/${DEFAULT_CONFIG.spreadsheetId}/export?format=csv&gid=${DEFAULT_CONFIG.sheetTabGid}`;

  const gasUrl =
    customGasUrl ||
    (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL) : null) ||
    DEFAULT_CONFIG.appsScriptUrl ||
    GOOGLE_SCRIPT_URL;

  // Attempt 1: Fetch directly from CSV export URL
  try {
    let fetchUrl = csvUrl.trim();
    if (fetchUrl.includes('docs.google.com/spreadsheets')) {
      if (!fetchUrl.includes('export?format=csv') && !fetchUrl.includes('pub?output=csv') && !fetchUrl.includes('gviz/tq')) {
        const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = fetchUrl.match(/[#&?]gid=([0-9]+)/);
        const sheetId = idMatch ? idMatch[1] : DEFAULT_CONFIG.spreadsheetId;
        const gid = gidMatch ? gidMatch[1] : DEFAULT_CONFIG.sheetTabGid;
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }
    }

    const res = await fetch(fetchUrl);
    if (res.ok) {
      const csvText = await res.text();
      const parsed = parseAgendaCsv(csvText, 2026, 10);
      if (parsed.length > 0) {
        return {
          success: true,
          data: parsed,
          message: `Berhasil memuat ${parsed.length} agenda dari publikasi spreadsheet.`,
          usingMaster: false,
        };
      }
    }
  } catch (err) {
    // Continue to Apps Script fallback
  }

  // Attempt 2: Fetch via Google Apps Script Web App get_agenda
  if (gasUrl) {
    try {
      const cleanGas = gasUrl.split('?')[0];
      const res = await fetch(`${cleanGas}?action=get_agenda`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const parsed = parseAgendaJsonArray(json.data);
          if (parsed.length > 0) {
            return {
              success: true,
              data: parsed,
              message: `Berhasil menyinkronkan ${parsed.length} agenda via Google Apps Script.`,
              usingMaster: false,
            };
          }
        }
      }
    } catch (err) {
      // Continue to Master fallback
    }
  }

  // Attempt 3: Master Data Full Fallback (12 months full agenda)
  return {
    success: true,
    data: FULL_12_MONTHS_AGENDA,
    message: 'Data agenda aktif menggunakan master data kalender resmi.',
    usingMaster: true,
  };
}
