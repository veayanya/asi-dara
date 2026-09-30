// utils/htmlReportGenerator.js
// Generator Berkas HTML Standalone Hasil Analisis RKA
// Tampilan 100% SAMA PERSIS dengan UI/UX komponen AnalysisResult.vue

import { computeSroi16Rules, cleanOpdName } from '@/composables/useAnalysis';

export function generateAnalysisHtml(doc) {
 if (!doc) return '';

 const formatRupiah = (val) => {
 if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
 return 'Rp ' + Math.round(val).toLocaleString('id-ID');
 };

 const safeJsonString = JSON.stringify(doc).replace(/<\/script>/gi, '<\\/script>');

 // Kalkulasi 16 Aturan Baku SROI
 const sroiMetrics = computeSroi16Rules(doc);
 const paguVal = sroiMetrics.valueOfInputs;
 const currentTahun = doc.tahunRencana || doc.tahun || 2027;

 // Header & OPD
 const cleanedOpd = cleanOpdName(doc.opd || doc.perangkatDaerah || '-');
 const subKegiatan = doc.subKegiatan || doc.program || '-';
 const program = doc.namaProgram || doc.program || '-';
 const kegiatan = doc.kegiatan || doc.namaKegiatan || '-';

 // 1. Indikator & Target Kinerja
 const indikatorList = Array.isArray(doc.indikatorKinerja) ? doc.indikatorKinerja : [];
 const escRincian = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

 // 2. Kesesuaian Anggaran dengan Target Kinerja
 const kesesuaian = doc.kesesuaianAnggaran || null;
 let kesesuaianClass = 'ok';
 let kesesuaianIcon = '';
 if (kesesuaian?.status === 'Tidak Sesuai') { kesesuaianClass = 'bad'; kesesuaianIcon = ''; }
 else if (kesesuaian?.status === 'Perlu Perhatian') { kesesuaianClass = 'warn'; kesesuaianIcon = ''; }

 let proyeksiClass = 'ok';
 let proyeksiIcon = '';
 if (kesesuaian?.proyeksi_pencapaian_target === 'Diproyeksikan Tidak Tercapai') { proyeksiClass = 'bad'; proyeksiIcon = ''; }
 else if (kesesuaian?.proyeksi_pencapaian_target === 'Berisiko Tidak Tercapai') { proyeksiClass = 'warn'; proyeksiIcon = ''; }

 const justifikasiOutcome = doc.justifikasiOutcome || doc.outcomeDesc || 'Program memberikan dampak sosial dan peningkatan taraf layanan masyarakat secara berkelanjutan.';

 // 3. Analisis Komponen Belanja & Rekomendasi Belanja
 const withLainnya = (dataset) => {
 if (!dataset || dataset.length === 0) return [];
 const sumPersen = dataset.reduce((s, d) => s + (Number(d.persen) || 0), 0);
 if (sumPersen < 99) {
 return [...dataset, { nama: 'Lainnya', persen: Number((100 - sumPersen).toFixed(1)) }];
 }
 return dataset;
 };

 const awalRaw = (doc.rekeningProporsi && doc.rekeningProporsi.length > 0) ? doc.rekeningProporsi : [];
 const usulanRaw = (doc.rekeningProporsiUsulan && doc.rekeningProporsiUsulan.length > 0) ? doc.rekeningProporsiUsulan : awalRaw;

 const awalData = withLainnya(awalRaw);
 const usulanData = withLainnya(usulanRaw);
 const reallocs = doc.reallocationJustifications || [];
 const kurangiList = reallocs.filter(j => j.aksi === 'KURANGI');
 const tambahList = reallocs.filter(j => j.aksi === 'TAMBAH');

 const palette = ['#0E6B5E', '#2FC98E', '#F0AC42', '#F0708A', '#DC7A2A', '#2E9587', '#C7DEDA'];

 // Status Efisiensi per Rekening
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
 } else if (status === 'Belum Dapat Dinilai') {
 alasan = 'Data pembanding harga satuan atau rincian belum mencukupi untuk menilai efisiensi secara valid.';
 } else {
 alasan = 'Alokasi anggaran belanja ini dinilai wajar dan berada dalam batas efisiensi standar.';
 }
 }
 }

 let toneClass = 'tone-green';
 let icon = '';
 if (status === 'Inefisien') {
 toneClass = 'tone-red';
 icon = '';
 } else if (status === 'Belum Dapat Dinilai') {
 toneClass = 'tone-gray';
 icon = '?';
 } else {
 status = 'Efisien';
 toneClass = 'tone-green';
 icon = '';
 }

 const persenNum = (rek.persen !== undefined && rek.persen !== null) ? Number(rek.persen) : null;
 const nilaiNum = (rek.nilai !== undefined && rek.nilai !== null) ? Number(rek.nilai) : null;

 // ── Penjelasan detail (persis seperti di AnalysisResult.vue) ──
 const kontribusiParts = [];
 if (rek.kode) kontribusiParts.push(`kode rekening ${rek.kode}`);
 if (persenNum !== null) kontribusiParts.push(`berkontribusi ${persenNum}% dari total pagu`);
 if (nilaiNum !== null) kontribusiParts.push(`senilai ${formatRupiah(nilaiNum)}`);
 const kontribusiSentence = kontribusiParts.length
 ? `${rek.nama} (${kontribusiParts.join(', ')}).`
 : `${rek.nama}.`;

 let rekomendasiSentence = '';
 if (matchedRealloc) {
 if (matchedRealloc.aksi === 'KURANGI') {
 const nilaiKurang = matchedRealloc.nilai_dikurangi ? formatRupiah(matchedRealloc.nilai_dikurangi) : null;
 rekomendasiSentence = `Rekomendasi AI: kurangi alokasi ini${nilaiKurang ? ' sebesar ' + nilaiKurang : ''}. ${matchedRealloc.alasan_dikurangi || ''}`.trim();
 } else {
 const nilaiTambah = matchedRealloc.nilai_ditambah ? formatRupiah(matchedRealloc.nilai_ditambah) : null;
 rekomendasiSentence = `Rekomendasi AI: tambahkan alokasi ini${nilaiTambah ? ' sebesar ' + nilaiTambah : ''}. ${matchedRealloc.alasan_dialokasikan || ''}`.trim();
 }
 } else if (status === 'Inefisien') {
 rekomendasiSentence = 'Alokasi belanja ini melebihi batas efisiensi operasional yang wajar dibandingkan keluaran (output) yang dihasilkan, sehingga berpotensi mengurangi ruang fiskal bagi belanja utama program.';
 } else if (status === 'Belum Dapat Dinilai') {
 rekomendasiSentence = 'Data pembanding harga satuan, volume, atau rincian teknis rekening ini belum mencukupi untuk menilai tingkat efisiensinya secara valid. Diperlukan kelengkapan data lebih lanjut sebelum kesimpulan efisiensi dapat ditarik.';
 } else {
 rekomendasiSentence = 'Alokasi anggaran pada rekening ini dinilai wajar, sepadan dengan keluaran (output) yang ditargetkan, dan berada dalam batas efisiensi standar SSH/SBM yang berlaku, sehingga tidak memerlukan penyesuaian pada tahap ini.';
 }

 const detail = `${kontribusiSentence} ${rekomendasiSentence}`.trim();

 return {
 nama: rek.nama,
 kode: rek.kode || null,
 persen: persenNum,
 nilai: nilaiNum,
 status: status,
 alasan: alasan,
 detail: detail,
 icon: icon,
 class: toneClass
 };
 });

 // 4. Ringkasan Efektif & Inefektif per Rekening
 const rekeningEfektivitas = efficiencyList.map((item) => {
 let label = 'Efektif';
 let tone = 'tone-green';
 let icon = '';
 if (item.status === 'Inefisien') {
 label = 'Tidak Efektif';
 tone = 'tone-red';
 icon = '';
 } else if (item.status === 'Belum Dapat Dinilai') {
 label = 'Belum Dapat Dinilai';
 tone = 'tone-gray';
 icon = '?';
 }
 return { ...item, label, tone, icon };
 });

 const efektifRekeningList = rekeningEfektivitas.filter((r) => r.label === 'Efektif');
 const tidakEfektifRekeningList = rekeningEfektivitas.filter((r) => r.label === 'Tidak Efektif');
 const belumDinilaiRekeningList = rekeningEfektivitas.filter((r) => r.label === 'Belum Dapat Dinilai');

 const efektifPersenTotal = efektifRekeningList.reduce((sum, r) => sum + (r.persen || 0), 0);
 const tidakEfektifPersenTotal = tidakEfektifRekeningList.reduce((sum, r) => sum + (r.persen || 0), 0);

 return `<!DOCTYPE html>
<html lang="id">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Analisis RKA - ${doc.namaDokumen || doc.program || 'Dokumen RKA'}</title>
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
 <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
 <style>
 :root {
 --primary-color: #0E6B5E;
 --primary-hover: #094F45;
 --primary-glow: #E2ECE9;
 --bg-primary: #F7FAF9;
 --bg-secondary: #EDF4F2;
 --bg-tertiary: #E2ECE9;
 --bg-card: #FFFFFF;
 --text-primary: #1A2E2B;
 --text-secondary: #5A7570;
 --text-muted: #8A9E9B;
 --border-color: #E2ECE9;
 --border-color-strong: #C7DEDA;
 --success-color: #2FC98E;
 --success-glow: #E8F8F2;
 --success-hover: #26A875;
 --warning-color: #F0AC42;
 --warning-glow: #FDF5E8;
 --warning-hover: #D4902A;
 --danger-color: #F0708A;
 --danger-glow: #FDEEF1;
 --danger-hover: #D4536E;
 --info-color: #2E9587;
 --info-glow: #E6F4F2;
 --info-hover: #227368;
 --accent-color: #DC7A2A;

 --c-navy-deep: #123B34;
 --c-gray-50: #F7FAF9;
 --c-gray-100: #EDF4F2;
 --c-gray-200: #E2ECE9;
 --c-gray-300: #C7DEDA;
 --c-gray-400: #8A9E9B;
 --c-gray-500: #5A7570;
 --c-gray-600: #3A524D;
 --c-gray-700: #27403B;
 --c-gray-800: #1A2E2B;
 --c-gray-900: #0F1F1D;
 --c-green: #2FC98E;
 --c-red: #F0708A;
 --c-yellow: #F0AC42;

 --radius-sm: 8px;
 --radius-md: 12px;
 --radius-lg: 16px;
 --shadow-soft: 0 4px 20px -2px rgba(14, 107, 94, 0.08);
 }

 * { box-sizing: border-box; margin: 0; padding: 0; }
 body {
 font-family: 'Plus Jakarta Sans', sans-serif;
 background: #eef3f1;
 color: var(--text-primary);
 padding: 30px 16px;
 line-height: 1.5;
 }
 .container {
 max-width: 1040px;
 margin: 0 auto;
 background: var(--bg-card);
 border-radius: var(--radius-lg);
 border: 1px solid var(--border-color);
 box-shadow: 0 10px 40px rgba(0,0,0,0.06);
 overflow: hidden;
 }

 /* TOP BAR */
 .sroi-header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: 18px 28px;
 background: #fff;
 border-bottom: 1px solid var(--border-color);
 }
 .sroi-header-left {
 display: flex;
 align-items: center;
 gap: 12px;
 }
 .sroi-header-icon {
 color: var(--primary-color);
 font-size: 20px;
 }
 .sroi-header h2 {
 font-size: 20px;
 font-weight: 800;
 color: var(--c-navy-deep);
 margin: 0;
 }
 .btn-print {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 8px 16px;
 font-size: 13px;
 font-weight: 700;
 background: var(--primary-color);
 color: #fff;
 border: none;
 border-radius: var(--radius-sm);
 cursor: pointer;
 transition: background 0.2s;
 }
 .btn-print:hover { background: var(--primary-hover); }

 .sroi-body {
 padding: 28px;
 display: flex;
 flex-direction: column;
 gap: 28px;
 }

 /* 1. HERO HEADER (SUBKEG, PERANGKAT DAERAH, PROGRAM, KEGIATAN, PAGU, TAHUN) */
 .rka-hero {
 background: var(--bg-primary);
 border: 1px solid var(--border-color);
 border-radius: var(--radius-lg);
 padding: 24px 26px;
 display: flex;
 flex-direction: column;
 gap: 18px;
 }
 .rka-hero-row {
 display: flex;
 flex-direction: column;
 gap: 4px;
 }
 .rka-hero-label {
 font-size: 11px;
 font-weight: 800;
 letter-spacing: 0.08em;
 text-transform: uppercase;
 color: var(--text-muted);
 }
 .rka-hero-main-val {
 font-size: 17px;
 font-weight: 800;
 color: var(--primary-color);
 line-height: 1.4;
 }
 .rka-hero-split-grid {
 display: grid;
 grid-template-columns: 1.35fr 1fr;
 gap: 20px;
 padding-top: 14px;
 border-top: 1px dashed var(--border-color);
 }
 @media (max-width: 768px) {
 .rka-hero-split-grid { grid-template-columns: 1fr; }
 }
 .rka-hero-col-left {
 display: flex;
 flex-direction: column;
 gap: 12px;
 }
 .rka-hero-item {
 display: flex;
 flex-direction: column;
 gap: 2px;
 }
 .rka-hero-text-val {
 font-size: 14px;
 font-weight: 600;
 color: var(--text-primary);
 }
 .pagu-anggaran-box { margin-top: 2px; }
 .tab-amount-num {
 font-size: 22px;
 font-weight: 800;
 font-family: 'JetBrains Mono', monospace;
 color: var(--primary-color);
 }

 .rka-hero-col-right {
 display: flex;
 flex-direction: column;
 justify-content: center;
 align-items: flex-start;
 background: #ffffff;
 border: 1px solid var(--border-color);
 border-radius: var(--radius-md);
 padding: 16px 20px;
 }
 .tahun-anggaran-plain {
 display: flex;
 align-items: center;
 gap: 10px;
 margin-top: 4px;
 }
 .tahun-anggaran-year {
 font-size: 20px;
 font-weight: 800;
 color: var(--c-navy-deep);
 }
 .tab-year-badge {
 font-size: 10.5px;
 font-weight: 700;
 padding: 3px 10px;
 border-radius: 12px;
 background: var(--success-glow);
 color: var(--success-hover);
 text-transform: uppercase;
 letter-spacing: 0.03em;
 }

 /* Section Titles */
 .rka-section {
 display: flex;
 flex-direction: column;
 gap: 12px;
 }
 .rka-section-title {
 display: flex;
 align-items: center;
 gap: 8px;
 font-size: 17px;
 font-weight: 800;
 color: var(--c-navy-deep);
 }
 .rka-section-sub {
 font-size: 13px;
 color: var(--text-secondary);
 margin-top: -6px;
 margin-bottom: 4px;
 }
 .icon-badge {
 font-size: 18px;
 }

 /* 2. Indikator & Target Kinerja */
 .indikator-anggaran-card {
 background: #fff;
 border: 1px solid var(--border-color);
 border-radius: var(--radius-md);
 padding: 18px 20px;
 }
 .indikator-col-header {
 display: flex;
 align-items: center;
 gap: 6px;
 font-size: 12.5px;
 font-weight: 700;
 padding: 8px 14px;
 border-radius: 8px;
 margin-bottom: 12px;
 background: var(--info-glow);
 color: var(--info-hover);
 }
 .indikator-item-card {
 border: 1px solid var(--border-color);
 border-radius: var(--radius-sm);
 padding: 12px 14px;
 margin-bottom: 10px;
 background: var(--bg-primary);
 }
 .indikator-item-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 8px;
 margin-bottom: 4px;
 }
 .indikator-item-level {
 font-size: 11px;
 font-weight: 700;
 color: var(--text-muted);
 text-transform: uppercase;
 letter-spacing: 0.02em;
 }
 .indikator-item-target {
 font-size: 13px;
 font-weight: 700;
 color: var(--primary-color);
 }
 .indikator-item-nama {
 font-size: 13.5px;
 font-weight: 700;
 color: var(--text-primary);
 line-height: 1.4;
 }

 /* 3. Kesesuaian Anggaran & Outcome */
 .kesesuaian-card {
 border-radius: var(--radius-md);
 padding: 16px 20px;
 border: 1px solid var(--border-color);
 background: var(--bg-primary);
 margin-bottom: 12px;
 }
 .kesesuaian-card.ok { border-color: var(--success-color); background: var(--success-glow); }
 .kesesuaian-card.warn { border-color: #fde047; background: #fefce8; }
 .kesesuaian-card.bad { border-color: #fca5a5; background: #fef2f2; }
 .kesesuaian-top {
 display: flex;
 align-items: center;
 gap: 8px;
 margin-bottom: 8px;
 flex-wrap: wrap;
 }
 .kesesuaian-icon { font-size: 15px; font-weight: 700; }
 .kesesuaian-title { font-size: 13.5px; font-weight: 700; color: var(--text-primary); flex: 1; }
 .kesesuaian-status-pill {
 font-size: 11px;
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.03em;
 padding: 3px 10px;
 border-radius: 20px;
 background: var(--border-color);
 color: var(--text-primary);
 }
 .kesesuaian-card.ok .kesesuaian-status-pill { background: #d1fae5; color: #065f46; }
 .kesesuaian-card.warn .kesesuaian-status-pill { background: #fef3c7; color: #92400e; }
 .kesesuaian-card.bad .kesesuaian-status-pill { background: #fee2e2; color: #991b1b; }
 .kesesuaian-penjelasan { font-size: 13px; color: var(--text-primary); line-height: 1.55; margin: 0 0 8px; }
 .kesesuaian-estimasi { font-size: 12px; color: var(--text-secondary); margin: 0 0 10px; }
 .kesesuaian-estimasi strong { color: var(--text-primary); }

 .proyeksi-target-box {
 background: #ffffff;
 border: 1px solid var(--border-color);
 border-radius: var(--radius-sm);
 padding: 12px 14px;
 margin-top: 10px;
 }
 .proyeksi-target-top {
 display: flex;
 align-items: center;
 gap: 8px;
 margin-bottom: 4px;
 flex-wrap: wrap;
 }
 .proyeksi-target-icon { font-size: 14px; }
 .proyeksi-target-label { font-size: 12px; font-weight: 700; color: var(--text-primary); flex: 1; }
 .proyeksi-target-pill {
 font-size: 10.5px;
 font-weight: 700;
 padding: 2px 8px;
 border-radius: 12px;
 background: var(--border-color);
 }
 .proyeksi-target-box.warn .proyeksi-target-pill { background: #fef3c7; color: #92400e; }
 .proyeksi-target-box.bad .proyeksi-target-pill { background: #fee2e2; color: #991b1b; }
 .proyeksi-target-alasan { font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.45; }

 .justifikasi-card {
 background: #ffffff;
 border: 1px solid var(--border-color);
 border-left: 4px solid var(--primary-color);
 border-radius: var(--radius-md);
 padding: 14px 18px;
 }
 .justifikasi-label {
 font-size: 11px;
 font-weight: 800;
 letter-spacing: 0.05em;
 text-transform: uppercase;
 color: var(--text-muted);
 margin-bottom: 4px;
 }
 .justifikasi-text {
 font-size: 13px;
 color: var(--text-primary);
 line-height: 1.55;
 }

 /* 4. Analisis Komponen & Rekomendasi Belanja */
 .belanja-rekomendasi-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 20px;
 }
 @media (max-width: 900px) {
 .belanja-rekomendasi-grid { grid-template-columns: 1fr; }
 }
 .belanja-col { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
 .belanja-col-header {
 display: flex;
 align-items: center;
 gap: 7px;
 font-size: 13.5px;
 font-weight: 800;
 color: var(--c-navy-deep);
 padding-bottom: 8px;
 border-bottom: 2px solid var(--border-color);
 }
 .belanja-col-header.accent-ai { color: var(--accent-color); border-bottom-color: rgba(220,122,42,0.25); }
 .belanja-subblock-label {
 font-size: 11.5px;
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.03em;
 color: var(--text-muted);
 margin: 12px 0 6px;
 }
 .chart-card {
 background: #fff;
 border: 1px solid var(--border-color);
 border-radius: var(--radius-md);
 padding: 16px;
 }
 .pie-canvas-wrap { position: relative; width: 100%; height: 190px; margin: 0 auto; max-width: 230px; }
 .pie-legend { list-style: none; margin: 12px 0 0; padding: 0; font-size: 12px; }
 .pie-legend li {
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 4px 0;
 border-bottom: 1px dashed var(--border-color);
 }
 .pie-legend li:last-child { border-bottom: none; }
 .legend-name { flex: 1; }
 .legend-pct { font-weight: 700; color: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 11.5px; }
 .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

 .efficiency-summary-card {
 background: var(--bg-primary);
 border: 1px dashed var(--border-color-strong);
 border-radius: var(--radius-md);
 padding: 16px 18px;
 }
 .efficiency-list { display: flex; flex-direction: column; gap: 0; }
 .efficiency-list-item {
 padding: 10px 8px;
 margin: 0 -8px;
 border-bottom: 1px solid var(--border-color);
 border-radius: 8px;
 cursor: pointer;
 transition: background 0.15s ease;
 }
 .efficiency-list-item:hover, .efficiency-list-item.is-open { background: #fff; }
 .efficiency-list-item:last-child { border-bottom: none; }
 .efficiency-list-row {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 12px;
 }
 .efficiency-item-name { font-size: 12.5px; font-weight: 600; color: var(--text-primary); flex: 1; line-height: 1.35; }
 .efficiency-item-status {
 font-size: 10.5px;
 font-weight: 700;
 padding: 3px 9px;
 border-radius: 12px;
 display: flex;
 align-items: center;
 gap: 4px;
 white-space: nowrap;
 }
 .efficiency-item-status.tone-red { background: var(--danger-glow); color: var(--danger-color); }
 .efficiency-item-status.tone-green { background: var(--success-glow); color: var(--success-hover); }
 .efficiency-item-status.tone-gray { background: #f1f5f9; color: #64748b; }
 .efficiency-item-chevron {
 font-size: 9px;
 color: var(--text-muted);
 flex-shrink: 0;
 }
 .efficiency-item-reason {
 font-size: 11.5px;
 color: var(--text-secondary);
 line-height: 1.5;
 background: #f8fafc;
 border: 1px solid var(--border-color);
 border-radius: 8px;
 padding: 9px 11px;
 margin-top: 8px;
 }

 .realokasi-stack { display: flex; flex-direction: column; gap: 12px; }
 .realokasi-header {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 font-size: 12px;
 font-weight: 700;
 padding: 6px 14px;
 border-radius: 20px;
 margin-bottom: 8px;
 }
 .realokasi-col.kurangi .realokasi-header { background: var(--danger-glow); color: var(--danger-color); }
 .realokasi-col.tambah .realokasi-header { background: var(--success-glow); color: var(--success-hover); }
 .realokasi-card {
 background: #fff;
 border: 1px solid var(--border-color);
 border-radius: var(--radius-sm);
 padding: 12px 14px;
 margin-bottom: 8px;
 }
 .realokasi-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 8px;
 margin-bottom: 4px;
 }
 .realokasi-kode { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); }
 .realokasi-nilai-group { display: flex; align-items: center; gap: 6px; }
 .realokasi-nilai-awal { text-decoration: line-through; color: var(--text-muted); font-size: 11px; }
 .realokasi-nilai { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
 .realokasi-nilai.minus { color: var(--danger-color); }
 .realokasi-nilai.plus { color: var(--success-color); }
 .realokasi-nama { font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
 .realokasi-alasan { font-size: 11.5px; color: var(--text-secondary); line-height: 1.45; }

 /* 5. Valuasi & Rasio SROI */
 .sroi-ratio-card {
 border-radius: var(--radius-lg);
 padding: 24px 28px;
 color: #fff;
 box-shadow: var(--shadow-soft);
 }
 .sroi-ratio-card.tone-green { background: linear-gradient(135deg, #10b981 0%, #047857 100%); }
 .sroi-ratio-card.tone-yellow { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); }
 .sroi-ratio-card.tone-red { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); }
 .sroi-ratio-card.tone-gray { background: linear-gradient(135deg, #475569 0%, #334155 100%); }

 .sroi-ratio-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 10px;
 margin-bottom: 6px;
 }
 .sroi-ratio-eyebrow {
 font-size: 11px;
 font-weight: 700;
 letter-spacing: 0.05em;
 text-transform: uppercase;
 opacity: 0.9;
 }
 .sroi-status-pill {
 background: rgba(255, 255, 255, 0.22);
 padding: 4px 12px;
 border-radius: 20px;
 font-size: 11px;
 font-weight: 700;
 text-transform: uppercase;
 }
 .sroi-ratio-value {
 font-size: 48px;
 font-weight: 800;
 font-family: 'JetBrains Mono', monospace;
 line-height: 1;
 margin: 8px 0 10px;
 }
 .sroi-ratio-formula { font-size: 12px; opacity: 0.85; margin-bottom: 8px; }
 .sroi-ratio-desc { font-size: 13.5px; font-weight: 600; line-height: 1.45; }

 .sroi-stats-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 12px;
 margin-top: 14px;
 }
 @media (max-width: 900px) {
 .sroi-stats-grid { grid-template-columns: repeat(2, 1fr); }
 }
 .sroi-stat-card {
 background: var(--bg-primary);
 border: 1px solid var(--border-color);
 border-radius: var(--radius-sm);
 padding: 12px 14px;
 }
 .stat-label {
 font-size: 10px;
 font-weight: 700;
 letter-spacing: 0.04em;
 text-transform: uppercase;
 color: var(--text-muted);
 margin-bottom: 4px;
 }
 .stat-value {
 font-size: 16px;
 font-weight: 800;
 font-family: 'JetBrains Mono', monospace;
 color: var(--text-primary);
 }
 .stat-value.positive { color: var(--primary-color); }

 /* Faktor Penyesuaian */
 .sroi-factors-card {
 margin-top: 14px;
 background: #ffffff;
 border: 1px solid var(--border-color);
 border-radius: var(--radius-md);
 padding: 16px;
 }
 .sroi-factors-title {
 font-size: 12.5px;
 font-weight: 700;
 color: var(--c-navy-deep);
 margin-bottom: 10px;
 }
 .sroi-factors-grid {
 display: grid;
 grid-template-columns: repeat(5, 1fr);
 gap: 10px;
 }
 @media (max-width: 900px) {
 .sroi-factors-grid { grid-template-columns: repeat(2, 1fr); }
 }
 .sroi-factor-item {
 background: var(--bg-primary);
 border: 1px solid var(--border-color);
 border-radius: var(--radius-sm);
 padding: 10px 12px;
 display: flex;
 flex-direction: column;
 gap: 2px;
 }
 .factor-name {
 font-size: 11px;
 font-weight: 700;
 color: var(--text-secondary);
 text-transform: uppercase;
 }
 .factor-val {
 font-size: 16px;
 font-weight: 800;
 font-family: 'JetBrains Mono', monospace;
 color: var(--text-primary);
 }
 .factor-hint {
 font-size: 10px;
 color: var(--text-muted);
 line-height: 1.25;
 }

 /* Rantai Transparansi Flow */
 .sroi-transparency-card {
 margin-top: 14px;
 background: #ffffff;
 border: 1px solid var(--border-color);
 border-radius: var(--radius-md);
 padding: 16px;
 }
 .transparency-header {
 font-size: 13px;
 font-weight: 700;
 color: var(--c-navy-deep);
 margin-bottom: 12px;
 display: flex;
 align-items: center;
 gap: 6px;
 }
 .transparency-flow {
      --flow-gap: 6px;
      --flow-arrow-w: 15px;
      --flow-visible: 4;
      display: flex;
      align-items: stretch;
      justify-content: flex-start;
      gap: var(--flow-gap);
      overflow-x: auto;
      padding-bottom: 8px;
      scroll-snap-type: x proximity;
    }
    .flow-step {
      flex: 0 0 calc((100% - (var(--flow-visible) - 1) * (var(--flow-arrow-w) + 2 * var(--flow-gap))) / var(--flow-visible));
      min-width: 0;
      scroll-snap-align: start;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px 12px;
    }
    @media (max-width: 640px) { .transparency-flow { --flow-visible: 2; } }
    .flow-step.highlight {
 background: #ecfdf5;
 border-color: #a7f3d0;
 }
 .step-num {
 font-size: 9.5px;
 font-weight: 800;
 width: 18px;
 height: 18px;
 background: #cbd5e1;
 color: #334155;
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 margin-bottom: 6px;
 }
 .flow-step.highlight .step-num {
 background: var(--primary-color);
 color: #ffffff;
 }
 .step-title {
 font-size: 10.5px;
 font-weight: 700;
 color: var(--text-secondary);
 margin-bottom: 3px;
 white-space: nowrap;
 overflow: hidden;
 text-overflow: ellipsis;
 }
 .step-val {
 font-size: 12px;
 font-weight: 800;
 font-family: 'JetBrains Mono', monospace;
 color: var(--text-primary);
 white-space: nowrap;
 }
 .flow-arrow {
 color: var(--text-muted);
 font-weight: 800;
 font-size: 15px;
 flex-shrink: 0;
 }

 /* 6. Ringkasan Efektif & Inefektif per Rekening */
 .efektivitas-summary-strip {
 display: flex;
 gap: 12px;
 flex-wrap: wrap;
 margin-bottom: 12px;
 }
 .efektivitas-summary-pill {
 flex: 1;
 min-width: 180px;
 padding: 12px 16px;
 border-radius: var(--radius-md);
 border: 1px solid var(--border-color);
 background: #fff;
 display: flex;
 flex-direction: column;
 gap: 2px;
 }
 .efektivitas-summary-pill.tone-green { border-color: #a7f3d0; background: #ecfdf5; }
 .efektivitas-summary-pill.tone-red { border-color: #fecaca; background: #fef2f2; }
 .efektivitas-summary-pill.tone-gray { border-color: #e2e8f0; background: #f8fafc; }
 .efektivitas-summary-count {
 font-size: 22px;
 font-weight: 800;
 font-family: 'JetBrains Mono', monospace;
 }
 .efektivitas-summary-pill.tone-green .efektivitas-summary-count { color: #065f46; }
 .efektivitas-summary-pill.tone-red .efektivitas-summary-count { color: #991b1b; }
 .efektivitas-summary-label {
 font-size: 11.5px;
 font-weight: 700;
 color: var(--text-primary);
 }
 .efektivitas-summary-sub {
 font-size: 10.5px;
 color: var(--text-secondary);
 }

 .efektivitas-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 16px;
 }
 @media (max-width: 900px) {
 .efektivitas-grid { grid-template-columns: 1fr; }
 }
 .efektivitas-col-header {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 font-size: 12.5px;
 font-weight: 700;
 padding: 6px 14px;
 border-radius: 20px;
 margin-bottom: 10px;
 }
 .efektivitas-col.efektif .efektivitas-col-header { background: #d1fae5; color: #065f46; }
 .efektivitas-col.tidak-efektif .efektivitas-col-header { background: #fee2e2; color: #991b1b; }

 .efektivitas-card {
 background: #fff;
 border: 1px solid var(--border-color);
 border-left: 3px solid var(--border-color-strong);
 border-radius: var(--radius-sm);
 padding: 12px 14px;
 margin-bottom: 8px;
 }
 .efektivitas-card.tone-green { border-left-color: var(--success-color); }
 .efektivitas-card.tone-red { border-left-color: var(--danger-color); }
 .efektivitas-card.tone-gray { border-left-color: #cbd5e1; }
 .efektivitas-card-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 8px;
 margin-bottom: 4px;
 }
 .efektivitas-card-nama { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }
 .efektivitas-card-persen {
 font-size: 11.5px;
 font-weight: 700;
 font-family: 'JetBrains Mono', monospace;
 color: var(--text-muted);
 }
 .efektivitas-card-alasan { font-size: 11.5px; color: var(--text-secondary); line-height: 1.45; margin: 0; }
 .realokasi-empty { font-size: 12px; color: var(--text-muted); font-style: italic; }

 @media print {
 body { background: white; padding: 0; }
 .container { border: none; box-shadow: none; max-width: 100%; }
 .btn-print { display: none; }
 }
 </style>
</head>
<body>

 <div class="container">
 <!-- TOP BAR -->
 <div class="sroi-header">
 <div class="sroi-header-left">
 <span class="sroi-header-icon"></span>
 <h2>Analisis RKA</h2>
 <span class="tab-year-badge">DOKUMEN RESMI BAPPERIDA</span>
 </div>
 <button class="btn-print" onclick="window.print()">
 Cetak / Simpan PDF
 </button>
 </div>

 <div class="sroi-body">

 <!-- ══════════ 1. HEADER ANALISIS (NAMA OPD, PROGRAM, KEGIATAN, SUB KEGIATAN, PAGU, TAHUN) ══════════ -->
      <div class="rka-hero">
        <div class="rka-hero-row">
          <div class="rka-hero-label">NAMA OPD</div>
          <div class="rka-hero-main-val">${cleanedOpd}</div>
        </div>

        <div class="rka-hero-row">
          <div class="rka-hero-label">PROGRAM</div>
          <div class="rka-hero-text-val">${program}</div>
        </div>

        <div class="rka-hero-row">
          <div class="rka-hero-label">KEGIATAN</div>
          <div class="rka-hero-text-val">${kegiatan}</div>
        </div>

        <div class="rka-hero-row">
          <div class="rka-hero-label">SUB KEGIATAN</div>
          <div class="rka-hero-text-val">${subKegiatan}</div>
        </div>

        <!-- PAGU (kiri) & TAHUN (kanan) -->
        <div class="rka-hero-split-grid">
          <div class="rka-hero-col-left">
            <div class="rka-hero-item">
              <div class="rka-hero-label">PAGU ANGGARAN</div>
              <div class="pagu-anggaran-box">
                <div class="tab-amount-num">${formatRupiah(paguVal)}</div>
              </div>
            </div>
          </div>

          <div class="rka-hero-col-right">
 <div class="rka-hero-label" style="margin-bottom: 6px;">TAHUN ANGGARAN</div>
 <div class="tahun-anggaran-plain">
 <span class="tahun-anggaran-year">TAHUN ${currentTahun}</span>
 <span class="tab-year-badge">TAHUN BERJALAN</span>
 </div>
 </div>
 </div>
 </div>

 <!-- ══════════ 2. INDIKATOR & TARGET KINERJA ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><span class="icon-badge"></span> Indikator &amp; Target Kinerja</div>
 <div class="indikator-anggaran-card">
 <div class="indikator-col-header">
 <span></span> Target Kinerja per Indikator
 </div>
 ${indikatorList.length > 0 ? indikatorList.map((row, i) => `
 <div class="indikator-item-card">
 <div class="indikator-item-top">
 <span class="indikator-item-level">${row.level || `INDIKATOR #${i+1}`}</span>
 <span class="indikator-item-target">${row.target || '-'}</span>
 </div>
 <div class="indikator-item-nama">${row.tolok_ukur || row.indikator || row.nama || '-'}</div>
 ${Array.isArray(row.rincian) && row.rincian.length ? `<details class="indikator-rincian"><summary>Lihat rincian isi (${row.rincian.length} item)</summary><ol class="indikator-rincian-list">${row.rincian.map(it => `<li><strong>${escRincian(it.nama)}</strong>${it.isi ? `<span>${escRincian(it.isi)}</span>` : ''}</li>`).join('')}</ol></details>` : ''}
 </div>
 `).join('') : `
 <div class="indikator-item-card">
 <div class="indikator-item-top">
 <span class="indikator-item-level">TARGET OUTPUT</span>
 <span class="indikator-item-target">${doc.target || doc.targetKuantitatif || '100%'}</span>
 </div>
 <div class="indikator-item-nama">${subKegiatan}</div>
 </div>
 `}
 </div>
 </div>

 <!-- ══════════ 3. ANALISIS KESESUAIAN ANGGARAN DENGAN TARGET KINERJA ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><span class="icon-badge"></span> Analisis Kesesuaian Anggaran dengan Target Kinerja</div>

 ${kesesuaian ? `
 <div class="kesesuaian-card ${kesesuaianClass}">
 <div class="kesesuaian-top">
 <span class="kesesuaian-icon">${kesesuaianIcon}</span>
 <span class="kesesuaian-title">Kesesuaian Anggaran Tahun ${currentTahun} dengan Target Kinerja</span>
 <span class="kesesuaian-status-pill">${kesesuaian.status || 'Sesuai'}</span>
 </div>
 <p class="kesesuaian-penjelasan">${kesesuaian.penjelasan || 'Alokasi anggaran dinilai memadai untuk mencapai target kinerja yang ditetapkan.'}</p>
 ${kesesuaian.estimasi_biaya_per_output ? `
 <p class="kesesuaian-estimasi"><span></span> Estimasi biaya per output: <strong>${kesesuaian.estimasi_biaya_per_output}</strong></p>
 ` : ''}
 ${kesesuaian.proyeksi_pencapaian_target ? `
 <div class="proyeksi-target-box ${proyeksiClass}">
 <div class="proyeksi-target-top">
 <span class="proyeksi-target-icon">${proyeksiIcon}</span>
 <span class="proyeksi-target-label">Apakah anggaran ini akan menyentuh target?</span>
 <span class="proyeksi-target-pill">${kesesuaian.proyeksi_pencapaian_target}</span>
 </div>
 ${kesesuaian.alasan_proyeksi_target ? `<p class="proyeksi-target-alasan">${kesesuaian.alasan_proyeksi_target}</p>` : ''}
 </div>
 ` : ''}
 </div>
 ` : ''}

 <div class="justifikasi-card">
 <div class="justifikasi-label">Justifikasi Outcome</div>
 <p class="justifikasi-text">${justifikasiOutcome}</p>
 </div>
 </div>

 <!-- ══════════ 4. ANALISIS KOMPONEN BELANJA & REKOMENDASI BELANJA ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><span class="icon-badge"></span> Analisis Komponen Belanja &amp; Rekomendasi Belanja</div>

 <div class="belanja-rekomendasi-grid">
 <!-- Kolom Kiri: Analisis Komponen Belanja -->
 <div class="belanja-col">
 <div class="belanja-col-header"><span></span> Analisis Komponen Belanja</div>
 <div class="chart-card">
 <div class="pie-canvas-wrap"><canvas id="pieAwal"></canvas></div>
 <ul class="pie-legend">
 ${awalData.map((item, i) => `
 <li>
 <span class="dot" style="background: ${palette[i % palette.length]}"></span>
 <span class="legend-name">${item.nama}</span>
 <span class="legend-pct">${item.persen}%</span>
 </li>
 `).join('')}
 </ul>
 </div>

 <div class="belanja-subblock-label">Status Efisiensi per Rekening</div>
 <div class="efficiency-summary-card">
 <div class="efficiency-list">
 ${efficiencyList.map(item => `
 <div class="efficiency-list-item is-open" onclick="toggleEfficiencyDetail(this)" title="Klik untuk melipat / membuka detail">
 <div class="efficiency-list-row">
 <span class="efficiency-item-name">${item.nama}</span>
 <span class="efficiency-item-status ${item.class}">
 ${item.icon} ${item.status}
 </span>
 <span class="efficiency-item-chevron">▲</span>
 </div>
 <div class="efficiency-item-reason">${item.detail}</div>
 </div>
 `).join('')}
 </div>
 </div>
 </div>

 <!-- Kolom Kanan: Rekomendasi Belanja -->
 <div class="belanja-col">
 <div class="belanja-col-header accent-ai"><span></span> Rekomendasi Belanja</div>
 <div class="chart-card">
 <div class="pie-canvas-wrap"><canvas id="pieUsulan"></canvas></div>
 <ul class="pie-legend">
 ${usulanData.map((item, i) => `
 <li>
 <span class="dot" style="background: ${palette[i % palette.length]}"></span>
 <span class="legend-name">${item.nama}</span>
 <span class="legend-pct">${item.persen}%</span>
 </li>
 `).join('')}
 </ul>
 </div>

 <div class="belanja-subblock-label">Alasan Pengurangan &amp; Realokasi Anggaran</div>
 <div class="realokasi-stack">
 <div class="realokasi-col kurangi">
 <div class="realokasi-header"><span>⊖</span> Kenapa Harus Dikurangi?</div>
 ${kurangiList.length > 0 ? kurangiList.map(j => `
 <div class="realokasi-card">
 <div class="realokasi-top">
 <span class="realokasi-kode">${j.kode || '-'}</span>
 <div class="realokasi-nilai-group">
 ${j.nilai_awal ? `<span class="realokasi-nilai-awal">${formatRupiah(j.nilai_awal)}</span>` : ''}
 <span class="realokasi-nilai minus">-${formatRupiah(j.nilai_dikurangi)}</span>
 </div>
 </div>
 <div class="realokasi-nama">${j.rekening_nama}</div>
 <div class="realokasi-alasan">${j.alasan_dikurangi}</div>
 </div>
 `).join('') : '<p class="realokasi-empty">Tidak ada rekomendasi pengurangan.</p>'}
 </div>

 <div class="realokasi-col tambah">
 <div class="realokasi-header"><span>⊕</span> Kenapa Harus Dialokasikan ke Sini?</div>
 ${tambahList.length > 0 ? tambahList.map(j => `
 <div class="realokasi-card">
 <div class="realokasi-top">
 <span class="realokasi-kode">${j.kode || '-'}</span>
 <div class="realokasi-nilai-group">
 ${j.nilai_awal ? `<span class="realokasi-nilai-awal">Awal: ${formatRupiah(j.nilai_awal)}</span>` : ''}
 <span class="realokasi-nilai plus">+${formatRupiah(j.nilai_ditambah)}</span>
 </div>
 </div>
 <div class="realokasi-nama">${j.rekening_nama}</div>
 <div class="realokasi-alasan">${j.alasan_dialokasikan}</div>
 </div>
 `).join('') : '<p class="realokasi-empty">Tidak ada rekomendasi penambahan.</p>'}
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- ══════════ 5. VALUASI & RASIO NILAI PRAKIRAAN DAMPAK ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><span class="icon-badge"></span> Valuasi &amp; Rasio Nilai Prakiraan Dampak</div>
 <div class="sroi-ratio-card ${sroiMetrics.tone}">
 <div class="sroi-ratio-top">
 <span class="sroi-ratio-eyebrow">Rasio Nilai Prakiraan Dampak</span>
 <span class="sroi-status-pill">${sroiMetrics.shortLabel} · ${sroiMetrics.sroiStatus}</span>
 </div>
 <div class="sroi-ratio-value">${sroiMetrics.sroiScore}</div>
 <div class="sroi-ratio-formula">Rasio Nilai Prakiraan Dampak = Nilai Dampak yang Dihasilkan Saat Ini ÷ Nilai Input</div>
 </div>

 <!-- 4 Pilar Valuasi Utama SROI -->
 <div class="sroi-stats-grid">
 <div class="sroi-stat-card">
 <div class="stat-label">Nilai Input (Pagu)</div>
 <div class="stat-value">${formatRupiah(sroiMetrics.valueOfInputs)}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Total Nilai Dampak Sosial</div>
 <div class="stat-value">${formatRupiah(sroiMetrics.totalNilaiDampak)}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Total Dampak Bersih</div>
 <div class="stat-value positive">${formatRupiah(sroiMetrics.netImpact)}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Dampak Nilai Saat Ini</div>
 <div class="stat-value positive">${formatRupiah(sroiMetrics.pvImpact)}</div>
 </div>
 </div>

 <!-- Faktor Penyesuaian Dampak Sosial -->
 <div class="sroi-factors-card">
 <div class="sroi-factors-title"> Faktor Penyesuaian Dampak Sosial</div>
 <div class="sroi-factors-grid">
 <div class="sroi-factor-item">
 <span class="factor-name">Kerugian Bobot</span>
 <span class="factor-val">${sroiMetrics.deadweight}%</span>
 <span class="factor-hint">Outcome tanpa intervensi</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Atribusi</span>
 <span class="factor-val">${sroiMetrics.attribution}%</span>
 <span class="factor-hint">Kontribusi pihak lain</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Pergeseran Manfaat</span>
 <span class="factor-val">${sroiMetrics.displacement}%</span>
 <span class="factor-hint">Pengurangan manfaat lain</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Penyusutan</span>
 <span class="factor-val">${sroiMetrics.dropOff}%</span>
 <span class="factor-hint">Penurunan multi-tahun</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Tingkat Diskonto</span>
 <span class="factor-val">${sroiMetrics.discountRate}%</span>
 <span class="factor-hint">Diskonto masa depan</span>
 </div>
 </div>
 </div>

 <!-- Rantai Transparansi Perhitungan SROI -->
 <div class="sroi-transparency-card">
 <div class="transparency-header">
 <span class="icon"></span> Rantai Transparansi Perhitungan SROI
 </div>
 <div class="transparency-flow">
 <div class="flow-step">
 <div class="step-num">1</div>
 <div class="step-body">
 <div class="step-title">Nilai Input</div>
 <div class="step-val">${formatRupiah(sroiMetrics.valueOfInputs)}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">2</div>
 <div class="step-body">
 <div class="step-title">Nilai Dampak</div>
 <div class="step-val">${formatRupiah(sroiMetrics.totalNilaiDampak)}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">3</div>
 <div class="step-body">
 <div class="step-title">Kerugian Bobot (${sroiMetrics.deadweight}%)</div>
 <div class="step-val">${formatRupiah(sroiMetrics.dampakSetelahDeadweight)}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">4</div>
 <div class="step-body">
 <div class="step-title">Dampak Bersih</div>
 <div class="step-val">${formatRupiah(sroiMetrics.netImpact)}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">5</div>
 <div class="step-body">
 <div class="step-title">Dampak Nilai Saat Ini</div>
 <div class="step-val">${formatRupiah(sroiMetrics.pvImpact)}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step highlight">
 <div class="step-num">6</div>
 <div class="step-body">
 <div class="step-title">Rasio Nilai Prakiraan Dampak</div>
 <div class="step-val">${sroiMetrics.sroiScore}</div>
 <div class="step-hint" style="font-size: 11px; opacity: 0.9; margin-top: 2px;">${sroiMetrics.shortLabel}</div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- ══════════ 6. RINGKASAN EFEKTIF & INEFEKTIF PER REKENING ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><span class="icon-badge"></span> Ringkasan Efektif &amp; Inefektif per Rekening</div>

 <!-- Strip ringkasan jumlah rekening -->
 <div class="efektivitas-summary-strip">
 <div class="efektivitas-summary-pill tone-green">
 <span class="efektivitas-summary-count">${efektifRekeningList.length}</span>
 <span class="efektivitas-summary-label">Rekening Efektif</span>
 <span class="efektivitas-summary-sub">${efektifPersenTotal ? '≈ ' + efektifPersenTotal.toFixed(1) + '% dari pagu' : ''}</span>
 </div>
 <div class="efektivitas-summary-pill tone-red">
 <span class="efektivitas-summary-count">${tidakEfektifRekeningList.length}</span>
 <span class="efektivitas-summary-label">Rekening Tidak Efektif</span>
 <span class="efektivitas-summary-sub">${tidakEfektifPersenTotal ? '≈ ' + tidakEfektifPersenTotal.toFixed(1) + '% dari pagu' : ''}</span>
 </div>
 ${belumDinilaiRekeningList.length > 0 ? `
 <div class="efektivitas-summary-pill tone-gray">
 <span class="efektivitas-summary-count">${belumDinilaiRekeningList.length}</span>
 <span class="efektivitas-summary-label">Belum Dapat Dinilai</span>
 </div>
 ` : ''}
 </div>

 <!-- Dua kolom: Efektif vs Tidak Efektif / Perlu Perhatian -->
 <div class="efektivitas-grid">
 <div class="efektivitas-col efektif">
 <div class="efektivitas-col-header">
 <span></span> Efektif
 </div>
 ${efektifRekeningList.length > 0 ? efektifRekeningList.map(r => `
 <div class="efektivitas-card tone-green">
 <div class="efektivitas-card-top">
 <span class="efektivitas-card-nama">${r.nama}</span>
 ${r.persen !== null ? `<span class="efektivitas-card-persen">${r.persen}%</span>` : ''}
 </div>
 <p class="efektivitas-card-alasan">${r.alasan}</p>
 </div>
 `).join('') : '<p class="realokasi-empty">Belum ada rekening yang terklasifikasi efektif.</p>'}
 </div>

 <div class="efektivitas-col tidak-efektif">
 <div class="efektivitas-col-header">
 <span></span> Tidak Efektif / Perlu Perhatian
 </div>
 ${tidakEfektifRekeningList.length > 0 ? tidakEfektifRekeningList.map(r => `
 <div class="efektivitas-card tone-red">
 <div class="efektivitas-card-top">
 <span class="efektivitas-card-nama">${r.nama}</span>
 ${r.persen !== null ? `<span class="efektivitas-card-persen">${r.persen}%</span>` : ''}
 </div>
 <p class="efektivitas-card-alasan">${r.alasan}</p>
 </div>
 `).join('') : ''}
 ${belumDinilaiRekeningList.length > 0 ? belumDinilaiRekeningList.map(r => `
 <div class="efektivitas-card tone-gray">
 <div class="efektivitas-card-top">
 <span class="efektivitas-card-nama">${r.nama}</span>
 <span class="efektivitas-card-persen">Belum Dinilai</span>
 </div>
 <p class="efektivitas-card-alasan">${r.alasan}</p>
 </div>
 `).join('') : ''}
 ${(!tidakEfektifRekeningList.length && !belumDinilaiRekeningList.length) ? '<p class="realokasi-empty">Tidak ada rekening yang terklasifikasi tidak efektif.</p>' : ''}
 </div>
 </div>
 </div>

 </div>
 </div>

 <script>
 window.addEventListener('DOMContentLoaded', () => {
 const palette = ${JSON.stringify(palette)};

 const awalLabels = ${JSON.stringify(awalData.map(d => d.nama))};
 const awalValues = ${JSON.stringify(awalData.map(d => Number(d.persen) || 0))};

 const usulanLabels = ${JSON.stringify(usulanData.map(d => d.nama))};
 const usulanValues = ${JSON.stringify(usulanData.map(d => Number(d.persen) || 0))};

 const pieAwalCtx = document.getElementById('pieAwal');
 if (pieAwalCtx && awalValues.length > 0) {
 new Chart(pieAwalCtx, {
 type: 'pie',
 data: {
 labels: awalLabels,
 datasets: [{
 data: awalValues,
 backgroundColor: awalLabels.map((_, i) => palette[i % palette.length]),
 borderWidth: 2,
 borderColor: '#ffffff',
 hoverBorderWidth: 3
 }]
 },
 options: {
 responsive: true,
 maintainAspectRatio: false,
 plugins: { legend: { display: false } }
 }
 });
 }

 const pieUsulanCtx = document.getElementById('pieUsulan');
 if (pieUsulanCtx && usulanValues.length > 0) {
 new Chart(pieUsulanCtx, {
 type: 'pie',
 data: {
 labels: usulanLabels,
 datasets: [{
 data: usulanValues,
 backgroundColor: usulanLabels.map((_, i) => palette[i % palette.length]),
 borderWidth: 2,
 borderColor: '#ffffff',
 hoverBorderWidth: 3
 }]
 },
 options: {
 responsive: true,
 maintainAspectRatio: false,
 plugins: { legend: { display: false } }
 }
 });
 }

 window.toggleEfficiencyDetail = function(el) {
 el.classList.toggle('is-open');
 const reason = el.querySelector('.efficiency-item-reason');
 const chevron = el.querySelector('.efficiency-item-chevron');
 if (el.classList.contains('is-open')) {
 if (reason) reason.style.display = 'block';
 if (chevron) chevron.textContent = '▲';
 } else {
 if (reason) reason.style.display = 'none';
 if (chevron) chevron.textContent = '▼';
 }
 };
 });
 </script>

 <!-- Embedded Raw Data (For Conversion to JSON Backup) -->
 <script id="raw-backup-data" type="application/json">
 ${safeJsonString}
 </script>
</body>
</html>`;
}

/**
 * Trigger pengunduhan file HTML mandiri ke browser
 */
export function downloadAnalysisHtmlReport(doc) {
 if (!doc) return;
 const htmlContent = generateAnalysisHtml(doc);
 const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 const safeTitle = (doc.namaDokumen || doc.program || doc.id || 'analisis_rka')
 .replace(/[/\\?%*:|"<>]/g, '_')
 .replace(/\s+/g, '_');
 a.download = `Hasil_Analisis_SROI_${safeTitle}.html`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
}
