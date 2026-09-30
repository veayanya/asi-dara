<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-overlay" @click.self="requestClose">
        <div class="bk-box" role="dialog" aria-modal="true" aria-labelledby="bk-title">
          <!-- Header -->
          <div class="bk-header">
            <div>
              <h3 id="bk-title" class="bk-title">Backup &amp; Pemulihan Arsip</h3>
              <p class="bk-subtitle">
                <template v-if="isPrivileged">
                  Sebagai <strong>{{ currentUser?.role === 'admin' ? 'Administrator' : 'Moderator' }}</strong>, Anda dapat mengekspor database lengkap dan memulihkannya.
                </template>
                <template v-else>
                  Backup dan pemulihan berlaku untuk <strong>dokumen RKA milik akun Anda</strong>. Akun pengguna, konfigurasi, dan log aktivitas hanya dapat diekspor oleh Admin.
                </template>
              </p>
            </div>
            <button class="bk-close" :disabled="busy" @click="requestClose" title="Tutup" aria-label="Tutup">&times;</button>
          </div>

          <div class="bk-grid">
            <!-- Card 1: Ekspor Full Database -->
            <section class="bk-card">
              <div class="bk-icon bk-icon-export">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
              </div>
              <div class="bk-card-body">
                <h4>Ekspor Full Database (JSON)</h4>
                <p v-if="isPrivileged">
                  Unduh seluruh database aplikasi dalam format JSON lengkap termasuk:
                  seluruh dokumen RKA, riwayat versi SSH, akun pengguna, konfigurasi, dan catatan log aktivitas.
                </p>
                <p v-else>
                  Unduh seluruh database arsip akun Anda dalam format JSON lengkap: seluruh dokumen RKA milik Anda beserta riwayat versinya.
                </p>
                <div class="bk-meta">
                  <span>Format: Standar JSON</span>
                  <span>Keamanan: Terproteksi Token</span>
                </div>
              </div>
              <div class="bk-actions bk-actions-row">
                <button class="bk-btn bk-btn-primary" :disabled="downloading" @click="exportHtml">
                  <svg :class="{ 'bk-spin': downloading }" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>
                  Unduh Format Nilai Prakiraan Dampak (.html)
                </button>
                <button class="bk-btn bk-btn-primary" :disabled="downloading" @click="exportJson">
                  <svg :class="{ 'bk-spin': downloading }" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
                  Unduh Mentahan (.json)
                </button>
              </div>
            </section>

            <!-- Card 2: Pemulihan Database -->
            <section class="bk-card">
              <div class="bk-icon bk-icon-restore">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg>
              </div>
              <div class="bk-card-body">
                <h4>Pemulihan Database (Restore)</h4>
                <p v-if="isPrivileged">
                  Pulihkan data sistem dari berkas cadangan JSON yang telah diunduh sebelumnya.
                  Data yang dipulihkan akan langsung <strong>menggantikan</strong> dan memperbarui data aktif saat ini.
                </p>
                <p v-else>
                  Pulihkan dokumen RKA milik Anda dari berkas cadangan JSON yang telah diunduh sebelumnya.
                  Dokumen dalam berkas akan <strong>digabungkan</strong> ke arsip Anda; dokumen milik akun lain diabaikan.
                </p>
                <div
                  class="bk-drop"
                  :class="{ 'bk-drop-over': restoreDragOver }"
                  @click="restoreInput?.click()"
                  @dragover.prevent="restoreDragOver = true"
                  @dragleave.prevent="restoreDragOver = false"
                  @drop.prevent="onRestoreDrop"
                >
                  <input ref="restoreInput" type="file" accept=".json,application/json" class="bk-hidden" @change="onRestoreSelect" />
                  <div v-if="restoreFile" class="bk-file-picked">
                    <strong>{{ restoreFile.name }}</strong>
                    <span>({{ formatSize(restoreFile.size) }})</span>
                  </div>
                  <span v-else>Pilih atau drag &amp; drop file <code>.json</code> backup di sini</span>
                </div>
              </div>
              <div class="bk-actions">
                <button class="bk-btn bk-btn-warning" :disabled="!restoreFile || restoring" @click="executeRestore">
                  <svg :class="{ 'bk-spin': restoring }" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
                  {{ restoring ? 'Memulihkan...' : 'Mulai Pemulihan Database' }}
                </button>
              </div>
            </section>

            <!-- Card 3: Konversi HTML ke JSON -->
            <section class="bk-card">
              <div class="bk-icon bk-icon-convert">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
              </div>
              <div class="bk-card-body">
                <h4>Konversi HTML ke JSON</h4>
                <p>
                  Unggah satu atau banyak file backup HTML (boleh drag &amp; drop) untuk mengekstrak data dan mengonversinya menjadi format JSON mentah standar.
                  Jika lebih dari satu berkas, hasilnya diunduh sekaligus dalam satu berkas <code>.zip</code>.
                </p>
                <div
                  class="bk-drop"
                  :class="{ 'bk-drop-over': convertDragOver }"
                  @click="convertInput?.click()"
                  @dragover.prevent="convertDragOver = true"
                  @dragleave.prevent="convertDragOver = false"
                  @drop.prevent="onConvertDrop"
                >
                  <input ref="convertInput" type="file" accept=".html,.htm" multiple class="bk-hidden" @change="onConvertSelect" />
                  <div v-if="convertItems.length" class="bk-file-picked">
                    <strong>{{ convertItems.length }} berkas dipilih</strong>
                    <span>({{ formatSize(convertItems.reduce((n, i) => n + i.file.size, 0)) }})</span>
                  </div>
                  <span v-else>Pilih atau drag &amp; drop file <code>.html</code> untuk diekstrak</span>
                </div>
                <ul v-if="convertItems.length" class="bk-list">
                  <li v-for="item in convertItems" :key="item.key" :class="'st-' + item.status">
                    <span class="bk-list-name" :title="item.file.name">{{ item.file.name }}</span>
                    <span class="bk-list-status">{{ item.message || statusLabel(item.status) }}</span>
                    <button v-if="item.status !== 'processing' && !converting" class="bk-list-remove" @click.stop="removeConvertItem(item.key)" title="Hapus dari daftar">&times;</button>
                  </li>
                </ul>
              </div>
              <div class="bk-actions">
                <button class="bk-btn bk-btn-primary" :disabled="pendingConvertCount === 0 || converting" @click="executeConvert">
                  <svg :class="{ 'bk-spin': converting }" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
                  {{ converting ? 'Mengekstrak...' : `Ekstrak JSON${pendingConvertCount > 1 ? ' (' + pendingConvertCount + ' berkas)' : ''}` }}
                </button>
              </div>
            </section>

            <!-- Card 4: Tambah ke Arsip (Gabung) -->
            <section class="bk-card">
              <div class="bk-icon bk-icon-merge">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              </div>
              <div class="bk-card-body">
                <h4>Tambah ke Arsip (Gabung)</h4>
                <p>
                  Unggah berkas backup <code>.html</code> atau <code>.json</code> satu per satu (boleh banyak berkas sekaligus).
                  Dokumen langsung diekstrak dan <strong>ditambahkan</strong> ke arsip. Dokumen yang sudah ada tidak dihapus.
                </p>
                <div
                  class="bk-drop"
                  :class="{ 'bk-drop-over': mergeDragOver }"
                  @click="mergeInput?.click()"
                  @dragover.prevent="mergeDragOver = true"
                  @dragleave.prevent="mergeDragOver = false"
                  @drop.prevent="onMergeDrop"
                >
                  <input ref="mergeInput" type="file" accept=".html,.htm,.json" multiple class="bk-hidden" @change="onMergeSelect" />
                  <div v-if="mergeItems.length" class="bk-file-picked">
                    <strong>{{ mergeItems.length }} berkas dipilih</strong>
                  </div>
                  <span v-else>Pilih atau drag &amp; drop file <code>.html</code> / <code>.json</code></span>
                </div>
                <ul v-if="mergeItems.length" class="bk-list">
                  <li v-for="item in mergeItems" :key="item.key" :class="'st-' + item.status">
                    <span class="bk-list-name" :title="item.file.name">{{ item.file.name }}</span>
                    <span class="bk-list-status">{{ item.message || statusLabel(item.status) }}</span>
                    <button v-if="item.status === 'pending' && !merging" class="bk-list-remove" @click.stop="removeMergeItem(item.key)" title="Hapus dari daftar">&times;</button>
                  </li>
                </ul>
                <label class="bk-check">
                  <input type="checkbox" v-model="mergeOverwrite" :disabled="merging" />
                  <span>Perbarui dokumen jika ID sudah ada (bawaan: dilewati)</span>
                </label>
              </div>
              <div class="bk-actions">
                <button class="bk-btn bk-btn-accent" :disabled="pendingMergeCount === 0 || merging" @click="executeMerge">
                  <svg :class="{ 'bk-spin': merging }" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                  {{ merging ? 'Menambahkan...' : `Tambahkan ke Arsip${pendingMergeCount ? ' (' + pendingMergeCount + ')' : ''}` }}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useAnalysis } from '../composables/useAnalysis';
import { extractBackupFromHtml } from '@/utils/htmlDataExtractor';
import { createZipBlob, downloadBlob } from '@/utils/zipStore';

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

const {
  currentUser,
  showNotification,
  downloadFullBackupHtml,
  downloadFullBackupJson,
  downloadUserBackup,
  downloadUserBackupJson,
  restoreDatabase,
  importBackupMerge
} = useAnalysis();

// Admin/moderator boleh mengekspor & memulihkan database penuh. User biasa hanya
// untuk dokumen RKA miliknya sendiri (dibatasi juga oleh server: export-full ditolak 403
// untuk user, dan restore hanya menggabungkan dokumen milik akun tersebut).
const isPrivileged = computed(() => ['admin', 'moderator'].includes(currentUser.value?.role));

const downloading = ref(false);
const restoring = ref(false);
const converting = ref(false);
const merging = ref(false);
const busy = computed(() => downloading.value || restoring.value || converting.value || merging.value);

function requestClose() {
  if (busy.value) return;
  emit('close');
}

const onKeydown = (e) => { if (e.key === 'Escape' && props.open) requestClose(); };
watch(() => props.open, (isOpen) => {
  if (isOpen) document.addEventListener('keydown', onKeydown);
  else document.removeEventListener('keydown', onKeydown);
}, { immediate: true });
onUnmounted(() => document.removeEventListener('keydown', onKeydown));

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status) {
  return { pending: 'Menunggu', processing: 'Memproses...', done: 'Selesai', error: 'Gagal' }[status] || status;
}

/** Antrean berkas: hindari dobel, tolak ekstensi yang tidak didukung. */
function createFileQueue(acceptRe, rejectText) {
  const items = ref([]); // { key, file, status: pending|processing|done|error, message }
  const pending = computed(() => items.value.filter(i => i.status === 'pending').length);
  function add(fileList) {
    const rejected = [];
    for (const file of Array.from(fileList || [])) {
      if (!acceptRe.test(file.name)) { rejected.push(file.name); continue; }
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (items.value.some(i => i.key === key && i.status !== 'error')) continue;
      items.value = [...items.value.filter(i => i.key !== key), { key, file, status: 'pending', message: '' }];
    }
    if (rejected.length) showNotification('Berkas Diabaikan', `${rejectText}: ${rejected.join(', ')}`, 'warning');
  }
  function remove(key) {
    items.value = items.value.filter(i => i.key !== key);
  }
  return { items, pending, add, remove };
}

// ── Card 1: Ekspor ─────────────────────────────────────────────────────
async function runDownload(fn) {
  if (downloading.value) return;
  downloading.value = true;
  try { await fn(); } finally { downloading.value = false; }
}
const exportHtml = () => runDownload(isPrivileged.value ? downloadFullBackupHtml : downloadUserBackup);
const exportJson = () => runDownload(isPrivileged.value ? downloadFullBackupJson : downloadUserBackupJson);

// ── Card 2: Restore (.json) ────────────────────────────────────────────
const restoreInput = ref(null);
const restoreFile = ref(null);
const restoreDragOver = ref(false);

function pickRestoreFile(file) {
  if (!file) return;
  if (!/\.json$/i.test(file.name)) {
    showNotification('Berkas Tidak Didukung', 'Pemulihan hanya menerima berkas cadangan .json.', 'warning');
    return;
  }
  restoreFile.value = file;
}
const onRestoreSelect = (e) => { pickRestoreFile(e.target.files?.[0]); e.target.value = ''; };
const onRestoreDrop = (e) => { restoreDragOver.value = false; pickRestoreFile(e.dataTransfer?.files?.[0]); };

async function executeRestore() {
  if (!restoreFile.value || restoring.value) return;
  if (isPrivileged.value && !window.confirm('Pemulihan penuh akan MENGGANTIKAN data aktif dengan isi berkas. Lanjutkan?')) return;
  restoring.value = true;
  try {
    const text = await restoreFile.value.text();
    const ok = await restoreDatabase(text); // notifikasi sukses/gagal ditampilkan oleh restoreDatabase
    if (ok) restoreFile.value = null;
  } catch (err) {
    showNotification('Gagal Memulihkan', err.message, 'danger');
  } finally {
    restoring.value = false;
  }
}

// ── Card 3: Konversi HTML → JSON (banyak berkas → satu .zip) ───────────
const convertInput = ref(null);
const convertDragOver = ref(false);
const { items: convertItems, pending: pendingConvertCount, add: addConvertFiles, remove: removeConvertItem } =
  createFileQueue(/\.html?$/i, 'Hanya berkas .html yang didukung');
const onConvertSelect = (e) => { addConvertFiles(e.target.files); e.target.value = ''; };
const onConvertDrop = (e) => { convertDragOver.value = false; addConvertFiles(e.dataTransfer?.files); };

async function executeConvert() {
  if (converting.value || pendingConvertCount.value === 0) return;
  converting.value = true;
  const results = []; // { name, json }
  const warnings = [];
  let totalDocs = 0;
  let failed = 0;

  try {
    // Satu per satu; kegagalan satu berkas tidak menghentikan berkas lain.
    for (const item of convertItems.value.filter(i => i.status === 'pending')) {
      item.status = 'processing';
      item.message = '';
      await new Promise(r => setTimeout(r, 0)); // beri kesempatan UI menampilkan status
      try {
        const text = await item.file.text();
        const { payload, warnings: w, totalDocuments } = extractBackupFromHtml(text, { fileName: item.file.name });
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
      downloadBlob(new Blob([results[0].json], { type: 'application/json;charset=utf-8' }), results[0].name);
    } else if (results.length > 1) {
      const used = new Set();
      const files = results.map(r => {
        let name = r.name;
        for (let n = 2; used.has(name.toLowerCase()); n++) name = r.name.replace(/\.json$/i, `-${n}.json`);
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
    if (warnings.length) showNotification('Catatan Ekstraksi', warnings.join(' '), 'warning');

    // Bersihkan yang sukses; yang gagal tetap tampil agar bisa dicek
    convertItems.value = convertItems.value.filter(i => i.status === 'error');
  } catch (err) {
    showNotification('Gagal Ekstrak JSON', err.message, 'danger');
  } finally {
    converting.value = false;
  }
}

// ── Card 4: Tambah ke Arsip (gabung, tanpa menghapus) ──────────────────
const mergeInput = ref(null);
const mergeDragOver = ref(false);
const mergeOverwrite = ref(false);
const { items: mergeItems, pending: pendingMergeCount, add: addMergeFiles, remove: removeMergeItem } =
  createFileQueue(/\.(html?|json)$/i, 'Hanya .html dan .json yang didukung');
const onMergeSelect = (e) => { addMergeFiles(e.target.files); e.target.value = ''; };
const onMergeDrop = (e) => { mergeDragOver.value = false; addMergeFiles(e.dataTransfer?.files); };

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
  if (merging.value || pendingMergeCount.value === 0) return;
  merging.value = true;
  const total = { added: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    for (const item of mergeItems.value.filter(i => i.status === 'pending')) {
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
    mergeItems.value = mergeItems.value.filter(i => i.status === 'error');
  } catch (err) {
    showNotification('Gagal Menambahkan ke Arsip', err.message, 'danger');
  } finally {
    merging.value = false;
  }
}
</script>

<style scoped>
.bk-box {
  background: var(--bg-primary, #fff);
  color: var(--text-primary);
  border-radius: 22px;
  padding: 26px 28px 28px;
  width: 100%;
  max-width: 1000px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.40);
  border: 1px solid rgba(0, 0, 0, 0.08);
  text-align: left;
  isolation: isolate;
}
.bk-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.bk-title { margin: 0; font-family: var(--font-heading); font-size: 1.25rem; }
.bk-subtitle { margin: 6px 0 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }
.bk-close { border: none; background: transparent; font-size: 1.7rem; line-height: 1; cursor: pointer; color: var(--text-muted); padding: 0 4px; }
.bk-close:hover:not(:disabled) { color: var(--text-primary); }
.bk-close:disabled { opacity: 0.4; cursor: default; }

.bk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 820px) { .bk-grid { grid-template-columns: minmax(0, 1fr); } }

.bk-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}
.bk-card-body { flex: 1; }
.bk-card h4 { margin: 0 0 6px; font-size: 0.98rem; font-family: var(--font-heading); }
.bk-card p { margin: 0 0 10px; font-size: 0.8rem; line-height: 1.55; color: var(--text-secondary); }
.bk-card code { font-size: 0.78rem; background: rgba(0, 0, 0, 0.06); padding: 1px 5px; border-radius: 4px; }

.bk-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.bk-icon-export { background: rgba(var(--primary-rgb), 0.12); color: var(--primary-color); }
.bk-icon-restore { background: rgba(var(--accent-rgb), 0.14); color: var(--accent-color); }
.bk-icon-convert { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.bk-icon-merge { background: rgba(245, 158, 11, 0.14); color: #f59e0b; }

.bk-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.74rem; color: var(--text-muted); }

.bk-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 74px;
  padding: 12px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
  border: 1.5px dashed var(--border-color-strong);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.bk-drop:hover, .bk-drop-over { background: rgba(var(--primary-rgb), 0.07); border-color: var(--primary-color); }
.bk-hidden { display: none; }
.bk-file-picked { display: flex; flex-direction: column; gap: 2px; color: var(--text-primary); word-break: break-all; }
.bk-file-picked span { color: var(--text-secondary); font-size: 0.74rem; }

.bk-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; }
.bk-list li { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; padding: 6px 10px; border-radius: 8px; background: rgba(0, 0, 0, 0.04); border: 1px solid var(--border-color); }
.bk-list-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bk-list-status { color: var(--text-muted); text-align: right; }
.st-done .bk-list-status { color: #10b981; }
.st-error .bk-list-status { color: #ef4444; }
.st-processing .bk-list-status { color: #f59e0b; }
.bk-list-remove { border: none; background: transparent; cursor: pointer; font-size: 1rem; line-height: 1; color: var(--text-muted); }
.bk-list-remove:hover { color: #ef4444; }

.bk-check { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.76rem; color: var(--text-secondary); cursor: pointer; }

.bk-actions { display: flex; }
.bk-actions-row { gap: 8px; flex-wrap: wrap; }
.bk-actions-row .bk-btn { flex: 1; min-width: 150px; }
.bk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: filter 0.15s, opacity 0.15s;
}
.bk-btn:hover:not(:disabled) { filter: brightness(1.08); }
.bk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.bk-btn-primary { background: var(--primary-color); }
.bk-btn-warning { background: var(--accent-color); }
.bk-btn-accent { background: #f59e0b; }
.bk-spin { animation: bk-spin 1s linear infinite; }
@keyframes bk-spin { to { transform: rotate(360deg); } }
</style>
