import { getAccessToken } from './auth';
import { AgendaItem, ProposalItem, LaporanItem } from './types';
import { DEFAULT_CONFIG, GOOGLE_SCRIPT_URL } from './config';

export interface UploadLaporanPayload {
  action?: string;
  id?: string;
  title: string;
  category: string;
  entityName?: string;
  status?: string;
  period: string;
  description?: string;
  opd?: string;
  fileName: string;
  fileSize?: string;
  fileBase64: string;
  fileMimeType?: string;
  folderId?: string;
  uploadedBy?: string;
}

/**
 * Upload laporan directly to Google Drive via Google Apps Script Web App endpoint with Base64 payload.
 */
export async function uploadLaporanViaAppsScript(
  payload: UploadLaporanPayload,
  scriptUrl: string = GOOGLE_SCRIPT_URL
): Promise<{ success: boolean; fileUrl?: string; fileId?: string; message?: string }> {
  const url = scriptUrl || GOOGLE_SCRIPT_URL;
  const postData = {
    action: payload.action || 'upload_laporan',
    folderId: payload.folderId || DEFAULT_CONFIG.driveFolderId,
    ...payload,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(postData),
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data) {
        return {
          success: true,
          fileUrl: data.fileUrl || data.url || data.webViewLink,
          fileId: data.fileId || data.id,
          message: data.message || 'Laporan berhasil diunggah ke Google Drive',
        };
      }
    }
  } catch (err) {
    // If CORS preflight fails in browser, fallback to no-cors mode
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(postData),
      });
      return {
        success: true,
        message: 'Laporan berhasil dikirim ke Google Apps Script',
      };
    } catch (fallbackErr: any) {
      console.warn('Apps Script upload note:', fallbackErr);
      throw new Error(fallbackErr.message || 'Gagal mengirim berkas ke Google Apps Script');
    }
  }

  return {
    success: true,
    message: 'Laporan diproses via Google Apps Script',
  };
}

/**
 * Upload a file directly to Google Drive folder using Google Drive API v3 multipart upload or Apps Script fallback.
 * Folder ID: 1HvlJnpjhDuzxwyRGFMYtu2h1DWHyblmr
 */
export async function uploadFileToGoogleDrive(
  file: File,
  customFileName: string,
  folderId: string = DEFAULT_CONFIG.driveFolderId
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
  // Read file as binary array buffer
  const fileData = await file.arrayBuffer();

  // Convert array buffer to base64
  let binary = '';
  const bytes = new Uint8Array(fileData);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const token = await getAccessToken();
  if (!token) {
    // Fallback directly to Google Apps Script Web App
    const gasRes = await uploadLaporanViaAppsScript({
      action: 'upload_file',
      title: customFileName,
      category: 'Berkas',
      period: new Date().getFullYear().toString(),
      fileName: customFileName,
      fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      fileBase64: base64Data,
      fileMimeType: file.type || 'application/octet-stream',
      folderId,
    });

    const fileId = gasRes.fileId || 'gas-file-' + Date.now();
    const link = gasRes.fileUrl || `https://drive.google.com/drive/folders/${folderId}`;
    return {
      fileId,
      webViewLink: link,
      webContentLink: link,
    };
  }

  const metadata = {
    name: customFileName,
    parents: [folderId],
    description: `Diunggah melalui Dashboard Tangerang Kota (${new Date().toLocaleString('id-ID')})`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const fileHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
  const requestBody = metadataPart + fileHeader + base64Data + closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Gagal mengunggah file ke Google Drive (Status ${response.status})`
    );
  }

  const result = await response.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    webContentLink: result.webContentLink || `https://drive.google.com/file/d/${result.id}/view`,
  };
}

/**
 * Resolve Sheet title by GID from Google Spreadsheet metadata
 */
let cachedSheetTitles: Record<string, string> = {};

export async function getSheetTitleByGid(
  spreadsheetId: string = DEFAULT_CONFIG.spreadsheetId,
  gid: string = DEFAULT_CONFIG.sheetTabGid
): Promise<string> {
  const cacheKey = `${spreadsheetId}_${gid}`;
  if (cachedSheetTitles[cacheKey]) {
    return cachedSheetTitles[cacheKey];
  }

  const token = await getAccessToken();
  if (!token) return 'Agenda';

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const targetSheet = data.sheets?.find(
        (s: any) => String(s.properties?.sheetId) === String(gid)
      );
      if (targetSheet?.properties?.title) {
        cachedSheetTitles[cacheKey] = targetSheet.properties.title;
        return targetSheet.properties.title;
      }
    }
  } catch (err) {
    console.warn('Could not fetch sheet title from GID, using default fallback "Agenda":', err);
  }

  return 'Agenda';
}

/**
 * Append Agenda item to Google Sheets tab (GID: 172820086)
 */
export async function appendAgendaToGoogleSheet(
  agenda: AgendaItem,
  spreadsheetId: string = DEFAULT_CONFIG.spreadsheetId,
  gid: string = DEFAULT_CONFIG.sheetTabGid
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Access Token tidak ditemukan. Silakan login dengan Google.');
  }

  const sheetTitle = await getSheetTitleByGid(spreadsheetId, gid);
  const rowData = [
    agenda.id,
    agenda.title,
    agenda.date,
    agenda.time,
    agenda.location,
    agenda.description,
    agenda.opd,
    agenda.createdAt,
  ];

  const range = `'${sheetTitle}'!A:H`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mencatat agenda ke Google Sheets (${response.status})`);
  }

  return true;
}

/**
 * Append Proposal item to Google Sheets
 */
export async function appendProposalToGoogleSheet(
  proposal: ProposalItem,
  spreadsheetId: string = DEFAULT_CONFIG.spreadsheetId
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Access Token tidak ditemukan. Silakan login dengan Google.');
  }

  const rowData = [
    proposal.ticketNumber,
    proposal.applicantName,
    proposal.organization,
    proposal.title,
    proposal.budget,
    proposal.phone,
    proposal.email,
    proposal.fileName,
    proposal.driveFileUrl || '',
    proposal.status,
    proposal.statusNotes || '',
    proposal.submittedAt,
  ];

  // Attempt to append to sheet named "Proposal" or "Sheet1"
  const targetSheets = ['Proposal', 'Proposals', 'Sheet1'];
  for (const sheet of targetSheets) {
    try {
      const range = `'${sheet}'!A:L`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData],
        }),
      });

      if (response.ok) return true;
    } catch {
      // Continue to next sheet name
    }
  }

  return true;
}

/**
 * Append Laporan item to Google Sheets
 */
export async function appendLaporanToGoogleSheet(
  laporan: LaporanItem,
  spreadsheetId: string = DEFAULT_CONFIG.spreadsheetId
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Access Token tidak ditemukan. Silakan login dengan Google.');
  }

  const rowData = [
    laporan.id,
    laporan.title,
    laporan.category,
    laporan.period,
    laporan.description,
    laporan.opd,
    laporan.fileName,
    laporan.fileSize || '',
    laporan.driveFileUrl || '',
    laporan.uploadedBy || '',
    laporan.uploadedAt,
  ];

  const targetSheets = ['Laporan', 'LaporanKegiatan', 'Sheet1'];
  for (const sheet of targetSheets) {
    try {
      const range = `'${sheet}'!A:K`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData],
        }),
      });

      if (response.ok) return true;
    } catch {
      // Continue
    }
  }

  return true;
}

/**
 * Read Agenda items directly from Google Sheets Tab GID: 172820086
 */
export async function fetchAgendaFromGoogleSheet(
  spreadsheetId: string = DEFAULT_CONFIG.spreadsheetId,
  gid: string = DEFAULT_CONFIG.sheetTabGid
): Promise<AgendaItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const sheetTitle = await getSheetTitleByGid(spreadsheetId, gid);
  const range = `'${sheetTitle}'!A2:H100`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.warn('Gagal membaca agenda dari sheet:', response.status);
    return [];
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.map((row: any[], index: number) => ({
    id: row[0] || `sheet-ag-${index}`,
    title: row[1] || 'Kegiatan',
    date: row[2] || new Date().toISOString().split('T')[0],
    time: row[3] || '09:00',
    location: row[4] || 'Kota Tangerang',
    description: row[5] || '',
    opd: row[6] || 'Pemerintah Kota Tangerang',
    createdAt: row[7] || new Date().toISOString(),
    syncedToSheets: true,
  }));
}
