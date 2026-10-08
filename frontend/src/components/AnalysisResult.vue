<template>
 <div class="sroi-result">

 <!-- ══════════ TOP BAR ══════════ -->
 <div class="sroi-header">
 <div class="sroi-header-left">
 <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;"><path d="M3 17l4-8 4 3 4-6 4 8" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17h18" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/></svg>
 <h2>Analisis Valuasi Prakiraan Dampak Program</h2>
 <div v-if="analysisVersions.length > 1" class="version-selector-wrap">
 <span class="version-label">Versi:</span>
 <select v-model="selectedVersionId" class="sroi-version-select" @change="onSwitchVersion">
 <option v-for="v in analysisVersions" :key="v.versionId" :value="v.versionId">
 {{ v.versionName }}
 </option>
 </select>
 </div>
 <span v-else-if="analysis.selectedVersionName" class="model-badge version-pill">
 {{ analysis.selectedVersionName }}
 </span>
 </div>

 <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
 <button
 class="btn btn-secondary btn-sm"
 @click="showEditManual = true"
 title="Edit manual seluruh bagian hasil analisis (disimpan sebagai versi baru)"
 style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: var(--primary-color, #1B4D46); background: var(--primary-glow, rgba(27,77,70,0.12)); border-color: var(--primary-color, #1B4D46);"
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg> Edit Manual
 </button>
 <button
 class="btn btn-secondary btn-sm"
 @click="showEditAi = true"
 title="Minta AI merevisi hasil analisis berdasarkan instruksi Anda (ada pratinjau sebelum disimpan)"
 style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe;"
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg> Edit dengan AI
 </button>
 <button
 class="btn btn-secondary btn-sm"
 @click="openReuploadModal"
 title="Unggah Ulang PDF & Analisis Ulang (Perbaiki Hasil Analisis)"
 style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #0284c7; background: #f0f9ff; border-color: #bae6fd;"
 >
 <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Unggah Ulang PDF
 </button>
 <button
 class="btn btn-secondary btn-sm"
 :disabled="isMuatUlang"
 @click="handleMuatUlangPdf"
 title="Generate ulang analisis AI tanpa unggah PDF lagi"
 style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #0284c7; background: #f0f9ff; border-color: #bae6fd;"
 :style="isMuatUlang ? 'opacity:0.6; cursor:not-allowed;' : ''"
 >
 <i :data-lucide="isMuatUlang ? 'loader-2' : 'rotate-cw'" :class="{ 'spin-anim': isMuatUlang }" style="width:14px;height:14px;"></i>
 {{ isMuatUlang ? (muatUlangText || 'Memuat ulang…') : 'Muat Ulang PDF' }}
 </button>
 <button
 class="btn btn-secondary btn-sm"
 @click="handleDownloadReport"
 title="Unduh Hasil Analisis Lengkap"
 style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 12px; font-weight: 600;"
 >
 <i data-lucide="download" style="width:14px;height:14px;"></i> Unduh Laporan
 </button>
 <button
 class="btn btn-delete-rka"
 @click="openDeleteConfirm"
 title="Hapus dokumen ini dari arsip"
 style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 12px; background: #ef4444; color: #fff; border: none; border-radius: 7px; cursor: pointer; font-weight: 600;"
 >
 <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Hapus
 </button>
 <span v-if="analysis.model" class="model-badge">{{ analysis.model }}</span>
 <button class="btn btn-secondary btn-sm" @click="goBack" style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 12px;">
 <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> Kembali ke Arsip
 </button>
 </div>
 </div>

 <!-- ══ MODAL EDIT MANUAL & EDIT DENGAN AI (disimpan sebagai versi baru) ══ -->
 <AnalysisEditManualModal
 v-if="showEditManual"
 :analysis="analysis"
 @close="showEditManual = false"
 @saved="onEditSaved"
 />
 <AnalysisEditAiModal
 v-if="showEditAi"
 :analysis="analysis"
 @close="showEditAi = false"
 @saved="onEditSaved"
 />

 <!-- ══ MODAL KONFIRMASI HAPUS (ketik untuk konfirmasi, ala GitHub) ══ -->
 <div v-if="showDeleteConfirm" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;">
 <div style="background:var(--bg-card,#fff);border-radius:14px;padding:32px 28px;max-width:440px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
 <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
 <i data-lucide="alert-triangle" style="color:#ef4444;width:24px;height:24px;"></i>
 <h3 style="margin:0;font-size:1.1rem;color:var(--text-primary,#111);">Hapus 1 dokumen?</h3>
 </div>
 <p style="margin:0 0 8px;color:var(--text-secondary,#555);font-size:0.9rem;">
 Dokumen berikut akan dihapus dari arsip secara permanen.
 </p>
 <ul style="margin:0 0 8px;padding-left:20px;color:var(--text-primary,#111);font-size:0.88rem;">
 <li>{{ analysis.namaDokumen || analysis.id }}{{ analysis.subKegiatan ? ' — ' + analysis.subKegiatan : '' }}</li>
 </ul>
 <p style="margin:0 0 16px;color:#ef4444;font-size:0.82rem;">Data yang telah dihapus tidak dapat dikembalikan.</p>
 <p style="margin:0 0 8px;color:var(--text-secondary,#555);font-size:0.85rem;">
 Untuk mengonfirmasi, ketik <strong style="color:var(--text-primary,#111);">{{ deleteConfirmTarget }}</strong> di bawah ini:
 </p>
 <input
 v-model="deleteConfirmInput"
 type="text"
 autocomplete="off"
 spellcheck="false"
 :placeholder="deleteConfirmTarget"
 style="width:100%;box-sizing:border-box;padding:8px 12px;border-radius:7px;border:1px solid var(--border-color,#ddd);font-size:0.88rem;margin-bottom:22px;"
 @keyup.enter="handleDelete"
 />
 <div style="display:flex;gap:10px;justify-content:flex-end;">
 <button @click="closeDeleteConfirm" style="padding:8px 18px;border-radius:7px;border:1px solid var(--border-color,#ddd);background:transparent;cursor:pointer;font-size:0.88rem;">Batal</button>
 <button
 @click="handleDelete"
 :disabled="deleteConfirmInput !== deleteConfirmTarget"
 :style="{
 padding: '8px 18px',
 borderRadius: '7px',
 background: deleteConfirmInput === deleteConfirmTarget ? '#ef4444' : '#f3a8a8',
 color: '#fff',
 border: 'none',
 cursor: deleteConfirmInput === deleteConfirmTarget ? 'pointer' : 'not-allowed',
 fontSize: '0.88rem',
 fontWeight: 600,
 }"
 >Ya, Hapus</button>
 </div>
 </div>
 </div>

 <!-- ══ MODAL UNGGAH ULANG & RE-ANALISIS PDF ══ -->
 <div v-if="showReuploadModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;">
 <div style="background:var(--bg-card,#fff);border-radius:14px;padding:28px 24px;max-width:540px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
 <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
 <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(14, 107, 94, 0.12); color: var(--primary-color, #1B4D46); display: flex; align-items: center; justify-content: center;">
 <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
 </div>
 <div>
 <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary, #111);">Unggah Ulang PDF & Analisis Ulang</h3>
 <span style="font-size: 0.8rem; color: var(--text-secondary, #666);">
 Perbaiki hasil analisis dengan mengevaluasi ulang berkas PDF dokumen ini
 </span>
 </div>
 </div>

 <!-- Info Dokumen -->
 <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin: 14px 0; font-size: 0.82rem; display: flex; flex-direction: column; gap: 4px;">
 <div style="display: flex; justify-content: space-between;">
 <span style="color: #64748b;">ID Dokumen:</span>
 <span style="font-weight: 700; font-family: monospace;">{{ analysis.id }}</span>
 </div>
 <div style="display: flex; justify-content: space-between; gap: 10px;">
 <span style="color: #64748b; flex-shrink: 0;">Nama Dokumen:</span>
 <span style="font-weight: 600; max-width: 65%; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="analysis.namaDokumen || analysis.program || '-'">{{ analysis.namaDokumen || analysis.program || '-' }}</span>
 </div>
 <div style="display: flex; justify-content: space-between; gap: 10px;">
 <span style="color: #64748b; flex-shrink: 0;">OPD / SKPD:</span>
 <span style="font-weight: 600; max-width: 65%; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="cleanOpdName(analysis.opd || analysis.perangkatDaerah || '-')">{{ cleanOpdName(analysis.opd || analysis.perangkatDaerah || '-') }}</span>
 </div>
 <div style="display: flex; justify-content: space-between; align-items: center;">
 <span style="color: #64748b;">Nilai Prakiraan Dampak Saat Ini:</span>
 <span :style="reuploadSroiBadgeStyle" style="padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700;">
 {{ reuploadSroiBadge.scoreText }} · {{ reuploadSroiBadge.label }}
 </span>
 </div>
 </div>

 <!-- Dropzone -->
 <div
 v-if="!isReanalyzing"
 style="border: 2px dashed #cbd5e1; border-radius: 10px; padding: 22px 16px; text-align: center; cursor: pointer; background: #fafafa; transition: all 0.2s ease;"
 @click="triggerReuploadFileInput"
 >
 <input
 type="file"
 ref="reuploadFileInput"
 accept=".pdf,application/pdf"
 style="display: none;"
 @change="handleReuploadFileSelect"
 />
 <div v-if="!selectedReuploadFile" style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
 <i data-lucide="upload-cloud" style="width: 36px; height: 36px; color: var(--primary-color, #1B4D46);"></i>
 <div style="font-size: 0.88rem; color: #334155;"><strong>Klik untuk memilih berkas PDF</strong> atau seret ke sini</div>
 <div style="font-size: 0.75rem; color: #94a3b8;">Format berkas PDF RKA (Maksimal 25MB)</div>
 </div>
 <div v-else style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;" @click.stop>
 <div style="display: flex; align-items: center; gap: 8px; text-align: left;">
 <i data-lucide="file-text" style="width: 20px; height: 20px; color: var(--primary-color, #1B4D46);"></i>
 <div>
 <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b;">{{ selectedReuploadFile.name }}</div>
 <div style="font-size: 0.72rem; color: #64748b;">{{ (selectedReuploadFile.size / 1024).toFixed(1) }} KB</div>
 </div>
 </div>
 <button class="btn btn-secondary btn-sm" @click="selectedReuploadFile = null" style="font-size: 0.75rem; padding: 3px 8px;">Ganti</button>
 </div>
 </div>

 <!-- Progress -->
 <div v-else style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 10px 0;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
 <span style="font-size: 0.82rem; font-weight: 600; color: #1e293b;">{{ reuploadProgressText }}</span>
 <span style="font-size: 0.82rem; font-weight: 800; color: var(--primary-color, #1B4D46);">{{ reuploadProgress }}%</span>
 </div>
 <div style="height: 6px; border-radius: 3px; background: #f1f5f9; overflow: hidden;">
 <div :style="{ width: reuploadProgress + '%' }" style="height: 100%; background: var(--primary-color, #1B4D46); transition: width 0.3s ease;"></div>
 </div>
 </div>

 <!-- Actions -->
 <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px;">
 <button :disabled="isReanalyzing" @click="showReuploadModal = false" style="padding: 7px 16px; border-radius: 7px; border: 1px solid #ddd; background: transparent; cursor: pointer; font-size: 0.85rem;">Batal</button>
 <button :disabled="!selectedReuploadFile || isReanalyzing" @click="executeReanalysis" style="display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 7px; background: var(--primary-color, #1B4D46); color: #fff; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
 <i :data-lucide="isReanalyzing ? 'loader-2' : 'play-circle'" :class="{ 'spin-anim': isReanalyzing }" style="width: 15px; height: 15px;"></i>
 <span>{{ isReanalyzing ? 'Menganalisis...' : 'Mulai Analisis Ulang' }}</span>
 </button>
 </div>
 </div>
 </div>

 <div class="sroi-body">

 <!-- ══════════ 1. HEADER ANALISIS (NAMA OPD, PROGRAM, KEGIATAN, SUB KEGIATAN, PAGU & TAHUN ANGGARAN) ══════════ -->
      <div class="rka-hero">
        <!-- 1. NAMA OPD -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">PERANGKAT DAERAH</div>
          <div class="rka-hero-main-val">{{ cleanOpdName(analysis.opd || analysis.perangkatDaerah || '-') }}</div>
        </div>

        <!-- 2. PROGRAM -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">PROGRAM</div>
          <div class="rka-hero-text-val">{{ analysis.namaProgram || analysis.program || '-' }}</div>
        </div>

        <!-- 3. KEGIATAN -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">KEGIATAN</div>
          <div class="rka-hero-text-val">{{ analysis.kegiatan || analysis.namaKegiatan || '-' }}</div>
        </div>

        <!-- 4. SUB KEGIATAN -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">SUB KEGIATAN</div>
          <div class="rka-hero-text-val">{{ analysis.subKegiatan || '-' }}</div>
        </div>

        <!-- 5. PAGU ANGGARAN (kiri) & TAHUN ANGGARAN (kanan) -->
        <div class="rka-hero-split-grid">

          <!-- Kolom Kiri -->
          <div class="rka-hero-col-left">
            <div class="rka-hero-item">
 <div class="rka-hero-label">PAGU ANGGARAN</div>
 <div class="pagu-anggaran-box">
 <div class="tab-amount-num">{{ formatRupiah(currentYearCard.jumlah) }}</div>
 <div class="tab-delta-info" :class="currentYearCard.deltaClass" v-if="currentYearCard.hasDelta">
 <span class="tab-arrow">{{ currentYearCard.arrow }}</span>
 {{ currentYearCard.deltaLabel }} dari Tahun {{ currentYearCard.prevTahun }} ({{ currentYearCard.deltaPercent }}%)
 </div>
 </div>
 </div>
          </div>

          <!-- Kolom Kanan: TAHUN ANGGARAN -->
 <div class="rka-hero-col-right">
 <div class="rka-hero-label" style="margin-bottom: 8px;">TAHUN ANGGARAN</div>

 <div class="tahun-anggaran-plain">
 <span class="tahun-anggaran-year">TAHUN {{ currentYearCard.tahun }}</span>
 <span v-if="currentYearCard.isTahunBerjalan" class="tab-year-badge">TAHUN BERJALAN</span>
 </div>
 </div>

 </div>
 </div>

 <!-- ══════════ 2. INDIKATOR & TARGET KINERJA ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;flex-shrink:0;"><circle cx="12" cy="12" r="9" stroke="#1B4D46" stroke-width="2"/><circle cx="12" cy="12" r="5" stroke="#1B4D46" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="#1B4D46"/></svg> Indikator &amp; Target Kinerja</div>
 <div class="indikator-anggaran-card">
 <p
 v-if="!hasIndikatorKinerja && !hasAnggaranTahunan"
 class="indikator-empty"
 >
 Data indikator kinerja &amp; anggaran per tahun belum tersedia untuk dokumen ini.
 Ini biasanya terjadi pada dokumen yang dianalisis sebelum fitur ini ditambahkan —
 silakan unggah &amp; analisis ulang PDF-nya agar datanya terekstrak.
 </p>

 <div class="indikator-grid" v-else>
 <!-- Target Kinerja per Indikator -->
 <div class="indikator-col target-col">
 <div class="indikator-col-header">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="9" stroke="#0ea5e9" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="#0ea5e9" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="#0ea5e9"/></svg> Target Kinerja per Indikator
 </div>
 <div
 v-for="(row, i) in analysis.indikatorKinerja"
 :key="'ik' + i"
 class="indikator-item-card"
 >
 <div class="indikator-item-top">
 <span class="indikator-item-level">{{ row.level }}</span>
 <span class="indikator-item-target">{{ row.target }}</span>
 </div>
 <div class="indikator-item-nama">{{ row.tolok_ukur }}</div>
 <details v-if="Array.isArray(row.rincian) && row.rincian.length" class="indikator-rincian">
   <summary>Lihat rincian isi ({{ row.rincian.length }} item)</summary>
   <ol class="indikator-rincian-list">
     <li v-for="(it, j) in row.rincian" :key="'rc' + i + '-' + j">
       <strong>{{ it.nama }}</strong>
       <span v-if="it.isi">{{ it.isi }}</span>
     </li>
   </ol>
 </details>
 </div>
 <p v-if="!hasIndikatorKinerja" class="indikator-empty">
 Tabel Indikator &amp; Tolok Ukur Kinerja tidak ditemukan pada dokumen ini.
 </p>
 </div>
 </div>
 </div>
 </div>

 <!-- ══════════ 3. ANALISIS KESESUAIAN ANGGARAN & OUTCOME ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;flex-shrink:0;"><path d="M12 3v3M6.3 6.3 8.4 8.4M3 12h3m12.7-5.7-2.1 2.1M21 12h-3" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/><path d="m8 15 2.5-5 3 3L16 9" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 20h14" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/></svg> Analisis Kesesuaian Anggaran dengan Target Kinerja</div>

 <!-- Kesesuaian Anggaran Tahun Berjalan vs Target Kinerja -->
 <div v-if="kesesuaian" class="kesesuaian-card" :class="kesesuaianClass">
 <div class="kesesuaian-top">
 <img
 :src="kesesuaianClass === 'ok'
 ? 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'22\' height=\'22\' viewBox=\'0 0 24 24\' fill=\'none\'><circle cx=\'12\' cy=\'12\' r=\'9\' stroke=\'%2322c55e\' stroke-width=\'2\'></circle><path d=\'M8 12l3 3 5-5\' stroke=\'%2322c55e\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'></path></svg>'
 : kesesuaianClass === 'bad'
 ? 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'22\' height=\'22\' viewBox=\'0 0 24 24\' fill=\'none\'><circle cx=\'12\' cy=\'12\' r=\'9\' stroke=\'%23ef4444\' stroke-width=\'2\'></circle><path d=\'M9 9l6 6M15 9l-6 6\' stroke=\'%23ef4444\' stroke-width=\'2\' stroke-linecap=\'round\'></path></svg>'
 : 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'22\' height=\'22\' viewBox=\'0 0 24 24\' fill=\'none\'><path d=\'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z\' stroke=\'%23f59e0b\' stroke-width=\'2\' stroke-linejoin=\'round\'></path><line x1=\'12\' y1=\'9\' x2=\'12\' y2=\'13\' stroke=\'%23f59e0b\' stroke-width=\'2\' stroke-linecap=\'round\'></line><line x1=\'12\' y1=\'17\' x2=\'12.01\' y2=\'17\' stroke=\'%23f59e0b\' stroke-width=\'2\' stroke-linecap=\'round\'></line></svg>'"
 alt="status"
 class="kesesuaian-icon-img"
 style="width:22px;height:22px;vertical-align:middle;"
 />
 <span class="kesesuaian-title">Kesesuaian Anggaran Tahun {{ analysis.tahunRencana }} dengan Target Kinerja</span>
 <span class="kesesuaian-status-pill">{{ kesesuaian.status }}</span>
 </div>
<details class="kesesuaian-detail">
 <summary class="kesesuaian-detail-toggle">Lihat penjelasan &amp; estimasi biaya</summary>
 <div class="kesesuaian-detail-body">
 <p class="kesesuaian-penjelasan">{{ kesesuaian.penjelasan }}</p>
 <p v-if="kesesuaian.estimasi_biaya_per_output" class="kesesuaian-estimasi">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#1B4D46" stroke-width="2"/><path d="M8 12h8M12 8v8" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/></svg> Estimasi biaya per output: <strong>{{ kesesuaian.estimasi_biaya_per_output }}</strong>
 </p>
 </div>
 </details>
 <div v-if="kesesuaian.proyeksi_pencapaian_target" class="proyeksi-target-box" :class="proyeksiClass">
 <div class="proyeksi-target-top">
 <img
 :src="proyeksiClass === 'ok'
 ? 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\'><circle cx=\'12\' cy=\'12\' r=\'9\' stroke=\'%2322c55e\' stroke-width=\'2\'></circle><path d=\'M8 12l3 3 5-5\' stroke=\'%2322c55e\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'></path></svg>'
 : proyeksiClass === 'bad'
 ? 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\'><circle cx=\'12\' cy=\'12\' r=\'9\' stroke=\'%23ef4444\' stroke-width=\'2\'></circle><path d=\'M9 9l6 6M15 9l-6 6\' stroke=\'%23ef4444\' stroke-width=\'2\' stroke-linecap=\'round\'></path></svg>'
 : 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\'><path d=\'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z\' stroke=\'%23f59e0b\' stroke-width=\'2\' stroke-linejoin=\'round\'></path></svg>'"
 alt="proyeksi"
 class="proyeksi-target-icon-img"
 style="width:18px;height:18px;vertical-align:middle;"
 />
 <span class="proyeksi-target-label">Apakah anggaran ini akan menyentuh target?</span>
 <span class="proyeksi-target-pill">{{ kesesuaian.proyeksi_pencapaian_target }}</span>
 </div>
 <p v-if="kesesuaian.alasan_proyeksi_target" class="proyeksi-target-alasan">{{ kesesuaian.alasan_proyeksi_target }}</p>
 </div>
 </div>

 <!-- Justifikasi Outcome -->
 <div class="justifikasi-card">
 <div class="justifikasi-label"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:5px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/></svg>Justifikasi Outcome</div>
 <p class="justifikasi-text">{{ analysis.justifikasiOutcome }}</p>
 </div>
 </div>

 <!-- ══════════ 4. ANALISIS KOMPONEN BELANJA & REKOMENDASI BELANJA ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;flex-shrink:0;"><path d="M6 2h12l3 6H3z" stroke="#1B4D46" stroke-width="2" stroke-linejoin="round"/><path d="M3 8h18v13a1 1 0 01-1 1H4a1 1 0 01-1-1z" stroke="#1B4D46" stroke-width="2" stroke-linejoin="round"/><path d="M9 12h6" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/></svg> Analisis Komponen Belanja &amp; Rekomendasi Belanja</div>

 <div class="belanja-rekomendasi-grid">

 <!-- Kolom Kiri: ANALISIS KOMPONEN BELANJA -->
 <div class="belanja-col">
 <div class="belanja-col-header"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:5px;"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#1B4D46" stroke-width="2"/><line x1="7" y1="8" x2="17" y2="8" stroke="#1B4D46" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="12" x2="17" y2="12" stroke="#1B4D46" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="16" x2="13" y2="16" stroke="#1B4D46" stroke-width="1.5" stroke-linecap="round"/></svg> Analisis Komponen Belanja</div>


 <div class="chart-card chart-card--fit">
 <div class="pie-canvas-wrap"><canvas ref="pieAwalEl"></canvas></div>
 <ul class="pie-legend">
 <li v-for="(item, i) in awalData" :key="'a'+i">
 <span class="dot" :style="{ background: palette[i % palette.length] }"></span>
 <span class="legend-name">{{ item.nama }}</span>
 <span class="legend-pct">{{ item.persen }}%</span>
 </li>
 </ul>
 </div>

 <div class="belanja-subblock-label">Status Efisiensi per Rekening</div>
 <div class="efficiency-summary-card efficiency-summary-card--fit">
 <div class="efficiency-list">
 <div
 v-for="(item, i) in efficiencyList"
 :key="i"
 class="efficiency-list-item"
 :class="{ 'is-open': openRekeningIndexes.has(i) }"
 role="button"
 tabindex="0"
 :aria-expanded="openRekeningIndexes.has(i)"
 @click="toggleRekeningDetail(i)"
 @keydown.enter="toggleRekeningDetail(i)"
 @keydown.space.prevent="toggleRekeningDetail(i)"
 >
 <div class="efficiency-list-row">
 <span class="efficiency-item-name">{{ item.nama }}</span>
 <span class="efficiency-item-status" :class="item.class">
 {{ item.icon }} {{ item.status }}
 </span>
 <span class="efficiency-item-chevron">{{ openRekeningIndexes.has(i) ? '▲' : '▼' }}</span>
 </div>
 <div v-if="openRekeningIndexes.has(i)" class="efficiency-item-reason">
 {{ item.detail }}
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- Kolom Kanan: REKOMENDASI BELANJA -->
 <div class="belanja-col">
 <div class="belanja-col-header accent-ai"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:5px;"><path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/></svg> Rekomendasi Belanja</div>


 <div class="chart-card chart-card--fit">
 <div class="pie-canvas-wrap"><canvas ref="pieUsulanEl"></canvas></div>
 <ul class="pie-legend">
 <li v-for="(item, i) in usulanData" :key="'u'+i">
 <span class="dot" :style="{ background: palette[i % palette.length] }"></span>
 <span class="legend-name">{{ item.nama }}</span>
 <span class="legend-pct">{{ item.persen }}%</span>
 </li>
 </ul>
 </div>

 <div class="belanja-subblock-label">Alasan Pengurangan &amp; Realokasi Anggaran</div>
 <div class="realokasi-stack">
 <div class="realokasi-col kurangi">
 <div class="realokasi-header">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="9" stroke="#ef4444" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg> Kenapa Harus Dikurangi?
 </div>
 <div v-for="(j, i) in kurangiList" :key="'k'+i" class="realokasi-card">
 <div class="realokasi-top">
 <span class="realokasi-kode">{{ j.kode }}</span>
 <div class="realokasi-nilai-group">
 <span class="realokasi-nilai-awal" v-if="j.nilai_awal">{{ formatRupiah(j.nilai_awal) }}</span>
 <span class="realokasi-nilai minus">-{{ formatRupiah(j.nilai_dikurangi) }}</span>
 </div>
 </div>
 <div class="realokasi-nama">{{ j.rekening_nama }}</div>
 <div class="realokasi-alasan">{{ j.alasan_dikurangi }}</div>
 </div>
 <p v-if="!kurangiList.length" class="realokasi-empty">Tidak ada rekomendasi pengurangan.</p>
 </div>

 <div class="realokasi-col tambah">
 <div class="realokasi-header">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="9" stroke="#22c55e" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/></svg> Kenapa Harus Dialokasikan ke Sini?
 </div>
 <div v-for="(j, i) in tambahList" :key="'t'+i" class="realokasi-card">
 <div class="realokasi-top">
 <span class="realokasi-kode">{{ j.kode }}</span>
 <div class="realokasi-nilai-group">
 <span class="realokasi-nilai-awal" v-if="j.nilai_awal">Awal: {{ formatRupiah(j.nilai_awal) }}</span>
 <span class="realokasi-nilai plus">+{{ formatRupiah(j.nilai_ditambah) }}</span>
 </div>
 </div>
 <div class="realokasi-nama">{{ j.rekening_nama }}</div>
 <div class="realokasi-alasan">{{ j.alasan_dialokasikan }}</div>
 </div>
 <p v-if="!tambahList.length" class="realokasi-empty">Tidak ada rekomendasi penambahan.</p>
 </div>
 </div>
 </div>

 </div>
 </div>

 <!-- ══════════ 5. WIDGET SROI RATIO (PENUTUP ANALISIS) ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;flex-shrink:0;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 7 22 7 22 13" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Nilai Prakiraan Dampak</div>
 <div class="sroi-ratio-card" :class="sroiMetrics.tone">
 <div class="sroi-ratio-top">
 <span class="sroi-ratio-eyebrow">Rasio Nilai Prakiraan Dampak</span>
 <span class="sroi-status-pill" :class="sroiMetrics.tone">{{ sroiMetrics.shortLabel }} · {{ sroiMetrics.sroiStatus }}</span>
 </div>
 <div class="sroi-ratio-value">{{ sroiMetrics.sroiScore }}</div>
 <div class="sroi-ratio-formula">Rasio Nilai Prakiraan Dampak = Nilai Dampak yang Dihasilkan Saat Ini ÷ Nilai Input</div>
 </div>

 <!-- 4 Pilar Valuasi Utama SROI (Rule 11) -->
 <div class="sroi-stats-grid">
 <div class="sroi-stat-card">
 <div class="stat-label">Nilai Input (Pagu)</div>
 <div class="stat-value">{{ formatRupiah(sroiMetrics.valueOfInputs) }}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Total Nilai Dampak Sosial</div>
 <div class="stat-value">{{ formatRupiah(sroiMetrics.totalNilaiDampak) }}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Total Dampak Bersih</div>
 <div class="stat-value positive">{{ formatRupiah(sroiMetrics.netImpact) }}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Dampak Nilai Saat Ini</div>
 <div class="stat-value positive">{{ formatRupiah(sroiMetrics.pvImpact) }}</div>
 </div>
 </div>

 <!-- Faktor Penyesuaian Dampak SROI (Rule 11 & 12) -->
 <div class="sroi-factors-card">
 <div class="sroi-factors-title"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:5px;"><line x1="4" y1="6" x2="20" y2="6" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/><line x1="4" y1="12" x2="14" y2="12" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/><line x1="4" y1="18" x2="17" y2="18" stroke="#1B4D46" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="6" r="2" fill="#1B4D46"/><circle cx="17" cy="12" r="2" fill="#1B4D46"/><circle cx="20" cy="18" r="2" fill="#1B4D46"/></svg> Faktor Penyesuaian Dampak Sosial</div>
 <div class="sroi-factors-grid">
 <div class="sroi-factor-item">
 <span class="factor-name">Kerugian Bobot</span>
 <span class="factor-val">{{ sroiMetrics.deadweight }}%</span>
 <span class="factor-hint">Outcome tanpa intervensi</span>
 <span v-if="sroiGapExplanation" class="factor-loss">− {{ formatRupiah(sroiGapExplanation.lossDeadweight) }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Atribusi</span>
 <span class="factor-val">{{ sroiMetrics.attribution }}%</span>
 <span class="factor-hint">{{ analysis.attributionReason || 'Kontribusi pihak lain' }}</span>
 <span v-if="sroiGapExplanation" class="factor-loss">− {{ formatRupiah(sroiGapExplanation.lossAttribution) }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Pergeseran Manfaat</span>
 <span class="factor-val">{{ sroiMetrics.displacement }}%</span>
 <span class="factor-hint">{{ analysis.displacementReason || 'Pengurangan manfaat lain' }}</span>
 <span v-if="sroiGapExplanation" class="factor-loss">− {{ formatRupiah(sroiGapExplanation.lossDisplacement) }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Penyusutan</span>
 <span class="factor-val">{{ sroiMetrics.dropOff }}%</span>
 <span class="factor-hint">{{ sroiMetrics.durationYears > 1 ? 'Penurunan multi-tahun' : 'Tidak berlaku (durasi manfaat 1 thn)' }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Tingkat Diskonto</span>
 <span class="factor-val">{{ sroiMetrics.discountRate }}%</span>
 <span class="factor-hint">{{ sroiMetrics.durationYears > 1 ? 'Diskonto masa depan' : 'Tidak berlaku (durasi manfaat 1 thn)' }}</span>
 </div>
 </div>
 </div>

 <!-- Rantai Transparansi Perhitungan SROI (Rule 16) -->
 <div class="sroi-transparency-card">
 <div class="transparency-header">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Rantai Transparansi Perhitungan Nilai Prakiraan Dampak
 </div>
 <div class="transparency-flow">
 <div class="flow-step">
 <div class="step-num">1</div>
 <div class="step-body">
 <div class="step-title">Nilai Input</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.valueOfInputs) }}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">2</div>
 <div class="step-body">
 <div class="step-title">Nilai Dampak</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.totalNilaiDampak) }}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">3</div>
 <div class="step-body">
 <div class="step-title">− Kerugian Bobot ({{ sroiMetrics.deadweight }}%)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.dampakSetelahDeadweight) }}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">4</div>
 <div class="step-body">
 <div class="step-title">− Atribusi ({{ sroiMetrics.attribution }}%)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.dampakSetelahAttribution) }}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">5</div>
 <div class="step-body">
 <div class="step-title">− Pergeseran Manfaat ({{ sroiMetrics.displacement }}%)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.dampakSetelahDisplacement) }}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">6</div>
 <div class="step-body">
 <div class="step-title">Dampak Bersih Tahun 1</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.netImpact) }}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">7</div>
 <div class="step-body">
 <div class="step-title">Dampak Nilai Saat Ini ({{ sroiMetrics.durationYears }} thn, diskonto {{ sroiMetrics.discountRate }}%)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.pvImpact) }}</div>
 </div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step highlight">
 <div class="step-num">8</div>
 <div class="step-body">
 <div class="step-title">Rasio Nilai Prakiraan Dampak</div>
 <div class="step-val">{{ sroiMetrics.sroiScore }}</div>
 <div class="step-hint" style="font-size: 11px; opacity: 0.9; margin-top: 2px;">{{ sroiMetrics.shortLabel }}</div>
 </div>
 </div>
 </div>

 <!-- Rincian Penyusutan & Diskonto per Tahun (jika durasi manfaat > 1 tahun) -->
 <div v-if="sroiMetrics.yearlyBreakdown && sroiMetrics.yearlyBreakdown.length > 1" class="sroi-yearly-table-wrap">
 <div class="sroi-yearly-title">Rincian Penyusutan &amp; Diskonto Multi-Tahun</div>
 <table class="sroi-yearly-table">
 <thead>
 <tr>
 <th>Tahun ke-</th>
 <th>Dampak Bersih (setelah Penyusutan {{ sroiMetrics.dropOff }}%)</th>
 <th>Nilai Sekarang (didiskonto {{ sroiMetrics.discountRate }}%)</th>
 </tr>
 </thead>
 <tbody>
 <tr v-for="row in sroiMetrics.yearlyBreakdown" :key="row.year">
 <td>Tahun {{ row.year }}</td>
 <td>{{ formatRupiah(row.impact) }}</td>
 <td>{{ formatRupiah(row.discounted) }}</td>
 </tr>
 </tbody>
 <tfoot>
 <tr>
 <td colspan="2">Total Dampak Nilai Saat Ini</td>
 <td>{{ formatRupiah(sroiMetrics.pvImpact) }}</td>
 </tr>
 </tfoot>
 </table>
 </div>

 <!-- Rumus Akhir SROI (pedoman baku) -->
 <div class="sroi-formula-box">
 <p class="sroi-formula-desc">
 Rumus utama untuk menghitung rasio nilai prakiraan dampak adalah membandingkan nilai dampak yang dihasilkan saat ini dengan total nilai input yang digunakan.
 </p>
 <div class="sroi-formula-title">Rumus Rasio Nilai Prakiraan Dampak</div>
 <div class="sroi-formula-eq">
 <span class="sroi-formula-label">Rasio Nilai Prakiraan Dampak&nbsp;=</span>
 <span class="sroi-formula-fraction">
 <span class="sroi-formula-num">Nilai Dampak yang Dihasilkan Saat Ini</span>
 <span class="sroi-formula-bar"></span>
 <span class="sroi-formula-den">Nilai Input</span>
 </span>
 </div>
 <div class="sroi-formula-eq sroi-formula-eq-numeric">
 <span class="sroi-formula-label">Rasio Nilai Prakiraan Dampak&nbsp;=</span>
 <span class="sroi-formula-fraction">
 <span class="sroi-formula-num">{{ formatRupiah(sroiMetrics.pvImpact) }}</span>
 <span class="sroi-formula-bar"></span>
 <span class="sroi-formula-den">{{ formatRupiah(sroiMetrics.valueOfInputs) }}</span>
 </span>
 <span class="sroi-formula-result">= {{ sroiMetrics.sroiScore }}</span>
 </div>
 <p class="sroi-formula-note">
 {{ sroiMetrics.sroiInterpretation }} Berdasarkan pedoman ambang batas kelayakan, skor {{ sroiMetrics.sroiScore }} tergolong <strong>{{ sroiMetrics.shortLabel }}</strong> ({{ sroiMetrics.sroiStatus }}).
 </p>

 <!-- Penjabaran konkret kenapa rasio belum mencapai kategori Layak (≥ 1,0) -->
 <div v-if="sroiGapExplanation && sroiGapExplanation.isBelowLayak" class="sroi-gap-box">
 <div class="sroi-gap-title">Kenapa belum masuk kategori "Layak" (≥ 1,0)?</div>
 <p class="sroi-gap-desc">
 Rasio dihitung dari Dampak Nilai Saat Ini dibanding Nilai Input, bukan dari pembulatan atau pemotongan sepihak. Dari Total Nilai Dampak Sosial {{ formatRupiah(sroiMetrics.totalNilaiDampak) }}, berikut rincian nilai yang tereduksi di setiap tahap sampai menjadi Dampak Nilai Saat Ini {{ formatRupiah(sroiMetrics.pvImpact) }}:
 </p>
 <ul class="sroi-gap-list">
 <li v-if="sroiGapExplanation.lossDeadweight > 0">
 <span class="gap-label">Kerugian Bobot ({{ sroiMetrics.deadweight }}%)</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossDeadweight) }}</span>
 <span class="gap-note">— estimasi outcome yang akan tetap terjadi meski tanpa program ini, sehingga tidak dihitung sebagai dampak program.</span>
 </li>
 <li v-if="sroiGapExplanation.lossAttribution > 0">
 <span class="gap-label">Atribusi ({{ sroiMetrics.attribution }}%)</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossAttribution) }}</span>
 <span class="gap-note">— porsi dampak yang turut disumbang pihak/program lain, bukan murni dari kegiatan ini.{{ analysis.attributionReason ? ' ' + analysis.attributionReason : '' }}</span>
 </li>
 <li v-if="sroiGapExplanation.lossDisplacement > 0">
 <span class="gap-label">Pergeseran Manfaat ({{ sroiMetrics.displacement }}%)</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossDisplacement) }}</span>
 <span class="gap-note">— manfaat lain yang tergeser/hilang akibat program ini.{{ analysis.displacementReason ? ' ' + analysis.displacementReason : '' }}</span>
 </li>
 <li v-if="sroiGapExplanation.lossDropOffDiscount > 0">
 <span class="gap-label">Penyusutan &amp; Diskonto Multi-Tahun</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossDropOffDiscount) }}</span>
 <span class="gap-note">— penyusutan dampak di tahun-tahun berikutnya serta nilai waktu uang (diskonto {{ sroiMetrics.discountRate }}%).</span>
 </li>
 </ul>
 <p class="sroi-gap-summary">
 Total nilai yang tereduksi dari seluruh faktor: <strong>{{ formatRupiah(sroiGapExplanation.totalLoss) }}</strong>. Karena Dampak Nilai Saat Ini ({{ formatRupiah(sroiMetrics.pvImpact) }}) masih lebih kecil dari Nilai Input ({{ formatRupiah(sroiMetrics.valueOfInputs) }}), masih ada selisih <strong>{{ formatRupiah(sroiGapExplanation.shortfall) }}</strong> agar rasio mencapai 1,0.
 </p>
 <p class="sroi-gap-suggestion">
 Angka ini bukan dikurangi secara sepihak — semua persentase (Kerugian Bobot, Atribusi, Pergeseran Manfaat) berasal dari estimasi/justifikasi program itu sendiri dan bisa disesuaikan lewat menu <em>edit manual</em> bila Anda memiliki data pendukung yang lebih kuat (mis. Kerugian Bobot lebih rendah karena tanpa program ini outcome benar-benar tidak akan terjadi). Alternatif lain adalah memperbesar estimasi Total Nilai Dampak Sosial, kira-kira perlu tambahan sekitar {{ formatRupiah(sroiGapExplanation.additionalDampakNeeded) }} pada estimasi awal (sebelum potongan) agar Dampak Nilai Saat Ini menyamai Nilai Input — dengan asumsi persentase potongan yang sama.
 </p>
 </div>
 </div>
 </div>
 </div>

 <!-- ══════════ 6. RINGKASAN EFISIEN & INEFISIEN PER REKENING ══════════ -->
 <div class="rka-section">
 <div class="rka-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;flex-shrink:0;"><path d="M21.21 15.89A10 10 0 118 2.83" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 12A10 10 0 0012 2v10z" stroke="#1B4D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Ringkasan Efisien &amp; Inefisien per Rekening</div>

 <!-- Strip ringkasan jumlah rekening -->
 <div class="efektivitas-summary-strip">
 <div class="efektivitas-summary-pill tone-green">
 <span class="efektivitas-summary-count">{{ efektifRekeningList.length }}</span>
 <span class="efektivitas-summary-label">Rekening Efisien</span>
 <span class="efektivitas-summary-sub" v-if="efektifPersenTotal">≈ {{ efektifPersenTotal.toFixed(1) }}% dari pagu</span>
 </div>
 <div class="efektivitas-summary-pill tone-red">
 <span class="efektivitas-summary-count">{{ tidakEfektifRekeningList.length }}</span>
 <span class="efektivitas-summary-label">Rekening Inefisien</span>
 <span class="efektivitas-summary-sub" v-if="tidakEfektifPersenTotal">≈ {{ tidakEfektifPersenTotal.toFixed(1) }}% dari pagu</span>
 </div>
 <div class="efektivitas-summary-pill tone-gray" v-if="belumDinilaiRekeningList.length">
 <span class="efektivitas-summary-count">{{ belumDinilaiRekeningList.length }}</span>
 <span class="efektivitas-summary-label">Belum Dapat Dinilai</span>
 </div>
 </div>

 <p v-if="!rekeningEfektivitas.length" class="indikator-empty">
 Data rincian rekening belanja belum tersedia untuk dokumen ini, sehingga ringkasan efisiensi per rekening belum dapat ditampilkan.
 </p>

 <!-- Dua kolom: Efektif vs Tidak Efektif / Perlu Perhatian -->
 <div class="efektivitas-grid" v-else>
 <div class="efektivitas-col efektif">
 <div class="efektivitas-col-header">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:5px;"><circle cx="12" cy="12" r="9" stroke="#22c55e" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Efisien
 </div>
 <div v-for="(r, i) in efektifRekeningList" :key="'ef'+i" class="efektivitas-card tone-green">
 <div class="efektivitas-card-top">
 <span class="efektivitas-card-nama">{{ r.nama }}</span>
 <span class="efektivitas-card-persen" v-if="r.persen !== null">{{ r.persen }}%</span>
 </div>
 <p class="efektivitas-card-alasan">{{ r.alasan }}</p>
 </div>
 <p v-if="!efektifRekeningList.length" class="realokasi-empty">Belum ada rekening yang terklasifikasi efisien.</p>
 </div>

 <div class="efektivitas-col tidak-efektif">
 <div class="efektivitas-col-header">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:5px;"><circle cx="12" cy="12" r="9" stroke="#ef4444" stroke-width="2"/><path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg> Inefisien / Perlu Perhatian
 </div>
 <div v-for="(r, i) in tidakEfektifRekeningList" :key="'tef'+i" class="efektivitas-card tone-red">
 <div class="efektivitas-card-top">
 <span class="efektivitas-card-nama">{{ r.nama }}</span>
 <span class="efektivitas-card-persen" v-if="r.persen !== null">{{ r.persen }}%</span>
 </div>
 <p class="efektivitas-card-alasan">{{ r.alasan }}</p>
 </div>
 <div v-for="(r, i) in belumDinilaiRekeningList" :key="'bd'+i" class="efektivitas-card tone-gray">
 <div class="efektivitas-card-top">
 <span class="efektivitas-card-nama">{{ r.nama }}</span>
 <span class="efektivitas-card-badge">Belum Dapat Dinilai</span>
 </div>
 <p class="efektivitas-card-alasan">{{ r.alasan }}</p>
 </div>
 <p v-if="!tidakEfektifRekeningList.length && !belumDinilaiRekeningList.length" class="realokasi-empty">Tidak ada rekening yang terklasifikasi inefisien.</p>
 </div>
 </div>
 </div>

 </div>
 </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import {
 Chart,
 ArcElement,
 Tooltip,
 Legend,
 PieController,
 DoughnutController,
} from 'chart.js';

// PERBAIKAN: Chart.js tree-shaken build WAJIB mendaftarkan komponen secara eksplisit.
// Tanpa Chart.register(), Chart.js tidak mengetahui cara menggambar pie/doughnut,
// sehingga canvas tetap kosong meski data sudah ada.
Chart.register(ArcElement, Tooltip, Legend, PieController, DoughnutController);
import { useAnalysis, computeSroi16Rules, cleanOpdName } from '../composables/useAnalysis';
import { downloadAnalysisHtmlReport } from '@/utils/htmlReportGenerator';
import { lengkapiRekeningProporsi } from '@/utils/rekeningLengkap';
import AnalysisEditManualModal from './AnalysisEditManualModal.vue';
import AnalysisEditAiModal from './AnalysisEditAiModal.vue';

// ── Props ────────────────────────────────────────────────────────────
// Pass a real `analysis` object from your parent/composable. Sensible
// defaults (matching the sample RKA stunting-posyandu case) are provided
// so this component also renders correctly on its own.
const openRekeningIndexes = ref(new Set());
const toggleRekeningDetail = (i) => { openRekeningIndexes.value.has(i) ? openRekeningIndexes.value.delete(i) : openRekeningIndexes.value.add(i); };

const props = defineProps({
 analysis: {
 type: Object,
 default: () => ({
 model: 'GEMINI 1.5 PRO',
 pagu: 180000000,
 outcome: 260000000,
 deadweight: 15,
 opd: 'Dinas Kesehatan',
 program: 'Penurunan Stunting',
 targetKuantitatif: 'Revitalisasi 12 posyandu di daerah lokus stunting',
 justifikasiOutcome:
 'Menurunkan persentase balita stunting di 12 posyandu sebesar 15% melalui monitoring tumbuh kembang yang lebih intensif.',
 kepatuhanFindings: [
 {
 label: 'Sasaran Program',
 description: 'Target puskesmas berada di wilayah zona merah stunting.',
 status: 'sesuai',
 },
 ],
 rekeningProporsi: [
 { nama: 'Bahan Makanan Tambahan (PMT)', persen: 20 },
 { nama: 'Obat/Suplemen Zinc & Vitamin Fe', persen: 20 },
 { nama: 'Honor Kader Posyandu', persen: 20 },
 { nama: 'Transport Kunjungan Rumah (Home Visit)', persen: 20 },
 { nama: 'Konsumsi & Snack Rapat Koordinasi', persen: 2 },
 { nama: 'Cetak Spanduk & Baliho Sosialisasi', persen: 18 },
 ],
 rekeningProporsiUsulan: [
 { nama: 'Bahan Makanan Tambahan (PMT)', persen: 45.7 },
 { nama: 'Obat/Suplemen Zinc & Vitamin Fe', persen: 17.1 },
 { nama: 'Honor Kader Posyandu', persen: 16.5 },
 { nama: 'Transport Kunjungan Rumah (Home Visit)', persen: 10.7 },
 { nama: 'Konsumsi & Snack Rapat Koordinasi', persen: 0 },
 { nama: 'Cetak Spanduk & Baliho Sosialisasi', persen: 10.1 },
 ],
 reallocationJustifications: [
 {
 kode: '5.2.06.01',
 rekening_nama: 'Belanja Perjalanan Dinas Dalam Daerah',
 aksi: 'KURANGI',
 alasan_dikurangi:
 'Koordinasi lapangan rutin dapat diganti sebagian dengan rapat daring (online meeting) untuk menghemat BBM & uang harian.',
 nilai_dikurangi: 4500000,
 },
 {
 kode: '5.2.02.01',
 rekening_nama: 'Belanja Konsumsi & Snack Rapat Koordinasi',
 aksi: 'KURANGI',
 alasan_dikurangi:
 'Rapat koordinasi lintas sektor cukup dengan konsumsi standar SSH — tidak perlu catering eksternal untuk efisiensi.',
 nilai_dikurangi: 3600000,
 },
 {
 kode: '5.2.05.02',
 rekening_nama: 'Belanja Cetak Spanduk & Baliho Sosialisasi',
 aksi: 'KURANGI',
 alasan_dikurangi:
 'Edukasi gizi dapat memanfaatkan media sosial resmi Dinkes secara gratis, mengurangi kebutuhan cetak fisik.',
 nilai_dikurangi: 2700000,
 },
 {
 kode: '5.2.02.27',
 rekening_nama: 'Belanja Bahan Makanan Tambahan (PMT) Bergizi',
 aksi: 'TAMBAH',
 alasan_dialokasikan:
 'Rekening utama program — kecukupan gizi langsung menentukan capaian penurunan prevalensi stunting. Tidak boleh dikurangi.',
 nilai_ditambah: 99000000,
 },
 {
 kode: '5.2.02.13',
 rekening_nama: 'Belanja Obat & Suplemen Vitamin (Zinc, Fe)',
 aksi: 'TAMBAH',
 alasan_dialokasikan:
 'Suplemen pendukung wajib diberikan bersama PMT sesuai Permenkes No. 29/2019 tentang pencegahan stunting.',
 nilai_ditambah: 14400000,
 },
 {
 kode: '5.2.03.03',
 rekening_nama: 'Honor Kader Posyandu & Tenaga Gizi',
 aksi: 'TAMBAH',
 alasan_dialokasikan:
 'Kader posyandu adalah ujung tombak pemantauan tumbuh kembang balita — honorarium memastikan kehadiran dan konsistensi monitoring.',
 nilai_ditambah: 10800000,
 },
 ],
 }),
 },
});

const { currentTab, rkis, loadSpecificVersionIntoAnalyzer, loadHistoricalDocIntoAnalyzer, reanalyzeDocWithPdf, regenerateDocFromStoredText, deleteRki } = useAnalysis();

// ── Muat Ulang PDF ───────────────────────────────────────────────────
// Generate ulang analisis AI dari teks PDF yang sudah tersimpan — tanpa unggah PDF lagi.
// Hasil disimpan sebagai versi baru dan halaman ini langsung menampilkan hasil terbaru.
const isMuatUlang = ref(false);
const muatUlangText = ref('');
const canMuatUlangPdf = computed(() => {
  const id = props.analysis?.id;
  return !!(id && (rkis.value || []).find(r => r.id === id)?.hasSourceText);
});

const handleMuatUlangPdf = async () => {
  const id = props.analysis?.id;
  if (!id || isMuatUlang.value) return;
  const useFallback = !canMuatUlangPdf.value;
  if (useFallback && !confirm('Teks PDF asli dokumen ini belum tersimpan (dokumen lama).\n\nAI akan menganalisis ulang berdasarkan HASIL ANALISIS yang sudah ada, bukan dari PDF asli, sehingga bisa kurang akurat. Untuk hasil terbaik gunakan "Unggah Ulang PDF".\n\nLanjutkan Muat Ulang PDF?')) return;
  isMuatUlang.value = true;
  muatUlangText.value = 'Menyiapkan…';
  try {
    // saveManualVersion di dalamnya otomatis memuat ulang analisis aktif → halaman & grafik langsung berubah
    await regenerateDocFromStoredText(id, (_prog, text) => { muatUlangText.value = text; }, { allowFallback: useFallback });
  } catch (err) {
    console.error('Muat Ulang PDF gagal:', err);
    alert('Gagal Muat Ulang PDF: ' + (err.message || 'Terjadi kesalahan'));
  } finally {
    isMuatUlang.value = false;
    muatUlangText.value = '';
  }
};

// ── Edit Manual & Edit dengan AI ─────────────────────────────────────
// Keduanya menyimpan hasil sebagai VERSI BARU lewat saveManualVersion(), yang juga
// memuat ulang analisis aktif sehingga halaman & grafik langsung ikut berubah.
const showEditManual = ref(false);
const showEditAi = ref(false);
const onEditSaved = () => {
  showEditManual.value = false;
  showEditAi.value = false;
};

const showDeleteConfirm = ref(false);
const deleteConfirmInput = ref('');

// Kata/frasa yang harus diketik user untuk mengonfirmasi penghapusan (mirip GitHub)
const deleteConfirmTarget = computed(() => {
 return 'hapus 1 dokumen';
});

const openDeleteConfirm = () => {
 deleteConfirmInput.value = '';
 showDeleteConfirm.value = true;
};

const closeDeleteConfirm = () => {
 showDeleteConfirm.value = false;
 deleteConfirmInput.value = '';
};

// ── Re-upload & Re-analyze State ─────────────────────────────────────
const showReuploadModal = ref(false);
const selectedReuploadFile = ref(null);
const reuploadFileInput = ref(null);
const isReanalyzing = ref(false);
const reuploadProgress = ref(0);
const reuploadProgressText = ref('');

const openReuploadModal = () => {
 selectedReuploadFile.value = null;
 reuploadProgress.value = 0;
 reuploadProgressText.value = '';
 isReanalyzing.value = false;
 showReuploadModal.value = true;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
};

const triggerReuploadFileInput = () => {
 if (reuploadFileInput.value) {
 reuploadFileInput.value.click();
 }
};

const handleReuploadFileSelect = (e) => {
 const file = e.target.files?.[0];
 if (file) {
 if (!file.name.toLowerCase().endsWith('.pdf')) {
 alert("Hanya berkas PDF yang didukung.");
 return;
 }
 selectedReuploadFile.value = file;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
 }
};

const executeReanalysis = async () => {
 const targetId = props.analysis?.id;
 if (!targetId || !selectedReuploadFile.value || isReanalyzing.value) return;
 isReanalyzing.value = true;
 reuploadProgress.value = 10;
 reuploadProgressText.value = 'Mempersiapkan dokumen...';
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });

 try {
 const updated = await reanalyzeDocWithPdf(
 targetId,
 selectedReuploadFile.value,
 (prog, text) => {
 reuploadProgress.value = prog;
 reuploadProgressText.value = text;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
 }
 );

 setTimeout(() => {
 isReanalyzing.value = false;
 showReuploadModal.value = false;
 selectedReuploadFile.value = null;
 if (updated) {
 loadHistoricalDocIntoAnalyzer(updated);
 }
 }, 800);
 } catch (err) {
 console.error("Re-analysis failed:", err);
 isReanalyzing.value = false;
 alert("Gagal melakukan analisis ulang: " + (err.message || "Terjadi kesalahan"));
 }
};

const goBack = () => {
 currentTab.value = 'history';
};

const handleDownloadReport = () => {
 downloadAnalysisHtmlReport(matchedRka.value || props.analysis);
};

const handleDelete = async () => {
 if (deleteConfirmInput.value !== deleteConfirmTarget.value) return;
 const id = props.analysis?.id;
 closeDeleteConfirm();
 if (!id) return;
 await deleteRki(id);
 currentTab.value = 'history';
};

const selectedVersionId = ref(props.analysis?.activeVersionId || 'v1.0');

const matchedRka = computed(() => {
 return rkis.value?.find(r => r.id === props.analysis?.id) || props.analysis;
});

const analysisVersions = computed(() => {
 return matchedRka.value?.versions || [];
});

watch(() => props.analysis, (newVal) => {
 if (newVal?.activeVersionId) {
 selectedVersionId.value = newVal.activeVersionId;
 }
}, { deep: true, immediate: true });

const onSwitchVersion = () => {
 if (matchedRka.value && selectedVersionId.value) {
 loadSpecificVersionIntoAnalyzer(matchedRka.value, selectedVersionId.value);
 }
};



// ── Formatting helpers ──────────────────────────────────────────────
const formatRupiah = (val) => {
 if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
 return 'Rp ' + Math.round(val).toLocaleString('id-ID');
};

// ── Core SROI math (16 Aturan Baku SROI) ─────────────────────────────
const sroiMetrics = computed(() => {
 if (!props.analysis) return computeSroi16Rules({});
 return computeSroi16Rules({
 pagu: props.analysis.pagu,
 outcome: props.analysis.outcome,
 deadweight: props.analysis.deadweight,
 attribution: props.analysis.attribution,
 displacement: props.analysis.displacement,
 dropOff: props.analysis.dropOff,
 discountRate: props.analysis.discountRate,
 benefitDurationYears: props.analysis.benefitDurationYears
 });
});

const netBenefit = computed(() => sroiMetrics.value.netImpact);
const pvImpact = computed(() => sroiMetrics.value.pvImpact);
const sroi = computed(() => sroiMetrics.value.sroiRatio);
const feasibility = computed(() => ({
 label: sroiMetrics.value.sroiStatus,
 tone: sroiMetrics.value.tone
}));

// ── Penjabaran "kenapa belum Layak" — rincian Rupiah yang tereduksi per faktor,
//    dipakai untuk menjelaskan secara konkret (bukan cuma persentase) kenapa
//    rasio belum mencapai ambang batas Layak (≥ 1.0). ──
const sroiGapExplanation = computed(() => {
 const m = sroiMetrics.value;
 if (!m || !m.isValid) return null;

 const lossDeadweight = Math.max(0, m.totalNilaiDampak - m.dampakSetelahDeadweight);
 const lossAttribution = Math.max(0, m.dampakSetelahDeadweight - m.dampakSetelahAttribution);
 const lossDisplacement = Math.max(0, m.dampakSetelahAttribution - m.dampakSetelahDisplacement);
 const lossDropOffDiscount = Math.max(0, m.netImpact - m.pvImpact);
 const totalLoss = lossDeadweight + lossAttribution + lossDisplacement + lossDropOffDiscount;

 const isBelowLayak = m.sroiRatio < 1.0;
 const shortfall = Math.max(0, m.valueOfInputs - m.pvImpact);

 // Estimasi tambahan Total Nilai Dampak (sebelum potongan) yang dibutuhkan
 // agar Dampak Nilai Saat Ini menyamai Nilai Input, dengan asumsi persentase
 // Kerugian Bobot/Atribusi/Pergeseran Manfaat tetap sama seperti sekarang.
 const retentionFactor = m.totalNilaiDampak > 0
 ? (m.pvImpact / m.totalNilaiDampak)
 : 0;
 const neededTotalDampak = retentionFactor > 0 ? Math.round(m.valueOfInputs / retentionFactor) : 0;
 const additionalDampakNeeded = Math.max(0, neededTotalDampak - m.totalNilaiDampak);

 return {
 lossDeadweight: Math.round(lossDeadweight),
 lossAttribution: Math.round(lossAttribution),
 lossDisplacement: Math.round(lossDisplacement),
 lossDropOffDiscount: Math.round(lossDropOffDiscount),
 totalLoss: Math.round(totalLoss),
 isBelowLayak,
 shortfall: Math.round(shortfall),
 additionalDampakNeeded: Math.round(additionalDampakNeeded)
 };
});

// ── Badge SROI untuk kartu info di modal "Unggah Ulang PDF" (samakan dengan Arsip Dokumen) ──
const reuploadSroiBadge = computed(() => ({
 scoreText: sroiMetrics.value.sroiScore ?? '—',
 label: sroiMetrics.value.shortLabel ?? 'Belum Dinilai'
}));

const reuploadSroiBadgeStyle = computed(() => {
 const tone = sroiMetrics.value.tone;
 if (tone === 'tone-green') {
 return { background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' };
 }
 if (tone === 'tone-yellow') {
 return { background: '#fefce8', color: '#854d0e', border: '1px solid #fde047' };
 }
 if (tone === 'tone-red') {
 return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' };
 }
 return { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' };
});

// ── Reallocation lists ───────────────────────────────────────────────
const kurangiList = computed(() =>
 (props.analysis.reallocationJustifications || []).filter((j) => j.aksi === 'KURANGI')
);
const tambahList = computed(() =>
 (props.analysis.reallocationJustifications || []).filter((j) => j.aksi === 'TAMBAH')
);

// Rekening belanja dilengkapi sampai 100% pagu: sisa (di luar rincian utama) menjadi
// SATU rekening sungguhan ber-status, bukan irisan sintetis "Lainnya" di grafik.
const paguLengkap = computed(() => Number(props.analysis.originalPagu || props.analysis.pagu || 0));
const rekeningAwalLengkap = computed(() =>
 lengkapiRekeningProporsi(props.analysis.rekeningProporsi || [], paguLengkap.value, { reallocs: props.analysis.reallocationJustifications })
);
const rekeningUsulanLengkap = computed(() =>
 lengkapiRekeningProporsi(props.analysis.rekeningProporsiUsulan || [], paguLengkap.value, { reallocs: props.analysis.reallocationJustifications })
);

const efficiencyList = computed(() => {
 const proporsi = rekeningAwalLengkap.value;
 const reallocs = props.analysis.reallocationJustifications || [];

 return proporsi.map(rek => {
 let status = rek.status;
 let alasan = rek.alasan;

 const matchedRealloc = reallocs.find(r =>
 (r.rekening_nama && r.rekening_nama.toLowerCase().includes(rek.nama.toLowerCase())) ||
 (rek.nama && rek.nama.toLowerCase().includes(r.rekening_nama.toLowerCase()))
 );

 if (!status) {
 if (matchedRealloc) {
 if (matchedRealloc.aksi === 'KURANGI') {
 status = 'Inefisien';
 } else {
 status = 'Efisien';
 }
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

 // ── Penjelasan detail (lebih panjang dari `alasan` ringkas di atas) ──
 // Dipakai pada "Status Efisiensi per Rekening" agar uraiannya lebih lengkap
 // daripada kartu ringkasan di "Ringkasan Efektif & Inefektif per Rekening".
 // Disusun dari data nyata: kode & nominal rekening (rekeningProporsi), serta
 // uraian lengkap alasan_dikurangi/alasan_dialokasikan & nilainya dari
 // reallocationJustifications — tanpa data tambahan yang dikarang.
 const persenNum = (rek.persen !== undefined && rek.persen !== null) ? Number(rek.persen) : null;
 const nilaiNum = (rek.nilai !== undefined && rek.nilai !== null) ? Number(rek.nilai) : null;

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
});

// ── Ringkasan Efektif & Inefektif per Rekening ────────────────────────
// Diturunkan langsung dari efficiencyList (rekeningProporsi + reallocationJustifications
// hasil analisis dokumen yang sesungguhnya) — tidak ada data efektivitas fiktif/hardcode.
// Status efisiensi per rekening dipetakan menjadi label efektivitas belanja:
// Efisien -> Efektif · Inefisien -> Tidak Efektif · Belum Dapat Dinilai -> tetap.
const rekeningEfektivitas = computed(() => {
 return efficiencyList.value.map((item) => {
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
});

const efektifRekeningList = computed(() =>
 rekeningEfektivitas.value.filter((r) => r.label === 'Efektif')
);
const tidakEfektifRekeningList = computed(() =>
 rekeningEfektivitas.value.filter((r) => r.label === 'Tidak Efektif')
);
const belumDinilaiRekeningList = computed(() =>
 rekeningEfektivitas.value.filter((r) => r.label === 'Belum Dapat Dinilai')
);

// Ringkasan persentase pagu yang berjalan efektif vs tidak efektif, dihitung dari
// kolom `persen` rekeningProporsi milik masing-masing rekening (bukan angka tebakan).
const efektifPersenTotal = computed(() =>
 efektifRekeningList.value.reduce((sum, r) => sum + (r.persen || 0), 0)
);
const tidakEfektifPersenTotal = computed(() =>
 tidakEfektifRekeningList.value.reduce((sum, r) => sum + (r.persen || 0), 0)
);

// ── Indikator & Tolok Ukur Kinerja vs Anggaran Tahun Berjalan ────────
const hasIndikatorKinerja = computed(
 () => Array.isArray(props.analysis.indikatorKinerja) && props.analysis.indikatorKinerja.length > 0
);
const hasAnggaranTahunan = computed(
 () => Array.isArray(props.analysis.anggaranTahunan) && props.analysis.anggaranTahunan.length > 0
);
const anggaranTahunBerjalan = computed(() => {
 const list = props.analysis.anggaranTahunan || [];
 const match = list.find((a) => Number(a.tahun) === Number(props.analysis.tahunRencana));
 return match ? match.jumlah : props.analysis.pagu;
});

// Anggaran per tahun diurutkan + delta (naik/turun) vs tahun sebelumnya,
// supaya tampil sebagai kartu visual (bukan JSON) mirip gaya kartu Kurangi/Tambah.
const anggaranTahunanSorted = computed(() => {
 const list = [...(props.analysis.anggaranTahunan || [])].sort(
 (a, b) => Number(a.tahun) - Number(b.tahun)
 );
 return list.map((a, i) => {
 const prev = i > 0 ? list[i - 1] : null;
 if (!prev || !prev.jumlah) {
 return { ...a, prevJumlah: null, prevTahun: null, deltaLabel: '', deltaClass: '', deltaPercent: '' };
 }
 const diff = Number(a.jumlah) - Number(prev.jumlah);
 const percent = ((diff / Number(prev.jumlah)) * 100).toFixed(1);
 return {
 ...a,
 prevJumlah: null,
 prevTahun: prev.tahun,
 deltaLabel: (diff >= 0 ? '+' : '-') + formatRupiah(Math.abs(diff)),
 deltaClass: diff >= 0 ? 'up' : 'down',
 deltaPercent: (diff >= 0 ? '+' : '') + percent
 };
 });
});

// Kartu Tahun Anggaran (Hero Header) — SELALU dari hasil parsing dokumen RKA, tidak boleh hardcode/asumsi
const currentYearCard = computed(() => {
 const list = [...(props.analysis.anggaranTahunan || [])].sort((a, b) => Number(a.tahun) - Number(b.tahun));

 // Ambil tahun HANYA dari hasil parsing dokumen. Jika tidak ada, fallback terakhir adalah entri
 // terbaru pada anggaranTahunan hasil parsing — tidak pernah menebak tahun sistem/saat ini.
 const rawYear = props.analysis.tahunRencana || props.analysis.tahun ||
 (list.length > 0 ? list[list.length - 1].tahun : null);
 const targetYear = rawYear !== null && rawYear !== undefined && rawYear !== '' ? Number(rawYear) : null;

 let targetItem = targetYear !== null ? list.find(a => Number(a.tahun) === targetYear) : null;
 let targetIdx = targetItem ? list.indexOf(targetItem) : -1;

 if (!targetItem && list.length > 0 && targetYear === null) {
 targetItem = list[list.length - 1];
 targetIdx = list.length - 1;
 }

 const hasYearData = !!(targetItem || targetYear !== null);
 const currentYear = targetItem ? targetItem.tahun : targetYear;
 const currentNominal = targetItem ? Number(targetItem.jumlah) : (Number(props.analysis.pagu) || 0);

 // Badge "TAHUN BERJALAN" hanya tampil jika tahun dari dokumen sama persis dengan tahun sistem saat ini
 const systemYear = new Date().getFullYear();
 const isTahunBerjalan = hasYearData && Number(currentYear) === systemYear;

 // Previous year comparison
 const prevItem = (targetIdx > 0) ? list[targetIdx - 1] : (list.length > 1 && list[0].tahun !== currentYear ? list[0] : null);

 if (hasYearData && prevItem && Number(prevItem.jumlah) > 0) {
 const diff = currentNominal - Number(prevItem.jumlah);
 const pct = ((diff / Number(prevItem.jumlah)) * 100).toFixed(1);
 return {
 tahun: currentYear,
 jumlah: currentNominal,
 hasDelta: true,
 hasYearData,
 isTahunBerjalan,
 prevTahun: prevItem.tahun,
 diff: diff,
 arrow: diff >= 0 ? '▲' : '▼',
 deltaClass: diff >= 0 ? 'delta-up' : 'delta-down',
 deltaLabel: (diff >= 0 ? '+Rp ' : '-Rp ') + Math.abs(diff).toLocaleString('id-ID'),
 deltaPercent: (diff >= 0 ? '+' : '') + pct
 };
 }

 return {
 tahun: hasYearData ? currentYear : '-',
 jumlah: currentNominal,
 hasDelta: false,
 hasYearData,
 isTahunBerjalan,
 prevTahun: null,
 deltaClass: 'delta-neutral',
 deltaLabel: '',
 deltaPercent: ''
 };
});

const kesesuaian = computed(() => props.analysis.kesesuaianAnggaran || null);
const kesesuaianClass = computed(() => {
 const status = kesesuaian.value?.status || '';
 if (status === 'Sesuai') return 'ok';
 if (status === 'Tidak Sesuai') return 'bad';
 if (status === 'Perlu Perhatian') return 'warn';
 return 'unknown';
});
const kesesuaianIcon = computed(() => {
 const map = { ok: '', bad: '', warn: '', unknown: '?' };
 return map[kesesuaianClass.value] || '?';
});
const proyeksiClass = computed(() => {
 const verdict = kesesuaian.value?.proyeksi_pencapaian_target || '';
 if (verdict === 'Target Kemungkinan Tercapai') return 'ok';
 if (verdict === 'Diproyeksikan Tidak Tercapai') return 'bad';
 if (verdict === 'Berisiko Tidak Tercapai') return 'warn';
 return 'unknown';
});
const proyeksiIcon = computed(() => {
 const map = { ok: '', bad: '', warn: '', unknown: '?' };
 return map[proyeksiClass.value] || '';
});

// ── Pie chart data ───────────────────────────────────────────────────
// `palette` (CSS var() strings) dipakai untuk styling titik legenda di HTML —
// itu didukung oleh inline style browser. Canvas 2D milik Chart.js TIDAK bisa
// meresolusi string "var(--x)" sebagai warna, sehingga wedge pie chart gagal
// tergambar (blank). `chartPalette` di bawah meresolusi nilai HEX asli dari
// tema aktif (light/dark) khusus untuk dipakai Chart.js.
const palette = ['var(--primary-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)', 'var(--accent-color)', 'var(--primary-color)', 'var(--border-color-strong)'];

const resolveCssVar = (varName, fallback) => {
 if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
 const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
 return value || fallback;
};

const buildChartPalette = () => [
 resolveCssVar('--primary-color', '#1B4D46'),
 resolveCssVar('--success-color', '#2FC98E'),
 resolveCssVar('--warning-color', '#F0AC42'),
 resolveCssVar('--danger-color', '#F0708A'),
 resolveCssVar('--accent-color', '#C97B3D'),
 resolveCssVar('--info-color', '#2E7D74'),
 resolveCssVar('--border-color-strong', '#C7DEDA'),
];

const awalData = computed(() => rekeningAwalLengkap.value);
const usulanData = computed(() => rekeningUsulanLengkap.value);

// ── Chart.js instances ───────────────────────────────────────────────
const pieAwalEl = ref(null);
const pieUsulanEl = ref(null);
let pieAwalChart = null;
let pieUsulanChart = null;

const buildPieConfig = (dataset, chartPalette) => ({
 type: 'pie',
 data: {
 labels: dataset.map((d) => d.nama),
 datasets: [
 {
 data: dataset.map((d) => Number(d.persen) || 0),
 backgroundColor: dataset.map((_, i) => chartPalette[i % chartPalette.length]),
 borderWidth: 2,
 borderColor: '#ffffff',
 hoverBorderWidth: 3,
 },
 ],
 },
 options: {
 responsive: true,
 maintainAspectRatio: false,
 animation: { animateRotate: true, duration: 600 },
 plugins: {
 legend: { display: false },
 tooltip: {
 callbacks: {
 label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`,
 },
 },
 },
 },
});

const renderCharts = () => {
 if (pieAwalChart) pieAwalChart.destroy();
 if (pieUsulanChart) pieUsulanChart.destroy();

 const chartPalette = buildChartPalette();

 if (pieAwalEl.value && awalData.value.length) {
 pieAwalChart = new Chart(pieAwalEl.value, buildPieConfig(awalData.value, chartPalette));
 }
 if (pieUsulanEl.value && usulanData.value.length) {
 pieUsulanChart = new Chart(pieUsulanEl.value, buildPieConfig(usulanData.value, chartPalette));
 }
};

// Render setelah DOM ter-update (nextTick) DAN dua frame rAF berurutan agar
// kontainer grid dua-kolom benar-benar sudah memiliki lebar final sebelum
// Chart.js mengukur canvas — satu rAF sering tidak cukup saat elemen berada
// di dalam CSS Grid yang baru di-mount.
const renderChartsNextFrame = () => {
 nextTick(() => {
 requestAnimationFrame(() => {
 requestAnimationFrame(() => {
 renderCharts();
 });
 });
 });
};

// Handler resize: di-debounce + hanya redraw kalau LEBAR viewport benar-benar
// berubah. Ini penting terutama di HP — saat scroll, address bar browser
// mobile (Chrome/Safari) sering muncul-hilang dan itu memicu event 'resize'
// berkali-kali walau lebarnya sama persis (cuma tinggi viewport yang berubah).
// Tanpa guard ini, pie chart jadi terlihat redraw/"bergerak" terus-menerus
// padahal ukurannya tidak pernah benar-benar berubah.
let lastResizeWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
let resizeDebounceTimer = null;
const onWindowResize = () => {
 if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
 resizeDebounceTimer = setTimeout(() => {
 resizeDebounceTimer = null;
 const currentWidth = window.innerWidth;
 if (currentWidth === lastResizeWidth) return; // cuma tinggi yang berubah → abaikan
 lastResizeWidth = currentWidth;
 if (pieAwalChart) pieAwalChart.resize();
 if (pieUsulanChart) pieUsulanChart.resize();
 }, 200);
};

onMounted(() => {
 renderChartsNextFrame();
 if (typeof window !== 'undefined') {
 window.addEventListener('resize', onWindowResize);
 }
});

onBeforeUnmount(() => {
 if (pieAwalChart) { pieAwalChart.destroy(); pieAwalChart = null; }
 if (pieUsulanChart) { pieUsulanChart.destroy(); pieUsulanChart = null; }
 if (typeof window !== 'undefined') {
 window.removeEventListener('resize', onWindowResize);
 }
 if (resizeDebounceTimer) {
 clearTimeout(resizeDebounceTimer);
 resizeDebounceTimer = null;
 }
});

watch([awalData, usulanData], renderChartsNextFrame);

// ── Tabs ─────────────────────────────────────────────────────────────
const activeTab = ref('temuan');

// ── JSON output tab ──────────────────────────────────────────────────
const prettyJson = computed(() =>
 JSON.stringify(
 {
 sroi_ratio: Number(sroi.value.toFixed(2)),
 status_kelayakan: feasibility.value.label,
 investasi_pagu: props.analysis.pagu,
 proyeksi_outcome: props.analysis.outcome,
 faktor_deadweight_persen: props.analysis.deadweight,
 nilai_manfaat_bersih: Math.round(netBenefit.value),
 target_kuantitatif: props.analysis.targetKuantitatif,
 justifikasi_outcome: props.analysis.justifikasiOutcome,
 temuan_kepatuhan: props.analysis.kepatuhanFindings,
 rekomendasi_realokasi: props.analysis.reallocationJustifications,
 },
 null,
 2
 )
);

const copied = ref(false);
const copyJson = async () => {
 try {
 await navigator.clipboard.writeText(prettyJson.value);
 copied.value = true;
 setTimeout(() => (copied.value = false), 1500);
 } catch (e) {
 console.error('Gagal menyalin JSON:', e);
 }
};
</script>

<style scoped>
.sroi-result {
 --c-navy: #123a70;
 --c-navy-deep: #0c2851;
 --c-navy-light: var(--info-glow);
 --c-navy-soft: var(--info-glow);
 --c-gray-50: var(--bg-primary);
 --c-gray-100: var(--bg-tertiary);
 --c-gray-200: var(--border-color);
 --c-gray-400: var(--text-muted);
 --c-gray-500: var(--text-muted);
 --c-gray-700: var(--text-primary);
 --c-gray-900: var(--text-primary);
 --c-green: var(--success-hover);
 --c-green-bg: var(--success-glow);
 --c-green-text: var(--success-color);
 --c-red: var(--danger-hover);
 --c-red-bg: var(--danger-glow);
 --c-red-text: var(--danger-color);
 --c-yellow: var(--warning-hover);
 --c-yellow-bg: var(--warning-glow);
 --c-yellow-text: var(--warning-hover);
 --radius-lg: 16px;
 --radius-md: 12px;
 --shadow-soft: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06);

 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
 color: var(--c-gray-900);
 width: 100%;
}

.sroi-header {
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 16px 20px;
 border-bottom: 1px solid var(--c-gray-200);
 flex-wrap: wrap;
 gap: 12px;
}
.sroi-header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.sroi-header-icon { color: var(--c-navy); font-size: 18px; }
.sroi-header h2 { font-size: 16px; font-weight: 700; margin: 0; color: var(--c-navy-deep); }

.version-selector-wrap {
 display: flex;
 align-items: center;
 gap: 6px;
 background: var(--bg-tertiary);
 padding: 3px 8px;
 border-radius: 8px;
 border: 1px solid var(--border-color-strong);
}

.version-label {
 font-size: 11px;
 font-weight: 700;
 color: var(--text-muted);
}

.sroi-version-select {
 border: none;
 background: transparent;
 font-size: 12px;
 font-weight: 700;
 color: var(--info-color);
 outline: none;
 cursor: pointer;
}

.version-pill {
 background: var(--info-glow);
 color: var(--info-color);
 font-weight: 700;
}

.model-badge {
 background: var(--c-green-bg);
 color: var(--c-green-text);
 font-size: 11px;
 font-weight: 700;
 padding: 4px 10px;
 border-radius: 20px;
 letter-spacing: 0.03em;
}

.sroi-body {
 padding: 20px;
 display: flex;
 flex-direction: column;
 gap: 28px;
}

/* ══════ Section title helper ══════ */
.rka-section-title {
 font-size: 15px;
 font-weight: 800;
 color: var(--c-navy-deep);
 display: flex;
 align-items: center;
 gap: 10px;
 margin-bottom: 4px;
}
.icon-badge {
 width: 30px;
 height: 30px;
 border-radius: 9px;
 background: var(--c-navy-light);
 display: inline-flex;
 align-items: center;
 justify-content: center;
 font-size: 15px;
 flex-shrink: 0;
}
.rka-section-sub {
 font-size: 12.5px;
 color: var(--c-gray-500);
 margin: 2px 0 14px;
}
.rka-section > .chart-card,
.rka-section > .justifikasi-card,
.rka-section > .efficiency-summary-card,
.rka-section > .realokasi-grid,
.rka-section > .kepatuhan-section,
.rka-section > .sroi-ratio-card {
 margin-top: 14px;
}

/* ══════ 1. Header Analisis (Hero matching user specification) ══════ */
.rka-hero {
 background: #0c2340;
 border-radius: var(--radius-lg);
 padding: 24px 28px;
 color: #ffffff;
 box-shadow: 0 8px 24px rgba(12, 35, 64, 0.25);
 display: flex;
 flex-direction: column;
 gap: 18px;
 border: 1px solid rgba(255, 255, 255, 0.1);
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
 color: #93c5fd;
}

.rka-hero-main-val {
 font-size: 18px;
 font-weight: 800;
 color: #ffffff;
 line-height: 1.35;
}

.rka-hero-split-grid {
 display: grid;
 grid-template-columns: 1.2fr 1fr;
 gap: 24px;
 align-items: flex-end;
 padding-top: 16px;
 border-top: 1px solid rgba(255, 255, 255, 0.12);
}

@media (max-width: 960px) {
 .rka-hero-split-grid {
 grid-template-columns: 1fr;
 align-items: stretch;
 }
}

.rka-hero-col-left {
 display: flex;
 flex-direction: column;
 gap: 14px;
}

.rka-hero-item {
 display: flex;
 flex-direction: column;
 gap: 3px;
}

.rka-hero-text-val {
 font-size: 14px;
 font-weight: 700;
 color: #ffffff;
 line-height: 1.4;
}

.rka-hero-col-right {
 display: flex;
 flex-direction: column;
}

/* Kotak nominal PAGU ANGGARAN — aksen hijau retro-modern */
.pagu-anggaran-box {
 background: #f0fdf4;
 border: 1.5px solid #86efac;
 border-radius: 10px;
 padding: 14px 18px;
 box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
 width: fit-content;
}

.tab-amount-num {
 font-size: 22px;
 font-weight: 800;
 color: #15803d;
 margin-bottom: 6px;
 letter-spacing: -0.01em;
}

.tab-delta-info {
 font-size: 12px;
 font-weight: 700;
 display: flex;
 align-items: center;
 gap: 4px;
}

.tab-delta-info.delta-up {
 color: #16a34a;
}

.tab-delta-info.delta-down {
 color: #dc2626;
}

.tab-delta-info.delta-neutral {
 color: #64748b;
}

.tab-arrow {
 font-size: 11px;
}

/* TAHUN ANGGARAN — mengikuti gaya font field lain (bold, putih) */
.tahun-anggaran-plain {
 display: flex;
 align-items: center;
 gap: 10px;
 flex-wrap: wrap;
}

.tahun-anggaran-year {
 font-size: 18px;
 font-weight: 800;
 color: #ffffff;
 line-height: 1.35;
}

.tab-year-badge {
 background: #16a34a;
 color: #ffffff;
 font-size: 10px;
 font-weight: 800;
 padding: 3px 10px;
 border-radius: 12px;
 letter-spacing: 0.04em;
}

/* Status pill color variants */
.status-approved { background: rgba(74, 222, 128, 0.22); border-color: rgba(74, 222, 128, 0.4); }
.status-draft { background: rgba(255, 255, 255, 0.16); }
.status-rejected,
.status-ditolak { background: rgba(248, 113, 113, 0.24); border-color: rgba(248, 113, 113, 0.4); }

/* ══════ 3. Justifikasi AI ══════ */
.justifikasi-card {
 background: var(--c-navy-soft);
 border: 1px solid var(--info-glow);
 border-radius: var(--radius-md);
 padding: 16px 18px;
}
.justifikasi-label {
 font-size: 10.5px;
 font-weight: 700;
 letter-spacing: 0.04em;
 text-transform: uppercase;
 color: var(--c-navy);
 margin-bottom: 8px;
}
.justifikasi-text {
 font-size: 13.5px;
 color: var(--c-gray-700);
 line-height: 1.6;
 margin: 0;
}

/* ══════ 4 & 6. Chart cards (Grafik Analisis / Rekomendasi Belanja) ══════ */
.chart-card {
 background: #fff;
 border: 1px solid var(--c-gray-200);
 border-radius: var(--radius-lg);
 box-shadow: var(--shadow-soft);
 padding: 22px;
 max-width: 380px;
}
.pie-block-title {
 font-size: 12.5px;
 font-weight: 700;
 color: var(--c-gray-700);
 text-align: center;
 margin-bottom: 10px;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 6px;
}
.pie-block-title.accent-ai { color: var(--accent-color, #C97B3D); }
.pie-canvas-wrap { position: relative; width: 100%; height: 190px; margin: 0 auto; max-width: 230px; }
.pie-legend { list-style: none; margin: 14px 0 0; padding: 0; font-size: 12px; color: var(--c-gray-700); }
.pie-legend li {
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 5px 0;
 border-bottom: 1px dashed var(--c-gray-200);
}
.pie-legend li:last-child { border-bottom: none; }
.legend-name { flex: 1; }
.legend-pct { font-weight: 700; color: var(--c-gray-900); }
.dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

/* ══════ 5. Status Efisiensi ══════ */
.efficiency-summary-card {
 background: var(--c-gray-50);
 border: 1px dashed var(--border-color-strong);
 border-radius: var(--radius-lg);
 padding: 18px 20px;
}
.efficiency-title {
 font-size: 13px;
 font-weight: 700;
 color: var(--c-gray-700);
 margin-bottom: 12px;
}
.efficiency-list { display: flex; flex-direction: column; gap: 0; }
.efficiency-list-item {
 padding: 10px 8px;
 margin: 0 -8px;
 border-bottom: 1px solid var(--c-gray-200);
 border-radius: 8px;
 cursor: pointer;
 transition: background 0.15s ease;
}
.efficiency-list-item:hover { background: #fff; }
.efficiency-list-item:focus-visible {
 outline: 2px solid var(--primary-color);
 outline-offset: 2px;
}
.efficiency-list-item.is-open { background: #fff; }
.efficiency-list-item:last-child { border-bottom: none; padding-bottom: 10px; }
.efficiency-list-row {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 12px;
}
.efficiency-item-name { font-size: 12.5px; color: var(--c-gray-700); flex: 1; line-height: 1.35; }
.efficiency-item-status {
 font-size: 10.5px;
 font-weight: 700;
 padding: 4px 10px;
 border-radius: 12px;
 white-space: nowrap;
 display: flex;
 align-items: center;
 gap: 4px;
}
.efficiency-item-status.tone-red { background: var(--c-red-bg); color: var(--c-red-text); }
.efficiency-item-status.tone-green { background: var(--c-green-bg); color: var(--c-green-text); }
.efficiency-item-status.tone-blue { background: var(--info-glow); color: var(--info-hover); }
.efficiency-item-chevron {
 font-size: 9px;
 color: var(--c-gray-500, var(--text-muted));
 flex-shrink: 0;
}
.efficiency-item-reason {
 font-size: 11.5px;
 color: var(--c-gray-700);
 line-height: 1.5;
 background: var(--c-gray-50);
 border: 1px solid var(--c-gray-200);
 border-radius: 8px;
 padding: 9px 11px;
 margin-top: 10px;
}

/* ══════ 7. Realokasi grid ══════ */
.realokasi-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 18px;
}
@media (max-width: 900px) {
 .realokasi-grid { grid-template-columns: 1fr; }
}
.realokasi-header {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 font-size: 12.5px;
 font-weight: 700;
 padding: 8px 16px;
 border-radius: 20px;
 margin-bottom: 12px;
}
.realokasi-col.kurangi .realokasi-header { background: var(--c-red-bg); color: var(--c-red-text); }
.realokasi-col.tambah .realokasi-header { background: var(--c-green-bg); color: var(--c-green-text); }

.realokasi-card {
 background: #fff;
 border: 1px solid var(--c-gray-200);
 border-radius: var(--radius-md);
 box-shadow: var(--shadow-soft);
 padding: 14px 16px;
 margin-bottom: 10px;
}
.realokasi-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 8px;
 margin-bottom: 6px;
 flex-wrap: wrap;
}
.realokasi-kode { font-family: monospace; font-size: 11.5px; color: var(--c-gray-500); }
.realokasi-nilai-group { display: flex; align-items: center; gap: 8px; }
.realokasi-nilai-awal { text-decoration: line-through; color: var(--c-gray-400); font-size: 11.5px; }
.realokasi-col.tambah .realokasi-nilai-awal { text-decoration: none; }
.realokasi-nama { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: var(--c-gray-900); }
.realokasi-alasan { font-size: 12px; color: var(--c-gray-500); line-height: 1.5; }
.realokasi-nilai { font-size: 13px; font-weight: 700; }
.realokasi-nilai.minus { color: var(--c-red); }
.realokasi-nilai.plus { color: var(--c-green); }
.realokasi-empty { font-size: 12px; color: var(--c-gray-400); font-style: italic; }

/* ══════ 4. Analisis Komponen Belanja & Rekomendasi Belanja (dua kolom berdampingan) ══════ */
.belanja-rekomendasi-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 22px;
 align-items: start;
 margin-top: 14px;
}
@media (max-width: 900px) {
 .belanja-rekomendasi-grid { grid-template-columns: 1fr; }
}
.belanja-col {
 display: flex;
 flex-direction: column;
 gap: 4px;
 min-width: 0;
}
.belanja-col-header {
 display: flex;
 align-items: center;
 gap: 7px;
 font-size: 13px;
 font-weight: 800;
 color: var(--c-navy-deep);
 padding-bottom: 10px;
 margin-bottom: 4px;
 border-bottom: 2px solid var(--c-gray-200);
}
.belanja-col-header.accent-ai { color: var(--accent-color, #C97B3D); border-bottom-color: rgba(220,122,42,0.18); }
.belanja-subblock-label {
 font-size: 11px;
 font-weight: 700;
 letter-spacing: 0.03em;
 text-transform: uppercase;
 color: var(--c-gray-500);
 margin: 14px 0 8px;
}
.belanja-col .chart-card--fit {
 max-width: none;
 width: 100%;
 padding: 18px;
}
.belanja-col .efficiency-summary-card--fit {
 max-width: none;
 width: 100%;
}
.realokasi-stack {
 display: flex;
 flex-direction: column;
 gap: 14px;
}

/* Divider antara inti analisis (ditutup Rasio SROI) & lampiran pendukung */
.rka-supplement-divider {
 display: flex;
 align-items: center;
 gap: 12px;
 margin: 4px 0;
 color: var(--c-gray-400);
 font-size: 11px;
 font-weight: 700;
 letter-spacing: 0.06em;
 text-transform: uppercase;
}
.rka-supplement-divider::before,
.rka-supplement-divider::after {
 content: '';
 flex: 1;
 height: 1px;
 background: var(--c-gray-200);
}

/* ══════ 8. Widget SROI Ratio ══════ */
.sroi-ratio-card {
 border-radius: var(--radius-lg);
 padding: 26px 28px;
 color: #fff;
 background: var(--success-hover);
 box-shadow: var(--shadow-soft);
}
.sroi-ratio-card.tone-yellow { background: var(--warning-color); }
.sroi-ratio-card.tone-red { background: var(--danger-color); }
.sroi-ratio-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 10px;
 flex-wrap: wrap;
 margin-bottom: 8px;
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
 white-space: nowrap;
}
.sroi-ratio-value { font-size: 52px; font-weight: 800; line-height: 1; margin: 8px 0 12px; }
.sroi-ratio-formula { font-size: 12px; opacity: 0.85; margin-bottom: 10px; }
.sroi-ratio-desc { font-size: 13.5px; font-weight: 600; margin: 0; line-height: 1.45; max-width: 620px; }

.sroi-stats-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 14px;
 margin-top: 16px;
}
@media (max-width: 900px) {
 .sroi-stats-grid { grid-template-columns: repeat(2, 1fr); }
}
.sroi-stat-card {
 background: var(--c-gray-50);
 border: 1px solid var(--c-gray-200);
 border-radius: var(--radius-md);
 padding: 14px 16px;
}
.stat-label {
 font-size: 10px;
 font-weight: 700;
 letter-spacing: 0.04em;
 text-transform: uppercase;
 color: var(--c-gray-500);
 margin-bottom: 6px;
}
.stat-value { font-size: 18px; font-weight: 700; color: var(--c-gray-900); }
.stat-value.deadweight { color: var(--c-red); }
.stat-value.positive { color: var(--c-green); }

/* ══════ SROI Factors Card (Rule 11 & 12) ══════ */
.sroi-factors-card {
 margin-top: 14px;
 background: var(--c-gray-50);
 border: 1px solid var(--c-gray-200);
 border-radius: var(--radius-md);
 padding: 16px;
}
.sroi-factors-title {
 font-size: 13px;
 font-weight: 700;
 color: var(--c-gray-800);
 margin-bottom: 12px;
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
 background: #ffffff;
 border: 1px solid var(--c-gray-200);
 border-radius: var(--radius-sm);
 padding: 10px 12px;
 display: flex;
 flex-direction: column;
 gap: 2px;
}
.factor-name {
 font-size: 11px;
 font-weight: 700;
 color: var(--c-gray-600);
 text-transform: uppercase;
}
.factor-val {
 font-size: 16px;
 font-weight: 800;
 color: var(--c-gray-900);
}
.factor-hint {
 font-size: 10px;
 color: var(--c-gray-500);
 line-height: 1.2;
}
.factor-loss {
 font-size: 10.5px;
 font-weight: 700;
 color: #dc2626;
 margin-top: 2px;
}

/* ══════ SROI Transparency Flow (Rule 16) ══════ */
.sroi-transparency-card {
 margin-top: 14px;
 background: #ffffff;
 border: 1px solid var(--c-gray-200);
 border-radius: var(--radius-md);
 padding: 16px;
}
.transparency-header {
 font-size: 13px;
 font-weight: 700;
 color: var(--c-gray-800);
 margin-bottom: 14px;
 display: flex;
 align-items: center;
 gap: 6px;
}
.transparency-flow {
  --flow-gap: 8px;
  --flow-arrow-w: 16px;
  --flow-visible: 4; /* jumlah kotak yang terlihat sekaligus */
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--flow-gap);
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 10px;
  scroll-snap-type: x proximity;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
.transparency-flow::-webkit-scrollbar { height: 6px; }
.transparency-flow::-webkit-scrollbar-track { background: var(--c-gray-100, #f3f4f6); border-radius: 3px; }
.transparency-flow::-webkit-scrollbar-thumb { background: var(--c-gray-300); border-radius: 3px; }
.transparency-flow::-webkit-scrollbar-thumb:hover { background: var(--c-gray-400); }
.flow-step {
  /* lebar tepat 1/4 area, dikurangi 3 panah + jarak antar kotak */
  flex: 0 0 calc((100% - (var(--flow-visible) - 1) * (var(--flow-arrow-w) + 2 * var(--flow-gap))) / var(--flow-visible));
  min-width: 0;
  scroll-snap-align: start;
  background: var(--c-gray-50);
  border: 1px solid var(--c-gray-200);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  position: relative;
}
@media (max-width: 640px) {
  .transparency-flow { --flow-visible: 2; }
}
.flow-step.highlight {
 background: #f0fdf4;
 border-color: #86efac;
}
.step-num {
 font-size: 9px;
 font-weight: 800;
 width: 18px;
 height: 18px;
 background: var(--c-gray-300);
 color: var(--c-gray-700);
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 margin-bottom: 6px;
}
.flow-step.highlight .step-num {
 background: var(--c-green);
 color: #ffffff;
}
.step-title {
 font-size: 10.5px;
 font-weight: 700;
 color: var(--c-gray-600);
 margin-bottom: 4px;
}
.step-val {
 font-size: 12.5px;
 font-weight: 800;
 color: var(--c-gray-900);
}
.flow-arrow {
 color: var(--c-gray-400);
 font-weight: 800;
 font-size: 16px;
 flex-shrink: 0;
}

/* ══════ Rincian Multi-Tahun (Penyusutan & Diskonto) ══════ */
.sroi-yearly-table-wrap {
 margin-top: 16px;
 padding-top: 14px;
 border-top: 1px dashed var(--c-gray-200);
}
.sroi-yearly-title {
 font-size: 12px;
 font-weight: 700;
 color: var(--c-gray-700);
 margin-bottom: 8px;
}
.sroi-yearly-table {
 width: 100%;
 border-collapse: collapse;
 font-size: 12px;
}
.sroi-yearly-table th {
 text-align: left;
 padding: 6px 10px;
 background: var(--c-gray-50);
 color: var(--c-gray-600);
 font-weight: 700;
 border: 1px solid var(--c-gray-200);
}
.sroi-yearly-table td {
 padding: 6px 10px;
 border: 1px solid var(--c-gray-200);
 color: var(--c-gray-800);
}
.sroi-yearly-table tfoot td {
 font-weight: 800;
 background: #f0fdf4;
 color: #1B4D46;
}

/* ══════ Rumus Akhir SROI (pedoman baku, sesuai fraksi Dampak Nilai Saat Ini / Nilai Input) ══════ */
.sroi-formula-box {
 margin-top: 16px;
 padding-top: 16px;
 border-top: 1px dashed var(--c-gray-200);
}
.sroi-formula-desc {
 font-size: 12.5px;
 color: var(--c-gray-700);
 line-height: 1.65;
 margin: 0 0 14px;
}
.sroi-formula-title {
 font-size: 14px;
 font-weight: 800;
 color: var(--c-gray-900);
 margin-bottom: 10px;
}
.sroi-formula-eq {
 display: flex;
 align-items: center;
 gap: 12px;
 flex-wrap: wrap;
 margin-bottom: 10px;
}
.sroi-formula-eq-numeric {
 padding-top: 12px;
 border-top: 1px solid var(--c-gray-200);
}
.sroi-formula-label {
 font-size: 13px;
 font-weight: 700;
 color: var(--c-gray-800);
 white-space: nowrap;
}
.sroi-formula-fraction {
 display: inline-flex;
 flex-direction: column;
 align-items: center;
 text-align: center;
}
.sroi-formula-num,
.sroi-formula-den {
 font-size: 12.5px;
 font-weight: 700;
 color: var(--c-gray-900);
 padding: 0 6px;
 white-space: nowrap;
}
.sroi-formula-bar {
 width: 100%;
 height: 2px;
 background: var(--c-gray-800);
 margin: 3px 0;
}
.sroi-formula-result {
 font-size: 17px;
 font-weight: 900;
 color: var(--c-green);
}
.sroi-formula-note {
 font-size: 12px;
 color: var(--c-gray-600);
 line-height: 1.6;
 margin: 0;
}

/* ══════ Penjabaran "Kenapa Belum Layak" ══════ */
.sroi-gap-box {
 margin-top: 16px;
 padding: 14px 16px;
 background: #fff7ed;
 border: 1px solid #fed7aa;
 border-radius: var(--radius-md);
}
.sroi-gap-title {
 font-size: 13px;
 font-weight: 800;
 color: #9a3412;
 margin-bottom: 8px;
}
.sroi-gap-desc {
 font-size: 12px;
 color: var(--c-gray-700);
 line-height: 1.6;
 margin: 0 0 10px;
}
.sroi-gap-list {
 list-style: none;
 margin: 0 0 12px;
 padding: 0;
 display: flex;
 flex-direction: column;
 gap: 8px;
}
.sroi-gap-list li {
 font-size: 12px;
 line-height: 1.5;
 padding-bottom: 8px;
 border-bottom: 1px dashed #fed7aa;
}
.sroi-gap-list li:last-child {
 border-bottom: none;
 padding-bottom: 0;
}
.gap-label {
 font-weight: 700;
 color: var(--c-gray-900);
}
.gap-val {
 font-weight: 800;
 color: #dc2626;
 margin-left: 6px;
}
.gap-note {
 display: block;
 color: var(--c-gray-600);
 margin-top: 2px;
}
.sroi-gap-summary {
 font-size: 12.5px;
 color: var(--c-gray-800);
 line-height: 1.6;
 margin: 0 0 10px;
 padding-top: 10px;
 border-top: 1px solid #fed7aa;
}
.sroi-gap-suggestion {
 font-size: 12px;
 color: var(--c-gray-700);
 line-height: 1.65;
 margin: 0;
 font-style: italic;
}

/* Tone styling */
.tone-gray {
 background: #f8fafc !important;
 color: #475569 !important;
 border-color: #cbd5e1 !important;
}
.tone-yellow {
 background: #fefce8 !important;
 color: #854d0e !important;
 border-color: #fde047 !important;
}
.sroi-ratio-card.tone-gray {
 background: #475569 !important;
 color: #ffffff !important;
}
.sroi-ratio-card.tone-yellow {
 background: #d97706 !important;
 color: #ffffff !important;
}
.sroi-ratio-card.tone-red {
 background: #ef4444 !important;
 color: #ffffff !important;
}
.sroi-ratio-card.tone-green {
 background: #10b981 !important;
 color: #ffffff !important;
}

/* ══════ 9. Tabel Temuan Kepatuhan SSH ══════ */
.kepatuhan-section {
 display: flex;
 flex-direction: column;
 gap: 10px;
}
.kepatuhan-item {
 display: flex;
 align-items: flex-start;
 gap: 12px;
 background: var(--c-gray-50);
 border: 1px solid var(--c-gray-200);
 border-left: 4px solid var(--c-green);
 border-radius: var(--radius-md);
 padding: 14px 16px;
}
.kepatuhan-item:not(.sesuai) { border-left-color: var(--c-red); }
.kepatuhan-icon {
 color: #fff;
 background: var(--c-green);
 font-weight: 700;
 width: 22px;
 height: 22px;
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 12px;
 flex-shrink: 0;
 margin-top: 1px;
}
.kepatuhan-item:not(.sesuai) .kepatuhan-icon { background: var(--c-red); }
.kepatuhan-label { font-size: 13px; font-weight: 700; color: var(--c-gray-900); }
.kepatuhan-desc { font-size: 12.5px; color: var(--c-gray-500); margin-top: 3px; line-height: 1.5; }

/* ══════ 10. Jadwal Penarikan Dana (RPD) ══════ */
.rpd-display-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 14px;
}
@media (max-width: 900px) {
 .rpd-display-grid { grid-template-columns: repeat(2, 1fr); }
}
.rpd-display-card {
 background: var(--c-gray-50);
 border: 1px solid var(--c-gray-200);
 border-radius: var(--radius-md);
 padding: 16px;
 text-align: center;
}
.rpd-card-q {
 font-size: 11px;
 font-weight: 700;
 color: var(--c-gray-500);
 text-transform: uppercase;
 letter-spacing: 0.04em;
 margin-bottom: 6px;
}
.rpd-card-pct {
 font-size: 24px;
 font-weight: 800;
 color: var(--info-color);
 margin-bottom: 4px;
}
.rpd-card-rp {
 font-size: 12px;
 font-weight: 700;
 color: var(--c-gray-700);
}

/* ══════ 2. Indikator & Tolok Ukur Kinerja vs Anggaran Tahun Berjalan ══════ */
.indikator-anggaran-card {
 background: #fff;
 border: 1px solid var(--border-color);
 border-radius: 14px;
 padding: 18px 20px;
 margin-top: 14px;
}

/* Single-column layout: kolom "Anggaran Dikeluarkan per Tahun" telah dihapus dari section ini */
.indikator-grid {
 display: grid;
 grid-template-columns: 1fr;
 gap: 16px;
}
.indikator-col-header {
 display: flex;
 align-items: center;
 gap: 6px;
 font-size: 12.5px;
 font-weight: 700;
 padding: 10px 14px;
 border-radius: 8px;
 margin-bottom: 10px;
}
.target-col .indikator-col-header { background: var(--info-glow); color: var(--info-hover); }
.anggaran-col .indikator-col-header { background: var(--success-glow); color: var(--success-text); }

.indikator-item-card {
 border: 1px solid var(--border-color);
 border-radius: 10px;
 padding: 12px 14px;
 margin-bottom: 10px;
}
.indikator-item-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 8px;
 margin-bottom: 4px;
}
.indikator-item-level {
 font-family: monospace;
 font-size: 11px;
 color: var(--text-muted);
 text-transform: uppercase;
 letter-spacing: 0.02em;
}
.indikator-item-target {
 font-size: 13px;
 font-weight: 700;
 color: #4338ca;
 white-space: nowrap;
}
.indikator-item-nama {
 font-size: 13px;
 font-weight: 700;
 color: var(--text-primary);
 line-height: 1.4;
}
.tahun-tag-inline {
 background: var(--success-hover);
 color: #fff;
 font-size: 9.5px;
 font-weight: 700;
 letter-spacing: 0.03em;
 text-transform: uppercase;
 padding: 2px 8px;
 border-radius: 10px;
 white-space: nowrap;
}
.indikator-empty {
 font-size: 12px;
 color: var(--text-muted);
 font-style: italic;
 margin: 0;
}

/* Kartu Anggaran per Tahun — gaya visual mirip kartu Kurangi/Tambah */
.anggaran-year-card {
 border: 1px solid var(--border-color);
 border-radius: 10px;
 padding: 12px 14px;
 margin-bottom: 10px;
 background: #fff;
}
.anggaran-year-card.is-current-year {
 border-color: var(--success-hover);
 background: var(--success-glow);
}
.anggaran-year-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 8px;
 margin-bottom: 6px;
}
.anggaran-year-label {
 font-family: monospace;
 font-size: 11px;
 color: var(--text-muted);
 text-transform: uppercase;
 letter-spacing: 0.02em;
}
.anggaran-year-body { display: flex; align-items: baseline; gap: 8px; }
.anggaran-year-jumlah { font-size: 16px; font-weight: 700; color: var(--success-text); }
.anggaran-year-delta {
 display: flex;
 align-items: center;
 gap: 5px;
 margin-top: 6px;
 font-size: 12px;
 font-weight: 700;
 padding: 4px 9px;
 border-radius: 7px;
 width: fit-content;
}
.anggaran-year-delta.up { color: var(--success-text); background: var(--success-glow); }
.anggaran-year-delta.down { color: var(--danger-text); background: var(--danger-glow); }
.delta-arrow { font-size: 10px; }

.indikator-anggaran-note {
 font-size: 12px;
 color: var(--text-muted);
 margin: 14px 0 0;
 line-height: 1.5;
}
.indikator-anggaran-note strong { color: var(--text-primary); }

/* Analisis Kesesuaian Anggaran Tahun Berjalan vs Target Kinerja */
.kesesuaian-card {
 margin-top: 14px;
 border-radius: 12px;
 padding: 14px 16px;
 border: 1px solid var(--border-color);
 background: var(--bg-primary);
}
.kesesuaian-card.ok { border-color: var(--success-color); background: var(--success-glow); }
.kesesuaian-card.warn { border-color: var(--warning-glow); background: var(--warning-glow); }
.kesesuaian-card.bad { border-color: var(--danger-glow); background: var(--danger-glow); }
.kesesuaian-top {
 display: flex;
 align-items: center;
 gap: 8px;
 margin-bottom: 8px;
 flex-wrap: wrap;
}
.kesesuaian-icon { font-size: 15px; font-weight: 700; }
.kesesuaian-card.ok .kesesuaian-icon { color: var(--success-hover); }
.kesesuaian-card.warn .kesesuaian-icon { color: var(--warning-hover); }
.kesesuaian-card.bad .kesesuaian-icon { color: var(--danger-hover); }
.kesesuaian-title { font-size: 13px; font-weight: 700; color: var(--text-primary); flex: 1; }
.kesesuaian-status-pill {
 font-size: 10.5px;
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.03em;
 padding: 3px 10px;
 border-radius: 20px;
 background: var(--border-color);
 color: var(--text-primary);
}
.kesesuaian-card.ok .kesesuaian-status-pill { background: var(--success-glow); color: var(--success-text); }
.kesesuaian-card.warn .kesesuaian-status-pill { background: var(--warning-glow); color: var(--warning-text); }
.kesesuaian-card.bad .kesesuaian-status-pill { background: var(--danger-glow); color: var(--danger-text); }
.kesesuaian-detail { margin: 0 0 8px; }
.kesesuaian-detail-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  list-style: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  user-select: none;
}
.kesesuaian-detail-toggle::-webkit-details-marker { display: none; }
.kesesuaian-detail-toggle::before {
  content: '';
  width: 6px;
  height: 6px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.15s ease;
}
.kesesuaian-detail[open] > .kesesuaian-detail-toggle::before { transform: rotate(45deg); }
.kesesuaian-detail-toggle:hover { color: var(--text-primary); }
.kesesuaian-detail-body { margin-top: 8px; }
.kesesuaian-penjelasan { font-size: 12.5px; color: var(--text-primary); line-height: 1.55; margin: 0 0 6px; }
.kesesuaian-estimasi { font-size: 12px; color: var(--text-muted); margin: 0; }
.kesesuaian-estimasi strong { color: var(--text-primary); }

/* Proyeksi Capaian Target — apakah anggaran akan menyentuh target */
.proyeksi-target-box {
 margin-top: 10px;
 border-radius: 10px;
 padding: 10px 12px;
 border: 1px dashed var(--border-color-strong);
 background: #fff;
}
.proyeksi-target-box.ok { border-color: var(--success-color); background: var(--success-glow); }
.proyeksi-target-box.warn { border-color: var(--warning-glow); background: var(--warning-glow); }
.proyeksi-target-box.bad { border-color: var(--danger-color); background: var(--danger-glow); }
.proyeksi-target-top {
 display: flex;
 align-items: center;
 gap: 7px;
 flex-wrap: wrap;
}
.proyeksi-target-icon { font-size: 13px; }
.proyeksi-target-label { font-size: 12px; font-weight: 700; color: var(--text-secondary); flex: 1; }
.proyeksi-target-pill {
 font-size: 10.5px;
 font-weight: 700;
 padding: 3px 10px;
 border-radius: 20px;
 background: var(--border-color);
 color: var(--text-primary);
 white-space: nowrap;
}
.proyeksi-target-box.ok .proyeksi-target-pill { background: var(--success-glow); color: var(--success-text); }
.proyeksi-target-box.warn .proyeksi-target-pill { background: var(--warning-glow); color: var(--warning-text); }
.proyeksi-target-box.bad .proyeksi-target-pill { background: var(--danger-glow); color: var(--danger-text); }
.proyeksi-target-alasan { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 6px 0 0; }

/* ══════ 8. Ringkasan Efektif & Inefektif per Rekening ══════ */
.efektivitas-summary-strip {
 display: flex;
 flex-wrap: wrap;
 gap: 12px;
 margin-top: 14px;
}
.efektivitas-summary-pill {
 flex: 1;
 min-width: 150px;
 display: flex;
 flex-direction: column;
 gap: 2px;
 border-radius: 12px;
 padding: 12px 16px;
 border: 1px solid var(--border-color);
 background: #fff;
}
.efektivitas-summary-pill.tone-green { border-color: var(--success-color); background: var(--success-glow); }
.efektivitas-summary-pill.tone-red { border-color: var(--danger-color); background: var(--danger-glow); }
.efektivitas-summary-pill.tone-gray { border-color: var(--border-color-strong); background: var(--bg-tertiary); }
.efektivitas-summary-count {
 font-size: 24px;
 font-weight: 800;
 line-height: 1.1;
 color: var(--text-primary);
}
.efektivitas-summary-pill.tone-green .efektivitas-summary-count { color: var(--success-text); }
.efektivitas-summary-pill.tone-red .efektivitas-summary-count { color: var(--danger-text); }
.efektivitas-summary-label {
 font-size: 11.5px;
 font-weight: 700;
 color: var(--text-secondary);
}
.efektivitas-summary-sub {
 font-size: 10.5px;
 color: var(--text-muted);
}

.efektivitas-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 18px;
 margin-top: 16px;
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
 padding: 8px 16px;
 border-radius: 20px;
 margin-bottom: 12px;
}
.efektivitas-col.efektif .efektivitas-col-header { background: var(--success-glow); color: var(--success-text); }
.efektivitas-col.tidak-efektif .efektivitas-col-header { background: var(--danger-glow); color: var(--danger-text); }

.efektivitas-card {
 background: #fff;
 border: 1px solid var(--border-color);
 border-left: 3px solid var(--border-color-strong);
 border-radius: var(--radius-md);
 box-shadow: var(--shadow-soft);
 padding: 12px 14px;
 margin-bottom: 10px;
}
.efektivitas-card.tone-green { border-left-color: var(--success-color); }
.efektivitas-card.tone-red { border-left-color: var(--danger-color); }
.efektivitas-card.tone-gray { border-left-color: var(--border-color-strong); }
.efektivitas-card-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 8px;
 margin-bottom: 4px;
 flex-wrap: wrap;
}
.efektivitas-card-nama { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.efektivitas-card-persen { font-size: 12px; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
.efektivitas-card-badge {
 font-size: 10px;
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.03em;
 padding: 2px 8px;
 border-radius: 10px;
 background: var(--bg-tertiary);
 color: var(--text-muted);
 white-space: nowrap;
}
.efektivitas-card-alasan { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0; }

.indikator-rincian { margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
.indikator-rincian > summary { cursor: pointer; font-size: 12px; font-weight: 700; color: #0f766e; list-style: revert; }
.indikator-rincian-list { margin: 6px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; line-height: 1.45; color: #334155; }
.indikator-rincian-list li strong { display: block; color: #0f172a; }
</style>

