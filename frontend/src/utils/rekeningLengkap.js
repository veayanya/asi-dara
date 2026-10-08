// utils/rekeningLengkap.js
// Melengkapi daftar rekening belanja sampai TEPAT 100% dari pagu.
//
// Masalah sebelumnya: AI hanya mengembalikan 3–6 rekening terbesar, lalu grafik
// menambah irisan sintetis "Lainnya" (100% − jumlah rekening). Irisan itu bukan
// rekening sungguhan: tidak punya status efisien/inefisien, tidak muncul di
// "Status Efisiensi per Rekening" maupun "Ringkasan Efektif & Inefektif", sehingga
// total ringkasan tidak pernah 100%.
//
// Solusi: sisa pagu dijadikan SATU baris rekening sungguhan bernama
// "Belanja Lainnya (di luar rincian utama)" lengkap dengan kode, nilai, persen,
// status, dan uraian penjelasan. Baris ini ikut dihitung di semua daftar & ringkasan.

export const NAMA_REKENING_SISA = 'Belanja Lainnya (di luar rincian utama)';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const isSisa = (r) =>
  !!r && (r.sisa === true || /^(belanja\s+)?lainnya\b/i.test(String(r.nama || '').trim()));

/**
 * @param {object[]} rows  rekeningProporsi / rekeningProporsiUsulan
 * @param {number} pagu    total pagu (boleh 0 bila tidak diketahui → pakai persen)
 * @param {object} [opts]
 * @param {string} [opts.status]  status baris sisa (default "Belum Dapat Dinilai")
 * @returns {object[]} salinan baru; baris asli tidak diubah
 */
export function lengkapiRekeningProporsi(rows, pagu = 0, opts = {}) {
  const list = Array.isArray(rows) ? rows.map((r) => ({ ...r })) : [];
  if (!list.length) return list;

  // Sudah ada baris sisa/"Lainnya" sungguhan → jangan menambah lagi (idempotent).
  if (list.some(isSisa)) return list;

  const sumPersen = list.reduce((s, r) => s + num(r.persen), 0);
  const sisaPersen = Number((100 - sumPersen).toFixed(2));
  if (sisaPersen <= 0.05) return list; // sudah 100%

  const total = num(pagu);
  const sumNilai = list.reduce((s, r) => s + num(r.nilai), 0);
  const sisaNilai = total > 0 ? Math.max(0, Math.round(total - sumNilai)) : null;

  const status = opts.status || 'Belum Dapat Dinilai';
  const jumlah = list.length;

  list.push({
    kode: '-',
    nama: NAMA_REKENING_SISA,
    persen: sisaPersen,
    ...(sisaNilai !== null ? { nilai: sisaNilai } : {}),
    status,
    alasan:
      `Gabungan seluruh rekening belanja lain di luar ${jumlah} rekening terbesar pada rincian ini ` +
      `(${sisaPersen}% dari pagu). Dokumen belum merinci masing-masing rekening ini, sehingga ` +
      `efisiensinya belum dapat dinilai satu per satu; tinjau rincian RKA aslinya untuk memastikan ` +
      `tidak ada belanja yang melebihi standar SSH/SBM.`,
    sisa: true,
  });
  return list;
}
