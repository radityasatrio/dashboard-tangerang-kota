import { SensusJamaahItem, INITIAL_SENSUS_JAMAAH } from './sensusData';
import { DEFAULT_CONFIG, STORAGE_KEYS } from './config';

function parseNum(val: any): number {
  if (!val || val === '-' || val === '') return 0;
  const cleaned = String(val).trim().replace(/,/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}

export function parseSensusCsv(csvText: string): SensusJamaahItem[] {
  const lines = csvText.split(/\r?\n/);
  const items: SensusJamaahItem[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');

    const noStr = parts[1] ? parts[1].trim() : '';
    const no = parseInt(noStr, 10);

    if (!isNaN(no) && no >= 1 && no <= 100) {
      const desa = parts[2] ? parts[2].trim() : '';
      const kelompok = parts[3] ? parts[3].trim() : '';
      const diupdatePada = parts[4] ? parts[4].trim() : '9-Sep-2026';
      const jumlahKK = parseNum(parts[5]);

      const balitaL = parseNum(parts[6]);
      const balitaP = parseNum(parts[7]);
      const paudL = parseNum(parts[8]);
      const paudP = parseNum(parts[9]);
      const cabeRawitL = parseNum(parts[10]);
      const cabeRawitP = parseNum(parts[11]);
      const preRemajaL = parseNum(parts[12]);
      const preRemajaP = parseNum(parts[13]);
      const remajaL = parseNum(parts[14]);
      const remajaP = parseNum(parts[15]);
      const pranikahL = parseNum(parts[16]);
      const pranikahP = parseNum(parts[17]);

      const menikahL = parseNum(parts[18]);
      const menikahP = parseNum(parts[19]);

      const duda = parseNum(parts[20]);
      const janda = parseNum(parts[21]);

      const lansiaL = parseNum(parts[22]);
      const lansiaP = parseNum(parts[23]);

      const totalL = parseNum(parts[24]);
      const totalP = parseNum(parts[25]);
      const total = parseNum(parts[26]);

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
  }

  return items;
}

export async function fetchSensusFromSpreadsheet(customUrl?: string): Promise<{ success: boolean; data: SensusJamaahItem[]; message: string }> {
  const url = customUrl || localStorage.getItem(STORAGE_KEYS.SENSUS_SHEET_URL) || DEFAULT_CONFIG.sensusSheetUrl;
  if (!url) {
    return { success: true, data: INITIAL_SENSUS_JAMAAH, message: 'Menggunakan master data tersimpan.' };
  }

  try {
    let fetchUrl = url;
    // Format google spreadsheet link if needed
    if (url.includes('docs.google.com/spreadsheets') && !url.includes('export?format=csv')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
      if (match) {
        const sheetId = match[1];
        const gid = gidMatch ? gidMatch[1] : '0';
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    const parsed = parseSensusCsv(text);

    if (parsed.length > 0) {
      return { success: true, data: parsed, message: `Berhasil memuat ${parsed.length} kelompok dari spreadsheet.` };
    } else {
      return { success: false, data: INITIAL_SENSUS_JAMAAH, message: 'Data CSV kosong atau format tidak sesuai, menggunakan master data.' };
    }
  } catch (err: any) {
    console.warn('Gagal fetch data sensus dari URL langsung:', err);
    return { success: false, data: INITIAL_SENSUS_JAMAAH, message: 'Gagal menghubungi tautan spreadsheet langsung (CORS/Koneksi), data tetap aman menggunakan master sensus.' };
  }
}
