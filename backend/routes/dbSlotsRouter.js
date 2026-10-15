// routes/dbSlotsRouter.js
// Panel Admin: konfigurasi database Neon slot 1–100 (satu per satu & massal).
//
// Mount di server.js: app.use('/api/v1/db/slot-config', dbSlotsRouter);
// Semua endpoint WAJIB admin. URL lengkap (beserta password) TIDAK PERNAH
// dikirim balik ke browser — hanya versi yang disamarkan.

import express from 'express';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import {
 getSlotConfigView,
 upsertManagedSlot,
 removeManagedSlot,
 previewBulkImport,
 applyBulkImport,
 testDbUrl,
 testSlots,
 PANEL_MAX_SLOTS
} from '../lib/dbPool.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

function fail(res, err, fallback) {
 const status = Number.isInteger(err?.status) ? err.status : 500;
 res.status(status).json({ error: status === 500 ? `${fallback}: ${err.message}` : err.message });
}

function parseNumber(req) {
 const n = Number(req.params.number);
 return Number.isInteger(n) && n >= 1 && n <= PANEL_MAX_SLOTS ? n : null;
}

function expectedVersionOf(body) {
 const v = body?.expectedVersion;
 return Number.isInteger(v) ? v : null;
}

/** GET /api/v1/db/slot-config — grid slot 1–100 (disamarkan). */
router.get('/', async (req, res) => {
 try {
 res.json(await getSlotConfigView());
 } catch (err) {
 fail(res, err, 'Gagal memuat konfigurasi slot');
 }
});

/**
 * PUT /api/v1/db/slot-config/:number
 * Body: { url?, label?, note?, enabled?, expectedVersion? }
 * Slot baru wajib menyertakan url. Pada slot yang sudah ada, url kosong = tidak diubah.
 */
router.put('/:number', async (req, res) => {
 const number = parseNumber(req);
 if (number === null) return res.status(400).json({ error: `Nomor slot harus 1–${PANEL_MAX_SLOTS}.` });
 try {
 const { url, label, note, enabled } = req.body || {};
 const out = await upsertManagedSlot(number, { url, label, note, enabled }, { expectedVersion: expectedVersionOf(req.body) });
 await logActivity({
 req,
 action: 'DB_SLOT_UPDATE',
 target: `Slot ${number}`,
 details: out.created ? 'Slot database Neon ditambahkan via panel admin.' : 'Slot database Neon diperbarui via panel admin.'
 });
 res.json({ success: true, ...out });
 } catch (err) {
 await logActivity({ req, action: 'DB_SLOT_UPDATE', target: `Slot ${number}`, details: err.message, status: 'FAILED' }).catch(() => {});
 fail(res, err, 'Gagal menyimpan slot');
 }
});

/** DELETE /api/v1/db/slot-config/:number — kosongkan slot (data di database Neon-nya TIDAK dihapus). */
router.delete('/:number', async (req, res) => {
 const number = parseNumber(req);
 if (number === null) return res.status(400).json({ error: `Nomor slot harus 1–${PANEL_MAX_SLOTS}.` });
 try {
 const expectedVersion = Number.isInteger(Number(req.query.expectedVersion)) ? Number(req.query.expectedVersion) : null;
 const out = await removeManagedSlot(number, { expectedVersion });
 await logActivity({ req, action: 'DB_SLOT_UPDATE', target: `Slot ${number}`, details: 'Slot database Neon dihapus dari konfigurasi panel admin.' });
 res.json({ success: true, ...out });
 } catch (err) {
 await logActivity({ req, action: 'DB_SLOT_UPDATE', target: `Slot ${number}`, details: err.message, status: 'FAILED' }).catch(() => {});
 fail(res, err, 'Gagal menghapus slot');
 }
});

/**
 * POST /api/v1/db/slot-config/bulk
 * Body: { text, mode: 'fill'|'replace', startAt?, labelPrefix?, dryRun?, expectedVersion? }
 * text = daftar database_urls (satu per baris, dipisah koma, atau JSON array).
 */
router.post('/bulk', async (req, res) => {
 try {
 const { text, mode, startAt, labelPrefix, dryRun } = req.body || {};
 if (typeof text !== 'string' || !text.trim()) {
 return res.status(400).json({ error: 'Isi daftar database_urls terlebih dahulu.' });
 }
 const options = { mode: mode || 'fill', startAt, labelPrefix };

 if (dryRun) {
 return res.json(await previewBulkImport(text, options));
 }

 const out = await applyBulkImport(text, { ...options, expectedVersion: expectedVersionOf(req.body) });
 if (out.summary.added > 0 || out.summary.removed > 0) {
 await logActivity({
 req,
 action: 'DB_SLOT_UPDATE',
 target: 'Import massal database_urls',
 details: `Mode ${options.mode}: ${out.summary.added} slot ditambahkan, ${out.summary.removed} dihapus, ${out.summary.duplicate} duplikat, ${out.summary.invalid} tidak valid.`
 });
 }
 res.json({ success: true, ...out });
 } catch (err) {
 await logActivity({ req, action: 'DB_SLOT_UPDATE', target: 'Import massal database_urls', details: err.message, status: 'FAILED' }).catch(() => {});
 fail(res, err, 'Import massal gagal');
 }
});

/** POST /api/v1/db/slot-config/test — uji URL kandidat tanpa menyimpan. Body: { url } */
router.post('/test', async (req, res) => {
 try {
 const { url } = req.body || {};
 if (typeof url !== 'string' || !url.trim()) return res.status(400).json({ error: 'URL wajib diisi.' });
 res.json(await testDbUrl(url));
 } catch (err) {
 fail(res, err, 'Tes koneksi gagal');
 }
});

/** POST /api/v1/db/slot-config/test-batch — uji slot tersimpan. Body: { numbers: [1,2,...] } (maks 20) */
router.post('/test-batch', async (req, res) => {
 try {
 const numbers = Array.isArray(req.body?.numbers) ? req.body.numbers : [];
 if (numbers.length === 0) return res.status(400).json({ error: 'numbers wajib berisi minimal 1 nomor slot.' });
 if (numbers.length > 20) return res.status(400).json({ error: 'Maksimal 20 slot per permintaan.' });
 res.json({ results: await testSlots(numbers) });
 } catch (err) {
 fail(res, err, 'Tes koneksi gagal');
 }
});

export default router;
