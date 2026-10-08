<template>
 <div class="arsip-container">

 <ArsipBackupModal v-if="isPrivileged" :open="showBackupModal" @close="showBackupModal = false" />

 <PageHero icon="folder-archive" title="Arsip Dokumen RKA" subtitle="Semua dokumen yang sudah dianalisis">
 <button
 v-if="isPrivileged"
 class="btn btn-secondary btn-sm"
 :disabled="exportingJson"
 @click="exportDatabaseJson"
 :title="exportTitle">
 <svg :class="{ 'spin-anim': exportingJson }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align: -3px; margin-right: 4px;"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
 {{ exportingJson ? 'Mengekspor...' : 'Ekspor JSON' }}
 </button>
 <button
 v-if="isPrivileged"
 class="btn btn-secondary btn-sm"
 id="btn-backup-restore-arsip"
 @click="showBackupModal = true"
 title="Backup, pemulihan, konversi HTML ke JSON, dan tambah ke arsip">
 <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align: -3px; margin-right: 4px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
 Backup
 </button>
 <!-- Sementara disembunyikan: fitur backup/restore .html belum selesai -->
 <button class="btn btn-primary btn-sm" id="btn-upload-new-arsip" @click="goToUpload">
 <i data-lucide="upload-cloud"></i> Unggah
 </button>
 
 </PageHero>

 <div class="card arsip-header-card">

  <!-- Tab: Arsip Aktif / Sampah -->
 <div class="arsip-tabs" role="tablist" aria-label="Tampilan arsip">
  <button type="button" role="tab" id="tab-arsip-aktif" class="arsip-tab" :class="{ active: activeView === 'aktif' }" :aria-selected="activeView === 'aktif'" @click="switchView('aktif')">
   <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
   Arsip Aktif
   <span class="arsip-tab-count">{{ rkis.length }}</span>
  </button>
  <button type="button" role="tab" id="tab-arsip-sampah" class="arsip-tab" :class="{ active: activeView === 'sampah' }" :aria-selected="activeView === 'sampah'" @click="switchView('sampah')">
   <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
   Sampah
   <span class="arsip-tab-count" :class="{ 'has-items': trashItems.length > 0 }">{{ trashItems.length }}</span>
  </button>
 </div>

 <template v-if="activeView === 'aktif'">
 <!-- Search & Filter Bar -->
 <div class="arsip-filter-bar">
 <div style="position: relative; flex: 1; min-width: 200px;">
 <input
 type="text"
 id="arsip-search"
 class="form-input"
 v-model="searchQuery"
 placeholder="Cari nama dokumen, OPD, atau ID..."
 style="padding-left: 38px;"
 >
 <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted);"></i>
 </div>
 <div class="arsip-count-badge">
 <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
 {{ filteredRkis.length }} Dokumen
 </div>
 <div class="arsip-bulk-actions">
 <template v-if="selectedCount > 0">
 <span class="bulk-count">{{ selectedCount }} dipilih</span>
 <button class="bulk-btn bulk-btn-clear" @click="clearSelection">Batal Pilih</button>
 <button class="bulk-btn bulk-btn-danger" @click="openBulkDelete">
 <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
 Hapus Terpilih ({{ selectedCount }})
 </button>
 </template>
 <button class="bulk-btn bulk-btn-danger-outline" :disabled="filteredRkis.length === 0" @click="openDeleteAll" title="Hapus seluruh dokumen yang sedang tampil di daftar">
 <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
 Hapus Semua
 </button>
 </div>
 </div>

 <!-- Table -->
 <div class="card-body" style="padding: 0;">
 <div class="data-table-container">
 <table class="data-table arsip-table">
 <thead>
 <tr>
 <th class="arsip-th-check">
 <input type="checkbox" class="arsip-check" :checked="allVisibleSelected" :indeterminate.prop="someVisibleSelected" :disabled="filteredRkis.length === 0" @change="toggleSelectAll" aria-label="Pilih semua dokumen yang tampil" title="Pilih semua yang tampil" />
 </th>
 <th>Nama Dokumen</th>
 <th>OPD / Satuan Kerja</th>
 <th v-if="currentUser?.role === 'admin' || currentUser?.role === 'moderator'">Pengunggah</th>
 <th style="text-align:center;">Tahun Berjalan</th>
 <th>Tanggal Unggah</th>
 <th style="text-align:center;">Prakiraan Dampak</th>
 <th style="text-align:right;">Ukuran File</th>
 <th style="text-align:center;">Aksi</th>
 </tr>
 </thead>
 <tbody>
 <!-- Empty state -->
 <tr v-if="filteredRkis.length === 0">
 <td colspan="9" class="arsip-empty-state">
 <div class="arsip-empty-content">
 <i data-lucide="folder-open" style="width: 52px; height: 52px; opacity: 0.25; margin-bottom: 16px;"></i>
 <p v-if="searchQuery">
 Tidak ada dokumen yang cocok dengan kata kunci pencarian.
 </p>
 <p v-else>
 Belum ada dokumen RKA yang tersimpan dalam arsip.<br>
 Mulai dengan mengunggah dokumen RKA pertama Anda.
 </p>
 <button
 v-if="!searchQuery"
 class="btn btn-primary btn-sm"
 style="margin-top: 16px;"
 @click="goToUpload"
 >
 <i data-lucide="upload-cloud"></i> Unggah Dokumen Pertama
 </button>
 </div>
 </td>
 </tr>

 <!-- Data rows -->
 <tr
 v-else
 v-for="(item, rowIndex) in filteredRkis"
 :key="item.id"
 class="arsip-row"
 :class="{ 'arsip-row-new': newIds.has(item.id), 'arsip-row-selected': selectedIds.has(item.id) }"
 >
 <!-- Pilih -->
 <td class="arsip-td-check">
 <input type="checkbox" class="arsip-check" :checked="selectedIds.has(item.id)" @click="onRowCheck($event, item, rowIndex)" :aria-label="'Pilih ' + (item.namaDokumen || item.id)" />
 </td>

 <!-- Nama Dokumen -->
 <td class="arsip-td-nama">
 <div class="arsip-doc-name" style="cursor: pointer; color: var(--primary-color); font-weight: 700;" @click="viewItem(item)" title="Klik untuk membuka hasil analisis Nilai Prakiraan Dampak">
 {{ item.namaDokumen || item.program }}
 <span v-if="newIds.has(item.id)" class="badge-new-doc">BARU</span>
 </div>
 <div class="arsip-doc-sub">
 <span>{{ item.id }} · {{ item.program }}</span>
 <span v-if="item.versions && item.versions.length > 1" class="badge-ver-count">
 {{ item.versions.length }} Versi
 </span>
 </div>
 </td>

 <!-- OPD -->
 <td class="arsip-td-opd" :title="item.opd">{{ cleanOpdName(item.opd) }}</td>

 <!-- Pengunggah (Admin/Moderator Only) -->
 <td v-if="currentUser?.role === 'admin' || currentUser?.role === 'moderator'">
 <div style="font-weight:600; color:var(--text-primary); font-size: 0.85rem; margin-bottom:2px;">{{ item.createdBy || 'Unknown User' }}</div>
 <div v-if="item.clientIp" style="font-size: 0.7rem; color: var(--text-muted); display:flex; align-items:center; gap:4px; cursor:help;" :title="item.clientDevice || 'Perangkat tidak diketahui'">
 <i data-lucide="network" style="width:12px;height:12px;"></i> {{ item.clientIp }}
 </div>
 <div v-else style="font-size: 0.7rem; color: var(--text-muted);">ID: {{ item.userId || '-' }}</div>
 </td>

 <!-- Tahun Berjalan (sesuai dokumen PDF) -->
 <td style="text-align:center; font-weight: 700; font-size: 0.88rem; color: var(--primary-color);">
 {{ item.tahunRencana || item.tahun || '2026' }}
 </td>

 <!-- Tanggal Unggah -->
 <td class="arsip-td-date">{{ formatDate(item.tanggalUpload) }}</td>

 <!-- SROI Badge (Format Ringkas: [Angka] · [Status]) -->
 <td style="text-align:center;">
 <span
 :class="['sroi-badge-pill', getSroiInfo(item).badgeClass]"
 style="cursor: pointer;"
 @click="viewItem(item)"
 :title="'Nilai Prakiraan Dampak: ' + getSroiInfo(item).scoreText + ' · ' + getSroiInfo(item).fullLabel + ' (Klik untuk melihat detail)'"
 >
 <span class="sroi-badge-ratio">{{ getSroiInfo(item).scoreText }}</span>
 <span class="sroi-badge-sep">·</span>
 <span class="sroi-badge-label">{{ getSroiInfo(item).label }}</span>
 </span>
 </td>

 <!-- Ukuran File -->
 <td style="text-align:right; font-size: 0.8rem; color: var(--text-secondary);">
 {{ formatFileSize(item.ukuranFile) }}
 </td>

 <!-- Aksi -->
 <td style="text-align:center;">
 <div class="arsip-actions" style="display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;">
 <button
 class="btn btn-primary btn-sm"
 @click="viewItem(item)"
 title="Lihat Hasil Analisis Nilai Prakiraan Dampak"
 style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; font-size: 0.78rem; padding: 5px 10px;"
 >
 <i data-lucide="eye"></i>
 <span>Lihat Analisis</span>
 </button>
 <button
 class="btn btn-secondary btn-sm arsip-btn-icon arsip-btn-reupload"
 @click="openReuploadModal(item)"
 title="Unggah Ulang PDF & Analisis Ulang (Perbaiki Hasil Analisis)"
 >
 <i data-lucide="refresh-cw"></i>
 </button>
 <button
 class="btn btn-secondary btn-sm arsip-btn-icon"
 @click="downloadAnalysisHtmlReport(item)"
 title="Unduh Hasil Analisis Lengkap"
 >
 <i data-lucide="download"></i>
 </button>
 <button
 class="btn btn-secondary btn-sm arsip-btn-icon"
 @click="openEditModal(item)"
 title="Edit Metadata"
 >
 <i data-lucide="pencil"></i>
 </button>
 <button
 class="arsip-btn-danger"
 @click="openDeleteModal(item)"
 title="Hapus Dokumen"
 >
 <i data-lucide="trash-2"></i>
 </button>

 <!-- Menu Lainnya: Susun Ulang dengan AI (Template) & Edit Manual -->
 <div class="arsip-more-menu-wrap" style="position: relative; display: inline-block;">
 <button
 class="btn btn-secondary btn-sm arsip-btn-icon"
 @click.stop="toggleMoreMenu(item.id)"
 title="Menu Lainnya"
 >
 <i data-lucide="more-vertical"></i>
 </button>
 <div
 v-if="openMoreMenuId === item.id"
 class="arsip-more-menu-dropdown"
 style="position:absolute; right:0; top:calc(100% + 4px); background:var(--bg-card,#fff); border:1px solid var(--border-color,#e2e2e2); border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,0.14); min-width:240px; z-index:50; overflow:hidden; text-align:left;"
 >
 <button
 class="arsip-more-menu-item"
 style="display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; background:none; border:none; cursor:pointer; font-size:0.82rem; color:var(--text-primary,#111); text-align:left;"
 @click="openManualAnalysisModal(item)"
 >
 <i data-lucide="file-pen-line" style="width:15px;height:15px; color:var(--primary-color,#1B4D46); flex-shrink:0;"></i>
 <span>Edit Hasil Analisis Manual</span>
 </button>
 <button
 class="arsip-more-menu-item"
 style="display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; background:none; border:none; border-top:1px solid var(--border-color,#eee); cursor:pointer; font-size:0.82rem; color:#7c3aed; text-align:left;"
 @click="openEditAiModal(item)"
 >
 <i data-lucide="sparkles" style="width:15px;height:15px; color:#7c3aed; flex-shrink:0;"></i>
 <span>Edit dengan AI</span>
 </button>
 <button
 class="arsip-more-menu-item"
 style="display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; background:none; border:none; border-top:1px solid var(--border-color,#eee); cursor:pointer; font-size:0.82rem; color:#0284c7; text-align:left;"
 title="Generate ulang analisis AI tanpa unggah PDF"
 @click="handleMuatUlangPdf(item)"
 >
 <i data-lucide="rotate-cw" style="width:15px;height:15px; color:#0284c7; flex-shrink:0;"></i>
 <span>Muat Ulang PDF</span>
 </button>
 </div>
 </div>
 </div>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </template>

 <!-- ===================== TAB SAMPAH ===================== -->
 <template v-else>
 <div class="arsip-trash-note">
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  <span>Dokumen yang dihapus disimpan di Sampah selama {{ TRASH_RETENTION_DAYS }} hari, lalu hangus otomatis. Periksa dulu daftarnya, kemudian kembalikan yang masih diperlukan.</span>
 </div>

 <div class="arsip-filter-bar">
  <div style="position: relative; flex: 1; min-width: 200px;">
   <input
    type="text"
    id="trash-search"
    class="form-input"
    v-model="searchQuery"
    placeholder="Cari nama dokumen, OPD, atau ID di Sampah..."
    style="padding-left: 38px;"
   >
   <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  </div>
  <div class="arsip-count-badge">
   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
   {{ filteredTrash.length }} di Sampah
  </div>
  <div class="arsip-bulk-actions">
   <template v-if="trashSelectedCount > 0">
    <span class="bulk-count">{{ trashSelectedCount }} dipilih</span>
    <button class="bulk-btn bulk-btn-clear" @click="clearTrashSelection">Batal Pilih</button>
    <button class="bulk-btn bulk-btn-restore" @click="openTrashRestore('selected')">
     <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
     Kembalikan Terpilih ({{ trashSelectedCount }})
    </button>
   </template>
   <button class="bulk-btn bulk-btn-restore-outline" :disabled="filteredTrash.length === 0" @click="openTrashRestore('all')" title="Kembalikan seluruh dokumen yang sedang tampil di Sampah">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    Kembalikan Semua
   </button>
  </div>
 </div>

 <div class="card-body" style="padding: 0;">
  <div class="data-table-container">
   <table class="data-table arsip-table">
    <thead>
     <tr>
      <th class="arsip-th-check">
       <input type="checkbox" class="arsip-check" :checked="allTrashSelected" :indeterminate.prop="someTrashSelected" :disabled="filteredTrash.length === 0" @change="toggleTrashSelectAll" aria-label="Pilih semua dokumen di Sampah yang tampil" title="Pilih semua yang tampil" />
      </th>
      <th>Nama Dokumen</th>
      <th>OPD / Satuan Kerja</th>
      <th v-if="isPrivileged">Pengunggah</th>
      <th style="text-align:center;">Tahun Berjalan</th>
      <th>Dihapus Pada</th>
      <th style="text-align:center;">Sisa Waktu</th>
      <th style="text-align:right;">Ukuran File</th>
      <th style="text-align:center;">Aksi</th>
     </tr>
    </thead>
    <tbody>
     <!-- Memuat -->
     <tr v-if="trashLoading && trashItems.length === 0">
      <td :colspan="trashColspan" class="arsip-empty-state">
       <div class="arsip-empty-content"><p>Memuat isi Sampah...</p></div>
      </td>
     </tr>

     <!-- Kosong -->
     <tr v-else-if="filteredTrash.length === 0">
      <td :colspan="trashColspan" class="arsip-empty-state">
       <div class="arsip-empty-content">
        <div style="opacity: 0.25; margin-bottom: 16px;"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></div>
        <p v-if="searchQuery">Tidak ada dokumen di Sampah yang cocok dengan kata kunci pencarian.</p>
        <p v-else>
         Sampah kosong.<br>
         Dokumen yang dihapus dari arsip akan muncul di sini dan bisa dikembalikan selama {{ TRASH_RETENTION_DAYS }} hari.
        </p>
       </div>
      </td>
     </tr>

     <!-- Baris data -->
     <template v-else>
      <tr
       v-for="(item, rowIndex) in filteredTrash"
       :key="item.id"
       class="arsip-row"
       :class="{ 'arsip-row-selected': trashSelectedIds.has(item.id) }"
      >
       <td class="arsip-td-check">
        <input type="checkbox" class="arsip-check" :checked="trashSelectedIds.has(item.id)" @click="onTrashRowCheck($event, item, rowIndex)" :aria-label="'Pilih ' + (item.namaDokumen || item.id)" />
       </td>

       <td class="arsip-td-nama">
        <div class="arsip-doc-name trash-doc-name" :title="item.namaDokumen || item.program">{{ item.namaDokumen || item.program }}</div>
        <div class="arsip-doc-sub"><span>{{ item.id }} · {{ item.program }}</span></div>
       </td>

       <td class="arsip-td-opd" :title="item.opd">{{ cleanOpdName(item.opd) }}</td>

       <td v-if="isPrivileged">
        <div style="font-weight:600; color:var(--text-primary); font-size: 0.85rem; margin-bottom:2px;">{{ item.createdBy || 'Unknown User' }}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">{{ item.clientIp || ('ID: ' + (item.userId || '-')) }}</div>
       </td>

       <td style="text-align:center; font-weight: 700; font-size: 0.88rem; color: var(--text-secondary);">
        {{ item.tahunRencana || item.tahun || '—' }}
       </td>

       <td class="arsip-td-date">
        {{ formatDate(item.deletedAt) }}
        <div class="trash-by">oleh {{ item.deletedBy || 'system' }}</div>
       </td>

       <td style="text-align:center;">
        <span class="trash-expiry" :class="{ urgent: trashExpiry(item).urgent }">{{ trashExpiry(item).text }}</span>
       </td>

       <td style="text-align:right; font-size: 0.8rem; color: var(--text-secondary);">
        {{ formatFileSize(item.ukuranFile) }}
       </td>

       <td style="text-align:center;">
        <button class="btn btn-primary btn-sm trash-restore-btn" @click="openTrashRestore('single', item)" title="Kembalikan dokumen ini ke Arsip Aktif">
         <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
         <span>Kembalikan</span>
        </button>
       </td>
      </tr>
     </template>
    </tbody>
   </table>
  </div>
 </div>
 </template>
 </div>

 <!-- Indikator proses Muat Ulang PDF -->
 <Teleport to="body">
 <div v-if="muatUlangId" style="position:fixed; right:20px; bottom:20px; z-index:9999; background:#0f172a; color:#fff; padding:12px 16px; border-radius:10px; box-shadow:0 8px 28px rgba(0,0,0,0.3); font-size:0.85rem; max-width:320px;">
 <strong>Muat Ulang PDF</strong><br>
 <span style="opacity:0.85;">{{ muatUlangText }}</span>
 </div>
 </Teleport>

 <!-- ===================== MODAL: Delete Confirmation (ketik kalimat konfirmasi, gaya GitHub) ===================== -->
 <Teleport to="body">
 <Transition name="modal-fade">
 <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
 <div class="modal-box delete-confirm-box" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" @keydown.esc="closeDeleteModal">
 <div class="modal-icon-wrap danger">
 <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
 </div>
 <h3 id="delete-confirm-title" class="modal-title">Hapus {{ deleteTargets.length }} dokumen?</h3>
 <p class="modal-desc">
 Dokumen berikut akan dipindahkan ke tab <strong>Sampah</strong> dan bisa dikembalikan selama {{ TRASH_RETENTION_DAYS }} hari.
 <template v-if="deleteScopeNote">{{ deleteScopeNote }}</template>
 </p>

 <ul class="delete-doc-list">
 <li v-for="doc in deleteTargets.slice(0, 6)" :key="doc.id">
 <span class="ddl-name">{{ doc.namaDokumen || doc.program || doc.id }}</span>
 <span class="ddl-id">{{ doc.id }}</span>
 </li>
 <li v-if="deleteTargets.length > 6" class="ddl-more">…dan {{ deleteTargets.length - 6 }} dokumen lainnya</li>
 </ul>

 <p class="modal-warning">Setelah {{ TRASH_RETENTION_DAYS }} hari di Sampah, dokumen hangus otomatis dan tidak dapat dikembalikan lagi.</p>

 <label class="delete-confirm-label" for="delete-confirm-input">
 Untuk mengonfirmasi, ketik <code class="delete-phrase">{{ deletePhrase }}</code> di bawah ini:
 </label>
 <input
 id="delete-confirm-input"
 ref="deleteConfirmInput"
 v-model="deleteConfirmText"
 type="text"
 class="form-input delete-confirm-input"
 autocomplete="off"
 autocapitalize="off"
 spellcheck="false"
 :disabled="isDeleting"
 @keydown.enter="confirmDelete"
 />

 <div class="modal-actions">
 <button class="btn btn-secondary modal-btn" id="btn-cancel-delete" :disabled="isDeleting" @click="closeDeleteModal">
 Batal
 </button>
 <button
 class="btn modal-btn modal-btn-danger"
 id="btn-confirm-delete"
 :disabled="!deleteConfirmed || isDeleting"
 @click="confirmDelete"
 >
 {{ isDeleting ? 'Menghapus...' : `Hapus ${deleteTargets.length} dokumen` }}
 </button>
 </div>
 </div>
 </div>
 </Transition>
 </Teleport>

 <!-- ===================== MODAL: Konfirmasi Kembalikan dari Sampah ===================== -->
 <Teleport to="body">
  <Transition name="modal-fade">
   <div v-if="showTrashRestoreModal" class="modal-overlay" @click.self="closeTrashRestore">
    <div class="modal-box delete-confirm-box" role="dialog" aria-modal="true" aria-labelledby="trash-restore-title" @keydown.esc="closeTrashRestore">
     <div class="modal-icon-wrap primary">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
     </div>
     <h3 id="trash-restore-title" class="modal-title">Kembalikan {{ trashRestoreTargets.length }} dokumen?</h3>
     <p class="modal-desc">
      Dokumen berikut akan dikembalikan dari Sampah ke <strong>Arsip Aktif</strong>.
      <template v-if="trashRestoreScopeNote">{{ trashRestoreScopeNote }}</template>
     </p>

     <!-- Pilihan cakupan: hanya muncul bila ada dokumen yang dicentang -->
     <div v-if="trashRestoreScope !== 'single' && trashSelectedCount > 0" class="trash-scope-toggle" role="radiogroup" aria-label="Cakupan pemulihan">
      <button type="button" role="radio" class="trash-scope-opt" :class="{ active: trashRestoreScope === 'selected' }" :aria-checked="trashRestoreScope === 'selected'" :disabled="isTrashRestoring" @click="trashRestoreScope = 'selected'">
       Terpilih ({{ trashSelectedCount }})
      </button>
      <button type="button" role="radio" class="trash-scope-opt" :class="{ active: trashRestoreScope === 'all' }" :aria-checked="trashRestoreScope === 'all'" :disabled="isTrashRestoring" @click="trashRestoreScope = 'all'">
       Semua ({{ filteredTrash.length }})
      </button>
     </div>

     <ul class="delete-doc-list">
      <li v-for="doc in trashRestoreTargets.slice(0, 6)" :key="doc.id">
       <span class="ddl-name">{{ doc.namaDokumen || doc.program || doc.id }}</span>
       <span class="ddl-id">{{ doc.id }}</span>
      </li>
      <li v-if="trashRestoreTargets.length > 6" class="ddl-more">…dan {{ trashRestoreTargets.length - 6 }} dokumen lainnya</li>
     </ul>

     <div class="modal-actions">
      <button class="btn btn-secondary modal-btn" id="btn-cancel-trash-restore" :disabled="isTrashRestoring" @click="closeTrashRestore">
       Batal
      </button>
      <button
       class="btn btn-primary modal-btn"
       id="btn-confirm-trash-restore"
       :disabled="isTrashRestoring || trashRestoreTargets.length === 0"
       @click="confirmTrashRestore"
      >
       {{ trashRestoreConfirmLabel }}
      </button>
     </div>
    </div>
   </div>
  </Transition>
 </Teleport>

 <!-- ===================== MODAL: Edit Metadata ===================== -->
 <Teleport to="body">
 <Transition name="modal-fade">
 <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
 <div class="modal-box modal-wide">
 <h3 class="modal-title" style="text-align:left; margin-bottom: 4px;">
 <i data-lucide="pencil" style="width:18px;height:18px; vertical-align:middle; margin-right:6px; color: var(--primary-color);"></i>
 Edit Metadata Dokumen
 </h3>
 <p class="modal-desc" style="text-align:left; margin-bottom: 20px;">
 Ubah informasi dokumen tanpa mengubah isi file atau hasil analisis AI.
 </p>

 <div class="form-group">
 <label class="form-label" for="modal-nama-dokumen">Nama Dokumen</label>
 <input
 type="text"
 id="modal-nama-dokumen"
 class="form-input"
 v-model="editForm.namaDokumen"
 placeholder="Nama file atau judul dokumen RKA"
 >
 </div>
 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
 <div class="form-group">
 <label class="form-label" for="modal-tahun">Tahun Anggaran</label>
 <input
 type="number"
 id="modal-tahun"
 class="form-input"
 v-model.number="editForm.tahun"
 min="2020"
 max="2035"
 >
 </div>
 <div class="form-group">
 <label class="form-label" for="modal-opd">OPD / Satuan Kerja</label>
 <input
 type="text"
 id="modal-opd"
 class="form-input"
 v-model="editForm.opd"
 placeholder="Nama OPD atau SKPD"
 >
 </div>
 </div>

 <div class="modal-actions" style="margin-top: 8px;">
 <button class="btn btn-secondary modal-btn" id="btn-cancel-edit" @click="showEditModal = false">
 Batal
 </button>
 <button class="btn btn-primary modal-btn" id="btn-proceed-save" @click="openSaveConfirmModal">
 <i data-lucide="save"></i> Simpan Perubahan
 </button>
 </div>
 </div>
 </div>
 </Transition>
 </Teleport>

 <!-- ===================== MODAL: Save Confirmation ===================== -->
 <Teleport to="body">
 <Transition name="modal-fade">
 <div v-if="showSaveConfirmModal" class="modal-overlay" @click.self="showSaveConfirmModal = false">
 <div class="modal-box">
 <div class="modal-icon-wrap primary">
 <i data-lucide="save"></i>
 </div>
 <h3 class="modal-title">Simpan Perubahan?</h3>
 <p class="modal-desc">Perubahan metadata dokumen akan disimpan ke arsip.</p>
 <div class="modal-actions">
 <button class="btn btn-secondary modal-btn" id="btn-cancel-save" @click="cancelSave">
 Batal
 </button>
 <button class="btn btn-primary modal-btn" id="btn-confirm-save" @click="confirmEdit">
 <i data-lucide="check-circle-2"></i> Simpan
 </button>
 </div>
 </div>
 </div>
 </Transition>
 </Teleport>

 <!-- ===================== MODAL: Unggah Ulang & Re-analisis PDF ===================== -->
 <Teleport to="body">
 <Transition name="modal-fade">
 <div v-if="showReuploadModal" class="modal-overlay" @click.self="handleCloseReuploadModal">
 <div class="modal-box modal-wide">
 <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
 <div class="modal-icon-wrap primary" style="width: 38px; height: 38px; margin: 0; background: rgba(14, 107, 94, 0.12); color: var(--primary-color);">
 <i data-lucide="refresh-cw"></i>
 </div>
 <div style="text-align: left;">
 <h3 class="modal-title" style="text-align:left; margin: 0; font-size: 1.1rem; color: var(--text-primary);">
 Unggah Ulang PDF & Analisis Ulang
 </h3>
 <span style="font-size: 0.8rem; color: var(--text-secondary);">
 Perbaiki analisis yang kurang tepat dengan mengevaluasi ulang berkas PDF dokumen ini
 </span>
 </div>
 </div>

 <!-- Target Doc Summary Box -->
 <div class="reupload-target-card" v-if="reuploadTarget">
 <div class="target-card-row">
 <span class="target-card-label">ID Dokumen:</span>
 <span class="target-card-val bold">{{ reuploadTarget.id }}</span>
 </div>
 <div class="target-card-row">
 <span class="target-card-label">Nama Dokumen:</span>
 <span class="target-card-val" :title="reuploadTarget.namaDokumen || reuploadTarget.program">{{ reuploadTarget.namaDokumen || reuploadTarget.program }}</span>
 </div>
 <div class="target-card-row">
 <span class="target-card-label">OPD / SKPD:</span>
 <span class="target-card-val" :title="reuploadTarget.opd">{{ cleanOpdName(reuploadTarget.opd) }}</span>
 </div>
 <div class="target-card-row">
 <span class="target-card-label">Nilai Prakiraan Dampak Saat Ini:</span>
 <span class="target-card-val">
 <span :class="['sroi-badge-pill', getSroiInfo(reuploadTarget).badgeClass]" style="padding: 2px 8px; font-size: 10.5px;">
 {{ getSroiInfo(reuploadTarget).scoreText }} · {{ getSroiInfo(reuploadTarget).label }}
 </span>
 </span>
 </div>
 </div>

 <!-- Dropzone Area -->
 <div
 v-if="!isReanalyzing"
 class="reupload-dropzone"
 :class="{ 'drag-over': isReuploadDragOver }"
 @dragover.prevent="isReuploadDragOver = true"
 @dragleave.prevent="isReuploadDragOver = false"
 @drop.prevent="handleReuploadDrop"
 @click="triggerReuploadFileInput"
 >
 <input
 type="file"
 ref="reuploadFileInput"
 accept=".pdf,application/pdf"
 style="display: none;"
 @change="handleReuploadFileSelect"
 />
 <div v-if="!selectedReuploadFile" class="dropzone-inner">
 <div class="dropzone-icon">
 <i data-lucide="upload-cloud"></i>
 </div>
 <div class="dropzone-text">
 <strong>Klik untuk memilih berkas PDF</strong> atau tarik dan lepas berkas di sini
 </div>
 <div class="dropzone-hint">Pilih berkas PDF RKA yang sesuai (Maksimal 25MB)</div>
 </div>
 <div v-else class="selected-file-box" @click.stop>
 <div class="selected-file-info">
 <i data-lucide="file-text" style="width: 26px; height: 26px; color: var(--primary-color);"></i>
 <div style="text-align: left;">
 <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">{{ selectedReuploadFile.name }}</div>
 <div style="font-size: 0.75rem; color: var(--text-secondary);">{{ formatFileSize(selectedReuploadFile.size) }}</div>
 </div>
 </div>
 <button class="btn btn-secondary btn-sm" @click="selectedReuploadFile = null" title="Ganti Berkas">
 <i data-lucide="x"></i> Ganti
 </button>
 </div>
 </div>

 <!-- Re-analysis Progress Bar -->
 <div v-else class="reupload-progress-box">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
 <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
 <i data-lucide="loader-2" class="spin-anim" style="width: 16px; height: 16px; color: var(--primary-color);"></i>
 {{ reuploadProgressText }}
 </span>
 <span style="font-size: 0.85rem; font-weight: 800; color: var(--primary-color);">{{ reuploadProgress }}%</span>
 </div>
 <div class="progress-bar-bg" style="height: 8px; border-radius: 4px; background: rgba(0,0,0,0.06); overflow: hidden;">
 <div class="progress-bar-fill" :style="{ width: reuploadProgress + '%' }" style="height: 100%; background: var(--primary-color); transition: width 0.3s ease;"></div>
 </div>
 <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px; margin-bottom: 0;">
 Layanan AI sedang mengekstrak data dan mengkalkulasi ulang Nilai Prakiraan Dampak berdasarkan dokumen PDF baru...
 </p>
 </div>

 <!-- Actions -->
 <div class="modal-actions" style="margin-top: 20px;">
 <button
 class="btn btn-secondary modal-btn"
 :disabled="isReanalyzing"
 @click="handleCloseReuploadModal"
 >
 Batal
 </button>
 <button
 class="btn btn-primary modal-btn"
 :disabled="!selectedReuploadFile || isReanalyzing"
 @click="executeReanalysis"
 style="display: inline-flex; align-items: center; gap: 6px;"
 >
 <i :data-lucide="isReanalyzing ? 'loader-2' : 'play-circle'" :class="{ 'spin-anim': isReanalyzing }"></i>
 <span>{{ isReanalyzing ? 'Menganalisis Ulang...' : 'Mulai Analisis Ulang' }}</span>
 </button>
 </div>
 </div>
 </div>
 </Transition>
 </Teleport>

 <!-- ===================== MODAL: Upload / Restore Backup .html ===================== -->
 <Teleport to="body">
 <Transition name="modal-fade">
 <div v-if="showRestoreModal" class="modal-overlay" @click.self="handleCloseRestoreModal">
 <div class="modal-box modal-wide">

 <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
 <div class="modal-icon-wrap primary" style="width: 38px; height: 38px; margin: 0; background: rgba(14, 107, 94, 0.12); color: var(--primary-color);">
 <i data-lucide="upload"></i>
 </div>
 <div style="text-align: left;">
 <h3 class="modal-title" style="text-align:left; margin: 0; font-size: 1.1rem; color: var(--text-primary);">
 Upload Backup .html — Pulihkan Data
 </h3>
 <span style="font-size: 0.8rem; color: var(--text-secondary);">
 Pilih berkas cadangan <strong>.html</strong> yang sebelumnya diunduh dari sistem ini
 </span>
 </div>
 </div>

 <!-- Info box -->
 <div class="restore-info-box">
 <div style="display: flex; align-items: flex-start; gap: 10px;">
 <i data-lucide="info" style="width: 16px; height: 16px; flex-shrink: 0; color: #0284c7; margin-top: 1px;"></i>
 <div style="font-size: 0.8rem; color: #0369a1; line-height: 1.5;">
 <strong>Format yang didukung:</strong> Berkas <code>.html</code> cadangan yang dihasilkan oleh tombol <em>"Unduh Data RKA"</em> pada sistem ini. Berkas HTML mengandung seluruh data JSON yang akan dipulihkan ke server.
 </div>
 </div>
 </div>

 <!-- Dropzone -->
 <div
 v-if="!isRestoring"
 class="reupload-dropzone"
 :class="{ 'drag-over': isRestoreDragOver }"
 @dragover.prevent="isRestoreDragOver = true"
 @dragleave.prevent="isRestoreDragOver = false"
 @drop.prevent="handleRestoreDrop"
 @click="triggerRestoreFileInput"
 >
 <input
 type="file"
 ref="restoreFileInput"
 accept=".html,text/html"
 style="display: none;"
 @change="handleRestoreFileSelect"
 />
 <div v-if="!selectedRestoreFile" class="dropzone-inner">
 <div class="dropzone-icon" style="background: rgba(2, 132, 199, 0.1); color: #0284c7;">
 <i data-lucide="file-code"></i>
 </div>
 <div class="dropzone-text">
 <strong>Klik untuk memilih berkas .html</strong> atau tarik dan lepas di sini
 </div>
 <div class="dropzone-hint">Hanya berkas cadangan .html dari sistem ini yang didukung</div>
 </div>
 <div v-else class="selected-file-box" @click.stop>
 <div class="selected-file-info">
 <i data-lucide="file-code" style="width: 26px; height: 26px; color: #0284c7;"></i>
 <div style="text-align: left;">
 <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">{{ selectedRestoreFile.name }}</div>
 <div style="font-size: 0.75rem; color: var(--text-secondary);">{{ formatFileSize(selectedRestoreFile.size) }}</div>
 </div>
 </div>
 <button class="btn btn-secondary btn-sm" @click="selectedRestoreFile = null" title="Ganti Berkas">
 <i data-lucide="x"></i> Ganti
 </button>
 </div>
 </div>

 <!-- Progress saat restore -->
 <div v-if="isRestoring" class="reupload-progress-box" style="margin: 14px 0;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
 <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
 <i data-lucide="loader-2" class="spin-anim" style="width: 16px; height: 16px; color: #0284c7;"></i>
 Memulihkan data dari berkas cadangan...
 </span>
 </div>
 <div class="progress-bar-bg" style="height: 8px; border-radius: 4px; background: rgba(0,0,0,0.06); overflow: hidden;">
 <div class="progress-bar-fill" style="height: 100%; background: #0284c7; width: 100%; animation: progress-indeterminate 1.2s ease-in-out infinite;"></div>
 </div>
 <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px; margin-bottom: 0;">
 Mengekstrak data JSON dari berkas .html dan mengunggahnya ke server...
 </p>
 </div>

 <!-- Actions -->
 <div class="modal-actions" style="margin-top: 20px;">
 <button
 class="btn btn-secondary modal-btn"
 :disabled="isRestoring"
 @click="handleCloseRestoreModal"
 >
 Batal
 </button>
 <button
 class="btn modal-btn"
 style="background: #0284c7; color: #fff; border-color: #0284c7;"
 :disabled="!selectedRestoreFile || isRestoring"
 @click="executeRestore"
 >
 <i :data-lucide="isRestoring ? 'loader-2' : 'cloud-upload'" :class="{ 'spin-anim': isRestoring }"></i>
 <span>{{ isRestoring ? 'Memulihkan...' : 'Pulihkan Data' }}</span>
 </button>
 </div>

 </div>
 </div>
 </Transition>
 </Teleport>

 <!-- ===================== MODAL: Edit Hasil Analisis Manual ═════════════════
 Panel identik dengan "Edit Manual" pada halaman Hasil Analisis, termasuk
 tab "Belanja & Realokasi" (Analisis Komponen Belanja & Rekomendasi Belanja). -->
 <AnalysisEditManualModal
 v-if="showManualAnalysisModal && manualAnalysisTarget"
 :analysis="manualAnalysisTarget"
 @close="closeManualAnalysisModal"
 @saved="closeManualAnalysisModal"
 />

 <!-- ===================== MODAL: Edit dengan AI ═════════════════════════════
 Panel identik dengan "Edit dengan AI" pada halaman Hasil Analisis: instruksi
 bebas + pilihan bagian (termasuk Komponen Belanja & Rekomendasi Realokasi)
 dengan pratinjau perubahan sebelum disimpan sebagai versi baru. -->
 <AnalysisEditAiModal
 v-if="showEditAiModal && editAiTarget"
 :analysis="editAiTarget"
 @close="closeEditAiModal"
 @saved="closeEditAiModal"
 />

 </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useAnalysis, computeSroi16Rules, cleanOpdName } from '../composables/useAnalysis';
import { downloadAnalysisHtmlReport } from '@/utils/htmlReportGenerator';
import PageHero from './PageHero.vue';
import ArsipBackupModal from './ArsipBackupModal.vue';
import AnalysisEditManualModal from './AnalysisEditManualModal.vue';
import AnalysisEditAiModal from './AnalysisEditAiModal.vue';

const {
 rkis,
 currentTab,
 loadHistoricalDocIntoAnalyzer,
 deleteRki,
 deleteRkiBulk,
 updateRkiMetadata,
 reanalyzeDocWithPdf,
 regenerateDocFromStoredText,
 formatRupiah,
 downloadUserBackup,
 downloadFullBackupJson,
 downloadUserBackupJson,
 restoreDatabase,
 currentUser,
 arsipLastSyncAt,
 arsipSyncing,
 arsipSyncError,
 refreshArsip,
 realtimeConnected,
 fetchTrash,
 restoreTrashBulk
} = useAnalysis();

// ── Search & Filter ──────────────────────────────────────────────────
const searchQuery = ref('');
const filterStatus = ref('all');

// Waktu unggah dalam milidetik. Mendukung ISO (2026-09-20T05:03:51Z) dan format
// lokal lama "dd/mm/yyyy hh.mm(.ss)". Tanpa tanggal valid → 0 (tampil paling bawah).
const getUploadTime = (item) => {
 const raw = item?.tanggalUpload || item?.createdAt || item?.uploadedAt || item?.timestamp;
 if (!raw) return 0;
 if (typeof raw === 'number') return raw;
 const str = String(raw).trim();
 const local = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ ,T]+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?)?/);
 if (local) {
 const [, d, mo, y, h = 0, mi = 0, sec = 0] = local;
 return new Date(+y, +mo - 1, +d, +h, +mi, +sec).getTime();
 }
 const parsed = Date.parse(str);
 return Number.isNaN(parsed) ? 0 : parsed;
};

// Urutan arsip: yang terbaru (tanggal & jam unggah) selalu di paling atas,
// termasuk setelah dokumen ditambahkan/dipulihkan dari backup.
const filteredRkis = computed(() => {
 const q = searchQuery.value.toLowerCase().trim();
 return rkis.value
 .filter(item => {
 return !q ||
 (item.namaDokumen || '').toLowerCase().includes(q) ||
 (item.opd || '').toLowerCase().includes(q) ||
 (item.program || '').toLowerCase().includes(q) ||
 (item.id || '').toLowerCase().includes(q);
 })
 .sort((a, b) => getUploadTime(b) - getUploadTime(a));
});

// ── Modal State ───────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const showEditModal = ref(false);
const showSaveConfirmModal = ref(false);
const showReuploadModal = ref(false);
const editTarget = ref(null);
const editForm = ref({ namaDokumen: '', tahun: new Date().getFullYear(), opd: '' });

// ── Menu "Lainnya" per baris (Edit Manual / Edit dengan AI) ───────────
const openMoreMenuId = ref(null);
const toggleMoreMenu = (id) => {
 openMoreMenuId.value = openMoreMenuId.value === id ? null : id;
};
const closeMoreMenu = () => { openMoreMenuId.value = null; };

// ── Edit Hasil Analisis secara Manual ────────────────────────────────
// Menggunakan panel yang sama persis dengan "Edit Manual" di halaman Hasil
// Analisis (AnalysisEditManualModal), lengkap dengan semua bagian termasuk
// "Belanja & Realokasi" (Analisis Komponen Belanja & Rekomendasi Belanja).
const showManualAnalysisModal = ref(false);
const manualAnalysisTarget = ref(null);

const openManualAnalysisModal = (item) => {
 closeMoreMenu();
 manualAnalysisTarget.value = item;
 showManualAnalysisModal.value = true;
};

const closeManualAnalysisModal = () => {
 showManualAnalysisModal.value = false;
 manualAnalysisTarget.value = null;
};

// ── Edit Hasil Analisis dengan AI ────────────────────────────────────
// Menggunakan panel yang sama persis dengan "Edit dengan AI" di halaman Hasil
// Analisis (AnalysisEditAiModal): instruksi bebas + pilihan bagian (termasuk
// Komponen Belanja & Rekomendasi Realokasi) dengan pratinjau sebelum disimpan.
const showEditAiModal = ref(false);
const editAiTarget = ref(null);

const openEditAiModal = (item) => {
 closeMoreMenu();
 editAiTarget.value = item;
 showEditAiModal.value = true;
};

const closeEditAiModal = () => {
 showEditAiModal.value = false;
 editAiTarget.value = null;
};

// ── Muat Ulang PDF ───────────────────────────────────────────────────
// Generate ulang analisis AI dari teks PDF yang sudah tersimpan (tanpa unggah PDF lagi),
// lalu langsung menampilkan hasil analisisnya.
const muatUlangId = ref(null);
const muatUlangText = ref('');

const handleMuatUlangPdf = async (item) => {
  closeMoreMenu();
  if (muatUlangId.value) return;
  const useFallback = !item.hasSourceText;
  if (useFallback && !confirm('Teks PDF asli dokumen ini belum tersimpan (dokumen lama).\n\nAI akan menganalisis ulang berdasarkan HASIL ANALISIS yang sudah ada, bukan dari PDF asli, sehingga bisa kurang akurat. Untuk hasil terbaik gunakan "Unggah Ulang PDF".\n\nLanjutkan Muat Ulang PDF?')) return;
  muatUlangId.value = item.id;
  muatUlangText.value = 'Menyiapkan…';
  try {
    const updated = await regenerateDocFromStoredText(item.id, (_prog, text) => {
      muatUlangText.value = text;
    }, { allowFallback: useFallback });
    if (updated) loadHistoricalDocIntoAnalyzer(updated);
  } catch (err) {
    console.error('Muat Ulang PDF gagal:', err);
    alert('Gagal Muat Ulang PDF: ' + (err.message || 'Terjadi kesalahan'));
  } finally {
    muatUlangId.value = null;
    muatUlangText.value = '';
  }
};

// ── Re-upload & Re-analyze State ─────────────────────────────────────
const reuploadTarget = ref(null);
const selectedReuploadFile = ref(null);
const isReuploadDragOver = ref(false);
const reuploadFileInput = ref(null);
const isReanalyzing = ref(false);
const reuploadProgress = ref(0);
const reuploadProgressText = ref('');

// ── Navigation ────────────────────────────────────────────────────────
const goToUpload = () => { currentTab.value = 'dashboard'; };
const viewItem = (item) => { loadHistoricalDocIntoAnalyzer(item); };

// ── Re-upload Flow (Semua Role) ──────────────────────────────────────
const openReuploadModal = (item) => {
 reuploadTarget.value = item;
 selectedReuploadFile.value = null;
 reuploadProgress.value = 0;
 reuploadProgressText.value = '';
 isReanalyzing.value = false;
 showReuploadModal.value = true;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
};

const handleCloseReuploadModal = () => {
 if (isReanalyzing.value) return;
 showReuploadModal.value = false;
 reuploadTarget.value = null;
 selectedReuploadFile.value = null;
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

const handleReuploadDrop = (e) => {
 isReuploadDragOver.value = false;
 const file = e.dataTransfer.files?.[0];
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
 if (!reuploadTarget.value || !selectedReuploadFile.value || isReanalyzing.value) return;
 isReanalyzing.value = true;
 reuploadProgress.value = 10;
 reuploadProgressText.value = 'Mempersiapkan dokumen...';
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });

 try {
 const updated = await reanalyzeDocWithPdf(
 reuploadTarget.value.id,
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
 reuploadTarget.value = null;
 selectedReuploadFile.value = null;
 // Otomatis buka dokumen yang telah diperbarui ke view analisis
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

// ── Restore / Upload Backup .html Flow ───────────────────────────────
const showRestoreModal = ref(false);
const selectedRestoreFile = ref(null);
const isRestoreDragOver = ref(false);
const isRestoring = ref(false);
const restoreFileInput = ref(null);

const openRestoreModal = () => {
 selectedRestoreFile.value = null;
 isRestoring.value = false;
 showRestoreModal.value = true;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
};

const handleCloseRestoreModal = () => {
 if (isRestoring.value) return;
 showRestoreModal.value = false;
 selectedRestoreFile.value = null;
};

const triggerRestoreFileInput = () => {
 if (restoreFileInput.value) restoreFileInput.value.click();
};

const validateRestoreFile = (file) => {
 if (!file) return false;
 const name = file.name.toLowerCase();
 if (!name.endsWith('.html') && !name.endsWith('.htm')) {
 alert('Hanya berkas cadangan .html yang didukung.');
 return false;
 }
 return true;
};

const handleRestoreFileSelect = (e) => {
 const file = e.target.files?.[0];
 if (file && validateRestoreFile(file)) {
 selectedRestoreFile.value = file;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
 }
};

const handleRestoreDrop = (e) => {
 isRestoreDragOver.value = false;
 const file = e.dataTransfer.files?.[0];
 if (file && validateRestoreFile(file)) {
 selectedRestoreFile.value = file;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
 }
};

const executeRestore = async () => {
 if (!selectedRestoreFile.value || isRestoring.value) return;
 isRestoring.value = true;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
 try {
 const text = await selectedRestoreFile.value.text();
 const success = await restoreDatabase(text);
 if (success) {
 showRestoreModal.value = false;
 selectedRestoreFile.value = null;
 }
 } catch (err) {
 console.error('Restore failed:', err);
 alert('Gagal memulihkan data: ' + (err.message || 'Terjadi kesalahan'));
 } finally {
 isRestoring.value = false;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
 }
};

// ── Pilih & Hapus (satu, beberapa, atau semua) ────────────────────────
const selectedIds = ref(new Set());
let lastCheckedIndex = -1;

const selectedCount = computed(() => selectedIds.value.size);
const allVisibleSelected = computed(() =>
 filteredRkis.value.length > 0 && filteredRkis.value.every(i => selectedIds.value.has(i.id))
);
const someVisibleSelected = computed(() => selectedCount.value > 0 && !allVisibleSelected.value);

const clearSelection = () => { selectedIds.value = new Set(); lastCheckedIndex = -1; };

const toggleSelectAll = () => {
 if (allVisibleSelected.value) { clearSelection(); return; }
 selectedIds.value = new Set(filteredRkis.value.map(i => i.id));
};

// Klik biasa: pilih/batalkan satu dokumen. Shift+klik: pilih rentang dari klik sebelumnya.
const onRowCheck = (e, item, index) => {
 const on = !selectedIds.value.has(item.id);
 const next = new Set(selectedIds.value);
 if (e.shiftKey && lastCheckedIndex >= 0 && lastCheckedIndex < filteredRkis.value.length) {
 const [from, to] = [Math.min(lastCheckedIndex, index), Math.max(lastCheckedIndex, index)];
 for (let i = from; i <= to; i++) {
 const id = filteredRkis.value[i].id;
 if (on) next.add(id); else next.delete(id);
 }
 } else if (on) {
 next.add(item.id);
 } else {
 next.delete(item.id);
 }
 selectedIds.value = next;
 lastCheckedIndex = index;
};

// Buang pilihan yang sudah tidak tampil (terhapus, tersaring pencarian, atau berubah dari perangkat lain).
watch(filteredRkis, (list) => {
 if (selectedIds.value.size === 0) return;
 const visible = new Set(list.map(i => i.id));
 const kept = [...selectedIds.value].filter(id => visible.has(id));
 if (kept.length !== selectedIds.value.size) selectedIds.value = new Set(kept);
});

// ── Delete Flow (konfirmasi dengan mengetik kalimat, seperti GitHub) ──
const deleteTargets = ref([]);
const deleteConfirmText = ref('');
const deleteScopeNote = ref('');
const isDeleting = ref(false);
const deleteConfirmInput = ref(null);

const deletePhrase = computed(() => `hapus ${deleteTargets.value.length} dokumen`);
const deleteConfirmed = computed(() => deleteConfirmText.value.trim() === deletePhrase.value);

const openDeleteModal = (items, scopeNote = '') => {
 const list = (Array.isArray(items) ? items : [items]).filter(Boolean);
 if (list.length === 0) return;
 deleteTargets.value = [...list];
 deleteConfirmText.value = '';
 deleteScopeNote.value = scopeNote;
 showDeleteModal.value = true;
 nextTick(() => deleteConfirmInput.value?.focus());
};

const openBulkDelete = () => {
 openDeleteModal(filteredRkis.value.filter(i => selectedIds.value.has(i.id)));
};

const openDeleteAll = () => {
 openDeleteModal(
 filteredRkis.value,
 searchQuery.value.trim()
 ? 'Hanya dokumen yang cocok dengan pencarian saat ini.'
 : 'Ini mencakup seluruh dokumen yang tampil di arsip.'
 );
};

const closeDeleteModal = () => {
 if (isDeleting.value) return;
 showDeleteModal.value = false;
 deleteTargets.value = [];
 deleteConfirmText.value = '';
};

const confirmDelete = async () => {
 if (!deleteConfirmed.value || isDeleting.value) return;
 isDeleting.value = true;
 try {
 const ids = deleteTargets.value.map(d => d.id);
 const result = await deleteRkiBulk(ids);
 if (result.failed.length === ids.length) return; // semuanya gagal: biarkan dialog terbuka agar bisa dicoba lagi
 loadTrash(); // dokumen yang baru dihapus sekarang ada di tab Sampah
 const gone = new Set(result.deleted);
 selectedIds.value = new Set([...selectedIds.value].filter(id => !gone.has(id)));
 showDeleteModal.value = false;
 deleteTargets.value = [];
 deleteConfirmText.value = '';
 } finally {
 isDeleting.value = false;
 }
};

// ── Tab Arsip Aktif / Sampah ─────────────────────────────────────────
// Dokumen yang dihapus tidak langsung hilang: server memindahkannya ke Sampah
// dan menyimpannya TRASH_RETENTION_DAYS hari (samakan dengan TRASH_RETENTION_DAYS di server.js).
const TRASH_RETENTION_DAYS = 30;
const activeView = ref('aktif'); // 'aktif' | 'sampah'
const trashItems = ref([]);
const trashLoading = ref(false);
let trashReloadQueued = false;

// Permintaan yang datang saat pemuatan masih berjalan digabung jadi satu muat ulang susulan.
const loadTrash = async () => {
  if (trashLoading.value) { trashReloadQueued = true; return; }
  trashLoading.value = true;
  try {
    trashItems.value = await fetchTrash();
  } finally {
    trashLoading.value = false;
    if (trashReloadQueued) { trashReloadQueued = false; loadTrash(); }
  }
};

const switchView = (view) => {
  if (activeView.value === view) return;
  activeView.value = view;
  searchQuery.value = ''; // pencarian tidak dibawa ke tab lain agar cakupan "Semua" tidak terfilter diam-diam
  clearSelection();
  clearTrashSelection();
  closeMoreMenu();
  if (view === 'sampah') loadTrash();
};

const getDeletedTime = (item) => {
  const t = Date.parse(item?.deletedAt || '');
  return Number.isNaN(t) ? 0 : t;
};

const filteredTrash = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  return trashItems.value
    .filter(item => {
      return !q ||
        (item.namaDokumen || '').toLowerCase().includes(q) ||
        (item.opd || '').toLowerCase().includes(q) ||
        (item.program || '').toLowerCase().includes(q) ||
        String(item.id || '').toLowerCase().includes(q);
    })
    .sort((a, b) => getDeletedTime(b) - getDeletedTime(a));
});

const trashColspan = computed(() => (isPrivileged.value ? 9 : 8));

// Sisa waktu sebelum dokumen di Sampah hangus otomatis.
const trashExpiry = (item) => {
  const t = getDeletedTime(item);
  if (!t) return { text: '—', urgent: false };
  const left = TRASH_RETENTION_DAYS - Math.floor((Date.now() - t) / 86400000);
  if (left <= 0) return { text: 'Segera hangus', urgent: true };
  return { text: `${left} hari lagi`, urgent: left <= 3 };
};

// Pilih (satu, beberapa, atau semua) di Sampah — pola sama dengan arsip aktif.
const trashSelectedIds = ref(new Set());
let lastTrashCheckedIndex = -1;

const trashSelectedCount = computed(() => trashSelectedIds.value.size);
const allTrashSelected = computed(() =>
  filteredTrash.value.length > 0 && filteredTrash.value.every(i => trashSelectedIds.value.has(i.id))
);
const someTrashSelected = computed(() => trashSelectedCount.value > 0 && !allTrashSelected.value);

const clearTrashSelection = () => { trashSelectedIds.value = new Set(); lastTrashCheckedIndex = -1; };

const toggleTrashSelectAll = () => {
  if (allTrashSelected.value) { clearTrashSelection(); return; }
  trashSelectedIds.value = new Set(filteredTrash.value.map(i => i.id));
};

// Klik biasa: pilih/batalkan satu dokumen. Shift+klik: pilih rentang dari klik sebelumnya.
const onTrashRowCheck = (e, item, index) => {
  const on = !trashSelectedIds.value.has(item.id);
  const next = new Set(trashSelectedIds.value);
  if (e.shiftKey && lastTrashCheckedIndex >= 0 && lastTrashCheckedIndex < filteredTrash.value.length) {
    const [from, to] = [Math.min(lastTrashCheckedIndex, index), Math.max(lastTrashCheckedIndex, index)];
    for (let i = from; i <= to; i++) {
      const id = filteredTrash.value[i].id;
      if (on) next.add(id); else next.delete(id);
    }
  } else if (on) {
    next.add(item.id);
  } else {
    next.delete(item.id);
  }
  trashSelectedIds.value = next;
  lastTrashCheckedIndex = index;
};

// Buang pilihan yang sudah tidak tampil (dipulihkan, hangus, atau tersaring pencarian).
watch(filteredTrash, (list) => {
  if (trashSelectedIds.value.size === 0) return;
  const visible = new Set(list.map(i => i.id));
  const kept = [...trashSelectedIds.value].filter(id => visible.has(id));
  if (kept.length !== trashSelectedIds.value.size) trashSelectedIds.value = new Set(kept);
});

// Konfirmasi kembalikan: Terpilih / Semua / satu dokumen, dengan tombol Batal.
const showTrashRestoreModal = ref(false);
const trashRestoreScope = ref('selected'); // 'selected' | 'all' | 'single'
const trashRestoreSingle = ref(null);
const isTrashRestoring = ref(false);

const trashRestoreTargets = computed(() => {
  if (trashRestoreScope.value === 'single') return trashRestoreSingle.value ? [trashRestoreSingle.value] : [];
  if (trashRestoreScope.value === 'selected') return filteredTrash.value.filter(i => trashSelectedIds.value.has(i.id));
  return filteredTrash.value;
});

const trashRestoreScopeNote = computed(() => {
  if (trashRestoreScope.value !== 'all') return '';
  return searchQuery.value.trim()
    ? 'Hanya dokumen yang cocok dengan pencarian saat ini.'
    : 'Ini mencakup seluruh dokumen di Sampah.';
});

const trashRestoreConfirmLabel = computed(() => {
  if (isTrashRestoring.value) return 'Mengembalikan...';
  const n = trashRestoreTargets.value.length;
  if (trashRestoreScope.value === 'selected') return `Kembalikan Terpilih (${n})`;
  if (trashRestoreScope.value === 'all') return `Kembalikan Semua (${n})`;
  return 'Kembalikan';
});

const openTrashRestore = (scope, item = null) => {
  if (scope === 'selected' && trashSelectedCount.value === 0) return;
  if (scope === 'all' && filteredTrash.value.length === 0) return;
  if (scope === 'single' && !item) return;
  trashRestoreScope.value = scope;
  trashRestoreSingle.value = item;
  showTrashRestoreModal.value = true;
};

const closeTrashRestore = () => {
  if (isTrashRestoring.value) return;
  showTrashRestoreModal.value = false;
  trashRestoreSingle.value = null;
};

const confirmTrashRestore = async () => {
  const targets = trashRestoreTargets.value;
  if (targets.length === 0 || isTrashRestoring.value) return;
  isTrashRestoring.value = true;
  try {
    const ids = targets.map(t => t.id);
    const result = await restoreTrashBulk(ids);
    if (result.failed.length === ids.length) return; // semuanya gagal: biarkan dialog terbuka agar bisa dicoba lagi
    const back = new Set(result.restored);
    trashSelectedIds.value = new Set([...trashSelectedIds.value].filter(id => !back.has(id)));
    showTrashRestoreModal.value = false;
    trashRestoreSingle.value = null;
    await loadTrash();
  } finally {
    isTrashRestoring.value = false;
  }
};

// Server memindahkan dokumen ke Sampah SETELAH arsip aktif berubah, jadi perubahan dari
// perangkat lain (realtime) dimuat ulang dengan jeda singkat agar tidak mendahului penulisan Sampah.
let trashSyncTimer = null;
watch(() => rkis.value.length, () => {
  clearTimeout(trashSyncTimer);
  trashSyncTimer = setTimeout(loadTrash, 800);
});

// ── Edit Flow ─────────────────────────────────────────────────────────
const openEditModal = (item) => {
 editTarget.value = item;
 editForm.value = {
 namaDokumen: item.namaDokumen || item.program || '',
 tahun: item.tahunRencana || item.tahun || new Date().getFullYear(),
 opd: cleanOpdName(item.opd || '')
 };
 showEditModal.value = true;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
};

const openSaveConfirmModal = () => {
 showEditModal.value = false;
 showSaveConfirmModal.value = true;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
};

const cancelSave = () => {
 showSaveConfirmModal.value = false;
 showEditModal.value = true;
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
};

const confirmEdit = () => {
 if (editTarget.value) {
 updateRkiMetadata(editTarget.value.id, {
 namaDokumen: editForm.value.namaDokumen,
 tahun: editForm.value.tahun,
 tahunRencana: editForm.value.tahun,
 opd: cleanOpdName(editForm.value.opd)
 });
 showSaveConfirmModal.value = false;
 editTarget.value = null;
 }
};

// ── Formatting Helpers ────────────────────────────────────────────────
const formatDate = (isoStr) => {
 if (!isoStr) return '—';
 try {
 return new Intl.DateTimeFormat('id-ID', {
 day: '2-digit',
 month: 'short',
 year: 'numeric',
 hour: '2-digit',
 minute: '2-digit'
 }).format(new Date(isoStr));
 } catch {
 return isoStr;
 }
};

const formatFileSize = (bytes) => {
 if (!bytes) return '—';
 if (bytes < 1024) return bytes + ' B';
 if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
 return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getSroiInfo = (item) => {
 if (!item) {
 return {
 ratio: null,
 scoreText: '—',
 label: 'Belum Dinilai',
 fullLabel: 'Belum Dapat Dinilai',
 badgeClass: 'sroi-badge-gray',
 tone: 'tone-gray'
 };
 }

 // 1. Selalu utamakan kalkulasi 16 Aturan Baku SROI (identik 100% dengan halaman Analisis)
 const calc = computeSroi16Rules(item);
 if (calc.isValid) {
 return {
 ratio: calc.sroiRatio,
 scoreText: calc.sroiScore,
 label: calc.shortLabel,
 fullLabel: calc.sroiStatus,
 badgeClass: calc.tone === 'tone-green' ? 'sroi-badge-green' : (calc.tone === 'tone-yellow' ? 'sroi-badge-yellow' : 'sroi-badge-red'),
 tone: calc.tone
 };
 }

 // 2. Fallback jika pagu/outcome belum lengkap tetapi ada properti sroi langsung
 let ratio = null;
 if (typeof item.sroi === 'number' && !isNaN(item.sroi)) {
 ratio = item.sroi;
 } else if (typeof item.sroiRatio === 'number' && !isNaN(item.sroiRatio)) {
 ratio = item.sroiRatio;
 } else if (typeof item.sroi === 'string') {
 const m = item.sroi.match(/([\d.,]+)/);
 if (m) {
 ratio = parseFloat(m[1].replace(',', '.'));
 }
 }

 if (ratio === null || isNaN(ratio) || ratio <= 0) {
 return {
 ratio: null,
 scoreText: item.sroi ? String(item.sroi).replace(' : 1', '').trim() : '—',
 label: 'Belum Dinilai',
 fullLabel: 'Belum Dapat Dinilai',
 badgeClass: 'sroi-badge-gray',
 tone: 'tone-gray'
 };
 }

 const scoreText = ratio.toFixed(2);
 let label = 'Kurang';
 let fullLabel = 'Nilai Sosial Tidak Seimbang dengan Investasi';
 let badgeClass = 'sroi-badge-red';
 let tone = 'tone-red';

 if (ratio >= 1.0) {
 label = 'Layak';
 fullLabel = 'Nilai Sosial Positif (Layak)';
 badgeClass = 'sroi-badge-green';
 tone = 'tone-green';
 } else if (ratio >= 0.6) {
 label = 'Cukup';
 fullLabel = 'Nilai Sosial Cukup / Keringanan (Moderat)';
 badgeClass = 'sroi-badge-yellow';
 tone = 'tone-yellow';
 }

 return {
 ratio,
 scoreText,
 label,
 fullLabel,
 badgeClass,
 tone
 };
};

const getSroiBadgeClass = (sroi) => {
 const num = typeof sroi === 'number' ? sroi : parseFloat(String(sroi).replace(',', '.'));
 if (num >= 1.0) return 'sroi-badge-green';
 if (num >= 0.6) return 'sroi-badge-yellow';
 if (num > 0) return 'sroi-badge-red';
 return 'sroi-badge-gray';
};

const getSroiLabel = (sroi) => {
 const num = typeof sroi === 'number' ? sroi : parseFloat(String(sroi).replace(',', '.'));
 if (num >= 1.0) return 'Layak';
 if (num >= 0.6) return 'Cukup';
 if (num > 0) return 'Kurang';
 return 'Belum Dinilai';
};

const getStatusBadgeClass = (status) => {
 if (status === 'Approved') return 'badge-success';
 return 'badge-primary';
};

const getStatusText = (status) => {
 if (status === 'Approved') return 'DISAHKAN';
 return 'DRAF';
};

// ── Lucide refresh ────────────────────────────────────────────────────
// ── Backup & Pemulihan ─────────────────────────────────────────────────
const showBackupModal = ref(false);
const exportingJson = ref(false);
const isPrivileged = computed(() => ['admin', 'moderator'].includes(currentUser.value?.role));
const exportTitle = computed(() => isPrivileged.value
 ? 'Unduh seluruh database (dokumen RKA, riwayat versi SSH, akun, konfigurasi, log) sebagai JSON — Admin/Moderator'
 : 'Unduh seluruh dokumen RKA milik akun Anda beserta riwayat versinya dalam satu berkas JSON');

// Admin/moderator: database penuh. User biasa: hanya dokumen miliknya (server menolak export-full untuk user).
const exportDatabaseJson = async () => {
 if (exportingJson.value) return;
 exportingJson.value = true;
 try {
 await (isPrivileged.value ? downloadFullBackupJson() : downloadUserBackupJson());
 } finally {
 exportingJson.value = false;
 }
};

// ── Sinkronisasi & indikator arsip ────────────────────────────────────
const nowTick = ref(Date.now());
let nowTimer = null;

const formatClock = (iso) => {
 try {
 return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
 } catch { return ''; }
};

const relativeSync = computed(() => {
 if (!arsipLastSyncAt.value) return 'belum tersinkron';
 const sec = Math.max(0, Math.round((nowTick.value - Date.parse(arsipLastSyncAt.value)) / 1000));
 if (sec < 10) return 'terakhir sinkron baru saja';
 if (sec < 60) return `terakhir sinkron ${sec} dtk lalu`;
 if (sec < 3600) return `terakhir sinkron ${Math.floor(sec / 60)} mnt lalu`;
 return `terakhir sinkron pukul ${formatClock(arsipLastSyncAt.value)}`;
});

const syncState = computed(() => {
 if (arsipSyncing.value) return { kind: 'syncing', label: 'Menyinkronkan', detail: 'memuat data terbaru dari server…' };
 if (arsipSyncError.value) return { kind: 'error', label: 'Gagal sinkron', detail: `${arsipSyncError.value} · ${relativeSync.value}` };
 if (realtimeConnected.value) return { kind: 'live', label: 'Live', detail: `arsip diperbarui otomatis saat ada perubahan · ${relativeSync.value}` };
 return { kind: 'offline', label: 'Realtime terputus', detail: `data dimuat ulang otomatis tiap 30 detik · ${relativeSync.value}` };
});

const syncTitle = computed(() =>
 arsipLastSyncAt.value ? `Terakhir cocok dengan server: ${formatClock(arsipLastSyncAt.value)}` : 'Belum ada sinkronisasi'
);

const manualRefresh = () => { refreshArsip(); };

// Sorot dokumen yang baru muncul (dari unggahan, gabung backup, atau perubahan user lain).
const newIds = ref(new Set());
let knownIds = null;
watch(() => rkis.value.map(r => r.id), (ids) => {
 const current = new Set(ids);
 if (knownIds === null) { knownIds = current; return; } // pertama kali: hanya catat data awal
 const fresh = ids.filter(id => !knownIds.has(id));
 knownIds = current;
 if (!fresh.length) return;
 newIds.value = new Set([...newIds.value, ...fresh]);
 setTimeout(() => {
 const next = new Set(newIds.value);
 fresh.forEach(id => next.delete(id));
 newIds.value = next;
 }, 8000);
}, { immediate: true });

onMounted(() => {
 if (window.lucide) nextTick(() => window.lucide.createIcons());
 nowTimer = setInterval(() => { nowTick.value = Date.now(); }, 10000);
 refreshArsip(); // pastikan data yang tampil sudah sama dengan server saat halaman dibuka
 loadTrash(); // jumlah di tab Sampah
 document.addEventListener('click', closeMoreMenu);
});

onUnmounted(() => {
 if (nowTimer) clearInterval(nowTimer);
 clearTimeout(trashSyncTimer);
 document.removeEventListener('click', closeMoreMenu);
});

watch([showDeleteModal, showEditModal, showSaveConfirmModal, showReuploadModal, showRestoreModal, showManualAnalysisModal, showEditAiModal, filteredRkis, activeView], () => {
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
});
</script>

<style scoped>
<style scoped>
/* ── Pilih & hapus massal ── */
.arsip-bulk-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: auto; }
.bulk-count { font-size: 0.8rem; font-weight: 700; color: var(--primary-color); margin-right: 2px; }
.bulk-btn {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 8px 14px;
 font-size: 0.78rem;
 font-weight: 700;
 border-radius: 8px;
 cursor: pointer;
 border: 1px solid transparent;
 white-space: nowrap;
 transition: filter 0.15s, background 0.15s;
}
.bulk-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.bulk-btn-clear { color: var(--text-secondary); background: var(--bg-secondary); border-color: var(--border-color); }
.bulk-btn-clear:hover { background: var(--bg-primary); }
.bulk-btn-danger { color: #fff; background: #c4344f; }
.bulk-btn-danger:hover { filter: brightness(1.1); }
.bulk-btn-danger-outline { color: #c4344f; background: transparent; border-color: rgba(196, 52, 79, 0.45); }
.bulk-btn-danger-outline:hover:not(:disabled) { background: rgba(196, 52, 79, 0.08); }
.arsip-th-check, .arsip-td-check { width: 44px; text-align: center; padding-left: 16px !important; padding-right: 4px !important; }
.arsip-check { width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary-color); vertical-align: middle; }
/* Checkbox baris hanya muncul saat baris di-hover, sedang di-checked, atau lagi fokus (keyboard) */
.arsip-td-check .arsip-check {
 opacity: 0;
 transition: opacity 0.15s ease;
}
.arsip-row:hover .arsip-td-check .arsip-check,
.arsip-td-check .arsip-check:checked,
.arsip-td-check .arsip-check:focus-visible {
 opacity: 1;
}
tr.arsip-row-selected { background-color: rgba(var(--primary-rgb), 0.09); }
tr.arsip-row-selected:hover { background-color: rgba(var(--primary-rgb), 0.13); }

/* ── Dialog konfirmasi hapus ── */
.delete-confirm-box { max-width: 500px; }
.delete-doc-list {
 list-style: none;
 margin: 12px 0 8px;
 padding: 0;
 max-height: 190px;
 overflow-y: auto;
 text-align: left;
 border: 1px solid var(--border-color);
 border-radius: 10px;
 background: var(--bg-secondary);
}
.delete-doc-list li { display: flex; flex-direction: column; gap: 1px; padding: 8px 12px; border-bottom: 1px solid var(--border-color); font-size: 0.8rem; }
.delete-doc-list li:last-child { border-bottom: none; }
.ddl-name { font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddl-id { font-size: 0.7rem; color: var(--text-muted); font-family: ui-monospace, Menlo, Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddl-more { color: var(--text-secondary); font-style: italic; }
.delete-confirm-label { display: block; margin: 14px 0 8px; font-size: 0.82rem; text-align: left; color: var(--text-secondary); }
.delete-phrase {
 font-family: ui-monospace, Menlo, Consolas, monospace;
 font-weight: 700;
 color: #c4344f;
 background: rgba(196, 52, 79, 0.1);
 padding: 2px 7px;
 border-radius: 5px;
 user-select: all;
}
.delete-confirm-input { width: 100%; }
.modal-btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }
/* ── Indikator sinkronisasi arsip ── */
.arsip-sync-bar {
 display: flex;
 align-items: center;
 gap: 10px;
 flex-wrap: wrap;
 margin: 0 20px 12px;
 padding: 8px 12px;
 border-radius: 8px;
 font-size: 0.78rem;
 color: var(--text-secondary);
 background: var(--bg-secondary);
 border: 1px solid var(--border-color);
}
.arsip-sync-bar .sync-text { flex: 1; min-width: 180px; }
.sync-dot { width: 9px; height: 9px; border-radius: 50%; background: #9ca3af; flex-shrink: 0; }
.sync-live .sync-dot { background: #10b981; box-shadow: 0 0 0 0 rgba(16,185,129,0.5); animation: sync-pulse 2s infinite; }
.sync-live strong { color: #059669; }
.sync-syncing .sync-dot { background: #3b82f6; }
.sync-syncing strong { color: #2563eb; }
.sync-offline .sync-dot { background: #f59e0b; }
.sync-offline strong { color: #b45309; }
.sync-error { border-color: rgba(239,68,68,0.35); }
.sync-error .sync-dot { background: #ef4444; }
.sync-error strong { color: #dc2626; }
.sync-refresh-btn {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 5px 10px;
 font-size: 0.75rem;
 font-weight: 600;
 border-radius: 6px;
 cursor: pointer;
 color: var(--text-primary);
 background: transparent;
 border: 1px solid var(--border-color);
}
.sync-refresh-btn:hover:not(:disabled) { background: rgba(0,0,0,0.05); }
.sync-refresh-btn:disabled { opacity: 0.6; cursor: default; }
@keyframes sync-pulse {
 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
 70% { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
}
/* ── Sorotan dokumen baru ── */
.arsip-row-new { animation: row-new-flash 2.4s ease-out 1; box-shadow: inset 3px 0 0 #10b981; }
.badge-new-doc {
 display: inline-block;
 margin-left: 6px;
 padding: 1px 6px;
 font-size: 9.5px;
 font-weight: 800;
 letter-spacing: 0.04em;
 border-radius: 4px;
 color: #fff;
 background: #10b981;
 vertical-align: middle;
}
@keyframes row-new-flash {
 0% { background: rgba(16,185,129,0.28); }
 100% { background: transparent; }
}
.badge-ver-count {
 background: var(--info-glow);
 color: var(--info-hover);
 font-size: 10px;
 font-weight: 800;
 padding: 1px 6px;
 border-radius: 6px;
 border: 1px solid var(--info-glow);
 display: inline-block;
 margin-left: 6px;
}

.arsip-btn-reupload {
 color: #0284c7;
 background: #f0f9ff;
 border-color: #bae6fd;
}

.arsip-btn-reupload:hover {
 background: #0284c7;
 color: #ffffff;
}

/* SROI Badge Pill Styling */
.sroi-badge-pill {
 display: inline-flex;
 align-items: center;
 gap: 5px;
 padding: 4px 11px;
 border-radius: 20px;
 font-size: 11px;
 font-weight: 700;
 text-decoration: none;
 white-space: nowrap;
 transition: all 0.2s ease;
 box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.sroi-badge-pill:hover {
 transform: translateY(-1px);
 box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.sroi-badge-ratio {
 font-family: 'JetBrains Mono', monospace, sans-serif;
 font-weight: 800;
 font-size: 11.5px;
}

.sroi-badge-sep {
 opacity: 0.5;
}

.sroi-badge-label {
 font-size: 10.5px;
}

/* 1. Hijau: SROI >= 1.0 (Layak) */
.sroi-badge-green {
 background: #ecfdf5 !important;
 color: #065f46 !important;
 border: 1px solid #6ee7b7 !important;
}

/* 2. Kuning: 0.6 <= SROI < 1.0 (Keringanan / Moderat) */
.sroi-badge-yellow {
 background: #fefce8 !important;
 color: #854d0e !important;
 border: 1px solid #fde047 !important;
}

/* 3. Merah: SROI < 0.6 (Tidak Seimbang) */
.sroi-badge-red {
 background: #fef2f2 !important;
 color: #991b1b !important;
 border: 1px solid #fca5a5 !important;
}

/* 4. Abu-abu: Belum Dapat Dinilai */
.sroi-badge-gray {
 background: #f8fafc !important;
 color: #475569 !important;
 border: 1px solid #cbd5e1 !important;
}

/* Reupload Modal Component Styling */
.reupload-target-card {
 background: var(--bg-main, #f8fafc);
 border: 1px solid var(--border-color, #e2e8f0);
 border-radius: 10px;
 padding: 12px 16px;
 margin: 14px 0;
 display: flex;
 flex-direction: column;
 gap: 6px;
}

.target-card-row {
 display: flex;
 justify-content: space-between;
 align-items: center;
 font-size: 0.82rem;
}

.target-card-label {
 color: var(--text-secondary, #64748b);
 font-weight: 500;
}

.target-card-val {
 color: var(--text-primary, #1e293b);
 max-width: 65%;
 text-align: right;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;
}

.target-card-val.bold {
 font-weight: 700;
 font-family: 'JetBrains Mono', monospace;
}

.reupload-dropzone {
 border: 2px dashed var(--border-color, #cbd5e1);
 border-radius: 12px;
 padding: 24px 16px;
 text-align: center;
 cursor: pointer;
 background: #fafafa;
 transition: all 0.2s ease;
}

.reupload-dropzone:hover, .reupload-dropzone.drag-over {
 border-color: var(--primary-color, #1B4D46);
 background: rgba(14, 107, 94, 0.04);
}

.dropzone-inner {
 display: flex;
 flex-direction: column;
 align-items: center;
 gap: 8px;
}

.dropzone-icon {
 width: 44px;
 height: 44px;
 border-radius: 50%;
 background: rgba(14, 107, 94, 0.1);
 color: var(--primary-color, #1B4D46);
 display: flex;
 align-items: center;
 justify-content: center;
}

.dropzone-text {
 font-size: 0.88rem;
 color: var(--text-primary, #334155);
}

.dropzone-hint {
 font-size: 0.75rem;
 color: var(--text-muted, #94a3b8);
}

.selected-file-box {
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 8px 12px;
 background: #ffffff;
 border: 1px solid var(--border-color, #e2e8f0);
 border-radius: 8px;
}

.selected-file-info {
 display: flex;
 align-items: center;
 gap: 10px;
}

.reupload-progress-box {
 background: #ffffff;
 border: 1px solid var(--border-color, #e2e8f0);
 border-radius: 10px;
 padding: 16px;
 margin: 10px 0;
}

.spin-anim {
 animation: spin 1s linear infinite;
}

@keyframes spin {
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
}

/* Restore Info Box */
.restore-info-box {
 background: #f0f9ff;
 border: 1px solid #bae6fd;
 border-radius: 8px;
 padding: 10px 14px;
 margin: 12px 0;
}

.restore-info-box code {
 background: #e0f2fe;
 color: #0369a1;
 padding: 1px 5px;
 border-radius: 4px;
 font-size: 0.8rem;
 font-family: 'JetBrains Mono', monospace;
}

/* Indeterminate progress bar animation */
@keyframes progress-indeterminate {
 0% { transform: translateX(-100%); width: 60%; }
 50% { transform: translateX(60%); width: 60%; }
 100% { transform: translateX(200%); width: 60%; }
}

/* ── Tab Arsip Aktif / Sampah ── */
.arsip-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 24px 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.arsip-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 8px 8px 0 0;
  background: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}
.arsip-tab:hover:not(.active) { color: var(--text-secondary); background: var(--bg-tertiary); }
.arsip-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); background: var(--bg-primary); }
.arsip-tab-count {
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}
.arsip-tab.active .arsip-tab-count { color: var(--primary-color); border-color: rgba(var(--primary-rgb), 0.35); }
.arsip-tab-count.has-items { color: #c4344f; background: rgba(196, 52, 79, 0.08); border-color: rgba(196, 52, 79, 0.3); }

/* ── Sampah ── */
.arsip-trash-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 24px;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.arsip-trash-note svg { flex-shrink: 0; margin-top: 2px; color: var(--primary-color); }
.bulk-btn-restore { color: #fff; background: var(--primary-color); }
.bulk-btn-restore:hover { filter: brightness(1.1); }
.bulk-btn-restore-outline { color: var(--primary-color); background: transparent; border-color: rgba(var(--primary-rgb), 0.45); }
.bulk-btn-restore-outline:hover:not(:disabled) { background: rgba(var(--primary-rgb), 0.08); }
.trash-doc-name { font-weight: 700; color: var(--text-primary); }
.trash-by { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
.trash-expiry {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  white-space: nowrap;
}
.trash-expiry.urgent { color: #c4344f; background: rgba(196, 52, 79, 0.08); border-color: rgba(196, 52, 79, 0.3); }
.trash-restore-btn { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.78rem; padding: 5px 10px; white-space: nowrap; }

/* Pilihan cakupan di dialog kembalikan */
.trash-scope-toggle {
  display: flex;
  gap: 4px;
  margin: 12px 0 0;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
}
.trash-scope-opt {
  flex: 1;
  padding: 8px 10px;
  border: none;
  border-radius: 7px;
  background: none;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.trash-scope-opt:disabled { opacity: 0.5; cursor: not-allowed; }
.trash-scope-opt.active { color: #fff; background: var(--primary-color); }
</style>

