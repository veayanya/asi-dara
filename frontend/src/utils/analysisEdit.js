// src/utils/analysisEdit.js
// Logika bersama untuk "Edit Manual" dan "Edit dengan AI" pada halaman
// Analisis Valuasi Prakiraan Dampak Program.
//
// Alur kedua fitur SAMA supaya hasilnya konsisten:
//   createDraft(analysis)            -> salinan bentuk-form dari hasil analisis
//   (pengguna / AI mengubah draft)
//   validateDraft(draft)             -> daftar error & peringatan
//   draftToAnalysis(base, draft)     -> data analisis baru (SROI dihitung ulang,
//                                       "Rekomendasi Belanja" dibangun ulang)
//   diffDrafts(before, after)        -> daftar perubahan (untuk audit & pratinjau)
//   saveManualVersion(...)           -> simpan sebagai VERSI BARU (data lama utuh)

import { computeSroi16Rules, buildUsulanProporsi, cleanOpdName } from '../composables/useAnalysis';
import { apiFetch } from './api';

// ── Konstanta ────────────────────────────────────────────────────────

export const KESESUAIAN_STATUS = ['Sesuai', 'Perlu Perhatian', 'Tidak Sesuai'];
export const PROYEKSI_STATUS = [
  'Target Kemungkinan Tercapai',
  'Berisiko Tidak Tercapai',
  'Diproyeksikan Tidak Tercapai'
];
export const REKENING_STATUS = ['Efisien', 'Inefisien', 'Belum Dapat Dinilai'];

// Bagian yang boleh diubah AI. Harus sama dengan ANALYSIS_EDIT_SCOPES di
// backend (utils/aibotService.js); server tetap memvalidasi ulang.
export const AI_EDIT_SCOPES = [
  {
    id: 'sroi',
    label: 'Parameter & Nilai SROI',
    hint: 'Nilai dampak sosial, deadweight, attribution, displacement, drop-off, diskonto',
    keys: [
      'outcome', 'deadweight', 'attribution', 'displacement', 'dropOff',
      'discountRate', 'benefitDurationYears', 'attributionReason', 'displacementReason'
    ],
    defaultOn: true
  },
  {
    id: 'belanja',
    label: 'Analisis Komponen Belanja & Rekomendasi Belanja',
    hint: 'Rincian rekening, status efisiensi, alasan, dan usulan kurangi/tambah',
    keys: ['rekeningProporsi', 'realokasi'],
    defaultOn: true
  },
  {
    id: 'kesesuaian',
    label: 'Kesesuaian Anggaran & Justifikasi Outcome',
    hint: 'Status kesesuaian, proyeksi target, dan narasi justifikasi',
    keys: ['kesesuaian', 'justifikasiOutcome'],
    defaultOn: true
  },
  {
    id: 'kinerja',
    label: 'Indikator & Target Kinerja',
    hint: 'Tolok ukur, target, dan target kuantitatif',
    keys: ['indikatorKinerja', 'targetKuantitatif'],
    defaultOn: true
  },
  {
    id: 'identitas',
    label: 'Identitas & Pagu Anggaran',
    hint: 'Nama OPD/program/kegiatan, tahun, pagu — terkunci secara bawaan',
    keys: ['opd', 'program', 'kegiatan', 'subKegiatan', 'tahunRencana', 'pagu', 'anggaranTahunan'],
    defaultOn: false
  }
];

const FIELD_META = {
  opd: { label: 'OPD / Perangkat Daerah', group: 'Identitas & Pagu' },
  program: { label: 'Program', group: 'Identitas & Pagu' },
  kegiatan: { label: 'Kegiatan', group: 'Identitas & Pagu' },
  subKegiatan: { label: 'Sub Kegiatan', group: 'Identitas & Pagu' },
  tahunRencana: { label: 'Tahun Anggaran', group: 'Identitas & Pagu' },
  pagu: { label: 'Pagu Anggaran', group: 'Identitas & Pagu', kind: 'rupiah' },
  targetKuantitatif: { label: 'Target Kuantitatif', group: 'Indikator & Target Kinerja' },
  justifikasiOutcome: { label: 'Justifikasi Outcome', group: 'Kesesuaian & Justifikasi' },
  outcome: { label: 'Total Nilai Dampak Sosial', group: 'Parameter SROI', kind: 'rupiah' },
  deadweight: { label: 'Deadweight', group: 'Parameter SROI', kind: 'persen' },
  attribution: { label: 'Attribution', group: 'Parameter SROI', kind: 'persen' },
  displacement: { label: 'Displacement', group: 'Parameter SROI', kind: 'persen' },
  dropOff: { label: 'Drop-off', group: 'Parameter SROI', kind: 'persen' },
  discountRate: { label: 'Discount Rate', group: 'Parameter SROI', kind: 'persen' },
  benefitDurationYears: { label: 'Durasi Manfaat (tahun)', group: 'Parameter SROI' },
  attributionReason: { label: 'Alasan Attribution', group: 'Parameter SROI' },
  displacementReason: { label: 'Alasan Displacement', group: 'Parameter SROI' }
};

const KESESUAIAN_LABELS = {
  status: 'Status Kesesuaian',
  penjelasan: 'Penjelasan Kesesuaian',
  estimasi_biaya_per_output: 'Estimasi Biaya per Output',
  proyeksi_pencapaian_target: 'Proyeksi Pencapaian Target',
  alasan_proyeksi_target: 'Alasan Proyeksi Target'
};

// ── Helper kecil ─────────────────────────────────────────────────────

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const round2 = (n) => Math.round(n * 100) / 100;
const str = (v) => (v === null || v === undefined ? '' : String(v));
const deepClone = (v) => JSON.parse(JSON.stringify(v ?? null));

export const formatRp = (v) => 'Rp ' + Math.round(num(v)).toLocaleString('id-ID');

function short(v, max = 220) {
  const s = str(v).replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function displayValue(meta, v) {
  if (v === '' || v === null || v === undefined) return '—';
  if (meta?.kind === 'rupiah') return formatRp(v);
  if (meta?.kind === 'persen') return `${num(v)}%`;
  return short(v);
}

/** Buang metadata versi agar tidak ikut tersimpan sebagai isi versi baru. */
export function stripVersioningFields(analysis = {}) {
  const {
    versions, auditLogs, activeVersionId, selectedVersionName,
    ...rest
  } = analysis || {};
  return deepClone(rest) || {};
}

// ── Draft: bentuk-form dari hasil analisis ───────────────────────────

export function createDraft(analysis = {}) {
  const a = analysis || {};
  const kes = a.kesesuaianAnggaran || {};
  const proporsi = Array.isArray(a.rekeningProporsi) ? a.rekeningProporsi : [];
  const reallocs = Array.isArray(a.reallocationJustifications) ? a.reallocationJustifications : [];

  return {
    opd: cleanOpdName(a.opd || a.perangkatDaerah || ''),
    program: str(a.namaProgram || a.program),
    kegiatan: str(a.kegiatan || a.namaKegiatan),
    subKegiatan: str(a.subKegiatan),
    tahunRencana: num(a.tahunRencana || a.tahun, new Date().getFullYear()),
    pagu: num(a.pagu),
    anggaranTahunan: (Array.isArray(a.anggaranTahunan) ? a.anggaranTahunan : []).map((r) => ({
      tahun: num(r.tahun),
      jumlah: num(r.jumlah)
    })),

    indikatorKinerja: (Array.isArray(a.indikatorKinerja) ? a.indikatorKinerja : []).map((r) => ({
      level: str(r.level),
      tolok_ukur: str(r.tolok_ukur ?? r.tolokUkur),
      target: str(r.target),
      rincian: normalizeRincian(r.rincian)
    })),
    targetKuantitatif: str(a.targetKuantitatif || a.target),

    kesesuaian: {
      status: str(kes.status),
      penjelasan: str(kes.penjelasan),
      estimasi_biaya_per_output: str(kes.estimasi_biaya_per_output),
      proyeksi_pencapaian_target: str(kes.proyeksi_pencapaian_target),
      alasan_proyeksi_target: str(kes.alasan_proyeksi_target)
    },
    justifikasiOutcome: str(a.justifikasiOutcome || a.outcomeDesc),

    rekeningProporsi: proporsi.map((r) => ({
      kode: str(r.kode),
      nama: str(r.nama),
      persen: num(r.persen),
      nilai: num(r.nilai),
      status: str(r.status),
      alasan: str(r.alasan)
    })),
    realokasi: reallocs.map((j) => {
      const tambah = j.aksi === 'TAMBAH';
      return {
        kode: str(j.kode),
        rekening_nama: str(j.rekening_nama),
        aksi: tambah ? 'TAMBAH' : 'KURANGI',
        nilai_awal: num(j.nilai_awal),
        nilai: tambah ? num(j.nilai_ditambah) : num(j.nilai_dikurangi),
        alasan: str(tambah ? j.alasan_dialokasikan : j.alasan_dikurangi)
      };
    }),

    outcome: num(a.outcome),
    deadweight: num(a.deadweight, 15),
    attribution: num(a.attribution, 0),
    displacement: num(a.displacement, 0),
    dropOff: num(a.dropOff, 10),
    discountRate: num(a.discountRate, 5),
    benefitDurationYears: num(a.benefitDurationYears, 1),
    attributionReason: str(a.attributionReason),
    displacementReason: str(a.displacementReason)
  };
}

export const emptyIndikatorRow = () => ({ level: '', tolok_ukur: '', target: '', rincian: [] });

/** Rincian isi output (dropdown Sub Kegiatan): [{ nama, isi }]. */
export function normalizeRincian(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? { nama: x, isi: '' } : { nama: str(x?.nama).trim(), isi: str(x?.isi).trim() }))
    .map((x) => ({ nama: str(x.nama).trim(), isi: str(x.isi).trim() }))
    .filter((x) => x.nama || x.isi);
}
/** Satu baris = satu item, format "Nama | isi/komponen". */
export const rincianToText = (v) => normalizeRincian(v).map((x) => (x.isi ? `${x.nama} | ${x.isi}` : x.nama)).join('\n');
export const textToRincian = (t) => str(t).split('\n').map((line) => {
  const i = line.indexOf('|');
  return i === -1 ? { nama: line.trim(), isi: '' } : { nama: line.slice(0, i).trim(), isi: line.slice(i + 1).trim() };
}).filter((x) => x.nama || x.isi);
export const emptyAnggaranRow = (tahun) => ({ tahun: tahun || new Date().getFullYear(), jumlah: 0 });
export const emptyRekeningRow = () => ({ kode: '', nama: '', persen: 0, nilai: 0, status: '', alasan: '' });
export const emptyRealokasiRow = (aksi = 'KURANGI') => ({
  kode: '', rekening_nama: '', aksi, nilai_awal: 0, nilai: 0, alasan: ''
});

// ── SROI (pratinjau langsung & hasil akhir) ──────────────────────────

export function computeSroiFromDraft(draft) {
  return computeSroi16Rules({
    pagu: num(draft.pagu),
    outcome: num(draft.outcome),
    deadweight: num(draft.deadweight, 15),
    attribution: num(draft.attribution, 0),
    displacement: num(draft.displacement, 0),
    dropOff: num(draft.dropOff, 10),
    discountRate: num(draft.discountRate, 5),
    benefitDurationYears: num(draft.benefitDurationYears, 1)
  });
}

// ── Validasi ─────────────────────────────────────────────────────────

/**
 * @returns {{ errors: {section:string,msg:string}[], warnings: {section:string,msg:string}[] }}
 *  errors   = memblokir penyimpanan
 *  warnings = boleh disimpan, tetapi patut dicek pengguna
 */
export function validateDraft(draft) {
  const errors = [];
  const warnings = [];
  const err = (section, msg) => errors.push({ section, msg });
  const warn = (section, msg) => warnings.push({ section, msg });

  const pagu = num(draft.pagu);
  if (!(pagu > 0)) err('identitas', 'Pagu anggaran harus lebih dari 0.');
  const tahun = num(draft.tahunRencana);
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
    err('identitas', 'Tahun anggaran harus berupa tahun yang valid (2000–2100).');
  }
  if (!str(draft.opd).trim()) warn('identitas', 'OPD / Perangkat Daerah masih kosong.');
  if (!str(draft.subKegiatan).trim() && !str(draft.program).trim()) {
    warn('identitas', 'Sub Kegiatan dan Program sama-sama kosong.');
  }

  // Anggaran per tahun
  const years = new Set();
  (draft.anggaranTahunan || []).forEach((r, i) => {
    const y = num(r.tahun);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) err('identitas', `Anggaran per tahun baris ${i + 1}: tahun tidak valid.`);
    else if (years.has(y)) err('identitas', `Anggaran per tahun: tahun ${y} muncul lebih dari sekali.`);
    years.add(y);
    if (num(r.jumlah) < 0) err('identitas', `Anggaran per tahun baris ${i + 1}: jumlah tidak boleh negatif.`);
  });
  const rowThisYear = (draft.anggaranTahunan || []).find((r) => num(r.tahun) === tahun);
  if (rowThisYear && pagu > 0 && Math.round(num(rowThisYear.jumlah)) !== Math.round(pagu)) {
    warn(
      'identitas',
      `Pagu (${formatRp(pagu)}) berbeda dari anggaran tahun ${tahun} (${formatRp(rowThisYear.jumlah)}). ` +
      'Halaman menampilkan jumlah anggaran tahun tersebut pada kartu Pagu Anggaran.'
    );
  }

  // Indikator kinerja
  (draft.indikatorKinerja || []).forEach((r, i) => {
    const any = str(r.level).trim() || str(r.tolok_ukur).trim() || str(r.target).trim();
    if (any && !str(r.level).trim()) err('kinerja', `Indikator baris ${i + 1}: level wajib diisi.`);
  });

  // Parameter SROI
  [
    ['deadweight', 'Deadweight'], ['attribution', 'Attribution'], ['displacement', 'Displacement'],
    ['dropOff', 'Drop-off'], ['discountRate', 'Discount Rate']
  ].forEach(([k, label]) => {
    const v = num(draft[k]);
    if (v < 0 || v > 100) err('sroi', `${label} harus di antara 0 dan 100 persen.`);
  });
  const dur = num(draft.benefitDurationYears);
  if (!Number.isInteger(dur) || dur < 1 || dur > 20) err('sroi', 'Durasi manfaat harus bilangan bulat 1–20 tahun.');
  if (num(draft.outcome) < 0) err('sroi', 'Total nilai dampak sosial tidak boleh negatif.');
  else if (num(draft.outcome) === 0) {
    warn('sroi', 'Total nilai dampak sosial 0 — SROI akan berstatus "Belum Dapat Dinilai".');
  }
  if (num(draft.deadweight) > 40) {
    warn('sroi', 'Deadweight di atas 40% melampaui batas pada aturan evaluasi bawaan aplikasi.');
  }

  // Rekening belanja
  let sumPersen = 0;
  let sumNilai = 0;
  (draft.rekeningProporsi || []).forEach((r, i) => {
    const any = str(r.nama).trim() || str(r.kode).trim() || num(r.persen) || num(r.nilai);
    if (!any) return;
    if (!str(r.nama).trim()) err('belanja', `Rekening baris ${i + 1}: nama belanja wajib diisi.`);
    if (num(r.persen) < 0 || num(r.persen) > 100) err('belanja', `Rekening baris ${i + 1}: persen harus 0–100.`);
    if (num(r.nilai) < 0) err('belanja', `Rekening baris ${i + 1}: nilai tidak boleh negatif.`);
    sumPersen += num(r.persen);
    sumNilai += num(r.nilai);
  });
  if (sumPersen > 100.5) warn('belanja', `Total persen rekening ${round2(sumPersen)}% melebihi 100%.`);
  if (pagu > 0 && sumNilai > pagu * 1.005) {
    warn('belanja', `Total nilai rekening (${formatRp(sumNilai)}) melebihi pagu (${formatRp(pagu)}).`);
  }

  // Realokasi
  let kurang = 0;
  let tambah = 0;
  (draft.realokasi || []).forEach((r, i) => {
    const any = str(r.rekening_nama).trim() || str(r.kode).trim() || num(r.nilai) || str(r.alasan).trim();
    if (!any) return;
    if (!str(r.rekening_nama).trim()) err('belanja', `Realokasi baris ${i + 1}: nama rekening wajib diisi.`);
    if (num(r.nilai) < 0 || num(r.nilai_awal) < 0) err('belanja', `Realokasi baris ${i + 1}: nilai tidak boleh negatif.`);
    if (r.aksi === 'KURANGI') {
      kurang += num(r.nilai);
      if (num(r.nilai_awal) > 0 && num(r.nilai) > num(r.nilai_awal)) {
        warn('belanja', `Realokasi baris ${i + 1}: nilai dikurangi melebihi nilai awal rekening.`);
      }
    } else {
      tambah += num(r.nilai);
    }
  });
  if (Math.round(kurang) !== Math.round(tambah)) {
    warn(
      'belanja',
      `Total pengurangan (${formatRp(kurang)}) tidak sama dengan total penambahan (${formatRp(tambah)}); ` +
      'usulan realokasi tidak berimbang.'
    );
  }

  return { errors, warnings };
}

// ── Draft → data analisis baru ───────────────────────────────────────

/**
 * Gabungkan draft ke data analisis dasar, hitung ulang SROI dan bangun ulang
 * "Rekomendasi Belanja". Hasilnya bersih dari metadata versi.
 */
export function draftToAnalysis(base, draft) {
  const out = stripVersioningFields(base);
  const pagu = num(draft.pagu);
  const tahunRencana = Math.round(num(draft.tahunRencana)) || out.tahunRencana;
  const opd = cleanOpdName(draft.opd);

  out.opd = opd;
  out.perangkatDaerah = opd;
  out.program = str(draft.program);
  out.namaProgram = str(draft.program);
  out.kegiatan = str(draft.kegiatan);
  out.namaKegiatan = str(draft.kegiatan);
  out.subKegiatan = str(draft.subKegiatan);
  out.tahunRencana = tahunRencana;
  out.pagu = pagu;

  // Anggaran per tahun (urut tahun). Bila pagu diubah dan baris tahun rencana
  // belum diubah terpisah, ikut disinkronkan agar kartu Pagu di halaman sama.
  const baseRows = Array.isArray(base?.anggaranTahunan) ? base.anggaranTahunan : [];
  const baseRowThisYear = baseRows.find((r) => num(r.tahun) === tahunRencana);
  const paguChanged = Math.round(num(base?.pagu)) !== Math.round(pagu);
  const anggaran = (draft.anggaranTahunan || [])
    .map((r) => ({ tahun: Math.round(num(r.tahun)), jumlah: Math.round(num(r.jumlah)) }))
    .sort((x, y) => x.tahun - y.tahun);
  if (paguChanged && baseRowThisYear) {
    const row = anggaran.find((r) => r.tahun === tahunRencana);
    if (row && row.jumlah === Math.round(num(baseRowThisYear.jumlah))) row.jumlah = Math.round(pagu);
  }
  out.anggaranTahunan = anggaran;

  // Indikator & target kinerja
  out.indikatorKinerja = (draft.indikatorKinerja || [])
    .map((r) => {
      const rincian = normalizeRincian(r.rincian);
      const row = { level: str(r.level).trim(), tolok_ukur: str(r.tolok_ukur).trim(), target: str(r.target).trim() };
      if (rincian.length) row.rincian = rincian;
      return row;
    })
    .filter((r) => r.level || r.tolok_ukur || r.target);
  out.targetKuantitatif = str(draft.targetKuantitatif);
  out.target = str(draft.targetKuantitatif);

  // Kesesuaian anggaran vs target kinerja
  const kes = draft.kesesuaian || {};
  const kesAny = Object.values(kes).some((v) => str(v).trim());
  out.kesesuaianAnggaran = kesAny
    ? { ...(base?.kesesuaianAnggaran || {}), ...Object.fromEntries(Object.entries(kes).map(([k, v]) => [k, str(v).trim()])) }
    : null;
  out.justifikasiOutcome = str(draft.justifikasiOutcome);
  out.outcomeDesc = str(draft.justifikasiOutcome);

  // Rincian rekening belanja: lengkapi nilai/persen yang salah satunya kosong
  out.rekeningProporsi = (draft.rekeningProporsi || [])
    .filter((r) => str(r.nama).trim())
    .map((r) => {
      let nilai = num(r.nilai);
      let persen = num(r.persen);
      if (!nilai && persen && pagu) nilai = Math.round((persen / 100) * pagu);
      if (!persen && nilai && pagu) persen = round2((nilai / pagu) * 100);
      const row = { kode: str(r.kode).trim(), nama: str(r.nama).trim(), persen, nilai };
      if (REKENING_STATUS.includes(r.status)) row.status = r.status;
      if (str(r.alasan).trim()) row.alasan = str(r.alasan).trim();
      return row;
    });

  // Rekomendasi realokasi (kurangi / tambah)
  out.reallocationJustifications = (draft.realokasi || [])
    .filter((r) => str(r.rekening_nama).trim())
    .map((r) => {
      const head = {
        kode: str(r.kode).trim(),
        rekening_nama: str(r.rekening_nama).trim(),
        aksi: r.aksi === 'TAMBAH' ? 'TAMBAH' : 'KURANGI',
        nilai_awal: Math.round(num(r.nilai_awal))
      };
      return head.aksi === 'TAMBAH'
        ? { ...head, nilai_ditambah: Math.round(num(r.nilai)), alasan_dialokasikan: str(r.alasan).trim() }
        : { ...head, nilai_dikurangi: Math.round(num(r.nilai)), alasan_dikurangi: str(r.alasan).trim() };
    });

  // Pie "Rekomendasi Belanja" dibangun ulang dari data terbaru
  out.rekeningProporsiUsulan = buildUsulanProporsi(out.rekeningProporsi, out.reallocationJustifications, pagu);
  // Cegah pemuat arsip mengisi ulang data bawaan saat daftar sengaja dikosongkan
  out.reallocationEdited = true;

  // Parameter & hasil SROI
  out.outcome = num(draft.outcome);
  out.deadweight = num(draft.deadweight, 15);
  out.attribution = num(draft.attribution, 0);
  out.displacement = num(draft.displacement, 0);
  out.dropOff = num(draft.dropOff, 10);
  out.discountRate = num(draft.discountRate, 5);
  out.benefitDurationYears = Math.max(1, Math.round(num(draft.benefitDurationYears, 1)));
  out.attributionReason = str(draft.attributionReason);
  out.displacementReason = str(draft.displacementReason);

  const calc = computeSroiFromDraft(draft);
  out.netImpact = calc.netImpact;
  out.pvImpact = calc.pvImpact;
  out.sroi = calc.sroiRatio;
  out.sroiRatioText = calc.sroiRatioText;
  out.sroiStatus = calc.sroiStatus;
  out.sroiInterpretation = calc.sroiInterpretation;
  out.kelayakan = calc.kelayakan;

  // Sinkronkan JSON mentah (bila ada) dengan angka terbaru
  if (out.rawJson) {
    try {
      const raw = JSON.parse(out.rawJson);
      raw.pagu = pagu;
      raw.social_benefit_value = out.outcome;
      raw.deadweight_percentage = out.deadweight;
      raw.attribution_percentage = out.attribution;
      raw.displacement_percentage = out.displacement;
      raw.dropoff_percentage = out.dropOff;
      raw.discount_rate_percentage = out.discountRate;
      raw.benefit_duration_years = out.benefitDurationYears;
      raw.total_net_impact = calc.netImpact;
      raw.pv_impact = calc.pvImpact;
      raw.sroi_ratio = calc.sroiRatio;
      raw.sroi_ratio_text = calc.sroiRatioText;
      raw.sroi_status = calc.sroiStatus;
      raw.sroi_interpretation = calc.sroiInterpretation;
      out.rawJson = JSON.stringify(raw, null, 2);
    } catch {
      /* rawJson bukan JSON valid — biarkan apa adanya */
    }
  }

  return out;
}

// ── Diff (untuk pratinjau & audit trail) ─────────────────────────────

function pushIfChanged(list, group, label, meta, a, b) {
  const same = typeof a === 'number' || typeof b === 'number' ? num(a) === num(b) : str(a).trim() === str(b).trim();
  if (same) return;
  list.push({ group, label, from: displayValue(meta, a), to: displayValue(meta, b) });
}

function diffKeyed(list, { group, noun, before, after, keyOf, fields }) {
  const key = (r, i, seen) => {
    let k = String(keyOf(r) || '').toLowerCase().trim() || `#${i + 1}`;
    while (seen.has(k)) k += '*';
    seen.add(k);
    return k;
  };
  const mapOf = (rows) => {
    const seen = new Set();
    const m = new Map();
    rows.forEach((r, i) => m.set(key(r, i, seen), r));
    return m;
  };
  const bm = mapOf(before);
  const am = mapOf(after);
  const titleOf = (r) => short(r.nama || r.rekening_nama || r.level || r.tahun || '(tanpa nama)', 80);

  for (const [k, r] of am) {
    if (!bm.has(k)) list.push({ group, label: `${noun} ditambah`, from: '—', to: titleOf(r) });
  }
  for (const [k, r] of bm) {
    if (!am.has(k)) list.push({ group, label: `${noun} dihapus`, from: titleOf(r), to: '—' });
  }
  for (const [k, r] of am) {
    const old = bm.get(k);
    if (!old) continue;
    for (const f of fields) {
      const a = old[f.key];
      const b = r[f.key];
      const same = f.kind ? num(a) === num(b) : str(a).trim() === str(b).trim();
      if (!same) {
        list.push({
          group,
          label: `${noun} “${titleOf(r)}” — ${f.label}`,
          from: displayValue(f, a),
          to: displayValue(f, b)
        });
      }
    }
  }
}

/** Bandingkan dua draft. Hasil: [{ group, label, from, to }] */
export function diffDrafts(before, after) {
  const list = [];

  Object.entries(FIELD_META).forEach(([key, meta]) => {
    pushIfChanged(list, meta.group, meta.label, meta, before[key], after[key]);
  });

  Object.entries(KESESUAIAN_LABELS).forEach(([key, label]) => {
    pushIfChanged(list, 'Kesesuaian & Justifikasi', label, null, before.kesesuaian?.[key], after.kesesuaian?.[key]);
  });

  diffKeyed(list, {
    group: 'Identitas & Pagu',
    noun: 'Anggaran tahun',
    before: before.anggaranTahunan || [],
    after: after.anggaranTahunan || [],
    keyOf: (r) => r.tahun,
    fields: [{ key: 'jumlah', label: 'Jumlah', kind: 'rupiah' }]
  });

  diffKeyed(list, {
    group: 'Indikator & Target Kinerja',
    noun: 'Indikator',
    before: (before.indikatorKinerja || []).map((r) => ({ ...r, rincianText: rincianToText(r.rincian) })),
    after: (after.indikatorKinerja || []).map((r) => ({ ...r, rincianText: rincianToText(r.rincian) })),
    keyOf: (r) => r.level,
    fields: [{ key: 'tolok_ukur', label: 'Tolok ukur' }, { key: 'target', label: 'Target' }, { key: 'rincianText', label: 'Rincian isi output' }]
  });

  diffKeyed(list, {
    group: 'Komponen Belanja',
    noun: 'Rekening',
    before: before.rekeningProporsi || [],
    after: after.rekeningProporsi || [],
    keyOf: (r) => r.kode || r.nama,
    fields: [
      { key: 'nama', label: 'Nama' },
      { key: 'persen', label: 'Persen', kind: 'persen' },
      { key: 'nilai', label: 'Nilai', kind: 'rupiah' },
      { key: 'status', label: 'Status efisiensi' },
      { key: 'alasan', label: 'Alasan' }
    ]
  });

  diffKeyed(list, {
    group: 'Rekomendasi Realokasi',
    noun: 'Realokasi',
    before: (before.realokasi || []).map((r) => ({ ...r, nama: `${r.aksi === 'TAMBAH' ? 'Tambah' : 'Kurangi'}: ${r.rekening_nama}` })),
    after: (after.realokasi || []).map((r) => ({ ...r, nama: `${r.aksi === 'TAMBAH' ? 'Tambah' : 'Kurangi'}: ${r.rekening_nama}` })),
    keyOf: (r) => `${r.aksi}|${r.kode || r.rekening_nama}`,
    fields: [
      { key: 'nilai', label: 'Nilai', kind: 'rupiah' },
      { key: 'nilai_awal', label: 'Nilai awal', kind: 'rupiah' },
      { key: 'alasan', label: 'Alasan' }
    ]
  });

  return list;
}

/** Tambahkan baris ringkasan hasil SROI (rasio sebelum → sesudah) di awal daftar. */
export function withSroiDelta(mods, beforeDraft, afterDraft) {
  const b = computeSroiFromDraft(beforeDraft);
  const a = computeSroiFromDraft(afterDraft);
  if (b.sroiScore === a.sroiScore && b.pvImpact === a.pvImpact) return mods;
  return [
    {
      group: 'Hasil Rasio Nilai Prakiraan Dampak',
      label: 'Rasio Nilai Prakiraan Dampak',
      from: `${b.sroiScore} (${b.shortLabel})`,
      to: `${a.sroiScore} (${a.shortLabel})`,
      derived: true
    },
    ...mods
  ];
}

export function summarizeModifications(mods, max = 5) {
  const real = (mods || []).filter((m) => !m.derived);
  if (!real.length) return 'Tidak ada perubahan isi.';
  const counts = new Map();
  real.forEach((m) => counts.set(m.group, (counts.get(m.group) || 0) + 1));
  const parts = [...counts.entries()].slice(0, max).map(([g, n]) => `${g} (${n})`);
  const more = counts.size > max ? ` dan ${counts.size - max} bagian lain` : '';
  return `Perubahan pada: ${parts.join(', ')}${more}.`;
}

/** Ringkas untuk disimpan ke server (batasi ukuran). */
export function modificationsForStorage(mods, limit = 60) {
  return (mods || []).slice(0, limit).map((m) => ({
    field: m.group,
    label: short(m.label, 160),
    from: short(m.from, 300),
    to: short(m.to, 300)
  }));
}

export function defaultVersionName(prefix) {
  const stamp = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
  return `${prefix} · ${stamp}`;
}

// ── Edit dengan AI ───────────────────────────────────────────────────

/** Kunci draft yang boleh diubah AI untuk daftar scope terpilih. */
export function allowedKeysForScopes(scopeIds) {
  const keys = new Set();
  AI_EDIT_SCOPES.filter((s) => (scopeIds || []).includes(s.id)).forEach((s) => s.keys.forEach((k) => keys.add(k)));
  return keys;
}

export async function requestAiEdit({ rkaId, analysis, instruction, scopes, signal }) {
  const res = await apiFetch('/api/v1/aibot/edit-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    timeoutMs: 120000,
    signal,
    body: JSON.stringify({ rkaId, snapshot: createDraft(analysis), instruction, scopes })
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* body kosong / bukan JSON */
  }
  if (!res.ok || data.success === false || data.error) {
    throw new Error(data.error || `Permintaan ke layanan AI gagal (HTTP ${res.status}).`);
  }
  return data;
}

/**
 * Terapkan patch dari AI ke salinan draft. Hanya kunci pada scope terpilih yang
 * diterima (pengaman kedua setelah validasi server).
 * @returns {{ beforeDraft, afterDraft, after, modifications, appliedKeys }}
 */
export function applyAiPatch(base, patch, scopeIds) {
  const beforeDraft = createDraft(base);
  const afterDraft = deepClone(beforeDraft);
  const allowed = allowedKeysForScopes(scopeIds);
  const appliedKeys = [];

  Object.entries(patch || {}).forEach(([key, value]) => {
    if (!allowed.has(key) || !(key in afterDraft)) return;
    if (key === 'kesesuaian') afterDraft.kesesuaian = { ...afterDraft.kesesuaian, ...value };
    else afterDraft[key] = deepClone(value);
    appliedKeys.push(key);
  });

  const mods = withSroiDelta(diffDrafts(beforeDraft, afterDraft), beforeDraft, afterDraft);
  return {
    beforeDraft,
    afterDraft,
    after: draftToAnalysis(base, afterDraft),
    modifications: mods,
    appliedKeys
  };
}
