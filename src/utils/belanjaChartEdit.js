// src/utils/belanjaChartEdit.js
// Logika murni (tanpa Vue/DOM) untuk MENGEDIT diagram pada bagian
// "Analisis Komponen Belanja & Rekomendasi Belanja" di panel Edit Manual.
//
// Pie kiri  = draft.rekeningProporsi (langsung diedit: nama, %, Rp, status).
// Pie kanan = hasil buildUsulanProporsi(rekeningProporsi, realokasi, pagu).
//   Setiap irisan kanan dipetakan kembali ke baris-baris draft.realokasi
//   (KURANGI = "Dikurangi", TAMBAH = "Dialokasikan"), sehingga mengubah nilai
//   sebuah irisan menulis ulang baris realokasinya — form di bawah diagram
//   dan riwayat perubahan tetap sinkron.

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v) => (v === null || v === undefined ? '' : String(v));

const hasCode = (c) => !!c && c !== '-';

/**
 * Pencocokan rekening ⇄ baris realokasi. HARUS identik dengan pencocokan di
 * buildUsulanProporsi (composables/useAnalysis.js) agar irisan yang kita
 * petakan sama dengan irisan yang digambar.
 */
export function matchesRekening(p, j) {
  const pn = str(p.nama).toLowerCase();
  const jn = str(j.rekening_nama).toLowerCase();
  return (
    (hasCode(p.kode) && hasCode(j.kode) && p.kode === j.kode) ||
    !!(pn && jn && (pn.includes(jn) || jn.includes(pn)))
  );
}

/** Baris rekening yang ikut digambar: punya nama, atau sudah punya angka. */
export const isRekeningUsed = (r) =>
  !!(str(r.nama).trim() || num(r.persen) || num(r.nilai));

/** Baris realokasi → format "justification" yang dipahami buildUsulanProporsi. */
export function toJustification(r) {
  const head = {
    kode: str(r.kode).trim(),
    rekening_nama: str(r.rekening_nama).trim(),
    aksi: r.aksi === 'TAMBAH' ? 'TAMBAH' : 'KURANGI',
    nilai_awal: num(r.nilai_awal)
  };
  return head.aksi === 'TAMBAH'
    ? { ...head, nilai_ditambah: num(r.nilai) }
    : { ...head, nilai_dikurangi: num(r.nilai) };
}

/**
 * Bangun daftar irisan diagram "Rekomendasi Belanja" beserta asal-usulnya.
 *
 * @param {object}   args
 * @param {object[]} args.rekening   draft.rekeningProporsi
 * @param {object[]} args.realokasi  draft.realokasi
 * @param {number}   args.pagu
 * @param {Function} args.buildUsulan  buildUsulanProporsi (sumber kebenaran nilai)
 * @returns {{
 *   key:number, kode:string, nama:string, fromAwal:boolean, rekRef:object|null,
 *   awalNilai:number, nilai:number, persen:number, rows:number[]
 * }[]}  rows = indeks pada `realokasi` yang membentuk irisan ini
 */
export function buildRecommendationSlices({ rekening, realokasi, pagu, buildUsulan }) {
  const base = (rekening || []).filter(isRekeningUsed);
  const idxs = [];
  (realokasi || []).forEach((r, i) => {
    if (str(r.rekening_nama).trim()) idxs.push(i);
  });
  const justs = idxs.map((i) => toJustification(realokasi[i]));

  // Nilai & persen: dari fungsi aplikasi sendiri, bukan hitungan ulang.
  const usulan = buildUsulan(base, justs, num(pagu));

  // Pemetaan baris realokasi → irisan: simulasi urutan pencocokan yang sama.
  const list = base.map((p) => ({ kode: str(p.kode), nama: str(p.nama) }));
  const owners = justs.map((j) => {
    let m = list.findIndex((p) => matchesRekening(p, j));
    if (m === -1) {
      list.push({ kode: j.kode || '-', nama: j.rekening_nama });
      m = list.length - 1;
    }
    return m;
  });

  return usulan.map((u, m) => {
    const fromAwal = m < base.length;
    return {
      key: m,
      kode: str(u.kode),
      nama: str(u.nama),
      fromAwal,
      rekRef: fromAwal ? base[m] : null,
      awalNilai: fromAwal ? num(base[m].nilai) : 0,
      nilai: num(u.nilai),
      persen: num(u.persen),
      rows: idxs.filter((_, n) => owners[n] === m)
    };
  });
}

/**
 * Jadikan `targetNilai` sebagai nilai irisan (Rp) dengan menulis ulang baris
 * realokasinya. Turun dari nilai awal → 1 baris KURANGI; naik → 1 baris TAMBAH;
 * sama dengan nilai awal → baris dihapus (irisan tidak berubah).
 * Irisan tambahan (bukan dari rincian rekening) selalu mempertahankan 1 baris
 * TAMBAH, walau nilainya 0, supaya irisan tidak hilang saat sedang diketik.
 * Mengembalikan array baru; tidak mengubah masukan.
 */
export function applyTargetNilai(realokasi, slice, targetNilai) {
  const target = Math.max(0, Math.round(num(targetNilai)));
  const out = (realokasi || []).map((r) => ({ ...r }));
  const rowSet = new Set(slice.rows);
  const first = slice.rows.length ? slice.rows[0] : out.length;
  const proto = slice.rows.length ? out[first] : null;

  const base = slice.fromAwal ? slice.awalNilai : 0;
  const delta = target - base;
  const kept = out.filter((_, i) => !rowSet.has(i));

  if (delta !== 0 || !slice.fromAwal) {
    const aksi = delta < 0 ? 'KURANGI' : 'TAMBAH';
    const same = slice.rows.map((i) => out[i]).find((r) => r.aksi === aksi);
    kept.splice(Math.min(first, kept.length), 0, {
      kode: proto ? str(proto.kode) : (slice.kode === '-' ? '' : str(slice.kode)),
      rekening_nama: proto ? str(proto.rekening_nama) : slice.nama,
      aksi,
      nilai_awal: base,
      nilai: Math.abs(delta),
      alasan: same ? str(same.alasan) : ''
    });
  }
  return kept;
}

/** Hapus semua baris realokasi milik sebuah irisan. */
export function removeSliceRows(realokasi, slice) {
  const rowSet = new Set(slice.rows);
  return (realokasi || []).filter((_, i) => !rowSet.has(i)).map((r) => ({ ...r }));
}

/** Ganti nama irisan tambahan (bukan dari rincian rekening) pada baris-barisnya. */
export function renameSliceRows(realokasi, slice, newName) {
  const rowSet = new Set(slice.rows);
  return (realokasi || []).map((r, i) => (rowSet.has(i) ? { ...r, rekening_nama: str(newName).trim() } : { ...r }));
}

/** Baris realokasi yang menunjuk ke sebuah baris rincian rekening. */
export function realokasiRowsOfRekening(realokasi, rek) {
  const out = [];
  (realokasi || []).forEach((r, i) => {
    if (str(r.rekening_nama).trim() && matchesRekening(rek, toJustification(r))) out.push(i);
  });
  return out;
}

/**
 * Nama unik untuk irisan baru. Pencocokan rekening di aplikasi bersifat
 * "saling mengandung" (substring), jadi "Rekening Baru" dan "Rekening Baru 2"
 * akan dianggap SAMA. Karena itu penomoran memakai kurung siku
 * ("Rekening Baru [1]", "[2]", …) yang tidak saling mengandung.
 */
export function uniqueName(base, existing) {
  const taken = (existing || []).map((n) => str(n).trim().toLowerCase()).filter(Boolean);
  const clash = (cand) => {
    const c = cand.toLowerCase();
    return taken.some((t) => t.includes(c) || c.includes(t));
  };
  for (let n = 1; n <= 50; n += 1) {
    const cand = `${base} [${n}]`;
    if (!clash(cand)) return cand;
  }
  return `${base} [${Date.now() % 1000}]`;
}
