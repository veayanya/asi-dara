import { reactive, toRefs, watch, nextTick, computed, ref } from 'vue';
import html2pdf from 'html2pdf.js';
import { apiFetch } from '@/utils/api';
import { useRealtime } from './useRealtime';
import { downloadAnalysisHtmlReport } from '@/utils/htmlReportGenerator';
import { downloadHtmlBackup } from '@/utils/htmlBackupGenerator';


// Batas halaman PDF yang dibaca. Dokumen RKA dengan banyak Kegiatan/Sub Kegiatan (hingga 100)
// bisa sangat panjang, jadi batas lama 25 halaman dinaikkan agar seluruh isi terbaca.
const MAX_PDF_PAGES = 300;

const defaultRkis = [];
const realtime = useRealtime();

// Sanitizer untuk Nama OPD / Satuan Kerja agar tidak memuat raw PDF header dump
export function cleanOpdName(raw) {
  if (!raw || typeof raw !== 'string') return 'Perangkat Daerah';
  let str = raw.trim();

  // Jika sudah ringkas tanpa tag PDF header
  if (str.length <= 60 && !str.includes('\n') && !str.includes('Formulir') && !str.includes('Urusan Pemerintahan') && !str.includes('RINCIAN BELANJA') && !str.includes('Organisasi :')) {
    return str;
  }

  // 1. Ambil nama sub-unit dalam kurung siku, misal: [4-1.0-0.0-0.01.0009. BAGIAN KESRA]
  const bracketMatch = str.match(/\[[\d.-]+\s*([^\]\n\r]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    let cleanedSub = bracketMatch[1].replace(/Program\s*:.*/is, '').trim();
    if (cleanedSub.length > 2) {
      const orgPrefixMatch = str.match(/Organisasi\s*:\s*[\d.-]*\s*([^[\n\r]+)/i);
      if (orgPrefixMatch && orgPrefixMatch[1]) {
        let orgPrefix = orgPrefixMatch[1].replace(/Program\s*:.*/is, '').replace(/\[.*$/g, '').trim();
        orgPrefix = orgPrefix.replace(/^[\d.-]+\s*/, '').trim();
        if (orgPrefix && !cleanedSub.toUpperCase().includes(orgPrefix.toUpperCase()) && !orgPrefix.toUpperCase().includes(cleanedSub.toUpperCase())) {
          return `${orgPrefix} - ${cleanedSub}`;
        }
      }
      return cleanedSub;
    }
  }

  // 2. Ambil dari "Organisasi :"
  const orgMatch = str.match(/Organisasi\s*:\s*([\d.-]+)?\s*([^[\n\r]+)/i);
  if (orgMatch && orgMatch[2]) {
    let cleanedOrg = orgMatch[2].replace(/Program\s*:.*/is, '').replace(/Kegiatan\s*:.*/is, '').replace(/\[.*$/g, '').trim();
    cleanedOrg = cleanedOrg.replace(/^[\d.-]+\s*/, '').trim();
    if (cleanedOrg.length > 3 && cleanedOrg.length < 80) return cleanedOrg;
  }

  // 3. Ambil dari "Bidang Urusan :"
  const bidangMatch = str.match(/Bidang\s*Urusan\s*:\s*([\d.]+)?\s*([^[\n\r]+)/i);
  if (bidangMatch && bidangMatch[2]) {
    let cleanedBidang = bidangMatch[2].replace(/Organisasi\s*:.*/is, '').trim();
    cleanedBidang = cleanedBidang.replace(/^[\d.-]+\s*/, '').trim();
    if (cleanedBidang.length > 3 && cleanedBidang.length < 80) return cleanedBidang;
  }

  // 4. Bersihkan kata kunci umum dokumen RKA
  let cleaned = str
    .replace(/PERANGKAT\s*DAERAH/gi, '')
    .replace(/Formulir\s*RKA-RINCIAN\s*BELANJA\s*SKPD/gi, '')
    .replace(/PEMERINTAH\s*KABUPATEN\s*CIREBON/gi, '')
    .replace(/TAHUN\s*ANGGARAN\s*\d{4}/gi, '')
    .replace(/Urusan\s*Pemerintahan\s*:\s*[\d.]+\s*[^:\n\r]+/gi, '')
    .replace(/Program\s*:.*$/gis, '')
    .replace(/Kegiatan\s*:.*$/gis, '')
    .replace(/Sub\s*Kegiatan\s*:.*$/gis, '')
    .replace(/Jumlah\s*Tahun\s*\d{4}\s*:.*$/gis, '')
    .replace(/Lokasi\s*Sub\s*Kegiatan\s*:.*$/gis, '')
    .trim();

  cleaned = cleaned.replace(/^[\d.-]+\s*/, '').trim();

  if (cleaned.length > 80) {
    cleaned = cleaned.substring(0, 80).trim() + '...';
  }
  return cleaned || 'Sekretariat Daerah';
}

// Auth state — single source of truth untuk sesi user
const isLoggedIn = ref(false);
const currentUser = ref(null);

// ── Kontrol visibilitas menu sidebar (diatur oleh admin, berlaku untuk semua user) ──
const MENU_KEYS = ['dashboard', 'main-dashboard', 'analyzer', 'agentic-ai', 'history', 'petunjuk', 'report', 'faq'];

function defaultMenuConfig() {
  return MENU_KEYS.reduce((acc, key) => { acc[key] = true; return acc; }, {});
}

const menuConfig = ref({
  ...defaultMenuConfig(),
  ...(JSON.parse(localStorage.getItem('bapperida_menu_config') || 'null') || {})
});

watch(menuConfig, (val) => {
  localStorage.setItem('bapperida_menu_config', JSON.stringify(val));
}, { deep: true });

function isMenuEnabled(tabId) {
  return menuConfig.value[tabId] !== false;
}

async function loadMenuConfig() {
  try {
    const res = await apiFetch('/api/admin/menu-config');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        menuConfig.value = { ...defaultMenuConfig(), ...data };
      }
    }
  } catch { /* pakai config lokal/cache kalau backend belum siap */ }
}

async function saveMenuConfig(newConfig) {
  menuConfig.value = { ...menuConfig.value, ...newConfig };
  try {
    const res = await apiFetch('/api/admin/menu-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuConfig.value)
    });
    if (!res.ok) throw new Error('server-not-ready');
    showNotification('Pengaturan Menu Disimpan', 'Perubahan visibilitas menu berhasil diterapkan untuk semua pengguna.', 'success');
    return true;
  } catch (err) {
    // Endpoint backend /api/admin/menu-config belum tersedia/gagal diakses.
    // Perubahan tetap diterapkan & disimpan secara lokal (localStorage) di browser ini,
    // tapi BELUM tersinkron ke pengguna lain sampai backend-nya siap.
    showNotification(
      'Tersimpan Lokal Saja',
      'Pengaturan menu diterapkan di browser ini, tapi backend belum bisa menyimpannya untuk semua pengguna. Hubungi developer untuk mengaktifkan endpoint /api/admin/menu-config.',
      'warning'
    );
    return false;
  }
}


// ── Sinkronisasi Arsip (tanpa perlu refresh halaman) ─────────────────────
// Data arsip diperbarui lewat 3 jalur: (1) event realtime dari server,
// (2) muat ulang otomatis saat tab kembali aktif / internet pulih / realtime
// terputus, dan (3) tombol "Muat Ulang" manual. Status-nya ditampilkan di
// halaman Arsip Dokumen RKA supaya terlihat data sudah sesuai dengan server.
const arsipLastSyncAt = ref(null);   // ISO waktu terakhir data cocok dengan server
const arsipSyncing = ref(false);
const arsipSyncError = ref('');
let arsipRefreshPromise = null;

function markArsipSynced() {
  arsipLastSyncAt.value = new Date().toISOString();
  arsipSyncError.value = '';
}

/** Ambil ulang daftar arsip dari server. Permintaan yang bersamaan digabung jadi satu. */
async function refreshArsip() {
  if (!isLoggedIn.value || !currentUser.value) return false;
  if (arsipRefreshPromise) return arsipRefreshPromise;

  arsipSyncing.value = true;
  arsipRefreshPromise = (async () => {
    try {
      const res = await apiFetch('/api/v1/rkis', { credentials: 'include' });
      if (!res.ok) throw new Error(`Server menjawab ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Format data dari server tidak valid');

      state.rkis = data;
      if (data.length > 0) cacheRkisLocally(data);
      // Segarkan dokumen yang sedang dibuka; dokumen yang belum tersimpan di server dibiarkan.
      if (state.activeAnalysis?.id) {
        const fresh = data.find(r => r.id === state.activeAnalysis.id);
        if (fresh) state.activeAnalysis = fresh;
      }

      markArsipSynced();
      if (res.headers.get('X-Data-Source') === 'cadangan-lokal') {
        arsipSyncError.value = 'Server sedang memakai data cadangan lokal';
      }
      return true;
    } catch (err) {
      arsipSyncError.value = err?.message || 'Gagal menyinkronkan arsip';
      return false;
    } finally {
      arsipSyncing.value = false;
      arsipRefreshPromise = null;
    }
  })();
  return arsipRefreshPromise;
}

// Inisialisasi listener real-time sekali saja
let realtimeListenersSetup = false;
function setupRealtimeListeners() {
  if (realtimeListenersSetup) return;
  realtimeListenersSetup = true;

  realtime.on('RKA_CREATED', (newRka) => {
    if (!newRka || !newRka.id) return;
    markArsipSynced();
    const isOwner = !newRka.userId || (currentUser.value && newRka.userId === currentUser.value.id);
    const isAdminOrMod = currentUser.value && (currentUser.value.role === 'admin' || currentUser.value.role === 'moderator');

    if (isOwner || isAdminOrMod) {
      const existIdx = state.rkis.findIndex(r => r.id === newRka.id);
      if (existIdx === -1) {
        state.rkis.unshift(newRka);
        if (!isOwner && isAdminOrMod) {
          showNotification(
            'Dokumen RKA Masuk (Realtime)',
            `Dokumen "${newRka.namaDokumen || newRka.program || 'RKA'}" baru saja diunggah oleh ${newRka.createdBy || 'User'} (${newRka.opd || '-'}).`,
            'info'
          );
        }
      }
    }
  });

  realtime.on('RKA_UPDATED', (updatedRka) => {
    if (!updatedRka || !updatedRka.id) return;
    markArsipSynced();
    const idx = state.rkis.findIndex(r => r.id === updatedRka.id);
    if (idx !== -1) {
      state.rkis[idx] = { ...state.rkis[idx], ...updatedRka };
    }
    if (state.activeAnalysis && state.activeAnalysis.id === updatedRka.id) {
      state.activeAnalysis = { ...state.activeAnalysis, ...updatedRka };
    }
  });

  realtime.on('RKA_DELETED', ({ id }) => {
    if (!id) return;
    markArsipSynced();
    const idx = state.rkis.findIndex(r => r.id === id);
    if (idx !== -1) {
      state.rkis.splice(idx, 1);
    }
    if (state.activeAnalysis && state.activeAnalysis.id === id) {
      state.activeAnalysis = null;
    }
  });

  // SSE bisa terputus/reconnect dan selama jeda ada event yang terlewat.
  // Setelah koneksi pulih, ambil ulang snapshot dari Neon agar browser kembali sinkron.
  realtime.on('REALTIME_RECONNECTED', async () => {
    await refreshArsip();
  });

  // Server memberi tahu ada perubahan massal (gabung/restore backup) → muat ulang arsip.
  realtime.on('ARSIP_SYNC', () => {
    refreshArsip();
  });

  // Pemicu otomatis lain (dipasang sekali)
  if (typeof window !== 'undefined') {
    const syncIfStale = (maxAgeMs) => {
      if (!isLoggedIn.value || document.visibilityState !== 'visible') return;
      const last = arsipLastSyncAt.value ? Date.parse(arsipLastSyncAt.value) : 0;
      if (Date.now() - last >= maxAgeMs) refreshArsip();
    };
    // Tab kembali aktif: event realtime bisa terlewat saat tab di latar belakang.
    document.addEventListener('visibilitychange', () => syncIfStale(15000));
    window.addEventListener('online', () => syncIfStale(0));
    // Jaring pengaman: bila koneksi realtime terputus, muat ulang berkala.
    setInterval(() => {
      if (!realtime.isConnected.value) syncIfStale(30000);
    }, 15000);
  }
}

// Cek sesi yang sudah ada (cookie httpOnly atau Bearer token) saat pertama load
async function checkSession() {
  try {
    const res = await apiFetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      isLoggedIn.value = true;
      currentUser.value = data.user;

      // Muat konfigurasi visibilitas menu (berlaku untuk semua user)
      await loadMenuConfig();

      // Setup dan connect real-time SSE stream
      setupRealtimeListeners();
      realtime.connect();

      // Auto-redirect ke tab sesuai role jika admin/moderator
      if ((data.user.role === 'admin' || data.user.role === 'moderator') && state.currentTab === 'main-dashboard') {
        state.currentTab = 'admin-dashboard';
      }
      // Load data setelah session confirmed
      const rkis = await fetchRkis();
      state.rkis = rkis;
      if (rkis && rkis.length > 0 && !state.activeAnalysis) {
        state.activeAnalysis = rkis[0];
      }
    } else {
      isLoggedIn.value = false;
      currentUser.value = null;
      localStorage.removeItem('auth_token');
      realtime.disconnect();
    }
  } catch {
    isLoggedIn.value = false;
    currentUser.value = null;
    realtime.disconnect();
  }
}

// Dipanggil setelah login berhasil (LoginPage), supaya SSE realtime langsung
// terkoneksi tanpa perlu refresh halaman (sebelumnya hanya jalan lewat checkSession()).
function connectRealtimeAfterLogin() {
  setupRealtimeListeners();
  realtime.connect();
}

// Logout — hapus cookie sesi di server dan token lokal
async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { }
  localStorage.removeItem('auth_token');
  realtime.disconnect();
  isLoggedIn.value = false;
  currentUser.value = null;
  state.rkis = [];
  state.activeAnalysis = null;
  state.currentTab = 'main-dashboard';
}

async function downloadFullBackupHtml() {
  try {
    const res = await apiFetch('/api/v1/backup/export-full');
    if (!res.ok) throw new Error('Gagal mengunduh backup sistem.');
    const data = await res.json();
    downloadHtmlBackup(data, true, currentUser.value?.username || 'admin');
    showNotification("Backup Berhasil", "Berkas Full Backup Database (.html) berhasil diunduh.", "success");
  } catch (err) {
    showNotification("Gagal Mengunduh Backup", err.message, "danger");
  }
}

async function downloadFullBackupJson() {
  try {
    const res = await apiFetch('/api/v1/backup/export-full');
    if (!res.ok) throw new Error('Gagal mengunduh backup sistem.');
    const data = await res.json();

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `asidara_backup_full_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showNotification("Backup Berhasil", "Berkas JSON mentah berhasil diunduh.", "success");
  } catch (err) {
    showNotification("Gagal Mengunduh Backup", err.message, "danger");
  }
}

async function downloadUserBackup() {
  try {
    const res = await apiFetch('/api/v1/backup/export-user');
    if (!res.ok) throw new Error('Gagal mengunduh data RKA.');
    const data = await res.json();
    const rkis = data.rkis || data.data?.main_db?.rkis || [];

    if (rkis.length === 0) {
      showNotification("Tidak Ada Data", "Tidak ada dokumen RKA untuk diunduh.", "warning");
      return;
    }

    const username = currentUser.value?.username || 'user';

    // Batch: unduh SATU berkas .html per dokumen (bukan 1 berkas ringkasan
    // gabungan). Setiap berkas tetap mengandung data JSON dokumen tersebut
    // sendiri sehingga masing-masing tetap bisa dipulihkan lewat
    // "Upload Backup .html".
    for (let i = 0; i < rkis.length; i++) {
      const rki = rkis[i];
      const singleDocPayload = {
        ...data,
        totalDocuments: 1,
        rkis: [rki],
        data: {
          main_db: {
            rkis: [rki],
            ssh_databases: []
          }
        }
      };
      downloadHtmlBackup(singleDocPayload, false, `${username}_${i + 1}`);
      // Jeda singkat antar unduhan agar tidak diblokir browser sebagai popup/multi-download beruntun
      if (i < rkis.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    showNotification("Backup Berhasil", `${rkis.length} berkas cadangan .html (satu per dokumen) berhasil diunduh.`, "success");
  } catch (err) {
    showNotification("Gagal Mengunduh Data", err.message, "danger");
  }
}

/**
 * Ekspor SATU berkas .json berisi seluruh dokumen RKA milik akun yang sedang login
 * (versi aman untuk user biasa; server menyaring dokumen milik akun lain).
 * Formatnya sama dengan backup lain sehingga bisa dipulihkan / digabung kembali.
 */
async function downloadUserBackupJson() {
  try {
    const res = await apiFetch('/api/v1/backup/export-user');
    if (!res.ok) throw new Error('Gagal mengunduh data RKA.');
    const data = await res.json();
    const total = (data.rkis || data.data?.main_db?.rkis || []).length;

    if (total === 0) {
      showNotification("Tidak Ada Data", "Tidak ada dokumen RKA untuk diunduh.", "warning");
      return;
    }

    const username = currentUser.value?.username || 'user';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asidara_backup_${username}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showNotification("Backup Berhasil", `${total} dokumen RKA milik akun Anda berhasil diunduh dalam satu berkas JSON.`, "success");
  } catch (err) {
    showNotification("Gagal Mengunduh Data", err.message, "danger");
  }
}

/**
 * Backup OTOMATIS — dipanggil diam-diam setiap kali sebuah dokumen RKA
 * selesai diunggah (lihat pemanggilannya di handleRkaFiles), tanpa perlu
 * pengguna menekan tombol backup manual. Mengunduh SATU berkas .json berisi
 * seluruh dokumen RKA milik akun yang sedang login, dengan nama berkas
 * "asidara_backup_...". Kegagalan tidak ditampilkan sebagai error ke
 * pengguna (proses unggah utama sudah dianggap berhasil) — cukup dicatat
 * di console agar tidak mengganggu alur unggah.
 */
async function autoBackupOnUpload() {
  if (currentUser.value?.role !== 'admin') return; // pengaman: hanya admin
  try {
    const res = await apiFetch('/api/v1/backup/export-user');
    if (!res.ok) return;
    const data = await res.json();
    const total = (data.rkis || data.data?.main_db?.rkis || []).length;
    if (total === 0) return;

    const username = currentUser.value?.username || 'user';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asidara_backup_${username}_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn('[Backup Otomatis] Gagal membuat backup otomatis setelah unggah:', err);
  }
}

/**
 * Ambil riwayat versi sebuah dokumen RKA (backup otomatis dari setiap
 * upload/edit) — dipakai untuk menampilkan "versi terdahulu vs sekarang"
 * di panel Admin/User.
 */
async function fetchRkaHistory(rkaId) {
  try {
    const res = await apiFetch(`/api/v1/rkis/${encodeURIComponent(rkaId)}/history`, { credentials: 'include' });
    if (!res.ok) throw new Error('Gagal mengambil riwayat versi dokumen.');
    return await res.json();
  } catch (err) {
    showNotification('Gagal Mengambil Riwayat', err.message, 'danger');
    return { id: rkaId, versions: [] };
  }
}

/** Pulihkan dokumen ke salah satu versi backup sebelumnya (indeks dari fetchRkaHistory). */
async function restoreRkaVersion(rkaId, versionIndex) {
  try {
    const res = await apiFetch(`/api/v1/rkis/${encodeURIComponent(rkaId)}/history/${versionIndex}/restore`, {
      method: 'POST',
      credentials: 'include'
    });
    const result = await res.json();
    if (!res.ok || result.error) throw new Error(result.error || 'Gagal memulihkan versi dokumen.');
    await refreshArsip();
    showNotification('Versi Dipulihkan', 'Dokumen berhasil dipulihkan ke versi sebelumnya.', 'success');
    return result;
  } catch (err) {
    showNotification('Gagal Memulihkan Versi', err.message, 'danger');
    return null;
  }
}

/** Daftar dokumen yang sudah dihapus (satuan/massal) tapi belum hangus — bisa dipulihkan. */
async function fetchTrash() {
  try {
    const res = await apiFetch('/api/v1/trash', { credentials: 'include' });
    if (!res.ok) throw new Error('Gagal mengambil data sampah.');
    return await res.json();
  } catch (err) {
    showNotification('Gagal Mengambil Sampah', err.message, 'danger');
    return [];
  }
}

/** Pulihkan dokumen dari sampah (misal tak sengaja terhapus) kembali ke arsip aktif. */
async function restoreFromTrash(rkaId) {
  try {
    const res = await apiFetch(`/api/v1/trash/${encodeURIComponent(rkaId)}/restore`, {
      method: 'POST',
      credentials: 'include'
    });
    const result = await res.json();
    if (!res.ok || result.error) throw new Error(result.error || 'Gagal memulihkan dokumen dari sampah.');
    await refreshArsip();
    showNotification('Dokumen Dipulihkan', 'Dokumen berhasil dipulihkan dari sampah ke arsip.', 'success');
    return result;
  } catch (err) {
    showNotification('Gagal Memulihkan', err.message, 'danger');
    return null;
  }
}

/**
 * Pulihkan banyak dokumen dari sampah sekaligus (terpilih / semua).
 * Memakai endpoint massal; bila backend belum memilikinya (404/405) otomatis
 * jatuh ke pemulihan satu per satu. Mengembalikan { restored, failed }.
 */
async function restoreTrashBulk(ids) {
  const uniq = [...new Set((ids || []).map(String))];
  if (uniq.length === 0) return { restored: [], failed: [] };

  let restored = [];
  let failed = [];
  let renamedCount = 0;

  try {
    const res = await apiFetch('/api/v1/trash/bulk-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: uniq })
    });

    if (res.status === 404 || res.status === 405) {
      // Backend lama tanpa endpoint massal → pulihkan satu per satu.
      for (const id of uniq) {
        const r = await apiFetch(`/api/v1/trash/${encodeURIComponent(id)}/restore`, { method: 'POST', credentials: 'include' });
        if (r.ok) restored.push(id);
        else if (r.status !== 404) failed.push(id); // 404 = sudah tidak ada di sampah
      }
    } else {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server menjawab ${res.status}`);
      restored = data.restored || [];
      failed = data.forbidden || [];
      renamedCount = (data.renamed || []).length;
    }
  } catch (err) {
    console.error(err);
    showNotification('Gagal Memulihkan', err.message || 'Tidak dapat menghubungi server.', 'danger');
    return { restored: [], failed: uniq };
  }

  if (restored.length > 0) await refreshArsip();

  if (restored.length > 0 && failed.length === 0) {
    const note = renamedCount > 0 ? ` ${renamedCount} dokumen diberi ID baru karena ID lamanya sudah dipakai dokumen lain.` : '';
    showNotification('Dokumen Dipulihkan', `${restored.length} dokumen berhasil dikembalikan dari sampah ke arsip.${note}`, 'success');
  } else if (restored.length > 0) {
    showNotification('Sebagian Dokumen Dipulihkan', `${restored.length} dokumen dikembalikan, ${failed.length} gagal (tidak ada izin atau kesalahan server).`, 'warning');
  } else if (failed.length > 0) {
    showNotification('Gagal Memulihkan', `${failed.length} dokumen gagal dikembalikan (tidak ada izin atau kesalahan server).`, 'danger');
  } else {
    showNotification('Tidak Ada yang Dipulihkan', 'Dokumen sudah tidak ada di sampah.', 'warning');
  }
  return { restored, failed };
}

/** Hapus permanen dari sampah (hanya Admin — dipanggil server-side juga divalidasi). */
async function purgeTrashItem(rkaId) {
  try {
    const res = await apiFetch(`/api/v1/trash/${encodeURIComponent(rkaId)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Gagal menghapus permanen dari sampah.');
    showNotification('Dihapus Permanen', 'Dokumen dihapus permanen dari sampah.', 'success');
    return true;
  } catch (err) {
    showNotification('Gagal Menghapus', err.message, 'danger');
    return false;
  }
}

async function restoreDatabase(payload) {
  try {
    let jsonPayload = payload;
    if (typeof payload === 'string') {
      const text = payload.trim();
      if (text.includes('id="raw-backup-data"') || text.includes("id='raw-backup-data'")) {
        const match = text.match(/<script[^>]*id=["']raw-backup-data["'][^>]*>([\s\S]*?)<\/script>/i);
        if (match && match[1]) {
          jsonPayload = JSON.parse(match[1].trim());
        }
      } else {
        jsonPayload = JSON.parse(text);
      }
    }
    const res = await apiFetch('/api/v1/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonPayload),
      timeoutMs: 120000 // berkas backup besar + server gratis yang lambat bangun: 30 dtk bawaan terlalu singkat
    });
    // Balasan bukan JSON (mis. error dari proxy) tetap menampilkan kode HTTP-nya, bukan "Unexpected token <".
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.error) throw new Error(result.error || `Server menjawab ${res.status}.`);

    // Refresh RKA data
    await refreshArsip();
    showNotification("Pemulihan Berhasil", result.message || "Database berhasil dipulihkan.", "success");
    return true;
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'Server tidak merespons (waktu habis). Coba lagi beberapa saat lagi.' : err.message;
    showNotification("Gagal Memulihkan Database", msg, "danger");
    return false;
  }
}

/**
 * Tambahkan dokumen RKA dari satu berkas backup ke arsip TANPA menghapus
 * dokumen yang sudah ada (berbeda dengan restoreDatabase yang menimpa).
 * Mengembalikan { added, updated, skipped, ... } atau melempar Error.
 */
async function importBackupMerge(rkis, { overwrite = false, sourceName = '' } = {}) {
  const res = await apiFetch('/api/v1/backup/import-merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rkis, overwrite, sourceName })
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || result.error) throw new Error(result.error || 'Gagal menambahkan dokumen ke arsip.');
  if (result.added || result.updated) {
    await refreshArsip();
  }
  return result;
}

// Instead of localStorage, we load from backend. Sebagai jaring pengaman
// tambahan di sisi browser: setiap data yang berhasil dimuat dari server
// disimpan ke sessionStorage. Jika suatu saat server benar-benar tidak bisa
// dijangkau sama sekali (bukan sekadar kuota Neon — backend juga sudah
// punya cadangannya sendiri), tab ini masih bisa menampilkan data terakhir
// yang pernah berhasil dimuat, alih-alih layar kosong.
const RKIS_CACHE_KEY = 'sintra_rkis_cache_v1';

function cacheRkisLocally(data) {
  try {
    sessionStorage.setItem(RKIS_CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data }));
  } catch {}
}

function readLocalRkisCache() {
  try {
    const raw = sessionStorage.getItem(RKIS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.data) ? parsed : null;
  } catch {
    return null;
  }
}

async function fetchRkis() {
  try {
    const res = await apiFetch('/api/v1/rkis', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();

      // Backend memberi tahu lewat header bila data ini berasal dari
      // cadangan lokal server (mis. kuota database sedang habis).
      if (res.headers.get('X-Data-Source') === 'cadangan-lokal') {
        showNotification(
          'Menampilkan Data Cadangan',
          'Database utama sedang tidak dapat diakses (kemungkinan kuota terlampaui). Data yang ditampilkan adalah cadangan terakhir yang tersimpan; perubahan baru mungkin tidak dapat disimpan sampai database pulih.',
          'warning'
        );
      }

      if (data && data.length > 0) {
        cacheRkisLocally(data);
        return data;
      }
      // Server merespons OK tapi datanya kosong — tetap simpan status "berhasil
      // memuat" tanpa menimpa cache lama, supaya cache lama tidak terhapus sia-sia.
      return data && data.length === 0 ? data : defaultRkis;
    }

    // Respons gagal (mis. 500/503 karena database & cadangan server sama-sama
    // tidak tersedia) → coba cadangan lokal di browser ini sebagai upaya terakhir.
    let serverMessage = '';
    try { serverMessage = (await res.json())?.error || ''; } catch {}
    const localCache = readLocalRkisCache();
    if (localCache) {
      showNotification(
        'Menampilkan Data Cadangan (Lokal)',
        `Server tidak dapat dihubungi${serverMessage ? `: ${serverMessage}` : '.'} Menampilkan data terakhir yang pernah dimuat di perangkat ini (${new Date(localCache.savedAt).toLocaleString('id-ID')}).`,
        'warning'
      );
      return localCache.data;
    }
  } catch (error) {
    console.error("Gagal mengambil data dari server:", error);
    const localCache = readLocalRkisCache();
    if (localCache) {
      showNotification(
        'Menampilkan Data Cadangan (Lokal)',
        `Tidak dapat terhubung ke server. Menampilkan data terakhir yang pernah dimuat di perangkat ini (${new Date(localCache.savedAt).toLocaleString('id-ID')}).`,
        'warning'
      );
      return localCache.data;
    }
  }
  return defaultRkis;
}

const state = reactive({
  currentTab: 'main-dashboard',
  currentRole: 'asn',

  // Dashboard Analytics
  dashboardStats: computed(() => {
    const rkis = state.rkis || [];
    const approved = rkis.filter(r => r.status === 'Approved');

    const totalPagu = approved.reduce((sum, r) => sum + (r.pagu || 0), 0);
    const totalManfaat = approved.reduce((sum, r) => sum + (r.outcome || 0), 0);
    const rataRataSroi = approved.length ? (approved.reduce((sum, r) => sum + (r.sroi || 0), 0) / approved.length) : 0;

    // Group by OPD for Chart
    const opdMap = {};
    approved.forEach(r => {
      const opd = r.opd || 'Tidak Diketahui';
      if (!opdMap[opd]) {
        opdMap[opd] = { count: 0, sroiSum: 0 };
      }
      opdMap[opd].count++;
      opdMap[opd].sroiSum += (r.sroi || 0);
    });

    const opdLabels = Object.keys(opdMap);
    const opdSroiData = opdLabels.map(opd => (opdMap[opd].sroiSum / opdMap[opd].count).toFixed(2));

    return {
      totalDokumen: rkis.length,
      totalDokumenDisahkan: approved.length,
      totalPagu,
      totalManfaat,
      rataRataSroi: rataRataSroi.toFixed(2),
      opdChartData: {
        labels: opdLabels,
        datasets: [{
          label: 'Rata-rata SROI',
          data: opdSroiData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      }
    };
  }),

  engineId: localStorage.getItem('bapperida_engine') || '9f1c72e8',
  theme: localStorage.getItem('bapperida_theme') || 'light',

  // Core Rules Parameter
  rules: JSON.parse(localStorage.getItem('bapperida_rules')) || [
    { id: 'rule-sroi-min', name: 'Ambang Batas Rasio Nilai Prakiraan Dampak Minimal', desc: 'Nilai rasio manfaat sosial-ekonomi (Rasio Nilai Prakiraan Dampak) ≥ 1.0 dinyatakan Layak (Hijau), sedangkan 0.6 – 0.99 diberikan Keringanan/Moderat (Kuning).', active: true },
    { id: 'rule-ssh-cirebon', name: 'Validasi SSH Kabupaten Cirebon 2026', desc: 'Memvalidasi belanja barang/jasa (seperti ATK, laptop, konsumsi) agar tidak melebihi pagu standar harga e-SSH 2026.', active: true },
    { id: 'rule-deadweight-limit', name: 'Batas Kerugian Bobot Maksimal 40%', desc: 'Persentase Kerugian Bobot (dampak sosial yang tetap terjadi tanpa program) tidak boleh melebihi 40%.', active: true },
    { id: 'rule-rpjmd-sync', name: 'Keselarasan RPJMD & RKPD', desc: 'Indikator keluaran program harus selaras dengan misi dan target IKU RPJMD Kabupaten Cirebon.', active: true }
  ],

  gptApiKey: '',
  agentSelectedRkaId: null,
  agentSelectedVersionId: null,
  agentReviewResult: null,
  agentReviewLoading: false,
  agentActionLoading: false,
  aiTemplateRegenerateLoading: false,

  rkis: [], // will be loaded asynchronously
  uploadQueue: [],
  activeAnalysis: null,
  isProcessing: false,
  progress: 0,
  statusText: 'Mengekstrak data teks dari PDF...',
  ocrText: '',
  ocrStatus: '',
  notifications: []
});

const notificationsList = reactive([]);
export const notificationHistory = reactive(JSON.parse(localStorage.getItem('bapperida_notif_history')) || []);

watch(notificationHistory, (newVal) => {
  localStorage.setItem('bapperida_notif_history', JSON.stringify(newVal));
}, { deep: true });

// Watchers for persistent storage
watch(() => state.rules, (newRules) => {
  localStorage.setItem('bapperida_rules', JSON.stringify(newRules));
}, { deep: true });

// TIDAK lagi menyimpan GPT API Key ke localStorage — key ada di backend .env

// Removed watch for state.rkis local storage saving.

watch(() => state.theme, (newTheme) => {
  localStorage.setItem('bapperida_theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
});

// Initialize theme on load
document.documentElement.setAttribute('data-theme', state.theme);

// Data RKA hanya dimuat setelah login (via checkSession())
// fetchRkis() tidak dipanggil di sini

/* ==========================================================================
 Calculations & Formatting
 ========================================================================== */
function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

function getSroiKelayakanColor(sroi, status) {
  if (status === 'Belum Dapat Dinilai') return 'Abu-abu';
  if (sroi >= 1.0) return 'Hijau';
  if (sroi >= 0.6) return 'Kuning';
  return 'Merah';
}

/**
 * Kalkulator 16 Aturan Baku SROI
 * SROI Ratio = Present Value (PV) of Impact ÷ Value of Inputs
 */
export function computeSroi16Rules(params = {}) {
  if (!params) params = {};
  const valueOfInputs = Number(params.pagu || params.valueOfInputs || 0);
  const rawOutcome = Number(params.outcome || params.social_benefit_value || 0);
  const deadweight = Number(params.deadweight ?? 15);
  const attribution = Number(params.attribution ?? 0);
  const displacement = Number(params.displacement ?? 0);
  const dropOff = Number(params.dropOff ?? 10);
  const discountRate = Number(params.discountRate ?? 5);
  const durationYears = Math.max(1, Number(params.benefitDurationYears || 1));

  // Validasi 12 Poin: Jika data investasi/outcome tidak valid
  if (valueOfInputs <= 0 || rawOutcome <= 0 || isNaN(valueOfInputs) || isNaN(rawOutcome)) {
    return {
      valueOfInputs,
      totalNilaiDampak: 0,
      dampakSetelahDeadweight: 0,
      dampakSetelahAttribution: 0,
      dampakSetelahDisplacement: 0,
      netImpact: 0,
      pvImpact: 0,
      sroiRatio: 0,
      sroiScore: '—',
      sroiRatioText: 'Belum Dapat Dinilai',
      sroiRatioWithBanding: 'Belum Dapat Dinilai',
      shortLabel: 'Belum Dinilai',
      sroiStatus: 'Belum Dapat Dinilai',
      sroiInterpretation: 'Data investasi, outcome, atau financial proxy belum memadai untuk menghitung SROI secara bertanggung jawab.',
      kelayakan: 'Abu-abu',
      tone: 'tone-gray',
      isValid: false,
      deadweight,
      attribution,
      displacement,
      dropOff,
      discountRate,
      durationYears
    };
  }

  // 1. Total Nilai Dampak = Kuantitas Outcome × Financial Proxy
  const totalNilaiDampak = rawOutcome;

  // 2. Dampak Setelah Deadweight = Nilai Dampak × (1 − Deadweight)
  const dampakSetelahDeadweight = totalNilaiDampak * (1 - deadweight / 100);

  // 3. Dampak Setelah Attribution = Dampak Setelah Deadweight × (1 − Attribution)
  const dampakSetelahAttribution = dampakSetelahDeadweight * (1 - attribution / 100);

  // 4. Dampak Setelah Displacement = Dampak Setelah Attribution × (1 − Displacement)
  const dampakSetelahDisplacement = dampakSetelahAttribution * (1 - displacement / 100);

  // 5. Dampak Bersih Tahun 1
  const dampakBersihTahun1 = dampakSetelahDisplacement;

  // 6. Multi-Tahun Drop-off & Present Value (PV) Discounting
  let pvTotal = 0;
  let currentYearImpact = dampakBersihTahun1;
  const yearlyBreakdown = [];

  for (let t = 1; t <= durationYears; t++) {
    if (t > 1) {
      currentYearImpact = currentYearImpact * (1 - dropOff / 100);
    }
    // Jika hanya 1 tahun, PV = Dampak Bersih Tahun tersebut tanpa discounting masa depan
    const discountedValue = durationYears === 1
      ? currentYearImpact
      : currentYearImpact / Math.pow(1 + discountRate / 100, t);

    yearlyBreakdown.push({
      year: t,
      impact: Math.round(currentYearImpact),
      discounted: Math.round(discountedValue)
    });
    pvTotal += discountedValue;
  }

  const netImpact = Math.round(dampakBersihTahun1);
  const pvImpact = Math.round(pvTotal);

  // 7. SROI Ratio = PV of Impact ÷ Value of Inputs
  const sroiRatio = Number((pvImpact / valueOfInputs).toFixed(2));
  const sroiScore = sroiRatio.toFixed(2);
  const sroiRatioText = sroiScore;
  const sroiRatioWithBanding = `${sroiScore} : 1`;

  // 8. Pemisahan Status SROI Resmi & Keringanan Ambang Batas 0.6
  let sroiStatus = 'Nilai Sosial Positif (Layak)';
  let shortLabel = 'Layak';
  let tone = 'tone-green';
  let kelayakan = 'Hijau';

  if (sroiRatio >= 1.0) {
    sroiStatus = 'Nilai Sosial Positif (Layak)';
    shortLabel = 'Layak';
    tone = 'tone-green';
    kelayakan = 'Hijau';
  } else if (sroiRatio >= 0.6) {
    sroiStatus = 'Nilai Sosial Cukup / Keringanan (Moderat)';
    shortLabel = 'Cukup';
    tone = 'tone-yellow';
    kelayakan = 'Kuning';
  } else {
    sroiStatus = 'Nilai Sosial Tidak Seimbang dengan Investasi';
    shortLabel = 'Kurang';
    tone = 'tone-red';
    kelayakan = 'Merah';
  }

  // 9. Interpretasi Baku: Setiap Rp1 investasi menghasilkan Rp[angka] nilai sosial
  const formattedRatio = sroiRatio.toFixed(2).replace('.', ',');
  const sroiInterpretation = `Setiap Rp1 investasi menghasilkan Rp${formattedRatio} nilai sosial.`;

  return {
    valueOfInputs,
    totalNilaiDampak,
    dampakSetelahDeadweight: Math.round(dampakSetelahDeadweight),
    dampakSetelahAttribution: Math.round(dampakSetelahAttribution),
    dampakSetelahDisplacement: Math.round(dampakSetelahDisplacement),
    netImpact,
    pvImpact,
    sroiRatio,
    sroiScore,
    sroiRatioText,
    sroiRatioWithBanding,
    shortLabel,
    sroiStatus,
    sroiInterpretation,
    kelayakan,
    tone,
    isValid: true,
    deadweight,
    attribution,
    displacement,
    dropOff,
    discountRate,
    durationYears,
    yearlyBreakdown
  };
}

// Cari nilai field dari objek hasil AI dengan mencoba beberapa kemungkinan
// nama key (LLM tidak selalu konsisten mengikuti nama key persis sesuai skema).
function pickField(obj, keys, fallback) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function showNotification(title, message, type = 'info') {
  const id = Date.now();
  const notif = {
    id,
    title,
    message,
    type,
    time: new Date().toISOString()
  };
  notificationsList.push(notif);
  notificationHistory.unshift(notif); // push to history, newest first

  setTimeout(() => {
    removeNotification(id);
  }, 4500);
}

function removeNotification(id) {
  const index = notificationsList.findIndex(n => n.id === id);
  if (index !== -1) notificationsList.splice(index, 1);
}

// Hapus satu item dari histori notifikasi (dropdown lonceng)
function deleteNotifHistory(id) {
  const index = notificationHistory.findIndex(n => n.id === id);
  if (index !== -1) notificationHistory.splice(index, 1);
}

// Hapus seluruh histori notifikasi
function clearNotifHistory() {
  notificationHistory.splice(0, notificationHistory.length);
}

/* ==========================================================================
 Realocation Rules Database
 ========================================================================== */
function getRealokasiDatabase(opdLower, programLower, pagu, sroi) {
  const isLowSroi = sroi < 1.0;

  let rekeningDikurangi = [];
  let rekeningDitambah = [];
  let rekeningWajib = [];

  rekeningDikurangi.push({
    kode: '5.2.06.01',
    nama: 'Belanja Perjalanan Dinas Dalam Daerah',
    icon: 'plane',
    alasan: isLowSroi
      ? 'Perjalanan dinas yang tidak berkontribusi langsung pada output dapat dipangkas hingga 30% untuk efisiensi.'
      : 'Koordinasi lapangan rutin dapat diganti sebagian dengan rapat daring (online meeting) untuk menghemat BBM & uang harian.',
    nilai: Math.round(pagu * (isLowSroi ? 0.05 : 0.025))
  });

  if (pagu > 200000000) {
    rekeningDikurangi.push({
      kode: '5.2.06.02',
      nama: 'Belanja Perjalanan Dinas Luar Daerah',
      icon: 'map-pin',
      alasan: 'Dinas keluar daerah perlu selektif — dibatasi untuk kegiatan yang berdampak langsung pada target output RKA (mis. studi banding wajib berbuah dokumen rekomendasi).',
      nilai: Math.round(pagu * (isLowSroi ? 0.08 : 0.04))
    });
  }

  if (opdLower.includes('pendidik') || programLower.includes('pelatiha') || programLower.includes('beasiswa') || programLower.includes('guru') || programLower.includes('kompetens')) {
    rekeningDikurangi.push({
      kode: '5.2.02.08',
      nama: 'Belanja Sewa Gedung / Aula Kegiatan',
      icon: 'building-2',
      alasan: 'Gedung kantor dinas atau balai desa dapat digunakan tanpa biaya sewa, menghemat pagu untuk kebutuhan peserta.',
      nilai: Math.round(pagu * 0.03)
    });
    rekeningDikurangi.push({
      kode: '5.2.02.01',
      nama: 'Belanja Konsumsi Rapat / Snack Kegiatan',
      icon: 'coffee',
      alasan: 'Konsumsi dapat ditekan dengan mengacu standar SSH yang berlaku, atau ditiadakan untuk sesi pelatihan singkat < 4 jam.',
      nilai: Math.round(pagu * 0.015)
    });
    rekeningDitambah.push({
      kode: '5.2.02.12',
      nama: 'Belanja Bahan/Material Praktek Pelatihan (ATK & Modul)',
      icon: 'book-open',
      alasan: 'Kritis untuk capaian output: setiap peserta wajib mendapat modul cetak, alat tulis, dan materi latihan agar target kompetensi terpenuhi.',
      nilai: Math.round(pagu * 0.06),
      prioritas: 'danger'
    });
    rekeningDitambah.push({
      kode: '5.2.03.01',
      nama: 'Honorarium Narasumber / Instruktur Ahli',
      icon: 'user-cog',
      alasan: 'Kualitas instruktur menentukan ketercapaian target kualitatif peserta. Gunakan standar SSH jasa konsultansi Kabupaten Cirebon 2026.',
      nilai: Math.round(pagu * 0.12),
      prioritas: 'primary'
    });
    rekeningDitambah.push({
      kode: '5.2.02.15',
      nama: 'Belanja Sertifikat & Dokumentasi Kegiatan',
      icon: 'award',
      alasan: 'Bukti output wajib: sertifikat peserta dan dokumentasi foto/video sebagai pertanggungjawaban pelaksanaan kegiatan.',
      nilai: Math.round(pagu * 0.02),
      prioritas: 'warning'
    });
    rekeningWajib = [
      { kode: '5.2.02.12', nama: 'Bahan Praktek & Modul ATK', pagu: Math.round(pagu * 0.06), prioritas: 'danger' },
      { kode: '5.2.03.01', nama: 'Honor Narasumber/Instruktur', pagu: Math.round(pagu * 0.12), prioritas: 'primary' },
      { kode: '5.2.02.15', nama: 'Sertifikat & Dokumentasi', pagu: Math.round(pagu * 0.02), prioritas: 'warning' },
      { kode: '5.2.01.01', nama: 'Belanja Pegawai Pelaksana', pagu: Math.round(pagu * 0.08), prioritas: 'primary' }
    ];
  } else if (opdLower.includes('kesehatan') || programLower.includes('stunting') || programLower.includes('pmt') || programLower.includes('posyandu') || programLower.includes('balita')) {
    rekeningDikurangi.push({
      kode: '5.2.02.01',
      nama: 'Belanja Konsumsi & Snack Rapat Koordinasi',
      icon: 'coffee',
      alasan: 'Rapat koordinasi lintas sektor cukup dengan konsumsi standar SSH — tidak perlu catering eksternal untuk efisiensi.',
      nilai: Math.round(pagu * 0.02)
    });
    rekeningDikurangi.push({
      kode: '5.2.05.02',
      nama: 'Belanja Cetak Spanduk & Baliho Sosialisasi',
      icon: 'flag',
      alasan: 'Edukasi gizi dapat memanfaatkan media sosial resmi Dinkes secara gratis, mengurangi kebutuhan cetak fisik.',
      nilai: Math.round(pagu * 0.015)
    });
    rekeningDitambah.push({
      kode: '5.2.02.27',
      nama: 'Belanja Bahan Makanan Tambahan (PMT) Bergizi',
      icon: 'heart',
      alasan: 'Rekening utama program — kecukupan gizi langsung menentukan capaian penurunan prevalensi stunting. Tidak boleh dikurangi.',
      nilai: Math.round(pagu * 0.55),
      prioritas: 'danger'
    });
    rekeningDitambah.push({
      kode: '5.2.02.13',
      nama: 'Belanja Obat & Suplemen Vitamin (Zinc, Fe)',
      icon: 'pill',
      alasan: 'Suplemen pendukung wajib diberikan bersama PMT sesuai Permenkes No. 29/2019 tentang pencegahan stunting.',
      nilai: Math.round(pagu * 0.08),
      prioritas: 'primary'
    });
    rekeningDitambah.push({
      kode: '5.2.03.03',
      nama: 'Honor Kader Posyandu & Tenaga Gizi',
      icon: 'users',
      alasan: 'Kader posyandu adalah ujung tombak pemantauan tumbuh kembang balita — honorarium memastikan kehadiran dan konsistensi monitoring.',
      nilai: Math.round(pagu * 0.07),
      prioritas: 'warning'
    });
    rekeningWajib = [
      { kode: '5.2.02.27', nama: 'Bahan Makanan Tambahan (PMT)', pagu: Math.round(pagu * 0.55), prioritas: 'danger' },
      { kode: '5.2.02.13', nama: 'Obat/Suplemen Zinc & Vitamin Fe', pagu: Math.round(pagu * 0.08), prioritas: 'primary' },
      { kode: '5.2.03.03', nama: 'Honor Kader Posyandu', pagu: Math.round(pagu * 0.07), prioritas: 'warning' },
      { kode: '5.2.06.01', nama: 'Transport Kunjungan Rumah (Home Visit)', pagu: Math.round(pagu * 0.04), prioritas: 'warning' }
    ];
  } else if (opdLower.includes('putr') || opdLower.includes('pekerjaan umum') || programLower.includes('jalan') || programLower.includes('bangunan') || programLower.includes('gapura') || programLower.includes('gedung')) {
    rekeningDikurangi.push({
      kode: '5.2.02.08',
      nama: 'Belanja Jasa Konsultansi Pengawasan Tidak Wajib',
      icon: 'eye',
      alasan: isLowSroi
        ? 'Untuk proyek bernilai sosial rendah (SROI < 1), anggaran konsultan pengawas dapat dikurangi atau digabung dengan tenaga teknis internal.'
        : 'Pertimbangkan menggunakan UPTD teknis internal untuk pengawasan rutin guna menekan biaya konsultansi.',
      nilai: Math.round(pagu * 0.04)
    });
    rekeningDikurangi.push({
      kode: '5.2.02.35',
      nama: 'Belanja Ornamen / Estetika Non-Fungsional',
      icon: 'sparkles',
      alasan: 'Komponen estetika (ukiran, cat premium, ornamen khusus) meningkatkan biaya tanpa dampak sosial terukur. Pilih spesifikasi standar SSH.',
      nilai: Math.round(pagu * (isLowSroi ? 0.10 : 0.03))
    });
    rekeningDitambah.push({
      kode: '5.2.04.01',
      nama: 'Belanja Material Konstruksi Utama (Aspal/Beton/Besi)',
      icon: 'hard-hat',
      alasan: 'Kualitas material langsung menentukan usia pakai dan manfaat infrastruktur. Harus memenuhi spesifikasi teknis minimal Bina Marga.',
      nilai: Math.round(pagu * 0.50),
      prioritas: 'danger'
    });
    rekeningDitambah.push({
      kode: '5.2.04.03',
      nama: 'Belanja Jasa Kontraktor Pelaksana (Fisik)',
      icon: 'truck',
      alasan: 'Kontrak pelaksana fisik adalah rekening inti program — pemilihan kontraktor harus melalui proses tender/lelang sesuai Perpres 16/2018.',
      nilai: Math.round(pagu * 0.35),
      prioritas: 'primary'
    });
    rekeningDitambah.push({
      kode: '5.2.02.11',
      nama: 'Belanja Pengujian Mutu Material (Lab Uji)',
      icon: 'flask-conical',
      alasan: 'Uji mutu material wajib untuk memastikan kualitas konstruksi sesuai SNI — merupakan syarat administrasi pertanggungjawaban.',
      nilai: Math.round(pagu * 0.015),
      prioritas: 'warning'
    });
    rekeningWajib = [
      { kode: '5.2.04.01', nama: 'Material Konstruksi Utama', pagu: Math.round(pagu * 0.50), prioritas: 'danger' },
      { kode: '5.2.04.03', nama: 'Jasa Kontraktor Pelaksana', pagu: Math.round(pagu * 0.35), prioritas: 'primary' },
      { kode: '5.2.02.11', nama: 'Uji Mutu / Lab Test Material', pagu: Math.round(pagu * 0.015), prioritas: 'warning' },
      { kode: '5.2.02.08', nama: 'Konsultansi Pengawasan Teknis', pagu: Math.round(pagu * 0.05), prioritas: 'warning' }
    ];
  } else if (opdLower.includes('sosial') || programLower.includes('karang taruna') || programLower.includes('bimbingan') || programLower.includes('keterampilan')) {
    rekeningDikurangi.push({
      kode: '5.2.06.01',
      nama: 'Belanja Perjalanan Dinas Koordinasi Dinas',
      icon: 'plane',
      alasan: 'Koordinasi antara Dinas Sosial dan kelurahan/kecamatan dapat dilakukan via WhatsApp atau rapat daring untuk menekan uang harian perjalanan.',
      nilai: Math.round(pagu * 0.04)
    });
    rekeningDitambah.push({
      kode: '5.2.02.12',
      nama: 'Belanja Alat Praktek & Bahan Kegiatan (ATK + Alat)',
      icon: 'scissors',
      alasan: 'Alat jahit, benang, kain batik, dll. adalah komponen langsung program yang menentukan apakah peserta dapat berlatih secara nyata.',
      nilai: Math.round(pagu * 0.30),
      prioritas: 'danger'
    });
    rekeningDitambah.push({
      kode: '5.2.03.01',
      nama: 'Honorarium Instruktur/Pelatih Terampil',
      icon: 'user-cog',
      alasan: 'Kualitas pelatih menentukan ketercapaian target kemampuan mandiri peserta karang taruna. Gunakan instruktur bersertifikat BNSP.',
      nilai: Math.round(pagu * 0.15),
      prioritas: 'primary'
    });
    rekeningWajib = [
      { kode: '5.2.02.12', nama: 'Alat Praktek & Bahan ATK', pagu: Math.round(pagu * 0.30), prioritas: 'danger' },
      { kode: '5.2.03.01', nama: 'Honor Instruktur Terampil', pagu: Math.round(pagu * 0.15), prioritas: 'primary' },
      { kode: '5.2.02.15', nama: 'Sertifikat & Dokumentasi', pagu: Math.round(pagu * 0.02), prioritas: 'warning' }
    ];
  } else if (opdLower.includes('bpbd') || opdLower.includes('bencana') || programLower.includes('dokumen') || programLower.includes('peta') || programLower.includes('gis')) {
    rekeningDikurangi.push({
      kode: '5.2.06.02',
      nama: 'Belanja Perjalanan Dinas Luar Daerah (Konsultasi)',
      icon: 'map-pin',
      alasan: 'Konsultasi dengan BNPB or BMKG pusat dapat dilakukan secara hybrid/daring, mengurangi biaya transport dan akomodasi.',
      nilai: Math.round(pagu * 0.06)
    });
    rekeningDikurangi.push({
      kode: '5.2.05.02',
      nama: 'Belanja Cetak Publikasi (Poster/Banner)',
      icon: 'printer',
      alasan: 'Distribusi peta risiko dapat diprioritaskan dalam format digital (PDF/WebGIS) yang lebih hemat dan mudah diperbarui.',
      nilai: Math.round(pagu * 0.025)
    });
    rekeningDitambah.push({
      kode: '5.2.03.02',
      nama: 'Honorarium Tenaga Ahli GIS & Konsultan Pemetaan',
      icon: 'map',
      alasan: 'Tenaga ahli GIS adalah inti program ini — kualitas dokumen peta risiko ditentukan oleh kompetensi konsultan. Wajib menggunakan lulusan geodesi/planologi berpengalaman.',
      nilai: Math.round(pagu * 0.35),
      prioritas: 'danger'
    });
    rekeningDitambah.push({
      kode: '5.2.02.19',
      nama: 'Belanja Langganan Data Citra Satelit / Lidar',
      icon: 'satellite',
      alasan: 'Data spasial resolusi tinggi wajib untuk akurasi peta risiko. Dapat menggunakan data LAPAN/BIG yang bersubsidi pemerintah.',
      nilai: Math.round(pagu * 0.15),
      prioritas: 'primary'
    });
    rekeningDitambah.push({
      kode: '5.2.05.01',
      nama: 'Belanja Cetak Dokumen Peta & Laporan Final',
      icon: 'file-text',
      alasan: 'Output fisik dokumen peta (A1/A0) dan laporan sebagai pertanggungjawaban wajib program kepada Bupati dan BPBD.',
      nilai: Math.round(pagu * 0.05),
      prioritas: 'warning'
    });
    rekeningWajib = [
      { kode: '5.2.03.02', nama: 'Honor Tenaga Ahli GIS', pagu: Math.round(pagu * 0.35), prioritas: 'danger' },
      { kode: '5.2.02.19', nama: 'Data Citra Satelit/Lidar', pagu: Math.round(pagu * 0.15), prioritas: 'primary' },
      { kode: '5.2.05.01', nama: 'Cetak Dokumen Peta Final', pagu: Math.round(pagu * 0.05), prioritas: 'warning' },
      { kode: '5.2.06.01', nama: 'Transport Survei Lapangan', pagu: Math.round(pagu * 0.04), prioritas: 'warning' }
    ];
  } else {
    rekeningDikurangi.push({
      kode: '5.2.02.01',
      nama: 'Belanja Konsumsi Rapat & Koordinasi Umum',
      icon: 'coffee',
      alasan: 'Konsumsi rapat bisa dihemat dengan menerapkan standar SSH minum (snack box standar) dan membatasi frekuensi rapat tatap muka.',
      nilai: Math.round(pagu * 0.02)
    });
    rekeningDitambah.push({
      kode: '5.2.02.12',
      nama: 'Belanja ATK & Bahan Habis Pakai Program',
      icon: 'package',
      alasan: 'ATK dan bahan habis pakai adalah rekening wajib yang mendukung operasional langsung pencapaian output RKA.',
      nilai: Math.round(pagu * 0.05),
      prioritas: 'primary'
    });
    rekeningDitambah.push({
      kode: '5.2.01.02',
      nama: 'Belanja Honor Tim Pelaksana Kegiatan',
      icon: 'users',
      alasan: 'Tim pelaksana harus diberikan honorarium sesuai SK Bupati untuk memastikan dedikasi dan akuntabilitas pencapaian target output.',
      nilai: Math.round(pagu * 0.08),
      prioritas: 'warning'
    });
    rekeningWajib = [
      { kode: '5.2.02.12', nama: 'ATK & Bahan Habis Pakai', pagu: Math.round(pagu * 0.05), prioritas: 'primary' },
      { kode: '5.2.01.02', nama: 'Honor Tim Pelaksana', pagu: Math.round(pagu * 0.08), prioritas: 'warning' }
    ];
  }

  const hasAtk = rekeningWajib.some(r => r.kode.includes('5.2.02.12') || r.kode.includes('5.2.02.27'));
  if (!hasAtk) {
    rekeningWajib.push({ kode: '5.2.02.12', nama: 'Belanja ATK Kegiatan', pagu: Math.round(pagu * 0.03), prioritas: 'warning' });
  }

  return { rekeningDikurangi, rekeningDitambah, rekeningWajib };
}

export function buildUsulanProporsi(proporsi, justifications, pagu = 0) {
  let usulan = JSON.parse(JSON.stringify(proporsi));
  if (!justifications || justifications.length === 0) return usulan;

  justifications.forEach(j => {
    // Coba cocokkan berdasarkan kode rekening ATAU nama rekening.
    // Kode kosong / '-' bukan kunci yang bermakna: tanpa pengecualian ini dua baris
    // yang sama-sama tanpa kode akan dianggap rekening yang sama.
    const hasCode = (c) => !!c && c !== '-';
    let match = usulan.find(p => (hasCode(p.kode) && hasCode(j.kode) && p.kode === j.kode) || (p.nama && j.rekening_nama && (p.nama.toLowerCase().includes(j.rekening_nama.toLowerCase()) || j.rekening_nama.toLowerCase().includes(p.nama.toLowerCase()))));

    if (match) {
      if (j.aksi === 'KURANGI') {
        const diff = j.nilai_dikurangi || 0;
        match.nilai = Math.max(0, match.nilai - diff);
      } else if (j.aksi === 'TAMBAH') {
        const diff = j.nilai_ditambah || 0;
        match.nilai += diff;
      }
    } else {
      if (j.aksi === 'TAMBAH') {
        usulan.push({
          kode: j.kode || '-',
          nama: j.rekening_nama || 'Belanja Tambahan',
          nilai: j.nilai_ditambah || 0,
          persen: 0
        });
      } else if (j.aksi === 'KURANGI') {
        // Jika AI mengurangi item yang tidak ada di proporsi awal, kita tambahkan nilai sisanya
        usulan.push({
          kode: j.kode || '-',
          nama: j.rekening_nama || 'Belanja Dikurangi',
          nilai: Math.max(0, (j.nilai_awal || 0) - (j.nilai_dikurangi || 0)),
          persen: 0
        });
      }
    }
  });

  const sumItems = usulan.reduce((s, r) => s + r.nilai, 0);
  const total = pagu > 0 ? pagu : sumItems;
  if (total > 0) {
    usulan.forEach(r => {
      r.persen = Number(((r.nilai / total) * 100).toFixed(2));
    });
  }
  return usulan;
}

function parseRekeningProporsi(pdfText, totalPagu, program = '') {
  const text = pdfText.toLowerCase();
  const belanjaRegex = /belanja\s+([a-z\s]+?)(?=\n|,|\d|rp|$)/gi;
  let matches = [];
  let m;

  // Ekstrak item belanja dari teks RKA
  while ((m = belanjaRegex.exec(text)) !== null) {
    let name = m[1].trim();
    // Validasi panjang string agar wajar dan bersihkan spasi berlebih
    if (name.length > 5 && name.length < 50 && !name.includes('belanja')) {
      matches.push("Belanja " + name.replace(/\s+/g, ' '));
    }
  }

  // Hapus duplikat
  matches = [...new Set(matches)];

  let items = [];

  if (matches.length >= 3) {
    // Jika menemukan item di teks, alokasikan secara dinamis
    let remaining = totalPagu;
    for (let i = 0; i < matches.length; i++) {
      let isLast = (i === matches.length - 1);
      let name = matches[i];
      // Generate pseudo-random kode rekening
      let kode = `5.2.${Math.floor(Math.random() * 5 + 1).toString().padStart(2, '0')}.${Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0')}`;

      if (isLast) {
        items.push({
          kode,
          nama: name.replace(/belanja /i, ''),
          nilai: remaining,
          persen: Number(((remaining / totalPagu) * 100).toFixed(1))
        });
      } else {
        let val = Math.round(totalPagu * (0.1 + Math.random() * 0.25)); // 10% - 35%
        let allocated = Math.min(remaining, val);
        remaining -= allocated;
        items.push({
          kode,
          nama: name.replace(/belanja /i, ''),
          nilai: allocated,
          persen: Number(((allocated / totalPagu) * 100).toFixed(1))
        });
      }
    }
  } else {
    // Jika tidak ketemu teks spesifik, hasilkan item generik yang digabungkan dengan nama program
    const progName = program || 'Kegiatan Utama';
    items = [
      { kode: '5.2.02.01', nama: `Material & Bahan Pendukung (${progName})`, nilai: Math.round(totalPagu * 0.4), persen: 40 },
      { kode: '5.2.03.02', nama: `Honorarium Tim Pelaksana`, nilai: Math.round(totalPagu * 0.25), persen: 25 },
      { kode: '5.2.06.01', nama: `Perjalanan Dinas Koordinasi`, nilai: Math.round(totalPagu * 0.15), persen: 15 },
      { kode: '5.2.02.06', nama: `Cetak & Penggandaan Laporan`, nilai: Math.round(totalPagu * 0.1), persen: 10 },
      { kode: '5.2.02.12', nama: `ATK Operasional Rutin`, nilai: Math.round(totalPagu * 0.1), persen: 10 },
    ];
  }
  return items;
}

/* ==========================================================================
 AI evaluation and reasoning
 ========================================================================== */

function updateProgressBar(percentage, text, queueItem = null) {
  state.progress = percentage;
  state.statusText = text;
  if (queueItem) {
    queueItem.progress = percentage;
    queueItem.statusText = text;
  }
}

function resetUploadArea() {
  state.isProcessing = false;
  state.progress = 0;
  state.statusText = "Mengekstrak data teks dari PDF...";
  state.uploadQueue = [];
}
async function handleRkaFiles(files) {
  if (!files || files.length === 0) return;

  const validFiles = [];
  const invalidFiles = [];

  for (const f of files) {
    const isPdfExt = f.name && f.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = !f.type || f.type === 'application/pdf' || f.type.includes('pdf');
    if (!isPdfExt && !isPdfMime) {
      invalidFiles.push(f.name);
    } else if (f.size <= 0) {
      showNotification("Berkas Kosong", `Berkas ${f.name} berukuran 0 byte dan tidak dapat diproses.`, "warning");
    } else if (f.size > 100 * 1024 * 1024) {
      showNotification("Ukuran Terlalu Besar", `Berkas ${f.name} melebihi batas 100MB.`, "warning");
    } else {
      validFiles.push(f);
    }
  }

  if (invalidFiles.length > 0) {
    showNotification(
      "Format Berkas Tidak Didukung",
      `Hanya dokumen PDF RKA yang didukung. ${invalidFiles.length} berkas non-PDF diabaikan: ${invalidFiles.join(', ')}`,
      "warning"
    );
    try {
      apiFetch('/api/v1/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPLOAD_RKA',
          target: invalidFiles.join(', '),
          details: `Pengunggahan berkas ditolak: Format berkas bukan PDF (${invalidFiles.join(', ')})`,
          status: 'FAILED',
          username: currentUser.value?.username,
          name: currentUser.value?.name,
          role: currentUser.value?.role
        })
      });
    } catch { }
  }

  if (validFiles.length === 0) {
    return;
  }

  state.isProcessing = true;
  state.uploadQueue = validFiles.map((f, i) => ({
    id: Date.now() + i,
    file: f,
    name: f.name,
    size: f.size,
    progress: 0,
    status: 'pending',
    statusText: 'Menunggu antrean...'
  }));

  for (let f = 0; f < state.uploadQueue.length; f++) {
    const queueItem = state.uploadQueue[f];
    const file = queueItem.file;
    queueItem.status = 'processing';

    try {
      updateProgressBar(10, `Membaca data PDF ${f + 1} dari ${validFiles.length}...`, queueItem);
      const arrayBuffer = await file.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);

      updateProgressBar(30, `Mengekstrak data teks ${f + 1}/${validFiles.length}...`, queueItem);
      const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
      let textContent = "";
      let maxPages = Math.min(pdf.numPages, MAX_PDF_PAGES);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        const strings = text.items.map(item => item.str);
        textContent += strings.join(" ") + "\n";

        const progress = 30 + Math.round((i / maxPages) * 35);
        updateProgressBar(progress, `Mengekstrak halaman ${i} dari ${pdf.numPages}...`, queueItem);
      }

      if (textContent.trim().length === 0) {
        // Fallback for scanned PDF
        textContent = `Rencana Kerja dan Anggaran (RKA) SKPD Kabupaten Cirebon\nDokumen: ${file.name}\nCatatan: PDF hasil pindai/gambar tanpa teks digital.`;
      }

      updateProgressBar(70, `Layanan AI mengevaluasi...`, queueItem);
      state.ocrText = textContent;
      state.ocrStatus = `Teks Terdeteksi: ${textContent.length} karakter`;

      const progressInterval = setInterval(() => {
        if (queueItem.progress < 94) {
          const nextProg = Math.min(94, queueItem.progress + Math.floor(Math.random() * 3) + 2);
          updateProgressBar(nextProg, nextProg >= 85 ? 'Layanan AI sedang mengevaluasi SROI...' : 'Layanan AI mengevaluasi...', queueItem);
        }
      }, 600);

      let analysisObj;
      try {
        analysisObj = await processWithAIService(textContent, file.name, file.size);
      } finally {
        clearInterval(progressInterval);
      }

      const newId = generateRkaId();
      analysisObj.id = newId;
      analysisObj.namaDokumen = file.name;
      analysisObj.ukuranBerkas = file.size;
      // Teks PDF disimpan di server agar bisa dianalisis ulang lewat tombol "Muat Ulang PDF"
      analysisObj.sourceText = textContent;

      // Save to backend
      try {
        const res = await apiFetch('/api/v1/rkis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(analysisObj)
        });
        if (res.ok) {
          const savedObj = await res.json();
          // Cegah duplikasi: event realtime RKA_CREATED bisa saja sudah
          // lebih dulu memasukkan dokumen ini ke state.rkis sebelum
          // response POST ini selesai diterima (race condition).
          const existIdx = state.rkis.findIndex(r => r.id === savedObj.id);
          if (existIdx === -1) {
            state.rkis.unshift(savedObj);
          } else {
            state.rkis[existIdx] = { ...state.rkis[existIdx], ...savedObj };
          }
          updateProgressBar(100, 'Selesai diproses', queueItem);
          queueItem.status = 'done';
          // Backup otomatis setiap kali ada dokumen baru berhasil diunggah —
          // tidak menunggu (fire-and-forget) supaya tidak memperlambat
          // tampilan progress bar ke pengguna.
          // Hanya admin yang menerima berkas JSON otomatis; user pengupload tidak.
          if (currentUser.value?.role === 'admin') autoBackupOnUpload();
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server menolak penyimpanan (${res.status})`);
        }
      } catch (saveError) {
        console.error(saveError);
        queueItem.status = 'error';
        queueItem.statusText = 'Gagal menyimpan ke server';
        showNotification("Gagal Menyimpan " + file.name, saveError.message, "danger");
        state.rkis.unshift(analysisObj);
        try {
          await apiFetch('/api/v1/activity-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'UPLOAD_RKA',
              target: file.name,
              details: `Gagal menyimpan dokumen RKA (${(file.size / 1024).toFixed(1)} KB): ${saveError.message}`,
              status: 'FAILED',
              username: currentUser.value?.username,
              name: currentUser.value?.name,
              role: currentUser.value?.role
            })
          });
        } catch { }
      }

    } catch (e) {
      console.error(e);
      queueItem.status = 'error';
      queueItem.statusText = 'Gagal memproses file';
      showNotification("Gagal Memproses " + file.name, e.message, "danger");
      try {
        await apiFetch('/api/v1/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPLOAD_RKA',
            target: file.name,
            details: `Gagal memproses/mengekstrak berkas RKA (${(file.size / 1024).toFixed(1)} KB): ${e.message}`,
            status: 'FAILED',
            username: currentUser.value?.username,
            name: currentUser.value?.name,
            role: currentUser.value?.role
          })
        });
      } catch { }
    }
  }

  const hasSuccess = state.uploadQueue.some(q => q.status === 'done');
  if (hasSuccess) {
    updateProgressBar(100, "Semua berkas selesai diproses!");
    const firstSuccessObj = state.rkis[0];
    if (firstSuccessObj) {
      loadHistoricalDocIntoAnalyzer(firstSuccessObj);
    }
    setTimeout(() => {
      state.currentTab = 'analyzer';
      resetUploadArea();
    }, 1200);
  } else {
    state.isProcessing = false;
    state.statusText = "Gagal memproses berkas. Silakan periksa API Key Gemini Anda.";
  }
}
// Mengubah hasil JSON mentah dari AI (skema template standar /api/v1/evaluate)
// menjadi objek analisis RKA yang dipakai di seluruh UI. Dipisah dari
// processWithAIService agar bisa dipakai ulang oleh alur "Susun Ulang dengan AI".
function mapAiJsonToAnalysis(jsonResult, meta = {}) {
  const paguVal = Number(jsonResult.pagu) || 100000000;
  const outcomeVal = Number(jsonResult.social_benefit_value) || 120000000;
  const deadweightVal = Number(jsonResult.deadweight_percentage ?? 15);
  const attributionVal = Number(jsonResult.attribution_percentage ?? 0);
  const displacementVal = Number(jsonResult.displacement_percentage ?? 0);
  const dropOffVal = Number(jsonResult.dropoff_percentage ?? 10);
  const discountRateVal = Number(jsonResult.discount_rate_percentage ?? 5);
  const benefitYearsVal = Number(jsonResult.benefit_duration_years ?? 1);

  const sroiCalc = computeSroi16Rules({
    pagu: paguVal,
    outcome: outcomeVal,
    deadweight: deadweightVal,
    attribution: attributionVal,
    displacement: displacementVal,
    dropOff: dropOffVal,
    discountRate: discountRateVal,
    benefitDurationYears: benefitYearsVal
  });

  const rawOpd = jsonResult.opd || jsonResult.perangkat_daerah || 'Dinas Kesehatan Kabupaten Cirebon';
  const cleanOpd = cleanOpdName(rawOpd);

  return {
    id: meta.id || 'RKA-2026-TMP',
    opd: cleanOpd,
    perangkatDaerah: cleanOpd,
    program: jsonResult.program || jsonResult.nama_program || 'Program Pelayanan Publik',
    namaProgram: jsonResult.program || jsonResult.nama_program || 'Program Pelayanan Publik',
    kegiatan: jsonResult.kegiatan || jsonResult.nama_kegiatan || 'Penyediaan Layanan Kesehatan untuk UKM dan UKP',
    namaKegiatan: jsonResult.kegiatan || jsonResult.nama_kegiatan || 'Penyediaan Layanan Kesehatan untuk UKM dan UKP',
    subKegiatan: jsonResult.sub_kegiatan || jsonResult.subKegiatan || jsonResult.subkeg || jsonResult.program || 'Pengelolaan Pelayanan Kesehatan Ibu dan Anak',
    pagu: paguVal,
    outcome: outcomeVal,
    deadweight: deadweightVal,
    attribution: attributionVal,
    attributionReason: jsonResult.attribution_reason || '',
    displacement: displacementVal,
    displacementReason: jsonResult.displacement_reason || '',
    dropOff: dropOffVal,
    discountRate: discountRateVal,
    benefitDurationYears: benefitYearsVal,
    netImpact: sroiCalc.netImpact,
    pvImpact: sroiCalc.pvImpact,
    sroi: sroiCalc.sroiRatio,
    sroiRatioText: sroiCalc.sroiRatioText,
    sroiStatus: sroiCalc.sroiStatus,
    sroiInterpretation: sroiCalc.sroiInterpretation,
    outcomesDetail: jsonResult.outcomes_detail || [],
    target: jsonResult.target || 'Meningkatkan layanan masyarakat',
    targetKuantitatif: jsonResult.target || 'Meningkatkan layanan masyarakat',
    outcomeDesc: jsonResult.outcome_description || 'Dampak sosial kemasyarakatan dari realisasi fisik program.',
    justifikasiOutcome: jsonResult.outcome_description || 'Dampak sosial kemasyarakatan dari realisasi fisik program.',
    status: meta.status || 'Draft',
    kelayakan: sroiCalc.kelayakan,
    catatan: meta.catatan || '',
    findings: jsonResult.findings || [],
    kepatuhanFindings: (jsonResult.findings || []).map(f => ({
      label: f.finding_type,
      description: f.description,
      status: f.status === 'Sesuai' ? 'sesuai' : (f.status === 'Temuan' ? 'temuan' : 'warning')
    })),
    rawJson: JSON.stringify(jsonResult, null, 2),
    rekeningProporsi: jsonResult.rekening_proporsi || [],
    rekeningProporsiUsulan: buildUsulanProporsi(jsonResult.rekening_proporsi || [], jsonResult.reallocation_justifications || [], paguVal),
    reallocationJustifications: jsonResult.reallocation_justifications || [],
    originalPagu: paguVal,
    originalOutcome: outcomeVal,
    originalDeadweight: deadweightVal,
    originalAttribution: attributionVal,
    originalDisplacement: displacementVal,
    originalDropOff: dropOffVal,
    originalDiscountRate: discountRateVal,
    namaDokumen: meta.fileName || meta.namaDokumen,
    ukuranFile: meta.fileSize || meta.ukuranFile || 0,
    tanggalUpload: meta.tanggalUpload || new Date().toISOString(),
    tahun: meta.tahun || new Date().getFullYear(),

    // Indikator & Tolok Ukur Kinerja (Target Kinerja) + Anggaran per tahun.
    indikatorKinerja: pickField(jsonResult, [
      'indikator_kinerja', 'indikatorKinerja', 'indikator', 'indicator_performance'
    ], []),
    anggaranTahunan: pickField(jsonResult, [
      'anggaran_tahunan', 'anggaranTahunan', 'anggaran_per_tahun', 'yearly_budget'
    ], []),
    tahunRencana: Number(pickField(jsonResult, [
      'tahun_rencana', 'tahunRencana', 'tahun_berjalan', 'tahun_anggaran'
    ], meta.tahunRencana || new Date().getFullYear())),
    lokasi: jsonResult.lokasi || '',
    sumberDana: jsonResult.sumber_dana || jsonResult.sumberDana || '',

    // Analisis kesesuaian anggaran tahun berjalan terhadap Target Kinerja
    kesesuaianAnggaran: pickField(jsonResult, [
      'analisis_kesesuaian_anggaran', 'kesesuaianAnggaran', 'budget_target_analysis'
    ], null),

    // Evaluasi 6 Aspek Efisiensi & Efektivitas RKA
    evaluasiRka: pickField(jsonResult, [
      'evaluasi_rka', 'evaluasiRka', 'rka_evaluation'
    ], null)
  };
}

async function processWithAIService(pdfText, fileName, fileSize) {
  const engine = state.engineId;

  const activeRulesStr = state.rules
    .filter(r => r.active)
    .map((r, i) => `${i + 1}. ${r.name}: ${r.desc}`)
    .join('\n');

  const systemPrompt = `Anda adalah AI Asisten Evaluator Anggaran & Dampak Sosial (SROI) khusus untuk BAPPERIDA Kabupaten Cirebon.
Tugas Anda adalah melakukan audit atas dokumen RKA (Rencana Kerja dan Anggaran) daerah dan memproyeksikan rasio SROI (Social Return on Investment).

Lakukan 3 Lapis Penalaran (Reasoning) sekaligus:
1. Ekstraksi Komponen: Temukan nama OPD/Satuan Kerja, sub-kegiatan utama, PAGU ANGGARAN (nilai total anggaran) sebagai TOTAL INVESTASI.
2. Ekstraksi Target: Temukan target keluaran kuantitatif program.
3. Analisis & Proyeksi SROI:
 - Proyeksikan estimasi manfaat sosial-ekonomi (Outcome) dalam nilai Rupiah. Justifikasi logis berdasarkan target.
 - Estimasi Deadweight (faktor pengurangan dalam persentase, biasanya berkisar antara 10% s.d. 30%).
 - Hitung SROI Ratio = (Outcome * (100 - Deadweight) / 100) / Pagu Anggaran.
4. Analisis Proporsi Rekening: Identifikasi kode rekening belanja utama dan distribusi persentasenya dari total pagu. Minimal 4-6 rekening.
5. Justifikasi Realokasi Berpasangan: Alasan spesifik kurangi/tambah rekening.

Patuhi kebijakan threshold berikut yang sedang aktif:
${activeRulesStr}

Format JSON kaku dan valid:
{
 "opd": "Dinas Kesehatan",
 "program": "Nama Program",
 "kegiatan": "Nama Kegiatan",
 "sub_kegiatan": "Nama Sub-Kegiatan (SUBKEG)",
 "pagu": 125000000,
 "tahun_rencana": 2027,
 "target": "Target",
 "outcome_description": "Justifikasi",
 "social_benefit_value": 150000000,
 "deadweight_percentage": 15,
 "sroi_ratio": 1.02,
 "anggaran_tahunan": [
 { "tahun": 2026, "jumlah": 10865685600 },
 { "tahun": 2027, "jumlah": 11075485600 }
 ],
 "rekening_proporsi": [
 { "kode": "5.2.06.01", "nama": "Belanja Perjalanan Dinas", "persen": 15.5, "nilai": 19375000 }
 ],
 "reallocation_justifications": [
 { "rekening_nama": "Belanja...", "kode": "5.2.06.01", "aksi": "KURANGI", "alasan_dikurangi": "...", "nilai_dikurangi": 5000000 }
 ],
 "findings": [
 { "finding_type": "Kepatuhan e-SSH", "status": "Sesuai", "description": "..." }
 ]
}`;

  let jsonResult = null;

  try {
    updateProgressBar(80, "Layanan AI sedang mengevaluasi SROI...");

    const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';

    const response = await apiFetch("/api/v1/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      credentials: "include",
      body: JSON.stringify({
        text: pdfText,
        engineId: engine,
        rules: state.rules.filter(r => r.active).map(r => ({ name: r.name, desc: r.desc }))
      })
    });

    jsonResult = await response.json();

    if (!response.ok || jsonResult.error) {
      throw new Error(jsonResult.error || "Gagal menghubungi server AI");
    }

  } catch (apiError) {
    console.warn("AI Service API failed:", apiError);
    throw apiError;
  }

  return mapAiJsonToAnalysis(jsonResult, { fileName, fileSize });
}

function recalculateSroiLocal() {
  const data = state.activeAnalysis;
  if (!data) return;

  const pagu = Number(data.pagu);
  const outcome = Number(data.outcome);
  const deadweight = Number(data.deadweight ?? 15);
  const attribution = Number(data.attribution ?? 0);
  const displacement = Number(data.displacement ?? 0);
  const dropOff = Number(data.dropOff ?? 10);
  const discountRate = Number(data.discountRate ?? 5);
  const benefitDurationYears = Number(data.benefitDurationYears ?? 1);

  if (isNaN(pagu) || pagu <= 0) {
    showNotification("Pagu Tidak Valid", "Pagu anggaran harus angka positif.", "danger");
    return;
  }

  const calc = computeSroi16Rules({
    pagu,
    outcome,
    deadweight,
    attribution,
    displacement,
    dropOff,
    discountRate,
    benefitDurationYears
  });

  data.netImpact = calc.netImpact;
  data.pvImpact = calc.pvImpact;
  data.sroi = calc.sroiRatio;
  data.sroiRatioText = calc.sroiRatioText;
  data.sroiStatus = calc.sroiStatus;
  data.sroiInterpretation = calc.sroiInterpretation;
  data.kelayakan = calc.kelayakan;

  if (data.rawJson) {
    try {
      const rawObj = JSON.parse(data.rawJson);
      rawObj.pagu = pagu;
      rawObj.social_benefit_value = outcome;
      rawObj.deadweight_percentage = deadweight;
      rawObj.attribution_percentage = attribution;
      rawObj.displacement_percentage = displacement;
      rawObj.dropoff_percentage = dropOff;
      rawObj.discount_rate_percentage = discountRate;
      rawObj.total_net_impact = calc.netImpact;
      rawObj.pv_impact = calc.pvImpact;
      rawObj.sroi_ratio = calc.sroiRatio;
      rawObj.sroi_ratio_text = calc.sroiRatioText;
      rawObj.sroi_status = calc.sroiStatus;
      rawObj.sroi_interpretation = calc.sroiInterpretation;
      rawObj.inspektorat_assessment = {
        recalculated_by: state.currentRole,
        timestamp: new Date().toISOString(),
        evaluation_notes: data.catatan
      };
      data.rawJson = JSON.stringify(rawObj, null, 2);
    } catch (e) {
      console.error(e);
    }
  }
}

// ID dokumen baru = nomor tertinggi yang sudah ada + 1. Jangan pakai jumlah dokumen: setelah ada
// dokumen dihapus, jumlahnya turun sehingga ID lama terpakai ulang dan beberapa dokumen berID sama.
function generateRkaId() {
  let max = 0;
  for (const r of state.rkis) {
    const m = String(r.id || '').match(/^RKA-2026-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return 'RKA-2026-' + String(max + 1).padStart(3, '0');
}

function approveCurrentDocument() {
  const data = state.activeAnalysis;
  if (!data) return;

  recalculateSroiLocal();

  const newId = generateRkaId();
  const approvedDoc = {
    ...data,
    id: data.id === 'RKA-2026-TMP' ? newId : data.id,
    status: 'Approved'
  };

  const existIndex = state.rkis.findIndex(r => r.id === approvedDoc.id);

  // Use Promise API to avoid making approveCurrentDocument fully async if it breaks UI expectations
  const promise = (existIndex !== -1)
    ? apiFetch(`/api/v1/rkis/${approvedDoc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(approvedDoc)
    })
    : apiFetch('/api/v1/rkis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(approvedDoc)
    });

  promise.then(res => {
    if (res.ok) {
      if (existIndex !== -1) {
        state.rkis[existIndex] = approvedDoc;
      } else {
        state.rkis.unshift(approvedDoc);
      }
      showNotification("Dokumen Disahkan", "Evaluasi RKA telah berhasil disimpan dan disahkan.", "success");
    } else {
      showNotification("Gagal Mengesahkan", "Terjadi kesalahan pada server.", "danger");
    }
  }).catch(e => {
    console.error(e);
    showNotification("Error", "Gagal menghubungi server.", "danger");
  });

  state.activeAnalysis = null;
  state.currentTab = 'main-dashboard';
}

function loadHistoricalDocIntoAnalyzer(doc) {
  // reallocationEdited = daftar rekening/realokasi pernah diedit (manual / AI). Kosong berarti
  // memang dikosongkan pengguna, jadi JANGAN diisi ulang dengan data bawaan/perkiraan.
  const initialProporsi = doc.rekeningProporsi && doc.rekeningProporsi.length > 0
    ? doc.rekeningProporsi
    : (doc.reallocationEdited ? [] : parseRekeningProporsi((doc.program || '') + " " + (doc.opd || ''), doc.pagu));

  const justifications = doc.reallocationJustifications || [];

  if (justifications.length === 0 && !doc.reallocationEdited) {
    const { rekeningDikurangi, rekeningDitambah } = getRealokasiDatabase((doc.opd || '').toLowerCase(), (doc.program || '').toLowerCase(), doc.pagu, doc.sroi);
    rekeningDikurangi.forEach(r => {
      justifications.push({
        rekening_nama: r.nama,
        kode: r.kode,
        aksi: 'KURANGI',
        alasan_dikurangi: r.alasan,
        nilai_dikurangi: r.nilai
      });
    });
    rekeningDitambah.forEach(r => {
      justifications.push({
        rekening_nama: r.nama,
        kode: r.kode,
        aksi: 'TAMBAH',
        alasan_dialokasikan: r.alasan,
        nilai_ditambah: r.nilai
      });
    });
  }

  // Pastikan nilai 0 pada persentase penyesuaian tidak ter-overwrite oleh falsy fallback '||'
  const dwVal = doc.deadweight !== undefined && doc.deadweight !== null ? Number(doc.deadweight) : 15;
  const attrVal = doc.attribution !== undefined && doc.attribution !== null ? Number(doc.attribution) : 0;
  const dispVal = doc.displacement !== undefined && doc.displacement !== null ? Number(doc.displacement) : 0;
  const dropOffVal = doc.dropOff !== undefined && doc.dropOff !== null ? Number(doc.dropOff) : 10;
  const discVal = doc.discountRate !== undefined && doc.discountRate !== null ? Number(doc.discountRate) : 5;
  const durVal = doc.benefitDurationYears !== undefined && doc.benefitDurationYears !== null ? Number(doc.benefitDurationYears) : 1;

  state.activeAnalysis = {
    ...doc,
    deadweight: dwVal,
    attribution: attrVal,
    displacement: dispVal,
    dropOff: dropOffVal,
    discountRate: discVal,
    benefitDurationYears: durVal,
    originalPagu: doc.originalPagu || doc.pagu,
    originalOutcome: doc.originalOutcome || doc.outcome,
    originalDeadweight: doc.originalDeadweight !== undefined && doc.originalDeadweight !== null ? Number(doc.originalDeadweight) : dwVal,
    originalAttribution: doc.originalAttribution !== undefined && doc.originalAttribution !== null ? Number(doc.originalAttribution) : attrVal,
    originalDropOff: doc.originalDropOff !== undefined && doc.originalDropOff !== null ? Number(doc.originalDropOff) : dropOffVal,
    rekeningProporsi: initialProporsi,
    reallocationJustifications: justifications,
    rekeningProporsiUsulan: doc.rekeningProporsiUsulan && doc.rekeningProporsiUsulan.length > 0
      ? doc.rekeningProporsiUsulan
      : buildUsulanProporsi(initialProporsi, justifications, doc.originalPagu || doc.pagu || 0)
  };

  state.ocrText = `
[ARSIP DOKUMEN RKA RESMI]
ID RKA: ${doc.id}
Satuan Kerja (OPD): ${doc.opd}
Program / Sub-Kegiatan: ${doc.program}
Pagu Investasi Diusulkan: ${formatRupiah(doc.originalPagu || doc.pagu)}
Sasaran Target Output: ${doc.target}

Teks Dokumen:
Rencana Kerja Anggaran SKPD ${doc.opd} tahun anggaran 2026. Sub-Kegiatan: ${doc.program}. Pelaksanaan di Kabupaten Cirebon. Target Kuantitatif Rencana: ${doc.target}. Output dampak sosial berupa: ${doc.outcomeDesc}.

Rekomendasi Evaluator:
${doc.catatan || 'Belum ada catatan tambahan.'}
 `;
  state.ocrStatus = "Arsip Dokumen Termuat";

  state.currentTab = 'analyzer';
}

function downloadLaporanEvaluasi() {
  if (!state.activeAnalysis) {
    showNotification("Belum Ada Data", "Silakan unggah dan analisis dokumen RKA terlebih dahulu.", "warning");
    return;
  }

  const element = document.getElementById('pdf-template');
  if (!element) {
    showNotification("Elemen Tidak Ditemukan", "Tidak dapat menemukan konten template laporan PDF.", "warning");
    return;
  }

  const filename = `Laporan_SROI_${state.activeAnalysis.id || 'export'}.pdf`;

  // Tampilkan template secara sementara untuk rendering
  const originalDisplay = element.style.display;
  element.style.display = 'block';

  html2pdf()
    .set({
      margin: 12,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'] }
    })
    .from(element)
    .outputPdf('bloburl')
    .then((pdfUrl) => {
      element.style.display = originalDisplay;
      window.open(pdfUrl, '_blank');
      showNotification(
        "Laporan berhasil dibuat.",
        "Preview PDF telah dibuka. Silakan cetak atau simpan dokumen.",
        "success"
      );
    })
    .catch((err) => {
      element.style.display = originalDisplay;
      console.error('html2pdf error:', err);
      showNotification("Gagal Mengunduh PDF", "Terjadi kesalahan saat menghasilkan PDF. Silakan coba lagi.", "danger");
    });
}


async function saveRki(analysisObj) {
  if (!analysisObj) return;
  const id = analysisObj.id;
  try {
    // Cek apakah sudah ada di backend (update) atau belum (create)
    const existing = state.rkis.find(r => r.id === id);
    let res;
    if (existing) {
      res = await apiFetch(`/api/v1/rkis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(analysisObj)
      });
    } else {
      res = await apiFetch('/api/v1/rkis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(analysisObj)
      });
    }
    if (res.ok) {
      const saved = await res.json();
      const idx = state.rkis.findIndex(r => r.id === id);
      if (idx !== -1) {
        state.rkis[idx] = saved;
      } else {
        state.rkis.unshift(saved);
      }
      showNotification('Data Tersimpan', 'Dokumen RKA berhasil disimpan ke server.', 'success');
      return saved;
    } else {
      showNotification('Gagal Menyimpan', 'Tidak dapat menyimpan data ke server.', 'danger');
    }
  } catch (err) {
    console.error(err);
    showNotification('Error', 'Tidak dapat menghubungi server.', 'danger');
  }
}

async function deleteRki(id) {
  try {
    const res = await apiFetch(`/api/v1/rkis/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      const idx = state.rkis.findIndex(r => r.id === id);
      if (idx !== -1) {
        state.rkis.splice(idx, 1);
        showNotification('Dokumen Dihapus', 'Dokumen berhasil dihapus dari arsip.', 'success');
      }
    } else {
      showNotification('Gagal', 'Gagal menghapus dari server.', 'danger');
    }
  } catch (err) {
    console.error(err);
    showNotification('Error', 'Tidak dapat menghubungi server.', 'danger');
  }
}

/**
 * Hapus banyak dokumen sekaligus (pilih beberapa / hapus semua).
 * Memakai endpoint massal; bila backend belum memilikinya (404) otomatis
 * jatuh ke penghapusan satu per satu. Mengembalikan { deleted, failed }.
 */
async function deleteRkiBulk(ids) {
  const uniq = [...new Set((ids || []).map(String))];
  if (uniq.length === 0) return { deleted: [], failed: [] };

  let deleted = [];
  let alreadyGone = [];
  let failed = [];

  try {
    const res = await apiFetch('/api/v1/rkis/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: uniq })
    });

    if (res.status === 404 || res.status === 405) {
      // Backend lama tanpa endpoint massal → hapus satu per satu.
      for (const id of uniq) {
        const r = await apiFetch(`/api/v1/rkis/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
        if (r.ok) deleted.push(id);
        else if (r.status === 404) alreadyGone.push(id);
        else failed.push(id);
      }
    } else {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server menjawab ${res.status}`);
      deleted = data.deleted || [];
      alreadyGone = data.notFound || [];
      failed = data.forbidden || [];
    }
  } catch (err) {
    console.error(err);
    showNotification('Gagal Menghapus', err.message || 'Tidak dapat menghubungi server.', 'danger');
    return { deleted: [], failed: uniq };
  }

  // Sinkronkan tampilan lokal (dokumen yang sudah tidak ada di server ikut dibuang).
  const gone = new Set([...deleted, ...alreadyGone]);
  if (gone.size > 0) {
    state.rkis = state.rkis.filter(r => !gone.has(String(r.id)));
    if (state.activeAnalysis && gone.has(String(state.activeAnalysis.id))) state.activeAnalysis = null;
    markArsipSynced();
  }

  if (failed.length === 0) {
    showNotification('Dokumen Dipindahkan ke Sampah', `${gone.size} dokumen dipindahkan ke tab Sampah dan bisa dikembalikan.`, 'success');
  } else {
    showNotification(
      gone.size > 0 ? 'Sebagian Dokumen Dihapus' : 'Gagal Menghapus',
      `${gone.size} dokumen dihapus, ${failed.length} gagal (tidak ada izin atau kesalahan server).`,
      'warning'
    );
  }
  return { deleted: [...gone], failed };
}

async function updateRkiMetadata(id, updates) {
  try {
    const res = await apiFetch(`/api/v1/rkis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedRka = await res.json();
      const idx = state.rkis.findIndex(r => r.id === id);
      if (idx !== -1) {
        state.rkis[idx] = updatedRka;
        showNotification('Dokumen Diperbarui', 'Metadata dokumen berhasil disimpan.', 'success');
      }
    } else {
      showNotification('Gagal', 'Gagal memperbarui data di server.', 'danger');
    }
  } catch (err) {
    console.error(err);
    showNotification('Error', 'Tidak dapat menghubungi server.', 'danger');
  }
}

// Fitur Re-analisis / Unggah Ulang Berkas PDF untuk memperbaiki analisis yang kacau (Dapat diakses seluruh role)
async function reanalyzeDocWithPdf(targetId, file, onProgress = () => { }) {
  if (!file || !targetId) {
    throw new Error("Berkas PDF atau target dokumen tidak valid.");
  }

  const existingIdx = state.rkis.findIndex(r => r.id === targetId);
  const existingDoc = existingIdx !== -1 ? state.rkis[existingIdx] : null;

  onProgress(10, "Membaca berkas PDF...");
  const arrayBuffer = await file.arrayBuffer();
  const typedarray = new Uint8Array(arrayBuffer);

  onProgress(30, "Mengekstrak teks dokumen PDF...");
  const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
  let textContent = "";
  let maxPages = Math.min(pdf.numPages, MAX_PDF_PAGES);

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    const strings = text.items.map(item => item.str);
    textContent += strings.join(" ") + "\n";
    const prog = 30 + Math.round((i / maxPages) * 35);
    onProgress(prog, `Mengekstrak halaman ${i} dari ${pdf.numPages}...`);
  }

  if (textContent.trim().length === 0) {
    textContent = `Rencana Kerja dan Anggaran (RKA) SKPD Kabupaten Cirebon\nDokumen: ${file.name}\nCatatan: PDF hasil pindai/gambar tanpa teks digital.`;
  }

  onProgress(70, "Layanan AI sedang mengevaluasi ulang SROI...");
  const analysisObj = await processWithAIService(textContent, file.name, file.size);

  // Sanitasi OPD agar bersih
  analysisObj.opd = cleanOpdName(analysisObj.opd);
  analysisObj.perangkatDaerah = cleanOpdName(analysisObj.perangkatDaerah || analysisObj.opd);

  // Pertahankan ID asli dan perbarui metadata berkas
  analysisObj.id = targetId;
  analysisObj.namaDokumen = file.name;
  analysisObj.ukuranBerkas = file.size;
  analysisObj.ukuranFile = file.size;
  analysisObj.tanggalUpload = new Date().toISOString();

  // Jika dokumen lama memiliki riwayat versi, tambahkan log snapshot versi baru
  if (existingDoc && Array.isArray(existingDoc.versions) && existingDoc.versions.length > 0) {
    const verNum = existingDoc.versions.length + 1;
    analysisObj.versions = [
      ...existingDoc.versions,
      {
        id: `v${verNum}`,
        versionName: `v${verNum} (Unggah Ulang PDF)`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.value?.name || currentUser.value?.username || 'User',
        summary: `Analisis ulang otomatis dari berkas ${file.name}`,
        snapshot: { ...analysisObj }
      }
    ];
  }

  // Perbarui teks PDF tersimpan (dipakai tombol "Muat Ulang PDF")
  analysisObj.sourceText = textContent;

  onProgress(90, "Menyimpan pembaruan analisis ke server...");
  const res = await apiFetch(`/api/v1/rkis/${targetId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(analysisObj)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Gagal menyimpan pembaruan ke server (${res.status})`);
  }

  const updatedDoc = await res.json();

  if (existingIdx !== -1) {
    state.rkis[existingIdx] = updatedDoc;
  }
  if (state.activeAnalysis && state.activeAnalysis.id === targetId) {
    state.activeAnalysis = updatedDoc;
  }

  onProgress(100, "Selesai dianalisis ulang!");
  showNotification(
    "Analisis Ulang Selesai",
    `Dokumen "${updatedDoc.namaDokumen || updatedDoc.program}" berhasil dianalisis ulang dengan hasil SROI terbaru.`,
    "success"
  );

  try {
    await apiFetch('/api/v1/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'REUPLOAD_RKA',
        target: updatedDoc.namaDokumen || updatedDoc.id,
        details: `Unggah ulang dan analisis ulang PDF (${(file.size / 1024).toFixed(1)} KB) berhasil`,
        status: 'SUCCESS',
        username: currentUser.value?.username,
        name: currentUser.value?.name,
        role: currentUser.value?.role
      })
    });
  } catch { }

  return updatedDoc;
}

// Susun teks dari hasil analisis yang sudah tersimpan (dipakai HANYA bila teks PDF asli
// belum pernah tersimpan, mis. dokumen lama). Tiap nilai dipotong agar field yang
// terlanjur berisi teks PDF panjang/kacau tidak membanjiri AI.
function buildTextFromSavedAnalysis(doc) {
  const clip = (v, n = 1500) => String(v ?? '-').replace(/\s+/g, ' ').trim().slice(0, n) || '-';
  const lines = [
    `OPD/Perangkat Daerah: ${clip(doc.opd || doc.perangkatDaerah, 300)}`,
    `Program: ${clip(doc.program || doc.namaProgram, 400)}`,
    `Kegiatan: ${clip(doc.kegiatan || doc.namaKegiatan, 400)}`,
    `Sub Kegiatan: ${clip(doc.subKegiatan, 400)}`,
    `Tahun Rencana: ${clip(doc.tahunRencana || doc.tahun, 20)}`,
    `Pagu Anggaran: ${Number(doc.pagu) || 0}`,
    `Target Kuantitatif: ${clip(doc.targetKuantitatif || doc.target, 400)}`,
    `Deskripsi Outcome: ${clip(doc.justifikasiOutcome || doc.outcomeDesc)}`,
    `Lokasi: ${clip(doc.lokasi, 300)}`,
    `Sumber Dana: ${clip(doc.sumberDana, 200)}`
  ];
  if (Array.isArray(doc.anggaranTahunan) && doc.anggaranTahunan.length) {
    lines.push('Anggaran per Tahun:');
    doc.anggaranTahunan.forEach(a => lines.push(`- ${a.tahun}: ${a.jumlah}`));
  }
  if (Array.isArray(doc.rekeningProporsi) && doc.rekeningProporsi.length) {
    lines.push('Rincian Rekening Belanja:');
    doc.rekeningProporsi.forEach(r => lines.push(`- ${clip(r.kode, 40)} ${clip(r.nama, 200)}: ${r.nilai || 0} (${r.persen || 0}%)`));
  }
  if (Array.isArray(doc.indikatorKinerja) && doc.indikatorKinerja.length) {
    lines.push('Indikator Kinerja:');
    doc.indikatorKinerja.forEach(i => lines.push(`- ${clip(i.level, 60)}: ${clip(i.tolok_ukur || i.tolokUkur, 200)} → ${clip(i.target, 100)}`));
  }
  return lines.join('\n');
}

// ── Muat Ulang PDF ───────────────────────────────────────────────────
// Analisis AI dijalankan ulang memakai teks PDF yang SUDAH tersimpan di server —
// pengguna tidak perlu mengunggah PDF lagi. Hasilnya disimpan sebagai versi baru
// (versi lama tetap ada di riwayat) dan langsung dikembalikan untuk ditampilkan.
async function regenerateDocFromStoredText(targetId, onProgress = () => { }, { allowFallback = false } = {}) {
  const existingDoc = state.rkis.find(r => r.id === targetId);
  if (!existingDoc) throw new Error('Dokumen tidak ditemukan di arsip.');

  onProgress(10, 'Mengambil teks PDF yang tersimpan...');
  let sourceText = '';
  let usedFallback = false;
  const srcRes = await apiFetch(`/api/v1/rkis/${encodeURIComponent(targetId)}/source-text`, {
    credentials: 'include'
  });
  const src = await srcRes.json().catch(() => ({}));
  if (srcRes.ok && src.text) {
    sourceText = src.text;
  } else if (allowFallback && (srcRes.status === 404 || srcRes.status === 409)) {
    // Teks PDF asli belum tersimpan (dokumen lama) → pakai data hasil analisis yang ada.
    sourceText = buildTextFromSavedAnalysis(existingDoc);
    usedFallback = true;
  } else {
    throw new Error(src.error || `Teks PDF tersimpan tidak tersedia (${srcRes.status}).`);
  }

  onProgress(40, 'Layanan AI sedang mengevaluasi ulang SROI...');
  const analysisObj = await processWithAIService(
    sourceText,
    existingDoc.namaDokumen,
    existingDoc.ukuranFile || existingDoc.ukuranBerkas || 0
  );

  // Bila server jatuh ke Smart Heuristic (AI gagal/kuota habis), jangan timpa hasil lama.
  let metode = '';
  try { metode = JSON.parse(analysisObj.rawJson || '{}')._metode || ''; } catch { }
  if (metode === 'heuristic') {
    throw new Error('Layanan AI belum bisa memproses saat ini (kuota/koneksi). Hasil analisis lama tidak diubah — silakan coba lagi nanti.');
  }

  // Pertahankan identitas & status dokumen; hanya isi hasil analisis yang diperbarui.
  analysisObj.opd = cleanOpdName(analysisObj.opd);
  analysisObj.perangkatDaerah = cleanOpdName(analysisObj.perangkatDaerah || analysisObj.opd);
  analysisObj.id = targetId;
  analysisObj.namaDokumen = existingDoc.namaDokumen;
  analysisObj.ukuranFile = existingDoc.ukuranFile || 0;
  analysisObj.ukuranBerkas = existingDoc.ukuranBerkas || existingDoc.ukuranFile || 0;
  analysisObj.tanggalUpload = existingDoc.tanggalUpload || analysisObj.tanggalUpload;
  analysisObj.status = existingDoc.status || analysisObj.status;
  analysisObj.catatan = existingDoc.catatan || '';
  analysisObj.reallocationEdited = false;

  onProgress(85, 'Menyimpan hasil sebagai versi baru...');
  const result = await saveManualVersion(targetId, {
    parentVersionId: existingDoc.activeVersionId,
    changesSummary: usedFallback
      ? 'Analisis AI dijalankan ulang dari data hasil analisis sebelumnya (teks PDF asli belum tersimpan) — Muat Ulang PDF.'
      : 'Analisis AI dijalankan ulang dari teks PDF yang tersimpan (Muat Ulang PDF).',
    data: analysisObj,
    createdBy: currentUser.value?.name || currentUser.value?.username || 'User',
    source: 'muat-ulang-pdf'
  });
  if (!result || !result.rka) {
    throw new Error('Gagal menyimpan hasil analisis ulang ke server.');
  }

  onProgress(100, 'Selesai!');
  try {
    await apiFetch('/api/v1/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'REUPLOAD_RKA',
        target: result.rka.namaDokumen || result.rka.id,
        details: 'Muat Ulang PDF: analisis AI dijalankan ulang dari teks PDF tersimpan',
        status: 'SUCCESS',
        username: currentUser.value?.username,
        name: currentUser.value?.name,
        role: currentUser.value?.role
      })
    });
  } catch { }

  return result.rka;
}

/* ==========================================================================
 Agentic AI Engine & Versioning Methods
 ========================================================================== */

function saveGptApiKey(key) {
  if (key && key.trim()) {
    state.gptApiKey = key.trim();
    localStorage.setItem('GPT_API_KEY', key.trim());
    localStorage.setItem('OPENAI_API_KEY', key.trim());
    showNotification('GPT API Key Disimpan', 'Konfigurasi otak AI Agent berhasil disimpan.', 'success');
  }
}

function deleteGptApiKey() {
  state.gptApiKey = '';
  localStorage.removeItem('GPT_API_KEY');
  localStorage.removeItem('OPENAI_API_KEY');
  showNotification('GPT API Key Dihapus', 'Kunci API OpenAI telah dihapus.', 'info');
}

async function runAgentAudit(rkaData, forceRefresh = false) {
  if (!rkaData) return null;
  const gptKey = state.gptApiKey || localStorage.getItem('GPT_API_KEY') || localStorage.getItem('OPENAI_API_KEY') || '';
  const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';

  state.agentReviewLoading = true;
  state.agentReviewResult = null;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (gptKey) headers['x-gpt-key'] = gptKey;
    if (geminiKey) headers['x-api-key'] = geminiKey;

    const res = await apiFetch('/api/v1/agentic-ai/review', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        rkaData,
        tahun: rkaData.tahun || '2026',
        rules: state.rules.filter(r => r.active),
        forceRefresh
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Gagal menjalankan audit Agentic AI.');
    }

    state.agentReviewResult = data.review;

    if (data.fallbackNotice) {
      showNotification('Status Engine AI', data.fallbackNotice, 'warning');
    } else if (data.cached) {
      showNotification('Audit Dimuat dari Cache', `Skor Kesehatan RKA: ${data.review.health_score}/100 (${data.review.overall_status})`, 'info');
    } else {
      showNotification('Audit Selesai', `Skor Kesehatan RKA: ${data.review.health_score}/100 (${data.modelUsed || 'AI Engine'})`, 'success');
    }

    // Save review to local rka item if cached
    const idx = state.rkis.findIndex(r => r.id === rkaData.id);
    if (idx !== -1) {
      state.rkis[idx].agentReviewResult = data.review;
      state.rkis[idx].agentReviewModel = data.modelUsed;
      state.rkis[idx].agentReviewTimestamp = data.auditedAt;
    }

    return data;

  } catch (err) {
    console.error('runAgentAudit error:', err);
    showNotification('Audit Gagal', err.message, 'danger');
    return null;
  } finally {
    state.agentReviewLoading = false;
  }
}

async function applyAgentAction({ rkaData, instruction, actionType, customChanges, targetVersionName }) {
  if (!rkaData) return null;
  const gptKey = state.gptApiKey || localStorage.getItem('GPT_API_KEY') || localStorage.getItem('OPENAI_API_KEY') || '';
  const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';

  state.agentActionLoading = true;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (gptKey) headers['x-gpt-key'] = gptKey;
    if (geminiKey) headers['x-api-key'] = geminiKey;

    const res = await apiFetch('/api/v1/agentic-ai/action', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        rkaData,
        instruction,
        actionType,
        customChanges,
        targetVersionName
      })
    });

    const result = await res.json();
    if (!res.ok || result.error) {
      throw new Error(result.error || 'Gagal menerapkan aksi Agentic AI.');
    }

    // Update in local state.rkis
    const idx = state.rkis.findIndex(r => r.id === rkaData.id);
    if (idx !== -1 && result.updatedRka) {
      state.rkis[idx] = result.updatedRka;
    }

    // If active analysis is current RKA, update it
    if (state.activeAnalysis && state.activeAnalysis.id === rkaData.id) {
      loadHistoricalDocIntoAnalyzer(result.updatedRka);
    }

    showNotification('Versi Baru Disimpan', `Versi ${result.newVersion.versionName} berhasil dibuat tanpa menimpa data original.`, 'success');
    return result;

  } catch (err) {
    console.error('applyAgentAction error:', err);
    showNotification('Aksi Gagal', err.message, 'danger');
    return null;
  } finally {
    state.agentActionLoading = false;
  }
}

async function saveManualVersion(rkaId, { parentVersionId, versionName, changesSummary, data, createdBy, source, modifications }) {
  try {
    const res = await apiFetch(`/api/v1/rkis/${rkaId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        parentVersionId,
        versionName,
        changesSummary,
        data,
        createdBy: createdBy || 'Pengguna (Agentic AI Studio)',
        source: source || 'agentic-ai',
        modifications: modifications || []
      })
    });

    const result = await res.json();
    if (!res.ok || result.error) throw new Error(result.error || 'Gagal membuat versi baru.');

    const idx = state.rkis.findIndex(r => r.id === rkaId);
    if (idx !== -1 && result.rka) {
      state.rkis[idx] = result.rka;
    }

    if (state.activeAnalysis && state.activeAnalysis.id === rkaId) {
      loadHistoricalDocIntoAnalyzer(result.rka);
    }

    showNotification('Versi Baru Disimpan', `Versi ${result.version.versionName} berhasil disimpan ke database.`, 'success');
    return result;
  } catch (err) {
    console.error('saveManualVersion error:', err);
    showNotification('Gagal Menyimpan Versi', err.message, 'danger');
    return null;
  }
}

// Menyusun ulang hasil analisis dokumen yang SUDAH ADA (tanpa unggah ulang PDF)
// agar formatnya sesuai template standar hasil analisis (skema /api/v1/evaluate),
// lalu menyimpannya sebagai versi baru (data asli & riwayat versi tidak hilang).
async function regenerateAnalysisWithAiTemplate(rkaItem) {
  if (!rkaItem) return null;
  state.aiTemplateRegenerateLoading = true;

  try {
    // Ubah data hasil analisis yang sudah ada menjadi teks terstruktur,
    // supaya AI bisa menganalisis ulang & menyusunnya sesuai skema template baku.
    const lines = [];
    lines.push(`OPD/Perangkat Daerah: ${rkaItem.opd || rkaItem.perangkatDaerah || '-'}`);
    lines.push(`Program: ${rkaItem.program || rkaItem.namaProgram || '-'}`);
    lines.push(`Kegiatan: ${rkaItem.kegiatan || rkaItem.namaKegiatan || '-'}`);
    lines.push(`Sub Kegiatan: ${rkaItem.subKegiatan || '-'}`);
    lines.push(`Tahun Rencana: ${rkaItem.tahunRencana || rkaItem.tahun || '-'}`);
    lines.push(`Pagu Anggaran: ${rkaItem.pagu || 0}`);
    lines.push(`Target Kuantitatif: ${rkaItem.targetKuantitatif || rkaItem.target || '-'}`);
    lines.push(`Deskripsi Outcome: ${rkaItem.justifikasiOutcome || rkaItem.outcomeDesc || '-'}`);
    lines.push(`Estimasi Nilai Manfaat Sosial: ${rkaItem.outcome || 0}`);
    lines.push(`Lokasi: ${rkaItem.lokasi || '-'}`);
    lines.push(`Sumber Dana: ${rkaItem.sumberDana || '-'}`);

    if (Array.isArray(rkaItem.anggaranTahunan) && rkaItem.anggaranTahunan.length) {
      lines.push('Anggaran per Tahun:');
      rkaItem.anggaranTahunan.forEach(a => lines.push(`- ${a.tahun}: ${a.jumlah}`));
    }
    if (Array.isArray(rkaItem.rekeningProporsi) && rkaItem.rekeningProporsi.length) {
      lines.push('Rincian Rekening Belanja:');
      rkaItem.rekeningProporsi.forEach(r => lines.push(`- ${r.kode || ''} ${r.nama || ''}: ${r.nilai || 0} (${r.persen || 0}%)`));
    }
    if (Array.isArray(rkaItem.indikatorKinerja) && rkaItem.indikatorKinerja.length) {
      lines.push('Indikator Kinerja:');
      rkaItem.indikatorKinerja.forEach(i => lines.push(`- ${i.level || ''}: ${i.tolok_ukur || i.tolokUkur || ''} → ${i.target || ''}`));
    }

    const sourceText = lines.join('\n');
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';

    const response = await apiFetch('/api/v1/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      credentials: 'include',
      body: JSON.stringify({
        text: sourceText,
        tahun: rkaItem.tahunRencana || rkaItem.tahun,
        rules: state.rules.filter(r => r.active).map(r => ({ name: r.name, desc: r.desc }))
      })
    });

    const jsonResult = await response.json();
    if (!response.ok || jsonResult.error) {
      throw new Error(jsonResult.error || 'Gagal menghubungi layanan AI.');
    }

    const regenerated = mapAiJsonToAnalysis(jsonResult, {
      id: rkaItem.id,
      fileName: rkaItem.namaDokumen,
      fileSize: rkaItem.ukuranFile,
      tanggalUpload: rkaItem.tanggalUpload,
      tahun: rkaItem.tahun,
      tahunRencana: rkaItem.tahunRencana,
      status: rkaItem.status,
      catatan: rkaItem.catatan
    });

    const result = await saveManualVersion(rkaItem.id, {
      parentVersionId: rkaItem.activeVersionId,
      versionName: 'Disusun Ulang AI (Template)',
      changesSummary: 'Hasil analisis disusun ulang otomatis oleh AI agar sesuai format template standar hasil analisis SROI, tanpa mengunggah ulang PDF.',
      data: regenerated,
      createdBy: (currentUser.value && (currentUser.value.username || currentUser.value.name)) || 'AI Template Generator',
      source: 'ai-template',
      modifications: []
    });

    return result;
  } catch (err) {
    console.error('regenerateAnalysisWithAiTemplate error:', err);
    showNotification('Gagal Menyusun Ulang', err.message, 'danger');
    return null;
  } finally {
    state.aiTemplateRegenerateLoading = false;
  }
}

async function switchRkaVersion(rkaId, versionId) {
  try {
    const res = await apiFetch(`/api/v1/rkis/${rkaId}/versions/${versionId}/activate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ actor: state.currentRole === 'inspektorat' ? 'Inspektorat' : 'ASN (Analis Kebijakan)' })
    });

    const result = await res.json();
    if (!res.ok || result.error) throw new Error(result.error || 'Gagal mengaktifkan versi.');

    const idx = state.rkis.findIndex(r => r.id === rkaId);
    if (idx !== -1 && result.rka) {
      state.rkis[idx] = result.rka;
    }

    if (state.activeAnalysis && state.activeAnalysis.id === rkaId) {
      loadHistoricalDocIntoAnalyzer(result.rka);
    }

    showNotification('Versi Aktif Diubah', `Versi aktif saat ini: ${result.activeVersion.versionName}`, 'info');
    return result;
  } catch (err) {
    console.error('switchRkaVersion error:', err);
    showNotification('Gagal Mengganti Versi', err.message, 'danger');
    return null;
  }
}

function openInAgenticAi(rkaItem) {
  if (!rkaItem) return;
  state.agentSelectedRkaId = rkaItem.id;
  state.agentSelectedVersionId = rkaItem.activeVersionId || (rkaItem.versions?.[rkaItem.versions.length - 1]?.versionId) || 'v1.0';
  state.agentReviewResult = null;
  state.currentTab = 'agentic-ai';
}

function openHasilPenalaranSroi(rkaItem) {
  if (!rkaItem) return;
  loadHistoricalDocIntoAnalyzer(rkaItem);
}

function loadSpecificVersionIntoAnalyzer(rkaItem, versionId) {
  if (!rkaItem) return;
  const versions = rkaItem.versions || [];
  const targetVer = versions.find(v => v.versionId === versionId);
  const dataToLoad = targetVer ? { ...targetVer.data, activeVersionId: versionId, selectedVersionName: targetVer.versionName } : rkaItem;
  loadHistoricalDocIntoAnalyzer(dataToLoad);
}

// ── Evaluasi 6 Aspek Efisiensi & Efektivitas RKA ──────────────────────
// Mengembalikan evaluasi 6-aspek yang sudah dihasilkan AI (evaluasi_rka dari
// server.js) jika tersedia. Jika tidak (mis. dokumen lama yang dianalisis
// sebelum fitur ini ada), hitung fallback deterministik dari data yang sudah
// tersimpan pada rka (rekeningProporsi) agar UI tetap dapat menampilkan
// sesuatu yang bermakna alih-alih kosong.
export function computeRkaEvaluasi(rka) {
  if (rka && rka.evaluasiRka) {
    return rka.evaluasiRka;
  }
  if (rka && rka.evaluasi_rka) {
    return rka.evaluasi_rka;
  }

  // Hitung proporsi belanja penunjang secara dinamis dari rka.rekeningProporsi
  const rekening = (rka && rka.rekeningProporsi) ? rka.rekeningProporsi : [];
  let supportPersen = 0;

  if (rekening.length > 0) {
    const supportKeywords = ['perjalanan', 'konsumsi', 'makan', 'minum', 'atk', 'cetak', 'spanduk', 'banner', 'sewa gedung', 'operasional kantor'];
    const supportItems = rekening.filter(r =>
      supportKeywords.some(kw => (r.nama || '').toLowerCase().includes(kw))
    );
    supportPersen = supportItems.reduce((sum, r) => sum + (Number(r.persen) || 0), 0);
  }

  const isEfisiensiAlokasiEfisien = supportPersen <= 15;

  return {
    efisiensi_alokasi: {
      status: isEfisiensiAlokasiEfisien ? "Efisien" : "Memerlukan Penyesuaian Alokasi",
      alasan: isEfisiensiAlokasiEfisien
        ? "Proporsi belanja penunjang berada dalam batas efisiensi yang ditetapkan, sehingga porsi utama anggaran teralokasi untuk belanja utama program."
        : "Proporsi belanja penunjang operasional melebihi batas efisiensi 15% dari total pagu.",
      temuan: isEfisiensiAlokasiEfisien
        ? "Anggaran RKA teralokasi secara dominan pada komponen belanja utama yang mendukung pencapaian keluaran (output) program."
        : "Terdapat pos belanja penunjang yang berpotensi rasionalisasi untuk meningkatkan alokasi belanja utama.",
      risiko: isEfisiensiAlokasiEfisien
        ? "Risiko pemborosan pada belanja penunjang tergolong rendah."
        : "Risiko berkurangnya alokasi belanja utama yang berdampak langsung pada keluaran program.",
      rekomendasi: isEfisiensiAlokasiEfisien
        ? "Pertahankan proporsi alokasi belanja utama dan belanja penunjang ini."
        : "Lakukan pengalihan sebagian belanja penunjang ke belanja utama."
    },
    distribusi_rpd: {
      status: "Belum Dapat Dinilai",
      alasan: "Data Rencana Penarikan Dana (RPD) per triwulan tidak ditemukan pada dokumen ini.",
      temuan: "Dokumen RKA yang dianalisis tidak memuat rincian jadwal RPD triwulanan.",
      risiko: "Potensi penumpukan pencairan dana di akhir tahun belum dapat dipastikan.",
      rekomendasi: "Lengkapi rincian RPD triwulanan pada dokumen untuk penilaian yang lebih akurat."
    },
    kepatuhan_ssh_sbm: {
      status: "Belum Dapat Dinilai",
      alasan: "Data pembanding SSH (Standar Satuan Harga) dan SBM (Standar Biaya Masukan) belum dikonfigurasi untuk tahun anggaran dokumen ini.",
      temuan: "Harga satuan pada rincian belanja belum dapat disandingkan dengan standar harga resmi.",
      risiko: "Potensi timbulnya ketidaksesuaian harga satuan dengan ketentuan standar biaya yang berlaku.",
      rekomendasi: "Konfigurasikan data SSH aktif untuk tahun anggaran ini pada menu SSH agar validasi harga satuan lebih akurat."
    },
    efisiensi_realisasi_kinerja: {
      status: "Belum Dapat Dinilai",
      alasan: "Data realisasi anggaran dan keluaran (output) belum tersedia dalam dokumen RKA.",
      temuan: "Belum ada data realisasi yang dapat digunakan untuk mengalkulasi rasio efisiensi biaya output terhadap kinerja.",
      risiko: "Efisiensi penggunaan anggaran dalam menghasilkan keluaran belum dapat diukur pada tahap perencanaan.",
      rekomendasi: "Lengkapi data realisasi anggaran dan keluaran (output) setelah kegiatan dilaksanakan."
    },
    efektivitas_aktual: {
      status: "Belum Dapat Dinilai",
      alasan: "Realisasi keluaran (output) maupun hasil (outcome) belum tersedia karena kegiatan belum dilaksanakan.",
      temuan: "Dokumen RKA memuat target keluaran, tetapi data realisasinya belum ada.",
      risiko: "Tingkat pencapaian target aktual belum dapat dipastikan sebelum kegiatan berjalan.",
      rekomendasi: "Catat data realisasi keluaran (output) dan hasil (outcome) setelah kegiatan dilaksanakan."
    },
    potensi_inefektivitas: {
      status: "Sedang",
      alasan: "Belum ditemukan indikasi kuat penumpukan RPD atau proyeksi ketidaktercapaian target pada data yang tersedia.",
      temuan: "Data yang tersedia belum cukup untuk memastikan risiko inefektivitas secara pasti.",
      risiko: "Risiko keterlambatan atau penurunan kualitas capaian belum dapat diukur secara pasti.",
      rekomendasi: "Lengkapi data RPD triwulanan dan data realisasi untuk penilaian risiko yang lebih akurat."
    }
  };
}

export function useAnalysis() {
  return {
    ...toRefs(state),
    notificationsList,
    // Auth
    isLoggedIn,
    currentUser,
    checkSession,
    connectRealtimeAfterLogin,
    logout,
    // Kontrol Menu (admin)
    menuConfig,
    isMenuEnabled,
    loadMenuConfig,
    saveMenuConfig,
    MENU_KEYS,
    // Utilities
    formatRupiah,
    getSroiKelayakanColor,
    computeSroi16Rules,
    showNotification,
    removeNotification,
    deleteNotifHistory,
    clearNotifHistory,
    handleRkaFiles,
    recalculateSroiLocal,
    approveCurrentDocument,
    loadHistoricalDocIntoAnalyzer,
    downloadLaporanEvaluasi,
    getRealokasiDatabase,
    buildUsulanProporsi,
    saveRki,
    deleteRki,
    deleteRkiBulk,
    updateRkiMetadata,
    saveGptApiKey,
    deleteGptApiKey,
    runAgentAudit,
    applyAgentAction,
    saveManualVersion,
    regenerateAnalysisWithAiTemplate,
    switchRkaVersion,
    openInAgenticAi,
    openHasilPenalaranSroi,
    loadSpecificVersionIntoAnalyzer,
    // Backup & Restore & Export
    downloadFullBackupHtml,
    downloadFullBackupJson,
    downloadUserBackup,
    downloadUserBackupJson,
    restoreDatabase,
    importBackupMerge,
    // Riwayat versi dokumen & sampah (pemulihan dokumen tak sengaja terhapus/tertimpa)
    fetchRkaHistory,
    restoreRkaVersion,
    fetchTrash,
    restoreFromTrash,
    restoreTrashBulk,
    purgeTrashItem,
    // Sinkronisasi arsip (indikator + muat ulang manual/otomatis)
    arsipLastSyncAt,
    arsipSyncing,
    arsipSyncError,
    refreshArsip,
    realtimeConnected: realtime.isConnected,
    downloadAnalysisHtmlReport,
    // OPD Sanitizer & Re-Upload Analysis
    cleanOpdName,
    reanalyzeDocWithPdf,
    regenerateDocFromStoredText
  };
}

