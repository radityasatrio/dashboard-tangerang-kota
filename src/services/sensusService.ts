import { SensusJamaahItem, INITIAL_SENSUS_JAMAAH } from './sensusData';
import { DEFAULT_CONFIG, STORAGE_KEYS } from './config';

export interface FetchSensusResult {
  success: boolean;
  data: SensusJamaahItem[];
  message: string;
  usingMaster: boolean;
}

function parseNum(val: any): number {
  if (!val || val === '-' || val === '') return 0;
  const cleaned = String(val).trim().replace(/,/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
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

/**
 * Parse CSV text into structured SensusJamaahItem list with column auto-alignment
 */
export function parseSensusCsv(csvText: string): SensusJamaahItem[] {
  if (!csvText || typeof csvText !== 'string') return [];

  // Protect against HTML responses (e.g. Google login / error page redirect)
  const trimmed = csvText.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('class="document-root"')) {
    return [];
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Detect delimiter: comma, semicolon, or tab
  const sample = lines[0] || '';
  const delimiter = sample.includes(';') && !sample.includes(',') ? ';' : sample.includes('\t') ? '\t' : ',';

  const items: SensusJamaahItem[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const parts = splitCsvLine(line, delimiter);
    if (parts.length < 5) continue;

    // Detect column offset: is column 0 or column 1 the "No" counter?
    let offset = 0;
    const col0Num = parseInt(parts[0], 10);
    const col1Num = parseInt(parts[1], 10);

    let no = NaN;
    if (!isNaN(col0Num) && col0Num >= 1 && col0Num <= 200) {
      no = col0Num;
      offset = 0;
    } else if (!isNaN(col1Num) && col1Num >= 1 && col1Num <= 200) {
      no = col1Num;
      offset = 1;
    } else {
      // Header or note row, skip
      continue;
    }

    const desa = (parts[offset + 1] || '').trim();
    const kelompok = (parts[offset + 2] || '').trim();
    if (!desa || !kelompok) continue;

    const diupdatePada = (parts[offset + 3] || '').trim() || 'Terbaru';
    const jumlahKK = parseNum(parts[offset + 4]);

    const balitaL = parseNum(parts[offset + 5]);
    const balitaP = parseNum(parts[offset + 6]);
    const paudL = parseNum(parts[offset + 7]);
    const paudP = parseNum(parts[offset + 8]);
    const cabeRawitL = parseNum(parts[offset + 9]);
    const cabeRawitP = parseNum(parts[offset + 10]);
    const preRemajaL = parseNum(parts[offset + 11]);
    const preRemajaP = parseNum(parts[offset + 12]);
    const remajaL = parseNum(parts[offset + 13]);
    const remajaP = parseNum(parts[offset + 14]);
    const pranikahL = parseNum(parts[offset + 15]);
    const pranikahP = parseNum(parts[offset + 16]);

    const menikahL = parseNum(parts[offset + 17]);
    const menikahP = parseNum(parts[offset + 18]);

    const duda = parseNum(parts[offset + 19]);
    const janda = parseNum(parts[offset + 20]);

    const lansiaL = parseNum(parts[offset + 21]);
    const lansiaP = parseNum(parts[offset + 22]);

    let totalL = parseNum(parts[offset + 23]);
    let totalP = parseNum(parts[offset + 24]);
    let total = parseNum(parts[offset + 25]);

    // Recalculate totals if not provided in CSV
    if (!totalL) {
      totalL = balitaL + paudL + cabeRawitL + preRemajaL + remajaL + pranikahL + menikahL + duda + lansiaL;
    }
    if (!totalP) {
      totalP = balitaP + paudP + cabeRawitP + preRemajaP + remajaP + pranikahP + menikahP + janda + lansiaP;
    }
    if (!total) {
      total = totalL + totalP;
    }

    items.push({
      no,
      desa,
      kelompok,
      diupdatePada,
      jumlahKK,
      generus: {
        balitaL,
        balitaP,
        paudL,
        paudP,
        cabeRawitL,
        cabeRawitP,
        preRemajaL,
        preRemajaP,
        remajaL,
        remajaP,
        pranikahL,
        pranikahP,
      },
      menikahL,
      menikahP,
      duda,
      janda,
      lansiaL,
      lansiaP,
      totalL,
      totalP,
      total,
    });
  }

  return items;
}

/**
 * Fetch and parse sensus data from Google Spreadsheet or direct public CSV link
 */
export async function fetchSensusFromSpreadsheet(customUrl?: string): Promise<FetchSensusResult> {
  const url = customUrl || localStorage.getItem(STORAGE_KEYS.SENSUS_SHEET_URL) || DEFAULT_CONFIG.sensusSheetUrl;
  if (!url) {
    return { 
      success: true, 
      data: INITIAL_SENSUS_JAMAAH, 
      message: 'Menggunakan master data sensus tersimpan.',
      usingMaster: true 
    };
  }

  try {
    let fetchUrl = url.trim();

    // Convert standard Google Spreadsheet link to CSV export format
    if (fetchUrl.includes('docs.google.com/spreadsheets')) {
      if (!fetchUrl.includes('export?format=csv') && !fetchUrl.includes('pub?output=csv') && !fetchUrl.includes('gviz/tq')) {
        const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = fetchUrl.match(/[#&?]gid=([0-9]+)/);
        if (idMatch) {
          const sheetId = idMatch[1];
          const gid = gidMatch ? gidMatch[1] : '0';
          fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        }
      }
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const text = await res.text();
    const parsed = parseSensusCsv(text);

    if (parsed.length > 0) {
      return { 
        success: true, 
        data: parsed, 
        message: `Berhasil memuat ${parsed.length} kelompok dari tautan sensus.`,
        usingMaster: false 
      };
    } else {
      // CSV format mismatch or returned HTML page, fallback gracefully
      return { 
        success: true, 
        data: INITIAL_SENSUS_JAMAAH, 
        message: 'Data sensus aktif menggunakan master data tersimpan.',
        usingMaster: true 
      };
    }
  } catch (err: any) {
    // Silent and safe fallback without alarming error logs
    return { 
      success: true, 
      data: INITIAL_SENSUS_JAMAAH, 
      message: 'Data sensus aktif menggunakan master data tersimpan.',
      usingMaster: true 
    };
  }
}
