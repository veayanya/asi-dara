// utils/htmlBackupGenerator.js
// Generator Berkas Cadangan (.html) Interaktif & Mandiri
// Memuat Data INPUT Dokumen & Data OUTPUT Hasil Analisis AI / SROI
// Mendukung Ekspor untuk Semua Role (User, Moderator, Admin) serta Pemulihan Sistem (Restore)

import { computeSroi16Rules, cleanOpdName } from '@/composables/useAnalysis';

/**
 * Format angka ke Rupiah
 */
function formatRupiah(val) {
 if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
 return 'Rp ' + Math.round(Number(val)).toLocaleString('id-ID');
}

/**
 * Format tanggal ke format lokal Indonesia
 */
function formatDateIndo(dateStr) {
 if (!dateStr) return '-';
 try {
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return String(dateStr);
 return d.toLocaleDateString('id-ID', {
 day: 'numeric',
 month: 'long',
 year: 'numeric',
 hour: '2-digit',
 minute: '2-digit'
 }) + ' WIB';
 } catch {
 return String(dateStr);
 }
}

/**
 * Escape HTML untuk pencegahan XSS saat menampilkan string teks
 */
function escapeHtml(str) {
 if (str === null || str === undefined) return '';
 return String(str)
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&#039;');
}

/**
 * Generate string berkas HTML lengkap dari data cadangan
 * @param {Object} backupPayload Payload JSON dari backend (/export-user atau /export-full)
 * @param {Boolean} isFullBackup Apakah ekspor penuh sistem (Admin/Moderator)
 */
export function generateHtmlBackup(backupPayload, isFullBackup = false) {
 if (!backupPayload) return '';

 const exportedAt = backupPayload.exportedAt || new Date().toISOString();
 const exportedBy = backupPayload.exportedBy || backupPayload.user || { name: 'Pengguna Sistem', role: 'user', username: 'user' };
 const roleTitle = (exportedBy.role || 'user').toUpperCase();

 // Dapatkan daftar dokumen RKA
 const rkis = backupPayload.rkis || backupPayload.data?.main_db?.rkis || [];

 // Hitung metrik ringkasan eksekutif
 let totalPagu = 0;
 let totalNetImpact = 0;
 let totalPvImpact = 0;
 let sumSroi = 0;
 let countValidSroi = 0;
 let countLayak = 0;
 let countCukup = 0;
 let countKurang = 0;
 let countBelumDinilai = 0;

 const analyzedDocs = rkis.map(doc => {
 const calc = computeSroi16Rules(doc);
 const pagu = Number(doc.pagu || calc.valueOfInputs || 0);
 totalPagu += pagu;
 totalNetImpact += Number(calc.netImpact || 0);
 totalPvImpact += Number(calc.pvImpact || 0);

 if (calc.isValid && !isNaN(calc.sroiRatio)) {
 sumSroi += calc.sroiRatio;
 countValidSroi++;
 if (calc.sroiRatio >= 1.0) countLayak++;
 else if (calc.sroiRatio >= 0.6) countCukup++;
 else countKurang++;
 } else {
 countBelumDinilai++;
 }

 return {
 raw: doc,
 calc
 };
 });

 const avgSroi = countValidSroi > 0 ? (sumSroi / countValidSroi).toFixed(2) : '—';

 // Persiapkan JSON aman untuk disematkan di dalam tag <script>
 const safeJsonString = JSON.stringify(backupPayload).replace(/<\/script>/gi, '<\\/script>');

 // Data tambahan untuk Full Backup
 const usersList = backupPayload.data?.users_db?.users || [];
 const logsList = backupPayload.data?.activity_logs?.logs || [];
 const sshDatabases = backupPayload.data?.main_db?.ssh_databases || [];

 return `<!DOCTYPE html>
<html lang="id">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Cadangan Data RKA &amp; Hasil Analisis SROI — BAPPERIDA Kab. Cirebon</title>
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
 <style>
 :root {
 --primary: #0E6B5E;
 --primary-dark: #07453C;
 --primary-light: #E6F5F2;
 --accent: #2FC98E;
 --bg-body: #F8FAFC;
 --bg-card: #FFFFFF;
 --border-color: #E2E8F0;
 --border-subtle: #EDF2F7;
 --text-main: #0F172A;
 --text-muted: #64748B;
 --text-light: #94A3B8;
 --tone-green-bg: #ECFDF5;
 --tone-green-text: #065F46;
 --tone-green-border: #A7F3D0;
 --tone-yellow-bg: #FFFBEB;
 --tone-yellow-text: #92400E;
 --tone-yellow-border: #FDE68A;
 --tone-red-bg: #FEF2F2;
 --tone-red-text: #991B1B;
 --tone-red-border: #FECACA;
 --tone-gray-bg: #F1F5F9;
 --tone-gray-text: #475569;
 --tone-gray-border: #CBD5E1;
 --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
 --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
 --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
 --radius: 12px;
 }

 * {
 box-sizing: border-box;
 margin: 0;
 padding: 0;
 }

 body {
 font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
 background-color: var(--bg-body);
 color: var(--text-main);
 line-height: 1.6;
 padding: 24px 16px;
 -webkit-font-smoothing: antialiased;
 }

 .container {
 max-width: 1280px;
 margin: 0 auto;
 }

 /* ── HEADER BANNER ── */
 .header-card {
 background: linear-gradient(135deg, #094038 0%, #0E6B5E 55%, #148071 100%);
 color: #FFFFFF;
 border-radius: var(--radius);
 padding: 32px 28px;
 margin-bottom: 24px;
 box-shadow: var(--shadow-lg);
 position: relative;
 overflow: hidden;
 }

 .header-card::after {
 content: '';
 position: absolute;
 right: -60px;
 top: -60px;
 width: 260px;
 height: 260px;
 background: radial-gradient(circle, rgba(47, 201, 142, 0.25) 0%, rgba(255,255,255,0) 70%);
 border-radius: 50%;
 pointer-events: none;
 }

 .header-top {
 display: flex;
 justify-content: space-between;
 align-items: flex-start;
 flex-wrap: wrap;
 gap: 16px;
 }

 .header-title-wrap h1 {
 font-size: 26px;
 font-weight: 800;
 letter-spacing: -0.02em;
 margin-bottom: 6px;
 display: flex;
 align-items: center;
 gap: 10px;
 }

 .header-title-wrap p {
 font-size: 14px;
 color: #D1FAE5;
 max-width: 700px;
 }

 .header-badge {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 background: rgba(255, 255, 255, 0.15);
 border: 1px solid rgba(255, 255, 255, 0.25);
 backdrop-filter: blur(8px);
 padding: 6px 14px;
 border-radius: 9999px;
 font-size: 12px;
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.05em;
 }

 .header-actions {
 display: flex;
 gap: 10px;
 flex-wrap: wrap;
 margin-top: 20px;
 padding-top: 18px;
 border-top: 1px solid rgba(255, 255, 255, 0.2);
 }

 .btn-action {
 background: #FFFFFF;
 color: var(--primary-dark);
 border: none;
 padding: 9px 18px;
 border-radius: 8px;
 font-size: 13px;
 font-weight: 700;
 cursor: pointer;
 display: inline-flex;
 align-items: center;
 gap: 8px;
 transition: all 0.2s ease;
 box-shadow: var(--shadow-sm);
 text-decoration: none;
 }

 .btn-action:hover {
 background: #F0FDF4;
 transform: translateY(-1px);
 box-shadow: var(--shadow-md);
 }

 .btn-action-outline {
 background: rgba(255, 255, 255, 0.12);
 color: #FFFFFF;
 border: 1px solid rgba(255, 255, 255, 0.3);
 }

 .btn-action-outline:hover {
 background: rgba(255, 255, 255, 0.22);
 color: #FFFFFF;
 }

 .header-meta-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
 gap: 16px;
 margin-top: 20px;
 background: rgba(0, 0, 0, 0.15);
 padding: 14px 18px;
 border-radius: 8px;
 }

 .meta-item small {
 display: block;
 font-size: 11px;
 text-transform: uppercase;
 letter-spacing: 0.05em;
 color: #A7F3D0;
 }

 .meta-item strong {
 font-size: 13px;
 font-weight: 600;
 color: #FFFFFF;
 }

 /* ── KPI METRICS CARDS ── */
 .kpi-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
 gap: 16px;
 margin-bottom: 24px;
 }

 .kpi-card {
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: var(--radius);
 padding: 20px;
 box-shadow: var(--shadow-sm);
 display: flex;
 flex-direction: column;
 justify-content: space-between;
 }

 .kpi-label {
 font-size: 12px;
 font-weight: 600;
 color: var(--text-muted);
 text-transform: uppercase;
 letter-spacing: 0.04em;
 margin-bottom: 8px;
 display: flex;
 align-items: center;
 gap: 6px;
 }

 .kpi-val {
 font-size: 24px;
 font-weight: 800;
 color: var(--primary-dark);
 letter-spacing: -0.02em;
 }

 .kpi-sub {
 font-size: 12px;
 color: var(--text-muted);
 margin-top: 6px;
 }

 /* ── TOOLBAR & SEARCH ── */
 .toolbar-card {
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: var(--radius);
 padding: 16px 20px;
 margin-bottom: 24px;
 display: flex;
 flex-wrap: wrap;
 justify-content: space-between;
 align-items: center;
 gap: 16px;
 box-shadow: var(--shadow-sm);
 }

 .search-box {
 flex: 1;
 min-width: 280px;
 position: relative;
 }

 .search-input {
 width: 100%;
 padding: 10px 14px 10px 40px;
 border: 1.5px solid var(--border-color);
 border-radius: 8px;
 font-size: 13.5px;
 font-family: inherit;
 color: var(--text-main);
 background: #F8FAFC;
 transition: all 0.2s ease;
 }

 .search-input:focus {
 outline: none;
 border-color: var(--primary);
 background: #FFFFFF;
 box-shadow: 0 0 0 3px rgba(14, 107, 94, 0.12);
 }

 .search-icon {
 position: absolute;
 left: 12px;
 top: 50%;
 transform: translateY(-50%);
 color: var(--text-muted);
 pointer-events: none;
 }

 .filter-pills {
 display: flex;
 gap: 8px;
 flex-wrap: wrap;
 }

 .pill-btn {
 background: var(--bg-body);
 border: 1px solid var(--border-color);
 color: var(--text-muted);
 padding: 6px 14px;
 border-radius: 9999px;
 font-size: 12px;
 font-weight: 600;
 cursor: pointer;
 transition: all 0.15s ease;
 }

 .pill-btn:hover, .pill-btn.active {
 background: var(--primary);
 color: #FFFFFF;
 border-color: var(--primary);
 }

 /* ── DOKUMEN RKA CARDS ── */
 .docs-container {
 display: flex;
 flex-direction: column;
 gap: 20px;
 }

 .doc-card {
 background: var(--bg-card);
 border: 1.5px solid var(--border-color);
 border-radius: var(--radius);
 box-shadow: var(--shadow-sm);
 overflow: hidden;
 transition: border-color 0.2s ease, box-shadow 0.2s ease;
 }

 .doc-card:hover {
 box-shadow: var(--shadow-md);
 border-color: #CBD5E1;
 }

 .doc-header {
 padding: 18px 24px;
 background: #FFFFFF;
 cursor: pointer;
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 16px;
 user-select: none;
 border-bottom: 1px solid transparent;
 transition: background 0.15s ease;
 }

 .doc-card.is-open .doc-header {
 background: #F8FAFC;
 border-bottom-color: var(--border-color);
 }

 .doc-header-left {
 display: flex;
 align-items: center;
 gap: 14px;
 flex: 1;
 min-width: 0;
 }

 .doc-index {
 font-size: 12px;
 font-weight: 700;
 color: var(--text-muted);
 background: #F1F5F9;
 padding: 4px 8px;
 border-radius: 6px;
 flex-shrink: 0;
 }

 .doc-titles {
 min-width: 0;
 }

 .doc-title {
 font-size: 15px;
 font-weight: 700;
 color: var(--text-main);
 white-space: nowrap;
 overflow: hidden;
 text-overflow: ellipsis;
 margin-bottom: 4px;
 }

 .doc-opd-sub {
 font-size: 12.5px;
 color: var(--text-muted);
 display: flex;
 align-items: center;
 gap: 8px;
 flex-wrap: wrap;
 }

 .doc-header-right {
 display: flex;
 align-items: center;
 gap: 14px;
 flex-shrink: 0;
 }

 .pagu-badge {
 font-size: 13px;
 font-weight: 700;
 color: var(--primary-dark);
 background: var(--primary-light);
 padding: 5px 12px;
 border-radius: 6px;
 }

 /* ── TONE BADGES ── */
 .tone-badge {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 5px 12px;
 border-radius: 9999px;
 font-size: 12px;
 font-weight: 700;
 border: 1px solid transparent;
 letter-spacing: 0.02em;
 }

 .tone-green {
 background: var(--tone-green-bg);
 color: var(--tone-green-text);
 border-color: var(--tone-green-border);
 }

 .tone-yellow {
 background: var(--tone-yellow-bg);
 color: var(--tone-yellow-text);
 border-color: var(--tone-yellow-border);
 }

 .tone-red {
 background: var(--tone-red-bg);
 color: var(--tone-red-text);
 border-color: var(--tone-red-border);
 }

 .tone-gray {
 background: var(--tone-gray-bg);
 color: var(--tone-gray-text);
 border-color: var(--tone-gray-border);
 }

 .doc-chevron {
 color: var(--text-muted);
 transition: transform 0.2s ease;
 font-size: 12px;
 font-weight: bold;
 }

 .doc-card.is-open .doc-chevron {
 transform: rotate(180deg);
 }

 /* ── DOC BODY (ACCORDION) ── */
 .doc-body {
 display: none;
 padding: 24px;
 }

 .doc-card.is-open .doc-body {
 display: block;
 }

 .section-title {
 font-size: 14px;
 font-weight: 800;
 text-transform: uppercase;
 letter-spacing: 0.05em;
 color: var(--primary);
 margin-bottom: 14px;
 padding-bottom: 6px;
 border-bottom: 2px solid var(--primary-light);
 display: flex;
 align-items: center;
 gap: 8px;
 }

 .sub-section-title {
 font-size: 13px;
 font-weight: 700;
 color: var(--text-main);
 margin: 16px 0 8px 0;
 display: flex;
 align-items: center;
 gap: 6px;
 }

 /* ── INPUT & OUTPUT GRIDS ── */
 .io-split-container {
 display: grid;
 grid-template-columns: 1fr;
 gap: 24px;
 }

 .part-box {
 background: #FFFFFF;
 border: 1px solid var(--border-color);
 border-radius: 10px;
 padding: 20px;
 }

 .part-input {
 border-left: 4px solid #3B82F6;
 }

 .part-output {
 border-left: 4px solid #10B981;
 background: #FAFDFB;
 }

 /* ── KEY-VALUE TABLES ── */
 .kv-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
 gap: 12px;
 margin-bottom: 16px;
 }

 .kv-item {
 background: #F8FAFC;
 border: 1px solid var(--border-subtle);
 border-radius: 8px;
 padding: 10px 14px;
 }

 .kv-label {
 font-size: 11px;
 text-transform: uppercase;
 letter-spacing: 0.04em;
 color: var(--text-muted);
 font-weight: 600;
 margin-bottom: 2px;
 }

 .kv-val {
 font-size: 13px;
 font-weight: 600;
 color: var(--text-main);
 word-break: break-word;
 }

 /* ── TABLES ── */
 .compact-table {
 width: 100%;
 border-collapse: collapse;
 font-size: 12.5px;
 margin-top: 8px;
 background: #FFFFFF;
 border-radius: 8px;
 overflow: hidden;
 border: 1px solid var(--border-color);
 }

 .compact-table th {
 background: #F1F5F9;
 color: var(--text-main);
 font-weight: 700;
 padding: 10px 12px;
 text-align: left;
 border-bottom: 1.5px solid var(--border-color);
 }

 .compact-table td {
 padding: 9px 12px;
 border-bottom: 1px solid var(--border-subtle);
 color: var(--text-main);
 vertical-align: top;
 }

 .compact-table tr:last-child td {
 border-bottom: none;
 }

 .compact-table tr:hover {
 background: #F8FAFC;
 }

 .code-col {
 font-family: 'JetBrains Mono', monospace;
 font-size: 11.5px;
 color: var(--primary-dark);
 font-weight: 600;
 }

 /* ── SROI HIGHLIGHT BOX ── */
 .sroi-highlight-box {
 background: #FFFFFF;
 border: 1.5px solid var(--border-color);
 border-radius: 10px;
 padding: 18px;
 margin-bottom: 16px;
 display: flex;
 flex-wrap: wrap;
 justify-content: space-between;
 align-items: center;
 gap: 16px;
 box-shadow: var(--shadow-sm);
 }

 .sroi-hero {
 display: flex;
 align-items: center;
 gap: 14px;
 }

 .sroi-number {
 font-size: 36px;
 font-weight: 800;
 letter-spacing: -0.03em;
 line-height: 1;
 }

 .sroi-meta h4 {
 font-size: 14px;
 font-weight: 700;
 margin-bottom: 4px;
 }

 .sroi-meta p {
 font-size: 12px;
 color: var(--text-muted);
 max-width: 480px;
 }

 /* ── REKENING EFISIENSI ITEMS ── */
 .efficiency-card {
 border: 1px solid var(--border-color);
 border-radius: 8px;
 padding: 12px 16px;
 margin-bottom: 8px;
 background: #FFFFFF;
 }

 .eff-head {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 10px;
 flex-wrap: wrap;
 margin-bottom: 4px;
 }

 .eff-name {
 font-size: 13px;
 font-weight: 700;
 color: var(--text-main);
 }

 .eff-desc {
 font-size: 12px;
 color: var(--text-muted);
 line-height: 1.5;
 }

 .eff-recom {
 margin-top: 6px;
 font-size: 12px;
 color: #991B1B;
 background: #FEF2F2;
 padding: 6px 10px;
 border-radius: 6px;
 border-left: 3px solid #EF4444;
 font-weight: 500;
 }

 /* ── FULL BACKUP SYSTEM EXTRA TABLES ── */
 .system-section {
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: var(--radius);
 padding: 24px;
 margin-top: 28px;
 box-shadow: var(--shadow-sm);
 }

 /* ── FOOTER ── */
 .backup-footer {
 text-align: center;
 margin-top: 40px;
 padding-top: 20px;
 border-top: 1px solid var(--border-color);
 font-size: 12px;
 color: var(--text-muted);
 }

 /* ── PRINT STYLES ── */
 @media print {
 body {
 background: #FFFFFF;
 padding: 0;
 font-size: 11pt;
 }
 .header-actions, .toolbar-card, .btn-action, .backup-footer button {
 display: none !important;
 }
 .doc-body {
 display: block !important;
 }
 .doc-card {
 page-break-inside: avoid;
 border: 1px solid #CCC !important;
 margin-bottom: 18px;
 }
 .header-card {
 box-shadow: none;
 border: 1px solid #CCC;
 background: #0E6B5E !important;
 -webkit-print-color-adjust: exact;
 print-color-adjust: exact;
 }
 }
 </style>
</head>
<body>

<div class="container">

 <!-- ══ 1. HEADER BANNER ══════════════════════════════════════════════════ -->
 <header class="header-card">
 <div class="header-top">
 <div class="header-title-wrap">
 <span class="header-badge">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
 ${isFullBackup ? 'Cadangan Penuh Sistem (Full Database)' : 'Cadangan Data RKA Pengguna'}
 </span>
 <h1>BAPPERIDA Kabupaten Cirebon</h1>
 <p>Laporan Cadangan Data RKA &amp; Evaluasi Proyeksi SROI Berbasis Kecerdasan Buatan (SINTRA AI)</p>
 </div>
 </div>

 <div class="header-meta-grid">
 <div class="meta-item">
 <small>Waktu Pembuatan Cadangan</small>
 <strong>${escapeHtml(formatDateIndo(exportedAt))}</strong>
 </div>
 <div class="meta-item">
 <small>Dibuat Oleh</small>
 <strong>${escapeHtml(exportedBy.name || exportedBy.username || 'User')} (${escapeHtml(roleTitle)})</strong>
 </div>
 <div class="meta-item">
 <small>Total Dokumen Tersimpan</small>
 <strong>${rkis.length} Dokumen RKA</strong>
 </div>
 <div class="meta-item">
 <small>Integritas Data</small>
 <strong>100% Siap Dipulihkan (Restoreable)</strong>
 </div>
 </div>

 <div class="header-actions">
 <button class="btn-action" onclick="window.print()">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
 Cetak / Simpan PDF
 </button>
 <button class="btn-action btn-action-outline" onclick="toggleAllDetails()">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>
 <span id="btn-toggle-all-text">Buka Semua Detail</span>
 </button>
 <button class="btn-action btn-action-outline" onclick="exportJsonFromBackup()">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
 Ekspor JSON Mentah
 </button>
 </div>
 </header>

 <!-- ══ 2. KPI METRICS CARDS ═════════════════════════════════════════════ -->
 <section class="kpi-grid">
 <div class="kpi-card">
 <div class="kpi-label">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
 Total Dokumen RKA
 </div>
 <div class="kpi-val">${rkis.length}</div>
 <div class="kpi-sub">${countValidSroi} Dokumen telah dianalisis SROI</div>
 </div>

 <div class="kpi-card">
 <div class="kpi-label">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
 Total Pagu Investasi
 </div>
 <div class="kpi-val">${formatRupiah(totalPagu)}</div>
 <div class="kpi-sub">Akumulasi seluruh pagu belanja program</div>
 </div>

 <div class="kpi-card">
 <div class="kpi-label">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
 Rata-rata Skor SROI
 </div>
 <div class="kpi-val">${avgSroi}</div>
 <div class="kpi-sub">Indeks efektivitas sosial agregat</div>
 </div>

 <div class="kpi-card">
 <div class="kpi-label">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 6 12 12 16 14"></polygon></svg>
 Distribusi Kelayakan
 </div>
 <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
 <span class="tone-badge tone-green" title="SROI ≥ 1.0">${countLayak} Layak</span>
 <span class="tone-badge tone-yellow" title="0.6 ≤ SROI < 1.0">${countCukup} Cukup</span>
 <span class="tone-badge tone-red" title="SROI < 0.6">${countKurang} Kurang</span>
 ${countBelumDinilai > 0 ? `<span class="tone-badge tone-gray">${countBelumDinilai} Belum</span>` : ''}
 </div>
 <div class="kpi-sub" style="margin-top: 8px;">Berdasarkan ambang batas 0,6</div>
 </div>
 </section>

 <!-- ══ 3. TOOLBAR PENCARIAN & FILTER ════════════════════════════════════ -->
 <section class="toolbar-card">
 <div class="search-box">
 <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
 <input type="text" id="searchInput" class="search-input" placeholder="Cari berdasarkan nama dokumen, OPD, program, sub-kegiatan..." oninput="filterDocs()">
 </div>

 <div class="filter-pills">
 <button class="pill-btn active" onclick="filterByTone('all', this)">Semua (${rkis.length})</button>
 <button class="pill-btn" onclick="filterByTone('tone-green', this)">Layak (${countLayak})</button>
 <button class="pill-btn" onclick="filterByTone('tone-yellow', this)">Cukup / Keringanan (${countCukup})</button>
 <button class="pill-btn" onclick="filterByTone('tone-red', this)">Kurang / Evaluasi (${countKurang})</button>
 </div>
 </section>

 <!-- ══ 4. DAFTAR DOKUMEN RKA (INPUT & OUTPUT LENGKAP) ════════════════════ -->
 <main class="docs-container" id="docsContainer">
 ${analyzedDocs.length === 0 ? `
 <div class="part-box" style="text-align: center; padding: 40px;">
 <p style="color: var(--text-muted);">Tidak ada dokumen RKA dalam berkas cadangan ini.</p>
 </div>
 ` : analyzedDocs.map((item, idx) => {
 const doc = item.raw;
 const calc = item.calc;
 const opdClean = cleanOpdName(doc.opd || doc.perangkatDaerah || '-');
 const subKeg = doc.subKegiatan || doc.namaDokumen || `Dokumen RKA #${idx + 1}`;
 const program = doc.namaProgram || doc.program || '-';
 const kegiatan = doc.namaKegiatan || doc.kegiatan || '-';
 const tahun = doc.tahunRencana || doc.tahun || 2027;
 const pagu = Number(doc.pagu || calc.valueOfInputs || 0);
 const indikatorList = Array.isArray(doc.indikatorKinerja) ? doc.indikatorKinerja : [];
 const kesesuaian = doc.kesesuaianAnggaran || null;
 const awalRaw = (doc.rekeningProporsi && doc.rekeningProporsi.length > 0) ? doc.rekeningProporsi : [];
 const reallocs = doc.reallocationJustifications || [];

 // Status efisiensi rekening
 const efficiencyList = awalRaw.map(rek => {
 let status = rek.status;
 let alasan = rek.alasan;

 const matchedRealloc = reallocs.find(r =>
 (r.rekening_nama && r.rekening_nama.toLowerCase().includes(rek.nama.toLowerCase())) ||
 (rek.nama && rek.nama.toLowerCase().includes(r.rekening_nama.toLowerCase()))
 );

 if (!status) {
 if (matchedRealloc) {
 status = matchedRealloc.aksi === 'KURANGI' ? 'Inefisien' : 'Efisien';
 } else {
 status = 'Efisien';
 }
 }

 if (!alasan) {
 if (matchedRealloc) {
 if (matchedRealloc.aksi === 'KURANGI') {
 alasan = matchedRealloc.alasan_dikurangi || 'Item belanja ini terindikasi kurang efisien dan berpotensi diefisienkan.';
 } else {
 alasan = matchedRealloc.alasan_dialokasikan || 'Alokasi anggaran belanja ini dinilai tepat untuk mendukung sasaran utama program.';
 }
 } else {
 if (status === 'Inefisien') {
 alasan = 'Alokasi belanja ini melebihi batas efisiensi operasional atau tidak sepadan dengan keluaran.';
 } else {
 alasan = 'Alokasi anggaran belanja ini dinilai wajar dan berada dalam batas efisiensi standar.';
 }
 }
 }

 return {
 kode: rek.kode || '-',
 nama: rek.nama || 'Belanja',
 persen: rek.persen !== undefined ? Number(rek.persen) : null,
 nilai: rek.nilai !== undefined ? Number(rek.nilai) : null,
 status,
 alasan,
 rekomendasi: matchedRealloc && matchedRealloc.aksi === 'KURANGI' ? {
 kurangi: matchedRealloc.nilai_dikurangi,
 catatan: matchedRealloc.alasan_dikurangi
 } : null
 };
 });

 return `
 <article class="doc-card ${idx === 0 ? 'is-open' : ''}" data-tone="${calc.tone}" data-search="${escapeHtml((subKeg + ' ' + opdClean + ' ' + program + ' ' + kegiatan + ' ' + (doc.namaDokumen || '')).toLowerCase())}">

 <!-- Document Card Header -->
 <div class="doc-header" onclick="toggleDoc(this)">
 <div class="doc-header-left">
 <span class="doc-index">#${idx + 1}</span>
 <div class="doc-titles">
 <div class="doc-title">${escapeHtml(subKeg)}</div>
 <div class="doc-opd-sub">
 <span> ${escapeHtml(opdClean)}</span>
 <span>•</span>
 <span> Tahun Anggaran: ${escapeHtml(tahun)}</span>
 </div>
 </div>
 </div>

 <div class="doc-header-right">
 <span class="pagu-badge">${formatRupiah(pagu)}</span>
 <span class="tone-badge ${calc.tone}">
 ${calc.isValid ? `SROI: ${calc.sroiScore} (${calc.shortLabel})` : 'Belum Dinilai'}
 </span>
 <span class="doc-chevron">▼</span>
 </div>
 </div>

 <!-- Document Card Body -->
 <div class="doc-body">
 <div class="io-split-container">

 <!-- ══ BAGIAN 1: DATA INPUT DOKUMEN ══ -->
 <div class="part-box part-input">
 <div class="section-title">
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>
 Bagian 1: Data Input Dokumen RKA
 </div>

 <div class="kv-grid">
 <div class="kv-item">
 <div class="kv-label">Perangkat Daerah (OPD)</div>
 <div class="kv-val">${escapeHtml(opdClean)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Nama Program</div>
 <div class="kv-val">${escapeHtml(program)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Nama Kegiatan</div>
 <div class="kv-val">${escapeHtml(kegiatan)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Sub Kegiatan (Nomenklatur)</div>
 <div class="kv-val">${escapeHtml(subKeg)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Pagu Anggaran</div>
 <div class="kv-val" style="color: var(--primary);">${formatRupiah(pagu)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Tahun Anggaran</div>
 <div class="kv-val">${escapeHtml(tahun)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Sumber Berkas Dokumen</div>
 <div class="kv-val">${escapeHtml(doc.namaDokumen || 'Unggahan Sistem')} (${escapeHtml(doc.ukuranBerkas || doc.ukuranFile || '-')})</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Tanggal Pengunggahan</div>
 <div class="kv-val">${escapeHtml(formatDateIndo(doc.tanggalUpload))}</div>
 </div>
 </div>

 <!-- Indikator Kinerja Input -->
 <div class="sub-section-title">
 <span></span> Indikator &amp; Target Kinerja (Input RKA)
 </div>
 ${indikatorList.length === 0 ? `
 <p style="font-size: 12.5px; color: var(--text-muted); font-style: italic;">Tidak ada rincian indikator kinerja pada dokumen ini.</p>
 ` : `
 <table class="compact-table">
 <thead>
 <tr>
 <th style="width: 28%;">Level Indikator</th>
 <th>Tolok Ukur Kinerja</th>
 <th style="width: 25%;">Target Kinerja</th>
 </tr>
 </thead>
 <tbody>
 ${indikatorList.map(ind => `
 <tr>
 <td><strong>${escapeHtml(ind.level || '-')}</strong></td>
 <td>${escapeHtml(ind.tolok_ukur || ind.tolokUkur || '-')}</td>
 <td><span style="font-weight: 600; color: var(--primary);">${escapeHtml(ind.target || '-')}</span></td>
 </tr>
 `).join('')}
 </tbody>
 </table>
 `}

 <!-- Rekening Belanja Input -->
 <div class="sub-section-title" style="margin-top: 18px;">
 <span></span> Rincian Komponen Rekening Belanja Awal (Input)
 </div>
 ${awalRaw.length === 0 ? `
 <p style="font-size: 12.5px; color: var(--text-muted); font-style: italic;">Tidak ada rincian rekening belanja pada dokumen ini.</p>
 ` : `
 <table class="compact-table">
 <thead>
 <tr>
 <th style="width: 22%;">Kode Rekening</th>
 <th>Uraian Belanja</th>
 <th style="width: 22%; text-align: right;">Alokasi Pagu (Rp)</th>
 <th style="width: 15%; text-align: right;">Proporsi</th>
 </tr>
 </thead>
 <tbody>
 ${awalRaw.map(rek => `
 <tr>
 <td class="code-col">${escapeHtml(rek.kode || '-')}</td>
 <td>${escapeHtml(rek.nama || 'Belanja')}</td>
 <td style="text-align: right; font-weight: 600;">${rek.nilai ? formatRupiah(rek.nilai) : '-'}</td>
 <td style="text-align: right;">${rek.persen !== undefined ? rek.persen + '%' : '-'}</td>
 </tr>
 `).join('')}
 </tbody>
 </table>
 `}
 </div>

 <!-- ══ BAGIAN 2: DATA OUTPUT HASIL ANALISIS SROI ══ -->
 <div class="part-box part-output">
 <div class="section-title" style="color: #047857; border-bottom-color: #D1FAE5;">
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
 Bagian 2: Hasil Output Analisis AI &amp; Proyeksi SROI
 </div>

 <!-- SROI Score Box -->
 <div class="sroi-highlight-box">
 <div class="sroi-hero">
 <div class="sroi-number" style="color: ${calc.tone === 'tone-green' ? '#059669' : calc.tone === 'tone-yellow' ? '#D97706' : '#DC2626'};">
 ${calc.isValid ? calc.sroiScore : '—'}
 </div>
 <div class="sroi-meta">
 <h4>${escapeHtml(calc.sroiStatus)}</h4>
 <p>${escapeHtml(calc.sroiInterpretation)}</p>
 </div>
 </div>
 <div>
 <span class="tone-badge ${calc.tone}" style="font-size: 13px; padding: 6px 16px;">
 Status: ${escapeHtml(calc.shortLabel)}
 </span>
 </div>
 </div>

 <!-- Nilai Sosial Ekonomi & Parameter 16 Rules -->
 <div class="sub-section-title">
 <span></span> Parameter &amp; Metrik Baku SROI (16 Rules Standard)
 </div>
 <div class="kv-grid">
 <div class="kv-item">
 <div class="kv-label">Nilai Sekarang Dampak</div>
 <div class="kv-val" style="color: #047857;">${formatRupiah(calc.pvImpact)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Net Impact (Dampak Bersih Th 1)</div>
 <div class="kv-val">${formatRupiah(calc.netImpact)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Total Nilai Dampak Awal</div>
 <div class="kv-val">${formatRupiah(calc.totalNilaiDampak)}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Durasi Manfaat</div>
 <div class="kv-val">${calc.durationYears || 1} Tahun</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Deadweight</div>
 <div class="kv-val">${calc.deadweight}%</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Attribution</div>
 <div class="kv-val">${calc.attribution}%</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Displacement</div>
 <div class="kv-val">${calc.displacement}%</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Discount Rate / Drop-off</div>
 <div class="kv-val">${calc.discountRate}% / ${calc.dropOff}%</div>
 </div>
 </div>

 <!-- Kesesuaian Anggaran dengan Target Kinerja -->
 ${kesesuaian ? `
 <div class="sub-section-title" style="margin-top: 18px;">
 <span></span> Kesesuaian Anggaran dengan Target Kinerja
 </div>
 <div class="kv-grid">
 <div class="kv-item">
 <div class="kv-label">Status Kesesuaian</div>
 <div class="kv-val">
 <span class="tone-badge ${kesesuaian.status === 'Sesuai' ? 'tone-green' : kesesuaian.status === 'Perlu Perhatian' ? 'tone-yellow' : 'tone-red'}">
 ${escapeHtml(kesesuaian.status || 'Sesuai')}
 </span>
 </div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Estimasi Biaya per Output</div>
 <div class="kv-val">${escapeHtml(kesesuaian.estimasi_biaya_per_output || '-')}</div>
 </div>
 <div class="kv-item">
 <div class="kv-label">Proyeksi Pencapaian Target</div>
 <div class="kv-val">
 <span class="tone-badge ${kesesuaian.proyeksi_pencapaian_target === 'Tercapai' ? 'tone-green' : 'tone-yellow'}">
 ${escapeHtml(kesesuaian.proyeksi_pencapaian_target || 'Tercapai')}
 </span>
 </div>
 </div>
 </div>
 ${kesesuaian.penjelasan ? `
 <div style="font-size: 12.5px; color: var(--text-main); background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; margin-top: 6px;">
 <strong>Catatan Kesesuaian:</strong> ${escapeHtml(kesesuaian.penjelasan)}
 </div>
 ` : ''}
 ` : ''}

 <!-- Status Efisiensi per Rekening -->
 <div class="sub-section-title" style="margin-top: 18px;">
 <span></span> Status Efisiensi &amp; Rekomendasi Belanja per Rekening
 </div>
 ${efficiencyList.length === 0 ? `
 <p style="font-size: 12.5px; color: var(--text-muted); font-style: italic;">Tidak ada evaluasi rekening khusus pada dokumen ini.</p>
 ` : `
 <div>
 ${efficiencyList.map(eff => `
 <div class="efficiency-card">
 <div class="eff-head">
 <div>
 <span class="eff-name">${escapeHtml(eff.nama)}</span>
 <span class="code-col" style="margin-left: 6px;">(${escapeHtml(eff.kode)})</span>
 </div>
 <span class="tone-badge ${eff.status === 'Inefisien' ? 'tone-red' : 'tone-green'}">
 ${eff.status === 'Inefisien' ? 'Inefisien' : 'Efisien'}
 </span>
 </div>
 <div class="eff-desc">
 ${eff.nilai ? `Nilai: ${formatRupiah(eff.nilai)} ` : ''}
 ${eff.persen !== null ? `(${eff.persen}% pagu). ` : ''}
 ${escapeHtml(eff.alasan)}
 </div>
 ${eff.rekomendasi ? `
 <div class="eff-recom">
 <strong>Rekomendasi AI:</strong> Kurangi alokasi belanja ini sebesar ${formatRupiah(eff.rekomendasi.kurangi)}. ${escapeHtml(eff.rekomendasi.catatan)}
 </div>
 ` : ''}
 </div>
 `).join('')}
 </div>
 `}

 <!-- Justifikasi Outcome & Catatan -->
 <div class="sub-section-title" style="margin-top: 18px;">
 <span></span> Justifikasi Dampak Sosial &amp; Rekomendasi AI
 </div>
 <div style="font-size: 13px; line-height: 1.6; background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 16px; color: var(--text-main);">
 ${escapeHtml(doc.justifikasiOutcome || doc.outcomeDesc || doc.catatan || 'Program memberikan dampak sosial dan penguatan pelayanan publik bagi masyarakat secara berkesinambungan.')}
 </div>

 </div>

 </div>
 </div>

 </article>
 `;
 }).join('')}
 </main>

 <!-- ══ 5. SYSTEM EXTRA SECTION (HANYA PADA FULL BACKUP) ═════════════════ -->
 ${isFullBackup ? `
 <section class="system-section">
 <div class="section-title">
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
 Data Konfigurasi Sistem &amp; Pengguna Terdaftar (${usersList.length} User)
 </div>
 <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
 Berikut adalah daftar akun pengguna dan hak akses terdaftar di dalam database sistem pada saat cadangan ini dibuat:
 </p>
 <table class="compact-table">
 <thead>
 <tr>
 <th>#</th>
 <th>Nama Lengkap</th>
 <th>Username</th>
 <th>Hak Akses (Role)</th>
 <th>Status Akun</th>
 </tr>
 </thead>
 <tbody>
 ${usersList.map((u, i) => `
 <tr>
 <td>${i + 1}</td>
 <td><strong>${escapeHtml(u.name || '-')}</strong></td>
 <td class="code-col">${escapeHtml(u.username || '-')}</td>
 <td>
 <span class="tone-badge ${u.role === 'admin' ? 'tone-green' : u.role === 'moderator' ? 'tone-yellow' : 'tone-gray'}">
 ${escapeHtml((u.role || 'user').toUpperCase())}
 </span>
 </td>
 <td>${u.isActive ? 'Aktif' : 'Nonaktif'}</td>
 </tr>
 `).join('')}
 </tbody>
 </table>

 ${logsList.length > 0 ? `
 <div class="section-title" style="margin-top: 24px;">
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
 Catatan Log Aktivitas Terakhir (${Math.min(logsList.length, 15)} Terakhir)
 </div>
 <table class="compact-table">
 <thead>
 <tr>
 <th>Waktu</th>
 <th>Aksi</th>
 <th>Target</th>
 <th>Pengguna</th>
 <th>Status</th>
 </tr>
 </thead>
 <tbody>
 ${logsList.slice(0, 15).map(l => `
 <tr>
 <td style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(formatDateIndo(l.timestamp || l.createdAt))}</td>
 <td><strong>${escapeHtml(l.action || '-')}</strong></td>
 <td>${escapeHtml(l.target || '-')}</td>
 <td>${escapeHtml(l.user || l.username || 'System')}</td>
 <td>
 <span class="tone-badge ${l.status === 'SUCCESS' ? 'tone-green' : 'tone-red'}">
 ${escapeHtml(l.status || 'INFO')}
 </span>
 </td>
 </tr>
 `).join('')}
 </tbody>
 </table>
 ` : ''}
 </section>
 ` : ''}

 <!-- ══ 6. FOOTER ════════════════════════════════════════════════════════ -->
 <footer class="backup-footer">
 <p>Berkas Cadangan HTML Mandiri — Sistem Evaluasi RKA &amp; Proyeksi SROI Berbasis AI (SINTRA)</p>
 <p>BAPPERIDA Kabupaten Cirebon • Data terenkapsulasi secara lengkap dan dapat dipulihkan kapan saja ke sistem.</p>
 </footer>

</div>

<!-- ══ 7. EMBEDDED RAW BACKUP JSON (FOR RESTORE & AUDIT) ═════════════════ -->
<script id="raw-backup-data" type="application/json">
${safeJsonString}
</script>

<!-- ══ 8. CLIENT-SIDE INTERACTION SCRIPT ═════════════════════════════════ -->
<script>
 // Toggle accordion card
 function toggleDoc(headerEl) {
 const card = headerEl.closest('.doc-card');
 if (card) {
 card.classList.toggle('is-open');
 }
 }

 // Toggle all cards open/closed
 let allOpen = false;
 function toggleAllDetails() {
 allOpen = !allOpen;
 const cards = document.querySelectorAll('.doc-card');
 cards.forEach(c => {
 if (allOpen) c.classList.add('is-open');
 else c.classList.remove('is-open');
 });
 const btnText = document.getElementById('btn-toggle-all-text');
 if (btnText) {
 btnText.textContent = allOpen ? 'Tutup Semua Detail' : 'Buka Semua Detail';
 }
 }

 // Live filter search
 function filterDocs() {
 const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
 const cards = document.querySelectorAll('.doc-card');
 cards.forEach(card => {
 const searchData = card.getAttribute('data-search') || '';
 if (!q || searchData.includes(q)) {
 card.style.display = '';
 } else {
 card.style.display = 'none';
 }
 });
 }

 // Filter by tone badge (All, Layak, Cukup, Kurang)
 let currentToneFilter = 'all';
 function filterByTone(tone, btnEl) {
 currentToneFilter = tone;
 document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
 if (btnEl) btnEl.classList.add('active');

 const cards = document.querySelectorAll('.doc-card');
 cards.forEach(card => {
 const cardTone = card.getAttribute('data-tone');
 if (tone === 'all' || cardTone === tone) {
 card.style.display = '';
 } else {
 card.style.display = 'none';
 }
 });
 }

 // Ekspor ulang JSON mentah dari berkas HTML ini
 function exportJsonFromBackup() {
 try {
 const rawEl = document.getElementById('raw-backup-data');
 if (!rawEl) {
 alert('Data JSON cadangan tidak ditemukan.');
 return;
 }
 const rawJson = rawEl.textContent.trim();
 const blob = new Blob([rawJson], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = 'cadangan_data_rka_mentah_' + new Date().toISOString().slice(0, 10) + '.json';
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 } catch (e) {
 alert('Gagal mengekspor data JSON: ' + e.message);
 }
 }
</script>

</body>
</html>`;
}

/**
 * Trigger download berkas HTML cadangan langsung ke browser
 */
export function downloadHtmlBackup(backupPayload, isFullBackup = false, username = '') {
 if (!backupPayload) return;
 const htmlContent = generateHtmlBackup(backupPayload, isFullBackup);
 const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;

 const dateStr = new Date().toISOString().slice(0, 10);
 const cleanUsername = (username || backupPayload.user?.username || backupPayload.exportedBy?.username || 'user')
 .replace(/[/\\?%*:|"<>]/g, '_')
 .replace(/\s+/g, '_');

 if (isFullBackup) {
 a.download = `sintra_backup_full_${dateStr}.html`;
 } else {
 a.download = `cadangan_data_rka_${cleanUsername}_${dateStr}.html`;
 }

 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
}
