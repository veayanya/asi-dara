import { 
  BAPPERIDA_INFO, 
  DOKUMEN_PERENCANAAN, 
  REGULASI_ACUAN, 
  INDIKATOR_PEMBANGUNAN, 
  TAHAPAN_MUSRENBANG,
  KATEGORI_MASALAH_BAPPERIDA 
} from '../data/bapperidaKnowledge.js';
import { 
  hitungPertumbuhanEkonomi, 
  hitungRealisasiAnggaran, 
  hitungEfektivitasAnggaran,
  hitungEfisiensiAnggaran,
  hitungSROIRatio,
  formatCurrency, 
  formatPercent 
} from './calculationEngine.js';

// Pre-packaged responses and dynamic contextual engine
export async function processUserMessage(rawMessage, customApiKey = '') {
  const query = rawMessage.trim().toLowerCase();

  // If user provided custom API Key, try live LLM API call first
  if (customApiKey && customApiKey.trim().length > 10) {
    try {
      const liveRes = await callExternalLLM(rawMessage, customApiKey);
      if (liveRes) return liveRes;
    } catch (err) {
      console.warn('External API call failed, falling back to local engine:', err);
    }
  }

  // 1. Skenario Hipotesis / Simulasi Pengguna
  const hypotheticalResponse = checkHypotheticalScenarioIntent(query, rawMessage);
  if (hypotheticalResponse) return hypotheticalResponse;

  // 2. Diagnosis Permasalahan
  const diagnosisResponse = checkProblemDiagnosisIntent(query, rawMessage);
  if (diagnosisResponse) return diagnosisResponse;

  // 3. Analisis Kinerja Anggaran (Efektivitas, Efisiensi, SROI, RKA)
  const rkaResponse = checkRkaKinerjaIntent(query, rawMessage);
  if (rkaResponse) return rkaResponse;

  // 4. Kalkulasi Makro (PDRB, Realisasi Anggaran)
  const calcResponse = checkCalculationIntent(query);
  if (calcResponse) return calcResponse;

  // 5. Regulasi
  if (query.includes('regulasi') || query.includes('uu 25') || query.includes('permendagri 86') || query.includes('permendagri 90') || query.includes('kepmendagri 690') || query.includes('dasar hukum')) {
    return formatRegulasiResponse(query);
  }

  // 6. Dokumen Perencanaan
  for (const doc of DOKUMEN_PERENCANAAN) {
    if (query.includes(doc.kode.toLowerCase()) || query.includes(doc.nama.toLowerCase())) {
      return formatDokumenResponse(doc);
    }
  }

  // 7. Musrenbang & Alur Perencanaan
  if (query.includes('musrenbang') || query.includes('tahapan musrenbang') || query.includes('alur perencanaan') || query.includes('usulan warga') || query.includes('pokir')) {
    return formatMusrenbangResponse();
  }

  // 8. Tupoksi / Bidang Bapperida
  if (query.includes('tupoksi') || query.includes('tugas bapperida') || query.includes('bidang') || query.includes('fungsi bapperida') || query.includes('litbang')) {
    return formatTupoksiResponse(query);
  }

  // 9. Indikator Makro
  if (query.includes('ipm') || query.includes('pdrb') || query.includes('kemiskinan') || query.includes('pengangguran') || query.includes('tpt') || query.includes('gini')) {
    return formatIndikatorResponse(query);
  }

  // 10. Isu Sensitif
  if (query.includes('sengketa') || query.includes('korupsi') || query.includes('kecurangan') || query.includes('pilkada') || query.includes('bupati terpilih') || query.includes('politik')) {
    return {
      type: 'warning',
      badge: null,
      text: `Isu ini menyangkut ranah hukum/politik yang bukan kewenangan saya untuk dianalisis. Untuk dugaan penyimpangan, bisa diadukan ke **Inspektorat Kabupaten Cirebon** atau melalui **SP4N-LAPOR!**`
    };
  }

  // 11. Greeting
  if (query.includes('halo') || query.includes('hai') || query.includes('hi') || query.includes('selamat pagi') || query.includes('selamat siang') || query.includes('siapa kamu') || query.includes('bantuan')) {
    return formatGreetingResponse();
  }

  // 12. Fallback
  return formatFallbackResponse(rawMessage);
}

// ==========================================
// KASUS 2: SKENARIO HIPOTETIS / CONTOH PENGGUNA
// ==========================================
function checkHypotheticalScenarioIntent(query, rawMessage) {
  const isHypothetical =
    query.includes('misal') ||
    query.includes('seandainya') ||
    query.includes('kalau ada') ||
    query.includes('contohnya') ||
    query.includes('anggap saja') ||
    query.includes('menurutmu gimana kalau') ||
    query.includes('gimana kalau') ||
    query.includes('jika ada') ||
    query.includes('simulasi');

  if (!isHypothetical) return null;

  // Cek skenario anggaran / RKA dengan persen + nominal
  const percentMatch = query.match(/(\d+[\.,]?\d*)\s*%/);
  const mMatch = query.match(/(\d+[\.,]?\d*)\s*(?:m|miliar|milyar|jt|juta|t|triliun)/i);

  if (percentMatch && mMatch) {
    const persenRealisasi = parseFloat(percentMatch[1].replace(',', '.'));
    let paguNominal = null;
    const val = parseFloat(mMatch[1].replace(',', '.'));
    if (/\d+\s*(?:t|triliun)\b/i.test(query)) paguNominal = val * 1e12;
    else if (/\d+\s*(?:m|miliar|milyar)\b/i.test(query)) paguNominal = val * 1e9;
    else if (/\d+\s*(?:jt|juta)\b/i.test(query)) paguNominal = val * 1e6;
    else paguNominal = val * 1e9;

    const realisasiNominal = (persenRealisasi / 100) * paguNominal;
    const sisaNominal = paguNominal - realisasiNominal;

    let kategori, insight, saranTindak;
    if (persenRealisasi >= 95) {
      kategori = 'sangat baik';
      insight = 'Serapan di atas 95% ini tergolong optimal.';
      saranTindak = 'Pastikan output/kinerja fisiknya juga sebanding — kalau belanja tinggi tapi output masih kurang, perlu dicek lagi kualitas pelaksanaannya.';
    } else if (persenRealisasi >= 85) {
      kategori = 'baik';
      insight = 'Serapan di kisaran ini normal dan masih dalam koridor yang sehat.';
      saranTindak = 'Sisa sekitar ' + formatCurrency(sisaNominal) + ' masih bisa dikejar kalau masih ada kegiatan yang belum selesai.';
    } else if (persenRealisasi >= 70) {
      kategori = 'cukup, tapi perlu diakselerasi';
      insight = 'Ada sekitar ' + formatCurrency(sisaNominal) + ' yang belum terserap — cukup besar.';
      saranTindak = 'Biasanya perlu dicek: apakah kontrak/tagihan masih dalam proses, atau memang ada kegiatan yang tertunda. Kalau sudah mendekati akhir tahun, ini sinyal untuk segera percepat pencairan.';
    } else {
      kategori = 'rendah dan perlu perhatian khusus';
      insight = 'Serapan di bawah 70% dari pagu ' + formatCurrency(paguNominal) + ' itu cukup mengkhawatirkan.';
      saranTindak = 'Perlu ditelusuri penyebabnya: apakah ada kendala pengadaan, masalah administrasi, atau target fisik yang juga belum tercapai. Berisiko meninggalkan SiLPA yang besar.';
    }

    return {
      type: 'text',
      badge: null,
      text: `Kalau serapannya **${persenRealisasi}%** dari pagu **${formatCurrency(paguNominal)}**, itu masuk kategori **${kategori}**. ${insight}\n\n${saranTindak}\n\nAda info capaian fisik/outputnya juga nggak? Biar bisa dihitung efisiensinya sekalian — karena realisasi anggaran tinggi belum tentu efisien kalau outputnya masih jauh dari target. *(Ini analisis atas skenario yang kamu kasih ya, bukan data aktual OPD tertentu.)*`
    };
  }

  return null;
}

// ==========================================
// MODUL 5: DIAGNOSIS PERMASALAHAN BAPPERIDA
// ==========================================
function checkProblemDiagnosisIntent(query, rawMessage) {
  const isProblemQuery =
    query.includes('masalah') ||
    query.includes('kendala') ||
    query.includes('hambatan') ||
    query.includes('tidak sinkron') ||
    query.includes('tidak muncul') ||
    query.includes('tidak terakomodir') ||
    query.includes('tidak terealisasi') ||
    query.includes('belum terealisasi') ||
    query.includes('telat') ||
    query.includes('terlambat') ||
    query.includes('inkonsisten') ||
    query.includes('tumpang tindih') ||
    query.includes('belum direvisi') ||
    query.includes('keluhan') ||
    query.includes('aduan') ||
    query.includes('diagnosis');

  if (!isProblemQuery) return null;

  let matchedCategory = null;
  if (query.includes('usulan') || query.includes('masyarakat') || query.includes('warga') || (query.includes('musrenbang') && (query.includes('tidak') || query.includes('belum')))) {
    matchedCategory = KATEGORI_MASALAH_BAPPERIDA.find(c => c.id === 'layanan-masyarakat');
  } else if (query.includes('data') || query.includes('sipd') || query.includes('pelaporan') || query.includes('inkonsisten') || query.includes('terlambat') || query.includes('telat')) {
    matchedCategory = KATEGORI_MASALAH_BAPPERIDA.find(c => c.id === 'data-pelaporan');
  } else if (query.includes('anggaran') || query.includes('serapan') || query.includes('realisasi rendah') || query.includes('refocusing')) {
    matchedCategory = KATEGORI_MASALAH_BAPPERIDA.find(c => c.id === 'anggaran-kinerja');
  } else if (query.includes('koordinasi') || query.includes('dak') || query.includes('kewenangan')) {
    matchedCategory = KATEGORI_MASALAH_BAPPERIDA.find(c => c.id === 'koordinasi-opd');
  } else if (query.includes('regulasi') || query.includes('hukum') || query.includes('revisi rpjmd') || query.includes('belum direvisi')) {
    matchedCategory = KATEGORI_MASALAH_BAPPERIDA.find(c => c.id === 'regulasi-kepatuhan');
  } else if (query.includes('sinkron') || query.includes('nomenklatur') || query.includes('tumpang tindih') || query.includes('renstra')) {
    matchedCategory = KATEGORI_MASALAH_BAPPERIDA.find(c => c.id === 'sinkronisasi');
  } else {
    matchedCategory = KATEGORI_MASALAH_BAPPERIDA[0];
  }

  return {
    type: 'text',
    badge: null,
    text: `Oke, ini kedengarannya masuk ke kategori **${matchedCategory.nama}** — salah satu masalah yang cukup umum di Bapperida.\n\n${matchedCategory.akarMasalah}\n\nUntuk langkah selanjutnya, biasanya ini perlu diteruskan ke **${matchedCategory.tujuanArah}**. ${matchedCategory.langkahAdministratif}\n\n${matchedCategory.dasarHukum ? `Dasar regulasinya: ${matchedCategory.dasarHukum}` : ''}\n\nMau saya bantu rumuskan langkah spesifik atau draft komunikasinya?`
  };
}

// ==========================================
// MODUL 4: ANALISIS KINERJA ANGGARAN (RKA)
// ==========================================
function checkRkaKinerjaIntent(query, rawMessage) {
  // 1. Cek Pertanyaan Efektivitas Anggaran
  if (query.includes('efektivitas') || query.includes('efektif')) {
    const numbers = query.match(/\d+[\.,]?\d*/g);
    if (numbers && numbers.length >= 2) {
      const val1 = parseFloat(numbers[0].replace(',', '.'));
      const val2 = parseFloat(numbers[1].replace(',', '.'));
      // Anggap val1 = realisasi output, val2 = target output
      const hasil = hitungEfektivitasAnggaran(val1, val2);
      return {
        type: 'calculation',
        badge: 'Hasil Analisis Efektivitas Anggaran (Kepmendagri 690/1996)',
        formula: hasil.rumus,
        data: [
          { label: 'Realisasi Output/Fisik', value: `${hasil.realisasiOutput}` },
          { label: 'Target Output RKA/DPA', value: `${hasil.targetOutput}` },
          { label: 'Tingkat Efektivitas', value: `${hasil.persen}%` },
          { label: 'Predikat Kinerja', value: hasil.predikat }
        ],
        interpretasi: hasil.penjelasan,
        text: `### Format Analisis Kinerja Anggaran: Efektivitas\n\n` +
          `1. **Rumus:** \`${hasil.rumus}\`\n` +
          `2. **Data yang digunakan:** Realisasi Output = ${hasil.realisasiOutput}, Target Output = ${hasil.targetOutput} (Berdasarkan data yang Anda berikan)\n` +
          `3. **Langkah Perhitungan:** (${hasil.realisasiOutput} / ${hasil.targetOutput}) × 100% = **${hasil.persen}%**\n` +
          `4. **Hasil Akhir & Kategori:** **${hasil.predikat}** (${hasil.penjelasan})\n` +
          `5. **Dasar Hukum:** ${hasil.dasarHukum}`
      };
    } else {
      return {
        type: 'guide',
        badge: 'Panduan Perhitungan Efektivitas (Kepmendagri 690/1996)',
        text: `**Rumus Efektivitas Anggaran:**\n\`Efektivitas (%) = (Realisasi Output / Target Output) × 100%\`\n\n` +
          `**Skala Interpretasi Kepmendagri No. 690.900-327 Tahun 1996:**\n` +
          `• **> 100%** : Sangat Efektif\n` +
          `• **90% - 100%** : Efektif\n` +
          `• **80% - <90%** : Cukup Efektif\n` +
          `• **60% - <80%** : Kurang Efektif\n` +
          `• **< 60%** : Tidak Efektif\n\n` +
          `*Contoh Perhitungan: Ketik 'Hitung efektivitas realisasi 95 target 100'*`
      };
    }
  }

  // 2. Cek Pertanyaan Efisiensi Anggaran
  if (query.includes('efisiensi') || query.includes('efisien')) {
    const numbers = query.match(/\d+[\.,]?\d*/g);
    if (numbers && numbers.length >= 4) {
      // 4 angka: rAngg, pAngg, rOut, tOut
      const [rA, pA, rO, tO] = numbers.map(n => parseFloat(n.replace(',', '.')));
      const hasil = hitungEfisiensiAnggaran(rA, pA, rO, tO);
      return {
        type: 'calculation',
        badge: 'Hasil Analisis Efisiensi Anggaran (Kepmendagri 690/1996)',
        formula: hasil.rumus,
        data: [
          { label: 'Rasio Anggaran (Realisasi/Pagu)', value: `${hasil.rasioAnggaran}%` },
          { label: 'Rasio Output (Fisik)', value: `${hasil.rasioOutput}%` },
          { label: 'Indeks Efisiensi', value: `${hasil.efisiensi}%` },
          { label: 'Predikat Efisiensi', value: hasil.predikat }
        ],
        interpretasi: hasil.penjelasan,
        text: `### Format Analisis Kinerja Anggaran: Efisiensi\n\n` +
          `1. **Rumus:** \`${hasil.rumus}\`\n` +
          `2. **Data yang digunakan:** Realisasi Anggaran = Rp ${rA.toLocaleString('id-ID')}, Pagu = Rp ${pA.toLocaleString('id-ID')}, Realisasi Output = ${rO}, Target Output = ${tO}\n` +
          `3. **Langkah Perhitungan:** (${hasil.rasioAnggaran}% : ${hasil.rasioOutput}%) × 100% = **${hasil.efisiensi}%**\n` +
          `4. **Hasil Akhir & Kategori:** **${hasil.predikat}** (${hasil.penjelasan})\n` +
          `5. **Catatan:** Sesuai Kepmendagri 690/1996, rasio <60% dikategorikan Sangat Efisien karena capaian output tinggi dengan belanja hemat.`
      };
    } else {
      return {
        type: 'guide',
        badge: 'Panduan Efisiensi Anggaran (Kepmendagri 690/1996)',
        text: `**Rumus Efisiensi Anggaran:**\n\`Efisiensi (%) = (Realisasi Anggaran / Pagu Anggaran) : (Realisasi Output / Target Output) × 100%\`\n\n` +
          `**Skala Interpretasi (Semakin kecil semakin efisien):**\n` +
          `• **< 60%** : Sangat Efisien\n` +
          `• **60% - <80%** : Efisien\n` +
          `• **80% - <90%** : Cukup Efisien\n` +
          `• **90% - 100%** : Kurang Efisien\n` +
          `• **> 100%** : Tidak Efisien\n\n` +
          `💡 *Catatan:* Perhitungan efisiensi mewajibkan satuan target/output yang sepadan. Untuk hitung instan, buka menu **Kalkulator Indikator** di bilah atas.`
      };
    }
  }

  // 3. Cek Pertanyaan SROI (Social Return on Investment)
  if (query.includes('sroi') || query.includes('social return')) {
    const numbers = query.match(/\d+[\.,]?\d*/g);
    if (numbers && numbers.length >= 2) {
      const inv = parseFloat(numbers[0].replace(',', '.'));
      const man = parseFloat(numbers[1].replace(',', '.'));
      const hasil = hitungSROIRatio(inv, man);
      return {
        type: 'calculation',
        badge: 'Hasil Analisis SROI (Social Return on Investment)',
        formula: hasil.rumus,
        data: [
          { label: 'Total Investasi (Input)', value: `Rp ${hasil.totalInvestasi.toLocaleString('id-ID')}` },
          { label: 'Total Nilai Manfaat Sosial', value: `Rp ${hasil.totalManfaat.toLocaleString('id-ID')}` },
          { label: 'SROI Ratio', value: `${hasil.ratio}` }
        ],
        interpretasi: hasil.interpretasi,
        text: `### Hasil Perhitungan SROI (Social Return on Investment)\n\n` +
          `1. **Rumus:** \`${hasil.rumus}\`\n` +
          `2. **Data yang digunakan:** Input Investasi = Rp ${hasil.totalInvestasi.toLocaleString('id-ID')}, Manfaat Sosial = Rp ${hasil.totalManfaat.toLocaleString('id-ID')} (berdasarkan data yang Anda berikan)\n` +
          `3. **Langkah Perhitungan:** Rp ${hasil.totalManfaat.toLocaleString('id-ID')} / Rp ${hasil.totalInvestasi.toLocaleString('id-ID')} = **${hasil.ratio}**\n` +
          `4. **Hasil Akhir & Interpretasi:** SROI Ratio **${hasil.ratio}** (${hasil.interpretasi})\n` +
          `5. **Catatan Validitas:** SROI sangat bergantung pada asumsi proxy finansial outcome. Pastikan nilai proxy mengacu pada survei atau basis data resmi Bapperida/BPS.`
      };
    } else {
      return {
        type: 'guide',
        badge: 'Panduan Metodologi SROI Bapperida',
        text: `**Social Return on Investment (SROI):**\n\`SROI Ratio = Total Nilai Manfaat Sosial / Total Nilai Investasi (Input)\`\n\n` +
          `**7 Langkah Panduan SROI:**\n` +
          `1. Identifikasi INPUT (Total biaya program dari RKA/DPA)\n` +
          `2. Identifikasi OUTPUT (Jumlah penerima manfaat/kegiatan)\n` +
          `3. Identifikasi OUTCOME (Perubahan kondisi sosial/ekonomi warga)\n` +
          `4. Tentukan PROXY Finansial (Nilai moneter per outcome)\n` +
          `5. Hitung faktor pengurang (deadweight, attribution, drop-off)\n` +
          `6. Hitung Total Nilai Manfaat Bersih\n` +
          `7. Bagi Total Manfaat dengan Total Investasi\n\n` +
          `⚠️ *Penting: Mohon berikan nilai investasi dan proxy manfaat sosial yang Anda gunakan agar saya dapat menghitungkan SROI program Anda.*`
      };
    }
  }

  // 4. Cek Panduan Membaca RKA
  if (query.includes('baca rka') || query.includes('input rka') || query.includes('ekstrak rka') || query.includes('dokumen rka')) {
    return {
      type: 'guide',
      badge: 'Prosedur Membaca Input dari Dokumen RKA/DPA',
      text: `Saat menganalisis dokumen RKA/DPA, sistem mengekstrak 5 komponen kunci:\n\n` +
        `1. **Nama Program / Kegiatan / Sub-kegiatan** (Sesuai kodefikasi Permendagri 90/2019)\n` +
        `2. **Pagu Alokasi Anggaran (Rp)**\n` +
        `3. **Realisasi Belanja Riil (Rp)** — dari SP2D/SIPD\n` +
        `4. **Target Kinerja** (Indikator tolok ukur + Satuan fisik/persen)\n` +
        `5. **Realisasi Kinerja Output**\n\n` +
        `*Aturan Integritas:* Jika salah satu data belum tersedia, sistem akan bertanya balik dan tidak mengarang angka perkiraan.`
    };
  }

  return null;
}

// FORMATTERS UMUM

function checkCalculationIntent(query) {
  // Check PDRB calculation
  const pdrbRegex = /(?:pdrb|pertumbuhan).*?(\d+[\.,]?\d*).*?(?:dan|ke|dengan|dari).*?(\d+[\.,]?\d*)/i;
  const matchPdrb = query.match(pdrbRegex);
  if (matchPdrb && (query.includes('hitung') || query.includes('laju') || query.includes('berapa'))) {
    const val1 = parseFloat(matchPdrb[1].replace(',', '.'));
    const val2 = parseFloat(matchPdrb[2].replace(',', '.'));
    const [thLalu, thIni] = val2 > val1 ? [val1, val2] : [val2, val1];
    const hasil = hitungPertumbuhanEkonomi(thIni, thLalu);
    return {
      type: 'calculation',
      badge: 'Hasil Perhitungan Laju PDRB ADHK',
      formula: hasil.rumus,
      data: [
        { label: 'PDRB Tahun Dasar / Lalu', value: thLalu.toLocaleString('id-ID') },
        { label: 'PDRB Tahun Berjalan', value: thIni.toLocaleString('id-ID') },
        { label: 'Selisih Nilai Tambah', value: hasil.selisih.toLocaleString('id-ID') },
        { label: 'Laju Pertumbuhan Ekonomi', value: `${hasil.laju}%` }
      ],
      interpretasi: hasil.interpretasi,
      sumber: 'Metodologi BPS / Panduan Evaluasi Bapperida',
      text: `Berdasarkan data yang dimasukkan, laju pertumbuhan ekonomi adalah **${hasil.laju}%**. Pertumbuhan ini dikategorikan ${hasil.interpretasi}`
    };
  }

  // Check Realisasi Anggaran calculation
  const realisasiRegex = /(?:realisasi|serapan|anggaran).*?(\d+[\.,]?\d*).*?(?:dari|pagu|alokasi).*?(\d+[\.,]?\d*)/i;
  const matchRealisasi = query.match(realisasiRegex);
  if (matchRealisasi && (query.includes('hitung') || query.includes('persen') || query.includes('berapa'))) {
    const rVal = parseFloat(matchRealisasi[1].replace(',', '.'));
    const pVal = parseFloat(matchRealisasi[2].replace(',', '.'));
    const hasil = hitungRealisasiAnggaran(rVal, pVal);
    return {
      type: 'calculation',
      badge: 'Hasil Kalkulasi Serapan Anggaran',
      formula: hasil.rumus,
      data: [
        { label: 'Realisasi Anggaran', value: rVal.toLocaleString('id-ID') },
        { label: 'Pagu DPA/APBD', value: pVal.toLocaleString('id-ID') },
        { label: 'Sisa Pagu Belum Terserap', value: hasil.sisa.toLocaleString('id-ID') },
        { label: 'Persentase Realisasi', value: `${hasil.persen}%` }
      ],
      interpretasi: `${hasil.predikat} — ${hasil.status}`,
      sumber: 'Sistem Informasi Pemerintahan Daerah (SIPD-RI)',
      text: `Persentase realisasi anggaran mencapai **${hasil.persen}%** (${hasil.predikat}). ${hasil.status}`
    };
  }

  return null;
}

function formatGreetingResponse() {
  return {
    type: 'text',
    badge: null,
    text: `Halo! 👋 Saya asisten AI yang punya keahlian mendalam soal Bapperida dan perencanaan daerah — tapi bisa diajak ngobrol apa saja kok.\n\nMau tanya soal kinerja anggaran, rumus indikator, dokumen perencanaan, atau sekadar diskusi santai, langsung aja tanya.`
  };
}

function formatDokumenResponse(doc) {
  return {
    type: 'text',
    badge: null,
    text: `**${doc.nama} (${doc.kode})** itu dokumen perencanaan dengan horizon waktu **${doc.periode}**, dasarnya ${doc.dasarHukum}.\n\n${doc.deskripsi}${doc.tahapan ? '\n\n' + doc.tahapan : ''}\n\n*Merujuk Permendagri 86/2017.*`
  };
}

function formatMusrenbangResponse() {
  return {
    type: 'text',
    badge: null,
    text: `Musrenbang itu alur perencanaan partisipatif dari bawah ke atas, sesuai Permendagri 86/2017. Urutannya:\n\n1. **Musrenbang Desa/Kelurahan (Januari)** — usulan warga dikumpulkan di forum RT/RW/Dusun, lalu disepakati jadi daftar prioritas desa.\n2. **Musrenbang Kecamatan (Februari)** — usulan dari tiap desa diverifikasi dan dirangking berdasarkan plafon indikatif kewilayahan.\n3. **Forum Perangkat Daerah (Feb–Maret)** — OPD teknis memverifikasi usulan dan menyelaraskan dengan Pokir DPRD.\n4. **Musrenbang Kabupaten (Maret)** — Bapperida merangkum semua usulan prioritas ke dalam rancangan RKPD.\n5. **Fasilitasi Provinsi & Penetapan (April–Juni)** — evaluasi Bappeda Provinsi Jabar, lalu ditetapkan dengan Perbup.\n\nAda yang mau ditanyakan lebih lanjut soal salah satu tahapnya?`
  };
}

function formatRegulasiResponse(query) {
  return {
    type: 'text',
    badge: null,
    text: `Regulasi utama yang jadi acuan perencanaan daerah:\n\n` +
      REGULASI_ACUAN.map(r => `• **${r.nomor}** tentang *${r.tentang}* — ${r.poinKunci}`).join('\n') +
      `\n\nAda regulasi spesifik yang mau ditanyakan lebih detail?`
  };
}

function formatTupoksiResponse(query) {
  return {
    type: 'text',
    badge: null,
    text: `**${BAPPERIDA_INFO.nama}** punya tugas pokok membantu Bupati dalam urusan perencanaan pembangunan dan litbang. Pembagian bidangnya:\n\n` +
      BAPPERIDA_INFO.bidang.map(b => `• **${b.nama}** — ${b.tugas}`).join('\n')
  };
}

function formatIndikatorResponse(query) {
  return {
    type: 'text',
    badge: null,
    text: `Indikator makro pembangunan yang umum dipakai Bapperida:\n\n` +
      INDIKATOR_PEMBANGUNAN.map(i => `• **${i.nama}** (${i.satuan}) — \`${i.rumus}\` | Sumber: ${i.sumber}`).join('\n') +
      `\n\nKalau mau hitung salah satu dengan data kamu sendiri, kasih angkanya aja.`
  };
}

function formatFallbackResponse(rawMessage, persona) {
  // More natural fallback — less bureaucratic template
  const hints = [
    `Hmm, untuk pertanyaan ini saya butuh data atau konteks lebih spesifik dari Anda dulu. Bisa ceritakan lebih detail?`,
    `Pertanyaan bagus! Tapi untuk menjawab dengan tepat, kalau ada angka atau datanya bisa langsung Anda ketikkan — nanti saya bantu analisis.`,
    `Kalau Anda menanyakan data aktual/capaian resmi suatu instansi, untuk angkanya perlu cek ke SIPD-RI atau BPS Kabupaten Cirebon ya — saya tidak mau mengarang angka. Tapi kalau mau diskusi atau simulasi skenario, langsung aja!`
  ];
  const isDataQuery = /berapa|capaian|realisasi|angka|data|tahun \d{4}/.test(rawMessage.toLowerCase());
  return {
    type: 'fallback',
    badge: null,
    text: isDataQuery
      ? `Untuk data aktual/capaian resmi, saya tidak bisa mengarang angka — perlu dicek ke sumber resmi seperti **SIPD-RI**, **e-Monev Bapperida**, atau **BPS Kabupaten Cirebon**.\n\nTapi kalau Anda punya angkanya dan mau saya bantu analisis atau hitung, kasih datanya langsung aja! 😊`
      : `Hmm, belum ada konteks/data yang cukup untuk pertanyaan ini. Bisa ceritakan lebih detail atau berikan data yang ingin dianalisis? Saya siap bantu.`
  };
}

// Live LLM caller if API Key provided
async function callExternalLLM(prompt, persona, apiKey) {
  const personaContext = persona === 'warga'
    ? 'Lawan bicara adalah warga umum/masyarakat — gunakan bahasa santai-ramah, hindari jargon teknis berlebihan, fokus pada manfaat nyata yang bisa dirasakan warga.'
    : persona === 'opd'
    ? 'Lawan bicara adalah staf OPD/Perangkat Daerah mitra — boleh lebih teknis, bahas koordinasi RKA, sinkronisasi Renja-RKPD, input SIPD-RI, dan analisis kinerja anggaran.'
    : 'Lawan bicara adalah ASN internal Bapperida/perencana — boleh sepenuhnya teknis, gunakan referensi hukum spesifik, bahas cascading IKU/IKD, tahapan evaluasi Daledang, nomenklatur Permendagri 90/2019.';

  const fullSystemPrompt = `Kamu adalah asisten AI serba-bisa (seperti chatbot AI pada umumnya — bisa ngobrol, menjelaskan, menghitung, membantu menulis, brainstorming, dll), yang KEBETULAN punya keahlian mendalam soal Badan Perencanaan, Penelitian, dan Pengembangan Daerah (Bapperida) Kabupaten Cirebon.

KONTEKS LAWAN BICARA: ${personaContext}

PRINSIP INTERAKSI — WAJIB DIIKUTI:
1. Jawab pertanyaan APAPUN secara wajar seperti chatbot AI biasa — tidak semua pertanyaan harus dikaitkan ke topik Bapperida.
2. Kalau pertanyaannya menyentuh perencanaan daerah, anggaran, RKA, indikator kinerja, dokumen daerah, atau hal-hal Bapperida — di situlah keahlian khususmu berperan.
3. JANGAN kaku pakai format template (poin 1-5, disclaimer panjang, heading besar) untuk SETIAP jawaban. Sesuaikan format: obrolan santai → jawab santai; pertanyaan teknis → boleh terstruktur, tapi tetap ringkas dan enak dibaca.
4. Pertanyaan dengan kata "misal", "seandainya", "contohnya", "menurutmu kalau" → ini ANALISIS/OPINI biasa, JAWAB LANGSUNG, jangan dianggap permintaan data resmi.
5. Disclaimer atau arahan ke sumber resmi HANYA dipakai kalau user memang menanyakan data aktual/riil suatu instansi tanpa memberi angkanya sendiri. Di luar itu, jawab to the point.

KEAHLIAN KHUSUS BAPPERIDA:

[TUPOKSI] Bapperida: perencanaan pembangunan jangka panjang (RPJPD 20 thn), menengah (RPJMD 5 thn), tahunan (RKPD 1 thn); koordinasi lintas OPD; litbang; monitoring-evaluasi; sinkronisasi pusat-daerah.

[DOKUMEN PERENCANAAN] RPJPD, RPJMD, RKPD, Renstra OPD, Renja OPD, KUA-PPAS, Musrenbang (Desa → Kecamatan → Forum OPD → Kabupaten → Provinsi).

[REGULASI] UU 25/2004, UU 23/2014, Permendagri 86/2017, Permendagri 90/2019, Kepmendagri 690.900-327 Tahun 1996.

[RUMUS INDIKATOR]
- Pertumbuhan Ekonomi (PDRB ADHK) = ((PDRB-n − PDRB-n1) / PDRB-n1) × 100%
- IPM = dimensi kesehatan, pendidikan, pengeluaran (metodologi BPS terbaru)
- Realisasi Anggaran (%) = (Realisasi / Pagu) × 100%
- Efektivitas (%) = (Realisasi Output / Target Output) × 100%
  Skala Kepmendagri 690/1996: >100% Sangat Efektif | 90-100% Efektif | 80-<90% Cukup Efektif | 60-<80% Kurang Efektif | <60% Tidak Efektif
- Efisiensi (%) = (Realisasi Anggaran / Pagu) ÷ (Realisasi Output / Target Output) × 100%
  Skala: <60% Sangat Efisien | 60-<80% Efisien | 80-<90% Cukup Efisien | 90-100% Kurang Efisien | >100% Tidak Efisien
- SROI = Total Nilai Manfaat Sosial / Total Investasi; jika proxy finansial belum diberikan user, TANYA BALIK dulu.

[SKENARIO HIPOTETIS] Kalau user memberi angkanya sendiri ("misal RKA-nya 19M, realisasi 78%"), ini BUKAN permintaan data resmi — HITUNG dan ANALISIS langsung menggunakan rumus di atas. Tambahkan catatan singkat bahwa ini analisis skenario, bukan data aktual, tapi catatan itu hanya pelengkap — BUKAN alasan untuk menolak menjawab.

[DIAGNOSIS PERMASALAHAN] Kenali dan kategorikan: (1) Perencanaan & Sinkronisasi Dokumen, (2) Data & Pelaporan, (3) Anggaran & Kinerja RKA/DPA, (4) Koordinasi Lintas OPD, (5) Layanan Masyarakat & Musrenbang, (6) Regulasi & Kepatuhan. Jelaskan penyebab umum secara edukatif (bukan menuduh), arahkan ke pihak berwenang yang tepat.

[BATASAN] Jangan memberi opini politik atau menilai kebijakan kepala daerah secara subjektif. Dugaan korupsi/sengketa hukum → arahkan ke Inspektorat atau SP4N-LAPOR!, jangan berspekulasi. Jangan mengarang angka aktual yang tidak diberikan user.`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest'];

  for (const modelName of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${fullSystemPrompt}\n\nPertanyaan Pengguna:\n${prompt}` }] }
          ]
        })
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
          return {
            type: 'ai_live',
            badge: `Gemini AI (${modelName})`,
            text: json.candidates[0].content.parts[0].text
          };
        }
      }
    } catch (err) {
      console.warn(`Model ${modelName} fetch failed, checking fallback:`, err);
    }
  }

  return null;
}
