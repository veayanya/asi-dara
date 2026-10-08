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
 * @param {object[]} [opts.reallocs]  reallocationJustifications (untuk contoh isi & penilaian sisa)
 * @param {string} [opts.status]  paksa status baris sisa
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

  // Isi "Belanja Lainnya" diturunkan dari data nyata: rekening pada realokasi AI yang
  // tidak termasuk rincian utama (kode/nama tidak cocok dengan baris mana pun).
  const hasCode = (c) => !!c && c !== '-';
  const cocok = (j) => list.some((p) =>
    (hasCode(p.kode) && hasCode(j.kode) && p.kode === j.kode) ||
    (p.nama && j.rekening_nama &&
      (String(p.nama).toLowerCase().includes(String(j.rekening_nama).toLowerCase()) ||
       String(j.rekening_nama).toLowerCase().includes(String(p.nama).toLowerCase()))));
  const reallocs = Array.isArray(opts.reallocs) ? opts.reallocs : [];
  const dalamSisa = reallocs.filter((j) => j && j.rekening_nama && !cocok(j));
  const contoh = [...new Set(dalamSisa.map((j) => j.rekening_nama))];

  // Tidak ada status "Belum Dapat Dinilai": sisa selalu dinilai agar total ringkasan = 100%.
  // Ada rekening di dalam sisa yang disarankan DIKURANGI → Inefisien; selain itu Efisien
  // (sama dengan aturan bawaan aplikasi untuk rekening tanpa temuan realokasi).
  const adaKurangi = dalamSisa.some((j) => j.aksi === 'KURANGI');
  const status = opts.status || (adaKurangi ? 'Inefisien' : 'Efisien');

  const contohTeks = contoh.length
    ? `Contoh rekening di dalamnya: ${contoh.slice(0, 5).join('; ')}.`
    : 'Berisi belanja pendukung seperti ATK/bahan habis pakai, konsumsi, perjalanan dinas, honorarium, cetak/penggandaan, dan sewa yang nilainya kecil-kecil.';
  const penilaian = adaKurangi
    ? 'Terdapat rekening di dalamnya yang direkomendasikan AI untuk dikurangi, sehingga kelompok ini dinilai inefisien.'
    : 'Tidak ada temuan kelebihan harga/volume terhadap SSH/SBM pada kelompok ini, sehingga dinilai efisien.';

  list.push({
    kode: '-',
    nama: NAMA_REKENING_SISA,
    persen: sisaPersen,
    ...(sisaNilai !== null ? { nilai: sisaNilai } : {}),
    status,
    alasan:
      `Gabungan rekening belanja di luar ${list.length} rekening terbesar (${sisaPersen}% dari pagu). ` +
      `${contohTeks} ${penilaian}`,
    sisa: true,
  });
  return list;
}
