<template>
 <div class="admin-dashboard">
 <!-- Top Banner -->
 <div class="admin-topbar">
 <div class="admin-topbar-left">
 <div class="admin-brand-badge">
 <div class="admin-icon-circle">
 <i data-lucide="shield" class="admin-brand-icon"></i>
 </div>
 <div>
 <div class="admin-brand-title">
 Dasbor Admin
 </div>
 <div class="admin-brand-sub">
 Manajemen User, Log Audit, Status API, & Konfigurasi Sistem
 </div>
 </div>
 </div>
 </div>
 <div class="admin-topbar-right">
 <span class="admin-badge badge-admin">
 <i data-lucide="crown"></i>
 Administrator
 </span>
 </div>
 </div>

 <!-- Tabs -->
 <div class="admin-tabs">
 <button
 v-for="tab in visibleTabs"
 :key="tab.id"
 :class="['admin-tab-btn', { active: activeTab === tab.id }]"
 @click="switchTab(tab.id)"
 >
 <i :data-lucide="tab.icon"></i>
 {{ tab.label }}
 </button>
 </div>

 <!-- ── TAB: STATISTIK ──────────────────────────────────────────────── -->
 <div v-if="activeTab === 'stats'" class="admin-content">
 <div v-if="statsLoading" class="admin-loading">
 <i data-lucide="loader-2" class="spin-anim"></i> Memuat statistik...
 </div>
 <div v-else class="stats-grid">
 <!-- User Stats -->
 <div class="stat-card stat-blue">
 <div class="stat-icon-wrap"><i data-lucide="users"></i></div>
 <div class="stat-info">
 <div class="stat-label">Total User</div>
 <div class="stat-value">{{ stats.users?.userCount || 0 }} <span class="stat-sub">/ {{ stats.users?.userLimit || 60 }}</span></div>
 <div class="stat-desc">{{ stats.users?.activeCount || 0 }} aktif</div>
 </div>
 </div>
 <div class="stat-card stat-green">
 <div class="stat-icon-wrap"><i data-lucide="file-text"></i></div>
 <div class="stat-info">
 <div class="stat-label">Dokumen RKA</div>
 <div class="stat-value">{{ stats.rka?.total || 0 }}</div>
 </div>
 </div>
 <div class="stat-card stat-amber">
 <div class="stat-icon-wrap"><i data-lucide="coins"></i></div>
 <div class="stat-info">
 <div class="stat-label">Total Pagu RKA</div>
 <div class="stat-value">{{ formatPagu(stats.rka?.totalPagu) }}</div>
 <div class="stat-desc">Seluruh dokumen</div>
 </div>
 </div>
 </div>

 <!-- Storage Info Card -->
 <div class="storage-info-card">
 <div class="storage-info-header">
 <i data-lucide="hard-drive"></i>
 <span>Penggunaan Penyimpanan</span>
 <span v-if="storageStats.loading" style="margin-left:auto;font-size:0.72rem;color:var(--text-muted);">
 <i data-lucide="loader-2" class="spin-anim" style="width:12px;height:12px;"></i> Memuat...
 </span>
 <span v-else-if="storageStats.type" style="margin-left:auto;font-size:0.7rem;color:var(--text-muted);">{{ storageStats.type }}</span>
 </div>
 <div class="storage-stats-row">
 <!-- Terpakai -->
 <div class="storage-stat-item">
 <div class="storage-stat-icon storage-icon-used"><i data-lucide="database"></i></div>
 <div class="storage-stat-info">
 <div class="storage-stat-label">Terpakai</div>
 <div class="storage-stat-value">
 {{ storageStats.usedLabel || '—' }}
 <span v-if="storageStats.usagePercent !== null" :class="['storage-pct-badge', storageStats.usagePercent >= 85 ? 'pct-danger' : storageStats.usagePercent >= 60 ? 'pct-warn' : 'pct-ok']">{{ storageStats.usagePercent }}%</span>
 </div>
 </div>
 </div>
 <!-- Limit -->
 <div class="storage-stat-item">
 <div class="storage-stat-icon storage-icon-limit"><i data-lucide="layers"></i></div>
 <div class="storage-stat-info">
 <div class="storage-stat-label">Kapasitas Maksimal</div>
 <div class="storage-stat-value">{{ storageStats.quotaLabel || '5 GB' }}</div>
 </div>
 </div>
 <!-- Ambang Penghapusan -->
 <div class="storage-stat-item">
 <div class="storage-stat-icon storage-icon-threshold"><i data-lucide="alert-triangle"></i></div>
 <div class="storage-stat-info">
 <div class="storage-stat-label">Ambang Failover/Rotasi</div>
 <div class="storage-stat-value">85% kapasitas</div>
 <div class="storage-stat-desc">Data otomatis pindah ke DB cadangan</div>
 </div>
 </div>
 </div>
 <!-- Progress bar -->
 <div v-if="storageStats.usagePercent !== null" class="storage-progress-wrap">
 <div class="storage-progress-bar">
 <div
 :class="['storage-progress-fill', storageStats.usagePercent >= 85 ? 'fill-danger' : storageStats.usagePercent >= 60 ? 'fill-warn' : 'fill-ok']"
 :style="{ width: Math.min(storageStats.usagePercent, 100) + '%' }"
 ></div>
 <div class="storage-threshold-line" style="left: 85%;"></div>
 </div>
 <div class="storage-progress-labels">
 <span>0</span>
 <span style="position:absolute;left:85%;transform:translateX(-50%);color:#f59e0b;font-size:0.68rem;">85% (rotasi)</span>
 <span style="margin-left:auto;">{{ storageStats.quotaLabel || '5 GB' }}</span>
 </div>
 </div>
 <div v-else-if="!storageStats.loading" class="storage-local-note">
 <i data-lucide="info" style="width:13px;height:13px;"></i>
 Mode penyimpanan lokal — kapasitas bergantung pada disk server, tanpa batas kuota otomatis.
 </div>
 </div>

 <!-- API Status Cards -->
 <div class="section-title"><i data-lucide="wifi"></i> Status Koneksi API &amp; Penyimpanan</div>
 <div class="api-status-grid">
 <div :class="['api-status-card', stats.api?.geminiSet ? 'api-ok' : 'api-off']">
 <div class="api-status-icon">
 <i :data-lucide="stats.api?.geminiSet ? 'check-circle-2' : 'x-circle'"></i>
 </div>
 <div class="api-status-info">
 <div class="api-name"> Gemini API</div>
 <div class="api-use">Analisis RKA &amp; Ekstraksi SSH</div>
 <span :class="['api-pill', stats.api?.geminiSet ? 'pill-on' : 'pill-off']">
 {{ stats.api?.geminiSet ? 'Terkonfigurasi' : 'Belum Dikonfigurasi' }}
 </span>
 </div>
 </div>
 <div class="api-status-card api-ok">
 <div class="api-status-icon">
 <i data-lucide="hard-drive"></i>
 </div>
 <div class="api-status-info">
 <div class="api-name"> Database Storage</div>
 <div class="api-use">Permanen dengan Auto-Snapshot Backup</div>
 <span class="api-pill pill-on">Aktif &amp; Terproteksi</span>
 </div>
 </div>
 </div>
 </div>

 <!-- ── TAB: LOG AKTIVITAS ───────────────────────────────────────────── -->
 <div v-if="activeTab === 'logs'" class="admin-content">
 <div class="logs-header-row">
 <div>
 <div class="section-title" style="margin:0"><i data-lucide="activity"></i> Log Aktivitas &amp; Audit Trail</div>
 <div class="section-subtitle">Rekaman riwayat aksi pengguna, proses login, unggahan berkas RKA, dan pemulihan data.</div>
 </div>
 <div class="logs-actions">
 <button class="btn-refresh" @click="loadLogs" :disabled="logsLoading">
 <i data-lucide="refresh-cw" :class="{ 'spin-anim': logsLoading }"></i> Segarkan
 </button>
 <button class="btn-clear-logs" @click="confirmClearLogs">
 <i data-lucide="trash"></i> Bersihkan Log
 </button>
 </div>
 </div>

 <!-- Filters Row -->
 <div class="logs-filter-bar">
 <div class="log-search-wrap">
 <i data-lucide="search"></i>
 <input
 v-model="logsSearch"
 @input="debounceSearchLogs"
 type="text"
 placeholder="Cari user, keterangan, atau IP address..."
 class="log-search-input"
 />
 </div>
 <div class="log-select-wrap">
 <label>Filter Aksi:</label>
 <select v-model="selectedAction" @change="loadLogs" class="log-select">
 <option value="ALL">Semua Aksi</option>
 <option value="UPLOAD_RKA"> UNGGAH RKA</option>
 <option value="UPDATE_RKA">UBAH RKA</option>
 <option value="DELETE_RKA">HAPUS RKA</option>
 <option value="LOGIN">LOGIN</option>
 <option value="LOGOUT">LOGOUT</option>
 <option value="EXPORT_BACKUP">EKSPOR BACKUP</option>
 <option value="RESTORE_BACKUP">PULIHKAN BACKUP</option>
 <option value="CREATE_USER">TAMBAH USER</option>
 <option value="UPDATE_CONFIG">UPDATE CONFIG</option>
 </select>
 </div>
 <div class="log-select-wrap">
 <label>Status Hasil:</label>
 <select v-model="selectedStatus" @change="loadLogs" class="log-select">
 <option value="ALL">Semua Status</option>
 <option value="SUCCESS"> Berhasil</option>
 <option value="FAILED"> Gagal</option>
 </select>
 </div>
 </div>

 <!-- Quick Filter Chips khusus Pengawasan Upload & Aktivitas -->
 <div class="logs-quick-filters">
 <button
 :class="['quick-filter-chip', { active: selectedAction === 'ALL' && selectedStatus === 'ALL' }]"
 @click="setQuickFilter('ALL', 'ALL')"
 >
 Semua Log ({{ logsTotal }})
 </button>
 <button
 :class="['quick-filter-chip chip-upload', { active: selectedAction === 'UPLOAD_RKA' && selectedStatus === 'ALL' }]"
 @click="setQuickFilter('UPLOAD_RKA', 'ALL')"
 >
 Semua Unggah RKA
 </button>
 <button
 :class="['quick-filter-chip chip-success', { active: selectedAction === 'UPLOAD_RKA' && selectedStatus === 'SUCCESS' }]"
 @click="setQuickFilter('UPLOAD_RKA', 'SUCCESS')"
 >
 Unggah RKA Berhasil
 </button>
 <button
 :class="['quick-filter-chip chip-failed', { active: selectedAction === 'UPLOAD_RKA' && selectedStatus === 'FAILED' }]"
 @click="setQuickFilter('UPLOAD_RKA', 'FAILED')"
 >
 Unggah RKA Gagal
 </button>
 </div>

 <!-- Logs Table -->
 <div class="logs-table-wrap">
 <div v-if="logsLoading" class="admin-loading" style="padding: 40px;">
 <i data-lucide="loader-2" class="spin-anim"></i> Memuat log aktivitas...
 </div>
 <table v-else class="logs-table">
 <thead>
 <tr>
 <th style="width: 150px;">Waktu</th>
 <th style="width: 170px;">Pengguna</th>
 <th style="width: 130px;">Aksi</th>
 <th style="width: 200px;">Target</th>
 <th>Keterangan Detail</th>
 <th style="width: 130px;">Status &amp; IP</th>
 </tr>
 </thead>
 <tbody>
 <tr v-if="logs.length === 0">
 <td colspan="6" class="no-data">Tidak ada log aktivitas yang tercatat.</td>
 </tr>
 <tr v-for="log in logs" :key="log.id" :class="['log-row', { 'log-row-failed': log.status === 'FAILED' }]">
 <td class="log-time-cell">
 <div class="log-time-rel">{{ formatLogTime(log.timestamp) }}</div>
 <div class="log-time-full">{{ formatDate(log.timestamp) }}</div>
 </td>
 <td>
 <div class="log-user-cell">
 <span :class="['role-pill-sm', getRolePillClass(log.role)]">{{ log.role || 'user' }}</span>
 <strong>{{ log.name || log.username }}</strong>
 <span class="log-username-sub">@{{ log.username }}</span>
 </div>
 </td>
 <td>
 <span :class="['action-badge', getActionBadgeClass(log.action)]">
 {{ log.action }}
 </span>
 </td>
 <td class="log-target-cell">
 <code>{{ log.target || '-' }}</code>
 </td>
 <td class="log-details-cell">
 {{ log.details || '-' }}
 </td>
 <td>
 <div class="log-status-cell">
 <span :class="['status-badge-pill', log.status === 'SUCCESS' ? 'badge-pill-success' : 'badge-pill-failed']">
 {{ log.status === 'SUCCESS' ? 'BERHASIL' : 'GAGAL' }}
 </span>
 <span class="log-ip">{{ log.ip || '127.0.0.1' }}</span>
 </div>
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 <div class="logs-footer-info">
 <span>Menampilkan {{ logs.length }} dari {{ logsTotal }} total catatan aktivitas</span>
 </div>
 </div>

 <!-- ── TAB: BACKUP & PEMULIHAN SISTEM ──────────────────────────────── -->
 <div v-if="activeTab === 'backup'" class="admin-content">
 <div class="backup-info-banner">
 <i data-lucide="shield-check" class="banner-icon"></i>
 <div>
 <strong>Sistem Penyimpanan Permanen &amp; Perlindungan Data</strong>
 <p>
 Database Sintra tersimpan permanen di Neon. Snapshot otomatis juga disimpan di database (berkala, harian, dan sebelum setiap pemulihan), sehingga tidak hilang walau server restart.
 Sebagai <strong>Administrator</strong>, Anda memiliki hak penuh untuk mengekspor database lengkap dan melakukan pemulihan (*restore*).
 </p>
 </div>
 </div>

 <div class="backup-grid">
 <!-- Card 1: Export Full Database -->
 <div class="backup-card">
 <div class="backup-card-icon export-icon">
 <i data-lucide="download-cloud"></i>
 </div>
 <div class="backup-card-body">
 <h3>Ekspor Full Database (JSON)</h3>
 <p>
 Unduh seluruh database aplikasi dalam format JSON lengkap termasuk:
 seluruh dokumen RKA, riwayat versi SSH, akun pengguna, konfigurasi, dan catatan log aktivitas.
 </p>
 <div class="backup-meta">
 <span><i data-lucide="file-check"></i> Format: Standar JSON</span>
 <span><i data-lucide="lock"></i> Keamanan: Terproteksi Token</span>
 </div>
 </div>
 <div style="display:flex; gap:8px; margin-top:16px;">
 <button class="btn-backup-action btn-export" @click="handleDownloadFullBackupHtml" :disabled="downloadingBackup" style="flex:1;">
 <i :data-lucide="downloadingBackup ? 'loader-2' : 'file-text'" :class="{ 'spin-anim': downloadingBackup }"></i>
 Unduh Format Nilai Prakiraan Dampak (.html)
 </button>
 <button class="btn-backup-action btn-export" @click="handleDownloadFullBackupJson" :disabled="downloadingBackup" style="flex:1;">
 <i :data-lucide="downloadingBackup ? 'loader-2' : 'download'" :class="{ 'spin-anim': downloadingBackup }"></i>
 Unduh Mentahan (.json)
 </button>
 </div>
 </div>

 <!-- Card 2: Restore Database -->
 <div class="backup-card">
 <div class="backup-card-icon restore-icon">
 <i data-lucide="upload-cloud"></i>
 </div>
 <div class="backup-card-body">
 <h3>Pemulihan Database (Restore)</h3>
 <p>
 Pulihkan data sistem dari berkas cadangan JSON yang telah diunduh sebelumnya.
 Data yang dipulihkan akan langsung menggantikan dan memperbarui data aktif saat ini.
 </p>
 <div class="restore-dropzone" @click="triggerFileInput">
 <input type="file" ref="fileInputRef" accept=".json" class="hidden-file-input" @change="handleFileSelected" />
 <i data-lucide="file-up"></i>
 <div v-if="selectedBackupFile" class="selected-file-info">
 <strong>{{ selectedBackupFile.name }}</strong>
 <span>({{ formatFileSize(selectedBackupFile.size) }})</span>
 </div>
 <div v-else>
 <span>Pilih atau drag &amp; drop file <code>.json</code> backup di sini</span>
 </div>
 </div>
 </div>
 <button
 class="btn-backup-action btn-restore"
 @click="executeRestore"
 :disabled="!selectedBackupFile || restoringBackup"
 >
 <i :data-lucide="restoringBackup ? 'loader-2' : 'refresh-cw'" :class="{ 'spin-anim': restoringBackup }"></i>
 {{ restoringBackup ? 'Memulihkan...' : 'Mulai Pemulihan Database' }}
 </button>
 </div>

 <!-- Card 3: Convert HTML to JSON (boleh banyak berkas sekaligus) -->
 <div class="backup-card">
 <div class="backup-card-icon export-icon" style="background: rgba(16,185,129,0.1); color: #10b981;">
 <i data-lucide="file-json"></i>
 </div>
 <div class="backup-card-body">
 <h3>Konversi HTML ke JSON</h3>
 <p>
 Unggah satu atau banyak file backup HTML (boleh drag &amp; drop) untuk mengekstrak data dan mengonversinya menjadi format JSON mentah standar.
 Jika lebih dari satu berkas, hasilnya diunduh sekaligus dalam satu berkas <code>.zip</code>.
 </p>
 <div class="restore-dropzone" @click="triggerConvertInput" @dragover.prevent @drop.prevent="handleConvertDrop">
 <input type="file" ref="convertFileInputRef" accept=".html,.htm" multiple class="hidden-file-input" @change="handleHtmlFileSelected" />
 <i data-lucide="file-input"></i>
 <div v-if="convertQueue.length === 0">
 <span>Pilih atau drag &amp; drop file <code>.html</code> untuk diekstrak</span>
 </div>
 <div v-else class="selected-file-info">
 <strong>{{ convertQueue.length }} berkas dipilih</strong>
 <span>({{ formatFileSize(convertQueue.reduce((n, i) => n + i.file.size, 0)) }})</span>
 </div>
 </div>

 <ul v-if="convertQueue.length" class="merge-file-list">
 <li v-for="item in convertQueue" :key="item.key" :class="'merge-' + item.status">
 <span class="merge-name" :title="item.file.name">{{ item.file.name }}</span>
 <span class="merge-status">{{ item.message || mergeStatusLabel(item.status) }}</span>
 <button v-if="item.status !== 'processing' && !convertingHtml" class="merge-remove" @click.stop="removeConvertItem(item.key)" title="Hapus dari daftar">&times;</button>
 </li>
 </ul>
 </div>
 <button
 class="btn-backup-action btn-export"
 style="background: var(--primary-color); border: none; color: #fff;"
 @click="executeHtmlConvert"
 :disabled="pendingConvertCount === 0 || convertingHtml"
 >
 <i :data-lucide="convertingHtml ? 'loader-2' : 'arrow-down-to-line'" :class="{ 'spin-anim': convertingHtml }"></i>
 {{ convertingHtml ? 'Mengekstrak...' : `Ekstrak JSON${pendingConvertCount > 1 ? ' (' + pendingConvertCount + ' berkas)' : ''}` }}
 </button>
 </div>

 <!-- Card 4: Tambah ke Arsip (Gabung, tanpa menghapus) -->
 <div class="backup-card">
 <div class="backup-card-icon export-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">
 <i data-lucide="files"></i>
 </div>
 <div class="backup-card-body">
 <h3>Tambah ke Arsip (Gabung)</h3>
 <p>
 Unggah berkas backup <code>.html</code> atau <code>.json</code> satu per satu (boleh banyak berkas sekaligus).
 Dokumen langsung diekstrak dan <strong>ditambahkan</strong> ke arsip. Dokumen yang sudah ada tidak dihapus.
 </p>
 <div class="restore-dropzone" @click="triggerMergeInput" @dragover.prevent @drop.prevent="handleMergeDrop">
 <input type="file" ref="mergeFileInputRef" accept=".html,.htm,.json" multiple class="hidden-file-input" @change="handleMergeFilesSelected" />
 <i data-lucide="file-plus"></i>
 <div v-if="mergeQueue.length === 0">
 <span>Pilih atau drag &amp; drop file <code>.html</code> / <code>.json</code></span>
 </div>
 <div v-else class="selected-file-info">
 <strong>{{ mergeQueue.length }} berkas dipilih</strong>
 </div>
 </div>

 <ul v-if="mergeQueue.length" class="merge-file-list">
 <li v-for="item in mergeQueue" :key="item.key" :class="'merge-' + item.status">
 <span class="merge-name" :title="item.file.name">{{ item.file.name }}</span>
 <span class="merge-status">{{ item.message || mergeStatusLabel(item.status) }}</span>
 <button v-if="item.status === 'pending' && !mergingBackup" class="merge-remove" @click.stop="removeMergeItem(item.key)" title="Hapus dari daftar">&times;</button>
 </li>
 </ul>

 <label class="merge-overwrite">
 <input type="checkbox" v-model="mergeOverwrite" :disabled="mergingBackup" />
 <span>Perbarui dokumen jika ID sudah ada (bawaan: dilewati)</span>
 </label>
 </div>
 <button
 class="btn-backup-action btn-export"
 style="background: #f59e0b; border: none; color: #fff;"
 @click="executeMerge"
 :disabled="pendingMergeCount === 0 || mergingBackup"
 >
 <i :data-lucide="mergingBackup ? 'loader-2' : 'plus-circle'" :class="{ 'spin-anim': mergingBackup }"></i>
 {{ mergingBackup ? 'Menambahkan...' : `Tambahkan ke Arsip${pendingMergeCount ? ' (' + pendingMergeCount + ')' : ''}` }}
 </button>
 </div>
 </div>

 <!-- Snapshots History Table -->
 <div class="snapshots-section">
 <div class="section-title"><i data-lucide="hard-drive"></i> Riwayat Snapshot Otomatis Server</div>
 <div class="snapshots-table-wrap">
 <table class="snapshots-table">
 <thead>
 <tr>
 <th>Nama File Snapshot</th>
 <th>Ukuran</th>
 <th>Waktu Dibuat</th>
 <th>Status</th>
 <th>Aksi</th>
 </tr>
 </thead>
 <tbody>
 <tr v-if="snapshotsList.length === 0">
 <td colspan="5" class="no-data">Belum ada snapshot di database.</td>
 </tr>
 <tr v-for="snap in snapshotsList" :key="snap.filename">
 <td><code class="snapshot-filename">{{ snap.filename }}</code></td>
 <td>{{ formatFileSize(snap.size) }}</td>
 <td>{{ formatDate(snap.createdAt) }}</td>
 <td>
 <span class="snapshot-badge-ok">
 <i data-lucide="check-circle" style="width:12px;height:12px;"></i> Tersimpan
 </span>
 </td>
 <td>
 <button
 v-if="snap.kind === 'snapshot' && /^snapshot_/.test(snap.filename)"
 class="btn-snapshot-restore"
 :disabled="!!restoringSnapshot"
 @click="restoreFromSnapshot(snap)"
 >
 <i :data-lucide="restoringSnapshot === snap.filename ? 'loader-2' : 'rotate-ccw'" :class="{ 'spin-anim': restoringSnapshot === snap.filename }" style="width:12px;height:12px;"></i>
 {{ restoringSnapshot === snap.filename ? 'Memulihkan...' : 'Pulihkan' }}
 </button>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>

 <!-- ── TAB: MANAJEMEN USER ─────────────────────────────────────────── -->
 <div v-if="activeTab === 'users'" class="admin-content">
 <!-- Header Row -->
 <div class="users-header-row">
 <div class="section-title" style="margin:0"><i data-lucide="users"></i> Daftar Pengguna</div>
 <div class="users-header-actions">
 <span class="user-count-badge">{{ users.filter(u => u.role === 'user').length }} / {{ userStats.userLimit || 60 }} User</span>
 <button class="btn-admin-primary" @click="openAddUser" :disabled="users.filter(u=>u.role==='user').length >= (userStats.userLimit || 60)">
 <i data-lucide="user-plus"></i> Tambah User
 </button>
 </div>
 </div>

 <!-- Search -->
 <div class="user-search-wrap">
 <i data-lucide="search"></i>
 <input v-model="searchUser" type="text" placeholder="Cari user berdasarkan nama atau username..." class="user-search-input" />
 </div>

 <!-- Table -->
 <div class="users-table-wrap">
 <table class="users-table">
 <thead>
 <tr>
 <th>#</th>
 <th>Nama</th>
 <th>Username</th>
 <th>Email</th>
 <th>Role</th>
 <th>Status</th>
 <th>Login Terakhir</th>
 <th>Aksi</th>
 </tr>
 </thead>
 <tbody>
 <tr v-if="filteredUsers.length === 0">
 <td colspan="8" class="no-data">Tidak ada user ditemukan.</td>
 </tr>
 <tr v-for="(user, idx) in filteredUsers" :key="user.id" :class="{ 'row-admin': user.role === 'admin' }">
 <td>{{ idx + 1 }}</td>
 <td>
 <div class="user-name-cell">
 <div :class="['user-avatar-sm', user.role === 'admin' ? 'avatar-admin' : 'avatar-user']">
 {{ initials(user.name) }}
 </div>
 <div>
 <div class="user-full-name">{{ user.name }}</div>
 <div class="user-id-sm">{{ user.id }}</div>
 </div>
 </div>
 </td>
 <td><code class="username-code">{{ user.username }}</code></td>
 <td>{{ user.email || '—' }}</td>
 <td>
 <span :class="['role-badge', user.role === 'admin' ? 'role-admin' : 'role-user']">
 <i :data-lucide="user.role === 'admin' ? 'crown' : 'user'"></i>
 {{ user.role === 'admin' ? 'Admin' : 'User' }}
 </span>
 </td>
 <td>
 <span :class="['status-badge', user.isActive ? 'status-active' : 'status-inactive']">
 {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
 </span>
 </td>
 <td class="last-login-cell">{{ formatDate(user.lastLogin) }}</td>
 <td>
 <div class="row-actions">
 <button class="btn-row-edit" @click="openEditUser(user)" title="Edit User">
 <i data-lucide="pencil"></i>
 </button>
 <button
 v-if="user.role !== 'admin'"
 class="btn-row-toggle"
 @click="toggleUserActive(user)"
 :title="user.isActive ? 'Nonaktifkan' : 'Aktifkan'"
 >
 <i :data-lucide="user.isActive ? 'user-x' : 'user-check'"></i>
 </button>
 <button v-if="user.role !== 'admin'" class="btn-row-delete" @click="confirmDeleteUser(user)" title="Hapus User">
 <i data-lucide="trash-2"></i>
 </button>
 </div>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <!-- ── TAB: KONFIGURASI API ──────────────────────────────────────────── -->
 <div v-if="activeTab === 'api'" class="admin-content">
 <div class="api-config-info-banner">
 <i data-lucide="shield-check"></i>
 <div>
 <strong>Keamanan API Key</strong><br>
 API Key disimpan di server backend secara aman dan <strong>tidak pernah dikirim ke browser pengguna</strong>. Hanya Admin yang dapat mengkonfigurasi API Key di sini.
 </div>
 </div>

 <!-- ═══ PUSAT MANAJEMEN KUNCI API (CRUD GEMINI & OPENAI) ══════════════ -->
 <div class="api-crud-container">
 <!-- Overview Stats Cards -->
 <div class="api-summary-grid">
 <div class="api-stat-card" :class="{ 'card-highlight': apiProviderFilter === 'ALL' }" @click="apiProviderFilter = 'ALL'">
 <div class="api-stat-icon icon-total">
 <img src="https://api.iconify.design/solar/key-minimalistic-bold-duotone.svg?color=%236366f1" width="24" height="24" alt="Total Kunci" />
 </div>
 <div class="api-stat-meta">
 <span class="api-stat-val">{{ apiConfig.stats?.total || 0 }}</span>
 <span class="api-stat-lbl">Total Kunci Terdaftar</span>
 </div>
 <div class="api-stat-sub">
 <span class="dot-live"></span> {{ apiConfig.stats?.active || 0 }} Kunci Aktif
 </div>
 </div>

 <div class="api-stat-card" :class="{ 'card-highlight': apiProviderFilter === 'gemini' }" @click="apiProviderFilter = 'gemini'">
 <div class="api-stat-icon icon-gemini">
 <img src="https://api.iconify.design/logos/google-gemini.svg" width="22" height="22" alt="Google Gemini" />
 </div>
 <div class="api-stat-meta">
 <span class="api-stat-val">{{ apiConfig.stats?.geminiTotal || 0 }}</span>
 <span class="api-stat-lbl">Google Gemini AI</span>
 </div>
 <div class="api-stat-sub">
 <span class="sub-active">{{ apiConfig.stats?.geminiActive || 0 }} Aktif</span> (Analisis RKA & SSH)
 </div>
 </div>

 <div class="api-stat-card card-action" @click="openAddKeyModal('gemini')">
 <div class="api-stat-icon icon-plus">
 <img src="https://api.iconify.design/solar/add-circle-bold-duotone.svg?color=%236366f1" width="24" height="24" alt="Tambah Kunci" />
 </div>
 <div class="api-stat-meta">
 <span class="api-stat-val-small">Tambah Kunci</span>
 <span class="api-stat-lbl">Klik untuk mendaftarkan API key baru</span>
 </div>
 </div>
 </div>

 <!-- Toolbar & Quick Action Buttons -->
 <div class="api-toolbar-card">
 <div class="api-toolbar-left">
 <button class="btn-api-action btn-add-primary" @click="openAddKeyModal('gemini')">
 <i data-lucide="plus"></i> Tambah Kunci API
 </button>
 <button class="btn-api-action btn-batch-import" @click="openBatchModal('gemini')">
 <i data-lucide="upload-cloud"></i> Impor Massal
 </button>
 <button class="btn-api-action btn-seed-defaults" @click="seedDefaultGeminiKeys" :disabled="seedingDefaults">
 <i data-lucide="refresh-cw" :class="{ 'spin-anim': seedingDefaults }"></i> Muat 10 Pool Gemini Bawaan
 </button>
 </div>

 <div class="api-toolbar-right">
 <button class="btn-api-toggle-all" @click="toggleShowAllKeys" :title="showAllKeys ? 'Sembunyikan Semua Kunci' : 'Tampilkan Semua Kunci'">
 <i :data-lucide="showAllKeys ? 'eye-off' : 'eye'"></i>
 {{ showAllKeys ? 'Sembunyikan Nilai Kunci' : 'Lihat Semua Kunci' }}
 </button>
 </div>
 </div>

 <!-- Filter Chips & Search Bar -->
 <div class="api-filter-bar">
 <div class="api-filter-chips">
 <button
 :class="['api-chip', { active: apiProviderFilter === 'ALL' }]"
 @click="apiProviderFilter = 'ALL'"
 >
 <i data-lucide="layers"></i> Semua Kunci ({{ apiConfig.stats?.total || 0 }})
 </button>
 <button
 :class="['api-chip chip-gemini', { active: apiProviderFilter === 'gemini' }]"
 @click="apiProviderFilter = 'gemini'"
 >
 Google Gemini ({{ apiConfig.stats?.geminiTotal || 0 }})
 </button>
 <button
 :class="['api-chip chip-active-only', { active: apiProviderFilter === 'active' }]"
 @click="apiProviderFilter = 'active'"
 >
 Hanya Aktif ({{ apiConfig.stats?.active || 0 }})
 </button>
 </div>

 <div class="api-search-wrap">
 <i data-lucide="search" class="api-search-icon"></i>
 <input
 v-model="apiSearch"
 type="text"
 placeholder="Cari berdasarkan nama label atau potongan key..."
 class="api-search-input"
 />
 <button v-if="apiSearch" class="api-search-clear" @click="apiSearch = ''">
 <i data-lucide="x"></i>
 </button>
 </div>
 </div>

 <!-- API Keys CRUD Table -->
 <div class="api-table-wrapper">
 <table class="api-keys-table" v-if="filteredApiKeys.length > 0">
 <thead>
 <tr>
 <th style="width: 50px;">No</th>
 <th style="width: 140px;">Provider</th>
 <th>Label / Keterangan</th>
 <th style="min-width: 320px;">Nilai Kunci API (Plaintext / Terproteksi)</th>
 <th style="width: 150px;">Peran & Rotasi</th>
 <th style="width: 120px;">Status</th>
 <th style="width: 160px; text-align: center;">Aksi CRUD</th>
 </tr>
 </thead>
 <tbody>
 <tr
 v-for="(k, idx) in filteredApiKeys"
 :key="k.id"
 :class="['api-key-row', k.isActive ? 'row-is-active' : 'row-is-inactive']"
 >
 <!-- No & Dot -->
 <td class="cell-index">
 <span class="key-index-badge">#{{ idx + 1 }}</span>
 </td>

 <!-- Provider -->
 <td>
 <span class="provider-pill prov-gemini"> Gemini</span>
 </td>

 <!-- Label / Description -->
 <td>
 <div class="key-label-text">{{ k.label }}</div>
 <div class="key-date-sub" v-if="k.addedAt">Didaftarkan: {{ formatDate(k.addedAt) }}</div>
 </td>

 <!-- Key String with Eye & Copy -->
 <td>
 <div class="key-display-box">
 <span class="key-code-text" :class="{ 'key-revealed': revealedKeys[k.id] || showAllKeys }">
 {{ (revealedKeys[k.id] || showAllKeys) ? k.key : k.masked }}
 </span>
 <div class="key-inline-tools">
 <button
 class="btn-tool-icon"
 :title="(revealedKeys[k.id] || showAllKeys) ? 'Sembunyikan' : 'Tampilkan Kunci Lengkap'"
 @click="toggleRevealKey(k.id)"
 >
 <i :data-lucide="(revealedKeys[k.id] || showAllKeys) ? 'eye-off' : 'eye'"></i>
 </button>
 <button
 class="btn-tool-icon"
 :class="{ 'btn-copied-active': copiedKeyId === k.id }"
 :title="copiedKeyId === k.id ? 'Tersalin!' : 'Salin Kunci ke Clipboard'"
 @click="copyKeyToClipboard(k.key, k.id)"
 >
 <i :data-lucide="copiedKeyId === k.id ? 'check' : 'copy'"></i>
 </button>
 </div>
 </div>
 </td>

 <!-- Role / Priority -->
 <td>
 <div v-if="k.isPrimary" class="role-badge role-primary" title="Kunci utama yang digunakan terlebih dahulu">
 <i data-lucide="star"></i> Kunci Utama
 </div>
 <div v-else class="role-badge role-pool" title="Cadangan pool — otomatis digunakan saat kuota kunci lain habis">
 <i data-lucide="refresh-cw"></i> Cadangan Pool
 </div>
 </td>

 <!-- Status Active / Inactive Switch -->
 <td>
 <button
 :class="['status-toggle-btn', k.isActive ? 'st-on' : 'st-off']"
 @click="toggleKeyActive(k)"
 :title="k.isActive ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'"
 >
 <span class="st-dot"></span>
 {{ k.isActive ? 'AKTIF' : 'NONAKTIF' }}
 </button>
 </td>

 <!-- CRUD Actions -->
 <td class="cell-actions">
 <div class="crud-btn-group">
 <!-- Set Primary -->
 <button
 v-if="!k.isPrimary"
 class="btn-crud-act act-primary"
 title="Jadikan Kunci Utama"
 @click="setKeyPrimary(k)"
 >
 <i data-lucide="star"></i>
 </button>
 <!-- Edit -->
 <button
 class="btn-crud-act act-edit"
 title="Edit Nilai / Label Kunci"
 @click="openEditKeyModal(k)"
 >
 <i data-lucide="pencil"></i>
 </button>
 <!-- Delete -->
 <button
 class="btn-crud-act act-del"
 title="Hapus Kunci Ini"
 @click="deleteApiKey(k)"
 >
 <i data-lucide="trash-2"></i>
 </button>
 </div>
 </td>
 </tr>
 </tbody>
 </table>

 <!-- Empty State -->
 <div v-else class="api-empty-state">
 <div class="empty-icon-wrap"></div>
 <h4>Tidak Ada Kunci API Ditemukan</h4>
 <p v-if="apiSearch">Tidak ada kunci yang cocok dengan kata kunci pencarian "{{ apiSearch }}".</p>
 <p v-else>Belum ada kunci API terdaftar untuk filter yang dipilih. Tambahkan kunci baru atau muat 10 pool bawaan.</p>
 <div class="empty-actions">
 <button class="btn-api-action btn-add-primary" @click="openAddKeyModal('gemini')">
 <i data-lucide="plus"></i> Tambah Kunci
 </button>
 <button class="btn-api-action btn-seed-defaults" @click="seedDefaultGeminiKeys">
 <i data-lucide="refresh-cw"></i> Muat 10 Pool Gemini Bawaan
 </button>
 </div>
 </div>
 </div>
 </div>

 <!-- Success/Error Toast Message -->
 <div v-if="apiSaveMsg" :class="['api-save-msg', apiSaveMsgType]">
 <i :data-lucide="apiSaveMsgType === 'success' ? 'check-circle-2' : 'alert-circle'"></i>
 {{ apiSaveMsg }}
 </div>
 </div>

 <!-- ── TAB: DATABASE NEON (slot 1–100, satu-satu & massal) ───────────── -->
 <div v-if="activeTab === 'neon-db'" class="admin-content">
 <NeonSlotsPanel />
 </div>

 <!-- ── TAB: KONTROL MENU ─────────────────────────────────────────────── -->
 <div v-if="activeTab === 'menu-control'" class="admin-content">
 <div class="api-config-info-banner">
 <i data-lucide="sliders-horizontal"></i>
 <div>
 <strong>Kontrol Visibilitas Menu</strong><br>
 Nonaktifkan menu di bawah untuk menyembunyikannya dari seluruh pengguna (user biasa). Admin dan Moderator tetap dapat melihat dan mengakses semua menu (ditandai badge "Nonaktif").
 </div>
 </div>

 <div class="card" style="margin-top:16px;">
 <div class="card-header">
 <h2 class="card-title">
 <i data-lucide="menu" class="icon-inline"></i>
 Daftar Menu Sidebar
 </h2>
 </div>
 <div class="card-body">
 <div style="display:flex; flex-direction:column; gap:8px;">
 <div v-for="item in menuList" :key="item.id" class="rule-setting-row">
 <div class="rule-setting-info">
 <span class="rule-setting-name">{{ item.label }}</span>
 </div>
 <label class="switch">
 <input
 type="checkbox"
 :checked="menuConfig[item.id] !== false"
 @change="onToggleMenu(item.id, $event.target.checked)"
 >
 <span class="slider"></span>
 </label>
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- ── TAB: PENGATURAN KONTAK (WA & EMAIL ADMIN) ─────────────────────── -->
 <div v-if="activeTab === 'reports'" class="admin-content">
 <div class="api-config-info-banner">
 <i data-lucide="clipboard-list"></i>
 <div>
 <strong>Daftar Laporan Masuk</strong><br>
 Semua laporan yang dikirim dari form di aplikasi akan tampil di sini. Gunakan nomor WhatsApp admin untuk membalas cepat ke pelapor.
 </div>
 </div>

 <div class="card" style="margin-top:16px;">
 <div class="card-header">
 <h2 class="card-title">
 <i data-lucide="inbox" class="icon-inline"></i>
 Laporan Masuk
 </h2>
 </div>
 <div class="card-body">
 <div v-if="reportsLoading" class="admin-loading">
 <i data-lucide="loader-2" class="spin-anim"></i> Memuat laporan...
 </div>
 <div v-else-if="reports.length === 0" class="empty-state-box">
 <i data-lucide="mail-open"></i>
 <p>Belum ada laporan masuk.</p>
 </div>
 <div v-else class="report-list">
 <div v-for="report in reports" :key="report.id" class="report-item">
 <div class="report-topline">
 <div class="report-title-wrap">
 <strong class="report-title">{{ report.judul }}</strong>
 <span class="report-category-badge">{{ report.kategori }}</span>
 </div>
 <span :class="['report-status-badge', 'status-' + (report.status || 'baru')]">{{ report.status || 'baru' }}</span>
 </div>

 <div class="report-info-grid">
 <div class="report-info-item">
 <i data-lucide="user" class="report-info-icon"></i>
 <span><span class="report-info-label">Pelapor</span>{{ report.nama }}</span>
 </div>
 <div class="report-info-item" v-if="report.email">
 <i data-lucide="mail" class="report-info-icon"></i>
 <span><span class="report-info-label">Email</span>{{ report.email }}</span>
 </div>
 <div class="report-info-item" v-if="report.noHp">
 <i data-lucide="phone" class="report-info-icon"></i>
 <span><span class="report-info-label">No. HP</span>{{ report.noHp }}</span>
 </div>
 <div class="report-info-item" v-if="!report.email && !report.noHp && report.kontak">
 <i data-lucide="phone" class="report-info-icon"></i>
 <span><span class="report-info-label">Kontak</span>{{ report.kontak }}</span>
 </div>
 <div class="report-info-item">
 <i data-lucide="clock" class="report-info-icon"></i>
 <span><span class="report-info-label">Waktu</span>{{ formatReportDate(report.createdAt) }}</span>
 </div>
 </div>

 <p class="report-desc">{{ report.deskripsi }}</p>

 <div v-if="report.images?.length" class="report-images">
 <img v-for="(img, idx) in report.images.slice(0, 3)" :key="idx" :src="'data:image/png;base64,' + img.data" alt="Lampiran laporan" />
 <span v-if="report.images.length > 3" class="report-images-more">+{{ report.images.length - 3 }}</span>
 </div>

 <div class="report-actions">
 <a v-if="report.noHp" :href="buildWaLink(report.noHp)" target="_blank" class="btn btn-sm btn-primary">
 <i data-lucide="message-circle-more"></i> WhatsApp
 </a>
 <a v-else-if="!report.email && report.kontak" :href="buildWaLink(report.kontak)" target="_blank" class="btn btn-sm btn-primary">
 <i data-lucide="message-circle-more"></i> WhatsApp
 </a>
 <a v-if="report.email" :href="'mailto:' + report.email" class="btn btn-sm btn-secondary">
 <i data-lucide="mail"></i> Email
 </a>
 <button class="btn btn-sm btn-danger" @click="confirmDeleteReport(report)">
 <i data-lucide="trash-2"></i> Hapus
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div v-if="activeTab === 'settings'" class="admin-content">
 <div class="api-config-info-banner">
 <i data-lucide="contact"></i>
 <div>
 <strong>Kontak Admin untuk Form Laporan</strong><br>
 Nomor WhatsApp di bawah ini dipakai untuk tombol WhatsApp cepat dari form laporan dan untuk respon admin ke pelapor. Kontak admin kini hanya memakai nomor WhatsApp (kolom email admin sudah dihapus).
 </div>
 </div>

 <div class="card" style="margin-top:16px; max-width: 560px;">
 <div class="card-header">
 <h2 class="card-title">
 <i data-lucide="phone" class="icon-inline"></i>
 Kontak Penerima Laporan
 </h2>
 </div>
 <div class="card-body">
 <div v-if="contactSettingsLoading" class="admin-loading">
 <i data-lucide="loader-2" class="spin-anim"></i> Memuat pengaturan...
 </div>
 <form v-else @submit.prevent="saveContactSettings">
 <div class="form-group">
 <label class="form-label">Nomor WhatsApp Admin</label>
 <input
 v-model="contactSettings.waNumber"
 type="text"
 class="form-input"
 placeholder="Contoh: 6281234567890 (tanpa tanda + atau angka 0 di depan)"
 />
 <span class="field-hint">Format internasional tanpa "+". Nomor 0812-3456-7890 ditulis 6281234567890.</span>
 </div>

 <div v-if="contactSettingsMsg" :class="['api-save-msg', contactSettingsMsgType]" style="margin-top:14px;">
 <i :data-lucide="contactSettingsMsgType === 'success' ? 'check-circle-2' : 'alert-circle'"></i>
 {{ contactSettingsMsg }}
 </div>

 <div style="margin-top:16px; display:flex; justify-content:flex-end;">
 <button type="submit" class="btn btn-primary" :disabled="contactSettingsSaving">
 <i data-lucide="save"></i>
 {{ contactSettingsSaving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>

 <!-- ══ MODAL: Tambah / Edit Kunci API (CRUD) ═══════════════════════════ -->
 <div v-if="showKeyModal" class="modal-overlay" @click.self="closeKeyModal">
 <div class="modal-box modal-box-wide">
 <div class="modal-header">
 <div class="modal-title-wrap">
 <span class="modal-icon-badge">{{ editingKey ? '' : '' }}</span>
 <div>
 <h3>{{ editingKey ? 'Edit Kunci API' : 'Tambah Kunci API Baru' }}</h3>
 <p class="modal-subtitle">Kelola kredensial AI secara aman di server backend</p>
 </div>
 </div>
 <button class="modal-close-btn" @click="closeKeyModal"><i data-lucide="x"></i></button>
 </div>

 <form @submit.prevent="submitKeyForm">
 <div class="modal-body">
 <!-- Provider: sistem ini hanya menggunakan Google Gemini AI -->
 <div class="mform-group">
 <label>Provider AI</label>
 <div class="provider-radio-cards">
 <label class="provider-choice-card selected">
 <input type="radio" v-model="keyForm.provider" value="gemini" checked disabled />
 <span class="pchoice-icon"></span>
 <span class="pchoice-info">
 <strong>Google Gemini AI</strong>
 <small>Analisis RKA, Nilai Prakiraan Dampak, Ekstraksi e-SSH &amp; Simulasi Percakapan Agen AI</small>
 </span>
 </label>
 </div>
 </div>

 <!-- Label / Name -->
 <div class="mform-group">
 <label>Label / Nama Alias (Opsional)</label>
 <input
 v-model="keyForm.label"
 type="text"
 placeholder="Contoh: Gemini Pool Key #1"
 class="mform-input"
 />
 </div>

 <!-- API Key Input -->
 <div class="mform-group">
 <label>Nilai Kunci API (API Key) *</label>
 <div class="api-key-input-wrap">
 <input
 v-model="keyForm.key"
 :type="showKeyFormPw ? 'text' : 'password'"
 placeholder="AQ.Ab8RN... atau AIzaSy..."
 class="mform-input key-mono-input"
 autocomplete="off"
 />
 <button type="button" @click="showKeyFormPw = !showKeyFormPw" class="key-toggle-btn" tabindex="-1">
 <i :data-lucide="showKeyFormPw ? 'eye-off' : 'eye'"></i>
 </button>
 </div>
 <span class="field-hint">Dapatkan di aistudio.google.com/apikey</span>
 </div>

 <!-- Status Checkboxes -->
 <div class="mform-options-row">
 <label class="mcheckbox-label">
 <input type="checkbox" v-model="keyForm.isActive" />
 <span>Aktifkan Kunci Ini untuk Rotasi Otomatis</span>
 </label>

 <label class="mcheckbox-label">
 <input type="checkbox" v-model="keyForm.isPrimary" />
 <span>Jadikan sebagai Kunci Utama Gemini</span>
 </label>
 </div>

 <div v-if="keyFormError" class="modal-error-alert">
 <i data-lucide="alert-circle"></i>
 <span>{{ keyFormError }}</span>
 </div>
 </div>

 <div class="modal-footer">
 <button type="button" class="btn-modal-cancel" @click="closeKeyModal">Batal</button>
 <button type="submit" class="btn-modal-save" :disabled="savingKeyForm || !keyForm.key.trim()">
 <i :data-lucide="savingKeyForm ? 'loader-2' : 'save'" :class="{ 'spin-anim': savingKeyForm }"></i>
 {{ savingKeyForm ? 'Menyimpan...' : (editingKey ? 'Simpan Perubahan' : 'Daftarkan Kunci') }}
 </button>
 </div>
 </form>
 </div>
 </div>

 <!-- ══ MODAL: Impor Massal API Key ══════════════════════════════════════ -->
 <div v-if="showBatchModal" class="modal-overlay" @click.self="closeBatchModal">
 <div class="modal-box modal-box-wide">
 <div class="modal-header">
 <div class="modal-title-wrap">
 <span class="modal-icon-badge"></span>
 <div>
 <h3>Impor Massal Kunci API</h3>
 <p class="modal-subtitle">Tempel banyak API key sekaligus untuk didaftarkan ke dalam pool</p>
 </div>
 </div>
 <button class="modal-close-btn" @click="closeBatchModal"><i data-lucide="x"></i></button>
 </div>

 <form @submit.prevent="submitBatchImport">
 <div class="modal-body">
 <div class="mform-group">
 <label>Provider Target</label>
 <select v-model="batchForm.provider" class="mform-input" disabled>
 <option value="gemini"> Google Gemini AI (Analisis RKA, SSH &amp; Simulasi Percakapan Agen AI)</option>
 </select>
 </div>

 <div class="mform-group">
 <label>Awalan Label (Opsional)</label>
 <input
 v-model="batchForm.labelPrefix"
 type="text"
 placeholder="Contoh: Pool Gemini Bapperida"
 class="mform-input"
 />
 </div>

 <div class="mform-group">
 <label>Daftar API Key (Satu kunci per baris) *</label>
 <textarea
 v-model="batchForm.keysText"
 rows="6"
 placeholder="AQ.Ab8RN6LaZ30F4ohFP...&#10;AQ.Ab8RN6IHaQg0Zq4_...&#10;AQ.Ab8RN6IDptQ-kV5H..."
 class="mform-input key-mono-input"
 style="resize: vertical;"
 ></textarea>
 <span class="field-hint">Setiap baris akan didaftarkan sebagai kunci aktif baru.</span>
 </div>
 </div>

 <div class="modal-footer">
 <button type="button" class="btn-modal-cancel" @click="closeBatchModal">Batal</button>
 <button type="submit" class="btn-modal-save" :disabled="savingBatch || !batchForm.keysText.trim()">
 <i :data-lucide="savingBatch ? 'loader-2' : 'upload-cloud'" :class="{ 'spin-anim': savingBatch }"></i>
 {{ savingBatch ? 'Mengimpor...' : 'Impor Semua Kunci' }}
 </button>
 </div>
 </form>
 </div>
 </div>

 <!-- ══ MODAL: Tambah / Edit User ══════════════════════════════════════ -->
 <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
 <div class="modal-box">
 <div class="modal-header">
 <h3>{{ editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}</h3>
 <button class="modal-close-btn" @click="closeUserModal"><i data-lucide="x"></i></button>
 </div>
 <div class="modal-body">
 <div class="mform-group">
 <label>Nama Lengkap *</label>
 <input v-model="userForm.name" type="text" placeholder="Nama lengkap pengguna" class="mform-input" />
 <span v-if="formErrors.name" class="mfield-error">{{ formErrors.name }}</span>
 </div>
 <div class="mform-group">
 <label>Username *</label>
 <input v-model="userForm.username" type="text" placeholder="Username unik (tanpa spasi)" class="mform-input" />
 <span v-if="formErrors.username" class="mfield-error">{{ formErrors.username }}</span>
 </div>
 <div class="mform-group">
 <label>Role Pengguna *</label>
 <select v-model="userForm.role" class="mform-input">
 <option value="user">User Biasa</option>

 <option value="admin">Administrator</option>
 </select>
 </div>
 <div class="mform-group">
 <label>Email</label>
 <input v-model="userForm.email" type="email" placeholder="email@bapperida.go.id" class="mform-input" />
 </div>
 <div class="mform-group">
 <label>{{ editingUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *' }}</label>
 <div class="api-key-input-wrap">
 <input v-model="userForm.password" :type="showFormPw ? 'text' : 'password'" placeholder="Masukkan password" class="mform-input" />
 <button type="button" @click="showFormPw = !showFormPw" class="key-toggle-btn">
 <i :data-lucide="showFormPw ? 'eye-off' : 'eye'"></i>
 </button>
 </div>
 <span v-if="formErrors.password" class="mfield-error">{{ formErrors.password }}</span>
 </div>
 <div class="mform-group">
 <label>Status Akun</label>
 <select v-model="userForm.isActive" class="mform-input">
 <option :value="true">Aktif</option>
 <option :value="false">Nonaktif</option>
 </select>
 </div>
 <div v-if="modalError" class="modal-error-alert">
 <i data-lucide="alert-circle"></i> {{ modalError }}
 </div>
 </div>
 <div class="modal-footer">
 <button class="btn-modal-cancel" @click="closeUserModal">Batal</button>
 <button class="btn-modal-save" @click="saveUser" :disabled="savingUser">
 <i :data-lucide="savingUser ? 'loader-2' : 'save'" :class="{ 'spin-anim': savingUser }"></i>
 {{ savingUser ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat User') }}
 </button>
 </div>
 </div>
 </div>

 <!-- ══ MODAL: Konfirmasi Hapus User ════════════════════════════════════ -->
 <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
 <div class="modal-box modal-sm">
 <div class="modal-header">
 <h3>Konfirmasi Hapus</h3>
 <button class="modal-close-btn" @click="showDeleteConfirm = false"><i data-lucide="x"></i></button>
 </div>
 <div class="modal-body">
 <p>Apakah Anda yakin ingin menghapus user <strong>{{ deleteTarget?.name }}</strong> (<code>{{ deleteTarget?.username }}</code>)?</p>
 <p class="delete-warning"><i data-lucide="alert-triangle"></i> Tindakan ini tidak dapat dibatalkan.</p>
 </div>
 <div class="modal-footer">
 <button class="btn-modal-cancel" @click="showDeleteConfirm = false">Batal</button>
 <button class="btn-modal-delete" @click="executeDelete" :disabled="deletingUser">
 <i :data-lucide="deletingUser ? 'loader-2' : 'trash-2'" :class="{ 'spin-anim': deletingUser }"></i>
 {{ deletingUser ? 'Menghapus...' : 'Hapus User' }}
 </button>
 </div>
 </div>
 </div>
 </div>

 <!-- ══ MODAL: Konfirmasi Hapus Laporan (ketik ulang judul) ═════════════ -->
 <div v-if="showDeleteReportConfirm" class="modal-overlay" @click.self="closeDeleteReportConfirm">
 <div class="modal-box modal-sm">
 <div class="modal-header">
 <h3>Konfirmasi Hapus Laporan</h3>
 <button class="modal-close-btn" @click="closeDeleteReportConfirm"><i data-lucide="x"></i></button>
 </div>
 <div class="modal-body">
 <p>Tindakan ini akan menghapus laporan <strong>{{ deleteReportTarget?.judul }}</strong> dari <strong>{{ deleteReportTarget?.nama }}</strong> secara permanen.</p>
 <p class="delete-warning"><i data-lucide="alert-triangle"></i> Tindakan ini tidak dapat dibatalkan.</p>
 <div class="form-group" style="margin-top:12px;">
 <label class="form-label">Ketik <code>{{ deleteReportTarget?.judul }}</code> untuk konfirmasi</label>
 <input
 v-model="deleteReportConfirmText"
 type="text"
 class="form-input"
 autocomplete="off"
 :placeholder="deleteReportTarget?.judul"
 />
 </div>
 </div>
 <div class="modal-footer">
 <button class="btn-modal-cancel" @click="closeDeleteReportConfirm">Batal</button>
 <button class="btn-modal-delete" @click="executeDeleteReport" :disabled="!isDeleteReportConfirmValid || deletingReport">
 <i :data-lucide="deletingReport ? 'loader-2' : 'trash-2'" :class="{ 'spin-anim': deletingReport }"></i>
 {{ deletingReport ? 'Menghapus...' : 'Hapus Laporan' }}
 </button>
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { apiFetch } from '@/utils/api';
import { useAnalysis } from '@/composables/useAnalysis';
import { useRealtime } from '@/composables/useRealtime';
import { usePersistedRef } from '@/composables/usePersistedRef';
import { extractBackupFromHtml } from '@/utils/htmlDataExtractor';
import { createZipBlob, downloadBlob } from '@/utils/zipStore';
import NeonSlotsPanel from '@/components/NeonSlotsPanel.vue';

const { currentUser, downloadFullBackupHtml, downloadFullBackupJson, restoreDatabase, importBackupMerge, showNotification, menuConfig, saveMenuConfig } = useAnalysis();

// ── Kontrol Menu ─────────────────────────────────────────────────────────
const menuList = [
 { id: 'dashboard', label: 'Unggah Berkas RKA' },
 { id: 'main-dashboard', label: 'Dasbor Utama' },
 { id: 'analyzer', label: 'Hasil Analisis' },
 { id: 'agentic-ai', label: 'Simulasi Percakapan Agen AI' },
 { id: 'history', label: 'Arsip Dokumen RKA' },
 { id: 'petunjuk', label: 'Petunjuk Penggunaan' },
 { id: 'report', label: 'Laporan' },
 { id: 'faq', label: 'Bantuan & Pertanyaan' }
];

async function onToggleMenu(id, checked) {
 await saveMenuConfig({ [id]: checked });
}
const realtime = useRealtime();



// ── Data ──────────────────────────────────────────────────────────────────
// State tampilan (tab aktif, pencarian, filter) diingat 24 jam per akun,
// jadi refresh halaman tidak lagi mengembalikan ke Statistik & Status.
const uiScope = currentUser.value?.username || 'anon';

const allTabs = [
 { id: 'stats', label: 'Statistik & Status', icon: 'bar-chart-3', roles: ['admin'] },
 { id: 'logs', label: 'Log Aktivitas', icon: 'activity', roles: ['admin'] },
 { id: 'backup', label: 'Backup & Pemulihan', icon: 'archive', roles: ['admin'] },
 { id: 'users', label: 'Manajemen User', icon: 'users', roles: ['admin'] },
 { id: 'api', label: 'Konfigurasi API', icon: 'key-round', roles: ['admin'] },
 { id: 'neon-db', label: 'Database Neon', icon: 'database', roles: ['admin'] },
 { id: 'menu-control', label: 'Kontrol Menu', icon: 'sliders-horizontal', roles: ['admin'] },
 { id: 'reports', label: 'Laporan Masuk', icon: 'inbox', roles: ['admin'] },
 { id: 'settings', label: 'Pengaturan Kontak', icon: 'contact', roles: ['admin'] }
];

const visibleTabs = computed(() => {
 const currentRole = currentUser.value?.role || 'admin';
 return allTabs.filter(t => t.roles.includes(currentRole));
});

const activeTab = usePersistedRef(`admin:${uiScope}:tab`, 'stats', {
 validate: (id) => visibleTabs.value.some(t => t.id === id)
});

function switchTab(tabId) {
 activeTab.value = tabId;
 if (tabId === 'logs') loadLogs();
 if (tabId === 'backup') loadBackupStats();
 if (tabId === 'reports') loadReports();
 if (tabId === 'settings') loadContactSettings();
 refreshIcons();
}

// ── Pengaturan Kontak Admin (WA untuk Form Laporan) ────────────────────────
const contactSettings = reactive({ waNumber: '' });
const contactSettingsLoading = ref(false);
const contactSettingsSaving = ref(false);
const contactSettingsMsg = ref('');
const contactSettingsMsgType = ref(''); // 'success' | 'error'

const reports = ref([]);
const reportsLoading = ref(false);

function formatReportDate(value) {
 if (!value) return '-';
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return value;
 return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function buildWaLink(value) {
 const clean = String(value || '').replace(/[^0-9]/g, '');
 if (!clean) return '#';
 const text = encodeURIComponent('Halo, saya ingin membalas laporan yang saya kirimkan sebelumnya.');
 return `https://wa.me/${clean}?text=${text}`;
}

async function loadReports() {
 reportsLoading.value = true;
 try {
 const res = await apiFetch('/api/v1/laporan/list');
 if (!res.ok) {
 const data = await res.json().catch(() => ({}));
 throw new Error(data.error || 'Gagal memuat laporan masuk.');
 }
 const data = await res.json();
 reports.value = data.reports || [];
 } catch (err) {
 showNotification('Gagal memuat laporan', err.message || 'Terjadi kesalahan saat mengambil laporan masuk.', 'error');
 reports.value = [];
 } finally {
 reportsLoading.value = false;
 nextTick(() => refreshIcons());
 }
}

async function loadContactSettings() {
 contactSettingsLoading.value = true;
 contactSettingsMsg.value = '';
 try {
 const res = await apiFetch('/api/v1/settings/contact');
 if (res.status === 404) {
 contactSettingsMsgType.value = 'error';
 contactSettingsMsg.value = 'Endpoint pengaturan belum ditemukan di server (404). Backend perlu di-deploy ulang.';
 return;
 }
 if (res.ok) {
 const data = await res.json();
 contactSettings.waNumber = data.waNumber || '';
 } else {
 const data = await res.json().catch(() => ({}));
 contactSettingsMsgType.value = 'error';
 contactSettingsMsg.value = data.error || `Gagal memuat pengaturan (status ${res.status}).`;
 }
 } catch (err) {
 contactSettingsMsgType.value = 'error';
 contactSettingsMsg.value = 'Tidak bisa terhubung ke server: ' + (err.message || 'jaringan bermasalah.');
 } finally {
 contactSettingsLoading.value = false;
 nextTick(() => refreshIcons());
 }
}

async function saveContactSettings() {
 contactSettingsMsg.value = '';
 contactSettingsSaving.value = true;
 try {
 const res = await apiFetch('/api/v1/settings/contact', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 waNumber: contactSettings.waNumber
 })
 });

 const rawText = await res.text();
 let data = {};
 try { data = rawText ? JSON.parse(rawText) : {}; } catch { /* bukan JSON */ }

 if (!res.ok) {
 if (res.status === 404) {
 throw new Error('Endpoint pengaturan belum ditemukan di server (404). Backend perlu di-deploy ulang dengan file routes/settingsRouter.js & server.js terbaru, lalu restart service.');
 }
 if (res.status === 401 || res.status === 403) {
 throw new Error('Sesi login admin tidak valid/kedaluwarsa. Silakan logout lalu login ulang sebagai admin.');
 }
 throw new Error(data.error || `Gagal menyimpan pengaturan (status ${res.status}).`);
 }

 contactSettings.waNumber = data.waNumber ?? contactSettings.waNumber;
 contactSettingsMsgType.value = 'success';
 contactSettingsMsg.value = 'Kontak admin berhasil disimpan. Form Laporan akan memakai nomor WhatsApp ini.';
 } catch (err) {
 contactSettingsMsgType.value = 'error';
 contactSettingsMsg.value = err.message || 'Gagal menyimpan pengaturan kontak.';
 } finally {
 contactSettingsSaving.value = false;
 nextTick(() => refreshIcons());
 }
}

const users = ref([]);
const userStats = ref({});
const searchUser = usePersistedRef(`admin:${uiScope}:users.search`, '', { validate: (v) => typeof v === 'string' });

// Activity Logs State
const logs = ref([]);
const logsTotal = ref(0);
const logsLoading = ref(false);
const logsSearch = usePersistedRef(`admin:${uiScope}:logs.search`, '', { validate: (v) => typeof v === 'string' });
const selectedAction = usePersistedRef(`admin:${uiScope}:logs.action`, 'ALL', { validate: (v) => typeof v === 'string' });
const selectedStatus = usePersistedRef(`admin:${uiScope}:logs.status`, 'ALL', { validate: (v) => typeof v === 'string' });
let searchDebounce = null;

function setQuickFilter(action, status) {
 selectedAction.value = action;
 selectedStatus.value = status;
 loadLogs();
}

// Backup State
const downloadingBackup = ref(false);
const restoringBackup = ref(false);
const restoringSnapshot = ref(null); // filename snapshot yang sedang dipulihkan
const selectedBackupFile = ref(null);
const fileInputRef = ref(null);

// HTML Convert State
const convertFileInputRef = ref(null);
const convertQueue = ref([]); // { key, file, status: pending|processing|done|error, message }
const pendingConvertCount = computed(() => convertQueue.value.filter(i => i.status === 'pending').length);
const convertingHtml = ref(false);
const snapshotsList = ref([]);

// Merge (Tambah ke Arsip) State
const mergeFileInputRef = ref(null);
const mergeQueue = ref([]); // { key, file, status: pending|processing|done|error, message }
const mergingBackup = ref(false);
const mergeOverwrite = ref(false);
const pendingMergeCount = computed(() => mergeQueue.value.filter(i => i.status === 'pending').length);

// ── Pusat Manajemen Kunci API (CRUD Gemini & OpenAI) ─────────────────────────
const apiConfig = ref({
 gemini: {},
 apiKeys: [],
 geminiPool: [],
 stats: { total: 0, active: 0, geminiTotal: 0, geminiActive: 0 }
});
const apiSearch = usePersistedRef(`admin:${uiScope}:api.search`, '', { validate: (v) => typeof v === 'string' });
const apiProviderFilter = usePersistedRef(`admin:${uiScope}:api.provider`, 'ALL', { validate: (v) => ['ALL', 'gemini', 'active'].includes(v) }); // 'ALL' | 'gemini' | 'active'
const revealedKeys = ref({}); // { [keyId]: boolean }
const showAllKeys = ref(false);
const copiedKeyId = ref(null);
const seedingDefaults = ref(false);

// Modal Tambah / Edit Kunci API
const showKeyModal = ref(false);
const editingKey = ref(null);
const keyForm = ref({
 provider: 'gemini',
 label: '',
 key: '',
 isActive: true,
 isPrimary: false
});
const showKeyFormPw = ref(false);
const keyFormError = ref('');
const savingKeyForm = ref(false);

// Modal Impor Massal
const showBatchModal = ref(false);
const batchForm = ref({
 provider: 'gemini',
 labelPrefix: '',
 keysText: ''
});
const savingBatch = ref(false);

const apiSaveMsg = ref('');
const apiSaveMsgType = ref('success');

const showUserModal = ref(false);
const editingUser = ref(null);
const userForm = ref({ name: '', username: '', email: '', password: '', role: 'user', isActive: true });
const formErrors = ref({});
const showFormPw = ref(false);
const savingUser = ref(false);
const modalError = ref('');

const showDeleteConfirm = ref(false);
const deleteTarget = ref(null);
const deletingUser = ref(false);

const showDeleteReportConfirm = ref(false);
const deleteReportTarget = ref(null);
const deletingReport = ref(false);
const deleteReportConfirmText = ref('');
const isDeleteReportConfirmValid = computed(() => {
 const expected = (deleteReportTarget.value?.judul || '').trim();
 return expected.length > 0 && deleteReportConfirmText.value.trim() === expected;
});

// ── Computed ──────────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
 const q = searchUser.value.toLowerCase();
 return users.value.filter(u =>
 !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
 );
});

const filteredApiKeys = computed(() => {
 let list = apiConfig.value.apiKeys || [];
 if (apiProviderFilter.value === 'gemini') {
 list = list.filter(k => k.provider === 'gemini');

 } else if (apiProviderFilter.value === 'active') {
 list = list.filter(k => k.isActive);
 }

 const q = apiSearch.value.trim().toLowerCase();
 if (q) {
 list = list.filter(k =>
 (k.label && k.label.toLowerCase().includes(q)) ||
 (k.key && k.key.toLowerCase().includes(q)) ||
 (k.provider && k.provider.toLowerCase().includes(q))
 );
 }
 return list;
});

// ── Helpers ───────────────────────────────────────────────────────────────
function formatPagu(val) {
 if (!val) return 'Rp 0';
 if (val >= 1e12) return `Rp ${(val/1e12).toFixed(1)} T`;
 if (val >= 1e9) return `Rp ${(val/1e9).toFixed(1)} M`;
 if (val >= 1e6) return `Rp ${(val/1e6).toFixed(0)} Jt`;
 return `Rp ${Number(val).toLocaleString('id-ID')}`;
}

function formatDate(dt) {
 if (!dt) return '—';
 return new Date(dt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatLogTime(dt) {
 if (!dt) return 'Baru saja';
 const diff = Date.now() - new Date(dt).getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return 'Baru saja';
 if (mins < 60) return `${mins} mnt lalu`;
 const hours = Math.floor(mins / 60);
 if (hours < 24) return `${hours} jam lalu`;
 return `${Math.floor(hours / 24)} hari lalu`;
}

function formatFileSize(bytes) {
 if (!bytes) return '0 B';
 if (bytes < 1024) return bytes + ' B';
 if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
 return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function initials(name) {
 if (!name) return '?';
 return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getRolePillClass(role) {
 if (role === 'admin') return 'rp-admin';
 return 'rp-user';
}

function getActionBadgeClass(action) {
 switch (action) {
 case 'LOGIN': return 'act-login';
 case 'LOGOUT': return 'act-logout';
 case 'UPLOAD_RKA': return 'act-upload';
 case 'UPDATE_RKA': return 'act-update';
 case 'DELETE_RKA': return 'act-delete';
 case 'EXPORT_BACKUP': return 'act-backup';
 case 'RESTORE_BACKUP': return 'act-restore';
 case 'CREATE_USER': return 'act-user';
 case 'UPDATE_CONFIG': return 'act-config';
 default: return 'act-default';
 }
}

function showApiMsg(msg, type = 'success') {
 apiSaveMsg.value = msg;
 apiSaveMsgType.value = type;
 setTimeout(() => { apiSaveMsg.value = ''; }, 4000);
}

// ── API Calls: Logs ───────────────────────────────────────────────────────
async function loadLogs() {
 logsLoading.value = true;
 try {
 const params = new URLSearchParams();
 if (selectedAction.value && selectedAction.value !== 'ALL') {
 params.append('action', selectedAction.value);
 }
 if (selectedStatus.value && selectedStatus.value !== 'ALL') {
 params.append('status', selectedStatus.value);
 }
 if (logsSearch.value.trim()) {
 params.append('search', logsSearch.value.trim());
 }
 params.append('limit', '100');

 const res = await apiFetch(`/api/v1/activity-logs?${params.toString()}`);
 if (res.ok) {
 const data = await res.json();
 logs.value = data.logs || [];
 logsTotal.value = data.total || 0;
 }
 } catch (err) {
 console.error('Failed to load logs:', err);
 } finally {
 logsLoading.value = false;
 refreshIcons();
 }
}

function debounceSearchLogs() {
 clearTimeout(searchDebounce);
 searchDebounce = setTimeout(() => {
 loadLogs();
 }, 350);
}

async function confirmClearLogs() {
 if (!confirm('Apakah Anda yakin ingin menghapus seluruh rekaman log aktivitas? Tindakan ini tidak dapat dibatalkan.')) return;
 try {
 const res = await apiFetch('/api/v1/activity-logs', { method: 'DELETE' });
 if (res.ok) {
 showNotification('Log Dibersihkan', 'Riwayat log aktivitas telah dibersihkan.', 'success');
 loadLogs();
 }
 } catch (err) {
 showNotification('Gagal', err.message, 'danger');
 }
}

// ── API Calls: Backup ─────────────────────────────────────────────────────
async function loadBackupStats() {
 try {
 const res = await apiFetch('/api/v1/backup/stats');
 if (res.ok) {
 const data = await res.json();
 snapshotsList.value = [...(data.snapshots || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // terbaru di atas
 }
 } catch {}
}

async function handleDownloadFullBackupHtml() {
 downloadingBackup.value = true;
 try {
 await downloadFullBackupHtml();
 await loadLogs();
 } finally {
 downloadingBackup.value = false;
 }
}

async function handleDownloadFullBackupJson() {
 downloadingBackup.value = true;
 try {
 await downloadFullBackupJson();
 await loadLogs();
 } finally {
 downloadingBackup.value = false;
 }
}

function triggerFileInput() {
 fileInputRef.value?.click();
}

function handleFileSelected(e) {
 const file = e.target.files?.[0];
 if (file) {
 selectedBackupFile.value = file;
 }
}

async function restoreFromSnapshot(snap) {
 if (restoringSnapshot.value) return;
 const waktu = formatDate(snap.createdAt);
 if (!confirm(`Pulihkan database ke kondisi snapshot "${snap.filename}" (${waktu})?\n\nData saat ini akan ditimpa oleh isi snapshot. Kondisi sebelum pemulihan otomatis disimpan sebagai snapshot baru, jadi masih bisa dikembalikan.`)) return;

 restoringSnapshot.value = snap.filename;
 try {
 const res = await apiFetch('/api/v1/backup/restore-snapshot', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ filename: snap.filename }),
 timeoutMs: 120000
 });
 const result = await res.json().catch(() => ({}));
 if (!res.ok || result.error) throw new Error(result.error || `Server menjawab ${res.status}.`);
 showNotification('Pemulihan Berhasil', result.message || 'Database berhasil dipulihkan dari snapshot.', 'success');
 await Promise.all([loadStats(), loadBackupStats(), loadLogs(), loadUsers()]);
 } catch (err) {
 const msg = err?.name === 'AbortError' ? 'Server tidak merespons (waktu habis). Coba lagi beberapa saat lagi.' : err.message;
 showNotification('Gagal Memulihkan dari Snapshot', msg, 'danger');
 } finally {
 restoringSnapshot.value = null;
 refreshIcons();
 }
}

async function executeRestore() {
 if (!selectedBackupFile.value) return;
 if (!confirm(`Konfirmasi pemulihan database dari file "${selectedBackupFile.value.name}". Seluruh data aktif akan diperbarui. Lanjutkan?`)) return;

 restoringBackup.value = true;
 try {
 const reader = new FileReader();
 reader.onload = async (event) => {
 try {
 const json = JSON.parse(event.target.result);
 const ok = await restoreDatabase(json);
 if (ok) {
 selectedBackupFile.value = null;
 await loadStats();
 await loadBackupStats();
 await loadLogs();
 }
 } catch (parseErr) {
 showNotification('Format Tidak Valid', 'Berkas bukan JSON yang valid: ' + parseErr.message, 'danger');
 } finally {
 restoringBackup.value = false;
 refreshIcons();
 }
 };
 reader.readAsText(selectedBackupFile.value);
 } catch (err) {
 showNotification('Gagal', err.message, 'danger');
 restoringBackup.value = false;
 }
}

// ── Konversi HTML ke JSON (boleh banyak berkas sekaligus) ───────────────
function triggerConvertInput() {
  convertFileInputRef.value?.click();
}

function addFilesToConvertQueue(fileList) {
  const rejected = [];
  for (const file of Array.from(fileList || [])) {
    if (!/\.html?$/i.test(file.name)) { rejected.push(file.name); continue; }
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (convertQueue.value.some(i => i.key === key && i.status !== 'error')) continue; // hindari dobel
    convertQueue.value = [
      ...convertQueue.value.filter(i => i.key !== key),
      { key, file, status: 'pending', message: '' }
    ];
  }
  if (rejected.length) {
    showNotification('Berkas Diabaikan', `Hanya berkas .html yang didukung: ${rejected.join(', ')}`, 'warning');
  }
  nextTick(refreshIcons);
}

function handleHtmlFileSelected(e) {
  addFilesToConvertQueue(e.target.files);
  e.target.value = ''; // supaya berkas yang sama bisa dipilih ulang
}

function handleConvertDrop(e) {
  addFilesToConvertQueue(e.dataTransfer?.files);
}

function removeConvertItem(key) {
  convertQueue.value = convertQueue.value.filter(i => i.key !== key);
}

async function executeHtmlConvert() {
  if (convertingHtml.value || pendingConvertCount.value === 0) return;

  convertingHtml.value = true;
  const results = []; // { name, json }
  const warnings = [];
  let totalDocs = 0;
  let failed = 0;

  try {
    // Diproses satu per satu; kegagalan satu berkas tidak menghentikan berkas lain.
    for (const item of convertQueue.value.filter(i => i.status === 'pending')) {
      item.status = 'processing';
      item.message = '';
      await new Promise(r => setTimeout(r, 0)); // beri kesempatan UI menampilkan status
      try {
        const text = await item.file.text();
        const { payload, warnings: w, totalDocuments } = extractBackupFromHtml(text, {
          fileName: item.file.name
        });
        results.push({
          name: item.file.name.replace(/\.html?$/i, '') + '_converted.json',
          json: JSON.stringify(payload, null, 2)
        });
        totalDocs += totalDocuments;
        if (w?.length) warnings.push(`${item.file.name}: ${w.join(' ')}`);
        item.status = 'done';
        item.message = `${totalDocuments} dokumen`;
      } catch (err) {
        failed++;
        item.status = 'error';
        item.message = err.message;
      }
    }

    if (results.length === 1) {
      // Satu berkas: unduh langsung sebagai .json
      downloadBlob(new Blob([results[0].json], { type: 'application/json;charset=utf-8' }), results[0].name);
    } else if (results.length > 1) {
      // Banyak berkas: satukan dalam satu .zip supaya tidak diblokir browser
      const used = new Set();
      const files = results.map(r => {
        let name = r.name;
        for (let n = 2; used.has(name.toLowerCase()); n++) {
          name = r.name.replace(/\.json$/i, `-${n}.json`);
        }
        used.add(name.toLowerCase());
        return { name, data: r.json };
      });
      const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
      downloadBlob(createZipBlob(files), `hasil-ekstrak-json_${stamp}_${files.length}-berkas.zip`);
    }

    if (results.length > 0) {
      showNotification(
        failed ? 'Konversi Selesai dengan Catatan' : 'Konversi Berhasil',
        `${results.length} berkas dikonversi (${totalDocs} dokumen RKA)` +
          (results.length > 1 ? ', diunduh dalam satu berkas ZIP' : '') +
          (failed ? `; ${failed} berkas gagal.` : '.'),
        failed ? 'warning' : 'success'
      );
    } else {
      showNotification('Gagal Ekstrak JSON', 'Tidak ada berkas yang berhasil diekstrak.', 'danger');
    }

    if (warnings.length) {
      showNotification('Catatan Ekstraksi', warnings.join(' '), 'warning');
    }

    // Bersihkan yang sukses; yang gagal tetap tampil agar bisa dicek
    convertQueue.value = convertQueue.value.filter(i => i.status === 'error');
  } catch (err) {
    showNotification('Gagal Ekstrak JSON', err.message, 'danger');
  } finally {
    convertingHtml.value = false;
    refreshIcons();
  }
}

// ── Tambah ke Arsip (Gabung, tanpa menghapus) ───────────────────────────
function mergeStatusLabel(status) {
  return { pending: 'Menunggu', processing: 'Memproses...', done: 'Selesai', error: 'Gagal' }[status] || status;
}

function triggerMergeInput() {
  mergeFileInputRef.value?.click();
}

function addFilesToMergeQueue(fileList) {
  const files = Array.from(fileList || []);
  const rejected = [];
  for (const file of files) {
    if (!/\.(html?|json)$/i.test(file.name)) { rejected.push(file.name); continue; }
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (mergeQueue.value.some(i => i.key === key && i.status !== 'error')) continue; // hindari dobel
    mergeQueue.value = [
      ...mergeQueue.value.filter(i => i.key !== key),
      { key, file, status: 'pending', message: '' }
    ];
  }
  if (rejected.length) {
    showNotification('Berkas Diabaikan', `Hanya .html dan .json yang didukung: ${rejected.join(', ')}`, 'warning');
  }
  nextTick(refreshIcons);
}

function handleMergeFilesSelected(e) {
  addFilesToMergeQueue(e.target.files);
  e.target.value = ''; // supaya berkas yang sama bisa dipilih ulang
}

function handleMergeDrop(e) {
  addFilesToMergeQueue(e.dataTransfer?.files);
}

function removeMergeItem(key) {
  mergeQueue.value = mergeQueue.value.filter(i => i.key !== key);
}

/** Ambil daftar dokumen RKA dari satu berkas (.html hasil ekspor SROI atau .json). */
async function readRkisFromFile(file) {
  const text = await file.text();
  let data;
  if (/\.html?$/i.test(file.name)) {
    data = extractBackupFromHtml(text, { fileName: file.name }).payload;
  } else {
    data = JSON.parse(text);
  }
  let rkis = data?.rkis;
  if (!Array.isArray(rkis) || rkis.length === 0) rkis = data?.data?.main_db?.rkis;
  if ((!Array.isArray(rkis) || rkis.length === 0) && data?.id && (data.namaDokumen || data.pagu !== undefined)) rkis = [data];
  if (!Array.isArray(rkis) || rkis.length === 0) throw new Error('Tidak ada dokumen RKA di dalam berkas.');
  return rkis;
}

async function executeMerge() {
  if (mergingBackup.value || pendingMergeCount.value === 0) return;
  mergingBackup.value = true;
  const total = { added: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    // Diproses satu per satu; kegagalan satu berkas tidak menghentikan berkas lain.
    for (const item of mergeQueue.value.filter(i => i.status === 'pending')) {
      item.status = 'processing';
      item.message = '';
      try {
        const rkis = await readRkisFromFile(item.file);
        const r = await importBackupMerge(rkis, { overwrite: mergeOverwrite.value, sourceName: item.file.name });
        total.added += r.added; total.updated += r.updated; total.skipped += r.skipped;
        const parts = [];
        if (r.added) parts.push(`${r.added} ditambahkan`);
        if (r.updated) parts.push(`${r.updated} diperbarui`);
        if (r.skipped) parts.push(`${r.skipped} sudah ada (dilewati)`);
        if (r.forbidden) parts.push(`${r.forbidden} ditolak`);
        if (r.invalid) parts.push(`${r.invalid} tidak valid`);
        item.message = parts.join(', ') || 'Tidak ada perubahan';
        item.status = 'done';
      } catch (err) {
        total.failed++;
        item.status = 'error';
        item.message = err.message;
      }
    }

    const ok = total.failed === 0;
    showNotification(
      ok ? 'Arsip Diperbarui' : 'Selesai dengan Catatan',
      `${total.added} dokumen ditambahkan, ${total.updated} diperbarui, ${total.skipped} dilewati` +
        (total.failed ? `, ${total.failed} berkas gagal.` : '. Dokumen lama tetap utuh.'),
      ok ? 'success' : 'warning'
    );

    // Bersihkan yang sukses; yang gagal tetap tampil agar bisa dicek
    mergeQueue.value = mergeQueue.value.filter(i => i.status === 'error');
    await loadStats();
    await loadLogs();
  } finally {
    mergingBackup.value = false;
    nextTick(refreshIcons);
  }
}

// ── Statistik & Status (tab 'stats') ────────────────────────────────────────
const stats = ref({});
const statsLoading = ref(false);
const storageStats = ref({ loading: true, usagePercent: null, usedLabel: '', quotaLabel: '', type: '' });

// ── API Calls: Admin ──────────────────────────────────────────────────────
async function loadStats() {
 statsLoading.value = true;
 try {
 const res = await apiFetch('/api/admin/stats');
 if (res.ok) stats.value = await res.json();
 } finally {
 statsLoading.value = false;
 }
}

async function loadStorageStats() {
 storageStats.value.loading = true;
 try {
  const res = await apiFetch('/api/v1/storage-stats');
 if (res.ok) {
 const data = await res.json();
 storageStats.value = { loading: false, ...data };
 }
 } catch {
 storageStats.value.loading = false;
 }
}

async function loadUsers() {
 try {
 const res = await apiFetch('/api/admin/users');
 if (res.ok) {
 const data = await res.json();
 users.value = data.users || [];
 userStats.value = data.stats || {};
 }
 } catch {}
}

 async function loadApiConfig() {
 try {
 const res = await apiFetch('/api/admin/api-config');
 if (res.ok) apiConfig.value = await res.json();
 } catch {}
}

// ── API Key Management (CRUD Gemini) ────────────────────────────
function toggleRevealKey(id) {
 revealedKeys.value[id] = !revealedKeys.value[id];
 nextTick(() => refreshIcons());
}

function toggleShowAllKeys() {
 showAllKeys.value = !showAllKeys.value;
 (apiConfig.value.apiKeys || []).forEach(k => {
 revealedKeys.value[k.id] = showAllKeys.value;
 });
 nextTick(() => refreshIcons());
}

async function copyKeyToClipboard(keyText, id) {
 if (!keyText) return;
 try {
 if (navigator.clipboard && navigator.clipboard.writeText) {
 await navigator.clipboard.writeText(keyText);
 } else {
 const ta = document.createElement('textarea');
 ta.value = keyText;
 document.body.appendChild(ta);
 ta.select();
 document.execCommand('copy');
 document.body.removeChild(ta);
 }
 copiedKeyId.value = id;
 showApiMsg('Kunci API berhasil disalin ke clipboard!', 'success');
 setTimeout(() => {
 if (copiedKeyId.value === id) copiedKeyId.value = null;
 refreshIcons();
 }, 2000);
 } catch (err) {
 showApiMsg('Gagal menyalin: ' + err.message, 'error');
 } finally {
 refreshIcons();
 }
}

function openAddKeyModal(provider = 'gemini') {
 editingKey.value = null;
 keyForm.value = {
 provider,
 label: '',
 key: '',
 isActive: true,
 isPrimary: false
 };
 keyFormError.value = '';
 showKeyFormPw.value = false;
 showKeyModal.value = true;
 nextTick(() => refreshIcons());
}

function openEditKeyModal(k) {
 editingKey.value = k;
 keyForm.value = {
 id: k.id,
 provider: k.provider || 'gemini',
 label: k.label || '',
 key: k.key || '',
 isActive: k.isActive !== false,
 isPrimary: !!k.isPrimary
 };
 keyFormError.value = '';
 showKeyFormPw.value = true;
 showKeyModal.value = true;
 nextTick(() => refreshIcons());
}

function closeKeyModal() {
 showKeyModal.value = false;
 editingKey.value = null;
 keyFormError.value = '';
}

async function submitKeyForm() {
 if (!keyForm.value.key.trim()) {
 keyFormError.value = 'Nilai API Key wajib diisi.';
 return;
 }
 savingKeyForm.value = true;
 keyFormError.value = '';
 try {
 const isEdit = !!editingKey.value;
 const payload = isEdit
 ? {
 action: 'update',
 id: editingKey.value.id,
 provider: keyForm.value.provider,
 label: keyForm.value.label.trim() || undefined,
 key: keyForm.value.key.trim(),
 isActive: keyForm.value.isActive,
 isPrimary: keyForm.value.isPrimary
 }
 : {
 action: 'add',
 provider: keyForm.value.provider,
 label: keyForm.value.label.trim() || undefined,
 key: keyForm.value.key.trim(),
 isActive: keyForm.value.isActive,
 isPrimary: keyForm.value.isPrimary
 };

 const res = await apiFetch('/api/admin/api-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 const data = await res.json();
 if (res.ok) {
 showApiMsg(isEdit ? 'Kunci API berhasil diperbarui!' : 'Kunci API baru berhasil ditambahkan!');
 closeKeyModal();
 await loadApiConfig();
 } else {
 keyFormError.value = data.error || 'Gagal menyimpan kunci API.';
 }
 } catch (err) {
 keyFormError.value = err.message || 'Terjadi kesalahan sistem.';
 } finally {
 savingKeyForm.value = false;
 refreshIcons();
 }
}

async function toggleKeyActive(k) {
 try {
 const res = await apiFetch('/api/admin/api-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'toggle', id: k.id })
 });
 if (res.ok) {
 showApiMsg(`Status kunci ${k.label || k.masked} berhasil diubah.`);
 await loadApiConfig();
 }
 } catch (err) {
 showApiMsg(err.message, 'error');
 } finally {
 refreshIcons();
 }
}

async function setKeyPrimary(k) {
 try {
 const res = await apiFetch('/api/admin/api-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'set_primary', id: k.id })
 });
 if (res.ok) {
 showApiMsg(`Kunci ${k.label || k.masked} ditetapkan sebagai Kunci Utama ${k.provider.toUpperCase()}!`);
 await loadApiConfig();
 }
 } catch (err) {
 showApiMsg(err.message, 'error');
 } finally {
 refreshIcons();
 }
}

async function deleteApiKey(k) {
 const label = k.label || k.masked;
 if (!confirm(`Hapus kunci API "${label}" (${k.provider.toUpperCase()})? Tindakan ini tidak dapat dibatalkan.`)) return;
 try {
 const res = await apiFetch('/api/admin/api-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'delete', id: k.id })
 });
 if (res.ok) {
 showApiMsg(`Kunci ${label} berhasil dihapus.`);
 await loadApiConfig();
 }
 } catch (err) {
 showApiMsg(err.message, 'error');
 } finally {
 refreshIcons();
 }
}

function openBatchModal(provider = 'gemini') {
 batchForm.value = {
 provider,
 labelPrefix: 'Gemini Pool',
 keysText: ''
 };
 showBatchModal.value = true;
 nextTick(() => refreshIcons());
}

function closeBatchModal() {
 showBatchModal.value = false;
}

async function submitBatchImport() {
 const lines = batchForm.value.keysText
 .split('\n')
 .map(l => l.trim())
 .filter(l => l.length > 8);

 if (lines.length === 0) {
 showApiMsg('Tempelkan minimal 1 API Key yang valid.', 'error');
 return;
 }

 savingBatch.value = true;
 try {
 const res = await apiFetch('/api/admin/api-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 action: 'batch_add',
 provider: batchForm.value.provider,
 labelPrefix: batchForm.value.labelPrefix.trim() || undefined,
 keys: lines
 })
 });
 const data = await res.json();
 if (res.ok) {
 showApiMsg(`${lines.length} kunci ${batchForm.value.provider.toUpperCase()} berhasil diimpor!`);
 closeBatchModal();
 await loadApiConfig();
 } else {
 showApiMsg(data.error || 'Gagal mengimpor kunci.', 'error');
 }
 } catch (err) {
 showApiMsg(err.message, 'error');
 } finally {
 savingBatch.value = false;
 refreshIcons();
 }
}

async function seedDefaultGeminiKeys() {
 if (!confirm('Muat ulang 10 Pool API Key Gemini bawaan ke sistem?')) return;
 seedingDefaults.value = true;
 try {
 const res = await apiFetch('/api/admin/api-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'seed_defaults' })
 });
 if (res.ok) {
 showApiMsg('10 Pool API Key Gemini bawaan berhasil dimuat ulang!');
 await loadApiConfig();
 }
 } catch (err) {
 showApiMsg(err.message, 'error');
 } finally {
 seedingDefaults.value = false;
 refreshIcons();
 }
}

// ── User Management ───────────────────────────────────────────────────────
function openAddUser() {
 editingUser.value = null;
 userForm.value = { name: '', username: '', email: '', password: '', role: 'user', isActive: true };
 formErrors.value = {};
 modalError.value = '';
 showFormPw.value = false;
 showUserModal.value = true;
 nextTick(() => refreshIcons());
}

function openEditUser(user) {
 editingUser.value = user;
 userForm.value = { name: user.name, username: user.username, email: user.email || '', role: user.role || 'user', password: '', isActive: user.isActive };
 formErrors.value = {};
 modalError.value = '';
 showFormPw.value = false;
 showUserModal.value = true;
 nextTick(() => refreshIcons());
}

function closeUserModal() {
 showUserModal.value = false;
 editingUser.value = null;
}

function validateUserForm() {
 const errs = {};
 if (!userForm.value.name.trim()) errs.name = 'Nama lengkap wajib diisi.';
 if (!userForm.value.username.trim()) errs.username = 'Username wajib diisi.';
 if (!editingUser.value && !userForm.value.password) errs.password = 'Password wajib diisi.';
 formErrors.value = errs;
 return Object.keys(errs).length === 0;
}

async function saveUser() {
 if (!validateUserForm()) return;
 savingUser.value = true;
 modalError.value = '';
 try {
 let res, data;
 if (editingUser.value) {
 const updates = { name: userForm.value.name, username: userForm.value.username, email: userForm.value.email, role: userForm.value.role, isActive: userForm.value.isActive };
 if (userForm.value.password) updates.password = userForm.value.password;
 res = await apiFetch(`/api/admin/users/${editingUser.value.id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(updates)
 });
 } else {
 res = await apiFetch('/api/admin/users', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(userForm.value)
 });
 }
 data = await res.json();
 if (!res.ok) { modalError.value = data.error || 'Gagal menyimpan.'; return; }
 closeUserModal();
 await loadUsers();
 await loadStats();
 } finally {
 savingUser.value = false;
 refreshIcons();
 }
}

async function toggleUserActive(user) {
 try {
 await apiFetch(`/api/admin/users/${user.id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ isActive: !user.isActive })
 });
 await loadUsers();
 } catch {}
}

function confirmDeleteUser(user) {
 deleteTarget.value = user;
 showDeleteConfirm.value = true;
 nextTick(() => refreshIcons());
}

async function executeDelete() {
 if (!deleteTarget.value) return;
 deletingUser.value = true;
 try {
 await apiFetch(`/api/admin/users/${deleteTarget.value.id}`, { method: 'DELETE' });
 showDeleteConfirm.value = false;
 deleteTarget.value = null;
 await loadUsers();
 await loadStats();
 } finally {
 deletingUser.value = false;
 refreshIcons();
 }
}

function confirmDeleteReport(report) {
 deleteReportTarget.value = report;
 deleteReportConfirmText.value = '';
 showDeleteReportConfirm.value = true;
 nextTick(() => refreshIcons());
}

function closeDeleteReportConfirm() {
 showDeleteReportConfirm.value = false;
 deleteReportTarget.value = null;
 deleteReportConfirmText.value = '';
}

async function executeDeleteReport() {
 if (!deleteReportTarget.value || !isDeleteReportConfirmValid.value) return;
 deletingReport.value = true;
 try {
 const res = await apiFetch(`/api/v1/laporan/${deleteReportTarget.value.id}`, { method: 'DELETE' });
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 throw new Error(data.error || `Gagal menghapus laporan (status ${res.status}).`);
 }
 reports.value = reports.value.filter(r => r.id !== deleteReportTarget.value.id);
 showNotification('Laporan dihapus', 'Laporan berhasil dihapus dari daftar.', 'success');
 closeDeleteReportConfirm();
 } catch (err) {
 showNotification('Gagal menghapus laporan', err.message || 'Terjadi kesalahan saat menghapus laporan.', 'error');
 } finally {
 deletingReport.value = false;
 refreshIcons();
 }
}

function refreshIcons() {
 nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
}

watch(activeTab, () => refreshIcons());

onMounted(async () => {
 await Promise.all([loadStats(), loadUsers(), loadApiConfig(), loadBackupStats(), loadLogs(), loadStorageStats()]);

 // Real-time audit logs & stats sync
 realtime.on('LOG_CREATED', (newLog) => {
 if (newLog) {
 logs.value.unshift(newLog);
 logsTotal.value++;
 if (logs.value.length > 100) logs.value.pop();
 refreshIcons();
 }
 });

 realtime.on('RKA_CREATED', () => {
 loadStats();
 loadBackupStats();
 });

 realtime.on('RKA_UPDATED', () => {
 loadStats();
 });

 realtime.on('RKA_DELETED', () => {
 loadStats();
 loadBackupStats();
 });

 // Tab hasil pemulihan (setelah refresh) yang datanya baru dimuat saat tab dibuka
 if (activeTab.value === 'reports') loadReports();
 if (activeTab.value === 'settings') loadContactSettings();

 refreshIcons();
});
</script>

<style scoped>
.admin-dashboard {
 display: flex;
 flex-direction: column;
 gap: 0;
 min-height: 100%;
 background: var(--bg-primary);
}

/* === TOPBAR === */
.admin-topbar {
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 20px 28px 16px;
 border-bottom: 1px solid var(--border-color);
}

.admin-topbar-left {
 display: flex;
 align-items: center;
}

.admin-brand-badge {
 display: flex;
 align-items: center;
 gap: 14px;
}

.admin-icon-circle {
 width: 44px;
 height: 44px;
 border-radius: 12px;
 background: #1B4D46;
 display: flex;
 align-items: center;
 justify-content: center;
 box-shadow: 0 4px 14px rgba(14,107,94,0.35);
}

.admin-brand-icon {
 color: white;
 width: 20px;
 height: 20px;
}

.admin-brand-title {
 font-size: 1.2rem;
 font-weight: 800;
 color: var(--text-primary);
 letter-spacing: -0.3px;
}

.admin-brand-sub {
 font-size: 0.78rem;
 color: var(--text-muted);
 margin-top: 2px;
}

.admin-badge {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 6px 14px;
 color: white;
 border-radius: 20px;
 font-size: 0.78rem;
 font-weight: 700;
}

.badge-admin {
 background: #1B4D46;
}

.badge-moderator {
 background: #8b5cf6;
}

.admin-badge i { width: 13px; height: 13px; }

/* === TABS === */
.admin-tabs {
 display: flex;
 gap: 4px;
 padding: 12px 28px 0;
 border-bottom: 1px solid var(--border-color);
 background: var(--bg-secondary);
}

.admin-tab-btn {
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 10px 18px;
 border: none;
 background: none;
 border-radius: 8px 8px 0 0;
 font-size: 0.85rem;
 font-weight: 600;
 color: var(--text-muted);
 cursor: pointer;
 border-bottom: 2px solid transparent;
 transition: all 0.18s;
}

.admin-tab-btn i { width: 15px; height: 15px; }

.admin-tab-btn.active {
 color: var(--primary-color);
 border-bottom-color: var(--primary-color);
 background: var(--bg-primary);
}

.admin-tab-btn:hover:not(.active) {
 color: var(--text-secondary);
 background: var(--bg-tertiary);
}

/* === CONTENT === */
.admin-content {
 padding: 28px;
 display: flex;
 flex-direction: column;
 gap: 24px;
}

.admin-loading {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 10px;
 padding: 60px;
 color: var(--text-muted);
 font-size: 0.9rem;
}

.section-title {
 display: flex;
 align-items: center;
 gap: 8px;
 font-size: 1rem;
 font-weight: 700;
 color: var(--text-primary);
 margin-bottom: 4px;
}

.section-subtitle {
 font-size: 0.82rem;
 color: var(--text-muted);
 margin-top: 2px;
}

.section-title i { width: 18px; height: 18px; color: var(--primary-color); }

/* === STATS GRID === */
.stats-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
 gap: 16px;
}

.stat-card {
 display: flex;
 align-items: center;
 gap: 16px;
 padding: 20px;
 border-radius: 12px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 box-shadow: var(--shadow-sm);
 transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
 transform: translateY(-2px);
 box-shadow: var(--shadow-md);
}

.stat-icon-wrap {
 width: 48px;
 height: 48px;
 border-radius: 12px;
 display: flex;
 align-items: center;
 justify-content: center;
 flex-shrink: 0;
}

.stat-icon-wrap i { width: 22px; height: 22px; }

.stat-blue .stat-icon-wrap { background: rgba(59,130,246,0.12); color: #3b82f6; }
.stat-green .stat-icon-wrap { background: rgba(16,185,129,0.12); color: #10b981; }
.stat-purple .stat-icon-wrap { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.stat-amber .stat-icon-wrap { background: rgba(245,158,11,0.12); color: #f59e0b; }

.stat-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
.stat-value { font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 2px 0; }
.stat-sub { font-size: 0.85rem; font-weight: 500; color: var(--text-muted); }
.stat-desc { font-size: 0.76rem; color: var(--text-muted); }

/* === API STATUS GRID === */
.api-status-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
 gap: 16px;
}

.api-status-card {
 display: flex;
 align-items: flex-start;
 gap: 14px;
 padding: 18px;
 border-radius: 12px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
}

.api-status-icon {
 width: 36px;
 height: 36px;
 border-radius: 8px;
 display: flex;
 align-items: center;
 justify-content: center;
 flex-shrink: 0;
}

.api-status-icon i { width: 18px; height: 18px; }

.api-ok .api-status-icon { background: rgba(16,185,129,0.12); color: #10b981; }
.api-off .api-status-icon { background: rgba(239,68,68,0.12); color: #ef4444; }

.api-name { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); }
.api-use { font-size: 0.76rem; color: var(--text-muted); margin: 2px 0 8px; }

.api-pill {
 display: inline-flex;
 align-items: center;
 gap: 4px;
 padding: 3px 10px;
 border-radius: 20px;
 font-size: 0.72rem;
 font-weight: 700;
}

.pill-on { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.pill-off { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

/* === LOGS SECTION === */
.logs-header-row {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 16px;
}

.logs-actions {
 display: flex;
 gap: 8px;
}

.btn-refresh, .btn-clear-logs {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 8px 14px;
 border-radius: 8px;
 font-size: 0.82rem;
 font-weight: 600;
 cursor: pointer;
 border: 1px solid var(--border-color);
 background: var(--bg-card);
 color: var(--text-primary);
 transition: background 0.15s;
}

.btn-refresh:hover { background: var(--bg-secondary); }
.btn-clear-logs { color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); }
.btn-clear-logs:hover { background: rgba(239,68,68,0.15); }
.btn-refresh i, .btn-clear-logs i { width: 14px; height: 14px; }

.logs-filter-bar {
 display: flex;
 gap: 14px;
 align-items: center;
 flex-wrap: wrap;
}

.log-search-wrap {
 flex: 1;
 min-width: 260px;
 display: flex;
 align-items: center;
 gap: 10px;
 padding: 8px 14px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: 8px;
}

.log-search-wrap i { width: 15px; height: 15px; color: var(--text-muted); }

.log-search-input {
 flex: 1;
 border: none;
 background: none;
 font-size: 0.85rem;
 color: var(--text-primary);
 outline: none;
}

.log-select-wrap {
 display: flex;
 align-items: center;
 gap: 8px;
 font-size: 0.82rem;
 color: var(--text-muted);
}

.log-select {
 padding: 8px 12px;
 border-radius: 8px;
 border: 1px solid var(--border-color);
 background: var(--bg-card);
 color: var(--text-primary);
 font-size: 0.82rem;
 outline: none;
}

.logs-table-wrap {
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: 12px;
 overflow-x: auto;
 box-shadow: var(--shadow-sm);
}

.logs-table {
 width: 100%;
 border-collapse: collapse;
 font-size: 0.82rem;
}

.logs-table th {
 padding: 12px 16px;
 background: var(--bg-secondary);
 color: var(--text-muted);
 font-weight: 700;
 text-align: left;
 border-bottom: 1px solid var(--border-color);
 text-transform: uppercase;
 font-size: 0.72rem;
}

.logs-table td {
 padding: 12px 16px;
 border-bottom: 1px solid var(--border-color);
 color: var(--text-primary);
 vertical-align: middle;
}

.log-time-rel { font-weight: 700; color: var(--text-primary); }
.log-time-full { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }

.log-user-cell {
 display: flex;
 flex-direction: column;
 gap: 2px;
}

.role-pill-sm {
 align-self: flex-start;
 font-size: 0.65rem;
 font-weight: 800;
 text-transform: uppercase;
 padding: 2px 6px;
 border-radius: 4px;
}

.rp-admin { background: rgba(220,122,42,0.15); color: #C97B3D; }
.rp-moderator { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.rp-user { background: rgba(59,130,246,0.15); color: #3b82f6; }

.log-username-sub { font-size: 0.72rem; color: var(--text-muted); }

.action-badge {
 display: inline-block;
 padding: 3px 8px;
 border-radius: 6px;
 font-size: 0.72rem;
 font-weight: 800;
 letter-spacing: 0.3px;
}

.act-login { background: rgba(16,185,129,0.15); color: #10b981; }
.act-logout { background: rgba(100,116,139,0.15); color: #64748b; }
.act-upload { background: rgba(14,107,94,0.15); color: #1B4D46; }
.act-update { background: rgba(245,158,11,0.15); color: #f59e0b; }
.act-delete { background: rgba(239,68,68,0.15); color: #ef4444; }
.act-backup { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.act-restore { background: rgba(6,182,212,0.15); color: #06b6d4; }
.act-user { background: rgba(59,130,246,0.15); color: #3b82f6; }
.act-config { background: rgba(217,70,239,0.15); color: #d946ef; }
.act-default { background: rgba(100,116,139,0.1); color: var(--text-muted); }

.log-target-cell code {
 font-size: 0.76rem;
 background: var(--bg-secondary);
 padding: 2px 6px;
 border-radius: 4px;
}

.log-details-cell { max-width: 320px; line-height: 1.4; }

.log-status-cell {
 display: flex;
 flex-direction: column;
 gap: 4px;
}

.status-badge-pill {
 display: inline-flex;
 align-items: center;
 gap: 4px;
 font-size: 0.68rem;
 font-weight: 800;
 padding: 3px 8px;
 border-radius: 6px;
 letter-spacing: 0.3px;
 width: fit-content;
}

.badge-pill-success {
 background: rgba(16, 185, 129, 0.15);
 color: #10b981;
 border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-pill-failed {
 background: rgba(239, 68, 68, 0.15);
 color: #ef4444;
 border: 1px solid rgba(239, 68, 68, 0.3);
}

.log-row-failed {
 background: rgba(239, 68, 68, 0.04) !important;
}

.log-row-failed td:first-child {
 border-left: 3px solid #ef4444;
}

.logs-quick-filters {
 display: flex;
 flex-wrap: wrap;
 gap: 8px;
}

.quick-filter-chip {
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 color: var(--text-muted);
 padding: 5px 12px;
 border-radius: 20px;
 font-size: 0.76rem;
 font-weight: 600;
 cursor: pointer;
 display: inline-flex;
 align-items: center;
 gap: 6px;
 transition: all 0.2s;
}

.quick-filter-chip:hover {
 border-color: var(--primary-color);
 color: var(--text-primary);
}

.quick-filter-chip.active {
 background: var(--primary-color);
 color: #ffffff;
 border-color: var(--primary-color);
}

.quick-filter-chip.chip-success.active {
 background: #10b981 !important;
 border-color: #10b981 !important;
 color: #ffffff !important;
}

.quick-filter-chip.chip-failed.active {
 background: #ef4444 !important;
 border-color: #ef4444 !important;
 color: #ffffff !important;
}

.status-dot {
 width: 7px;
 height: 7px;
 border-radius: 50%;
}
.dot-success { background: #10b981; }
.dot-failed { background: #ef4444; }
.log-ip { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; }

.logs-footer-info {
 font-size: 0.78rem;
 color: var(--text-muted);
 text-align: right;
}

/* === BACKUP SECTION === */
.backup-info-banner {
 display: flex;
 align-items: flex-start;
 gap: 16px;
 padding: 18px 22px;
 border-radius: 12px;
 background: rgba(14,107,94,0.08);
 border: 1px solid rgba(14,107,94,0.25);
}

.banner-icon { width: 24px; height: 24px; color: var(--primary-color); flex-shrink: 0; margin-top: 2px; }
.backup-info-banner strong { font-size: 0.95rem; color: var(--text-primary); display: block; margin-bottom: 4px; }
.backup-info-banner p { font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }

.backup-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
 gap: 20px;
}

.backup-card {
 display: flex;
 flex-direction: column;
 padding: 24px;
 border-radius: 14px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 box-shadow: var(--shadow-sm);
 gap: 18px;
}

.backup-card-icon {
 width: 48px;
 height: 48px;
 border-radius: 12px;
 display: flex;
 align-items: center;
 justify-content: center;
}

.export-icon { background: rgba(14,107,94,0.12); color: #1B4D46; }
.restore-icon { background: rgba(59,130,246,0.12); color: #3b82f6; }
.backup-card-icon i { width: 24px; height: 24px; }

.backup-card-body h3 {
 font-size: 1.05rem;
 font-weight: 800;
 color: var(--text-primary);
 margin-bottom: 6px;
}

.backup-card-body p {
 font-size: 0.82rem;
 color: var(--text-secondary);
 line-height: 1.5;
 margin-bottom: 12px;
}

.backup-meta {
 display: flex;
 flex-direction: column;
 gap: 6px;
 font-size: 0.76rem;
 color: var(--text-muted);
}

.backup-meta span { display: flex; align-items: center; gap: 6px; }
.backup-meta span i { width: 13px; height: 13px; }

.restore-dropzone {
 border: 2px dashed var(--border-color);
 padding: 16px;
 border-radius: 10px;
 display: flex;
 flex-direction: column;
 align-items: center;
 justify-content: center;
 gap: 8px;
 cursor: pointer;
 background: var(--bg-secondary);
 text-align: center;
 font-size: 0.8rem;
 color: var(--text-muted);
 transition: border-color 0.15s;
}

.restore-dropzone:hover { border-color: var(--primary-color); }
.restore-dropzone i { width: 22px; height: 22px; color: var(--text-muted); }
.hidden-file-input { display: none; }
.selected-file-info { color: var(--primary-color); font-size: 0.82rem; }

.btn-backup-action {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 8px;
 padding: 11px 20px;
 border-radius: 8px;
 border: none;
 font-weight: 700;
 font-size: 0.85rem;
 cursor: pointer;
 color: white;
 transition: opacity 0.2s, transform 0.15s;
 margin-top: auto;
}

.btn-backup-action:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-export { background: #1B4D46; }
.btn-restore { background: #3b82f6; }

.merge-file-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 170px; overflow-y: auto; }
.merge-file-list li { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; padding: 6px 10px; border-radius: 8px; background: rgba(0,0,0,0.04); border: 1px solid var(--border-color, rgba(0,0,0,0.08)); }
.merge-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); }
.merge-status { color: var(--text-muted); text-align: right; }
.merge-done .merge-status { color: #10b981; }
.merge-error .merge-status { color: #ef4444; }
.merge-processing .merge-status { color: #f59e0b; }
.merge-remove { border: none; background: transparent; cursor: pointer; font-size: 1rem; line-height: 1; color: var(--text-muted); }
.merge-remove:hover { color: #ef4444; }
.merge-overwrite { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 0.78rem; color: var(--text-secondary); cursor: pointer; }

.btn-backup-action i { width: 16px; height: 16px; }

.snapshots-section {
 display: flex;
 flex-direction: column;
 gap: 12px;
 margin-top: 8px;
}

.snapshots-table-wrap {
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: 12px;
 overflow: hidden;
}

.snapshots-table {
 width: 100%;
 border-collapse: collapse;
 font-size: 0.82rem;
}

.snapshots-table th {
 padding: 10px 16px;
 background: var(--bg-secondary);
 color: var(--text-muted);
 font-weight: 700;
 text-align: left;
 font-size: 0.72rem;
 text-transform: uppercase;
}

.snapshots-table td {
 padding: 10px 16px;
 border-bottom: 1px solid var(--border-color);
 color: var(--text-primary);
}

.snapshot-filename {
 font-family: monospace;
 font-size: 0.78rem;
 color: var(--primary-color);
}

.btn-snapshot-restore {
 display: inline-flex;
 align-items: center;
 gap: 5px;
 padding: 4px 10px;
 border: 1px solid #3b82f6;
 border-radius: 6px;
 background: rgba(59,130,246,0.08);
 color: #3b82f6;
 font-size: 0.75rem;
 font-weight: 700;
 cursor: pointer;
}
.btn-snapshot-restore:hover:not(:disabled) { background: #3b82f6; color: #fff; }
.btn-snapshot-restore:disabled { opacity: 0.5; cursor: not-allowed; }

.snapshot-badge-ok {
 display: inline-flex;
 align-items: center;
 gap: 4px;
 color: #10b981;
 font-size: 0.75rem;
 font-weight: 700;
}

/* === USERS TABLE === */
.users-header-row {
 display: flex;
 align-items: center;
 justify-content: space-between;
}

.users-header-actions {
 display: flex;
 align-items: center;
 gap: 12px;
}

.user-count-badge {
 padding: 5px 12px;
 background: var(--bg-secondary);
 border: 1px solid var(--border-color);
 border-radius: 20px;
 font-size: 0.78rem;
 font-weight: 700;
 color: var(--text-secondary);
}

.btn-admin-primary {
 display: flex;
 align-items: center;
 gap: 7px;
 padding: 8px 18px;
 background: #1B4D46;
 color: white;
 border: none;
 border-radius: 8px;
 font-size: 0.82rem;
 font-weight: 700;
 cursor: pointer;
 transition: opacity 0.2s;
 box-shadow: 0 3px 10px rgba(14,107,94,0.3);
}

.btn-admin-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-admin-primary i { width: 15px; height: 15px; }

.user-search-wrap {
 display: flex;
 align-items: center;
 gap: 10px;
 padding: 8px 14px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: 8px;
 max-width: 400px;
}

.user-search-wrap i { width: 16px; height: 16px; color: var(--text-muted); }
.user-search-input { flex: 1; border: none; background: none; font-size: 0.85rem; color: var(--text-primary); outline: none; }

.users-table-wrap {
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: 12px;
 overflow: hidden;
 box-shadow: var(--shadow-sm);
}

.users-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.users-table th {
 padding: 12px 16px;
 background: var(--bg-secondary);
 color: var(--text-muted);
 font-weight: 700;
 text-align: left;
 border-bottom: 1px solid var(--border-color);
 text-transform: uppercase;
 font-size: 0.72rem;
}

.users-table td {
 padding: 12px 16px;
 border-bottom: 1px solid var(--border-color);
 color: var(--text-primary);
 vertical-align: middle;
}

.no-data { text-align: center; color: var(--text-muted); padding: 40px !important; }

.user-name-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar-sm {
 width: 34px;
 height: 34px;
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 0.75rem;
 font-weight: 800;
 color: white;
 flex-shrink: 0;
}

.avatar-admin { background: #1B4D46; }
.avatar-moderator { background: #8b5cf6; }
.avatar-user { background: #3b82f6; }

.user-full-name { font-weight: 700; color: var(--text-primary); }
.user-id-sm { font-size: 0.7rem; color: var(--text-muted); }
.username-code { font-size: 0.8rem; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; }

.role-badge {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 4px;
 width: 108px;
 padding: 3px 10px;
 border-radius: 20px;
 font-size: 0.72rem;
 font-weight: 700;
}

.role-admin { background: rgba(220,122,42,0.12); color: #C97B3D; border: 1px solid rgba(220,122,42,0.3); }
.role-moderator { background: rgba(139,92,246,0.12); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); }
.role-user { background: rgba(59,130,246,0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
.role-badge i { width: 11px; height: 11px; flex-shrink: 0; }

.status-badge {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 width: 78px;
 padding: 3px 9px;
 border-radius: 20px;
 font-size: 0.72rem;
 font-weight: 700;
}

.status-active { background: rgba(16,185,129,0.12); color: #10b981; }
.status-inactive { background: rgba(239,68,68,0.12); color: #ef4444; }

.last-login-cell { font-size: 0.78rem; color: var(--text-muted); }

.row-actions { display: flex; align-items: center; gap: 6px; }
.btn-row-edit, .btn-row-toggle, .btn-row-delete {
 width: 30px;
 height: 30px;
 border-radius: 6px;
 border: 1px solid var(--border-color);
 background: var(--bg-card);
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 transition: all 0.15s;
 color: var(--text-muted);
}

.btn-row-edit:hover { background: rgba(59,130,246,0.1); color: #3b82f6; border-color: #3b82f6; }
.btn-row-toggle:hover { background: rgba(245,158,11,0.1); color: #f59e0b; border-color: #f59e0b; }
.btn-row-delete:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: #ef4444; }
.btn-row-edit i, .btn-row-toggle i, .btn-row-delete i { width: 13px; height: 13px; }
.row-protected { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }

/* === API CONFIG === */
.api-config-info-banner {
 display: flex;
 align-items: flex-start;
 gap: 14px;
 padding: 16px 20px;
 background: rgba(14,107,94,0.08);
 border: 1px solid rgba(14,107,94,0.25);
 border-radius: 10px;
 font-size: 0.84rem;
 color: var(--text-secondary);
 line-height: 1.5;
}

.api-config-info-banner i { width: 20px; height: 20px; color: var(--primary-color); flex-shrink: 0; margin-top: 1px; }

/* === LAPORAN MASUK === */
.report-list { display: flex; flex-direction: column; gap: 16px; }

.report-item {
 padding: 18px 20px;
 border: 1px solid var(--border-color);
 border-radius: var(--border-radius-md);
 background: var(--bg-primary);
 transition: box-shadow 0.15s, border-color 0.15s;
}
.report-item:hover { border-color: var(--border-color-strong); box-shadow: var(--shadow-raised); }

.report-topline {
 display: flex;
 align-items: flex-start;
 justify-content: space-between;
 gap: 12px;
 flex-wrap: wrap;
}
.report-title-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.report-title { font-size: 0.98rem; font-weight: 700; color: var(--text-primary); }
.report-category-badge {
 font-size: 0.7rem;
 font-weight: 600;
 color: var(--primary-color);
 background: var(--primary-glow);
 padding: 3px 10px;
 border-radius: 20px;
 white-space: nowrap;
}
.report-status-badge {
 font-size: 0.68rem;
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.4px;
 padding: 4px 12px;
 border-radius: 20px;
 color: #fff;
 background: var(--warning-solid);
 white-space: nowrap;
}
.report-status-badge.status-selesai { background: var(--success-solid); }
.report-status-badge.status-diproses { background: var(--info-color); }

.report-info-grid {
 display: flex;
 flex-wrap: wrap;
 gap: 10px 20px;
 margin-top: 12px;
 padding: 12px 14px;
 background: var(--bg-tertiary);
 border-radius: var(--border-radius-sm);
}
.report-info-item {
 display: flex;
 align-items: center;
 gap: 6px;
 font-size: 0.8rem;
 color: var(--text-primary);
}
.report-info-icon { width: 14px; height: 14px; color: var(--text-muted); flex-shrink: 0; }
.report-info-label {
 display: block;
 font-size: 0.65rem;
 font-weight: 600;
 text-transform: uppercase;
 letter-spacing: 0.3px;
 color: var(--text-muted);
 margin-bottom: 1px;
}

.report-desc {
 margin: 14px 0 0;
 font-size: 0.86rem;
 line-height: 1.6;
 color: var(--text-secondary);
 white-space: pre-wrap;
}

.report-images { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.report-images img {
 width: 56px;
 height: 56px;
 object-fit: cover;
 border-radius: 8px;
 border: 1px solid var(--border-color);
}
.report-images-more { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

.report-actions { display: flex; gap: 8px; margin-top: 14px; }
.btn-danger {
 background: rgba(239,68,68,0.1);
 color: #ef4444;
 border: 1px solid rgba(239,68,68,0.3);
 box-shadow: none;
}
.btn-danger:hover {
 background: #ef4444;
 color: #fff;
 border-color: #ef4444;
}

.api-config-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
 gap: 20px;
}

.api-config-card {
 padding: 24px;
 border-radius: 14px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 box-shadow: var(--shadow-sm);
 display: flex;
 flex-direction: column;
 gap: 16px;
}

.api-config-header { display: flex; align-items: center; gap: 14px; }
.api-config-icon {
 width: 44px;
 height: 44px;
 border-radius: 10px;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 1.3rem;
 flex-shrink: 0;
}

.gemini-gradient { background: #4285F4; }
.openai-gradient { background: #10a37f; }

.api-config-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.api-config-desc { font-size: 0.76rem; color: var(--text-muted); margin-top: 2px; }

.api-current-status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.api-masked { font-family: monospace; font-size: 0.78rem; color: var(--text-muted); background: var(--bg-secondary); padding: 2px 8px; border-radius: 4px; }

.api-input-section label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }

.api-key-input-wrap {
 display: flex;
 align-items: center;
 background: var(--bg-secondary);
 border: 1px solid var(--border-color);
 border-radius: 8px;
 overflow: hidden;
}

.api-key-input {
 flex: 1;
 padding: 9px 12px;
 border: none;
 background: none;
 font-size: 0.82rem;
 color: var(--text-primary);
 outline: none;
}

.key-toggle-btn {
 padding: 8px 12px;
 border: none;
 background: none;
 color: var(--text-muted);
 cursor: pointer;
}

.key-toggle-btn i { width: 14px; height: 14px; }
.api-key-hint { font-size: 0.72rem; color: var(--text-muted); margin-top: 5px; }
.api-key-hint a { color: var(--primary-color); text-decoration: underline; }

.btn-save-key {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 7px;
 padding: 10px;
 border: none;
 border-radius: 8px;
 font-size: 0.84rem;
 font-weight: 700;
 color: white;
 cursor: pointer;
 transition: opacity 0.2s;
}

.btn-save-key:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-gemini { background: #4285F4; }
.btn-openai { background: #10a37f; }
.btn-save-key i { width: 14px; height: 14px; }

.api-save-msg {
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 12px 18px;
 border-radius: 8px;
 font-size: 0.84rem;
 font-weight: 600;
}

.api-save-msg.success { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.api-save-msg.error { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.api-save-msg i { width: 16px; height: 16px; }

/* === MODAL === */
.modal-overlay {
 position: fixed;
 inset: 0;
 background: rgba(0,0,0,0.85);
 display: flex;
 align-items: center;
 justify-content: center;
 z-index: 9999;
 padding: 20px;
}

.modal-box {
 background: var(--bg-primary, #fff);
 border: 1px solid var(--border-color);
 border-radius: 16px;
 width: 100%;
 max-width: 480px;
 box-shadow: 0 20px 40px rgba(0,0,0,0.4);
 overflow: hidden;
}

.modal-sm { max-width: 400px; }

.modal-header {
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 18px 24px;
 border-bottom: 1px solid var(--border-color);
}

.modal-header h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); }

.modal-close-btn {
 width: 28px;
 height: 28px;
 border: none;
 background: none;
 color: var(--text-muted);
 cursor: pointer;
 border-radius: 6px;
 display: flex;
 align-items: center;
 justify-content: center;
}

.modal-close-btn:hover { background: var(--bg-secondary); }
.modal-close-btn i { width: 16px; height: 16px; }

.modal-body {
 padding: 20px 24px;
 display: flex;
 flex-direction: column;
 gap: 14px;
}

.mform-group { display: flex; flex-direction: column; gap: 5px; }
.mform-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }

.mform-input {
 padding: 9px 12px;
 border: 1px solid var(--border-color);
 border-radius: 8px;
 background: var(--bg-secondary);
 color: var(--text-primary);
 font-size: 0.85rem;
 outline: none;
}

.mform-input:focus { border-color: var(--primary-color); }
.mfield-error { font-size: 0.72rem; color: #ef4444; }

.modal-error-alert {
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 10px 14px;
 background: rgba(239,68,68,0.1);
 border: 1px solid rgba(239,68,68,0.3);
 border-radius: 8px;
 color: #dc2626;
 font-size: 0.82rem;
}

.modal-error-alert i { width: 14px; height: 14px; }

.delete-warning {
 display: flex;
 align-items: center;
 gap: 6px;
 font-size: 0.8rem !important;
 color: #f59e0b !important;
 margin-top: 4px !important;
}

.delete-warning i { width: 14px; height: 14px; }

.modal-footer {
 display: flex;
 justify-content: flex-end;
 gap: 10px;
 padding: 16px 24px;
 border-top: 1px solid var(--border-color);
 background: var(--bg-secondary);
}

.btn-modal-cancel {
 padding: 8px 20px;
 border: 1px solid var(--border-color);
 background: var(--bg-card);
 border-radius: 8px;
 font-size: 0.85rem;
 font-weight: 600;
 color: var(--text-secondary);
 cursor: pointer;
 transition: background 0.15s;
}

.btn-modal-cancel:hover { background: var(--bg-hover, #f1f5f9); }

.btn-modal-save {
 display: flex;
 align-items: center;
 gap: 7px;
 padding: 8px 20px;
 background: #1B4D46;
 color: white;
 border: none;
 border-radius: 8px;
 font-size: 0.85rem;
 font-weight: 700;
 cursor: pointer;
 transition: opacity 0.2s;
 box-shadow: 0 3px 10px rgba(14,107,94,0.3);
}

.btn-modal-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-modal-save i { width: 14px; height: 14px; }

.btn-modal-delete {
 display: flex;
 align-items: center;
 gap: 7px;
 padding: 8px 20px;
 background: #ef4444;
 color: white;
 border: none;
 border-radius: 8px;
 font-size: 0.85rem;
 font-weight: 700;
 cursor: pointer;
 transition: opacity 0.2s;
}

.btn-modal-delete:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-modal-delete i { width: 14px; height: 14px; }

.spin-anim {
 animation: spin 1s linear infinite;
}

@keyframes spin {
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
}

/* ═══════════════════════════════════════════════════════════════════════════
 PUSAT MANAJEMEN KUNCI API (CRUD GEMINI & OPENAI)
═══════════════════════════════════════════════════════════════════════════ */
.api-crud-container {
 display: flex;
 flex-direction: column;
 gap: 16px;
 width: 100%;
}

/* ── Summary Stats Grid ── */
.api-summary-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
 gap: 14px;
}

.api-stat-card {
 display: flex;
 flex-direction: column;
 background: var(--bg-secondary);
 border: 1px solid var(--border-subtle);
 border-radius: 14px;
 padding: 16px 18px;
 cursor: pointer;
 transition: all 0.2s ease;
 position: relative;
 overflow: hidden;
}

.api-stat-card:hover {
 transform: translateY(-2px);
 box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
 border-color: rgba(99, 102, 241, 0.4);
}

.api-stat-card.card-highlight {
 border-color: #6366f1;
 background: rgba(99, 102, 241, 0.08);
}

.api-stat-card.card-action {
 background: rgba(99, 102, 241, 0.04);
 border: 1px dashed rgba(99, 102, 241, 0.4);
 justify-content: center;
}
.api-stat-card.card-action:hover {
 border-style: solid;
 border-color: #6366f1;
}

.api-stat-icon {
 font-size: 1.4rem;
 width: 38px;
 height: 38px;
 border-radius: 10px;
 display: flex;
 align-items: center;
 justify-content: center;
 margin-bottom: 10px;
}
.icon-total { background: rgba(99, 102, 241, 0.15); }
.icon-gemini { background: rgba(59, 130, 246, 0.15); }
.icon-openai { background: rgba(16, 185, 129, 0.15); }
.icon-plus { background: rgba(99, 102, 241, 0.2); }

.api-stat-meta {
 display: flex;
 flex-direction: column;
}

.api-stat-val {
 font-size: 1.6rem;
 font-weight: 800;
 color: var(--text-primary);
 line-height: 1.1;
}

.api-stat-val-small {
 font-size: 1rem;
 font-weight: 700;
 color: #6366f1;
}

.api-stat-lbl {
 font-size: 0.78rem;
 color: var(--text-muted);
 font-weight: 500;
 margin-top: 2px;
}

.api-stat-sub {
 margin-top: 8px;
 padding-top: 8px;
 border-top: 1px solid var(--border-subtle);
 font-size: 0.72rem;
 color: var(--text-muted);
 display: flex;
 align-items: center;
 gap: 6px;
}

.dot-live {
 width: 7px;
 height: 7px;
 border-radius: 50%;
 background: #10b981;
 box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
}

.sub-active {
 color: #10b981;
 font-weight: 700;
}

/* ── Toolbar Card ── */
.api-toolbar-card {
 display: flex;
 align-items: center;
 justify-content: space-between;
 flex-wrap: wrap;
 gap: 12px;
 background: var(--bg-secondary);
 border: 1px solid var(--border-subtle);
 border-radius: 14px;
 padding: 14px 18px;
}

.api-toolbar-left {
 display: flex;
 align-items: center;
 flex-wrap: wrap;
 gap: 10px;
}

.btn-api-action {
 display: flex;
 align-items: center;
 gap: 7px;
 padding: 9px 16px;
 border-radius: 10px;
 font-size: 0.82rem;
 font-weight: 700;
 cursor: pointer;
 border: none;
 transition: all 0.2s ease;
}

.btn-api-action i { width: 14px; height: 14px; }

.btn-add-primary {
 background: #6366f1;
 color: #fff;
 box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.btn-add-primary:hover {
 transform: translateY(-1px);
 box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-batch-import {
 background: var(--bg-primary);
 color: var(--text-primary);
 border: 1px solid var(--border-subtle);
}
.btn-batch-import:hover {
 background: rgba(99, 102, 241, 0.08);
 border-color: rgba(99, 102, 241, 0.4);
}

.btn-seed-defaults {
 background: rgba(245, 158, 11, 0.12);
 color: #d97706;
 border: 1px solid rgba(245, 158, 11, 0.3);
}
.btn-seed-defaults:hover:not(:disabled) {
 background: rgba(245, 158, 11, 0.2);
}

.btn-api-toggle-all {
 display: flex;
 align-items: center;
 gap: 6px;
 padding: 8px 14px;
 border-radius: 8px;
 font-size: 0.78rem;
 font-weight: 600;
 background: var(--bg-primary);
 border: 1px solid var(--border-subtle);
 color: var(--text-secondary);
 cursor: pointer;
 transition: all 0.15s ease;
}
.btn-api-toggle-all i { width: 14px; height: 14px; }
.btn-api-toggle-all:hover {
 background: rgba(99, 102, 241, 0.08);
 color: #6366f1;
}

/* ── Filter Bar ── */
.api-filter-bar {
 display: flex;
 align-items: center;
 justify-content: space-between;
 flex-wrap: wrap;
 gap: 12px;
}

.api-filter-chips {
 display: flex;
 align-items: center;
 flex-wrap: wrap;
 gap: 8px;
}

.api-chip {
 display: flex;
 align-items: center;
 gap: 6px;
 padding: 7px 14px;
 border-radius: 20px;
 font-size: 0.78rem;
 font-weight: 600;
 background: var(--bg-secondary);
 border: 1px solid var(--border-subtle);
 color: var(--text-secondary);
 cursor: pointer;
 transition: all 0.15s ease;
}
.api-chip i { width: 13px; height: 13px; }
.api-chip:hover {
 background: rgba(99, 102, 241, 0.08);
 border-color: rgba(99, 102, 241, 0.3);
}
.api-chip.active {
 background: #6366f1;
 color: #fff;
 border-color: #6366f1;
 box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
}
.api-chip.chip-gemini.active {
 background: #3b82f6;
 border-color: #3b82f6;
}
.api-chip.chip-openai.active {
 background: #10b981;
 border-color: #10b981;
}
.api-chip.chip-active-only.active {
 background: #059669;
 border-color: #059669;
}

.api-search-wrap {
 position: relative;
 min-width: 260px;
}
.api-search-icon {
 position: absolute;
 left: 12px;
 top: 50%;
 transform: translateY(-50%);
 width: 14px;
 height: 14px;
 color: var(--text-muted);
}
.api-search-input {
 width: 100%;
 padding: 8px 32px 8px 34px;
 border-radius: 20px;
 border: 1px solid var(--border-subtle);
 background: var(--bg-secondary);
 color: var(--text-primary);
 font-size: 0.8rem;
 outline: none;
 box-sizing: border-box;
}
.api-search-input:focus {
 border-color: #6366f1;
}
.api-search-clear {
 position: absolute;
 right: 10px;
 top: 50%;
 transform: translateY(-50%);
 background: none;
 border: none;
 color: var(--text-muted);
 cursor: pointer;
 padding: 2px;
}
.api-search-clear i { width: 12px; height: 12px; }

/* ── Table Wrapper ── */
.api-table-wrapper {
 background: var(--bg-secondary);
 border: 1px solid var(--border-subtle);
 border-radius: 14px;
 overflow: hidden;
}

.api-keys-table {
 width: 100%;
 border-collapse: collapse;
 font-size: 0.82rem;
}

.api-keys-table th {
 background: rgba(0, 0, 0, 0.03);
 padding: 12px 14px;
 text-align: left;
 font-weight: 700;
 color: var(--text-muted);
 border-bottom: 1px solid var(--border-subtle);
 white-space: nowrap;
}

.api-keys-table td {
 padding: 12px 14px;
 border-bottom: 1px solid var(--border-subtle);
 vertical-align: middle;
}

.api-key-row {
 transition: background 0.15s ease;
}
.api-key-row:hover {
 background: rgba(99, 102, 241, 0.03);
}

.row-is-inactive {
 opacity: 0.6;
}

.key-index-badge {
 display: inline-block;
 font-size: 0.72rem;
 font-weight: 700;
 color: var(--text-muted);
 padding: 2px 6px;
 border-radius: 4px;
 background: rgba(0, 0, 0, 0.04);
}

/* Provider Pill */
.provider-pill {
 display: inline-flex;
 align-items: center;
 gap: 5px;
 padding: 4px 10px;
 border-radius: 12px;
 font-size: 0.74rem;
 font-weight: 700;
 white-space: nowrap;
}
.prov-gemini {
 background: rgba(59, 130, 246, 0.12);
 color: #2563eb;
 border: 1px solid rgba(59, 130, 246, 0.25);
}
.prov-openai {
 background: rgba(16, 185, 129, 0.12);
 color: #059669;
 border: 1px solid rgba(16, 185, 129, 0.25);
}

/* Label & Date */
.key-label-text {
 font-weight: 700;
 color: var(--text-primary);
}
.key-date-sub {
 font-size: 0.7rem;
 color: var(--text-muted);
 margin-top: 2px;
}

/* Key Display Box with Eye & Copy */
.key-display-box {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 8px;
 background: var(--bg-primary);
 border: 1px solid var(--border-subtle);
 border-radius: 8px;
 padding: 6px 10px;
 max-width: 460px;
}

.key-code-text {
 font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
 font-size: 0.8rem;
 color: var(--text-muted);
 letter-spacing: 0.5px;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;
}
.key-code-text.key-revealed {
 color: var(--text-primary);
 font-weight: 600;
}

.key-inline-tools {
 display: flex;
 align-items: center;
 gap: 4px;
 flex-shrink: 0;
}

.btn-tool-icon {
 width: 26px;
 height: 26px;
 display: flex;
 align-items: center;
 justify-content: center;
 border-radius: 6px;
 border: 1px solid transparent;
 background: transparent;
 color: var(--text-muted);
 cursor: pointer;
 transition: all 0.15s ease;
}
.btn-tool-icon i { width: 13px; height: 13px; }
.btn-tool-icon:hover {
 background: rgba(99, 102, 241, 0.1);
 color: #6366f1;
 border-color: rgba(99, 102, 241, 0.2);
}
.btn-tool-icon.btn-copied-active {
 color: #10b981;
 background: rgba(16, 185, 129, 0.15);
 border-color: rgba(16, 185, 129, 0.3);
}

/* Role Badge */
.role-badge {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 5px;
 width: 108px;
 padding: 3px 10px;
 border-radius: 12px;
 font-size: 0.72rem;
 font-weight: 700;
 white-space: nowrap;
}
.role-badge i { width: 11px; height: 11px; flex-shrink: 0; }

.role-primary {
 background: rgba(245, 158, 11, 0.15);
 color: #d97706;
 border: 1px solid rgba(245, 158, 11, 0.3);
}

.role-pool {
 background: rgba(99, 102, 241, 0.1);
 color: #6366f1;
 border: 1px solid rgba(99, 102, 241, 0.2);
}

/* Status Toggle Button */
.status-toggle-btn {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 5px 12px;
 border-radius: 20px;
 font-size: 0.72rem;
 font-weight: 800;
 cursor: pointer;
 border: none;
 transition: all 0.15s ease;
}

.status-toggle-btn .st-dot {
 width: 7px;
 height: 7px;
 border-radius: 50%;
}

.status-toggle-btn.st-on {
 background: rgba(16, 185, 129, 0.15);
 color: #059669;
 border: 1px solid rgba(16, 185, 129, 0.3);
}
.status-toggle-btn.st-on .st-dot {
 background: #10b981;
 box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
}
.status-toggle-btn.st-on:hover {
 background: rgba(16, 185, 129, 0.25);
}

.status-toggle-btn.st-off {
 background: rgba(100, 116, 139, 0.12);
 color: #64748b;
 border: 1px solid rgba(100, 116, 139, 0.2);
}
.status-toggle-btn.st-off .st-dot {
 background: #94a3b8;
}
.status-toggle-btn.st-off:hover {
 background: rgba(100, 116, 139, 0.2);
}

/* CRUD Action Buttons */
.crud-btn-group {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 6px;
}

.btn-crud-act {
 width: 32px;
 height: 32px;
 display: flex;
 align-items: center;
 justify-content: center;
 border-radius: 8px;
 border: 1px solid var(--border-subtle);
 background: var(--bg-primary);
 cursor: pointer;
 transition: all 0.15s ease;
}
.btn-crud-act i { width: 14px; height: 14px; }

.btn-crud-act.act-primary { color: #f59e0b; }
.btn-crud-act.act-primary:hover {
 background: rgba(245, 158, 11, 0.12);
 border-color: rgba(245, 158, 11, 0.4);
}

.btn-crud-act.act-edit { color: #6366f1; }
.btn-crud-act.act-edit:hover {
 background: rgba(99, 102, 241, 0.12);
 border-color: rgba(99, 102, 241, 0.4);
}

.btn-crud-act.act-del { color: #ef4444; }
.btn-crud-act.act-del:hover {
 background: rgba(239, 68, 68, 0.12);
 border-color: rgba(239, 68, 68, 0.4);
}

/* Empty State */
.api-empty-state {
 display: flex;
 flex-direction: column;
 align-items: center;
 padding: 48px 24px;
 text-align: center;
}
.empty-icon-wrap {
 font-size: 2.2rem;
 margin-bottom: 12px;
}
.api-empty-state h4 {
 font-size: 1.1rem;
 font-weight: 700;
 margin: 0 0 6px;
 color: var(--text-primary);
}
.api-empty-state p {
 font-size: 0.82rem;
 color: var(--text-muted);
 max-width: 400px;
 margin: 0 0 20px;
}
.empty-actions {
 display: flex;
 gap: 10px;
}

/* ── Modal Wide & Form Cards ── */
.modal-box-wide {
 max-width: 580px;
 width: 90%;
}

.modal-title-wrap {
 display: flex;
 align-items: center;
 gap: 12px;
}

.modal-icon-badge {
 font-size: 1.4rem;
 width: 38px;
 height: 38px;
 border-radius: 10px;
 background: rgba(99, 102, 241, 0.1);
 display: flex;
 align-items: center;
 justify-content: center;
}

.modal-subtitle {
 font-size: 0.76rem;
 color: var(--text-muted);
 margin: 2px 0 0;
}

.provider-radio-cards {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 12px;
}

.provider-choice-card {
 display: flex;
 align-items: center;
 gap: 12px;
 padding: 12px 14px;
 border: 1px solid var(--border-subtle);
 border-radius: 12px;
 background: var(--bg-primary);
 cursor: pointer;
 transition: all 0.15s ease;
}
.provider-choice-card input[type="radio"] {
 display: none;
}
.provider-choice-card.selected {
 border-color: #6366f1;
 background: rgba(99, 102, 241, 0.05);
 box-shadow: 0 0 0 1px #6366f1;
}

.pchoice-icon { font-size: 1.5rem; }
.pchoice-info {
 display: flex;
 flex-direction: column;
}
.pchoice-info strong {
 font-size: 0.82rem;
 color: var(--text-primary);
}
.pchoice-info small {
 font-size: 0.7rem;
 color: var(--text-muted);
 margin-top: 2px;
}

.key-mono-input {
 font-family: 'SFMono-Regular', Consolas, monospace !important;
 font-size: 0.82rem !important;
}

.mform-options-row {
 display: flex;
 flex-direction: column;
 gap: 8px;
 margin-top: 10px;
 padding: 12px;
 background: rgba(0, 0, 0, 0.02);
 border-radius: 10px;
 border: 1px solid var(--border-subtle);
}

.mcheckbox-label {
 display: flex;
 align-items: center;
 gap: 8px;
 font-size: 0.8rem;
 color: var(--text-primary);
 cursor: pointer;
}
.mcheckbox-label input[type="checkbox"] {
 width: 16px;
 height: 16px;
 accent-color: #6366f1;
 cursor: pointer;
}
/* === STORAGE INFO CARD === */
.storage-info-card {
  margin: 0 0 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 18px 20px 16px;
}
.storage-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.storage-info-header i { width: 16px; height: 16px; color: #6366f1; }
.storage-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.storage-stat-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
}
.storage-stat-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.storage-stat-icon i { width: 16px; height: 16px; }
.storage-icon-used { background: rgba(99,102,241,0.12); color: #6366f1; }
.storage-icon-used i { color: #6366f1; }
.storage-icon-limit { background: rgba(16,185,129,0.12); color: #10b981; }
.storage-icon-limit i { color: #10b981; }
.storage-icon-threshold { background: rgba(245,158,11,0.12); color: #f59e0b; }
.storage-icon-threshold i { color: #f59e0b; }
.storage-stat-info { flex: 1; min-width: 0; }
.storage-stat-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.03em; }
.storage-stat-value { font-size: 1rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.storage-stat-desc { font-size: 0.68rem; color: var(--text-muted); margin-top: 3px; line-height: 1.3; }
.storage-pct-badge { font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 8px; }
.pct-ok { background: rgba(16,185,129,0.12); color: #10b981; }
.pct-warn { background: rgba(245,158,11,0.12); color: #f59e0b; }
.pct-danger { background: rgba(239,68,68,0.12); color: #ef4444; }
/* Progress bar */
.storage-progress-wrap { margin-top: 4px; }
.storage-progress-bar {
  position: relative;
  height: 10px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  overflow: visible;
  margin-bottom: 4px;
}
.storage-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}
.fill-ok { background: linear-gradient(90deg, #10b981, #34d399); }
.fill-warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.fill-danger { background: linear-gradient(90deg, #ef4444, #f87171); }
.storage-threshold-line {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: #f59e0b;
  border-radius: 2px;
}
.storage-progress-labels {
  position: relative;
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--text-muted);
  padding: 2px 0;
}
.storage-local-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 4px;
}
@media (max-width: 640px) {
  .storage-stats-row { grid-template-columns: 1fr; }
}
</style>
