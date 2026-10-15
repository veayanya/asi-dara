// Knowledge Base Resmi Bapperida Kabupaten Cirebon
export const BAPPERIDA_INFO = {
  nama: 'Bapperida Kabupaten Cirebon',
  kepanjangan: 'Badan Perencanaan Pembangunan, Penelitian dan Pengembangan Daerah Kabupaten Cirebon',
  alamat: 'Jl. Sunan Kalijaga No. 10, Sumber, Kec. Sumber, Kabupaten Cirebon, Jawa Barat 45611',
  moto: 'Perencanaan Akurat, Pembangunan Berkelanjutan, Cirebon Maju & Sejahtera',
  kontak: {
    telepon: '(0231) 321xxx',
    email: 'bapperida@cirebonkab.go.id',
    website: 'https://bapperida.cirebonkab.go.id',
    sipd: 'https://cirebonkab.sipd.kemendagri.go.id',
    pengaduan: 'SP4N-LAPOR! / Layanan Cirebon Katon'
  },
  bidang: [
    {
      id: 'sekretariat',
      nama: 'Sekretariat',
      tugas: 'Pengelolaan administrasi umum, keuangan, kepegawaian, dan perencanaan internal badan.'
    },
    {
      id: 'ppm',
      nama: 'Bidang Perencanaan Pemerintahan & Pembangunan Manusia (PPM)',
      tugas: 'Koordinasi urusan pendidikan, kesehatan, sosial, ketenagakerjaan, ketentraman dan ketertiban, serta reformasi birokrasi daerah.'
    },
    {
      id: 'perekon',
      nama: 'Bidang Perekonomian & Sumber Daya Alam (PSDA)',
      tugas: 'Perencanaan sektor pertanian, pariwisata, perdagangan, perindustrian, koperasi/UMKM, ketahanan pangan, dan lingkungan hidup.'
    },
    {
      id: 'infra',
      nama: 'Bidang Infrastruktur & Kewilayahan',
      tugas: 'Perencanaan tata ruang daerah, perumahan permukiman, jalan & jembatan, sumber daya air, transportasi, dan drainase.'
    },
    {
      id: 'litbang',
      nama: 'Bidang Penelitian dan Pengembangan (Litbang) & Inovasi',
      tugas: 'Kajian kebijakan pembangunan daerah, fasilitasi inovasi daerah (IGA), evaluasi indeks daya saing daerah, dan publikasi kelitbangan.'
    },
    {
      id: 'dal-eval',
      nama: 'Bidang Pengendalian, Evaluasi & Data Informasi Pembangunan (Daledang)',
      tugas: 'Monitoring dan evaluasi berkala pelaksanaan RKPD/Renja OPD, integrasi Satu Data Cirebon, pengelolaan SIPD-RI, dan pelaporan LKPJ/LPPD.'
    }
  ]
};

export const DOKUMEN_PERENCANAAN = [
  {
    kode: 'RPJPD',
    nama: 'Rencana Pembangunan Jangka Panjang Daerah',
    periode: '20 Tahun (mis. 2025–2045)',
    dasarHukum: 'UU No. 25/2004, Permendagri No. 86/2017, Perda Kabupaten Cirebon',
    deskripsi: 'Penjabaran visi, misi, arah kebijakan, dan sasaran pokok pembangunan daerah jangka panjang yang berpedoman pada RPJPN dan RTRW.',
    tahapan: 'Penyusunan rancangan awal -> Konsultasi publik -> Musrenbang RPJPD -> Perumusan rancangan akhir -> Evaluasi Gubernur -> Penetapan Perda.'
  },
  {
    kode: 'RPJMD',
    nama: 'Rencana Pembangunan Jangka Menengah Daerah',
    periode: '5 Tahun (Periode Kepala Daerah)',
    dasarHukum: 'UU No. 23/2014, Permendagri No. 86/2017',
    deskripsi: 'Penjabaran visi, misi, dan program kepala daerah yang memuat tujuan, sasaran, strategi, arah kebijakan pembangunan dan keuangan daerah, serta program Perangkat Daerah disertai kerangka pendanaan bersifat indikatif.',
    tahapan: 'Disusun paling lambat 6 bulan setelah pelantikan Kepala Daerah terpilih, melibatkan seluruh OPD dan pemangku kepentingan.'
  },
  {
    kode: 'RKPD',
    nama: 'Rencana Kerja Pemerintah Daerah',
    periode: '1 Tahun (Rencana Tahunan)',
    dasarHukum: 'Permendagri No. 86/2017, Permendagri pedoman RKPD tahun berjalan',
    deskripsi: 'Dokumen perencanaan tahunan yang merupakan penjabaran dari RPJMD, memuat rancangan kerangka ekonomi daerah, prioritas pembangunan daerah, serta rencana kerja dan pendanaan untuk jangka waktu 1 tahun.',
    tahapan: 'Ranwal RKPD -> Musrenbang (Desa/Kelurahan -> Kecamatan -> Forum OPD -> Musrenbang Kabupaten) -> Rancangan Akhir -> Fasilitasi Bappeda Provinsi -> Perbup Penetapan RKPD.'
  },
  {
    kode: 'RENSTRA-OPD',
    nama: 'Rencana Strategis Perangkat Daerah',
    periode: '5 Tahun',
    dasarHukum: 'Permendagri No. 86/2017',
    deskripsi: 'Dokumen perencanaan teknis dinas/badan/kantor untuk periode 5 tahun yang mengacu pada RPJMD, memuat tujuan, sasaran, program, dan kegiatan OPD bersangkutan.'
  },
  {
    kode: 'RENJA-OPD',
    nama: 'Rencana Kerja Perangkat Daerah',
    periode: '1 Tahun',
    dasarHukum: 'Permendagri No. 86/2017, Permendagri No. 90/2019',
    deskripsi: 'Dokumen perencanaan tahunan perangkat daerah yang mengacu pada Renstra OPD dan RKPD, memuat program, kegiatan, sub-kegiatan, indikator kinerja, dan pagu indikatif.'
  },
  {
    kode: 'KUA-PPAS',
    nama: 'Kebijakan Umum Anggaran & Prioritas Plafon Anggaran Sementara',
    periode: '1 Tahun Anggaran (Jembatan RKPD ke APBD)',
    dasarHukum: 'PP No. 12/2019, Permendagri No. 77/2020',
    deskripsi: 'Dokumen kebijakan anggaran hasil kesepakatan Kepala Daerah bersama DPRD yang memuat asumsi makro ekonomi, kebijakan pendapatan, belanja, dan pembiayaan daerah serta plafon anggaran per OPD.'
  },
  {
    kode: 'KLHS',
    nama: 'Kajian Lingkungan Hidup Strategis',
    periode: 'Menyesuaikan dokumen (RPJMD/RPJPD/RTRW)',
    dasarHukum: 'UU No. 32/2009, PP No. 46/2016, Permendagri No. 7/2018',
    deskripsi: 'Analisis sistematis, menyeluruh, dan partisipatif yang menjadi dasar untuk memastikan bahwa prinsip pembangunan berkelanjutan telah menjadi dasar dan terintegrasi dalam pembangunan wilayah.'
  }
];

export const REGULASI_ACUAN = [
  {
    nomor: 'UU No. 25 Tahun 2004',
    tentang: 'Sistem Perencanaan Pembangunan Nasional (SPPN)',
    poinKunci: 'Landasan hukum 5 pendekatan perencanaan: politik, teknokratik, partisipatif, atas-bawah (top-down), dan bawah-atas (bottom-up).'
  },
  {
    nomor: 'UU No. 23 Tahun 2014',
    tentang: 'Pemerintahan Daerah',
    poinKunci: 'Pembagian kewenangan pusat-daerah, urusan wajib pelayanan dasar, urusan pilihan, dan tanggung jawab kepala daerah dalam perencanaan.'
  },
  {
    nomor: 'Permendagri No. 86 Tahun 2017',
    tentang: 'Tata Cara Perencanaan, Pengendalian dan Evaluasi Pembangunan Daerah, Tata Cara Evaluasi Rancangan Perda RPJPD/RPJMD serta RKPD',
    poinKunci: 'Kitab suci perencana Bapperida; mengatur format, tahapan, metodologi pohon masalah/sasaran, IKU, dan jadwal siklus perencanaan.'
  },
  {
    nomor: 'Permendagri No. 90 Tahun 2019 & Kepmendagri 050/5889/2021',
    tentang: 'Klasifikasi, Kodefikasi, dan Nomenklatur Perencanaan Pembangunan dan Keuangan Daerah',
    poinKunci: 'Standarisasi kode program, kegiatan, dan sub-kegiatan di seluruh Indonesia yang diinput pada SIPD-RI.'
  },
  {
    nomor: 'Kepmendagri No. 690.900-327 Tahun 1996',
    tentang: 'Pedoman Penilaian Kinerja Keuangan Daerah',
    poinKunci: 'Standar skala rasio pengukuran Efektivitas (>100% Sangat Efektif, 90-100% Efektif, 80-<90% Cukup Efektif, 60-<80% Kurang Efektif, <60% Tidak Efektif) dan Efisiensi (<60% Sangat Efisien, 60-80% Efisien, 80-90% Cukup Efisien, 90-100% Kurang Efisien, >100% Tidak Efisien).'
  },
  {
    nomor: 'Perpres No. 39 Tahun 2019',
    tentang: 'Satu Data Indonesia',
    poinKunci: 'Standar data, metadata, interoperabilitas data, dan peran Bapperida sebagai Koordinator Forum Satu Data Daerah.'
  }
];

export const INDIKATOR_PEMBANGUNAN = [
  {
    id: 'pdrb-adhk',
    nama: 'Pertumbuhan Ekonomi (PDRB ADHK)',
    satuan: '% (Persen)',
    rumus: '((PDRB ADHK th_n - PDRB ADHK th_n-1) / PDRB ADHK th_n-1) * 100%',
    sumber: 'Badan Pusat Statistik (BPS) Kabupaten Cirebon',
    keterangan: 'Mengukur pertambahan nilai tambah barang dan jasa atas dasar harga konstan untuk menghilangkan pengaruh inflasi.'
  },
  {
    id: 'efektivitas-anggaran',
    nama: 'Efektivitas Kinerja Anggaran (Kepmendagri 690/1996)',
    satuan: '% (Persen)',
    rumus: '(Realisasi Output/Outcome / Target Output/Outcome) * 100%',
    sumber: 'Laporan Kinerja / DPA-RKA OPD',
    keterangan: 'Mengukur ketercapaian target output/outcome fisik atau kinerja program.'
  },
  {
    id: 'efisiensi-anggaran',
    nama: 'Efisiensi Anggaran (Kepmendagri 690/1996)',
    satuan: '% (Persen)',
    rumus: '((Realisasi Anggaran / Pagu Anggaran) / (Realisasi Output / Target Output)) * 100%',
    sumber: 'RKA / DPA / SIPD Akuntansi',
    keterangan: 'Rasio antara serapan anggaran dengan pencapaian output. Semakin kecil persentase (<60%), semakin efisien.'
  },
  {
    id: 'sroi',
    nama: 'Social Return on Investment (SROI)',
    satuan: 'Rasio (Nilai)',
    rumus: 'SROI Ratio = Total Nilai Manfaat Sosial Bersih / Total Nilai Investasi (Input)',
    sumber: 'Kajian Litbang Bapperida / Studi Dampak Sosial',
    keterangan: 'Mengukur nilai dampak sosial per rupiah investasi program. SROI > 1 berarti bernilai sosial positif.'
  },
  {
    id: 'realisasi-anggaran',
    nama: 'Persentase Realisasi Anggaran',
    satuan: '% (Persen)',
    rumus: '(Realisasi Belanja / Pagu Anggaran) * 100%',
    sumber: 'BPKAD / Bapperida / SIPD Penatausahaan Keuangan',
    keterangan: 'Tingkat serapan belanja program/kegiatan terhadap pagu alokasi yang disahkan dalam DPA.'
  },
  {
    id: 'ipm',
    nama: 'Indeks Pembangunan Manusia (IPM)',
    satuan: 'Poin Indeks (0 - 100)',
    rumus: 'Rata-rata Geometrik dari: Indeks Kesehatan (UHH), Indeks Pendidikan (HLS & RLS), dan Indeks Pengeluaran (Pengeluaran riil per kapita disesuaikan)',
    sumber: 'BPS',
    keterangan: 'Status capaian: Rendah (<60), Sedang (60-69,9), Tinggi (70-79,9), Sangat Tinggi (>=80).'
  },
  {
    id: 'kemiskinan',
    nama: 'Tingkat Kemiskinan (P0)',
    satuan: '% (Persen)',
    rumus: '(Jumlah Penduduk di Bawah Garis Kemiskinan / Jumlah Total Penduduk) * 100%',
    sumber: 'BPS (Survei Sosial Ekonomi Nasional / Susenas)',
    keterangan: 'Persentase penduduk yang memiliki rata-rata pengeluaran per kapita per bulan di bawah Garis Kemiskinan (GK).'
  },
  {
    id: 'tpt',
    nama: 'Tingkat Pengangguran Terbuka (TPT)',
    satuan: '% (Persen)',
    rumus: '(Jumlah Penganggur / Total Angkatan Kerja) * 100%',
    sumber: 'BPS (Survei Angkatan Kerja Nasional / Sakernas)',
    keterangan: 'Persentase angkatan kerja yang aktif mencari pekerjaan atau mempersiapkan usaha baru.'
  }
];

export const TAHAPAN_MUSRENBANG = [
  {
    tahap: 1,
    nama: 'Musrenbang Desa / Kelurahan',
    waktu: 'Januari',
    fokus: 'Menjaring aspirasi masyarakat tingkat RT/RW/Dusun, menyusun Daftar Usulan RKP Desa untuk dibawa ke kecamatan.'
  },
  {
    tahap: 2,
    nama: 'Musrenbang Tingkat Kecamatan',
    waktu: 'Februari',
    fokus: 'Membahas dan menyepakati usulan desa/kelurahan yang menjadi prioritas pembangunan kecamatan, diverifikasi awal di SIPD.'
  },
  {
    tahap: 3,
    nama: 'Forum Perangkat Daerah (Forum OPD)',
    waktu: 'Februari - Awal Maret',
    fokus: 'Sinkronisasi usulan prioritas kecamatan dan pokok-pokok pikiran (Pokir) DPRD dengan rancangan Renja OPD terkait.'
  },
  {
    tahap: 4,
    nama: 'Musrenbang RKPD Kabupaten Cirebon',
    waktu: 'Maret',
    fokus: 'Penyepakatan prioritas program pembangunan tingkat kabupaten, penajaman IKD, dan komitmen bersama seluruh stakeholder.'
  },
  {
    tahap: 5,
    nama: 'Fasilitasi Provinsi & Penetapan Perbup RKPD',
    waktu: 'April - Juni',
    fokus: 'Penyelarasan RKPD Kabupaten dengan RKPD Provinsi Jawa Barat dan RKP Nasional, lalu ditetapkan melalui Peraturan Bupati.'
  }
];

// MODUL 5: DIAGNOSIS PERMASALAHAN BAPPERIDA (6 KATEGORI MASALAH)
export const KATEGORI_MASALAH_BAPPERIDA = [
  {
    id: 'sinkronisasi',
    nomor: 1,
    nama: 'Perencanaan & Sinkronisasi Dokumen',
    gejala: [
      'RKPD tidak sinkron dengan RPJMD atau Renstra OPD',
      'Usulan Musrenbang kecamatan tidak terakomodir di RKPD atau APBD',
      'Program atau subkegiatan OPD tidak sesuai nomenklatur Permendagri 90/2019',
      'Tumpang tindih sub-kegiatan antar-OPD'
    ],
    akarMasalah: 'Belum optimalnya cascading sasaran pada Renja rancangan awal, keterbatasan plafon indikatif kewilayahan (PIK), atau perubahan prioritas mendesak.',
    tujuanArah: 'Bidang Perencanaan teknis (PPM / PSDA / Infrastruktur) Bapperida Kabupaten Cirebon',
    langkahAdministratif: 'Ajukan permohonan desk reviu Renja OPD, lakukan pemetaan cross-cutting urusan pada SIPD-RI, dan bawa ke Forum OPD atau Pra-Musrenbang.',
    dasarHukum: 'Permendagri No. 86/2017 Pasal 121 (Penyelarasan Renja dengan RKPD)'
  },
  {
    id: 'data-pelaporan',
    nomor: 2,
    nama: 'Data & Pelaporan Pembangunan',
    gejala: [
      'Data capaian OPD telat diinput pada SIPD-RI atau e-Monev',
      'Data statistik sektoral tidak konsisten (perbedaan angka antara BPS, Dinas, dan Bapperida)',
      'Capaian indikator IKU tidak dapat diverifikasi karena tidak ada data dasar (baseline)'
    ],
    akarMasalah: 'Belum seragamnya metadata data sektoral, produsen data di OPD belum terintegrasi ke Forum Satu Data, atau kendala server/jaringan SIPD.',
    tujuanArah: 'Bidang Pengendalian, Evaluasi & Data Informasi (Daledang) / Forum Satu Data Cirebon',
    langkahAdministratif: 'Koordinasikan dengan Walidata Daerah (Diskominfo) dan Pembina Data (BPS) melalui forum koordinasi Satu Data Indonesia tingkat Kabupaten.',
    dasarHukum: 'Perpres No. 39/2019 tentang Satu Data Indonesia & Permendagri No. 70/2019'
  },
  {
    id: 'anggaran-kinerja',
    nomor: 3,
    nama: 'Anggaran & Kinerja (RKA/DPA)',
    gejala: [
      'Realisasi belanja rendah padahal pagu anggaran tinggi (serapan lambat)',
      'Target indikator kinerja tidak realistis atau tidak terukur (tidak memenuhi kriteria SMART)',
      'Refocusing / pergeseran anggaran tidak sejalan dengan prioritas RKPD'
    ],
    akarMasalah: 'Keterlambatan proses lelang pengadaan (PBJ), kendala juknis DAK dari kementerian pusat, atau perencanaan kas (anggaran kas) yang tidak presisi.',
    tujuanArah: 'Bidang Perencanaan Anggaran, TAPD, atau BPKAD. Jika ada indikasi penyimpangan arahkan ke Inspektorat.',
    langkahAdministratif: 'Lakukan percepatan administrasi tagihan kontraktual, evaluasi kurva S kegiatan, dan ajukan penyesuaian target pada Perubahan APBD.',
    dasarHukum: 'PP No. 12/2019 tentang Pengelolaan Keuangan Daerah & Kepmendagri 690.900-327/1996'
  },
  {
    id: 'koordinasi-opd',
    nomor: 4,
    nama: 'Koordinasi Lintas OPD & Lintas Level',
    gejala: [
      'OPD tidak hadir atau tidak responsif saat tahapan konsultasi perencanaan',
      'Program pemerintah pusat (DAK / Dekonsentrasi) tidak sinkron dengan prioritas daerah',
      'Konflik kewenangan penanganan aset atau batas urusan (Desa vs Kabupaten vs Provinsi)'
    ],
    akarMasalah: 'Miskomunikasi jadwal siklus perencanaan, tumpang tindih regulasi urusan konkuren UU 23/2014, atau belum adanya SOP bersama penanganan lintas sektor.',
    tujuanArah: 'Sekretariat Bapperida / Tim Anggaran Pemerintah Daerah (TAPD) / Bagian Administrasi Pemerintahan Setda',
    langkahAdministratif: 'Fasilitasi rapat koordinasi desk pimpinan daerah yang dipimpin oleh Sekretaris Daerah, susun Berita Acara kesepakatan kewenangan.',
    dasarHukum: 'UU No. 23/2014 tentang Pemerintahan Daerah Pasal 9-18 (Klasifikasi Urusan Pemerintahan)'
  },
  {
    id: 'layanan-masyarakat',
    nomor: 5,
    nama: 'Layanan ke Masyarakat & Transparansi Publik',
    gejala: [
      'Aspirasi masyarakat di Musrenbang tidak terealisasi bertahun-tahun',
      'Warga bingung mengenai syarat dan alur pengusulan pembangunan',
      'Permintaan data dan dokumen perencanaan publik (RPJMD/RKPD) yang belum terakses'
    ],
    akarMasalah: 'Kapasitas fiskal APBD terbatas sehingga diterapkan sistem prioritas mendesak (skala prioritas), atau usulan tidak memenuhi syarat teknis proposal.',
    tujuanArah: 'Pejabat Pengelola Informasi & Dokumentasi (PPID) Bapperida / Layanan SP4N-LAPOR Cirebon Katon',
    langkahAdministratif: 'Berikan penjelasan transparan terkait status usulan di SIPD, bantu warga melengkapi proposal teknis (foto titik lokasi & RAB) untuk tahun anggaran berikutnya.',
    dasarHukum: 'UU No. 14/2008 tentang Keterbukaan Informasi Publik'
  },
  {
    id: 'regulasi-kepatuhan',
    nomor: 6,
    nama: 'Regulasi & Kepatuhan Hukum Perencanaan',
    gejala: [
      'Dokumen perencanaan daerah belum disesuaikan dengan perubahan regulasi nasional',
      'RPJMD / RKPD belum direvisi meskipun ada perubahan Proyek Strategis Nasional (PSN) di wilayah Cirebon'
    ],
    akarMasalah: 'Dinamika kebijakan nasional yang cepat, proses evaluasi regulasi daerah yang memerlukan waktu harmonisasi dengan Kanwil Kemenkumham dan Provinsi.',
    tujuanArah: 'Bagian Hukum Setda dan Bidang Perencanaan Makro Bapperida Kabupaten Cirebon',
    langkahAdministratif: 'Konsultasikan ke Ditjen Bina Pembangunan Daerah Kemendagri / Bappenas, lakukan kajian perubahan RPJMD sesuai syarat Permendagri 86/2017 Pasal 342.',
    dasarHukum: 'Permendagri No. 86/2017 Bab IX (Perubahan RPJPD, RPJMD, dan RKPD)'
  }
];

export const SYSTEM_PROMPT_TEMPLATE = `# SYSTEM PROMPT — CHATBOT BAPPERIDA KABUPATEN CIREBON

## 1. IDENTITAS & PERAN
Kamu adalah asisten virtual resmi Badan Perencanaan, Penelitian, dan Pengembangan Daerah (Bapperida) Kabupaten Cirebon. Tugasmu membantu ASN internal, OPD mitra, dan masyarakat memahami dokumen perencanaan, indikator pembangunan, evaluasi kinerja anggaran RKA, serta diagnosis awal permasalahan tugas perencanaan daerah.

Peran Utama:
- Pusat informasi tugas pokok dan fungsi (tupoksi) Bapperida
- Asisten pemahaman dokumen perencanaan (RPJPD, RPJMD, RKPD, Renstra, Renja, KUA-PPAS)
- Kalkulator/penjelas rumus indikator pembangunan dan kinerja anggaran
- Pusat diagnosis awal permasalahan yang berkaitan dengan tugas Bapperida
- Penghubung informasi lintas bidang di Bapperida

## 2. MODUL ANALISIS KINERJA ANGGARAN (RKA)
- Efektivitas (%) = (Realisasi Output/Outcome / Target Output/Outcome) × 100% (Skala Kepmendagri 690.900-327/1996)
- Efisiensi (%) = (Realisasi Anggaran / Pagu Anggaran) : (Realisasi Output / Target Output) × 100%
- SROI Ratio = Total Nilai Manfaat Sosial / Total Nilai Investasi (Input)
- Format Jawaban: Rumus, Data, Langkah perhitungan, Hasil akhir & interpretasi, Catatan/disclaimer.

## 3. MODUL DIAGNOSIS PERMASALAHAN BAPPERIDA (6 KATEGORI)
1. Perencanaan & Sinkronisasi Dokumen
2. Data & Pelaporan (SIPD & Satu Data)
3. Anggaran & Kinerja (RKA/DPA)
4. Koordinasi Lintas OPD/Level
5. Layanan Masyarakat & Musrenbang
6. Regulasi & Kepatuhan Hukum

Format Diagnosis: Ringkasan masalah -> Kategori -> Kemungkinan akar penyebab -> Rekomendasi langkah/pihak berwenang -> Dasar hukum.

## 4. ATURAN SUMBER DATA (KASUS 1 vs KASUS 2)
- Kasus 1 (Permintaan Data Riil): User menanyakan data resmi tanpa memberi angka sendiri (misal "berapa realisasi dinas X 2025?"). JANGAN MENGARANG ANGKA! Nyatakan data belum tersedia di konteks dan sarankan cek ke SIPD-RI atau BPS Kabupaten Cirebon.
- Kasus 2 (Skenario Hipotesis/Contoh/Simulasi): User memberikan angkanya sendiri dengan kata "misal", "seandainya", "contohnya", "kalau ada", "menurutmu gimana kalau..." (contoh: "misal ada OPD yang RKA-nya 19M dan realisasinya 78%, menurutmu gimana?"). WAJIB DIJAWAB LANGSUNG! Hitung dan analisis berdasarkan rumus/skala kinerja (efektivitas, efisiensi, realisasi). JANGAN PERNAH menolak atau melempar ke SIPD/BPS jika user sudah memberikan angkanya sendiri dalam skenario simulasi. Tambahkan catatan bahwa ini analisis atas skenario/contoh, bukan klaim data aktual.`;
