<template>
  <div class="neon-panel">
    <!-- Info keamanan -->
    <div class="np-banner">
      <div class="np-banner-icon" aria-hidden="true">🔐</div>
      <div>
        <strong>Konfigurasi Database Neon (Slot 1–{{ view?.panelMax || 100 }})</strong><br>
        Connection string disimpan di server dan <strong>tidak pernah dikirim balik ke browser</strong> (hanya tampil
        disamarkan). Tiap slot harus <strong>project / endpoint Neon yang berbeda</strong>. Slot yang berasal dari
        environment variable (<code>DATABASE_URL</code>, dst.) dikunci dan hanya bisa diubah di dashboard hosting.
        <template v-if="view?.hostRule">
          Host yang diterima: <code>{{ view.hostRule.join(', ') }}</code>.
        </template>
      </div>
    </div>

    <div v-if="view && view.envCount === 0" class="np-banner np-banner-warn">
      <div class="np-banner-icon" aria-hidden="true">⚠️</div>
      <div>
        <strong>Belum ada <code>DATABASE_URL</code> di environment.</strong>
        Konfigurasi panel hanya tersimpan di file lokal server dan <strong>akan hilang saat redeploy</strong>
        (disk Render/Vercel bersifat sementara). Set minimal satu <code>DATABASE_URL</code> sebagai jangkar agar
        konfigurasi slot tersimpan permanen di database.
      </div>
    </div>

    <div v-if="view && view.envOverflow > 0" class="np-banner np-banner-warn">
      <div class="np-banner-icon" aria-hidden="true">ℹ️</div>
      <div>
        {{ view.envOverflow }} slot dari ENV berada di atas nomor {{ view.panelMax }} dan tidak ditampilkan di grid ini.
      </div>
    </div>

    <!-- Ringkasan -->
    <div class="np-stats" v-if="view">
      <div class="np-stat">
        <span class="np-stat-val">{{ filledCount }}<small> / {{ view.panelMax }}</small></span>
        <span class="np-stat-label">Slot terisi</span>
      </div>
      <div class="np-stat">
        <span class="np-stat-val">{{ view.activeSlot ?? '–' }}</span>
        <span class="np-stat-label">Slot aktif</span>
      </div>
      <div class="np-stat">
        <span class="np-stat-val">{{ view.poolSlots }}</span>
        <span class="np-stat-label">Slot dalam pool (aktif)</span>
      </div>
      <div class="np-stat">
        <span class="np-stat-val">v{{ view.version }}</span>
        <span class="np-stat-label">Versi konfigurasi</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="np-toolbar">
      <div class="np-chips" role="tablist" aria-label="Filter slot">
        <button v-for="f in filters" :key="f.id" role="tab" :aria-selected="filter === f.id"
          :class="['np-chip', { active: filter === f.id }]" @click="filter = f.id">
          {{ f.label }} <span class="np-chip-count">{{ f.count }}</span>
        </button>
      </div>
      <input v-model.trim="search" class="np-search" type="search" placeholder="Cari nomor / label / host…"
        aria-label="Cari slot" />
      <div class="np-toolbar-actions">
        <button class="np-btn" :disabled="loading" @click="load()">Muat ulang</button>
        <button v-if="!testAll.running" class="np-btn" :disabled="loading || filledCount === 0" @click="runTestAll">
          Tes semua slot
        </button>
        <button v-else class="np-btn np-btn-danger" @click="testAll.cancel = true">
          Hentikan ({{ testAll.done }}/{{ testAll.total }})
        </button>
        <button class="np-btn np-btn-primary" :disabled="loading || !view" @click="openBulk">
          Import massal (database_urls)
        </button>
      </div>
    </div>

    <div v-if="testAll.running" class="np-progress" role="progressbar" :aria-valuenow="testAll.done"
      :aria-valuemax="testAll.total">
      <div class="np-progress-bar" :style="{ width: (testAll.total ? (testAll.done / testAll.total) * 100 : 0) + '%' }"></div>
    </div>

    <div v-if="toast.msg" :class="['np-toast', toast.type]" role="status">{{ toast.msg }}</div>

    <div v-if="loading && !view" class="np-empty">Memuat konfigurasi slot…</div>
    <div v-else-if="loadError" class="np-empty np-error">
      {{ loadError }}
      <div><button class="np-btn" @click="load()">Coba lagi</button></div>
    </div>

    <!-- Daftar slot -->
    <div v-else-if="view" class="np-list" role="list">
      <div v-for="slot in filteredSlots" :key="slot.number"
        :class="['np-row', `src-${slot.source}`, { 'is-active': slot.active, 'is-disabled': slot.source === 'panel' && !slot.enabled }]"
        role="listitem">
        <div class="np-num" :aria-label="`Slot ${slot.number}`">{{ slot.number }}</div>

        <div class="np-main">
          <template v-if="slot.source === 'empty'">
            <span class="np-muted">Slot kosong</span>
          </template>
          <template v-else>
            <div class="np-title">
              <span class="np-label">{{ slot.label || (slot.source === 'env' ? '—' : `Slot-${slot.number}`) }}</span>
              <span v-if="slot.source === 'env'" class="np-pill pill-env" :title="`Dari environment: ${slot.envVar}`">
                ENV · {{ slot.envVar }}
              </span>
              <span v-else class="np-pill pill-panel">Panel</span>
              <span v-if="slot.active" class="np-pill pill-active">AKTIF</span>
              <span v-if="slot.source === 'panel' && !slot.enabled" class="np-pill pill-off">Nonaktif</span>
              <span v-else-if="slot.source === 'panel' && slot.enabled && !slot.inPool" class="np-pill pill-warn"
                title="Slot ini diabaikan pool (kemungkinan URL-nya duplikat dengan slot lain).">Diabaikan</span>
            </div>
            <div class="np-conn" :title="slot.connection">{{ slot.connection }}</div>
            <div v-if="slot.note" class="np-note">{{ slot.note }}</div>
            <div v-if="statusText(slot)" :class="['np-status', statusClass(slot)]">
              <span class="np-dot" aria-hidden="true"></span>{{ statusText(slot) }}
            </div>
          </template>
        </div>

        <div class="np-actions">
          <template v-if="slot.source === 'empty'">
            <button class="np-btn np-btn-sm np-btn-primary" @click="openEdit(slot)">Isi slot</button>
          </template>
          <template v-else-if="slot.source === 'env'">
            <button class="np-btn np-btn-sm" :disabled="isTesting(slot.number)" @click="testOne(slot.number)">
              {{ isTesting(slot.number) ? 'Menguji…' : 'Tes' }}
            </button>
            <span class="np-lock" title="Dikunci — berasal dari environment variable">🔒</span>
          </template>
          <template v-else>
            <button class="np-btn np-btn-sm" :disabled="isTesting(slot.number)" @click="testOne(slot.number)">
              {{ isTesting(slot.number) ? 'Menguji…' : 'Tes' }}
            </button>
            <button class="np-btn np-btn-sm" @click="openEdit(slot)">Edit</button>
            <button class="np-btn np-btn-sm" :disabled="slot.active || busyNumber === slot.number"
              :title="slot.active ? 'Slot aktif tidak bisa dinonaktifkan' : ''" @click="toggleEnabled(slot)">
              {{ slot.enabled ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
            <template v-if="confirmDelete === slot.number">
              <button class="np-btn np-btn-sm np-btn-danger" :disabled="busyNumber === slot.number"
                @click="removeSlot(slot)">Ya, hapus</button>
              <button class="np-btn np-btn-sm" @click="confirmDelete = null">Batal</button>
            </template>
            <button v-else class="np-btn np-btn-sm np-btn-ghost-danger" :disabled="slot.active"
              :title="slot.active ? 'Slot aktif tidak bisa dihapus' : ''" @click="confirmDelete = slot.number">
              Hapus
            </button>
          </template>
        </div>
      </div>

      <div v-if="filteredSlots.length === 0" class="np-empty">Tidak ada slot yang cocok.</div>
    </div>

    <!-- ═══ Modal: isi / edit satu slot ═══ -->
    <Teleport to="body">
      <div v-if="edit.open" class="np-overlay" @mousedown.self="closeEdit">
        <div class="np-modal" role="dialog" aria-modal="true" :aria-label="`Slot ${edit.number}`">
          <div class="np-modal-head">
            <h3>{{ edit.isNew ? 'Isi' : 'Edit' }} Slot {{ edit.number }}</h3>
            <button class="np-x" aria-label="Tutup" @click="closeEdit">×</button>
          </div>

          <div class="np-modal-body">
            <label class="np-field">
              <span>Connection string (database URL)</span>
              <div class="np-input-row">
                <input v-model="edit.url" :type="edit.show ? 'text' : 'password'" autocomplete="off" spellcheck="false"
                  :placeholder="edit.isNew ? 'postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require' : 'Kosongkan = pertahankan URL saat ini'" />
                <button type="button" class="np-btn np-btn-sm" @click="edit.show = !edit.show">
                  {{ edit.show ? 'Sembunyikan' : 'Tampilkan' }}
                </button>
              </div>
              <small v-if="!edit.isNew && edit.current" class="np-muted">Saat ini: {{ edit.current }}</small>
            </label>

            <div class="np-grid2">
              <label class="np-field">
                <span>Label (opsional)</span>
                <input v-model="edit.label" maxlength="40" placeholder="mis. Cadangan Singapura" />
              </label>
              <label class="np-field np-check">
                <input v-model="edit.enabled" type="checkbox" :disabled="edit.active" />
                <span>Aktifkan slot ini di pool failover</span>
              </label>
            </div>

            <label class="np-field">
              <span>Catatan (opsional)</span>
              <input v-model="edit.note" maxlength="200" placeholder="mis. akun neon: dara@..., project: sintra-3" />
            </label>

            <div v-if="edit.active" class="np-hint warn">
              Slot ini sedang <strong>aktif</strong>: URL-nya tidak bisa diganti dan tidak bisa dinonaktifkan sebelum failover ke slot lain.
            </div>

            <div v-if="edit.test" :class="['np-hint', edit.test.ok ? 'ok' : 'bad']">
              <template v-if="edit.test.ok">
                Terhubung ke <strong>{{ edit.test.database }}</strong> ({{ edit.test.host }}) dalam {{ edit.test.latencyMs }} ms
                · terpakai {{ edit.test.usedLabel }} ({{ edit.test.usagePercent }}% dari kuota aplikasi)
                <span v-if="!edit.test.hasAppStore"> · tabel <code>app_store</code> belum ada (dibuat otomatis saat dipakai)</span>
              </template>
              <template v-else>Gagal: {{ edit.test.error }}</template>
              <div v-for="w in edit.test.warnings || []" :key="w" class="np-warnline">⚠ {{ w }}</div>
            </div>

            <div v-if="edit.error" class="np-hint bad">{{ edit.error }}</div>
          </div>

          <div class="np-modal-foot">
            <button class="np-btn" :disabled="edit.testing || !canTestEdit" @click="testEdit">
              {{ edit.testing ? 'Menguji…' : 'Tes koneksi' }}
            </button>
            <span class="np-spacer"></span>
            <button class="np-btn" @click="closeEdit">Batal</button>
            <button class="np-btn np-btn-primary" :disabled="edit.saving" @click="saveEdit">
              {{ edit.saving ? 'Menyimpan…' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Modal: import massal ═══ -->
    <Teleport to="body">
      <div v-if="bulk.open" class="np-overlay" @mousedown.self="closeBulk">
        <div class="np-modal np-modal-wide" role="dialog" aria-modal="true" aria-label="Import massal database_urls">
          <div class="np-modal-head">
            <h3>Import massal — database_urls</h3>
            <button class="np-x" aria-label="Tutup" @click="closeBulk">×</button>
          </div>

          <div class="np-modal-body">
            <label class="np-field">
              <span>Daftar connection string</span>
              <textarea v-model="bulk.text" rows="8" spellcheck="false" autocomplete="off"
                placeholder="Tempel di sini — satu per baris, dipisah koma, atau JSON array.&#10;Format DATABASE_URLS=... juga dikenali.&#10;&#10;postgresql://user:pass@ep-aaa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&#10;postgresql://user:pass@ep-bbb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"></textarea>
              <div class="np-file-row">
                <label class="np-btn np-btn-sm np-file">
                  Muat dari file (.txt / .json / .env)
                  <input type="file" accept=".txt,.json,.env,.csv,text/plain,application/json" @change="onFile" hidden />
                </label>
                <span class="np-muted">{{ bulkLineCount }} URL terdeteksi</span>
                <button v-if="bulk.text" class="np-btn np-btn-sm" @click="bulk.text = ''">Bersihkan</button>
              </div>
            </label>

            <div class="np-grid3">
              <fieldset class="np-field np-radios">
                <legend>Mode</legend>
                <label class="np-radio"><input v-model="bulk.mode" type="radio" value="fill" />
                  <span><strong>Isi slot kosong</strong> — URL baru masuk ke nomor kosong terendah; slot yang sudah ada tidak disentuh.</span></label>
                <label class="np-radio"><input v-model="bulk.mode" type="radio" value="replace" />
                  <span><strong>Ganti semua slot panel</strong> — hapus semua slot panel (kecuali yang AKTIF) lalu isi ulang.</span></label>
              </fieldset>
              <label class="np-field">
                <span>Mulai dari nomor (opsional)</span>
                <input v-model.number="bulk.startAt" type="number" min="1" :max="view?.panelMax || 100" placeholder="otomatis" />
              </label>
              <label class="np-field">
                <span>Awalan label (opsional)</span>
                <input v-model="bulk.labelPrefix" maxlength="30" placeholder="mis. Neon → Neon-12" />
              </label>
            </div>

            <div v-if="bulk.mode === 'replace'" class="np-hint warn">
              Mode ganti menghapus slot panel dari <em>konfigurasi</em>. Data di database Neon-nya <strong>tidak dihapus</strong>,
              tetapi data yang hanya ada di slot tersebut tidak akan ikut dimigrasi saat failover.
            </div>

            <div v-if="bulk.error" class="np-hint bad">{{ bulk.error }}</div>

            <!-- Hasil pratinjau / penerapan -->
            <div v-if="bulk.result" class="np-result">
              <div class="np-result-summary">
                <span class="np-pill pill-ok">{{ bulk.result.summary.added }} ditambahkan</span>
                <span class="np-pill pill-warn" v-if="bulk.result.summary.duplicate">{{ bulk.result.summary.duplicate }} duplikat</span>
                <span class="np-pill pill-bad" v-if="bulk.result.summary.invalid">{{ bulk.result.summary.invalid }} tidak valid</span>
                <span class="np-pill pill-bad" v-if="bulk.result.summary.full">{{ bulk.result.summary.full }} tidak muat</span>
                <span class="np-pill pill-off" v-if="bulk.result.summary.removed">{{ bulk.result.summary.removed }} slot dihapus</span>
                <strong class="np-result-title">{{ bulk.applied ? 'Sudah diterapkan' : 'Pratinjau (belum disimpan)' }}</strong>
              </div>
              <div class="np-result-table">
                <table>
                  <thead><tr><th>Baris</th><th>Status</th><th>Slot</th><th>Keterangan</th></tr></thead>
                  <tbody>
                    <tr v-for="(r, i) in bulk.result.results" :key="i" :class="`r-${r.status}`">
                      <td>{{ r.line }}</td>
                      <td>{{ statusLabel(r.status) }}</td>
                      <td>{{ r.slot ?? '–' }}</td>
                      <td>
                        {{ r.message || r.host || '' }}
                        <span v-for="w in r.warnings || []" :key="w" class="np-warnline">⚠ {{ w }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="np-modal-foot">
            <span class="np-muted" v-if="bulk.stale && bulk.result && !bulk.applied">Isian berubah — jalankan pratinjau ulang.</span>
            <span class="np-spacer"></span>
            <button class="np-btn" @click="closeBulk">{{ bulk.applied ? 'Selesai' : 'Batal' }}</button>
            <button class="np-btn" :disabled="bulk.busy || !bulk.text.trim()" @click="runBulk(true)">
              {{ bulk.busy === 'preview' ? 'Memeriksa…' : 'Pratinjau' }}
            </button>
            <button class="np-btn np-btn-primary" :disabled="!canApplyBulk" @click="runBulk(false)">
              {{ bulk.busy === 'apply' ? 'Menerapkan…' : `Terapkan${bulk.result && !bulk.stale ? ` (${bulk.result.summary.added})` : ''}` }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { apiFetch } from '@/utils/api';

const BASE = '/api/v1/db/slot-config';

const view = ref(null);
const loading = ref(false);
const loadError = ref('');
const filter = ref('all');
const search = ref('');
const confirmDelete = ref(null);
const busyNumber = ref(null);
const toast = reactive({ msg: '', type: 'success' });
let toastTimer = null;

// hasil tes per slot { [number]: {ok, ...} } + penanda sedang menguji
const testResults = reactive({});
const testing = reactive({});
const testAll = reactive({ running: false, cancel: false, done: 0, total: 0 });

function flash(type, msg) {
  toast.type = type;
  toast.msg = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.msg = ''; }, 6000);
}

async function request(path, options = {}) {
  const res = await apiFetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  let data = null;
  try { data = await res.json(); } catch { /* respons kosong */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Permintaan gagal (HTTP ${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function load({ silent = false } = {}) {
  if (!silent) loading.value = true;
  loadError.value = '';
  try {
    view.value = await request('');
  } catch (err) {
    loadError.value = err.message;
  } finally {
    loading.value = false;
  }
}

// ── Daftar & filter ──────────────────────────────────────────────────────
const filledCount = computed(() => (view.value?.slots || []).filter(s => s.source !== 'empty').length);
const filters = computed(() => {
  const slots = view.value?.slots || [];
  return [
    { id: 'all', label: 'Semua', count: slots.length },
    { id: 'filled', label: 'Terisi', count: filledCount.value },
    { id: 'empty', label: 'Kosong', count: slots.length - filledCount.value }
  ];
});
const filteredSlots = computed(() => {
  const q = search.value.toLowerCase();
  return (view.value?.slots || []).filter(s => {
    if (filter.value === 'filled' && s.source === 'empty') return false;
    if (filter.value === 'empty' && s.source !== 'empty') return false;
    if (!q) return true;
    return String(s.number) === q
      || (s.label || '').toLowerCase().includes(q)
      || (s.host || '').toLowerCase().includes(q)
      || (s.note || '').toLowerCase().includes(q);
  });
});

// ── Status kesehatan ─────────────────────────────────────────────────────
function resultOf(slot) { return testResults[slot.number] || null; }
function statusClass(slot) {
  const r = resultOf(slot);
  const healthy = r ? r.ok : slot.healthy;
  return healthy === true ? 'good' : healthy === false ? 'bad' : 'idle';
}
function statusText(slot) {
  if (isTesting(slot.number)) return 'Menguji koneksi…';
  const r = resultOf(slot);
  if (r) {
    return r.ok
      ? `Terhubung · ${r.latencyMs} ms · terpakai ${r.usedLabel} (${r.usagePercent}%)`
      : `Gagal: ${r.error}`;
  }
  if (slot.healthy === true) return 'Sehat (pengecekan terakhir)';
  if (slot.healthy === false) return `Bermasalah: ${slot.lastError || 'tidak dapat dihubungi'}`;
  return slot.inPool || slot.source === 'env' ? 'Belum diuji' : '';
}
function isTesting(n) { return !!testing[n]; }

async function testOne(number) {
  testing[number] = true;
  try {
    const { results } = await request('/test-batch', {
      method: 'POST', body: JSON.stringify({ numbers: [number] }), timeoutMs: 45000
    });
    testResults[number] = results[0];
  } catch (err) {
    testResults[number] = { ok: false, error: err.message };
  } finally {
    testing[number] = false;
  }
}

async function runTestAll() {
  const numbers = (view.value?.slots || []).filter(s => s.source !== 'empty').map(s => s.number);
  testAll.running = true; testAll.cancel = false; testAll.done = 0; testAll.total = numbers.length;
  const CHUNK = 8;
  for (let i = 0; i < numbers.length && !testAll.cancel; i += CHUNK) {
    const chunk = numbers.slice(i, i + CHUNK);
    chunk.forEach(n => { testing[n] = true; });
    try {
      const { results } = await request('/test-batch', {
        method: 'POST', body: JSON.stringify({ numbers: chunk }), timeoutMs: 90000
      });
      results.forEach(r => { testResults[r.slot] = r; });
    } catch (err) {
      chunk.forEach(n => { testResults[n] = { ok: false, error: err.message }; });
    } finally {
      chunk.forEach(n => { testing[n] = false; });
      testAll.done = Math.min(numbers.length, i + chunk.length);
    }
  }
  const results = Object.values(testResults).filter(r => numbers.includes(r.slot));
  const bad = results.filter(r => !r.ok).length;
  flash(bad ? 'error' : 'success',
    testAll.cancel
      ? `Pengujian dihentikan (${testAll.done}/${numbers.length}).`
      : `Selesai menguji ${numbers.length} slot — ${numbers.length - bad} terhubung, ${bad} bermasalah.`);
  testAll.running = false;
}

// ── Edit satu slot ───────────────────────────────────────────────────────
const edit = reactive({
  open: false, isNew: true, number: 0, url: '', label: '', note: '', enabled: true,
  active: false, current: '', show: false, saving: false, testing: false, test: null, error: ''
});
const canTestEdit = computed(() => !!edit.url.trim() || !edit.isNew);

function openEdit(slot) {
  Object.assign(edit, {
    open: true, isNew: slot.source === 'empty', number: slot.number, url: '',
    label: slot.label || '', note: slot.note || '', enabled: slot.enabled !== false,
    active: !!slot.active, current: slot.connection || '', show: false,
    saving: false, testing: false, test: null, error: ''
  });
}
function closeEdit() { edit.open = false; }

async function testEdit() {
  edit.testing = true; edit.test = null; edit.error = '';
  try {
    if (edit.url.trim()) {
      edit.test = await request('/test', { method: 'POST', body: JSON.stringify({ url: edit.url }), timeoutMs: 45000 });
    } else {
      const { results } = await request('/test-batch', {
        method: 'POST', body: JSON.stringify({ numbers: [edit.number] }), timeoutMs: 45000
      });
      edit.test = results[0];
    }
  } catch (err) {
    edit.error = err.message;
  } finally {
    edit.testing = false;
  }
}

async function saveEdit() {
  edit.saving = true; edit.error = '';
  try {
    const body = {
      label: edit.label, note: edit.note, enabled: edit.enabled,
      expectedVersion: view.value?.version
    };
    if (edit.url.trim()) body.url = edit.url.trim();
    if (edit.isNew && !body.url) throw new Error('Connection string wajib diisi untuk slot baru.');

    const out = await request(`/${edit.number}`, { method: 'PUT', body: JSON.stringify(body) });
    delete testResults[edit.number];
    closeEdit();
    await load({ silent: true });
    flash('success', `Slot ${edit.number} ${out.created ? 'ditambahkan' : 'diperbarui'}.`
      + (out.warnings?.length ? ` Catatan: ${out.warnings[0]}` : ''));
  } catch (err) {
    edit.error = err.message;
    if (err.status === 409 && /admin lain/.test(err.message)) load({ silent: true });
  } finally {
    edit.saving = false;
  }
}

async function toggleEnabled(slot) {
  busyNumber.value = slot.number;
  try {
    await request(`/${slot.number}`, {
      method: 'PUT', body: JSON.stringify({ enabled: !slot.enabled, expectedVersion: view.value?.version })
    });
    await load({ silent: true });
    flash('success', `Slot ${slot.number} ${slot.enabled ? 'dinonaktifkan' : 'diaktifkan'}.`);
  } catch (err) {
    flash('error', err.message);
    if (err.status === 409) load({ silent: true });
  } finally {
    busyNumber.value = null;
  }
}

async function removeSlot(slot) {
  busyNumber.value = slot.number;
  try {
    await request(`/${slot.number}?expectedVersion=${view.value?.version ?? ''}`, { method: 'DELETE' });
    confirmDelete.value = null;
    delete testResults[slot.number];
    await load({ silent: true });
    flash('success', `Slot ${slot.number} dikosongkan. Data di database Neon-nya tidak dihapus.`);
  } catch (err) {
    flash('error', err.message);
    confirmDelete.value = null;
    if (err.status === 409) load({ silent: true });
  } finally {
    busyNumber.value = null;
  }
}

// ── Import massal ────────────────────────────────────────────────────────
const bulk = reactive({
  open: false, text: '', mode: 'fill', startAt: null, labelPrefix: '',
  busy: '', error: '', result: null, applied: false, stale: false
});
const URL_RE = /postgres(?:ql)?:\/\/[^\s'"`,;<>]+/gi;
const bulkLineCount = computed(() => (bulk.text.match(URL_RE) || []).length);
const canApplyBulk = computed(() =>
  !bulk.busy && !!bulk.result && !bulk.stale && !bulk.applied
  && (bulk.result.summary.added > 0 || bulk.result.summary.removed > 0)
);

watch(() => [bulk.text, bulk.mode, bulk.startAt, bulk.labelPrefix], () => {
  if (bulk.result && !bulk.applied) bulk.stale = true;
});

function openBulk() {
  Object.assign(bulk, {
    open: true, text: '', mode: 'fill', startAt: null, labelPrefix: '',
    busy: '', error: '', result: null, applied: false, stale: false
  });
}
function closeBulk() { bulk.open = false; }

function onFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 1024 * 1024) { bulk.error = 'File terlalu besar (maks 1 MB).'; return; }
  const reader = new FileReader();
  reader.onload = () => { bulk.text = String(reader.result || ''); bulk.error = ''; };
  reader.onerror = () => { bulk.error = 'Gagal membaca file.'; };
  reader.readAsText(file);
}

function statusLabel(s) {
  return { added: 'Ditambahkan', duplicate: 'Duplikat', invalid: 'Tidak valid', full: 'Tidak muat' }[s] || s;
}

async function runBulk(dryRun) {
  bulk.busy = dryRun ? 'preview' : 'apply';
  bulk.error = '';
  try {
    const body = {
      text: bulk.text, mode: bulk.mode, dryRun,
      labelPrefix: bulk.labelPrefix || undefined,
      startAt: Number.isInteger(bulk.startAt) ? bulk.startAt : undefined
    };
    if (!dryRun) body.expectedVersion = view.value?.version;
    const out = await request('/bulk', { method: 'POST', body: JSON.stringify(body), timeoutMs: 60000 });

    bulk.result = out;
    bulk.stale = false;
    if (!dryRun) {
      bulk.applied = true;
      await load({ silent: true });
      flash(out.summary.added || out.summary.removed ? 'success' : 'error',
        out.summary.added || out.summary.removed
          ? `Import selesai: ${out.summary.added} slot ditambahkan.`
          : 'Tidak ada perubahan (semua URL duplikat atau tidak valid).');
    }
  } catch (err) {
    bulk.error = err.message;
    if (err.status === 409) load({ silent: true });
  } finally {
    bulk.busy = '';
  }
}

// ── Tutup modal dengan Esc ───────────────────────────────────────────────
function onKey(e) {
  if (e.key !== 'Escape') return;
  if (bulk.open) closeBulk();
  else if (edit.open) closeEdit();
}
onMounted(() => { load(); window.addEventListener('keydown', onKey); });
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); clearTimeout(toastTimer); });
</script>

<style scoped>
.neon-panel { display: flex; flex-direction: column; gap: 16px; }

.np-banner {
  display: flex; gap: 14px; align-items: flex-start; padding: 14px 18px;
  background: rgba(14, 107, 94, 0.08); border: 1px solid rgba(14, 107, 94, 0.25);
  border-radius: 10px; font-size: 0.84rem; line-height: 1.55; color: var(--text-secondary);
}
.np-banner-warn { background: rgba(215, 154, 62, 0.1); border-color: rgba(215, 154, 62, 0.4); }
.np-banner-icon { font-size: 1.2rem; line-height: 1.3; }
.np-banner code, .np-hint code { background: var(--bg-tertiary); padding: 1px 5px; border-radius: 4px; font-size: 0.78rem; }

.np-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.np-stat {
  display: flex; flex-direction: column; gap: 2px; padding: 14px 16px;
  background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px;
}
.np-stat-val { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
.np-stat-val small { font-size: 0.85rem; font-weight: 500; color: var(--text-muted); }
.np-stat-label { font-size: 0.76rem; color: var(--text-muted); }

.np-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.np-chips { display: flex; gap: 6px; }
.np-chip {
  padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-secondary);
  color: var(--text-secondary); border-radius: 999px; font-size: 0.8rem; cursor: pointer;
}
.np-chip.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
.np-chip-count { opacity: 0.75; margin-left: 4px; }
.np-search {
  flex: 1 1 200px; min-width: 160px; padding: 8px 12px; border: 1px solid var(--border-color);
  background: var(--bg-secondary); color: var(--text-primary); border-radius: 8px; font-size: 0.84rem;
}
.np-toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-left: auto; }

.np-btn {
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border-color-strong);
  background: var(--bg-secondary); color: var(--text-primary); font-size: 0.82rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s;
}
.np-btn:hover:not(:disabled) { background: var(--bg-tertiary); }
.np-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.np-btn-sm { padding: 5px 10px; font-size: 0.76rem; }
.np-btn-primary { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
.np-btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.np-btn-danger { background: #dc2626; border-color: #dc2626; color: #fff; }
.np-btn-danger:hover:not(:disabled) { background: #b91c1c; }
.np-btn-ghost-danger { color: #dc2626; border-color: rgba(220, 38, 38, 0.35); }
.np-btn-ghost-danger:hover:not(:disabled) { background: rgba(220, 38, 38, 0.08); }

.np-progress { height: 4px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
.np-progress-bar { height: 100%; background: var(--primary-color); transition: width 0.25s; }

.np-toast { padding: 10px 14px; border-radius: 8px; font-size: 0.84rem; }
.np-toast.success { background: rgba(16, 185, 129, 0.12); color: #0f9b6c; border: 1px solid rgba(16, 185, 129, 0.3); }
.np-toast.error { background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }

.np-list { display: flex; flex-direction: column; border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; }
.np-row {
  display: flex; align-items: flex-start; gap: 14px; padding: 12px 16px;
  background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);
}
.np-row:last-child { border-bottom: 0; }
.np-row.src-empty { background: var(--bg-primary); }
.np-row.is-active { box-shadow: inset 3px 0 0 var(--success-color); }
.np-row.is-disabled .np-main { opacity: 0.6; }
.np-num {
  flex: 0 0 38px; height: 38px; display: grid; place-items: center; border-radius: 8px;
  background: var(--bg-tertiary); color: var(--text-secondary); font-weight: 700; font-size: 0.86rem;
}
.np-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.np-title { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.np-label { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
.np-conn { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.74rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.np-note { font-size: 0.76rem; color: var(--text-muted); }
.np-muted { color: var(--text-muted); font-size: 0.82rem; }
.np-status { display: flex; align-items: center; gap: 6px; font-size: 0.76rem; }
.np-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); flex: 0 0 8px; }
.np-status.good { color: #0f9b6c; } .np-status.good .np-dot { background: #10b981; }
.np-status.bad { color: #dc2626; } .np-status.bad .np-dot { background: #ef4444; }
.np-status.idle { color: var(--text-muted); }

.np-pill { padding: 1px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em; }
.pill-env { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.pill-panel { background: rgba(var(--primary-rgb), 0.12); color: var(--primary-color); }
.pill-active { background: rgba(16, 185, 129, 0.15); color: #0f9b6c; }
.pill-off { background: var(--bg-tertiary); color: var(--text-muted); }
.pill-warn { background: rgba(245, 158, 11, 0.15); color: #b45309; }
.pill-ok { background: rgba(16, 185, 129, 0.15); color: #0f9b6c; }
.pill-bad { background: rgba(239, 68, 68, 0.14); color: #dc2626; }

.np-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 6px; max-width: 360px; }
.np-lock { font-size: 0.9rem; }
.np-empty { padding: 28px; text-align: center; color: var(--text-muted); font-size: 0.86rem; }
.np-error { color: #dc2626; }

/* Modal */
.np-overlay {
  position: fixed; inset: 0; z-index: 9999; background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.np-modal {
  width: 100%; max-width: 560px; max-height: 92vh; display: flex; flex-direction: column;
  background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);
  border-radius: 14px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
.np-modal-wide { max-width: 760px; }
.np-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.np-modal-head h3 { margin: 0; font-size: 1.02rem; }
.np-x { border: 0; background: transparent; font-size: 1.5rem; line-height: 1; color: var(--text-muted); cursor: pointer; }
.np-modal-body { padding: 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.np-modal-foot { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--border-color); flex-wrap: wrap; }
.np-spacer { flex: 1; }

.np-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); border: 0; padding: 0; margin: 0; }
.np-field input:not([type='checkbox']):not([type='radio']), .np-field textarea {
  padding: 9px 12px; border: 1px solid var(--border-color-strong); border-radius: 8px;
  background: var(--bg-primary); color: var(--text-primary); font-size: 0.84rem; font-weight: 400; width: 100%; box-sizing: border-box;
}
.np-field textarea { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.76rem; resize: vertical; }
.np-input-row { display: flex; gap: 8px; }
.np-check { flex-direction: row; align-items: center; gap: 8px; align-self: end; padding-bottom: 8px; font-weight: 500; }
.np-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.np-grid3 { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 12px; align-items: start; }
.np-radios legend { margin-bottom: 6px; font-weight: 600; }
.np-radio { display: flex; gap: 8px; align-items: flex-start; font-weight: 400; margin-bottom: 6px; line-height: 1.4; }
.np-file-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.np-file { display: inline-block; }

.np-hint { padding: 10px 12px; border-radius: 8px; font-size: 0.8rem; line-height: 1.5; }
.np-hint.ok { background: rgba(16, 185, 129, 0.12); color: #0f9b6c; }
.np-hint.bad { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
.np-hint.warn { background: rgba(245, 158, 11, 0.12); color: #b45309; }
.np-warnline { display: block; margin-top: 4px; font-size: 0.74rem; color: #b45309; }

.np-result { display: flex; flex-direction: column; gap: 10px; }
.np-result-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.np-result-title { margin-left: auto; font-size: 0.8rem; }
.np-result-table { max-height: 240px; overflow: auto; border: 1px solid var(--border-color); border-radius: 8px; }
.np-result-table table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
.np-result-table th, .np-result-table td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border-color); vertical-align: top; }
.np-result-table th { position: sticky; top: 0; background: var(--bg-tertiary); font-weight: 700; }
.r-added td:nth-child(2) { color: #0f9b6c; font-weight: 600; }
.r-duplicate td:nth-child(2) { color: #b45309; font-weight: 600; }
.r-invalid td:nth-child(2), .r-full td:nth-child(2) { color: #dc2626; font-weight: 600; }

@media (max-width: 720px) {
  .np-row { flex-wrap: wrap; }
  .np-actions { max-width: none; width: 100%; justify-content: flex-start; }
  .np-toolbar-actions { margin-left: 0; width: 100%; }
  .np-grid2, .np-grid3 { grid-template-columns: 1fr; }
  .np-check { align-self: start; }
}
</style>
