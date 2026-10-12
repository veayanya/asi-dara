// Verifikasi Kelaikan Anggaran (5 Prinsip Utilitasi & Efisiensi).
// AI hanya MENGISI data mentah (klasifikasi biaya pendukung + skor tiap kriteria).
// Skor total, porsi pendukung, gerbang wajib, dan status akhir dihitung di SINI
// supaya aturan konsisten dan tidak bergantung pada "karangan" AI.

const BATAS_PENDUKUNG = 30;      // % maksimal biaya pendukung
const GERBANG_PENDUKUNG = 50;    // % → gugur jika tanpa substansi kinerja jelas
const AMBANG_LAYAK = 80;
const AMBANG_CUKUP = 60;

// Bobot total = 100. Kriteria 1 (batasan rekening) dihitung kode dari porsi.
const KRITERIA = [
  { key: 'batasan_rekening',     nama: 'Batasan Rekening & Pengalihan ke Kinerja', bobot: 25, hitungKode: true },
  { key: 'uraian_belanja',       nama: 'Fokus pada Uraian Belanja',               bobot: 25 },
  { key: 'efisiensi_pertemuan',  nama: 'Efisiensi Pertemuan (Rapat vs FGD)',      bobot: 15 },
  { key: 'tenaga_ahli',          nama: 'Relevansi Tenaga Ahli/Konsultan',         bobot: 15 },
  { key: 'kualitas_komponen',    nama: 'Kualitas Komponen Belanja',               bobot: 10 },
  { key: 'kelengkapan_dokumen',  nama: 'Kelengkapan Dokumen & Keselarasan RPJMD', bobot: 10 }
];

const num = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const txt = (v, max = 600) => String(v ?? '').trim().slice(0, max);
const list = (v, maxItems = 12, max = 400) =>
  (Array.isArray(v) ? v : []).map(x => txt(x, max)).filter(Boolean).slice(0, maxItems);
const round2 = (n) => Math.round(n * 100) / 100;

function skorBatasanRekening(porsi) {
  if (porsi <= BATAS_PENDUKUNG) return 100;
  if (porsi <= 40) return 50;
  return 25;
}

/**
 * @param {object} raw   objek verifikasi_kelaikan_ai dari AI
 * @param {number} pagu  total usulan (Rupiah)
 * @returns {object|null} hasil verifikasi, atau null bila data tidak memadai
 */
export function hitungVerifikasiKelaikan(raw, pagu) {
  const total = num(pagu);
  if (!raw || typeof raw !== 'object' || total <= 0) return null;

  // ── Biaya pendukung (klasifikasi AI, dijumlah ulang oleh kode) ──
  const itemPendukung = (Array.isArray(raw.biaya_pendukung) ? raw.biaya_pendukung : [])
    .map(it => ({ uraian: txt(it?.uraian, 200), nilai: Math.max(0, num(it?.nilai)) }))
    .filter(it => it.nilai > 0)
    .slice(0, 60);
  const totalPendukung = Math.min(total, itemPendukung.reduce((s, it) => s + it.nilai, 0));
  const totalSubstansial = Math.max(0, total - totalPendukung);
  const porsi = round2((totalPendukung / total) * 100);
  const batasRupiah = Math.round(total * BATAS_PENDUKUNG / 100);
  const wajibPangkas = porsi > BATAS_PENDUKUNG ? Math.round(totalPendukung - batasRupiah) : 0;

  // ── Skor per kriteria ──
  const kr = raw.kriteria && typeof raw.kriteria === 'object' ? raw.kriteria : {};
  const kriteria = KRITERIA.map(def => {
    const src = kr[def.key] && typeof kr[def.key] === 'object' ? kr[def.key] : {};
    let skor;
    let dataTidakTersedia = false;
    if (def.hitungKode) {
      skor = skorBatasanRekening(porsi);
    } else if (src.tidak_berlaku === true) {
      skor = 100; // mis. tidak ada pertemuan / tidak ada tenaga ahli
    } else if (src.skor_persen === undefined || src.skor_persen === null || src.skor_persen === '') {
      skor = 50;  // konservatif bila AI tidak memberi skor
      dataTidakTersedia = true;
    } else {
      skor = clamp(Math.round(num(src.skor_persen)), 0, 100);
    }
    return {
      key: def.key,
      nama: def.nama,
      bobot: def.bobot,
      skor_persen: skor,
      poin: round2((skor * def.bobot) / 100),
      tidak_berlaku: src.tidak_berlaku === true,
      data_tidak_tersedia: dataTidakTersedia,
      temuan: def.hitungKode
        ? `Porsi biaya pendukung ${porsi}% dari total usulan (batas ${BATAS_PENDUKUNG}%).`
        : txt(src.temuan)
    };
  });
  const skorTotal = round2(kriteria.reduce((s, k) => s + k.poin, 0));

  // ── Gerbang wajib (tanpa skor) ──
  const g = raw.gerbang && typeof raw.gerbang === 'object' ? raw.gerbang : {};
  const gerbang = [
    {
      kode: 'a',
      nama: 'Sesuai kewenangan daerah & regulasi',
      lolos: g.kewenangan_ok !== false,
      catatan: txt(g.catatan_kewenangan)
    },
    {
      kode: 'b',
      nama: 'Memiliki RAB yang sah',
      lolos: g.rab_ok !== false,
      catatan: g.kak_tersedia === false
        ? 'KAK tidak ditemukan pada berkas; dicatat sebagai klarifikasi dan menurunkan skor dokumen.'
        : txt(g.catatan_dokumen)
    },
    {
      kode: 'c',
      nama: `Porsi pendukung > ${GERBANG_PENDUKUNG}% tanpa substansi kinerja jelas`,
      lolos: !(porsi > GERBANG_PENDUKUNG && g.substansi_kinerja_jelas === false),
      catatan: porsi > GERBANG_PENDUKUNG ? `Porsi pendukung ${porsi}%.` : ''
    }
  ];
  const gerbangGugur = gerbang.filter(x => !x.lolos);

  // ── Catatan keras / pemborosan ──
  const catatanKeras = list(raw.catatan_keras);
  const pemborosan = raw.pemborosan_tidak_masuk_akal === true;
  const tenagaAhliTidakLinear = raw.tenaga_ahli_tidak_linear === true;

  // ── Status akhir (aturan paling ketat menang) ──
  let status;
  const alasan = [];
  const dibatasiPorsi = porsi > BATAS_PENDUKUNG && skorTotal >= AMBANG_LAYAK;

  if (gerbangGugur.length) {
    status = 'TIDAK LAYAK';
    gerbangGugur.forEach(x => alasan.push(`Gugur pada gerbang wajib (${x.kode}): ${x.nama}.`));
  } else if (skorTotal < AMBANG_CUKUP) {
    status = 'TIDAK LAYAK';
    alasan.push(`Skor total ${skorTotal} di bawah ${AMBANG_CUKUP}.`);
  } else if (pemborosan || tenagaAhliTidakLinear) {
    status = 'TIDAK LAYAK';
    if (pemborosan) alasan.push('Terdapat uraian belanja yang tidak masuk akal/pemborosan.');
    if (tenagaAhliTidakLinear) alasan.push('Tenaga ahli tidak linear/relevan dengan program.');
  } else if (skorTotal >= AMBANG_LAYAK && porsi <= BATAS_PENDUKUNG && catatanKeras.length === 0) {
    status = 'LAYAK';
    alasan.push(`Skor total ${skorTotal} (≥ ${AMBANG_LAYAK}), porsi pendukung ${porsi}% (≤ ${BATAS_PENDUKUNG}%), tanpa catatan keras.`);
  } else {
    status = 'CUKUP';
    if (skorTotal < AMBANG_LAYAK) alasan.push(`Skor total ${skorTotal} berada pada rentang ${AMBANG_CUKUP}–${AMBANG_LAYAK - 1}.`);
    if (porsi > BATAS_PENDUKUNG) alasan.push(`Porsi pendukung ${porsi}% melebihi ${BATAS_PENDUKUNG}%; wajib dipangkas minimal Rp ${wajibPangkas.toLocaleString('id-ID')} dan dialihkan ke aktivitas substansial.`);
    if (catatanKeras.length) alasan.push('Terdapat catatan keras yang harus diselesaikan sebelum disetujui.');
  }

  return {
    status,
    status_dibatasi_porsi: dibatasiPorsi,
    alasan,
    skor_total: skorTotal,
    ambang: { layak: AMBANG_LAYAK, cukup: AMBANG_CUKUP, batas_pendukung: BATAS_PENDUKUNG },
    anggaran: {
      total_usulan: Math.round(total),
      total_pendukung: Math.round(totalPendukung),
      total_substansial: Math.round(totalSubstansial),
      porsi_pendukung_persen: porsi,
      batas_pendukung_rupiah: batasRupiah,
      wajib_dipangkas: wajibPangkas
    },
    biaya_pendukung: itemPendukung,
    gerbang,
    kriteria,
    catatan_keras: catatanKeras,
    klarifikasi: list(raw.klarifikasi, 15),
    rekomendasi_pengalihan: txt(raw.rekomendasi_pengalihan, 1200)
  };
}
