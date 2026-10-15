// Engine Kalkulasi Indikator Pembangunan Daerah Resmi Bapperida

export const formatCurrency = (amount) => {
  if (isNaN(amount) || amount === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercent = (val, decimals = 2) => {
  if (isNaN(val) || val === null) return '0%';
  return `${Number(val).toFixed(decimals)}%`;
};

/**
 * 1. Pertumbuhan Ekonomi (PDRB ADHK)
 * Formula: ((PDRB_th_n - PDRB_th_n_min_1) / PDRB_th_n_min_1) * 100%
 */
export function hitungPertumbuhanEkonomi(pdrbTahunIni, pdrbTahunLalu) {
  const n = parseFloat(pdrbTahunIni);
  const nMin1 = parseFloat(pdrbTahunLalu);

  if (isNaN(n) || isNaN(nMin1) || nMin1 <= 0) {
    return {
      valid: false,
      error: 'Nilai PDRB tahun lalu harus lebih besar dari 0 dan berupa angka valid.'
    };
  }

  const selisih = n - nMin1;
  const laju = (selisih / nMin1) * 100;

  let interpretasi = '';
  if (laju > 5.5) {
    interpretasi = 'Tinggi (akselerasi ekonomi kuat dan ekspansif di atas rata-rata tren daerah).';
  } else if (laju >= 4.0) {
    interpretasi = 'Moderat / Stabil (pertumbuhan terjaga dalam koridor sasaran makro daerah).';
  } else if (laju > 0) {
    interpretasi = 'Lambat (perlu stimulus belanja modal dan penguatan investasi sektor unggulan).';
  } else {
    interpretasi = 'Kontraksi ekonomi (terjadi penurunan nilai tambah produksi riil).';
  }

  return {
    valid: true,
    nilaiTahunIni: n,
    nilaiTahunLalu: nMin1,
    selisih,
    laju: Number(laju.toFixed(2)),
    rumus: 'Laju PDRB = [ (PDRB th_n - PDRB th_(n-1)) / PDRB th_(n-1) ] × 100%',
    interpretasi
  };
}

/**
 * 2. Persentase Realisasi Anggaran (Belanja / Pendapatan)
 * Formula: (Realisasi / Pagu) * 100%
 */
export function hitungRealisasiAnggaran(realisasi, pagu) {
  const r = parseFloat(realisasi);
  const p = parseFloat(pagu);

  if (isNaN(r) || isNaN(p) || p <= 0) {
    return {
      valid: false,
      error: 'Pagu anggaran harus lebih besar dari 0.'
    };
  }

  const persen = (r / p) * 100;
  const sisa = p - r;

  let status = '';
  let predikat = '';
  if (persen >= 95) {
    predikat = 'Sangat Tinggi (Optimal)';
    status = 'Capaian serapan anggaran melampaui ambang batas ideal penyerapan APBD.';
  } else if (persen >= 85) {
    predikat = 'Tinggi (Baik)';
    status = 'Serapan berada dalam rentang target kinerja tahunan.';
  } else if (persen >= 70) {
    predikat = 'Sedang (Perlu Percepatan)';
    status = 'Perlu akselerasi SPM dan verifikasi SP2D kegiatan kontraktual.';
  } else {
    predikat = 'Rendah (Atensi Khusus)';
    status = 'Risiko tinggi terjadi SiLPA besar dan keterlambatan output program prioritas.';
  }

  return {
    valid: true,
    realisasi: r,
    pagu: p,
    persen: Number(persen.toFixed(2)),
    sisa,
    predikat,
    status,
    rumus: 'Persentase Realisasi = (Realisasi Belanja / Pagu Anggaran) × 100%'
  };
}

/**
 * 3. Indeks Pembangunan Manusia (IPM) Simulator Sederhana
 * Komponen:
 * - UHH (Umur Harapan Hidup saat lahir): Max 85, Min 20
 * - HLS (Harapan Lama Sekolah): Max 18, Min 0
 * - RLS (Rata-rata Lama Sekolah): Max 15, Min 0
 * - Pengeluaran Riil per Kapita (PPP): Max 26.572.000, Min 1.007.436
 */
export function hitungSimulasiIPM(uhh, hls, rls, pengeluaran) {
  const u = parseFloat(uhh);
  const h = parseFloat(hls);
  const r = parseFloat(rls);
  const p = parseFloat(pengeluaran);

  if (isNaN(u) || isNaN(h) || isNaN(r) || isNaN(p)) {
    return { valid: false, error: 'Semua 4 parameter dimensi IPM harus diisi angka valid.' };
  }

  // Standar BPS Metodologi Baru
  const indeksKesehatan = ((u - 20) / (85 - 20)) * 100;
  const indeksHLS = (h / 18) * 100;
  const indeksRLS = (r / 15) * 100;
  const indeksPendidikan = (indeksHLS + indeksRLS) / 2;

  const minP = Math.log(1007436);
  const maxP = Math.log(26572000);
  const pLog = Math.log(Math.max(p, 1007436));
  const indeksPengeluaran = ((pLog - minP) / (maxP - minP)) * 100;

  // IPM = (I_Kesehatan * I_Pendidikan * I_Pengeluaran)^(1/3)
  const ik = Math.max(0, Math.min(100, indeksKesehatan));
  const ip = Math.max(0, Math.min(100, indeksPendidikan));
  const ie = Math.max(0, Math.min(100, indeksPengeluaran));

  const ipm = Math.cbrt(ik * ip * ie);

  let kategori = '';
  if (ipm >= 80) kategori = 'Sangat Tinggi';
  else if (ipm >= 70) kategori = 'Tinggi';
  else if (ipm >= 60) kategori = 'Sedang';
  else kategori = 'Rendah';

  return {
    valid: true,
    ipm: Number(ipm.toFixed(2)),
    kategori,
    indeksKesehatan: Number(ik.toFixed(2)),
    indeksPendidikan: Number(ip.toFixed(2)),
    indeksPengeluaran: Number(ie.toFixed(2)),
    rumus: 'IPM = ∛( Indeks Kesehatan × Indeks Pendidikan × Indeks Pengeluaran )'
  };
}

/**
 * 4. Capaian Kinerja IKU / IKD
 * Jika orientasi positif (makin besar makin baik, misal PAD, IPM): (Realisasi / Target) * 100%
 * Jika orientasi negatif (makin kecil makin baik, misal Kemiskinan, Stunting): (Target / Realisasi) * 100% atau rumus alternatif
 */
export function hitungCapaianKinerja(realisasi, target, jenisIndikator = 'positif') {
  const r = parseFloat(realisasi);
  const t = parseFloat(target);

  if (isNaN(r) || isNaN(t) || t === 0) {
    return { valid: false, error: 'Target tidak boleh 0 dan harus berupa angka valid.' };
  }

  let capaian = 0;
  if (jenisIndikator === 'positif') {
    capaian = (r / t) * 100;
  } else {
    // Indikator negatif (penurunan kemiskinan/stunting)
    capaian = (1 + (t - r) / t) * 100;
  }

  let predikat = '';
  if (capaian >= 100) predikat = 'Sangat Berhasil (Target Tercapai/Melampaui)';
  else if (capaian >= 85) predikat = 'Berhasil';
  else if (capaian >= 65) predikat = 'Cukup';
  else predikat = 'Kurang / Tidak Tercapai';

  return {
    valid: true,
    capaian: Number(capaian.toFixed(2)),
    predikat,
    jenisIndikator,
    rumus: jenisIndikator === 'positif' 
      ? 'Capaian IKU = (Realisasi / Target) × 100%' 
      : 'Capaian IKU (Indikator Pengurangan) = [ 1 + (Target - Realisasi) / Target ] × 100%'
  };
}

/**
 * 5. Efektivitas Kinerja Anggaran (RKA/DPA) — Kepmendagri No. 690.900-327 Tahun 1996
 * Rumus: (Realisasi Output / Target Output) * 100%
 */
export function hitungEfektivitasAnggaran(realisasiOutput, targetOutput, satuan = 'Unit/Fisik') {
  const r = parseFloat(realisasiOutput);
  const t = parseFloat(targetOutput);

  if (isNaN(r) || isNaN(t) || t <= 0) {
    return { valid: false, error: 'Target output harus berupa angka valid dan lebih besar dari 0.' };
  }

  const persen = (r / t) * 100;
  let predikat = '';
  let penjelasan = '';

  if (persen > 100) {
    predikat = 'Sangat Efektif';
    penjelasan = 'Realisasi capaian fisik/outcome melampaui target yang ditetapkan dalam RKA/DPA.';
  } else if (persen >= 90) {
    predikat = 'Efektif';
    penjelasan = 'Realisasi output mencapai sasaran ideal yang direncanakan.';
  } else if (persen >= 80) {
    predikat = 'Cukup Efektif';
    penjelasan = 'Realisasi output berada pada rentang batas toleransi kinerja yang dapat diterima.';
  } else if (persen >= 60) {
    predikat = 'Kurang Efektif';
    penjelasan = 'Perlu evaluasi hambatan teknis pelaksanaan lapangan karena output di bawah 80%.';
  } else {
    predikat = 'Tidak Efektif';
    penjelasan = 'Kinerja program/kegiatan tidak mencapai target substansial (<60%).';
  }

  return {
    valid: true,
    realisasiOutput: r,
    targetOutput: t,
    satuan,
    persen: Number(persen.toFixed(2)),
    predikat,
    penjelasan,
    dasarHukum: 'Kepmendagri No. 690.900-327 Tahun 1996',
    rumus: 'Efektivitas (%) = (Realisasi Output / Target Output) × 100%'
  };
}

/**
 * 6. Efisiensi Anggaran (RKA/DPA) — Kepmendagri No. 690.900-327 Tahun 1996
 * Rumus: ((Realisasi Anggaran / Pagu Anggaran) / (Realisasi Output / Target Output)) * 100%
 */
export function hitungEfisiensiAnggaran(realisasiAnggaran, paguAnggaran, realisasiOutput, targetOutput) {
  const rAngg = parseFloat(realisasiAnggaran);
  const pAngg = parseFloat(paguAnggaran);
  const rOut = parseFloat(realisasiOutput);
  const tOut = parseFloat(targetOutput);

  if (isNaN(rAngg) || isNaN(pAngg) || pAngg <= 0) {
    return { valid: false, error: 'Pagu anggaran harus berupa angka lebih besar dari 0.' };
  }
  if (isNaN(rOut) || isNaN(tOut) || tOut <= 0 || rOut <= 0) {
    return { valid: false, error: 'Realisasi dan Target output harus berupa angka lebih besar dari 0.' };
  }

  const rasioAnggaran = (rAngg / pAngg) * 100;
  const rasioOutput = (rOut / tOut) * 100;
  const efisiensi = (rasioAnggaran / rasioOutput) * 100;

  let predikat = '';
  let penjelasan = '';

  if (efisiensi < 60) {
    predikat = 'Sangat Efisien';
    penjelasan = 'Output yang dicapai sangat tinggi relatif terhadap belanja anggaran yang hemat/rendah.';
  } else if (efisiensi <= 80) {
    predikat = 'Efisien';
    penjelasan = 'Penggunaan alokasi anggaran hemat dan menghasilkan output sesuai proporsi ideal.';
  } else if (efisiensi <= 90) {
    predikat = 'Cukup Efisien';
    penjelasan = 'Serapan anggaran seimbang dengan capaian output yang dihasilkan.';
  } else if (efisiensi <= 100) {
    predikat = 'Kurang Efisien';
    penjelasan = 'Anggaran terserap tinggi namun capaian fisik/output mendekati batas bawah proporsional.';
  } else {
    predikat = 'Tidak Efisien';
    penjelasan = 'Persentase belanja anggaran lebih besar daripada persentase capaian output yang terealisasi.';
  }

  return {
    valid: true,
    realisasiAnggaran: rAngg,
    paguAnggaran: pAngg,
    realisasiOutput: rOut,
    targetOutput: tOut,
    rasioAnggaran: Number(rasioAnggaran.toFixed(2)),
    rasioOutput: Number(rasioOutput.toFixed(2)),
    efisiensi: Number(efisiensi.toFixed(2)),
    predikat,
    penjelasan,
    dasarHukum: 'Kepmendagri No. 690.900-327 Tahun 1996',
    rumus: 'Efisiensi (%) = (Rasio Anggaran : Rasio Output) × 100%'
  };
}

/**
 * 7. SROI (Social Return on Investment)
 * Rumus: SROI Ratio = (Total Manfaat Sosial - Faktor Pengurang) / Total Investasi
 */
export function hitungSROIRatio(totalInvestasi, totalManfaat, faktorPengurang = 0) {
  const inv = parseFloat(totalInvestasi);
  const man = parseFloat(totalManfaat);
  const red = parseFloat(faktorPengurang) || 0;

  if (isNaN(inv) || inv <= 0) {
    return { valid: false, error: 'Total nilai investasi program (Input) harus lebih besar dari 0.' };
  }
  if (isNaN(man) || man < 0) {
    return { valid: false, error: 'Total nilai proxy manfaat sosial harus berupa angka valid.' };
  }

  const manfaatBersih = Math.max(0, man - red);
  const ratio = manfaatBersih / inv;

  let interpretasi = '';
  if (ratio > 1) {
    interpretasi = `Setiap Rp 1 investasi menghasilkan Rp ${ratio.toFixed(2)} nilai manfaat sosial bagi masyarakat (Program Layak & Berdampak Signifikan).`;
  } else if (ratio === 1) {
    interpretasi = 'Impas (Nilai manfaat sosial setara dengan biaya belanja investasi yang dikeluarkan).';
  } else {
    interpretasi = `Nilai manfaat sosial (Rp ${ratio.toFixed(2)} per Rp 1) lebih kecil dari biaya investasi program. Perlu reviu efektivitas outcome.`;
  }

  return {
    valid: true,
    totalInvestasi: inv,
    totalManfaat: man,
    faktorPengurang: red,
    manfaatBersih,
    ratio: Number(ratio.toFixed(2)),
    interpretasi,
    rumus: 'SROI Ratio = [ Nilai Manfaat Sosial − Faktor Pengurang ] / Total Investasi (Nilai Input)'
  };
}

