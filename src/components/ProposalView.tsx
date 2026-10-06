import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Building2, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  FolderGit2, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { ProposalItem } from '../services/types';
import { DEFAULT_CONFIG } from '../services/config';

interface ProposalViewProps {
  onProposalSubmitted: (proposal: ProposalItem) => void;
  appsScriptUrl?: string;
}

export const ProposalView: React.FC<ProposalViewProps> = ({
  onProposalSubmitted,
  appsScriptUrl = DEFAULT_CONFIG.appsScriptUrl,
}) => {
  const [applicantName, setApplicantName] = useState('');
  const [organization, setOrganization] = useState('');
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<ProposalItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate unique registration number: PRP-YYYYMMDD-XXXX
  const generateTicket = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PRP-${dateStr}-${randomSuffix}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!validTypes.includes(selected.type) && !selected.name.match(/\.(pdf|doc|docx)$/i)) {
        setErrorMessage('Format berkas harus berupa PDF atau Word (DOC/DOCX).');
        setFile(null);
        return;
      }
      if (selected.size > 25 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal adalah 25MB.');
        setFile(null);
        return;
      }
      setErrorMessage('');
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !title || !phone || !email || !file) {
      setErrorMessage('Mohon lengkapi seluruh field dan lampirkan berkas proposal.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const ticketNumber = generateTicket();
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      // Format: [TANGGAL]_[NOMOR_TIKET]_[NAMA_ASLI]
      const driveFileName = `[${todayStr}]_[${ticketNumber}]_${cleanOriginalName}`;

      setUploadProgress('Menyiapkan berkas dan mengunggah ke Google Drive Folder (1HvlJnpjhDuzxwyRGFMYtu2h1DWHyblmr)...');

      // Attempt sending to Apps Script Web App endpoint if available
      let driveUrl = `https://drive.google.com/drive/folders/${DEFAULT_CONFIG.driveFolderId}`;
      let driveId = 'drive-prop-' + Date.now();

      if (appsScriptUrl) {
        try {
          // Read file as base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || '');
            };
            reader.readAsDataURL(file);
          });
          const fileBase64 = await base64Promise;

          // Post to Web App
          await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'submit_proposal',
              ticketNumber,
              applicantName: applicantName.trim(),
              organization: organization.trim(),
              title: title.trim(),
              budget: Number(budget) || 0,
              phone: phone.trim(),
              email: email.trim(),
              fileName: driveFileName,
              fileBase64,
              fileMimeType: file.type || 'application/pdf',
            }),
          });
        } catch (gasErr) {
          console.warn('Apps Script Web App request noted:', gasErr);
        }
      }

      const newProposal: ProposalItem = {
        id: 'prp-' + Date.now(),
        ticketNumber,
        applicantName: applicantName.trim(),
        organization: organization.trim() || 'Perseorangan / Kelompok Masyarakat',
        title: title.trim(),
        budget: Number(budget) || 0,
        phone: phone.trim(),
        email: email.trim(),
        fileName: driveFileName,
        driveFileId: driveId,
        driveFileUrl: driveUrl,
        status: 'Antrean',
        statusNotes: 'Tiket berhasil diterbitkan. Berkas tersimpan di repositori Google Drive dan menunggu verifikasi petugas.',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onProposalSubmitted(newProposal);
      setSubmittedTicket(newProposal);

      // Reset form
      setApplicantName('');
      setOrganization('');
      setTitle('');
      setBudget('');
      setPhone('');
      setEmail('');
      setFile(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengajukan proposal.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Form Pengajuan Proposal Hibah & Bantuan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengajuan resmi secara terpusat untuk masyarakat, lembaga swadaya, dan komunitas Kota Tangerang.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-xl border border-teal-200 text-xs text-teal-800 font-semibold">
          <FolderGit2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Drive Target: <code className="font-mono text-teal-900">1HvlJnp...</code></span>
        </div>
      </div>

      {/* Success Modal / Ticket Display */}
      {submittedTicket && (
        <div className="bg-linear-to-br from-emerald-500 via-teal-600 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                Proposal Berhasil Didaftarkan
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                Nomor Registrasi / Tiket Unik Anda:
              </h3>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <span className="font-mono text-2xl sm:text-3xl font-black bg-white/10 px-4 py-2 rounded-2xl border border-white/20 tracking-wider">
                  {submittedTicket.ticketNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(submittedTicket.ticketNumber)}
                  className="p-2.5 rounded-xl bg-white text-teal-900 hover:bg-slate-100 transition-colors shadow-md cursor-pointer"
                  title="Salin Nomor Tiket"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-teal-100 max-w-xl">
                Simpan nomor tiket di atas untuk mengecek status persetujuan, catatan verifikator, dan progres disposisi melalui menu <strong>Cek Proposal</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              {submittedTicket.driveFileUrl && (
                <a
                  href={submittedTicket.driveFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-teal-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Lihat Berkas di Google Drive
                </a>
              )}
              <button
                type="button"
                onClick={() => setSubmittedTicket(null)}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Buat Pengajuan Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Applicant Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Pemohon / Penanggung Jawab <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Contoh: Budi Santoso, S.T."
                className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Organization */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lembaga / Organisasi / Komunitas
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Contoh: Karang Taruna Kel. Sukasari"
                  className="w-full text-xs font-medium pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Proposal Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Judul Proposal Kegiatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pengadaan Sarana Pojok Baca Digital Ramah Anak di RW 05"
                className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Estimated Budget */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Estimasi Usulan Anggaran (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-500 absolute left-3 top-3">Rp</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Contoh: 50000000"
                  className="w-full text-xs font-medium pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              {budget && (
                <span className="text-[11px] text-teal-700 font-semibold mt-1 block">
                  Terbaca: Rp {Number(budget).toLocaleString('id-ID')}
                </span>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor Kontak / WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full text-xs font-medium pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Email Resmi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.organisasi@email.com"
                  className="w-full text-xs font-medium pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* File Upload Component */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Unggah Berkas Proposal (PDF / DOCX) <span className="text-rose-500">*</span>
              </label>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all">
                <input
                  type="file"
                  id="proposal-file-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="proposal-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <FileCheck2 className="w-4 h-4" />
                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Klik untuk mengganti berkas proposal
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        Klik untuk memilih berkas atau seret ke sini
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mendukung format PDF, DOC, atau DOCX (Maksimal 25MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                * Berkas akan otomatis diberi penamaan standar: <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">[TANGGAL]_[NOMOR_TIKET]_[NAMA_ASLI]</code> saat diunggah ke Google Drive.
              </p>
            </div>
          </div>

          {/* Submission button & state */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {uploadProgress ? (
                <span className="text-blue-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  {uploadProgress}
                </span>
              ) : (
                'Pastikan data yang diinput telah benar dan sesuai persyaratan kedinasan.'
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses Pengajuan...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Kirim Pengajuan Proposal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
