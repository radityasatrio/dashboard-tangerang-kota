/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT BACKEND - DASHBOARD TANGERANG KOTA
 * Terintegrasi Google Drive & Google Sheets
 * 
 * Konfigurasi:
 * - Google Spreadsheet ID: 1NkJikjEDdJf6EG_t85ynGr-L6B4HvXOml_J-GihJrzM
 * - Sheet Tab GID (Agenda): 172820086
 * - Google Drive Target Folder ID: 1HvlJnpjhDuzxwyRGFMYtu2h1DWHyblmr
 * =========================================================================================
 */

const CONFIG = {
  SPREADSHEET_ID: "1NkJikjEDdJf6EG_t85ynGr-L6B4HvXOml_J-GihJrzM",
  AGENDA_GID: 172820086,
  DRIVE_FOLDER_ID: "1HvlJnpjhDuzxwyRGFMYtu2h1DWHyblmr",
  SHEET_NAMES: {
    AGENDA: "Agenda",
    PROPOSAL: "Proposal",
    LAPORAN: "Laporan"
  }
};

/**
 * Handle HTTP GET Requests:
 * - action=get_agenda: Mengambil data kalender agenda
 * - action=search_proposal: Mencari status proposal berdasarkan keyword / tiket / nama
 * - action=get_laporan: Mengambil data laporan dengan filter lanjutan (category, period, keyword)
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || "get_agenda";
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    let result = { success: true, timestamp: new Date().toISOString() };

    if (action === "get_agenda") {
      const sheet = getSheetByGid(ss, CONFIG.AGENDA_GID) || ss.getSheetByName(CONFIG.SHEET_NAMES.AGENDA);
      if (!sheet) {
        return createJsonResponse({ success: false, message: "Sheet Agenda tidak ditemukan" });
      }
      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1); // skip header
      const agendaList = rows.map(function(r) {
        return {
          id: r[0],
          title: r[1],
          date: Utilities.formatDate(new Date(r[2]), "GMT+7", "yyyy-MM-dd"),
          time: r[3],
          location: r[4],
          description: r[5],
          opd: r[6],
          createdAt: r[7]
        };
      });
      result.data = agendaList;

    } else if (action === "search_proposal") {
      const query = (params.q || "").toLowerCase().trim();
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PROPOSAL);
      if (!sheet) {
        result.data = [];
      } else {
        const rows = sheet.getDataRange().getValues().slice(1);
        const matches = rows.filter(function(r) {
          const ticket = String(r[0] || "").toLowerCase();
          const name = String(r[1] || "").toLowerCase();
          const org = String(r[2] || "").toLowerCase();
          return ticket.includes(query) || name.includes(query) || org.includes(query);
        }).map(function(r) {
          return {
            ticketNumber: r[0],
            applicantName: r[1],
            organization: r[2],
            title: r[3],
            budget: r[4],
            phone: r[5],
            email: r[6],
            fileName: r[7],
            driveFileUrl: r[8],
            status: r[9],
            statusNotes: r[10],
            submittedAt: r[11]
          };
        });
        result.data = matches;
      }

    } else if (action === "get_laporan") {
      // Enhanced Search and Filtering for Laporan module
      const categoryFilter = (params.category || "").trim();
      const keywordFilter = (params.q || "").toLowerCase().trim();
      const startDate = params.startDate ? new Date(params.startDate) : null;
      const endDate = params.endDate ? new Date(params.endDate) : null;

      const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LAPORAN);
      if (!sheet) {
        result.data = [];
      } else {
        const rows = sheet.getDataRange().getValues().slice(1);
        const filtered = rows.filter(function(r) {
          const title = String(r[1] || "").toLowerCase();
          const category = String(r[2] || "").trim();
          const desc = String(r[4] || "").toLowerCase();
          const opd = String(r[5] || "").toLowerCase();
          const uploadedAt = r[10] ? new Date(r[10]) : null;

          // Keyword check in title, description, or OPD
          if (keywordFilter && !title.includes(keywordFilter) && !desc.includes(keywordFilter) && !opd.includes(keywordFilter)) {
            return false;
          }
          // Category check
          if (categoryFilter && categoryFilter !== "Semua" && category !== categoryFilter) {
            return false;
          }
          // Date range check
          if (startDate && uploadedAt && uploadedAt < startDate) {
            return false;
          }
          if (endDate && uploadedAt && uploadedAt > endDate) {
            return false;
          }
          return true;
        }).map(function(r) {
          return {
            id: r[0],
            title: r[1],
            category: r[2],
            period: r[3],
            description: r[4],
            opd: r[5],
            fileName: r[6],
            fileSize: r[7],
            driveFileUrl: r[8],
            uploadedBy: r[9],
            uploadedAt: r[10]
          };
        });
        result.data = filtered;
      }
    } else {
      result = { success: false, message: "Aksi tidak dikenali: " + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle HTTP POST Requests:
 * - action=add_agenda: Simpan agenda baru ke sheet
 * - action=submit_proposal: Upload berkas ke Drive dan catat metadata proposal ke sheet
 * - action=upload_laporan: Upload berkas ke Drive dan catat metadata laporan ke sheet
 * - action=update_proposal_status: Perbarui status & catatan proposal
 */
function doPost(e) {
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter || {};
    }

    const action = payload.action;
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const driveFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);

    if (action === "add_agenda") {
      const sheet = getSheetByGid(ss, CONFIG.AGENDA_GID) || getOrCreateSheet(ss, CONFIG.SHEET_NAMES.AGENDA, [
        "ID", "Judul Kegiatan", "Tanggal", "Waktu", "Lokasi", "Deskripsi", "OPD", "Dibuat Pada"
      ]);
      
      const newRow = [
        payload.id || Utilities.getUuid(),
        payload.title || "",
        payload.date || "",
        payload.time || "",
        payload.location || "",
        payload.description || "",
        payload.opd || "",
        new Date().toISOString()
      ];
      sheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        message: "Agenda berhasil dicatat ke Google Sheets",
        id: newRow[0]
      });

    } else if (action === "submit_proposal") {
      // 1. Upload berkas base64 ke Google Drive Folder
      let fileUrl = "";
      let fileId = "";
      if (payload.fileBase64 && payload.fileName) {
        const decoded = Utilities.base64Decode(payload.fileBase64);
        const mimeType = payload.fileMimeType || "application/pdf";
        const blob = Utilities.newBlob(decoded, mimeType, payload.fileName);
        const file = driveFolder.createFile(blob);
        fileId = file.getId();
        fileUrl = file.getUrl();
      }

      // 2. Simpan metadata proposal ke sheet
      const sheet = getOrCreateSheet(ss, CONFIG.SHEET_NAMES.PROPOSAL, [
        "No. Tiket", "Nama Pemohon", "Instansi/Lembaga", "Judul Proposal", 
        "Estimasi Anggaran", "Kontak", "Email", "Nama Berkas", "Link Drive", 
        "Status", "Catatan Verifikator", "Tanggal Pengajuan"
      ]);

      const ticketNumber = payload.ticketNumber || generateTicketNumber();
      const newRow = [
        ticketNumber,
        payload.applicantName || "",
        payload.organization || "",
        payload.title || "",
        payload.budget || 0,
        payload.phone || "",
        payload.email || "",
        payload.fileName || "",
        fileUrl,
        payload.status || "Antrean",
        payload.statusNotes || "Tiket baru diterbitkan.",
        new Date().toISOString()
      ];
      sheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        message: "Proposal berhasil diajukan dan diunggah ke Google Drive",
        ticketNumber: ticketNumber,
        driveFileUrl: fileUrl,
        driveFileId: fileId
      });

    } else if (action === "upload_laporan") {
      // 1. Upload laporan ke Google Drive Folder
      let fileUrl = "";
      let fileId = "";
      if (payload.fileBase64 && payload.fileName) {
        const decoded = Utilities.base64Decode(payload.fileBase64);
        const mimeType = payload.fileMimeType || "application/pdf";
        const blob = Utilities.newBlob(decoded, mimeType, payload.fileName);
        const file = driveFolder.createFile(blob);
        fileId = file.getId();
        fileUrl = file.getUrl();
      }

      // 2. Simpan metadata laporan ke sheet
      const sheet = getOrCreateSheet(ss, CONFIG.SHEET_NAMES.LAPORAN, [
        "ID Laporan", "Judul Laporan", "Kategori", "Periode", "Keterangan", 
        "OPD", "Nama Berkas", "Ukuran Berkas", "Link Drive", "Pengunggah", "Waktu Unggah"
      ]);

      const reportId = payload.id || Utilities.getUuid();
      const newRow = [
        reportId,
        payload.title || "",
        payload.category || "Lainnya",
        payload.period || "",
        payload.description || "",
        payload.opd || "",
        payload.fileName || "",
        payload.fileSize || "",
        fileUrl,
        payload.uploadedBy || "",
        new Date().toISOString()
      ];
      sheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        message: "Laporan berhasil diunggah ke Google Drive dan dicatat ke Spreadsheet",
        id: reportId,
        driveFileUrl: fileUrl,
        driveFileId: fileId
      });

    } else if (action === "update_proposal_status") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PROPOSAL);
      if (!sheet) {
        return createJsonResponse({ success: false, message: "Sheet Proposal belum dibuat" });
      }
      const data = sheet.getDataRange().getValues();
      const ticketToFind = payload.ticketNumber;
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === ticketToFind) {
          foundIndex = i + 1; // 1-indexed row in GAS
          break;
        }
      }
      if (foundIndex === -1) {
        return createJsonResponse({ success: false, message: "Proposal tidak ditemukan" });
      }

      // Update Column 10 (Status) and Column 11 (Catatan Verifikator)
      if (payload.status) sheet.getRange(foundIndex, 10).setValue(payload.status);
      if (payload.statusNotes) sheet.getRange(foundIndex, 11).setValue(payload.statusNotes);

      return createJsonResponse({
        success: true,
        message: "Status proposal berhasil diperbarui"
      });
    }

    return createJsonResponse({ success: false, message: "Aksi tidak dikenali: " + action });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Helper mencari sheet berdasarkan GID numerik
 */
function getSheetByGid(spreadsheet, targetGid) {
  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === targetGid) {
      return sheets[i];
    }
  }
  return null;
}

/**
 * Helper membuat atau mengambil sheet dengan header otomatis
 */
function getOrCreateSheet(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0F4C81").setFontColor("#FFFFFF");
    }
  }
  return sheet;
}

/**
 * Generate Format Tiket Unik: PRP-YYYYMMDD-XXXX
 */
function generateTicketNumber() {
  const dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return "PRP-" + dateStr + "-" + randomSuffix;
}

/**
 * Format response JSON with CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
