// utils/htmlDataExtractor.js
// ─────────────────────────────────────────────────────────────────────────────
// Ekstraktor Berkas HTML → JSON Mentah (Reverse dari htmlReportGenerator.js
// dan htmlBackupGenerator.js).
//
// Tujuan: hasil ekstraksi HARUS identik dengan berkas hasil unduhan
// "Unduh Mentahan (.json)" — bukan ringkasan seadanya.
//
// Strategi 3 lapis:
// 1. EMBEDDED → berkas HTML versi baru menyimpan JSON asli di dalam
// <script id="raw-backup-data">. Ini 100% lossless, dipakai apa adanya.
// 2. SCRAPE → berkas HTML versi lama tidak punya blok itu. Setiap elemen
// yang dirender generator dibaca balik satu per satu dan
// dipetakan kembali ke skema dokumen RKA yang asli.
// 3. REBUILD → nilai turunan (proporsi usulan, metrik SROI, status, dsb.)
// dihitung ulang memakai fungsi inti yang sama persis dengan
// yang dipakai aplikasi, lalu diverifikasi silang dengan angka
// yang tercetak di HTML. Selisih apa pun dilaporkan sebagai warning.
// ─────────────────────────────────────────────────────────────────────────────

import {
 computeSroi16Rules,
 cleanOpdName,
 buildUsulanProporsi
} from '@/composables/useAnalysis';

/* ═══════════════════════════ UTILITAS PARSING ═══════════════════════════ */

const txt = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

const qText = (root, sel) => txt(root?.querySelector(sel));

const qAll = (root, sel) => Array.from(root?.querySelectorAll(sel) || []);

/**
 * "Rp 281.191.300" | "-Rp 35.000.000" | "Awal: Rp 105.000.000" → Number
 * Mengikuti format id-ID: titik = pemisah ribuan, koma = desimal.
 */
function parseRupiah(raw) {
 if (raw === null || raw === undefined) return null;
 const s = String(raw);
 const m = s.match(/-?\s*(?:Rp)?\s*[\d][\d.,]*/i);
 if (!m) return null;
 const neg = /-\s*(?:Rp)?\s*\d/i.test(s);
 let body = m[0].replace(/[^\d.,]/g, '');
 body = body.replace(/\./g, '').replace(/,/g, '.');
 const n = Number(body);
 if (!isFinite(n)) return null;
 return neg ? -n : n;
}

/** "37.34%" | "19,3 %" → 37.34 */
function parsePersen(raw) {
 if (raw === null || raw === undefined) return null;
 const m = String(raw).match(/-?[\d][\d.,]*/);
 if (!m) return null;
 let body = m[0];
 // Kalau ada titik DAN koma → format id-ID (1.234,5). Kalau hanya koma → desimal koma.
 if (body.includes('.') && body.includes(',')) body = body.replace(/\./g, '').replace(',', '.');
 else body = body.replace(',', '.');
 const n = Number(body);
 return isFinite(n) ? n : null;
}

/** Buang ikon/simbol di depan label, mis. " Inefisien" → "Inefisien" */
const stripIcon = (s) => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();

const isBlank = (s) => !s || !String(s).trim() || String(s).trim() === '-';

const slug = (s) =>
 String(s || '')
 .normalize('NFKD')
 .replace(/[^\w]+/g, '_')
 .replace(/^_+|_+$/g, '')
 .toUpperCase()
 .slice(0, 48);

/**
 * Kalimat/nilai default yang DIBUAT generator saat field aslinya kosong.
 * Kalau yang terbaca sama persis dengan salah satu ini, field tersebut
 * memang kosong di dokumen asli → jangan ditulis balik sebagai data AI.
 */
const GENERATED_FILLERS = new Set([
 'Item belanja ini terindikasi kurang efisien dan berpotensi diefisienkan.',
 'Alokasi anggaran belanja ini dinilai tepat untuk mendukung sasaran utama program.',
 'Alokasi belanja ini melebihi batas efisiensi operasional atau tidak sepadan dengan keluaran.',
 'Data pembanding harga satuan atau rincian belum mencukupi untuk menilai efisiensi secara valid.',
 'Alokasi anggaran belanja ini dinilai wajar dan berada dalam batas efisiensi standar.',
 'Alokasi anggaran dinilai memadai untuk mencapai target kinerja yang ditetapkan.',
 'Program memberikan dampak sosial dan peningkatan taraf layanan masyarakat secara berkelanjutan.'
]);

const realOrNull = (s) => (isBlank(s) || GENERATED_FILLERS.has(String(s).trim()) ? null : String(s).trim());

/** Hapus key bernilai null/undefined supaya bentuk JSON sedekat mungkin dengan aslinya. */
function compact(obj) {
 const out = {};
 for (const [k, v] of Object.entries(obj)) {
 if (v !== null && v !== undefined) out[k] = v;
 }
 return out;
}

/* ═════════════════════ LAPIS 1: JSON TERTANAM (LOSSLESS) ════════════════ */

function readEmbeddedJson(dom) {
 const candidates = [
 dom.getElementById('raw-backup-data'),
 dom.getElementById('sintra-backup-data'),
 ...qAll(dom, 'script[type="application/json"]')
 ].filter(Boolean);

 for (const el of candidates) {
 const raw = (el.textContent || '').trim();
 if (!raw) continue;
 try {
 const parsed = JSON.parse(raw);
 if (parsed && typeof parsed === 'object') return parsed;
 } catch {
 /* lanjut ke kandidat berikutnya */
 }
 }
 return null;
}

/* ═══════════════ LAPIS 2: SCRAPER DALAM (HTML VERSI LAMA) ═══════════════ */

/** Bagian 1 — Hero: subkeg, perangkat daerah, program, kegiatan, pagu, tahun. */
function scrapeHero(dom) {
 const heroMains = qAll(dom, '.rka-hero-main-val');
 const heroTexts = qAll(dom, '.rka-hero-text-val');

 // namaDokumen = nama berkas PDF asli, tersimpan di <title>, BUKAN di hero.
 const rawTitle = qText(dom, 'title');
 const namaDokumen = rawTitle.replace(/^Analisis RKA\s*[-–]\s*/i, '').trim();

 const subKegiatan = txt(heroMains[0]) || null;
 const opdRaw = txt(heroMains[1]) || null;
 const program = txt(heroTexts[0]) || null;
 const kegiatan = txt(heroTexts[1]) || null;

 const pagu = parseRupiah(qText(dom, '.pagu-anggaran-box .tab-amount-num')) || 0;
 const tahunMatch = qText(dom, '.tahun-anggaran-year').match(/(\d{4})/);
 const tahunRencana = tahunMatch ? Number(tahunMatch[1]) : new Date().getFullYear();

 return { namaDokumen, subKegiatan, opdRaw, program, kegiatan, pagu, tahunRencana };
}

/** Bagian 2 — Indikator & target kinerja. */
function scrapeIndikator(dom, subKegiatan) {
 const cards = qAll(dom, '.indikator-item-card').map((c) => ({
 level: qText(c, '.indikator-item-level') || null,
 target: qText(c, '.indikator-item-target') || null,
 tolok_ukur: qText(c, '.indikator-item-nama') || null
 }));

 // Generator memakai kartu tunggal "TARGET OUTPUT" sebagai pengganti
 // ketika indikatorKinerja kosong → kembalikan ke bentuk aslinya.
 const isPlaceholder =
 cards.length === 1 &&
 cards[0].level === 'TARGET OUTPUT' &&
 cards[0].tolok_ukur === subKegiatan;

 if (isPlaceholder) {
 return { indikatorKinerja: [], target: cards[0].target || null };
 }
 return {
 indikatorKinerja: cards.map((c) => compact(c)),
 target: null
 };
}

/** Bagian 3 — Kesesuaian anggaran & justifikasi outcome. */
function scrapeKesesuaian(dom) {
 const card = dom.querySelector('.kesesuaian-card');
 let kesesuaianAnggaran = null;

 if (card) {
 kesesuaianAnggaran = compact({
 status: qText(card, '.kesesuaian-status-pill') || null,
 penjelasan: realOrNull(qText(card, '.kesesuaian-penjelasan')),
 estimasi_biaya_per_output: qText(card, '.kesesuaian-estimasi strong') || null,
 proyeksi_pencapaian_target: qText(card, '.proyeksi-target-pill') || null,
 alasan_proyeksi_target: qText(card, '.proyeksi-target-alasan') || null
 });
 if (Object.keys(kesesuaianAnggaran).length === 0) kesesuaianAnggaran = null;
 }

 const justifikasiOutcome = realOrNull(qText(dom, '.justifikasi-text'));
 return { kesesuaianAnggaran, justifikasiOutcome };
}

/**
 * Bagian 4a — Data pie chart.
 * Sumber utama: literal array di dalam <script> (paling presisi).
 * Cadangan: legenda pie di DOM.
 */
function scrapePieData(dom, htmlText) {
 const grab = (name) => {
 const re = new RegExp(`${name}\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;`);
 const m = htmlText.match(re);
 if (!m) return null;
 try {
 return JSON.parse(m[1]);
 } catch {
 return null;
 }
 };

 const pair = (labels, values) =>
 labels && values && labels.length === values.length
 ? labels.map((nama, i) => ({ nama: String(nama).trim(), persen: Number(values[i]) }))
 : null;

 let awal = pair(grab('awalLabels'), grab('awalValues'));
 let usulan = pair(grab('usulanLabels'), grab('usulanValues'));

 if (!awal || !usulan) {
 const cols = qAll(dom, '.belanja-rekomendasi-grid .belanja-col');
 const fromLegend = (col) =>
 qAll(col, '.pie-legend li').map((li) => ({
 nama: qText(li, '.legend-name'),
 persen: parsePersen(qText(li, '.legend-pct'))
 }));
 if (!awal && cols[0]) awal = fromLegend(cols[0]);
 if (!usulan && cols[1]) usulan = fromLegend(cols[1]);
 }

 return { awal: awal || [], usulan: usulan || [] };
}

/**
 * Generator menambahkan irisan sintetis "Lainnya" ketika total persen < 99.
 * Irisan itu bukan rekening asli, jadi harus dibuang saat dibalik.
 */
function dropSyntheticLainnya(dataset, knownNames = null) {
 if (!dataset.length) return dataset;
 const last = dataset[dataset.length - 1];
 if (!last || String(last.nama).toLowerCase() !== 'lainnya') return dataset;

 // Kalau daftar rekening asli diketahui dan "Lainnya" tidak ada di sana → sintetis.
 if (knownNames && !knownNames.has('lainnya')) return dataset.slice(0, -1);

 const sisa = dataset.slice(0, -1).reduce((s, d) => s + (Number(d.persen) || 0), 0);
 return sisa < 99 ? dataset.slice(0, -1) : dataset;
}

/**
 * Bagian 4b — Status efisiensi per rekening.
 * Kalimat detail yang dirender generator berbentuk:
 * "<nama> (kode rekening X, berkontribusi Y% dari total pagu, senilai Rp Z). <rekomendasi>"
 * Dari situ kode, persen, dan NILAI RUPIAH rekening bisa dipulihkan utuh —
 * inilah yang membuat hasil ekstraksi bisa presisi, bukan sekadar nama + persen.
 */
function scrapeEfficiency(dom) {
 return qAll(dom, '.efficiency-list-item').map((item) => {
 const nama = qText(item, '.efficiency-item-name');
 const status = stripIcon(qText(item, '.efficiency-item-status'));
 const detail = qText(item, '.efficiency-item-reason');

 const kode = detail.match(/kode rekening\s+([0-9A-Za-z._\-/]+?)(?:[,)]|\s)/)?.[1] || null;
 const persen = parsePersen(detail.match(/berkontribusi\s+([\d.,]+)\s*%/)?.[1]);
 const nilai = parseRupiah(detail.match(/senilai\s+(Rp\s*[\d.,]+)/)?.[1]);
 const nilaiDikurangi = parseRupiah(detail.match(/kurangi alokasi ini sebesar\s+(Rp\s*[\d.,]+)/)?.[1]);
 const nilaiDitambah = parseRupiah(detail.match(/tambahkan alokasi ini sebesar\s+(Rp\s*[\d.,]+)/)?.[1]);

 return { nama, status, detail, kode, persen, nilai, nilaiDikurangi, nilaiDitambah };
 });
}

/** Bagian 4c — Kartu realokasi (kurangi / tambah). */
function scrapeRealokasi(dom) {
 const read = (sel, aksi, prefix) =>
 qAll(dom, sel).map((c, i) => {
 const nilaiGroup = qAll(c, '.realokasi-nilai-group span').map(txt);
 const nilaiAwalTxt = nilaiGroup.find((t) => /awal/i.test(t)) || qText(c, '.realokasi-nilai-awal');
 const deltaTxt = qText(c, aksi === 'KURANGI' ? '.realokasi-nilai.minus' : '.realokasi-nilai.plus');
 const kode = qText(c, '.realokasi-kode');
 const delta = Math.abs(parseRupiah(deltaTxt) ?? 0) || null;

 return compact({
 id: `${prefix}-${i}`,
 aksi,
 kode: isBlank(kode) ? null : kode,
 rekening_nama: qText(c, '.realokasi-nama') || null,
 nilai_awal: parseRupiah(nilaiAwalTxt),
 nilai_dikurangi: aksi === 'KURANGI' ? delta : null,
 nilai_ditambah: aksi === 'TAMBAH' ? delta : null,
 alasan_dikurangi: aksi === 'KURANGI' ? qText(c, '.realokasi-alasan') || null : null,
 alasan_dialokasikan: aksi === 'TAMBAH' ? qText(c, '.realokasi-alasan') || null : null
 });
 });

 return [
 ...read('.realokasi-col.kurangi .realokasi-card', 'KURANGI', 'k'),
 ...read('.realokasi-col.tambah .realokasi-card', 'TAMBAH', 't')
 ];
}

/** Bagian 6 — Alasan per rekening (teks asli dari AI, bukan kalimat rekomendasi). */
function scrapeAlasanEfektivitas(dom) {
 const map = new Map();
 qAll(dom, '.efektivitas-card').forEach((c) => {
 const nama = qText(c, '.efektivitas-card-nama');
 const alasan = qText(c, '.efektivitas-card-alasan');
 if (nama) map.set(nama.toLowerCase(), alasan);
 });
 return map;
}

/** Bagian 5 — Metrik & faktor SROI. */
function scrapeSroi(dom) {
 // labelOrLabels bisa berupa satu string atau array string (untuk kompatibilitas
 // dengan laporan lama yang masih pakai istilah sebelum diganti ke Bahasa Indonesia).
 const statByLabel = (labelOrLabels) => {
 const labels = Array.isArray(labelOrLabels) ? labelOrLabels : [labelOrLabels];
 const card = qAll(dom, '.sroi-stat-card').find((c) => {
 const text = qText(c, '.stat-label').toLowerCase();
 return labels.some((label) => text.includes(label.toLowerCase()));
 });
 return card ? parseRupiah(qText(card, '.stat-value')) : null;
 };

 const factor = (name) => {
 const item = qAll(dom, '.sroi-factor-item').find((c) =>
 qText(c, '.factor-name').toLowerCase().startsWith(name.toLowerCase())
 );
 return item ? parsePersen(qText(item, '.factor-val')) : null;
 };

 const pill = qText(dom, '.sroi-status-pill');
 const sroiStatus = pill.includes('·') ? pill.split('·').pop().trim() : pill || null;

 return {
 valueOfInputs: statByLabel(['Nilai Input', 'Value of Inputs']),
 totalNilaiDampak: statByLabel('Total Nilai Dampak Sosial'),
 netImpact: statByLabel('Total Dampak Bersih'),
 pvImpact: statByLabel(['Nilai Sekarang', 'Present Value']),
 sroiRatio: parsePersen(qText(dom, '.sroi-ratio-value')),
 sroiStatus,
 deadweight: factor('Deadweight'),
 attribution: factor('Attribution'),
 displacement: factor('Displacement'),
 dropOff: factor('Drop-off'),
 discountRate: factor('Discount Rate')
 };
}

/**
 * benefitDurationYears tidak pernah dicetak di HTML, tapi bisa dipecahkan balik:
 * cari durasi yang menghasilkan pvImpact sama persis dengan yang tercetak.
 */
function solveDurationYears(base, pvTarget) {
 if (!pvTarget || !base.outcome || !base.pagu) return 1;
 let best = 1;
 let bestDiff = Infinity;
 for (let d = 1; d <= 30; d++) {
 const calc = computeSroi16Rules({ ...base, benefitDurationYears: d });
 const diff = Math.abs(calc.pvImpact - pvTarget);
 if (diff < bestDiff) {
 bestDiff = diff;
 best = d;
 }
 if (diff === 0) return d;
 }
 return bestDiff <= Math.max(2, pvTarget * 0.005) ? best : 1;
}

/** Tanggal upload direkonstruksi dari stempel waktu pada nama berkas, bila ada. */
function guessTanggalUpload(namaDokumen) {
 const m = String(namaDokumen || '').match(/(20\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
 if (!m) return null;
 const [, y, mo, d, h, mi, s] = m;
 const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
 return isNaN(Date.parse(iso)) ? null : iso;
}

/* ═══════════════ PERAKITAN ULANG DOKUMEN RKA (LAPIS 2 + 3) ══════════════ */

function scrapeAnalysisDocument(dom, htmlText, warnings) {
 const hero = scrapeHero(dom);
 const { indikatorKinerja, target } = scrapeIndikator(dom, hero.subKegiatan);
 const { kesesuaianAnggaran, justifikasiOutcome } = scrapeKesesuaian(dom);
 const pie = scrapePieData(dom, htmlText);
 const efficiency = scrapeEfficiency(dom);
 const reallocs = scrapeRealokasi(dom);
 const alasanMap = scrapeAlasanEfektivitas(dom);
 const sroi = scrapeSroi(dom);

 const pagu = sroi.valueOfInputs || hero.pagu || 0;

 /* ── rekeningProporsi: gabungkan pie (urutan & persen) + daftar efisiensi
 (kode, nilai rupiah, status) + bagian 6 (alasan asli). ─────────── */
 const namaEfisiensi = new Set(efficiency.map((e) => e.nama.toLowerCase()));
 const awalBersih = dropSyntheticLainnya(pie.awal, namaEfisiensi);

 const rekeningProporsi = awalBersih.map((slice, i) => {
 const eff =
 efficiency.find((e) => e.nama.toLowerCase() === String(slice.nama).toLowerCase()) ||
 efficiency[i] ||
 {};
 const persen = slice.persen ?? eff.persen ?? null;
 const nilai = eff.nilai ?? (pagu && persen !== null ? Math.round((persen / 100) * pagu) : null);

 return compact({
 id: `awal-${i}`,
 kode: eff.kode || null,
 nama: slice.nama || eff.nama || null,
 nilai,
 persen,
 status: eff.status || null,
 alasan: realOrNull(alasanMap.get(String(slice.nama).toLowerCase()))
 });
 });

 if (efficiency.length && rekeningProporsi.length !== efficiency.length) {
 warnings.push(
 `Jumlah irisan grafik (${rekeningProporsi.length}) berbeda dengan daftar status efisiensi (${efficiency.length}).`
 );
 }
 if (rekeningProporsi.some((r) => r.nilai === undefined)) {
 warnings.push('Sebagian nilai rupiah rekening tidak tercetak di HTML dan diperkirakan dari persentase.');
 }

 /* ── reallocationJustifications: lengkapi nilai yang tidak dicetak
 memakai angka dari kalimat rekomendasi & daftar rekening awal. ── */
 const reallocationJustifications = reallocs.map((j) => {
 const match = rekeningProporsi.find(
 (r) =>
 r.nama &&
 j.rekening_nama &&
 (r.nama.toLowerCase().includes(j.rekening_nama.toLowerCase()) ||
 j.rekening_nama.toLowerCase().includes(r.nama.toLowerCase()))
 );
 const eff = efficiency.find(
 (e) => j.rekening_nama && e.nama.toLowerCase() === j.rekening_nama.toLowerCase()
 );

 const patched = { ...j };
 if (patched.nilai_awal === undefined && match?.nilai !== undefined) patched.nilai_awal = match.nilai;
 if (j.aksi === 'KURANGI' && patched.nilai_dikurangi === undefined && eff?.nilaiDikurangi) {
 patched.nilai_dikurangi = eff.nilaiDikurangi;
 }
 if (j.aksi === 'TAMBAH' && patched.nilai_ditambah === undefined && eff?.nilaiDitambah) {
 patched.nilai_ditambah = eff.nilaiDitambah;
 }
 return compact(patched);
 });

 /* ── rekeningProporsiUsulan: hitung ulang dengan fungsi aplikasi sendiri
 supaya nilai rupiahnya eksak (bukan hasil balik dari persen bulat),
 lalu diadu dengan angka yang tercetak di HTML. ─────────────────── */
 const usulanTercetak = dropSyntheticLainnya(pie.usulan);
 let rekeningProporsiUsulan = usulanTercetak.map((slice, i) =>
 compact({
 id: `usul-${i}`,
 nama: slice.nama,
 persen: slice.persen,
 nilai: pagu ? Math.round((slice.persen / 100) * pagu) : null
 })
 );

 if (rekeningProporsi.length && reallocationJustifications.length) {
 const rebuilt = buildUsulanProporsi(
 rekeningProporsi.map((r) => ({ ...r })),
 reallocationJustifications,
 pagu
 );
 const cocok =
 rebuilt.length === usulanTercetak.length &&
 rebuilt.every((r, i) => Math.abs((r.persen || 0) - (usulanTercetak[i]?.persen || 0)) < 0.02);

 if (cocok) {
 rekeningProporsiUsulan = rebuilt.map((r, i) => compact({ ...r, id: `usul-${i}` }));
 } else if (usulanTercetak.length) {
 warnings.push(
 'Proporsi usulan hasil hitung ulang tidak persis sama dengan grafik di HTML; dipakai angka yang tercetak di HTML.'
 );
 }
 }

 /* ── Metrik SROI: hitung ulang dari input mentah, verifikasi ke HTML. ── */
 const outcome = sroi.totalNilaiDampak || 0;
 const sroiInput = {
 pagu,
 outcome,
 deadweight: sroi.deadweight ?? 15,
 attribution: sroi.attribution ?? 0,
 displacement: sroi.displacement ?? 0,
 dropOff: sroi.dropOff ?? 10,
 discountRate: sroi.discountRate ?? 5
 };
 const benefitDurationYears = solveDurationYears(sroiInput, sroi.pvImpact);
 const calc = computeSroi16Rules({ ...sroiInput, benefitDurationYears });

 if (sroi.pvImpact !== null && Math.abs(calc.pvImpact - sroi.pvImpact) > 1) {
 warnings.push(`PV Dampak hasil hitung ulang (${calc.pvImpact}) berbeda dari HTML (${sroi.pvImpact}).`);
 }
 if (sroi.sroiRatio !== null && Math.abs(calc.sroiRatio - sroi.sroiRatio) > 0.01) {
 warnings.push(`Rasio Nilai Prakiraan Dampak hasil hitung ulang (${calc.sroiScore}) berbeda dari HTML (${sroi.sroiRatio}).`);
 }

 const opd = cleanOpdName(hero.opdRaw || '-');
 const namaDokumen = hero.namaDokumen || hero.subKegiatan || 'Dokumen RKA';
 const tanggalUpload = guessTanggalUpload(namaDokumen);

 return compact({
 id: `RKA-HTML-${slug(namaDokumen)}`,

 // Identitas dokumen
 namaDokumen,
 opd,
 perangkatDaerah: opd,
 program: hero.program,
 namaProgram: hero.program,
 kegiatan: hero.kegiatan,
 namaKegiatan: hero.kegiatan,
 subKegiatan: hero.subKegiatan,
 tahun: hero.tahunRencana,
 tahunRencana: hero.tahunRencana,

 // Input SROI
 pagu,
 outcome,
 deadweight: sroiInput.deadweight,
 attribution: sroiInput.attribution,
 displacement: sroiInput.displacement,
 dropOff: sroiInput.dropOff,
 discountRate: sroiInput.discountRate,
 benefitDurationYears,

 // Hasil SROI
 netImpact: calc.netImpact,
 pvImpact: calc.pvImpact,
 sroi: calc.sroiRatio,
 sroiRatioText: calc.sroiRatioText,
 sroiStatus: sroi.sroiStatus || calc.sroiStatus,
 sroiInterpretation: calc.sroiInterpretation,
 kelayakan: calc.kelayakan,

 // Kinerja & narasi
 indikatorKinerja,
 target,
 targetKuantitatif: target,
 kesesuaianAnggaran,
 justifikasiOutcome,
 outcomeDesc: justifikasiOutcome,

 // Belanja
 rekeningProporsi,
 rekeningProporsiUsulan,
 reallocationJustifications,

 // Nilai awal (dipakai tombol "reset" di panel simulasi)
 originalPagu: pagu,
 originalOutcome: outcome,
 originalDeadweight: sroiInput.deadweight,
 originalAttribution: sroiInput.attribution,
 originalDisplacement: sroiInput.displacement,
 originalDropOff: sroiInput.dropOff,
 originalDiscountRate: sroiInput.discountRate,

 status: 'Draft',
 catatan: '',
 findings: [],
 outcomesDetail: [],
 tanggalUpload: tanggalUpload || new Date().toISOString()
 });
}

/* ═══════════════════════════ API PUBLIK ═════════════════════════════════ */

/**
 * Ekstrak satu berkas HTML menjadi payload JSON mentah.
 *
 * @param {string} htmlText isi berkas .html
 * @param {object} [opts]
 * @param {string} [opts.fileName] nama berkas asal (untuk metadata)
 * @returns {{ payload: object, mode: 'embedded'|'scraped', warnings: string[], totalDocuments: number }}
 */
export function extractBackupFromHtml(htmlText, opts = {}) {
 if (!htmlText || typeof htmlText !== 'string') {
 throw new Error('Isi berkas HTML kosong atau tidak terbaca.');
 }

 const dom = new DOMParser().parseFromString(htmlText, 'text/html');
 const warnings = [];

 // ── LAPIS 1: JSON tertanam → pakai apa adanya, tanpa tafsir apa pun.
 const embedded = readEmbeddedJson(dom);
 if (embedded) {
 return {
 payload: normalizeEnvelope(embedded, { mode: 'embedded', fileName: opts.fileName }),
 mode: 'embedded',
 warnings,
 totalDocuments: countDocs(embedded)
 };
 }

 // ── LAPIS 2 + 3: bongkar tampilan, rakit ulang dokumennya.
 if (!dom.querySelector('.rka-hero, .sroi-body, .rka-section')) {
 throw new Error(
 'Berkas ini bukan laporan HTML Sintra (tidak ditemukan blok analisis RKA maupun data JSON tertanam).'
 );
 }

 const doc = scrapeAnalysisDocument(dom, htmlText, warnings);
 return {
 payload: normalizeEnvelope({ rkis: [doc] }, { mode: 'scraped', fileName: opts.fileName, warnings }),
 mode: 'scraped',
 warnings,
 totalDocuments: 1
 };
}

function countDocs(data) {
 if (Array.isArray(data?.data?.main_db?.rkis)) return data.data.main_db.rkis.length;
 if (Array.isArray(data?.rkis)) return data.rkis.length;
 return data?.namaDokumen ? 1 : 0;
}

/**
 * Samakan bentuk luar payload dengan berkas "Unduh Mentahan (.json)".
 *
 * PENTING: jangan pernah menyisipkan users_db / activity_logs / api_config kosong.
 * Endpoint /restore menulis ulang seluruh store apa adanya, jadi stub kosong
 * akan MENGHAPUS seluruh akun pengguna dan log aktivitas yang ada di server.
 */
function normalizeEnvelope(raw, meta = {}) {
 let data = raw;

 // Dokumen RKA tunggal (hasil embed dari htmlReportGenerator).
 if (!data.data && !Array.isArray(data.rkis) && (data.namaDokumen || data.pagu !== undefined)) {
 data = { rkis: [data] };
 }

 // Sudah berbentuk payload backup penuh → jangan diutak-atik.
 if (data.data && typeof data.data === 'object') {
 const rkis = data.data.main_db?.rkis || data.rkis || [];
 return {
 ...data,
 rkis: data.rkis || rkis,
 totalDocuments: rkis.length,
 extractedFrom: compact({
 fileName: meta.fileName || null,
 mode: meta.mode || null,
 extractedAt: new Date().toISOString(),
 warnings: meta.warnings?.length ? meta.warnings : null
 })
 };
 }

 const rkis = Array.isArray(data.rkis) ? data.rkis : [];
 return {
 app: 'Sintra / Bapperida RKA AI',
 version: '2.0.0',
 type: 'html_extract',
 exportedAt: new Date().toISOString(),
 extractedFrom: compact({
 fileName: meta.fileName || null,
 mode: meta.mode || null,
 extractedAt: new Date().toISOString(),
 warnings: meta.warnings?.length ? meta.warnings : null
 }),
 totalDocuments: rkis.length,
 rkis,
 data: {
 main_db: { rkis }
 // Sengaja TIDAK menyertakan users_db / activity_logs / ssh_databases.
 }
 };
}

/** Unduh hasil ekstraksi sebagai berkas .json. */
export function downloadExtractedJson(payload, sourceFileName = 'ekstraksi') {
 const text = JSON.stringify(payload, null, 2);
 const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = String(sourceFileName).replace(/\.html?$/i, '') + '_converted.json';
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);
}
