// lib/dbPool.js
// ============================================================================
// Multi-Database Pool + Auto Failover (maksimal 1000 database Neon PostgreSQL)
//
// Cara kerja singkat:
// 1. Baca daftar connection string dari ENV atau DATABASE_URLS_FILE.
// Maksimal 1000 slot.
// 2. Pantau ukuran storage database aktif setiap DB_MONITOR_INTERVAL_MS.
// 3. Jika pemakaian >= DB_QUOTA_THRESHOLD (default 85% dari DB_QUOTA_BYTES),
// ATAU terjadi error kuota/limit saat menulis:
// a. Buat CADANGAN penuh dari database aktif (snapshot JSON + file lokal)
// b. Pilih slot database berikutnya yang sehat & lapang
// c. RESTORE seluruh data ke database baru tersebut
// d. Verifikasi jumlah key & checksum
// e. Pindahkan pointer "aktif" ke database baru (generation + 1)
// 4. State aktif disimpan di dalam database itu sendiri (key __db_pool_state)
// sehingga tetap konsisten walaupun filesystem Render bersifat ephemeral.
//
// PENTING: jangan pernah menaruh connection string di dalam kode. Semua
// kredensial dibaca dari environment variable.
// ============================================================================

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Di Vercel disk proyek read-only; hanya /tmp yang bisa ditulis (sementara).
const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'bapperida-data')
  : path.join(__dirname, '..', 'data');
const migrationDir = path.join(dataDir, 'migrations');

// ─── Konstanta & konfigurasi ────────────────────────────────────────────────
export const MAX_DATABASES = 1000;
export const TARGET_STORAGE_MB = 5000;
export const TARGET_STORAGE_BYTES = TARGET_STORAGE_MB * 1_000_000;

const configuredMaxSlots = Number(process.env.DB_MAX_SLOTS || MAX_DATABASES);
export const MAX_SLOTS = Number.isInteger(configuredMaxSlots) && configuredMaxSlots > 0
 ? Math.min(configuredMaxSlots, MAX_DATABASES)
 : MAX_DATABASES;

const STATE_KEY = '__db_pool_state';
const HISTORY_KEY = '__db_migration_history';

// Application quota only; this does not change Neon capacity or billing.
const configuredQuotaBytes = Number(process.env.DB_QUOTA_BYTES || TARGET_STORAGE_BYTES);
export const QUOTA_BYTES = Number.isFinite(configuredQuotaBytes) && configuredQuotaBytes > 0
 ? configuredQuotaBytes
 : TARGET_STORAGE_BYTES;
// Ambang batas pindah (default 85%)
const QUOTA_THRESHOLD = Math.min(Math.max(Number(process.env.DB_QUOTA_THRESHOLD || 0.85), 0.5), 0.98);
// Interval pengecekan kuota (default 5 menit)
const MONITOR_INTERVAL_MS = Number(process.env.DB_MONITOR_INTERVAL_MS || 5 * 60 * 1000);
// Jumlah file cadangan migrasi yang disimpan di disk
const MIGRATION_BACKUP_KEEP = Number(process.env.DB_MIGRATION_KEEP || 5);

// Pola error yang dianggap "kuota / storage habis" → memicu failover
const QUOTA_ERROR_PATTERNS = [
 'quota', 'exceeded', 'storage limit', 'disk full', 'no space left',
 'data transfer', 'compute time', 'limit reached', 'suspended',
 'too many connections', 'over the limit', 'insufficient'
];
// SQLSTATE: 53100 disk_full, 53200 out_of_memory, 53300 too_many_connections
const QUOTA_SQLSTATES = new Set(['53100', '53200', '53300', '54000']);

// ─── State runtime ──────────────────────────────────────────────────────────
const slots = []; // [{ index, url, label, host, client, healthy, lastError }]
let activeIndex = 0;
let generation = 0;
let initialized = false;
let initPromise = null;
let monitorTimer = null;
let failoverInFlight = null; // Promise — mencegah failover paralel

const events = []; // log ringkas untuk endpoint status
const usageCache = new Map(); // index → { bytes, ratio, checkedAt }

// ─── Konfigurasi slot yang dikelola lewat panel Admin ──────────────────────
// Slot ENV (DATABASE_URL, DATABASE_URL_n, DATABASE_URLS, DATABASE_URLS_FILE)
// tetap menjadi "jangkar" dan menempati nomor 1..N. Panel Admin mengelola
// nomor di atasnya sampai PANEL_MAX_SLOTS (100). Konfigurasi panel disimpan
// di tabel app_store pada beberapa database jangkar (key SLOT_CONFIG_KEY) +
// file lokal sebagai cadangan, dan TIDAK ikut dalam backup / migrasi data
// karena berisi kredensial.
export const SLOT_CONFIG_KEY = '__db_slots_config';
export const PANEL_MAX_SLOTS = 100;
const SLOT_CONFIG_FILE = path.join(dataDir, 'db_slots_config.json');
const CONFIG_ANCHOR_FANOUT = 5; // jumlah database ENV pertama tempat config dibaca/ditulis
const ALLOW_ANY_HOST = String(process.env.DB_ALLOW_NON_NEON_HOSTS || '').toLowerCase() === 'true';
const ALLOWED_HOST_SUFFIXES = (process.env.DB_ALLOWED_HOST_SUFFIXES || '.neon.tech')
 .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
let managedConfig = { version: 0, updatedAt: null, slots: [] };
let configMutex = Promise.resolve();

/** Nomor slot yang ditampilkan (stabil walau ada nomor yang kosong). */
function numOf(index) {
 return slots[index]?.number ?? index + 1;
}

// ─── Cadangan aplikasi (fallback terakhir) ─────────────────────────────────
// lib/db.js mendaftarkan sebuah "provider" yang mengembalikan salinan data
// terakhir yang berhasil dibaca/ditulis (disimpan di disk lokal). Ini dipakai
// sebagai jaring pengaman TERAKHIR ketika database sumber tidak terbaca DAN
// tidak ada file cadangan migrasi — supaya aplikasi tetap bisa menampilkan
// data (mode baca-saja) alih-alih melempar error teknis mentah ke pengguna.
let fallbackDataProvider = null;
export function registerFallbackDataProvider(fn) {
 fallbackDataProvider = typeof fn === 'function' ? fn : null;
}
function getApplicationFallbackData() {
 if (!fallbackDataProvider) return null;
 try {
 const data = fallbackDataProvider();
 if (data && typeof data === 'object' && Object.keys(data).length > 0) return data;
 } catch {}
 return null;
}

// ─── Cadangan lintas-slot (bertahan walau disk lokal Render ter-reset) ─────
// Disk lokal Render bersifat ephemeral — terhapus setiap redeploy. Supaya
// cadangan TIDAK ikut hilang tiap redeploy, salinan data terakhir yang
// berhasil dibaca/ditulis juga direplikasi (best-effort) ke beberapa slot
// Neon LAIN (bukan slot aktif) sebagai baris biasa di tabel app_store,
// dengan key khusus. Ini murni jaring pengaman tambahan; kegagalan di sini
// tidak boleh mengganggu alur baca/tulis utama.
export const CROSS_BACKUP_KEY = '__app_cross_backup';

/** Simpan snapshot ke beberapa slot lain (bukan excludeIndex). Best-effort. */
export async function writeCrossSlotBackup(fullData, { excludeIndex = null, replicas = 2 } = {}) {
 if (slots.length === 0 || !fullData || Object.keys(fullData).length === 0) return;
 const payload = { savedAt: new Date().toISOString(), data: fullData };
 const json = JSON.stringify(payload);

 const candidates = [];
 for (let offset = 1; offset <= slots.length && candidates.length < replicas; offset++) {
 const idx = (((excludeIndex ?? activeIndex) + offset) % slots.length);
 if (idx !== excludeIndex) candidates.push(idx);
 }

 await Promise.all(candidates.map(async (i) => {
 try {
 const sql = clientFor(i);
 await sql`
 CREATE TABLE IF NOT EXISTS app_store (
 key TEXT PRIMARY KEY,
 data JSONB NOT NULL,
 updated_at TIMESTAMPTZ DEFAULT NOW()
 )
 `;
 await sql`
 INSERT INTO app_store (key, data, updated_at)
 VALUES (${CROSS_BACKUP_KEY}, ${json}, NOW())
 ON CONFLICT (key) DO UPDATE SET data = ${json}, updated_at = NOW()
 `;
 } catch {
 // Best-effort — slot ini mungkin juga sedang penuh/bermasalah, lewati saja.
 }
 }));
}

/** Cari cadangan lintas-slot di slot mana pun yang masih bisa menjawab. */
export async function readCrossSlotBackup() {
 for (let i = 0; i < slots.length; i++) {
 try {
 const sql = clientFor(i);
 const rows = await sql`SELECT data FROM app_store WHERE key = ${CROSS_BACKUP_KEY}`;
 const payload = rows[0]?.data;
 if (payload && payload.data && Object.keys(payload.data).length > 0) {
 return { savedAt: payload.savedAt, data: payload.data, foundAtSlot: numOf(i) };
 }
 } catch {
 // Slot ini juga tidak bisa dibaca — lanjut coba slot berikutnya.
 }
 }
 return null;
}

function pushEvent(level, message, extra = {}) {
 events.unshift({ at: new Date().toISOString(), level, message, ...extra });
 if (events.length > 60) events.length = 60;
 const tag = level === 'error' ? '[DBPool:ERROR]' : level === 'warn' ? '[DBPool:WARN]' : '[DBPool]';
 console.log(`${tag} ${message}`);
}

// ─── Util ───────────────────────────────────────────────────────────────────
function ensureDirs() {
 for (const dir of [dataDir, migrationDir]) {
 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 }
}

/** Sembunyikan password saat ditampilkan ke UI / log. */
export function maskUrl(url) {
 if (!url) return '';
 try {
 const u = new URL(url);
 const user = u.username || 'user';
 return `${u.protocol}//${user}:****@${u.hostname}${u.pathname}`;
 } catch {
 return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
 }
}

function hostOf(url) {
 try { return new URL(url).hostname; } catch { return 'unknown-host'; }
}

/** Sidik jari unik per endpoint, dipakai untuk mendeteksi URL duplikat. */
function fingerprint(url) {
 try {
 const u = new URL(url);
 return `${u.hostname}${u.pathname}`.toLowerCase();
 } catch {
 return crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
 }
}

function isQuotaError(err) {
 if (!err) return false;
 if (err.code && QUOTA_SQLSTATES.has(String(err.code))) return true;
 const msg = `${err.message || ''} ${err.detail || ''} ${err.hint || ''}`.toLowerCase();
 return QUOTA_ERROR_PATTERNS.some(p => msg.includes(p));
}

export function formatBytes(bytes) {
 if (!Number.isFinite(bytes) || bytes < 0) return '-';
 const units = ['B', 'KB', 'MB', 'GB', 'TB'];
 let i = 0, n = bytes;
 while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
 return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

// ─── Pembacaan konfigurasi slot dari ENV ────────────────────────────────────
/**
 * Sumber connection string (digabung, duplikat dibuang), urutan prioritas:
 * 1. DATABASE_URL → slot 1 (primer)
 * 2. DATABASE_URL_2 .. _20 → cara manual untuk jumlah kecil (≤20 slot).
 * Mengetik 1000 env var satu-satu tidak praktis, jadi penomoran ini
 * dibatasi ke 20 slot terlepas dari nilai DB_MAX_SLOTS.
 * 3. DATABASE_URLS → daftar dipisah koma / baris baru, ditulis
 * langsung sebagai env var. Cocok untuk puluhan sampai ratusan slot.
 * 4. DATABASE_URLS_FILE → path ke file teks/JSON berisi daftar URL.
 * Cara yang DISARANKAN untuk ratusan–1000 slot: taruh sebagai
 * "Secret File" di Render (atau file biasa saat dev lokal) lalu isi
 * env ini dengan path-nya. Format file boleh:
 * - satu connection string per baris, ATAU
 * - JSON array of string: ["postgresql://...", "postgresql://..."]
 * Hasil dari scripts/neon-bulk-provision.mjs otomatis dalam format ini.
 *
 * Total slot yang dipakai tetap dibatasi oleh MAX_SLOTS (DB_MAX_SLOTS).
 */
export function readEnvSlotConfig() {
 const raw = [];

 if (process.env.DATABASE_URL?.trim()) {
 raw.push({ url: process.env.DATABASE_URL.trim(), envVar: 'DATABASE_URL' });
 }

 const NUMBERED_VAR_LIMIT = 20;
 for (let i = 2; i <= Math.min(MAX_SLOTS, NUMBERED_VAR_LIMIT); i++) {
 const v = process.env[`DATABASE_URL_${i}`];
 if (v?.trim()) {
 raw.push({ url: v.trim(), envVar: `DATABASE_URL_${i}` });
 }
 }

 if (process.env.DATABASE_URLS?.trim()) {
 process.env.DATABASE_URLS
 .split(/[\n,]+/)
 .map(s => s.trim())
 .filter(Boolean)
 .forEach(s => raw.push({ url: s, envVar: 'DATABASE_URLS' }));
 }

 if (process.env.DATABASE_URLS_FILE?.trim()) {
 const filePath = process.env.DATABASE_URLS_FILE.trim();
 let fileParsedCount = 0;
 try {
 const content = fs.readFileSync(filePath, 'utf-8').trim();
 const parsed = content.startsWith('[')
 ? JSON.parse(content)
 : content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

 parsed
 .map(s => (typeof s === 'string' ? s.trim() : s?.url?.trim()))
 .filter(Boolean)
 .forEach(s => {
 raw.push({ url: s, envVar: 'DATABASE_URLS_FILE' });
 fileParsedCount++;
 });

 if (fileParsedCount === 0) {
 throw new Error('File berhasil dibaca tapi tidak ada URL valid (kosong atau format tidak sesuai).');
 }
 } catch (err) {
 pushEvent('error', `Gagal membaca DATABASE_URLS_FILE (${filePath}): ${err.message}`);
 throw new Error(`CRITICAL_CONFIG_ERROR: DATABASE_URLS_FILE diset ke ${filePath} tetapi gagal dimuat - ${err.message}`);
 }
 }

 // Buang duplikat berdasarkan host+database
 const seen = new Set();
 const unique = [];
 for (const item of raw) {
 const fp = fingerprint(item.url);
 if (seen.has(fp)) {
 pushEvent('warn', `Connection string duplikat diabaikan: ${maskUrl(item.url)}`);
 continue;
 }
 seen.add(fp);
 unique.push(item);
 if (unique.length >= MAX_SLOTS) break;
 }

 if (raw.length > MAX_SLOTS) {
 pushEvent('warn', `Konfigurasi memiliki ${raw.length} URL; hanya ${MAX_SLOTS} slot pertama yang digunakan.`);
 }

 unique.forEach((item, i) => { item.number = i + 1; });
 return unique;
}

/**
 * Konfigurasi slot final = slot ENV (nomor 1..N) + slot panel Admin yang aktif
 * (nomor > N, urut naik). Slot panel yang bentrok nomor/URL dengan ENV dilewati.
 */
export function readSlotConfig() {
 const env = readEnvSlotConfig();
 const merged = env.slice();
 const envCount = env.length;
 const seen = new Set(env.map(item => fingerprint(item.url)));

 for (const m of managedConfig.slots) {
 if (merged.length >= MAX_SLOTS) break;
 if (m.enabled === false) continue;
 if (m.number <= envCount) continue;
 const fp = fingerprint(m.url);
 if (seen.has(fp)) continue;
 seen.add(fp);
 merged.push({ url: m.url, envVar: 'PANEL', number: m.number, label: m.label || null, note: m.note || '', managed: true });
 }
 return merged;
}

function buildSlots() {
 const configs = readSlotConfig();
 const previous = new Map(slots.map(sl => [sl.url, sl]));
 slots.length = 0;
 configs.forEach((item, i) => {
 const prev = previous.get(item.url);
 const number = item.number ?? i + 1;
 slots.push({
 index: i,
 number,
 url: item.url,
 label: item.label || (i === 0 ? 'Primary' : `Backup-${number - 1}`),
 host: hostOf(item.url),
 envVar: item.envVar,
 source: item.managed ? 'panel' : 'env',
 client: prev?.client ?? null,
 healthy: prev?.healthy ?? null,
 lastError: prev?.lastError ?? null,
 lastCheckedAt: prev?.lastCheckedAt ?? null
 });
 });
 return slots;
}

function clientFor(index) {
 const slot = slots[index];
 if (!slot) throw new Error(`Slot database #${index + 1} tidak tersedia.`);
 if (!slot.client) slot.client = neon(slot.url);
 return slot.client;
}

export function hasAnyDatabase() {
 return readSlotConfig().length > 0;
}

// ─── Skema ──────────────────────────────────────────────────────────────────
async function ensureSchema(index) {
 const sql = clientFor(index);
 await sql`
 CREATE TABLE IF NOT EXISTS app_store (
 key TEXT PRIMARY KEY,
 data JSONB NOT NULL,
 updated_at TIMESTAMPTZ DEFAULT NOW()
 )
 `;
}

// ─── Pengukuran pemakaian storage ───────────────────────────────────────────
/**
 * Mengukur pemakaian storage sebuah slot.
 * pg_database_size() mencakup seluruh objek di database tersebut.
 */
export async function measureUsage(index, { force = false } = {}) {
 const cached = usageCache.get(index);
 if (!force && cached && Date.now() - cached.checkedAt < 30_000) return cached;

 const sql = clientFor(index);
 const rows = await sql`
 SELECT
 pg_database_size(current_database())::bigint AS db_bytes,
 COALESCE((SELECT COUNT(*) FROM app_store), 0)::bigint AS row_count
 `;

 const bytes = Number(rows[0]?.db_bytes || 0);
 const usage = {
 index,
 bytes,
 rowCount: Number(rows[0]?.row_count || 0),
 quotaBytes: QUOTA_BYTES,
 ratio: QUOTA_BYTES > 0 ? bytes / QUOTA_BYTES : 0,
 checkedAt: Date.now()
 };
 usageCache.set(index, usage);
 return usage;
}

/**
 * Periksa kelayakan sebuah slot sebagai tujuan migrasi.
 * @returns {{index:number, healthy:boolean, ratio:number, spacious:boolean, error?:string}}
 */
async function probeCandidate(index) {
 try {
 await ensureSchema(index);
 const usage = await measureUsage(index, { force: true });
 slots[index].healthy = true;
 slots[index].lastError = null;
 slots[index].lastCheckedAt = new Date().toISOString();
 return {
 index,
 healthy: true,
 ratio: usage.ratio,
 // "Lapang" = masih di bawah 80% dari ambang batas, jadi tidak langsung
 // penuh lagi begitu data dipindahkan.
 spacious: usage.ratio < QUOTA_THRESHOLD * 0.8
 };
 } catch (err) {
 slots[index].healthy = false;
 slots[index].lastError = err.message;
 slots[index].lastCheckedAt = new Date().toISOString();
 return { index, healthy: false, ratio: Infinity, spacious: false, error: err.message };
 }
}

// ─── State pool (disimpan di dalam database) ────────────────────────────────
async function readPoolState(index) {
 try {
 const sql = clientFor(index);
 await ensureSchema(index);
 const rows = await sql`SELECT data FROM app_store WHERE key = ${STATE_KEY}`;
 return rows[0]?.data ?? null;
 } catch {
 return null;
 }
}

async function writePoolState(index, state) {
 const sql = clientFor(index);
 await ensureSchema(index);
 const json = JSON.stringify(state);
 await sql`
 INSERT INTO app_store (key, data, updated_at)
 VALUES (${STATE_KEY}, ${json}, NOW())
 ON CONFLICT (key) DO UPDATE SET data = ${json}, updated_at = NOW()
 `;
}

// ─── Inisialisasi ───────────────────────────────────────────────────────────
/**
 * Menentukan slot aktif saat startup dengan cara memindai seluruh slot dan
 * memilih yang punya `generation` tertinggi. Ini membuat pool tetap konsisten
 * setelah restart/redeploy walaupun disk Render dihapus.
 */
export async function initPool({ force = false, skipConfigLoad = false } = {}) {
 if (initialized && !force) return getPoolStatusSync();
 if (initPromise && !force) return initPromise;

 initPromise = (async () => {
 ensureDirs();
 if (!skipConfigLoad) await loadManagedConfig();
 buildSlots();

 if (slots.length === 0) {
 initialized = true;
 pushEvent('warn', 'Tidak ada DATABASE_URL — memakai local file store.');
 return getPoolStatusSync();
 }

 let best = { index: 0, generation: -1 };

 // Dengan puluhan–ratusan slot, mengecek satu per satu terlalu lambat saat
 // startup. Pindai secara paralel dalam batch kecil (aman untuk pooler).
 const PROBE_CONCURRENCY = Math.min(50, Math.max(1, Number(process.env.DB_PROBE_CONCURRENCY || 40)));
 for (let start = 0; start < slots.length; start += PROBE_CONCURRENCY) {
 const batch = slots.slice(start, start + PROBE_CONCURRENCY);
 await Promise.all(batch.map(async (slot) => {
 try {
 const state = await readPoolState(slot.index);
 slot.healthy = true;
 slot.lastCheckedAt = new Date().toISOString();
 const gen = Number(state?.generation ?? 0);
 if (state?.active && gen > best.generation) {
 best = { index: slot.index, generation: gen };
 }
 } catch (err) {
 slot.healthy = false;
 slot.lastError = err.message;
 pushEvent('warn', `Slot #${numOf(slot.index)} (${slot.host}) tidak dapat dihubungi: ${err.message}`);
 }
 }));
 }

 if (best.generation >= 0) {
 activeIndex = best.index;
 generation = best.generation;
 } else {
 // Belum pernah ada state → pakai slot sehat pertama
 const first = slots.find(s => s.healthy) || slots[0];
 activeIndex = first.index;
 generation = 0;
 try {
 await writePoolState(activeIndex, {
 active: true,
 generation,
 slotIndex: activeIndex,
 host: slots[activeIndex].host,
 since: new Date().toISOString()
 });
 } catch (err) {
 pushEvent('error', `Gagal menulis state awal pada slot #${numOf(activeIndex)}: ${err.message}`);
 }
 }

 initialized = true;
 pushEvent('info',
 `Pool siap — ${slots.length} slot terdaftar, aktif: slot #${numOf(activeIndex)} (${slots[activeIndex]?.host}), generation ${generation}.`
 );
 return getPoolStatusSync();
 })();

 return initPromise;
}

// ─── Eksekutor kueri dengan failover otomatis ───────────────────────────────
/**
 * Menjalankan fn(sql) pada database aktif. Jika gagal karena kuota/limit,
 * lakukan failover ke slot berikutnya lalu ULANGI kueri di database baru.
 *
 * @param {(sql: Function) => Promise<any>} fn
 */
export async function withDb(fn, { attempt = 0 } = {}) {
 await initPool();
 if (slots.length === 0) throw new Error('NO_DATABASE_CONFIGURED');

 try {
 const sql = clientFor(activeIndex);
 return await fn(sql);
 } catch (err) {
 const quota = isQuotaError(err);
 slots[activeIndex].lastError = err.message;

 if (!quota || attempt >= slots.length - 1) {
 if (quota) pushEvent('error', `Semua slot database bermasalah: ${err.message}`);
 throw err;
 }

 pushEvent('warn', `Kuota/limit terdeteksi pada slot #${numOf(activeIndex)}: ${err.message} → memulai failover.`);
 await rotateToNextSlot(`Error kuota: ${err.message}`);
 return withDb(fn, { attempt: attempt + 1 });
 }
}

// ─── Cadangkan & pindahkan ──────────────────────────────────────────────────
async function dumpAll(index) {
 const sql = clientFor(index);
 await ensureSchema(index);
 const rows = await sql`SELECT key, data FROM app_store`;
 const dump = {};
 for (const row of rows) {
 if (row.key === STATE_KEY) continue; // state pool tidak ikut dipindah mentah
 if (row.key === CROSS_BACKUP_KEY) continue; // blob cadangan lintas-slot, bukan data pengguna
 if (row.key === SLOT_CONFIG_KEY) continue; // konfigurasi slot berisi kredensial, dikelola terpisah
 dump[row.key] = row.data;
 }
 return dump;
}

// JSONB di Postgres MENYUSUN ULANG urutan key objek saat disimpan. Dengan
// JSON.stringify biasa, data sumber (mis. dari cadangan disk / cache aplikasi
// yang urutan key-nya asli) tidak akan pernah sama dengan data yang dibaca
// ulang dari JSONB -> "Verifikasi migrasi gagal: checksum tidak cocok".
// Solusi: serialisasi kanonik (key diurutkan secara rekursif).
function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(v => canonicalStringify(v === undefined ? null : v)).join(',') + ']';
  }
  const keys = Object.keys(value).filter(k => value[k] !== undefined).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(value[k])).join(',') + '}';
}

function checksumOf(obj) {
  return crypto.createHash('sha256').update(canonicalStringify(obj)).digest('hex');
}

/** Simpan cadangan ke disk sebagai jaring pengaman tambahan sebelum migrasi. */
function writeMigrationBackup(dump, meta) {
 try {
 ensureDirs();
 const stamp = new Date().toISOString().replace(/[:.]/g, '-');
 const file = path.join(migrationDir, `migration_${stamp}.json`);
 fs.writeFileSync(file, JSON.stringify({ meta, data: dump }), 'utf-8');

 const files = fs.readdirSync(migrationDir)
 .filter(f => f.startsWith('migration_') && f.endsWith('.json'))
 .sort();
 if (files.length > MIGRATION_BACKUP_KEEP) {
 files.slice(0, files.length - MIGRATION_BACKUP_KEEP).forEach(old => {
 try { fs.unlinkSync(path.join(migrationDir, old)); } catch {}
 });
 }
 return file;
 } catch (err) {
 pushEvent('warn', `Cadangan migrasi ke disk gagal (dilanjutkan): ${err.message}`);
 return null;
 }
}

/** Tulis seluruh dump ke database tujuan secara batch. */
async function restoreInto(index, dump) {
 const sql = clientFor(index);
 await ensureSchema(index);

 const entries = Object.entries(dump);
 for (const [key, data] of entries) {
 const json = JSON.stringify(data);
 await sql`
 INSERT INTO app_store (key, data, updated_at)
 VALUES (${key}, ${json}, NOW())
 ON CONFLICT (key) DO UPDATE SET data = ${json}, updated_at = NOW()
 `;
 }
 return entries.length;
}

/** Verifikasi hasil migrasi: semua key ada dan checksum isinya sama. */
async function verifyMigration(index, sourceDump) {
 const target = await dumpAll(index);
 const missing = Object.keys(sourceDump).filter(k => !(k in target));
 const sourceSum = checksumOf(sourceDump);
 const targetSubset = {};
 for (const k of Object.keys(sourceDump)) targetSubset[k] = target[k];
 const targetSum = checksumOf(targetSubset);

 return {
 ok: missing.length === 0 && sourceSum === targetSum,
 missing,
 sourceKeys: Object.keys(sourceDump).length,
 targetKeys: Object.keys(target).length,
 sourceChecksum: sourceSum,
 targetChecksum: targetSum
 };
}

/**
 * Cari slot tujuan terbaik. Strategi bertingkat supaya sistem tidak pernah
 * "buntu" selama masih ada satu database yang bisa dihubungi:
 * Prioritas 1 — slot sehat pertama (searah jarum jam) yang masih LAPANG.
 * Prioritas 2 — slot sehat dengan pemakaian PALING RENDAH yang masih
 * di bawah 100% kuota.
 * Prioritas 3 — slot sehat mana pun dengan pemakaian paling rendah
 * (darurat: lebih baik pindah ke DB penuh tapi hidup,
 * daripada berhenti melayani).
 */
async function findNextSlot(fromIndex) {
 const order = [];
 for (let step = 1; step < slots.length; step++) order.push((fromIndex + step) % slots.length);

 const PROBE_CONCURRENCY = Math.min(50, Math.max(1, Number(process.env.DB_PROBE_CONCURRENCY || 40)));
 const candidates = [];

 for (let start = 0; start < order.length; start += PROBE_CONCURRENCY) {
 const batch = order.slice(start, start + PROBE_CONCURRENCY);
 const probes = await Promise.all(batch.map(probeCandidate));
 const spacious = probes.find(p => p.healthy && p.spacious);
 if (spacious) return spacious.index; // Prioritas 1 — berhenti begitu ketemu
 candidates.push(...probes);
 }

 const healthy = candidates.filter(c => c.healthy).sort((a, b) => a.ratio - b.ratio);
 if (healthy.length === 0) return -1;

 const underQuota = healthy.find(c => c.ratio < 1);
 if (underQuota) { // Prioritas 2
 pushEvent('warn',
 `Tidak ada slot yang benar-benar lapang. Memilih slot #${numOf(underQuota.index)} ` +
 `yang paling kosong (${(underQuota.ratio * 100).toFixed(1)}%).`
 );
 return underQuota.index;
 }

 pushEvent('warn', // Prioritas 3
 `Semua slot cadangan sudah melewati kuota. Darurat: memakai slot #${numOf(healthy[0].index)} ` +
 `(${(healthy[0].ratio * 100).toFixed(1)}%). Segera tambah database baru.`
 );
 return healthy[0].index;
}

/**
 * Proses inti: cadangkan database aktif → pindahkan ke slot berikutnya.
 * Aman dipanggil berkali-kali (hanya satu proses berjalan pada satu waktu).
 *
 * @param {string} reason
 * @param {number|null} targetIndex - paksa tujuan tertentu (opsional)
 */
export async function rotateToNextSlot(reason = 'Manual', targetIndex = null) {
 if (failoverInFlight) return failoverInFlight;

 failoverInFlight = (async () => {
 await initPool();
 const startedAt = Date.now();
 const fromIndex = activeIndex;

 if (slots.length < 2) {
 const msg = 'Failover dibatalkan: hanya ada 1 database terdaftar. Tambahkan DATABASE_URL_2 dst.';
 pushEvent('error', msg);
 throw new Error(msg);
 }

 const target = targetIndex ?? await findNextSlot(fromIndex);
 if (target < 0) {
 const msg = 'Failover gagal: tidak ada slot cadangan yang sehat dan masih lapang.';
 pushEvent('error', msg);
 throw new Error(msg);
 }
 if (target === fromIndex) {
 throw new Error('Slot tujuan sama dengan slot aktif.');
 }

 pushEvent('info', `Migrasi dimulai: slot #${numOf(fromIndex)} (${slots[fromIndex].host}) → slot #${numOf(target)} (${slots[target].host}). Alasan: ${reason}`);

 // 1) CADANGKAN dari database aktif
 let dump = null;
 let coldFailover = false; // true = tidak ada data yang bisa dipindah, pointer tetap dialihkan
 let sourceErrorMessage = null;
 try {
 dump = await dumpAll(fromIndex);
 } catch (err) {
 sourceErrorMessage = err.message;
 // Database sumber sudah tidak bisa dibaca → coba cadangan migrasi terakhir di disk
 pushEvent('warn', `Sumber tidak terbaca (${err.message}), mencoba cadangan terakhir di disk.`);
 dump = readLatestMigrationBackup();

 // Belum ada cadangan migrasi → coba cadangan level-aplikasi (snapshot data
 // terakhir yang berhasil disajikan, dikelola oleh lib/db.js). Ini menutup
 // celah kasus "baru pertama kali kena kuota, belum pernah migrasi".
 if (!dump) {
 const appFallback = getApplicationFallbackData();
 if (appFallback) {
 pushEvent('warn', 'Memakai cadangan data aplikasi (snapshot terakhir) karena belum ada cadangan migrasi.');
 dump = appFallback;
 }
 }

 // Cadangan lokal (disk Render) ikut terhapus tiap redeploy. Sebagai upaya
 // terakhir sebelum cold-failover, coba cadangan yang direplikasi ke slot
 // Neon LAIN — ini satu-satunya cadangan yang bertahan lintas redeploy.
 if (!dump) {
 try {
 const cross = await readCrossSlotBackup();
 if (cross) {
 pushEvent('warn', `Memakai cadangan lintas-slot (tersimpan di slot #${cross.foundAtSlot}, disimpan ${cross.savedAt}).`);
 dump = cross.data;
 }
 } catch {}
 }

 if (!dump) {
 // Tidak ada APA PUN yang bisa dipindahkan (baik dari sumber, cadangan
 // migrasi, maupun cadangan aplikasi) — misalnya deploy baru dengan disk
 // kosong. Dulu di titik ini seluruh proses failover dibatalkan dengan
 // throw, sehingga slot aktif TETAP di slot yang sudah penuh dan setiap
 // query berikutnya mengulang percobaan migrasi yang sama lalu gagal lagi
 // (loop tanpa akhir). Sekarang: tetap alihkan slot aktif ke target
 // ("cold failover") memakai apa pun yang sudah ada di slot target,
 // supaya trafik berikutnya tidak terus-menerus menabrak slot sumber yang
 // penuh. Data lama di slot sumber TIDAK terhapus — begitu kuotanya
 // pulih/direset, datanya masih ada di sana untuk dipulihkan manual.
 pushEvent('warn',
 `Tidak ada cadangan migrasi, cadangan aplikasi, maupun cadangan lintas-slot untuk dipindahkan. ` +
 `Melakukan cold-failover ke slot #${numOf(target)} tanpa membawa data lama ` +
 `(data lama tetap tersimpan di slot #${numOf(fromIndex)}, tidak hilang).`
 );
 coldFailover = true;
 }
 }

 const meta = {
 reason,
 fromSlot: numOf(fromIndex),
 fromHost: slots[fromIndex].host,
 toSlot: numOf(target),
 toHost: slots[target].host,
 keys: dump ? Object.keys(dump).length : 0,
 checksum: dump ? checksumOf(dump) : null,
 coldFailover,
 startedAt: new Date(startedAt).toISOString()
 };

 let backupFile = null;
 let written = 0;
 let verification = { ok: true, targetKeys: 0, missing: [] };

 if (!coldFailover) {
 // 2) Simpan cadangan ke penyimpanan disk
 backupFile = writeMigrationBackup(dump, meta);

 // 3) BACKUP/RESTORE ke penyimpanan baru
 written = await restoreInto(target, dump);

 // 4) Verifikasi
 verification = await verifyMigration(target, dump);
 if (!verification.ok) {
 pushEvent('error', `Verifikasi migrasi GAGAL (kurang ${verification.missing.length} key). Slot aktif tidak dipindah.`);
 throw new Error(`Verifikasi migrasi gagal: ${verification.missing.slice(0, 5).join(', ') || 'checksum tidak cocok'}`);
 }
 } else {
 pushEvent('warn', `Slot #${numOf(target)} akan langsung dipakai sebagai slot aktif memakai data yang sudah ada di slot tersebut (jika ada), tanpa proses restore/verifikasi.`);
 }

 // 5) Pindahkan pointer aktif (generation naik)
 generation += 1;
 const newState = {
 active: true,
 generation,
 slotIndex: target,
 host: slots[target].host,
 since: new Date().toISOString(),
 migratedFrom: { slot: numOf(fromIndex), host: slots[fromIndex].host },
 reason
 };
 try {
 await writePoolState(target, newState);
 } catch (err) {
 // Jangan biarkan kegagalan menulis state (mis. slot target juga sedang
 // bermasalah sesaat) membatalkan seluruh failover — tetap alihkan pointer
 // di memori supaya trafik berikutnya berhenti menabrak slot sumber yang
 // penuh. State akan ditulis ulang otomatis saat initPool berikutnya.
 pushEvent('warn', `Tidak dapat menulis state pool ke slot #${numOf(target)}: ${err.message} (pointer tetap dialihkan di memori).`);
 }

 // Tandai slot lama sebagai tidak aktif (best-effort — mungkin sudah penuh)
 try {
 await writePoolState(fromIndex, {
 active: false,
 generation,
 slotIndex: fromIndex,
 host: slots[fromIndex].host,
 retiredAt: new Date().toISOString(),
 migratedTo: { slot: numOf(target), host: slots[target].host },
 reason
 });
 } catch (err) {
 pushEvent('warn', `Tidak dapat menandai slot lama sebagai non-aktif: ${err.message}`);
 }

 activeIndex = target;
 usageCache.delete(target);

 // 6) Catat riwayat migrasi di database baru
 const record = {
 ...meta,
 finishedAt: new Date().toISOString(),
 durationMs: Date.now() - startedAt,
 rowsWritten: written,
 verification,
 backupFile: backupFile ? path.basename(backupFile) : null,
 sourceError: sourceErrorMessage,
 generation
 };
 await appendMigrationHistory(target, record);

 pushEvent('info',
 `Migrasi SELESAI dalam ${record.durationMs} ms — ${written} key dipindah ke slot #${numOf(target)} (${slots[target].host}). Database aktif sekarang: slot #${numOf(target)}.`
 );

 return record;
 })().finally(() => { failoverInFlight = null; });

 return failoverInFlight;
}

function readLatestMigrationBackup() {
 try {
 ensureDirs();
 const files = fs.readdirSync(migrationDir)
 .filter(f => f.startsWith('migration_') && f.endsWith('.json'))
 .sort();
 if (files.length === 0) return null;
 const latest = path.join(migrationDir, files[files.length - 1]);
 const parsed = JSON.parse(fs.readFileSync(latest, 'utf-8'));
 return parsed.data || null;
 } catch {
 return null;
 }
}

async function appendMigrationHistory(index, record) {
 try {
 const sql = clientFor(index);
 const rows = await sql`SELECT data FROM app_store WHERE key = ${HISTORY_KEY}`;
 const history = rows[0]?.data?.records || [];
 history.unshift(record);
 const json = JSON.stringify({ records: history.slice(0, 50) });
 await sql`
 INSERT INTO app_store (key, data, updated_at)
 VALUES (${HISTORY_KEY}, ${json}, NOW())
 ON CONFLICT (key) DO UPDATE SET data = ${json}, updated_at = NOW()
 `;
 } catch (err) {
 pushEvent('warn', `Gagal menyimpan riwayat migrasi: ${err.message}`);
 }
}

export async function getMigrationHistory() {
 if (slots.length === 0) return [];
 try {
 const sql = clientFor(activeIndex);
 const rows = await sql`SELECT data FROM app_store WHERE key = ${HISTORY_KEY}`;
 return rows[0]?.data?.records || [];
 } catch {
 return [];
 }
}

// ─── Monitor kuota ──────────────────────────────────────────────────────────
/**
 * Pengecekan berkala. Bila pemakaian database aktif >= ambang batas,
 * failover dijalankan otomatis (cadangkan → pindah → verifikasi).
 */
export async function checkQuotaAndRotate() {
 if (slots.length === 0) return { skipped: 'local_file_store' };
 await initPool();

 try {
 const usage = await measureUsage(activeIndex, { force: true });
 slots[activeIndex].healthy = true;
 slots[activeIndex].lastCheckedAt = new Date().toISOString();

 if (usage.ratio >= QUOTA_THRESHOLD) {
 pushEvent('warn',
 `Slot #${numOf(activeIndex)} mencapai ${(usage.ratio * 100).toFixed(1)}% ` +
 `(${formatBytes(usage.bytes)} / ${formatBytes(QUOTA_BYTES)}) — ambang ${(QUOTA_THRESHOLD * 100).toFixed(0)}%. Memulai failover otomatis.`
 );
 if (slots.length < 2) {
 pushEvent('error', 'Tidak ada database cadangan. Tambahkan URL berikutnya melalui DATABASE_URLS_FILE.');
 return { usage, rotated: false, reason: 'no_backup_slot' };
 }
 const record = await rotateToNextSlot(
 `Kuota tercapai: ${(usage.ratio * 100).toFixed(1)}% dari ${formatBytes(QUOTA_BYTES)}`
 );
 return { usage, rotated: true, record };
 }

 return { usage, rotated: false };
 } catch (err) {
 if (isQuotaError(err) && slots.length > 1) {
 pushEvent('warn', `Monitor mendeteksi error kuota: ${err.message} → failover.`);
 const record = await rotateToNextSlot(`Error kuota saat monitoring: ${err.message}`);
 return { rotated: true, record };
 }
 pushEvent('error', `Monitor gagal: ${err.message}`);
 return { error: err.message, rotated: false };
 }
}

export function startQuotaMonitor() {
 if (monitorTimer) return;
 if (!hasAnyDatabase()) {
 pushEvent('info', 'Monitor kuota tidak dijalankan (mode local file store).');
 return;
 }
 // Jalankan sekali di awal (ditunda 15 detik agar server siap dulu)
 setTimeout(() => { checkQuotaAndRotate().catch(() => {}); }, 15_000);
 monitorTimer = setInterval(() => { checkQuotaAndRotate().catch(() => {}); }, MONITOR_INTERVAL_MS);
 if (monitorTimer.unref) monitorTimer.unref();
 pushEvent('info', `Monitor kuota aktif — cek tiap ${Math.round(MONITOR_INTERVAL_MS / 1000)} detik, ambang ${(QUOTA_THRESHOLD * 100).toFixed(0)}%.`);
}

export function stopQuotaMonitor() {
 if (monitorTimer) {
 clearInterval(monitorTimer);
 monitorTimer = null;
 pushEvent('info', 'Monitor kuota dihentikan.');
 }
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL ADMIN — Konfigurasi slot database Neon (nomor 1–100)
// ═══════════════════════════════════════════════════════════════════════════

function httpError(status, message) {
 const err = new Error(message);
 err.status = status;
 return err;
}

function cleanText(value, max) {
 return typeof value === 'string'
 ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)
 : '';
}

/** Hilangkan password dari pesan error sebelum dikirim ke UI. */
function scrubSecret(message, url) {
 let out = String(message || '');
 try {
 const pwd = decodeURIComponent(new URL(url).password || '');
 if (pwd.length >= 4) out = out.split(pwd).join('****');
 } catch {}
 return out;
}

function withTimeout(promise, ms, message) {
 let timer;
 const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
 return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Validasi satu connection string Neon.
 * Host dibatasi ke *.neon.tech (atau DB_ALLOWED_HOST_SUFFIXES) agar server tidak
 * bisa dipakai untuk menembak host sembarang (SSRF) lewat driver HTTP Neon.
 */
export function validateDbUrl(input) {
 const raw = String(input ?? '').trim().replace(/^['"`]+|['"`]+$/g, '');
 if (!raw) return { ok: false, error: 'URL kosong.' };

 let u;
 try { u = new URL(raw); } catch { return { ok: false, error: 'Format URL tidak valid.' }; }

 if (u.protocol !== 'postgresql:' && u.protocol !== 'postgres:') {
 return { ok: false, error: 'Harus diawali postgresql:// atau postgres://' };
 }
 if (!u.username || !u.password) {
 return { ok: false, error: 'Username atau password tidak ada di URL.' };
 }
 const host = u.hostname.toLowerCase();
 if (!host) return { ok: false, error: 'Host tidak ada di URL.' };

 let database = '';
 try { database = decodeURIComponent(u.pathname.replace(/^\//, '')); } catch { database = u.pathname.replace(/^\//, ''); }
 if (!database) return { ok: false, error: 'Nama database tidak ada di URL (…/neondb).' };

 if (!ALLOW_ANY_HOST && !ALLOWED_HOST_SUFFIXES.some(suffix => host.endsWith(suffix))) {
 return { ok: false, error: `Host harus berakhiran ${ALLOWED_HOST_SUFFIXES.join(' / ')}.` };
 }

 const warnings = [];
 if (!host.includes('-pooler')) {
 warnings.push('Host tidak mengandung "-pooler". Disarankan memakai connection string Pooled dari Neon.');
 }
 return { ok: true, url: raw, host, database, warnings, fingerprint: fingerprint(raw) };
}

// ─── Persistensi konfigurasi panel ──────────────────────────────────────────
function normalizeManagedConfig(raw) {
 const input = Array.isArray(raw?.slots) ? raw.slots : [];
 const used = new Set();
 const out = [];
 for (const item of input) {
 const number = Number(item?.number);
 const url = typeof item?.url === 'string' ? item.url.trim() : '';
 if (!Number.isInteger(number) || number < 1 || number > PANEL_MAX_SLOTS || !url || used.has(number)) continue;
 used.add(number);
 out.push({
 number,
 url,
 label: cleanText(item.label, 40),
 note: cleanText(item.note, 200),
 enabled: item.enabled !== false,
 createdAt: item.createdAt || null,
 updatedAt: item.updatedAt || null
 });
 }
 out.sort((a, b) => a.number - b.number);
 return {
 version: Number.isInteger(raw?.version) && raw.version >= 0 ? raw.version : 0,
 updatedAt: raw?.updatedAt || null,
 slots: out
 };
}

/** Baca konfigurasi panel dari file lokal + database jangkar ENV; ambil versi tertinggi. */
async function loadManagedConfig() {
 const found = [];
 try {
 if (fs.existsSync(SLOT_CONFIG_FILE)) {
 found.push(normalizeManagedConfig(JSON.parse(fs.readFileSync(SLOT_CONFIG_FILE, 'utf-8'))));
 }
 } catch {}

 const anchors = readEnvSlotConfig().slice(0, CONFIG_ANCHOR_FANOUT);
 await Promise.all(anchors.map(async (item) => {
 try {
 const sql = neon(item.url);
 const rows = await withTimeout(
 sql`SELECT data FROM app_store WHERE key = ${SLOT_CONFIG_KEY}`,
 10_000, 'timeout membaca config slot'
 );
 if (rows[0]?.data) found.push(normalizeManagedConfig(rows[0].data));
 } catch {
 // tabel belum ada / database jangkar tidak terjangkau — lewati
 }
 }));

 found.sort((a, b) => b.version - a.version);
 managedConfig = found[0] || { version: 0, updatedAt: null, slots: [] };
 return managedConfig;
}

/** Simpan konfigurasi panel ke database jangkar ENV + file lokal. */
async function persistManagedConfig(cfg) {
 const json = JSON.stringify(cfg);
 const anchors = readEnvSlotConfig().slice(0, CONFIG_ANCHOR_FANOUT);

 // Di Vercel disk bersifat sementara: tanpa database jangkar (DATABASE_URL), konfigurasi
 // hanya akan tertulis ke /tmp lalu HILANG saat server restart. Tolak dengan pesan jelas.
 if (anchors.length === 0 && process.env.VERCEL) {
 throw httpError(500, 'Konfigurasi slot tidak bisa disimpan permanen: DATABASE_URL (jangkar) belum diisi di Environment Variables Vercel. Isi minimal satu DATABASE_URL lalu redeploy, kemudian ulangi perubahan.');
 }

 const results = await Promise.allSettled(anchors.map(async (item) => {
 const sql = neon(item.url);
 await withTimeout((async () => {
 await sql`
 CREATE TABLE IF NOT EXISTS app_store (
 key TEXT PRIMARY KEY,
 data JSONB NOT NULL,
 updated_at TIMESTAMPTZ DEFAULT NOW()
 )
 `;
 await sql`
 INSERT INTO app_store (key, data, updated_at)
 VALUES (${SLOT_CONFIG_KEY}, ${json}, NOW())
 ON CONFLICT (key) DO UPDATE SET data = ${json}, updated_at = NOW()
 `;
 })(), 15_000, 'timeout menyimpan config slot');
 }));
 const dbOk = results.filter(r => r.status === 'fulfilled').length;

 // Jika ada database jangkar tapi tak satu pun berhasil, batalkan SEBELUM menyentuh
 // file lokal — kalau tidak, perubahan yang ditolak akan muncul lagi saat config dimuat ulang.
 if (anchors.length > 0 && dbOk === 0) {
 const first = results.find(r => r.status === 'rejected');
 throw httpError(502, `Gagal menyimpan konfigurasi ke database ENV: ${scrubSecret(first?.reason?.message, anchors[0].url)}`);
 }

 let fileOk = false;
 try {
 ensureDirs();
 fs.writeFileSync(SLOT_CONFIG_FILE, json, { encoding: 'utf-8', mode: 0o600 });
 fileOk = true;
 } catch {}

 if (anchors.length === 0 && !fileOk) {
 throw httpError(500, 'Gagal menyimpan konfigurasi: tidak ada database ENV dan file lokal tidak bisa ditulis.');
 }
 return { dbOk, dbTried: anchors.length, fileOk };
}

/** Terapkan konfigurasi panel terbaru ke pool yang sedang berjalan. */
async function reloadSlots() {
 const wasEmpty = slots.length === 0;
 const activeUrl = slots[activeIndex]?.url ?? null;

 buildSlots();
 usageCache.clear();

 if (slots.length === 0) {
 initialized = true;
 return;
 }

 const newActive = activeUrl ? slots.findIndex(sl => sl.url === activeUrl) : -1;
 if (wasEmpty || newActive < 0) {
 initialized = false;
 initPromise = null;
 await initPool({ force: true, skipConfigLoad: true });
 } else {
 activeIndex = newActive;
 }
 if (!process.env.VERCEL) startQuotaMonitor();
}

/** Samakan memori dengan versi config terbaru (untuk deploy multi-instance). */
export async function syncManagedConfig() {
 await initPool();
 const before = managedConfig.version;
 await loadManagedConfig();
 if (managedConfig.version !== before) await reloadSlots();
 return managedConfig;
}

/** Jalankan perubahan config secara serial, dengan cek versi (optimistic lock). */
function mutateManagedConfig(mutator, { expectedVersion = null } = {}) {
 const run = configMutex.then(async () => {
 if (failoverInFlight) throw httpError(409, 'Migrasi/failover database sedang berjalan. Coba lagi setelah selesai.');
 await initPool();
 await loadManagedConfig();

 if (expectedVersion !== null && expectedVersion !== undefined && Number(expectedVersion) !== managedConfig.version) {
 throw httpError(409, 'Konfigurasi sudah diubah admin lain. Muat ulang panel lalu ulangi perubahan.');
 }

 const draft = JSON.parse(JSON.stringify(managedConfig));
 const envList = readEnvSlotConfig();
 const activeUrl = slots[activeIndex]?.url ?? null;
 const result = await mutator(draft, { envList, activeUrl });

 if (result?.changed === false) {
 return { ...result, version: managedConfig.version, persisted: null };
 }

 const next = normalizeManagedConfig(draft);
 next.version = managedConfig.version + 1;
 next.updatedAt = new Date().toISOString();

 const persisted = await persistManagedConfig(next);
 managedConfig = next;
 await reloadSlots();

 pushEvent('info', `Konfigurasi slot via panel admin diperbarui (versi ${next.version}, ${next.slots.length} slot panel).`);
 return { ...result, version: next.version, persisted };
 });
 configMutex = run.catch(() => {});
 return run;
}

function findDuplicate(fp, draft, envList, exceptNumber = null) {
 for (const item of envList) {
 if (fingerprint(item.url) === fp) return item.number;
 }
 for (const m of draft.slots) {
 if (m.number !== exceptNumber && fingerprint(m.url) === fp) return m.number;
 }
 return null;
}

function assertPanelNumber(value, envList) {
 const n = Number(value);
 if (!Number.isInteger(n) || n < 1 || n > PANEL_MAX_SLOTS) {
 throw httpError(400, `Nomor slot harus bilangan bulat 1–${PANEL_MAX_SLOTS}.`);
 }
 if (n <= envList.length) {
 throw httpError(409, `Slot ${n} dikunci karena berasal dari ENV (${envList[n - 1].envVar}). Ubah lewat environment variable.`);
 }
 return n;
}

// ─── Operasi satu slot ──────────────────────────────────────────────────────
/** Tambah / ubah satu slot. url kosong pada slot yang sudah ada = URL tidak diubah. */
export function upsertManagedSlot(number, fields = {}, { expectedVersion = null } = {}) {
 return mutateManagedConfig(async (draft, { envList, activeUrl }) => {
 const n = assertPanelNumber(number, envList);
 const existing = draft.slots.find(s => s.number === n);
 const now = new Date().toISOString();
 const warnings = [];

 let url = existing?.url || '';
 const incoming = typeof fields.url === 'string' ? fields.url.trim() : '';
 if (incoming) {
 const v = validateDbUrl(incoming);
 if (!v.ok) throw httpError(400, v.error);
 const dup = findDuplicate(v.fingerprint, draft, envList, n);
 if (dup) throw httpError(409, `Database ini sudah terdaftar di slot ${dup}. Tiap slot harus project/endpoint Neon yang berbeda.`);
 if (existing && existing.url !== v.url && existing.url === activeUrl) {
 throw httpError(409, `Slot ${n} sedang AKTIF dan tidak boleh diganti URL-nya. Lakukan failover ke slot lain dulu.`);
 }
 url = v.url;
 warnings.push(...v.warnings);
 }
 if (!url) throw httpError(400, 'URL wajib diisi untuk slot baru.');

 const enabled = fields.enabled === undefined ? (existing?.enabled ?? true) : !!fields.enabled;
 if (!enabled && url === activeUrl) {
 throw httpError(409, `Slot ${n} sedang AKTIF dan tidak boleh dinonaktifkan. Lakukan failover ke slot lain dulu.`);
 }

 const entry = {
 number: n,
 url,
 label: fields.label === undefined ? (existing?.label || '') : cleanText(fields.label, 40),
 note: fields.note === undefined ? (existing?.note || '') : cleanText(fields.note, 200),
 enabled,
 createdAt: existing?.createdAt || now,
 updatedAt: now
 };
 draft.slots = draft.slots.filter(s => s.number !== n).concat(entry);
 return { number: n, created: !existing, warnings };
 }, { expectedVersion });
}

export function removeManagedSlot(number, { expectedVersion = null } = {}) {
 return mutateManagedConfig(async (draft, { envList, activeUrl }) => {
 const n = assertPanelNumber(number, envList);
 const existing = draft.slots.find(s => s.number === n);
 if (!existing) throw httpError(404, `Slot ${n} sudah kosong.`);
 if (existing.url === activeUrl) {
 throw httpError(409, `Slot ${n} sedang AKTIF dan tidak boleh dihapus. Lakukan failover ke slot lain dulu.`);
 }
 draft.slots = draft.slots.filter(s => s.number !== n);
 return { number: n };
 }, { expectedVersion });
}

// ─── Import massal (database_urls) ──────────────────────────────────────────
const URL_PATTERN = /postgres(?:ql)?:\/\/[^\s'"`,;<>]+/gi;
const BULK_MAX_LINES = 500;

/** Pecah teks bebas (satu per baris, dipisah koma, JSON array, atau DATABASE_URLS=...). */
export function parseBulkInput(text) {
 const entries = [];
 const lines = String(text ?? '').split(/\r?\n/);
 if (lines.length > BULK_MAX_LINES) {
 throw httpError(400, `Terlalu banyak baris (maks ${BULK_MAX_LINES}).`);
 }
 lines.forEach((line, i) => {
 const trimmed = line.trim();
 if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;
 const matches = trimmed.match(URL_PATTERN);
 if (!matches) {
 // sisa JSON / kurung / koma tunggal bukan error
 if (/^[\[\]{}(),;'"`\s]*$/.test(trimmed)) return;
 entries.push({ line: i + 1, raw: trimmed.slice(0, 50), error: 'Bukan connection string PostgreSQL.' });
 return;
 }
 matches.forEach(m => entries.push({ line: i + 1, raw: m }));
 });
 return entries;
}

/**
 * Rencana import (murni, tanpa efek samping). Dipakai untuk pratinjau dan eksekusi.
 * mode: 'fill'    → isi nomor kosong terendah (default), slot yang ada dibiarkan
 *       'replace' → hapus semua slot panel (kecuali yang AKTIF) lalu isi ulang
 */
function planBulkImport(draft, envList, activeUrl, text, { mode = 'fill', startAt = null, labelPrefix = '' } = {}) {
 if (mode !== 'fill' && mode !== 'replace') throw httpError(400, 'mode harus "fill" atau "replace".');
 const entries = parseBulkInput(text);
 if (entries.length === 0) throw httpError(400, 'Tidak ada connection string yang ditemukan di teks.');

 const firstFree = Math.max(envList.length + 1, Number.isInteger(Number(startAt)) && Number(startAt) > 0 ? Number(startAt) : 1);
 const now = new Date().toISOString();
 const removed = [];
 let slotsOut = draft.slots.slice();

 if (mode === 'replace') {
 slotsOut = slotsOut.filter(s => {
 const keep = s.url === activeUrl;
 if (!keep) removed.push(s.number);
 return keep;
 });
 }

 const occupied = new Set(slotsOut.map(s => s.number));
 const seen = new Map();
 envList.forEach(item => seen.set(fingerprint(item.url), item.number));
 slotsOut.forEach(s => seen.set(fingerprint(s.url), s.number));

 const nextFree = () => {
 for (let n = firstFree; n <= PANEL_MAX_SLOTS; n++) if (!occupied.has(n)) return n;
 return null;
 };

 const prefix = cleanText(labelPrefix, 30);
 const results = [];
 for (const entry of entries) {
 if (entry.error) { results.push({ line: entry.line, status: 'invalid', message: entry.error, preview: entry.raw }); continue; }
 const v = validateDbUrl(entry.raw);
 if (!v.ok) { results.push({ line: entry.line, status: 'invalid', message: v.error, preview: maskUrl(entry.raw) }); continue; }
 if (seen.has(v.fingerprint)) {
 results.push({ line: entry.line, status: 'duplicate', slot: seen.get(v.fingerprint), host: v.host, message: `Sudah terdaftar di slot ${seen.get(v.fingerprint)}.` });
 continue;
 }
 const n = nextFree();
 if (n === null) {
 results.push({ line: entry.line, status: 'full', host: v.host, message: `Slot 1–${PANEL_MAX_SLOTS} penuh.` });
 continue;
 }
 occupied.add(n);
 seen.set(v.fingerprint, n);
 slotsOut.push({
 number: n, url: v.url, label: prefix ? `${prefix}-${n}` : '', note: '',
 enabled: true, createdAt: now, updatedAt: now
 });
 results.push({ line: entry.line, status: 'added', slot: n, host: v.host, connection: maskUrl(v.url), warnings: v.warnings });
 }

 const count = (st) => results.filter(r => r.status === st).length;
 return {
 slots: slotsOut,
 removed,
 results,
 summary: {
 total: results.length,
 added: count('added'),
 duplicate: count('duplicate'),
 invalid: count('invalid'),
 full: count('full'),
 removed: removed.length
 }
 };
}

/** Pratinjau import massal — tidak mengubah apa pun. */
export async function previewBulkImport(text, options = {}) {
 await syncManagedConfig();
 const envList = readEnvSlotConfig();
 const activeUrl = slots[activeIndex]?.url ?? null;
 const plan = planBulkImport(managedConfig, envList, activeUrl, text, options);
 return { dryRun: true, version: managedConfig.version, summary: plan.summary, results: plan.results, removed: plan.removed };
}

/** Terapkan import massal. */
export function applyBulkImport(text, { expectedVersion = null, ...options } = {}) {
 return mutateManagedConfig(async (draft, { envList, activeUrl }) => {
 const plan = planBulkImport(draft, envList, activeUrl, text, options);
 if (plan.summary.added === 0 && plan.summary.removed === 0) {
 return { changed: false, dryRun: false, summary: plan.summary, results: plan.results, removed: plan.removed };
 }
 draft.slots = plan.slots;
 return { dryRun: false, summary: plan.summary, results: plan.results, removed: plan.removed };
 }, { expectedVersion });
}

// ─── Tes koneksi ────────────────────────────────────────────────────────────
/** Uji satu connection string (tidak disimpan). */
export async function testDbUrl(url, { timeoutMs = 12_000 } = {}) {
 const v = validateDbUrl(url);
 if (!v.ok) return { ok: false, error: v.error };

 const started = Date.now();
 try {
 const sql = neon(v.url);
 const rows = await withTimeout(sql`
 SELECT current_database() AS db,
 pg_database_size(current_database())::bigint AS bytes,
 to_regclass('public.app_store') IS NOT NULL AS has_store
 `, timeoutMs, `Timeout ${Math.round(timeoutMs / 1000)} detik — compute Neon mungkin sedang bangun, coba lagi.`);
 const bytes = Number(rows[0]?.bytes || 0);
 return {
 ok: true,
 host: v.host,
 database: rows[0]?.db,
 latencyMs: Date.now() - started,
 usedBytes: bytes,
 usedLabel: formatBytes(bytes),
 usagePercent: QUOTA_BYTES > 0 ? Number(((bytes / QUOTA_BYTES) * 100).toFixed(1)) : 0,
 hasAppStore: !!rows[0]?.has_store,
 warnings: v.warnings
 };
 } catch (err) {
 return { ok: false, host: v.host, latencyMs: Date.now() - started, error: scrubSecret(err.message, v.url), warnings: v.warnings };
 }
}

/** Cari URL slot (ENV atau panel, termasuk yang dinonaktifkan) berdasarkan nomor. */
function urlForNumber(number) {
 const n = Number(number);
 const env = readEnvSlotConfig();
 if (n >= 1 && n <= env.length) return env[n - 1].url;
 return managedConfig.slots.find(s => s.number === n)?.url || null;
}

/** Tes beberapa slot tersimpan sekaligus (dibatasi concurrency) dan catat statusnya. */
export async function testSlots(numbers, { concurrency = 8 } = {}) {
 await syncManagedConfig();
 const list = [...new Set((numbers || []).map(Number))].filter(n => Number.isInteger(n) && n >= 1 && n <= Math.max(MAX_SLOTS, PANEL_MAX_SLOTS));
 const out = [];
 for (let start = 0; start < list.length; start += concurrency) {
 const batch = list.slice(start, start + concurrency);
 const done = await Promise.all(batch.map(async (n) => {
 const url = urlForNumber(n);
 if (!url) return { slot: n, ok: false, empty: true, error: 'Slot kosong.' };
 const res = await testDbUrl(url);
 const live = slots.find(sl => sl.number === n);
 if (live) {
 live.healthy = res.ok;
 live.lastError = res.ok ? null : res.error;
 live.lastCheckedAt = new Date().toISOString();
 }
 return { slot: n, ...res };
 }));
 out.push(...done);
 }
 return out;
}

// ─── Tampilan untuk panel ───────────────────────────────────────────────────
export function getActiveSlotNumber() {
 return slots.length ? numOf(activeIndex) : null;
}

export function slotIndexByNumber(number) {
 const n = Number(number);
 return slots.findIndex(sl => sl.number === n);
}

/** Data grid slot 1–100 untuk panel Admin (URL selalu disamarkan). */
export async function getSlotConfigView() {
 await syncManagedConfig();
 const env = readEnvSlotConfig();
 const envCount = env.length;
 const activeNum = getActiveSlotNumber();
 const live = new Map(slots.map(sl => [sl.number, sl]));
 const panel = new Map(managedConfig.slots.map(sl => [sl.number, sl]));

 const grid = [];
 for (let n = 1; n <= PANEL_MAX_SLOTS; n++) {
 const liveSlot = live.get(n);
 const health = {
 healthy: liveSlot?.healthy ?? null,
 lastError: liveSlot?.lastError ?? null,
 lastCheckedAt: liveSlot?.lastCheckedAt ?? null
 };

 if (n <= envCount) {
 const item = env[n - 1];
 grid.push({
 number: n, source: 'env', locked: true, envVar: item.envVar, enabled: true,
 label: liveSlot?.label || (n === 1 ? 'Primary' : `Backup-${n - 1}`),
 connection: maskUrl(item.url), host: hostOf(item.url),
 active: n === activeNum, inPool: !!liveSlot, ...health
 });
 continue;
 }

 const m = panel.get(n);
 if (!m) { grid.push({ number: n, source: 'empty', locked: false }); continue; }
 grid.push({
 number: n, source: 'panel', locked: false, enabled: m.enabled !== false,
 label: m.label || '', note: m.note || '',
 connection: maskUrl(m.url), host: hostOf(m.url),
 active: n === activeNum, inPool: !!liveSlot,
 createdAt: m.createdAt, updatedAt: m.updatedAt, ...health
 });
 }

 return {
 version: managedConfig.version,
 updatedAt: managedConfig.updatedAt,
 panelMax: PANEL_MAX_SLOTS,
 maxSlots: MAX_SLOTS,
 envCount,
 envOverflow: Math.max(0, envCount - PANEL_MAX_SLOTS),
 activeSlot: activeNum,
 poolSlots: slots.length,
 anchors: Math.min(envCount, CONFIG_ANCHOR_FANOUT),
 hostRule: ALLOW_ANY_HOST ? null : ALLOWED_HOST_SUFFIXES,
 slots: grid
 };
}

// ─── Status ─────────────────────────────────────────────────────────────────
function getPoolStatusSync() {
 return {
 mode: slots.length === 0 ? 'local_file_store' : 'neon_multi',
 totalSlots: slots.length,
 maxSlots: MAX_SLOTS,
 activeSlot: slots.length ? numOf(activeIndex) : null,
 generation,
 quotaBytes: QUOTA_BYTES,
 quotaLabel: formatBytes(QUOTA_BYTES),
 targetStorageMb: TARGET_STORAGE_MB,
 targetStorageBytes: TARGET_STORAGE_BYTES,
 quotaScope: 'application_level',
 neonStorageLimit: 'not controlled by DB_QUOTA_BYTES; governed by Neon plan/API quota',
 thresholdPercent: Math.round(QUOTA_THRESHOLD * 100),
 monitorIntervalMs: MONITOR_INTERVAL_MS,
 monitorRunning: !!monitorTimer,
 failoverInProgress: !!failoverInFlight
 };
}

/** Status lengkap termasuk pemakaian tiap slot — dipakai endpoint admin. */
export async function getPoolStatus({ probeAll = false } = {}) {
 await initPool();
 const base = getPoolStatusSync();

 async function describe(slot) {
 const info = {
 slot: numOf(slot.index),
 label: slot.label,
 host: slot.host,
 connection: maskUrl(slot.url),
 active: slot.index === activeIndex,
 healthy: slot.healthy,
 lastError: slot.lastError,
 lastCheckedAt: slot.lastCheckedAt
 };

 if (probeAll || slot.index === activeIndex) {
 try {
 const usage = await measureUsage(slot.index, { force: probeAll });
 info.usedBytes = usage.bytes;
 info.usedLabel = formatBytes(usage.bytes);
 info.usagePercent = Number((usage.ratio * 100).toFixed(1));
 info.rowCount = usage.rowCount;
 info.healthy = true;
 slot.healthy = true;
 } catch (err) {
 info.healthy = false;
 info.lastError = err.message;
 slot.healthy = false;
 slot.lastError = err.message;
 }
 }
 return info;
 }

 const PROBE_CONCURRENCY = Math.min(50, Math.max(1, Number(process.env.DB_PROBE_CONCURRENCY || 40)));
 const slotInfo = [];
 for (let start = 0; start < slots.length; start += PROBE_CONCURRENCY) {
 const batch = slots.slice(start, start + PROBE_CONCURRENCY);
 slotInfo.push(...await Promise.all(batch.map(describe)));
 }

 return { ...base, slots: slotInfo, events: events.slice(0, 20) };
}

export function getPoolEvents() {
 return events.slice();
}

export function getActiveSlotIndex() {
 return activeIndex;
}
