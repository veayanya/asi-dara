<!--
  BantuanPertanyaan.vue — halaman "Bantuan & Pertanyaan" ASI DARA (Bapperida Kab. Cirebon)

  Pola tampilan mengikuti pusat bantuan Google: header + pencarian besar, tab, banner
  peringatan, artikel (kiri) dengan akordeon langkah, dan daftar artikel populer (kanan).
  Warna & font memakai token global di assets/style.css (--primary-color, --info-color, dst.)
  sehingga tema terang/gelap ikut bekerja. Tidak butuh dependensi tambahan.

  Pemakaian (App.vue, section tab 'faq'):
    <BantuanPertanyaan @navigate="currentTab = $event" />

  Event:
    navigate(tabId) → minta App pindah menu: 'dashboard' | 'analyzer' | 'agentic-ai' |
                      'history' | 'report' (id yang sama dengan currentTab di App.vue).
-->
<template>
  <div>
  <PageHero icon="help-circle" title="Bantuan &amp; Pertanyaan" subtitle="Cari jawaban atau kirim laporan" style="margin-bottom: 16px;" />
  <div class="bp">
    <!-- ══ HEADER + PENCARIAN ══════════════════════════════════════════ -->
    <header class="bp-head">

      <div ref="searchWrap" class="bp-search">
        <div class="bp-search-box">
          <Ico name="search" :size="22" class="bp-search-ico" />
          <input
            v-model="query"
            type="search"
            class="bp-search-input"
            placeholder="Cari bantuan..."
            aria-label="Cari topik bantuan"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            aria-controls="bp-results"
            :aria-expanded="showResults ? 'true' : 'false'"
            :aria-activedescendant="hi >= 0 ? 'bp-opt-' + hi : undefined"
            @input="onSearchInput"
            @focus="resultsOpen = query.trim().length >= 2"
            @keydown.down.prevent="moveHi(1)"
            @keydown.up.prevent="moveHi(-1)"
            @keydown.enter.prevent="pickHighlighted"
            @keydown.esc="resultsOpen = false"
          />
          <button v-if="query" type="button" class="bp-icon-btn bp-search-clear" aria-label="Hapus pencarian" @click="clearSearch">
            <Ico name="x" :size="20" />
          </button>
        </div>

        <div v-if="showResults" id="bp-results" class="bp-results">
          <ul v-if="results.length" role="listbox" aria-label="Hasil pencarian">
            <li
              v-for="(r, i) in results"
              :id="'bp-opt-' + i"
              :key="r.a.id"
              role="option"
              class="bp-res"
              :class="{ 'is-hi': hi === i }"
              :aria-selected="hi === i"
              @mousedown.prevent="pick(r)"
              @mousemove="hi = i"
            >
              <Ico name="file" :size="20" class="bp-res-ico" />
              <div class="bp-res-text">
                <div class="bp-res-title">{{ r.a.sidebar }}</div>
                <div class="bp-res-desc">{{ r.snippet }}</div>
              </div>
            </li>
          </ul>
          <div v-else class="bp-noresult">
            <p class="bp-noresult-title">Tidak ada topik yang cocok dengan “{{ query.trim() }}”</p>
            <p class="bp-noresult-text">Coba kata kunci yang lebih singkat, misalnya “unggah”, “edit”, atau “menu nonaktif”. Jika masalah Anda belum terjawab, kirim laporan ke admin.</p>
            <button type="button" class="bp-btn bp-btn-primary" @mousedown.prevent="go('report')">Kirim laporan</button>
          </div>
        </div>
      </div>
    </header>

    <!-- ══ TAB + NOTIFIKASI ════════════════════════════════════════════ -->
    <div class="bp-navrow">
      <nav class="bp-tabs" role="tablist" aria-label="Bagian bantuan">
        <button
          v-for="(t, i) in TABS"
          :id="'bp-tab-' + t.id"
          :key="t.id"
          type="button"
          role="tab"
          class="bp-tab"
          :class="{ 'is-active': activeTab === t.id }"
          :aria-selected="activeTab === t.id"
          :aria-controls="'bp-panel-' + t.id"
          :tabindex="activeTab === t.id ? 0 : -1"
          @click="activeTab = t.id"
          @keydown="onTabKey($event, i)"
        >
          {{ t.label }}
        </button>
      </nav>

    </div>

    <!-- ══ PANEL: PUSAT BANTUAN ════════════════════════════════════════ -->
    <section v-if="activeTab === 'pusat'" id="bp-panel-pusat" role="tabpanel" aria-labelledby="bp-tab-pusat" class="bp-panel">
      <div class="bp-grid">
        <div class="bp-main">
      <!-- Banner peringatan sistem -->
      <div v-if="bannerVisible" class="bp-banner" role="status">
        <Ico name="alert" :size="24" class="bp-banner-ico" />
        <p class="bp-banner-text">{{ BANNER.text }}</p>
        <button type="button" class="bp-banner-link" @click="openArticle(BANNER.article)">{{ BANNER.linkLabel }}</button>
        <button type="button" class="bp-icon-btn bp-banner-x" aria-label="Tutup pemberitahuan" @click="bannerVisible = false">
          <Ico name="x" :size="20" />
        </button>
      </div>

        <!-- Artikel yang sedang dibuka -->
        <article ref="articleEl" class="bp-article" aria-labelledby="bp-article-title" @click="onArticleClick">
          <h2 id="bp-article-title" class="bp-h1">{{ article.title }}</h2>

          <p v-for="(p, i) in article.intro" :key="'i' + i" class="bp-p" v-html="fmt(p)"></p>

          <p v-if="article.note" class="bp-p">
            <strong>Penting:</strong>{{ ' ' }}<span v-html="fmt(article.note.text)"></span>
            <template v-if="article.note.link">{{ ' ' }}<a href="#" class="bp-link" @click.prevent="openArticle(article.note.link.article)">{{ article.note.link.label }}</a>.</template>
          </p>

          <div class="bp-acc">
            <div v-for="(s, i) in article.sections" :key="article.id + i" class="bp-acc-item">
              <h3 class="bp-acc-h">
                <button
                  :id="'bp-acc-btn-' + i"
                  type="button"
                  class="bp-acc-btn"
                  :aria-expanded="isOpen(i) ? 'true' : 'false'"
                  :aria-controls="'bp-acc-panel-' + i"
                  @click="toggle(i)"
                >
                  <span>{{ s.title }}</span>
                  <Ico name="chevron" :size="24" class="bp-acc-chev" :class="{ 'is-open': isOpen(i) }" />
                </button>
              </h3>
              <div
                :id="'bp-acc-panel-' + i"
                class="bp-acc-panel"
                :class="{ 'is-open': isOpen(i) }"
                role="region"
                :aria-labelledby="'bp-acc-btn-' + i"
              >
                <div class="bp-acc-inner">
                  <div class="bp-acc-body">
                    <p v-for="(b, j) in s.body || []" :key="'b' + j" class="bp-p" v-html="fmt(b)"></p>
                    <ol v-if="s.steps" class="bp-steps">
                      <li v-for="(st, j) in s.steps" :key="'s' + j" v-html="fmt(st)"></li>
                    </ol>
                    <ul v-if="s.bullets" class="bp-bullets">
                      <li v-for="(bl, j) in s.bullets" :key="'l' + j" v-html="fmt(bl)"></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="bp-article-foot">
            <div v-if="article.actions?.length" class="bp-actions">
              <button
                v-for="(ac, i) in article.actions"
                :key="ac.label"
                type="button"
                class="bp-btn"
                :class="i === 0 ? 'bp-btn-primary' : 'bp-btn-ghost'"
                @click="go(ac.tab)"
              >
                {{ ac.label }}
              </button>
            </div>
            <p class="bp-foot-help">
              Masalah Anda belum terjawab?
              <a href="#" class="bp-link" @click.prevent="go('report')">Kirim laporan ke admin</a>.
            </p>
          </footer>
        </article>
        </div>

        <!-- Sidebar: artikel populer -->
        <aside class="bp-side" aria-labelledby="bp-side-title">
          <h2 id="bp-side-title" class="bp-side-h">Artikel populer</h2>
          <ul class="bp-side-list">
            <li v-for="a in ARTICLES" :key="a.id">
              <a
                href="#"
                class="bp-side-link"
                :class="{ 'is-current': a.id === articleId }"
                :aria-current="a.id === articleId ? 'page' : undefined"
                @click.prevent="openArticle(a.id)"
              >
                <Ico name="file" :size="24" class="bp-side-ico" />
                <span>{{ a.sidebar }}</span>
              </a>
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <!-- ══ PANEL: KOMUNITAS / FORUM ════════════════════════════════════ -->
    <section v-else-if="activeTab === 'forum'" id="bp-panel-forum" role="tabpanel" aria-labelledby="bp-tab-forum" class="bp-panel bp-simple">
      <h2 class="bp-h1">Forum diskusi belum tersedia</h2>
      <p class="bp-p">
        Sampai forum dibuka, sampaikan pertanyaan, kendala, atau saran Anda lewat menu <strong>Laporan</strong>. Laporan langsung masuk ke aplikasi admin dan ditindaklanjuti lewat WhatsApp atau email yang Anda isi.
      </p>
      <dl class="bp-defs">
        <div v-for="c in REPORT_KINDS" :key="c.name" class="bp-def">
          <dt>{{ c.name }}</dt>
          <dd>{{ c.desc }}</dd>
        </div>
      </dl>
      <div class="bp-actions">
        <button type="button" class="bp-btn bp-btn-primary" @click="go('report')">Buka formulir Laporan</button>
        <button type="button" class="bp-btn bp-btn-ghost" @click="activeTab = 'pusat'">Kembali ke Pusat Bantuan</button>
      </div>
    </section>

    <!-- ══ PANEL: PANDUAN MULAI ════════════════════════════════════════ -->
    <section v-else id="bp-panel-panduan" role="tabpanel" aria-labelledby="bp-tab-panduan" class="bp-panel bp-simple">
      <h2 class="bp-h1">Panduan mulai</h2>
      <p class="bp-p">Empat langkah dari dokumen RKA sampai laporan hasil analisis.</p>
      <ol class="bp-quick">
        <li v-for="(q, i) in QUICK" :key="q.title" class="bp-quick-item">
          <span class="bp-quick-n" aria-hidden="true">{{ i + 1 }}</span>
          <div class="bp-quick-text">
            <h3 class="bp-quick-title">{{ q.title }}</h3>
            <p class="bp-quick-desc">{{ q.desc }}</p>
          </div>
          <div class="bp-quick-cta">
            <button v-if="q.tab" type="button" class="bp-btn bp-btn-ghost" @click="go(q.tab)">{{ q.cta }}</button>
            <button v-else type="button" class="bp-btn bp-btn-ghost" @click="openArticle(q.article)">{{ q.cta }}</button>
          </div>
        </li>
      </ol>
    </section>
  </div>
  </div>
</template>

<script setup>
import { h, ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import PageHero from './PageHero.vue';

const emit = defineEmits(['navigate']);
const go = (tab) => emit('navigate', tab);

/* ── Ikon inline (tanpa dependensi; gaya garis 24px) ─────────────────── */
const ICONS = {
  search: [['circle', { cx: 11, cy: 11, r: 7.5 }], ['path', { d: 'm21 21-4.3-4.3' }]],
  bell: [['path', { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }], ['path', { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }]],
  x: [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]],
  alert: [['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }], ['path', { d: 'M12 9v4' }], ['path', { d: 'M12 17h.01' }]],
  file: [['rect', { x: 4, y: 3, width: 16, height: 18, rx: 2.5 }], ['path', { d: 'M8 8h8' }], ['path', { d: 'M8 12h8' }], ['path', { d: 'M8 16h5' }]],
  chevron: [['path', { d: 'm6 9 6 6 6-6' }]]
};
const Ico = (props) =>
  h(
    'svg',
    {
      width: props.size || 20,
      height: props.size || 20,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false'
    },
    (ICONS[props.name] || []).map(([tag, attrs]) => h(tag, attrs))
  );
Ico.props = ['name', 'size'];

/* ── Konten ──────────────────────────────────────────────────────────────
   Sintaks teks:  **tebal**   dan   [[id-artikel|teks tautan]]
   Semua isi di bawah mengacu pada menu & tombol yang benar-benar ada di aplikasi. */
const TABS = [
  { id: 'pusat', label: 'Pusat Bantuan' },
  { id: 'forum', label: 'Komunitas / Forum' },
  { id: 'panduan', label: 'Panduan Mulai' }
];

// Banner sistem. Ganti teks/tautan sesuai kebutuhan, mis. pengumuman pemeliharaan:
//   text: 'Sistem ASI DARA sedang dalam pemeliharaan rutin. Sebagian menu mungkin tidak dapat diakses.'
const BANNER = {
  text: 'Pastikan dokumen RKA berformat PDF sebelum diunggah ke menu Unggah Berkas RKA. Simulasi Percakapan Agen AI juga menerima DOCX, XLSX, CSV, dan TXT.',
  linkLabel: 'Lihat panduan unggah',
  article: 'unggah'
};

const REPORT_KINDS = [
  { name: 'Kendala Teknis', desc: 'Berkas gagal diunggah, halaman macet, atau data tidak muncul.' },
  { name: 'Bug Aplikasi', desc: 'Tombol atau perhitungan yang tidak bekerja sebagaimana mestinya.' },
  { name: 'Masukan & Saran', desc: 'Usulan fitur atau perbaikan tampilan.' },
  { name: 'Permintaan Bantuan', desc: 'Meminta pengaktifan menu atau bimbingan penggunaan.' }
];

const QUICK = [
  { title: 'Unggah dokumen RKA', desc: 'Pilih berkas PDF di menu Unggah Berkas RKA dan tunggu antrean selesai.', cta: 'Buka Unggah Berkas RKA', tab: 'dashboard' },
  { title: 'Baca hasil analisis', desc: 'Lihat Nilai Prakiraan Dampak, indikator dan target kinerja, serta rekomendasi belanja.', cta: 'Buka Hasil Analisis', tab: 'analyzer' },
  { title: 'Perbaiki bila perlu', desc: 'Gunakan Edit Manual atau Edit dengan AI. Perubahan disimpan sebagai versi baru.', cta: 'Baca panduan edit', article: 'ubah' },
  { title: 'Simpan dan unduh', desc: 'Kelola dokumen di Arsip Dokumen RKA, lalu unduh laporan HTML atau ekspor JSON.', cta: 'Buka Arsip Dokumen RKA', tab: 'history' }
];

const ARTICLES = [
  {
    id: 'chatbot',
    sidebar: 'Mempelajari tentang fitur Simulasi Percakapan Agen AI',
    title: 'Mempelajari Fitur Simulasi Percakapan Agen AI',
    keywords: 'chatbot ai agen bot tanya jawab revisi regulasi permendagri ssh sbm dpa pagu rasionalisasi mode konsultasi',
    intro: [
      '**Simulasi Percakapan Agen AI** adalah asisten AI untuk perencanaan dan pengendalian anggaran daerah. Fitur ini punya tiga mode kerja yang dipilih lewat tab di bagian atas halamannya.',
      'Anda dapat mengunggah dokumen RKA (PDF, DOCX, XLSX, CSV, atau TXT). Tombol **Contoh RKA** tersedia untuk mencoba tanpa berkas sendiri.'
    ],
    note: { text: 'AI hanya membantu menganalisis dan mengusulkan. Periksa kembali hasilnya dengan dokumen asli sebelum dipakai sebagai dasar keputusan anggaran.' },
    sections: [
      {
        title: 'Mode 1: Analis Evaluasi RKA',
        body: ['Menguji kepatuhan terhadap SBM, efisiensi anggaran, dan Nilai Prakiraan Dampak TAPD.'],
        steps: ['Buka menu **Simulasi Percakapan Agen AI**, lalu pilih tab **Mode 1: Analis Evaluasi RKA**.', 'Unggah dokumen RKA pada area unggah.', 'Jalankan analisis dan baca temuan yang ditampilkan.']
      },
      {
        title: 'Mode 2: Eksekutor Revisi RKA',
        body: ['Membantu rasionalisasi pagu dan menyusun draf DPA baru dari dokumen RKA yang Anda unggah.'],
        steps: ['Pilih tab **Mode 2: Eksekutor Revisi RKA**.', 'Unggah dokumen RKA yang akan direvisi.', 'Tinjau draf yang diusulkan sebelum Anda gunakan.']
      },
      {
        title: 'Mode 3: Konsultasi Regulasi',
        body: ['Tanya jawab seputar Permendagri 77 dan SSH. Tulis pertanyaan dalam bahasa sehari-hari, misalnya tentang aturan belanja tertentu.']
      },
      {
        title: 'Tips agar jawaban lebih tepat',
        bullets: [
          'Sebutkan nama sub kegiatan, OPD, dan tahun anggaran dalam pertanyaan.',
          'Ajukan satu pertanyaan per pesan agar jawaban fokus.',
          'Bila lencana status masih “Menghubungkan...”, tunggu 30 sampai 60 detik. Server dinyalakan ulang otomatis setelah lama tidak dipakai.'
        ]
      }
    ],
    actions: [{ label: 'Buka Simulasi Percakapan Agen AI', tab: 'agentic-ai' }]
  },
  {
    id: 'unggah',
    sidebar: 'Cara mengunggah dan memproses dokumen RKA',
    title: 'Cara Mengunggah & Menganalisis Dokumen RKA di ASI DARA',
    keywords: 'unggah upload pdf berkas dokumen rka analisis antrean proses hasil mulai',
    intro: [
      'Anda mengunggah dokumen RKA berformat PDF lewat menu **Unggah Berkas RKA**. ASI DARA membaca isi dokumen di browser Anda, lalu AI menyusun Analisis Valuasi Prakiraan Dampak Program (SROI). Beberapa berkas dapat dipilih sekaligus.',
      'Hasilnya tersimpan di **Arsip Dokumen RKA** dan bisa dibuka kapan saja lewat menu **Hasil Analisis**.'
    ],
    note: {
      text: 'Beberapa langkah hanya berfungsi jika menu terkait aktif untuk akun Anda.',
      link: { label: 'Pelajari cara meminta pengaktifan menu', article: 'admin' }
    },
    sections: [
      {
        title: 'Menyiapkan dokumen',
        steps: [
          'Siapkan dokumen RKA/DPA SKPD Kabupaten Cirebon dalam format **PDF**. Format lain tidak diproses di menu ini.',
          'Gunakan PDF asli yang teksnya dapat diseleksi, bukan foto atau hasil pindai.',
          'Beri nama berkas yang mudah dikenali, misalnya memuat nama OPD dan sub kegiatan, agar mudah dicari di arsip.'
        ]
      },
      {
        title: 'Mengunggah berkas',
        steps: [
          'Buka menu **Unggah Berkas RKA** di sidebar.',
          'Klik **Pilih Dokumen RKA**, atau tarik berkas PDF ke area unggah.',
          'Untuk beberapa dokumen, pilih semuanya sekaligus. Berkas masuk ke antrean pemrosesan.'
        ]
      },
      {
        title: 'Memantau proses analisis',
        steps: [
          'Setiap berkas menampilkan status dan persentase kemajuan pada antrean.',
          'Jangan menutup atau memuat ulang halaman sampai antrean selesai, karena dokumen diproses di browser Anda.',
          'Bila berkas gagal, notifikasi muncul di pojok kanan bawah layar. Lihat [[gagal|solusi jika dokumen gagal diunggah atau dianalisis]].'
        ]
      },
      {
        title: 'Membuka hasil analisis',
        steps: [
          'Setelah antrean selesai, buka **Hasil Analisis**. Anda juga bisa memilih dokumen di **Arsip Dokumen RKA** lalu klik **Lihat Analisis**.',
          'Halaman hasil memuat Nilai Prakiraan Dampak, indikator dan target kinerja, kesesuaian anggaran, serta rekomendasi belanja.'
        ]
      }
    ],
    actions: [
      { label: 'Buka Unggah Berkas RKA', tab: 'dashboard' },
      { label: 'Buka Hasil Analisis', tab: 'analyzer' }
    ]
  },
  {
    id: 'ubah',
    sidebar: 'Mengubah atau mengedit hasil analisis evaluasi RKA',
    title: 'Mengubah atau Mengedit Hasil Analisis Evaluasi RKA',
    keywords: 'edit ubah revisi manual ai versi unggah ulang analisis ulang deadweight parameter sroi disahkan perbaiki koreksi',
    intro: [
      'Ada tiga cara memperbaiki hasil analisis: **Edit Manual**, **Edit dengan AI**, dan **Unggah Ulang PDF**. Ketiga tombol ada di bagian atas halaman hasil analisis.',
      'Perubahan dari Edit Manual dan Edit dengan AI disimpan sebagai **versi baru**, sehingga data sebelumnya tetap aman.'
    ],
    note: {
      text: 'Dokumen berstatus **Disahkan** tetap bisa diedit, tetapi angka Nilai Prakiraan Dampak pada dashboard ikut berubah. Dokumen yang belum tersimpan di arsip tidak dapat diedit; buka dulu dari menu **Arsip Dokumen RKA**.'
    },
    sections: [
      {
        title: 'Edit Manual',
        steps: [
          'Buka dokumen dari **Arsip Dokumen RKA** lalu klik **Lihat Analisis**.',
          'Klik **Edit Manual** di bagian atas halaman.',
          'Pilih bagian yang akan diubah: Identitas & Pagu, Indikator & Target, Kesesuaian & Outcome, Analisis Komponen Belanja & Rekomendasi Belanja, atau Parameter Nilai Prakiraan Dampak.',
          'Buka **Ringkasan & Simpan** untuk memeriksa perubahan, lalu simpan.'
        ]
      },
      {
        title: 'Edit dengan AI',
        steps: [
          'Klik **Edit dengan AI**.',
          'Tulis perubahan yang diinginkan (maksimal 2.000 karakter), misalnya menurunkan deadweight menjadi 20% dan memperjelas alasan pengurangan perjalanan dinas.',
          'Pilih bagian yang boleh diubah AI.',
          'Tinjau perbandingan sebelum dan sesudah. AI hanya mengusulkan; hasilnya disimpan setelah Anda menyetujui.'
        ]
      },
      {
        title: 'Unggah Ulang PDF',
        steps: [
          'Klik **Unggah Ulang PDF** untuk menganalisis ulang dokumen dari berkas PDF-nya.',
          'Pilih berkas PDF (maksimal 25 MB). Hanya PDF yang didukung.'
        ],
        body: ['Cara ini juga berguna untuk dokumen lama yang belum memiliki data indikator kinerja.']
      },
      {
        title: 'Memilih versi sebelumnya',
        body: ['Jika dokumen memiliki lebih dari satu versi, pilihan **Versi** muncul di samping judul halaman hasil analisis. Pilih versi untuk melihat isinya.']
      }
    ],
    actions: [{ label: 'Buka Arsip Dokumen RKA', tab: 'history' }]
  },
  {
    id: 'unduh',
    sidebar: 'Mengunduh laporan hasil analisis dan ekspor JSON',
    title: 'Mengunduh Laporan Hasil Analisis dan Ekspor JSON',
    keywords: 'unduh download laporan html json backup cadangan ekspor zip pemulihan arsip simpan',
    intro: [
      'Laporan satu dokumen diunduh sebagai berkas **HTML** mandiri dengan tampilan yang sama seperti halaman analisis. Data mentah diekspor sebagai **JSON** dari halaman Arsip Dokumen RKA.'
    ],
    note: { text: 'Berkas laporan dan JSON memuat seluruh data dokumen. Simpan dan bagikan hanya kepada pihak yang berwenang.' },
    sections: [
      {
        title: 'Mengunduh laporan satu dokumen',
        steps: [
          'Buka dokumen dari **Arsip Dokumen RKA** dan klik **Lihat Analisis**.',
          'Klik **Unduh Laporan** di bagian atas halaman.',
          'Tombol unduh (ikon panah ke bawah) juga tersedia pada setiap baris di daftar arsip.'
        ]
      },
      {
        title: 'Mengekspor dokumen ke JSON',
        steps: [
          'Buka menu **Arsip Dokumen RKA**.',
          'Klik **Ekspor Full Database (JSON)**.',
          'Akun pengguna mengunduh dokumen RKA miliknya beserta riwayat versi. Admin dan Moderator mengunduh database lengkap.'
        ]
      },
      {
        title: 'Mengonversi berkas cadangan HTML ke JSON',
        steps: [
          'Di **Arsip Dokumen RKA**, klik **Backup & Pemulihan**.',
          'Pada kartu **Konversi HTML ke JSON**, unggah satu atau beberapa berkas cadangan HTML (boleh tarik dan lepas).',
          'Jika berkasnya lebih dari satu, hasil konversi diunduh dalam satu berkas ZIP.'
        ]
      }
    ],
    actions: [{ label: 'Buka Arsip Dokumen RKA', tab: 'history' }]
  },
  {
    id: 'gagal',
    sidebar: 'Solusi jika dokumen RKA gagal diunggah atau dianalisis',
    title: 'Solusi Jika Dokumen RKA Gagal Diunggah atau Dianalisis',
    keywords: 'gagal error tidak bisa macet lama loading server pdf ditolak memproses menyimpan api key gemini rusak kosong',
    intro: [
      'Jika sebuah berkas gagal, antrean menampilkan status **Gagal memproses file** atau **Gagal menyimpan ke server**, dan sebuah notifikasi muncul di pojok kanan bawah layar. Coba langkah di bawah sesuai gejalanya.'
    ],
    note: {
      text: 'Catat nama berkas dan teks notifikasi kesalahan sebelum melapor. Informasi ini mempercepat penanganan.',
      link: { label: 'Pelajari cara menghubungi admin', article: 'admin' }
    },
    sections: [
      {
        title: 'Berkas tidak bisa dipilih atau ditolak',
        bullets: [
          'Pastikan ekstensi berkas adalah **.pdf**. Berkas Word atau Excel tidak diterima di menu Unggah Berkas RKA.',
          'Untuk Unggah Ulang PDF, ukuran berkas maksimal 25 MB.',
          'Gunakan PDF asli yang teksnya bisa diseleksi, bukan hasil pindai.'
        ]
      },
      {
        title: 'Muncul “Gagal memproses file”',
        bullets: [
          'Buka PDF di aplikasi lain untuk memastikan berkasnya tidak rusak, lalu unggah lagi.',
          'Coba unggah satu berkas saja, bukan banyak berkas sekaligus.',
          'Jika pesan menyebut API Key Gemini, hubungi admin untuk memeriksa konfigurasi AI.'
        ]
      },
      {
        title: 'Muncul “Gagal menyimpan ke server”',
        bullets: [
          'Periksa koneksi internet Anda, lalu unggah ulang berkasnya.',
          'Jika layar menampilkan “Menyiapkan Server…”, tunggu 30 sampai 60 detik. Server dinyalakan ulang otomatis setelah lama tidak dipakai.',
          'Bila tetap gagal, kirim laporan ke admin.'
        ]
      },
      {
        title: 'Data indikator atau hasil analisis kosong',
        body: ['Dokumen yang dianalisis sebelum fitur indikator kinerja ditambahkan tidak memiliki data tersebut. Buka dokumennya lalu klik **Unggah Ulang PDF** agar datanya diekstrak ulang.']
      }
    ],
    actions: [{ label: 'Kirim laporan ke admin', tab: 'report' }]
  },
  {
    id: 'indikator',
    sidebar: 'Memahami indikator dan target kinerja pada hasil analisis',
    title: 'Memahami Indikator dan Target Kinerja pada Hasil Analisis',
    keywords: 'indikator target kinerja tolok ukur kesesuaian anggaran outcome output capaian level sasaran tujuan',
    intro: [
      'Bagian **Indikator & Target Kinerja** pada halaman hasil analisis menampilkan tolok ukur dan target capaian yang tertulis di dokumen RKA/DPA. Bagian sesudahnya membandingkan target tersebut dengan anggaran.'
    ],
    sections: [
      {
        title: 'Membaca kartu Target Kinerja per Indikator',
        body: ['Setiap kartu memuat **level** indikator (Tujuan, Sasaran, Program, atau Kegiatan), **target** capaian, dan nama **tolok ukur** yang diukur.']
      },
      {
        title: 'Membaca kesesuaian anggaran',
        body: ['Bagian **Analisis Kesesuaian Anggaran dengan Target Kinerja** menampilkan status kesesuaian anggaran tahun berjalan, penjelasannya, estimasi biaya per output, dan proyeksi pencapaian target.']
      },
      {
        title: 'Jika data indikator belum tersedia',
        steps: [
          'Pesan “Data indikator kinerja & anggaran per tahun belum tersedia” berarti dokumen dianalisis sebelum fitur ini ada, atau tabel indikator tidak ditemukan di PDF.',
          'Klik **Unggah Ulang PDF** agar datanya diekstrak ulang.',
          'Jika tabelnya memang tidak ada di PDF, isi lewat **Edit Manual** pada bagian **Indikator & Target**.'
        ]
      },
      {
        title: 'Memperbaiki indikator yang keliru',
        steps: ['Klik **Edit Manual** dan pilih **Indikator & Target**.', 'Koreksi level, tolok ukur, atau target, lalu simpan sebagai versi baru.']
      }
    ],
    actions: [{ label: 'Buka Hasil Analisis', tab: 'analyzer' }]
  },
  {
    id: 'admin',
    sidebar: 'Mengontak Tim IT / Admin Bapperida jika menu nonaktif',
    title: 'Mengontak Tim IT / Admin Bapperida Jika Menu Nonaktif',
    keywords: 'admin menu nonaktif tidak aktif terkunci lapor laporan hubungi it whatsapp akses aktivasi',
    intro: [
      'Admin dapat menonaktifkan menu tertentu untuk sementara. Menu itu tampil dengan lencana **Nonaktif** di sidebar, dan halamannya menampilkan pesan **Menu Belum Aktif**.',
      'Untuk meminta akses atau menanyakan jadwal pengaktifan, kirim laporan lewat menu Laporan. Laporan langsung masuk ke aplikasi admin.'
    ],
    note: { text: 'Admin dan Moderator tetap dapat membuka semua menu, termasuk yang dinonaktifkan untuk pengguna biasa.' },
    sections: [
      {
        title: 'Mengirim laporan ke admin',
        steps: [
          'Klik ikon bendera (**Laporan**) di pojok kanan atas aplikasi.',
          'Isi **Judul Laporan** dan **Deskripsi Laporan**, misalnya “Permintaan aktivasi menu Hasil Analisis”.',
          'Pilih **Kategori**: Kendala Teknis, Bug Aplikasi, Masukan & Saran, Permintaan Bantuan, atau Lainnya.',
          'Isi **Nama Pelapor** dan minimal salah satu dari email atau nomor WhatsApp agar admin dapat menghubungi Anda kembali.',
          'Lampirkan tangkapan layar bila perlu (maksimal 5 gambar, 5 MB per gambar), lalu kirim.'
        ]
      },
      {
        title: 'Hal yang perlu disertakan',
        bullets: ['Nama menu yang nonaktif.', 'Nama akun dan OPD Anda.', 'Alasan Anda membutuhkan menu tersebut.']
      },
      {
        title: 'Setelah laporan terkirim',
        body: ['Admin menindaklanjuti lewat WhatsApp atau email yang Anda isi pada formulir. Menu yang sudah diaktifkan langsung terbuka saat halaman dimuat ulang.']
      }
    ],
    actions: [{ label: 'Buka formulir Laporan', tab: 'report' }]
  }
];

/* ── State ─────────────────────────────────────────────────────────────── */
const activeTab = ref('pusat');
const articleId = ref('unggah');
const openIdx = ref([0]);
const bannerVisible = ref(true);
const articleEl = ref(null);
const searchWrap = ref(null);

const article = computed(() => ARTICLES.find((a) => a.id === articleId.value) || ARTICLES[0]);
const isOpen = (i) => openIdx.value.includes(i);
const toggle = (i) => {
  openIdx.value = isOpen(i) ? openIdx.value.filter((x) => x !== i) : [...openIdx.value, i];
};

function openArticle(id, sectionIdx = 0) {
  if (!ARTICLES.some((a) => a.id === id)) return;
  articleId.value = id;
  openIdx.value = [sectionIdx];
  activeTab.value = 'pusat';
  resultsOpen.value = false;
  nextTick(() => {
    // Di layar sempit artikel berada di bawah daftar, jadi gulir ke judulnya.
    if (window.innerWidth < 1024 && articleEl.value) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      articleEl.value.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
    }
  });
}

function onArticleClick(e) {
  const a = e.target.closest && e.target.closest('a[data-article]');
  if (a) {
    e.preventDefault();
    openArticle(a.dataset.article);
  }
}

function onTabKey(e, i) {
  let j = null;
  if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
  else if (e.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
  if (j === null) return;
  e.preventDefault();
  activeTab.value = TABS[j].id;
  nextTick(() => document.getElementById('bp-tab-' + TABS[j].id)?.focus());
}

/* ── Format teks konten ────────────────────────────────────────────────── */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[\[(\w+)\|(.+?)\]\]/g, '<a href="#" class="bp-link" data-article="$1">$2</a>');
const plain = (s) => s.replace(/\*\*/g, '').replace(/\[\[\w+\|(.+?)\]\]/g, '$1');

/* ── Pencarian (di sisi klien) ─────────────────────────────────────────── */
const STOP = new Set(['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'saya', 'anda', 'apa', 'bagaimana', 'ini', 'itu', 'atau', 'pada', 'ada', 'bisa', 'cara', 'kenapa', 'mengapa', 'kok', 'tidak', 'the', 'how', 'to']);
const tokenize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

const INDEX = ARTICLES.map((a) => {
  const secs = a.sections.map((s) => ({
    title: s.title,
    text: [...(s.body || []), ...(s.steps || []), ...(s.bullets || [])].map(plain).join(' ')
  }));
  return {
    a,
    title: tokenize(a.title + ' ' + a.sidebar),
    kw: tokenize(a.keywords),
    secTitles: secs.map((s) => tokenize(s.title)),
    body: tokenize([...a.intro, a.note?.text || '', ...secs.map((s) => s.text)].map(plain).join(' '))
  };
});
const clip = (t, n) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n)).replace(/[,.;:\s]+$/, '') + '…');
const hit = (arr, t) => (t.length >= 3 ? arr.some((x) => x.includes(t)) : arr.includes(t));

function search(q) {
  const tokens = [...new Set(tokenize(q))];
  if (!tokens.length) return [];
  const out = [];
  for (const it of INDEX) {
    let score = 0;
    let matched = 0;
    let sec = -1;
    for (const t of tokens) {
      let s = 0;
      if (hit(it.title, t)) s += 5;
      if (hit(it.kw, t)) s += 3;
      const si = it.secTitles.findIndex((arr) => hit(arr, t));
      if (si >= 0) {
        s += 2;
        if (sec < 0) sec = si;
      }
      if (hit(it.body, t)) s += 1;
      if (s > 0) {
        score += s;
        matched++;
      }
    }
    if (!score) continue;
    score += matched * 2;
    const snippet = sec >= 0 ? 'Bagian: ' + it.a.sections[sec].title : clip(plain(it.a.intro[0]), 110);
    out.push({ a: it.a, score, sec: Math.max(sec, 0), snippet });
  }
  out.sort((x, y) => y.score - x.score);
  // Buang hasil yang jauh kurang relevan dibanding hasil teratas.
  return out.filter((r) => r.score >= out[0].score * 0.4).slice(0, 5);
}

const query = ref('');
const resultsOpen = ref(false);
const hi = ref(-1);
const results = computed(() => (query.value.trim().length >= 2 ? search(query.value) : []));
const showResults = computed(() => resultsOpen.value && query.value.trim().length >= 2);

function onSearchInput() {
  resultsOpen.value = query.value.trim().length >= 2;
  hi.value = -1;
}
function moveHi(d) {
  if (!results.value.length) return;
  resultsOpen.value = true;
  const n = results.value.length;
  hi.value = hi.value < 0 ? (d > 0 ? 0 : n - 1) : (hi.value + d + n) % n;
}
function pick(r) {
  openArticle(r.a.id, r.sec);
  query.value = '';
  hi.value = -1;
}
function pickHighlighted() {
  const r = results.value[hi.value >= 0 ? hi.value : 0];
  if (r) pick(r);
}
function clearSearch() {
  query.value = '';
  resultsOpen.value = false;
  hi.value = -1;
}
function onDocPointer(e) {
  if (searchWrap.value && !searchWrap.value.contains(e.target)) resultsOpen.value = false;
}
onMounted(() => document.addEventListener('pointerdown', onDocPointer));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointer));

</script>

<style scoped>
/* Semua warna memakai token global; nilai setelah koma adalah cadangan. */
.bp {
  --bp-ink: var(--text-primary, #1a1d21);
  --bp-muted: var(--text-secondary, #5b6169);
  --bp-line: var(--border-color, #e6e8eb);
  --bp-line-strong: var(--border-color-strong, #d3d7dc);
  --bp-brand: var(--primary-color, #1b4d46);
  --bp-link: var(--info-color, #2e7d74);
  --bp-surface: var(--bg-secondary, #fff);
  --bp-inset: var(--bg-tertiary, #f1f3f5);
  --bp-focus: var(--info-color, #2e7d74);
  --bp-on-brand: #fff;

  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  min-width: 0;
  color: var(--bp-ink);
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
}
.bp :where(button, input) { font: inherit; color: inherit; }
.bp :where(button:focus-visible, a:focus-visible, input:focus-visible) {
  outline: 2px solid var(--bp-focus);
  outline-offset: 2px;
}

/* ── Header + pencarian ───────────────────────────────────────────────── */
.bp-head {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 4px 0 20px;
}
.bp-brand { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.bp-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border: 1px solid var(--bp-line);
  border-radius: 12px;
  background: #fff;
}
.bp-logo { width: 34px; height: 34px; object-fit: contain; }
.bp-brand-name {
  margin: 0;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1.375rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--bp-ink);
}
.bp-search { position: relative; flex: 1 1 auto; max-width: 760px; margin-inline: auto; min-width: 0; }
.bp-search-box {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 14px 0 20px;
  background: var(--bp-inset);
  border: 2px solid transparent;
  border-radius: 999px;
  transition: background-color 0.15s, border-color 0.15s;
}
.bp-search-box:focus-within { background: var(--bp-surface); border-color: var(--bp-brand); }
.bp-search-ico { flex: 0 0 auto; color: var(--bp-muted); }
.bp-search-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 1.0625rem;
  color: var(--bp-ink);
  text-overflow: ellipsis;
}
.bp-search-input::placeholder { color: var(--bp-muted); opacity: 1; }
.bp-search-input::-webkit-search-cancel-button { display: none; }
.bp-search-input:focus-visible { outline: 0; }

.bp-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bp-muted);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}
.bp-icon-btn:hover { background: var(--bp-inset); color: var(--bp-ink); }

.bp-results {
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 8px;
  background: var(--bp-surface);
  border: 1px solid var(--bp-line);
  border-radius: 20px;
  box-shadow: 0 16px 32px -12px rgba(17, 24, 39, 0.22);
}
.bp-results ul { list-style: none; margin: 0; padding: 0; }
.bp-res {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
}
.bp-res.is-hi { background: var(--bp-inset); }
.bp-res-ico { flex: 0 0 auto; margin-top: 1px; color: var(--bp-brand); }
.bp-res-text { min-width: 0; }
.bp-res-title { font-weight: 600; font-size: 0.95rem; line-height: 1.4; }
.bp-res-desc { margin-top: 2px; font-size: 0.85rem; line-height: 1.45; color: var(--bp-muted); }
.bp-noresult { padding: 16px 14px 12px; }
.bp-noresult-title { margin: 0 0 6px; font-weight: 600; }
.bp-noresult-text { margin: 0 0 14px; font-size: 0.9rem; line-height: 1.55; color: var(--bp-muted); }

/* ── Tab + notifikasi ─────────────────────────────────────────────────── */
.bp-navrow {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: inset 0 -1px 0 var(--bp-line);
}
.bp-tabs { display: flex; gap: 8px; min-width: 0; overflow-x: auto; scrollbar-width: none; padding: 4px 4px 0; }
.bp-tabs::-webkit-scrollbar { display: none; }
.bp-tab {
  position: relative;
  flex: 0 0 auto;
  padding: 14px 16px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1rem;
  font-weight: 500;
  color: var(--bp-ink);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, background-color 0.15s;
}
.bp-tab:hover { background: var(--bp-inset); }
.bp-tab.is-active { color: var(--bp-link); }
.bp-tab.is-active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--bp-link);
}


/* ── Panel & banner ───────────────────────────────────────────────────── */
.bp-panel { padding-top: 24px; }
.bp-main { min-width: 0; }
.bp-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 14px 12px 14px 20px;
  border-radius: 14px;
  background: var(--warning-glow, rgba(215, 154, 62, 0.16));
}
.bp-banner-ico { flex: 0 0 auto; color: var(--warning-hover, #b87f2a); }
.bp-banner-text { flex: 1 1 auto; margin: 0; font-size: 0.95rem; line-height: 1.55; color: var(--bp-ink); }
.bp-banner-link {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--bp-link);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
}
.bp-banner-link:hover { background: rgba(0, 0, 0, 0.05); }
.bp-banner-x { flex: 0 0 auto; color: var(--bp-ink); }
.bp-banner-x:hover { background: rgba(0, 0, 0, 0.06); }

/* ── Grid 2 kolom ─────────────────────────────────────────────────────── */
.bp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 48px;
  align-items: start;
}

/* Artikel */
.bp-article {
  min-width: 0;
  padding: 44px 52px 36px;
  border: 1px solid var(--bp-line-strong);
  border-radius: 20px;
  background: var(--bp-surface);
}
.bp-h1 {
  margin: 0 0 20px;
  max-width: 24ch;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 2.5rem;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: var(--bp-ink);
  text-wrap: balance;
}
.bp-p { margin: 0 0 16px; max-width: 68ch; font-size: 1.0625rem; line-height: 1.7; color: var(--bp-ink); }
.bp-article :deep(strong), .bp-simple :deep(strong) { font-weight: 600; }
.bp-link, .bp-article :deep(a.bp-link) {
  color: var(--bp-link);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
.bp-link:hover, .bp-article :deep(a.bp-link:hover) { color: var(--bp-brand); text-decoration-thickness: 2px; }

/* Akordeon */
.bp-acc { margin-top: 28px; border-bottom: 1px solid var(--bp-line); }
.bp-acc-item { border-top: 1px solid var(--bp-line); }
.bp-acc-h { margin: 0; }
.bp-acc-btn {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1.1875rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--bp-link);
  text-align: left;
  cursor: pointer;
}
.bp-acc-btn:hover { color: var(--bp-brand); }
.bp-acc-chev { flex: 0 0 auto; transition: transform 0.25s ease; }
.bp-acc-chev.is-open { transform: rotate(180deg); }
.bp-acc-panel {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  transition: grid-template-rows 0.25s ease, visibility 0s linear 0.25s;
}
.bp-acc-panel.is-open {
  grid-template-rows: 1fr;
  visibility: visible;
  transition: grid-template-rows 0.25s ease, visibility 0s;
}
.bp-acc-inner { min-height: 0; overflow: hidden; }
.bp-acc-body { padding: 0 4px 12px; }

.bp-steps, .bp-bullets { margin: 0 0 12px; padding-left: 1.4em; max-width: 68ch; }
.bp-steps li, .bp-bullets li { margin-bottom: 10px; padding-left: 4px; font-size: 1.0625rem; line-height: 1.7; }
.bp-steps li::marker { color: var(--bp-muted); font-weight: 600; }
.bp-bullets li::marker { color: var(--bp-muted); }

.bp-article-foot { margin-top: 28px; }
.bp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.bp-foot-help { margin: 0; font-size: 0.95rem; color: var(--bp-muted); }

/* Tombol */
.bp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.bp-btn-primary { background: var(--bp-brand); color: var(--bp-on-brand); }
.bp-btn-primary:hover { background: var(--primary-hover, #113630); }
.bp-btn-ghost { border-color: var(--bp-line-strong); background: transparent; color: var(--bp-link); }
.bp-btn-ghost:hover { background: var(--bp-inset); }

/* Sidebar */
.bp-side { position: sticky; top: 16px; min-width: 0; }
.bp-side-h {
  margin: 8px 0 20px;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--bp-ink);
}
.bp-side-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.bp-side-link {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 12px;
  margin-inline: -12px;
  border-radius: 12px;
  color: var(--bp-ink);
  font-size: 1rem;
  line-height: 1.5;
  text-decoration: none;
  transition: background-color 0.15s;
}
.bp-side-link:hover { background: var(--bp-inset); }
.bp-side-ico { flex: 0 0 auto; margin-top: 0; color: var(--bp-link); }
.bp-side-link.is-current { font-weight: 600; }
.bp-side-link.is-current .bp-side-ico { color: var(--bp-brand); }

/* Panel sederhana: forum & panduan mulai */
.bp-simple { max-width: 820px; padding-bottom: 24px; }
.bp-simple .bp-h1 { max-width: none; }
.bp-defs { margin: 8px 0 28px; max-width: 68ch; border-top: 1px solid var(--bp-line); }
.bp-def { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--bp-line); }
.bp-def dt { font-weight: 600; }
.bp-def dd { margin: 0; color: var(--bp-muted); line-height: 1.6; }

.bp-quick { list-style: none; margin: 24px 0 0; padding: 0; border-top: 1px solid var(--bp-line); }
.bp-quick-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 22px 0;
  border-bottom: 1px solid var(--bp-line);
}
.bp-quick-n {
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  color: var(--bp-link);
}
.bp-quick-title { margin: 0 0 4px; font-family: var(--font-heading, 'Outfit', sans-serif); font-size: 1.1875rem; font-weight: 500; }
.bp-quick-desc { margin: 0; line-height: 1.6; color: var(--bp-muted); }

/* ── Responsif ────────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .bp-grid { grid-template-columns: minmax(0, 1fr); gap: 36px; }
  .bp-side { position: static; }
  .bp-side-link { margin-inline: 0; }
  .bp-article { padding: 32px 28px 28px; }
  .bp-h1 { font-size: 2.125rem; }
}
@media (max-width: 720px) {
  .bp-head { flex-direction: column; align-items: stretch; gap: 16px; padding-bottom: 16px; }
  .bp-search { max-width: none; margin-inline: 0; }
  .bp-search-box { height: 52px; }
  .bp-tab { padding: 12px 12px; }
  .bp-tabs { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); padding-right: 24px; }
  .bp-banner {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) 40px;
    grid-template-areas: 'ico text x' '. link .';
    align-items: start;
    gap: 4px 12px;
    padding: 14px 8px 10px 16px;
  }
  .bp-banner-ico { grid-area: ico; margin-top: 2px; }
  .bp-banner-text { grid-area: text; }
  .bp-banner-x { grid-area: x; margin-top: -6px; }
  .bp-banner-link { grid-area: link; justify-self: start; margin-left: -12px; }
  .bp-article { padding: 24px 18px 22px; border-radius: 16px; }
  .bp-h1 { font-size: 1.75rem; }
  .bp-p, .bp-steps li, .bp-bullets li { font-size: 1rem; }
  .bp-acc-btn { font-size: 1.0625rem; }
  .bp-def { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .bp-quick-item { grid-template-columns: 36px minmax(0, 1fr); }
  .bp-quick-cta { grid-column: 2; }
  .bp-quick-n { font-size: 1.625rem; }
}
@media (prefers-reduced-motion: reduce) {
  .bp *, .bp *::before, .bp *::after { transition: none !important; }
}
</style>

<style>
/* Tema gelap: warna brand dicerahkan di style.css, jadi teks di atasnya dibuat gelap agar kontras. */
[data-theme='dark'] .bp.bp { --bp-on-brand: #0f1412; }
</style>
