<!--
  PetunjukPenggunaan.vue — halaman "Petunjuk Penggunaan" ASI DARA (Bapperida Kab. Cirebon)

  Gaya: tutorial visual bertahap (mirip wikiHow) — bilah pencarian di atas, lencana "Bagian",
  gambar besar di atas tiap langkah, nomor langkah besar, poin rincian, dan sidebar kanan
  (daftar isi + kartu informasi). Dibangun dengan Tailwind CSS (lihat tailwind.config.js:
  utilitas dibatasi di #petunjuk-root sehingga menu lain tidak terpengaruh).

  Pemakaian (App.vue, section tab 'petunjuk'):
    <PetunjukPenggunaan @navigate="currentTab = $event" />

  Event:
    navigate(tabId) → minta App pindah menu: 'dashboard' | 'agentic-ai' | 'analyzer' | 'faq' | 'report'

  Mengganti gambar ilustrasi dengan tangkapan layar asli:
    Simpan berkas di public/images/petunjuk/ lalu isi field `img` pada langkah terkait, mis.
      img: '/images/petunjuk/b1-langkah1.png'
    Bila `img` terisi, gambar itu tampil menggantikan ilustrasi buatan dan ikut masuk ke PDF.

  Isi panduan mengikuti perilaku aplikasi saat ini (lihat komentar "Sumber" pada tiap Bagian).
  Bila perilaku berubah (mis. batas ukuran), ubah di konstanta RAW_PARTS dan kartu "Format dan batas berkas".
-->
<template>
  <div class="pt-page">
    <PageHero icon="book-open" title="Petunjuk Penggunaan" subtitle="Panduan langkah demi langkah" style="margin-bottom: 16px;" />
  <div id="petunjuk-root">
    <div class="mx-auto w-full font-body text-ink">
      <!-- ══ BILAH ATAS: judul, pencarian cepat, navigasi bagian ═══════════════ -->
      <header class="overflow-hidden rounded-xl border border-line bg-surface">
        <div class="pt-bar flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">

          <div class="relative order-3 w-full lg:order-none lg:w-auto lg:min-w-[280px] lg:flex-1">
            <label for="pt-search" class="sr-only">Cari panduan penggunaan</label>
            <Ico name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -mt-[9px] text-[#5B6169]" />
            <input
              id="pt-search"
              ref="searchEl"
              v-model="query"
              type="search"
              autocomplete="off"
              placeholder="Cari panduan penggunaan..."
              class="pt-search w-full rounded-lg bg-white py-2.5 pl-10 pr-10 text-[15px] text-[#1A1D21] placeholder:text-[#5B6169]"
              @keydown.esc="clearSearch"
              @keydown.enter.prevent="jumpToFirstMatch"
            />
            <button
              v-if="query"
              type="button"
              class="pt-focus absolute right-2 top-1/2 -mt-4 grid h-8 w-8 place-items-center rounded-md text-[#5B6169] hover:bg-[#F1F3F5]"
              aria-label="Hapus pencarian"
              @click="clearSearch"
            >
              <Ico name="x" :size="16" />
            </button>
          </div>

          <nav class="order-4 flex w-full gap-1 overflow-x-auto lg:order-none lg:w-auto" aria-label="Loncat ke bagian">
            <button
              v-for="p in PARTS"
              :key="p.id"
              type="button"
              class="pt-focus-light shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold"
              :class="activePartId === p.id ? 'bg-white text-[#1B4D46]' : 'text-white/85 hover:bg-white/15'"
              :aria-current="activePartId === p.id ? 'true' : undefined"
              @click="goTo(p.id)"
            >
              Bagian {{ p.no }}
            </button>
          </nav>
        </div>
      </header>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm text-ink-2">
        <p class="m-0 flex items-center gap-2">
          <span class="pt-hl-key inline-block h-3.5 w-3.5 shrink-0 rounded-sm"></span>
          Kotak jingga pada gambar menandai bagian yang perlu Anda klik atau periksa.
        </p>
        <p class="m-0" role="status" aria-live="polite">
          <template v-if="hasQuery">
            <strong class="text-ink">{{ matchCount }}</strong> langkah cocok dengan “{{ query.trim() }}”
          </template>
          <template v-else>{{ totalSteps }} langkah dalam {{ PARTS.length }} bagian</template>
        </p>
      </div>

      <!-- ══ GRID: isi panduan + sidebar ═════════════════════════════════════ -->
      <div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <!-- ── Kolom utama ─────────────────────────────────────────────── -->
        <main class="min-w-0 space-y-6">
          <section
            v-for="part in visibleParts"
            :id="part.id"
            :key="part.id"
            class="scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface"
            :aria-labelledby="part.id + '-judul'"
          >
            <!-- Judul bagian: lencana + judul + Unduh PDF -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-4 sm:px-6">
              <div class="pt-badge flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg">
                <span class="text-[11px] font-semibold leading-none">Bagian</span>
                <span class="mt-1 font-heading text-[28px] font-extrabold leading-none">{{ part.no }}</span>
              </div>
              <div class="min-w-0 flex-1 basis-60">
                <h3 :id="part.id + '-judul'" class="m-0 font-heading text-xl font-extrabold leading-snug text-ink sm:text-2xl">
                  {{ part.title }}
                </h3>
                <p class="m-0 mt-1 max-w-[68ch] text-sm leading-6 text-ink-2">{{ part.lead }}</p>
              </div>
              <button
                type="button"
                class="pt-focus inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-inset px-4 py-2.5 text-sm font-semibold text-ink hover:border-line-strong disabled:cursor-wait disabled:opacity-60"
                :disabled="!!pdfBusy"
                :title="'Unduh Bagian ' + part.no + ' sebagai PDF'"
                @click="downloadPdf(part)"
              >
                <Ico name="file" :size="18" class="text-accent" />
                {{ pdfBusy === part.id ? 'Menyiapkan PDF...' : 'Unduh PDF' }}
              </button>
            </div>

            <!-- Langkah-langkah -->
            <ol class="m-0 list-none p-0">
              <li
                v-for="(s, i) in part.steps"
                :id="s.id"
                :key="s.id"
                data-step
                class="scroll-mt-24"
                :class="i > 0 ? 'border-t border-line' : ''"
              >
                <!-- Gambar / ilustrasi langkah -->
                <figure class="pt-media relative m-0 flex min-h-[240px] items-center justify-center px-4 pb-9 pt-8 sm:px-8" :aria-label="s.alt">
                  <img
                    v-if="s.img"
                    :src="s.img"
                    :alt="s.alt"
                    loading="lazy"
                    class="max-h-[440px] w-full max-w-[720px] rounded-lg border border-line bg-surface object-contain"
                  />
                  <template v-else>
                    <span class="sr-only">{{ s.alt }}</span>
                    <div :aria-hidden="s.visual === 'modes' ? undefined : 'true'" class="flex w-full justify-center">
                      <!-- 1.1 Main Dashboard visual -->
                      <div v-if="s.visual === 'main-dash'" class="pt-mock w-full max-w-[580px] space-y-3 p-3 text-[12px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <span class="flex items-center gap-1.5 font-heading text-[13px] font-bold text-brand">
                            <Ico name="chart" :size="16" />Dasbor Utama ASI DARA
                          </span>
                          <span class="rounded-full bg-ok-soft px-2.5 py-0.5 text-[11px] font-semibold text-ok-ink">Sistem Normal</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <div class="rounded-lg border border-line bg-surface p-2.5">
                            <p class="m-0 text-[11px] font-semibold text-ink-3">Model Gemini 2.5 Flash</p>
                            <p class="m-0 mt-1 flex items-center gap-1.5 font-bold text-ok-ink"><span class="h-2 w-2 rounded-full bg-ok"></span>Siap Digunakan</p>
                          </div>
                          <div class="rounded-lg border border-line bg-surface p-2.5">
                            <p class="m-0 text-[11px] font-semibold text-ink-3">Arsip Dokumen RKA</p>
                            <p class="m-0 mt-1 font-bold text-ink">42 Dokumen Tersimpan</p>
                          </div>
                        </div>
                        <div class="pt-hl flex items-center justify-between rounded-lg bg-brand p-3 text-white">
                          <div>
                            <p class="m-0 text-[13px] font-bold">Mulai Analisis Dokumen RKA</p>
                            <p class="m-0 text-[11px] opacity-85">Unggah RKA PDF dan dapatkan hasil evaluasi SROI otomatis</p>
                          </div>
                          <span class="shrink-0 rounded-md bg-white px-3 py-1.5 text-[11px] font-bold text-brand">Buka Menu</span>
                        </div>
                      </div>

                      <!-- 1.2 Format berkas -->
                      <div v-else-if="s.visual === 'files'" class="pt-mock w-full max-w-[480px] space-y-2 p-3 text-[12px]">
                        <p class="m-0 px-1 font-heading text-[13px] font-bold">Berkas yang Anda siapkan</p>
                        <div class="pt-hl flex items-center gap-3 rounded-md border border-line bg-ok-soft px-3 py-2">
                          <span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-white text-[10px] font-extrabold text-bad-ink">PDF</span>
                          <div class="min-w-0 flex-1">
                            <p class="m-0 truncate font-semibold">RKA_Dinas_Kesehatan_Subkegiatan.pdf</p>
                            <p class="m-0 text-ink-3">2,4 MB, teks dapat diseleksi</p>
                          </div>
                          <span class="inline-flex shrink-0 items-center gap-1 font-semibold text-ok-ink"><Ico name="check" :size="14" />Diterima</span>
                        </div>
                        <div class="flex items-center gap-3 rounded-md border border-line bg-bad-soft px-3 py-2">
                          <span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-white text-[10px] font-extrabold text-ok-ink">XLS</span>
                          <div class="min-w-0 flex-1">
                            <p class="m-0 truncate font-semibold">Rincian_Belanja.xlsx</p>
                            <p class="m-0 text-ink-3">Bukan PDF</p>
                          </div>
                          <span class="inline-flex shrink-0 items-center gap-1 font-semibold text-bad-ink"><Ico name="x" :size="14" />Ditolak</span>
                        </div>
                        <div class="flex items-center gap-3 rounded-md border border-line bg-bad-soft px-3 py-2">
                          <span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-white text-[10px] font-extrabold text-ink-2">JPG</span>
                          <div class="min-w-0 flex-1">
                            <p class="m-0 truncate font-semibold">Foto_halaman_RKA.jpg</p>
                            <p class="m-0 text-ink-3">Foto atau hasil pindai tidak terbaca</p>
                          </div>
                          <span class="inline-flex shrink-0 items-center gap-1 font-semibold text-bad-ink"><Ico name="x" :size="14" />Ditolak</span>
                        </div>
                        <p class="m-0 px-1 pt-1 text-ink-3">Maksimal 100 MB per berkas</p>
                      </div>

                      <!-- 1.3 Menu + kotak unggah -->
                      <div v-else-if="s.visual === 'dropzone'" class="pt-mock flex w-full max-w-[580px] overflow-hidden text-[12px]">
                        <div class="hidden w-[150px] shrink-0 space-y-1 border-r border-line bg-inset p-2 sm:block">
                          <p class="pt-hl m-0 rounded-md bg-brand px-2 py-1.5 font-semibold text-white">Unggah Berkas RKA</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Beranda</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Hasil Analisis</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Simulasi Percakapan Agen AI</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Arsip Dokumen RKA</p>
                        </div>
                        <div class="min-w-0 flex-1 p-3">
                          <p class="m-0 font-heading text-[13px] font-bold">Unggah Dokumen RKA (PDF)</p>
                          <p class="m-0 mb-2 text-[11px] text-ink-3">Mendukung format RKA Rencana Kerja &amp; Anggaran SKPD Kabupaten Cirebon</p>
                          <div class="rounded-lg border-2 border-dashed border-line-strong bg-inset px-4 py-5 text-center">
                            <Ico name="upload" :size="26" class="mx-auto text-brand" />
                            <p class="m-0 mt-1 text-[13px] font-semibold">Pilih atau Tarik Berkas RKA PDF di Sini</p>
                            <p class="m-0 mb-3 text-ink-3">Dokumen akan diproses langsung di browser secara aman</p>
                            <span class="pt-hl inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Pilih Dokumen RKA</span>
                          </div>
                        </div>
                      </div>

                      <!-- 1.4 Antrean -->
                      <div v-else-if="s.visual === 'queue'" class="pt-mock w-full max-w-[480px] p-3 text-[12px]">
                        <p class="m-0 mb-3 text-center font-heading text-[13px] font-bold">Memproses Antrean Dokumen...</p>
                        <div class="space-y-2">
                          <div v-for="q in QUEUE_MOCK" :key="q.name" class="rounded-md border border-line bg-inset p-2.5">
                            <div class="mb-1.5 flex items-center justify-between gap-3">
                              <span class="min-w-0 truncate font-semibold">{{ q.name }}</span>
                              <span class="flex shrink-0 items-center gap-2 text-ink-3">
                                {{ q.status }}
                                <span class="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">{{ q.pct }}%</span>
                              </span>
                            </div>
                            <div class="h-2 overflow-hidden rounded-full bg-line">
                              <div class="h-full rounded-full" :class="q.pct === 100 ? 'bg-ok' : 'bg-brand'" :style="{ width: q.pct + '%' }"></div>
                            </div>
                          </div>
                        </div>
                        <p class="pt-hl m-0 mt-3 rounded-md bg-warn-soft px-3 py-2 text-ink">
                          <strong>Jangan tutup halaman</strong> sampai semua berkas selesai.
                        </p>
                      </div>

                      <!-- 1.5 Edit OPD -->
                      <div v-else-if="s.visual === 'opd'" class="pt-mock w-full max-w-[480px] overflow-hidden text-[12px]">
                        <div class="flex items-center justify-between border-b border-line px-3 py-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Edit Manual Hasil Analisis</p>
                          <span class="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">Identitas &amp; Pagu</span>
                        </div>
                        <div class="space-y-3 p-3">
                          <div>
                            <p class="m-0 font-heading text-[13px] font-bold">Identitas &amp; Pagu Anggaran</p>
                            <p class="m-0 text-ink-3">Data pada kartu header halaman analisis.</p>
                          </div>
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Perangkat Daerah (OPD)</p>
                            <div class="pt-hl rounded-md border border-line-strong bg-surface px-2.5 py-2">Dinas Kesehatan</div>
                            <p class="m-0 mt-1 text-[11px] text-ink-3">Terbaca otomatis dari dokumen. Ubah di sini bila keliru.</p>
                          </div>
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Pagu Anggaran (Rp)</p>
                            <div class="rounded-md border border-line-strong bg-surface px-2.5 py-2">250000000</div>
                          </div>
                        </div>
                        <div class="flex justify-end gap-2 border-t border-line bg-inset px-3 py-2">
                          <span class="rounded-md border border-line-strong px-3 py-1.5 font-semibold text-ink-2">Batal</span>
                          <span class="rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Ringkasan &amp; Simpan</span>
                        </div>
                      </div>

                      <!-- 2.1 Pilih mode (interaktif) -->
                      <div v-else-if="s.visual === 'modes'" class="pt-mock w-full max-w-[600px] p-3 text-[12px]">
                        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p class="m-0 font-heading text-[13px] font-bold">BAPPERIDA AI-RKA</p>
                          <span class="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-0.5 font-semibold text-ok-ink">
                            <span class="h-1.5 w-1.5 rounded-full bg-ok"></span>Server &amp; AI Online
                          </span>
                        </div>
                        <div role="group" aria-label="Contoh pilihan mode" class="grid gap-2 sm:grid-cols-3">
                          <button
                            v-for="m in MODES"
                            :key="m.id"
                            type="button"
                            :aria-pressed="mockMode === m.id"
                            class="pt-focus flex items-start gap-2 rounded-lg border p-2.5 text-left"
                            :class="mockMode === m.id ? 'pt-hl border-brand bg-brand-soft' : 'border-line bg-surface hover:border-line-strong'"
                            @click="mockMode = m.id"
                          >
                            <Ico :name="m.icon" :size="16" class="mt-0.5 shrink-0 text-brand" />
                            <span class="min-w-0">
                              <span class="block font-semibold text-ink">{{ m.title }}</span>
                              <span class="block text-[11px] leading-snug text-ink-3">{{ m.desc }}</span>
                            </span>
                          </button>
                        </div>
                        <p class="m-0 mt-2 rounded-md bg-inset px-3 py-2 text-ink-2" aria-live="polite">{{ activeMode.hint }}</p>
                        <p class="m-0 mt-2 text-[11px] text-ink-3">Coba klik ketiga tab di atas.</p>
                      </div>

                      <!-- 2.2 Input rincian anggaran -->
                      <div v-else-if="s.visual === 'input'" class="pt-mock w-full max-w-[540px] space-y-2 p-3 text-[12px]">
                        <div class="flex items-center justify-between">
                          <p class="m-0 font-heading text-[13px] font-bold">Dokumen RKA &amp; Input Data</p>
                          <span class="inline-flex items-center gap-1 text-ink-3"><Ico name="trash" :size="12" />Bersihkan</span>
                        </div>
                        <div class="pt-hl rounded-lg border-2 border-dashed border-line-strong bg-inset px-3 py-3 text-center">
                          <p class="m-0 font-semibold">Unggah Dokumen RKA (PDF, DOCX, XLSX, CSV, TXT, JSON)</p>
                          <p class="m-0 text-ink-3">Tarik file ke sini atau klik untuk memilih file</p>
                        </div>
                        <p class="m-0 font-semibold text-ink-2">Teks / Struktur Rincian Anggaran (RKA):</p>
                        <div class="pt-hl rounded-md border border-line-strong bg-surface p-2.5 font-mono text-[11px] leading-relaxed text-ink-2">
                          PROGRAM: Penyelenggaraan Pemerintahan<br />
                          KEGIATAN: Penyusunan Dokumen Perencanaan<br />
                          1. Honorarium Tim: Rp 85.000.000 (SBM: Rp 40.000.000)<br />
                          2. Sewa Hotel: Rp 120.000.000...
                        </div>
                      </div>

                      <!-- 2.3 Jalankan + hasil -->
                      <div v-else-if="s.visual === 'run'" class="pt-mock grid w-full max-w-[620px] gap-0 overflow-hidden text-[12px] sm:grid-cols-2">
                        <div class="space-y-2 border-b border-line p-3 sm:border-b-0 sm:border-r">
                          <p class="m-0 font-semibold text-ink-2">Instruksi Tambahan Evaluasi (Opsional):</p>
                          <div class="rounded-md border border-line-strong bg-surface px-2.5 py-2 text-ink-3">Fokus pada pos perjalanan dinas dan kepatuhan SBM</div>
                          <span class="pt-hl mt-1 flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 font-semibold text-white">
                            <Ico name="chip" :size="14" />Jalankan Evaluasi &amp; Reviu RKA
                          </span>
                        </div>
                        <div class="space-y-2 p-3">
                          <div class="flex items-center justify-between gap-2">
                            <p class="m-0 font-heading text-[12px] font-bold leading-tight">Hasil Evaluasi &amp; Rekomendasi TAPD</p>
                            <span class="pt-hl flex shrink-0 gap-1 rounded-md p-0.5 text-ink-2">
                              <span class="grid h-7 w-7 place-items-center rounded border border-line bg-inset"><Ico name="copy" :size="14" /></span>
                              <span class="grid h-7 w-7 place-items-center rounded border border-line bg-inset"><Ico name="printer" :size="14" /></span>
                            </span>
                          </div>
                          <div class="h-2 w-11/12 rounded bg-line"></div>
                          <div class="h-2 w-full rounded bg-line"></div>
                          <div class="h-2 w-4/5 rounded bg-line"></div>
                          <div class="h-2 w-10/12 rounded bg-line"></div>
                          <div class="h-2 w-2/3 rounded bg-line"></div>
                        </div>
                      </div>

                      <!-- 2.4 Chat Mode 3 -->
                      <div v-else-if="s.visual === 'chat'" class="pt-mock w-full max-w-[560px] overflow-hidden text-[12px]">
                        <div class="border-b border-line px-3 py-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Konsultasi Interaktif Perencanaan &amp; Anggaran Daerah</p>
                          <div class="mt-2 flex flex-wrap gap-1.5">
                            <span class="rounded-full border border-line bg-inset px-2.5 py-1 font-semibold text-ink-2">Geseran Belanja</span>
                            <span class="rounded-full border border-line bg-inset px-2.5 py-1 font-semibold text-ink-2">Aturan SBM</span>
                            <span class="rounded-full border border-line bg-inset px-2.5 py-1 font-semibold text-ink-2">Analisis Nilai Prakiraan Dampak</span>
                            <span class="rounded-full border border-line bg-bad-soft px-2.5 py-1 font-semibold text-bad-ink">Hapus Histori</span>
                          </div>
                        </div>
                        <div class="space-y-2.5 bg-inset p-3">
                          <div class="flex justify-end">
                            <div class="max-w-[80%] rounded-lg rounded-tr-none bg-brand px-3 py-2 text-white">
                              <p class="m-0 text-[10px] font-semibold text-white/75">Anda</p>
                              Berapa batas honorarium narasumber sesuai SBM untuk kegiatan sosialisasi di Kabupaten Cirebon?
                            </div>
                          </div>
                          <div class="flex">
                            <div class="max-w-[80%] rounded-lg rounded-tl-none border border-line bg-surface px-3 py-2">
                              <p class="m-0 text-[10px] font-semibold text-ink-3">Analis BAPPERIDA</p>
                              Sebutkan jenis narasumber dan tahun anggarannya agar batas yang dijawab sesuai.
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center gap-2 border-t border-line p-2.5">
                          <div class="pt-hl min-w-0 flex-1 truncate rounded-md border border-line-strong bg-surface px-2.5 py-2 text-ink-3">Ketik pertanyaan konsultasi seputar RKA, Permendagri 77, SIPD-RI...</div>
                          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand text-white"><Ico name="send" :size="14" /></span>
                        </div>
                      </div>

                      <!-- 3.1 Bilah atas Hasil Analisis -->
                      <div v-else-if="s.visual === 'header'" class="pt-mock w-full max-w-[600px] space-y-3 p-3 text-[12px]">
                        <div class="flex flex-wrap items-center gap-2">
                          <Ico name="trend" :size="20" class="shrink-0 text-brand" />
                          <p class="m-0 font-heading text-[13px] font-bold">Analisis Valuasi Prakiraan Dampak Program</p>
                          <span class="pt-hl ml-auto inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2 py-1">
                            <span class="text-ink-3">Versi:</span><span class="font-semibold">Versi 2</span>
                          </span>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-brand bg-brand-soft px-3 py-1.5 font-semibold text-brand"><Ico name="pencil" :size="13" />Edit Manual</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2">Edit dengan AI</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2">Unggah Ulang PDF</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2"><Ico name="download" :size="13" />Unduh Laporan</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md bg-bad px-3 py-1.5 font-semibold text-white"><Ico name="trash" :size="13" />Hapus</span>
                        </div>
                      </div>

                      <!-- 3.2 Kartu identitas + pagu -->
                      <div v-else-if="s.visual === 'hero'" class="pt-mock w-full max-w-[600px] p-4 text-[12px]">
                        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                          <div class="sm:col-span-2">
                            <p class="pt-field-label m-0">Subkeg</p>
                            <p class="m-0 mt-0.5 font-semibold">Penyusunan Dokumen Perencanaan Perangkat Daerah</p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Perangkat Daerah</p>
                            <p class="m-0 mt-0.5 font-semibold">Dinas Kesehatan</p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Tahun Anggaran</p>
                            <p class="m-0 mt-0.5 font-semibold">
                              Tahun 2026
                              <span class="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">Tahun berjalan</span>
                            </p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Program</p>
                            <p class="m-0 mt-0.5">Program Penunjang Urusan Pemerintahan Daerah Kabupaten/Kota</p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Kegiatan</p>
                            <p class="m-0 mt-0.5">Perencanaan, Penganggaran, dan Evaluasi Kinerja Perangkat Daerah</p>
                          </div>
                          <div class="pt-hl rounded-md bg-inset px-3 py-2 sm:col-span-2">
                            <p class="pt-field-label m-0">Pagu Anggaran</p>
                            <p class="m-0 mt-0.5 font-heading text-[20px] font-extrabold text-brand">Rp 250.000.000</p>
                          </div>
                        </div>
                      </div>

                      <!-- 3.3 Indikator + kesesuaian -->
                      <div v-else-if="s.visual === 'indikator'" class="pt-mock grid w-full max-w-[640px] gap-0 overflow-hidden text-[12px] sm:grid-cols-2">
                        <div class="space-y-2 border-b border-line p-3 sm:border-b-0 sm:border-r">
                          <p class="m-0 font-heading text-[12px] font-bold">Target Kinerja per Indikator</p>
                          <div v-for="k in INDIKATOR_MOCK" :key="k.nama" class="rounded-md border border-line bg-inset p-2">
                            <div class="flex items-center justify-between gap-2">
                              <span class="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">{{ k.level }}</span>
                              <span class="font-bold">{{ k.target }}</span>
                            </div>
                            <p class="m-0 mt-1 leading-snug text-ink-2">{{ k.nama }}</p>
                          </div>
                        </div>
                        <div class="space-y-2 p-3">
                          <p class="m-0 font-heading text-[12px] font-bold">Kesesuaian Anggaran Tahun 2026 dengan Target Kinerja</p>
                          <span class="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 font-semibold text-ok-ink"><Ico name="check" :size="12" />Sesuai</span>
                          <div class="pt-hl rounded-md border border-line bg-surface p-2">
                            <p class="m-0 font-semibold">Apakah anggaran ini akan menyentuh target?</p>
                            <p class="m-0 mt-1 text-ink-2">Ya. Pagu sebanding dengan target output yang dicanangkan.</p>
                          </div>
                        </div>
                      </div>

                      <!-- 3.4 Rasio Nilai Prakiraan Dampak -->
                      <div v-else-if="s.visual === 'sroi'" class="pt-mock w-full max-w-[560px] space-y-3 p-3 text-[12px]">
                        <div class="rounded-lg border border-line bg-ok-soft p-3">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="font-semibold text-ink-2">Rasio Nilai Prakiraan Dampak</span>
                            <span class="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-ok-ink">Layak</span>
                          </div>
                          <p class="pt-hl m-0 mt-1.5 inline-block px-1.5 py-0.5 font-heading text-[34px] font-extrabold leading-none text-ink">1,24</p>
                          <p class="m-0 mt-1 text-ink-2">Setiap Rp1 investasi menghasilkan Rp1,24 nilai sosial.</p>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <div v-for="c in SROI_CARDS" :key="c.label" class="rounded-md border border-line bg-inset px-2.5 py-2">
                            <p class="m-0 text-[11px] text-ink-3">{{ c.label }}</p>
                            <p class="m-0 font-bold">{{ c.value }}</p>
                          </div>
                        </div>
                        <div>
                          <div class="flex h-2.5 overflow-hidden rounded-full">
                            <span class="w-[30%] bg-bad"></span>
                            <span class="w-[30%] bg-warn"></span>
                            <span class="flex-1 bg-ok"></span>
                          </div>
                          <div class="mt-1 flex text-[11px] text-ink-2">
                            <span class="w-[30%]">Kurang (di bawah 0,6)</span>
                            <span class="w-[30%]">Cukup (0,6 sampai 0,99)</span>
                            <span class="flex-1 text-right">Layak (1,0 ke atas)</span>
                          </div>
                        </div>
                      </div>

                      <!-- 3.5 Komponen belanja -->
                      <div v-else-if="s.visual === 'belanja'" class="pt-mock w-full max-w-[600px] space-y-3 p-3 text-[12px]">
                        <div class="grid grid-cols-2 gap-3">
                          <div class="flex items-center gap-3 rounded-md border border-line bg-inset p-2.5">
                            <span class="pt-donut" style="background: conic-gradient(var(--primary-color) 0 46%, var(--info-color) 46% 72%, var(--accent-color) 72% 90%, var(--warning-color) 90% 100%)"></span>
                            <span class="font-semibold leading-snug">Komposisi belanja saat ini</span>
                          </div>
                          <div class="flex items-center gap-3 rounded-md border border-line bg-inset p-2.5">
                            <span class="pt-donut" style="background: conic-gradient(var(--primary-color) 0 34%, var(--info-color) 34% 68%, var(--accent-color) 68% 88%, var(--warning-color) 88% 100%)"></span>
                            <span class="font-semibold leading-snug">Setelah rekomendasi belanja</span>
                          </div>
                        </div>
                        <div class="overflow-hidden rounded-md border border-line">
                          <div class="grid grid-cols-[1fr_auto_auto] gap-x-3 bg-inset px-3 py-1.5 text-[11px] font-semibold text-ink-3">
                            <span>Rekening belanja</span><span class="text-right">Alokasi</span><span class="text-right">Dikurangi</span>
                          </div>
                          <div v-for="r in BELANJA_MOCK" :key="r.nama" class="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-t border-line px-3 py-2">
                            <span class="min-w-0">
                              <span class="block truncate font-semibold">{{ r.nama }}</span>
                              <span
                                class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                                :class="r.efisien ? 'bg-ok-soft text-ok-ink' : 'bg-bad-soft text-bad-ink'"
                              >{{ r.efisien ? 'Efisien' : 'Inefisien' }}</span>
                            </span>
                            <span class="text-right">{{ r.alokasi }}</span>
                            <span class="text-right font-semibold" :class="r.efisien ? 'text-ink-3' : 'text-bad-ink'">{{ r.kurang }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- 3.6 Edit Modal & AI visual -->
                      <div v-else-if="s.visual === 'edit-modal'" class="pt-mock w-full max-w-[560px] overflow-hidden text-[12px]">
                        <div class="flex items-center justify-between border-b border-line bg-inset px-3 py-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Modal Perbaikan &amp; Edit Analysis</p>
                          <span class="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">Edit Manual / AI</span>
                        </div>
                        <div class="space-y-2.5 p-3">
                          <div class="flex flex-wrap gap-1.5">
                            <span class="pt-hl rounded-md bg-brand px-2.5 py-1 font-semibold text-white">Identitas &amp; Pagu</span>
                            <span class="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">Indikator Kinerja</span>
                            <span class="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">Komponen Belanja</span>
                            <span class="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">Parameter SROI</span>
                          </div>
                          <div class="space-y-2 rounded-md border border-line bg-surface p-2.5">
                            <div>
                              <span class="block text-[11px] font-semibold text-ink-3">Nama Perangkat Daerah (OPD)</span>
                              <div class="pt-hl rounded border border-line bg-inset px-2 py-1 font-semibold text-ink">Dinas Kesehatan Kab. Cirebon</div>
                            </div>
                            <div>
                              <span class="block text-[11px] font-semibold text-ink-3">Pagu Anggaran Subkegiatan (Rp)</span>
                              <div class="rounded border border-line bg-inset px-2 py-1 font-semibold text-ink">250.000.000</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 3.7 Unduh & ekspor -->
                      <div v-else-if="s.visual === 'export'" class="pt-mock w-full max-w-[540px] space-y-3 p-3 text-[12px]">
                        <div>
                          <p class="m-0 mb-1.5 font-semibold text-ink-3">Di halaman Hasil Analisis</p>
                          <div class="flex flex-wrap items-center gap-3">
                            <span class="pt-hl inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold"><Ico name="download" :size="13" />Unduh Laporan</span>
                            <Ico name="arrow" :size="16" class="text-ink-3" />
                            <span class="inline-flex min-w-0 items-center gap-2 rounded-md border border-line bg-inset px-3 py-1.5">
                              <Ico name="file" :size="14" class="shrink-0 text-accent" />
                              <span class="truncate">Hasil_Analisis_SROI_Dinas_Kesehatan.html</span>
                            </span>
                          </div>
                        </div>
                        <div class="border-t border-line pt-3">
                          <p class="m-0 mb-1.5 font-semibold text-ink-3">Di halaman Arsip Dokumen RKA</p>
                          <div class="flex flex-wrap gap-2">
                            <span class="pt-hl inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-semibold text-white"><Ico name="download" :size="13" />Ekspor Full Database (JSON)</span>
                            <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2">Backup &amp; Pemulihan</span>
                          </div>
                        </div>
                      </div>

                      <!-- 4.1 Visual Arsip Dokumen -->
                      <div v-else-if="s.visual === 'archive'" class="pt-mock w-full max-w-[620px] overflow-hidden p-3 text-[12px] space-y-2.5">
                        <div class="flex items-center justify-between gap-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Arsip Dokumen RKA SKPD</p>
                          <div class="pt-hl flex w-48 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-ink-3">
                            <Ico name="search" :size="13" /><span>Cari OPD / Subkeg...</span>
                          </div>
                        </div>
                        <div class="overflow-hidden rounded-md border border-line">
                          <div class="grid grid-cols-[1fr_auto_auto_auto] gap-2 bg-inset px-3 py-1.5 text-[11px] font-bold text-ink-3">
                            <span>Subkegiatan / OPD</span><span>Pagu</span><span>SROI</span><span>Aksi</span>
                          </div>
                          <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-t border-line bg-surface px-3 py-2">
                            <div>
                              <p class="m-0 truncate font-bold">Penyusunan Perencanaan RKA</p>
                              <p class="m-0 text-[10px] text-ink-3">Dinas Kesehatan • 2026</p>
                            </div>
                            <span class="font-semibold">250 Jt</span>
                            <span class="rounded bg-ok-soft px-1.5 py-0.5 font-bold text-ok-ink">1,24</span>
                            <span class="pt-hl rounded bg-brand px-2 py-1 text-[11px] font-bold text-white">Lihat</span>
                          </div>
                        </div>
                      </div>

                      <!-- 4.2 Form Laporan -->
                      <div v-else-if="s.visual === 'report-form'" class="pt-mock w-full max-w-[520px] space-y-2.5 p-3 text-[12px]">
                        <div class="border-b border-line pb-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Formulir Laporan Kendala Pengguna</p>
                          <p class="m-0 text-[11px] text-ink-3">Kirim masukan atau bantuan jika menu tertentu nonaktif</p>
                        </div>
                        <div class="space-y-2">
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Subjek Kendala</p>
                            <div class="rounded border border-line bg-surface px-2.5 py-1.5 text-ink-2">Permohonan Pengaktifan Menu Unggah RKA</div>
                          </div>
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Rincian Laporan</p>
                            <div class="pt-hl rounded border border-line bg-surface px-2.5 py-2 text-ink-3">Mohon aktifkan kembali menu Unggah RKA untuk evaluasi RKA Diskes...</div>
                          </div>
                          <span class="pt-hl inline-block rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Kirim Laporan ke Admin</span>
                        </div>
                      </div>

                      <!-- 5.1 Admin Stats -->
                      <div v-else-if="s.visual === 'admin-stats'" class="pt-mock w-full max-w-[600px] space-y-3 p-3 text-[12px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <span class="flex items-center gap-1.5 font-heading text-[13px] font-bold text-brand">
                            <Ico name="shield" :size="16" />Dasbor Admin &amp; Monitoring Server
                          </span>
                          <span class="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-extrabold text-brand">Role: Admin</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                          <div class="rounded-md border border-line bg-surface p-2">
                            <p class="m-0 text-[10px] font-semibold text-ink-3">Total User</p>
                            <p class="m-0 font-bold text-[14px]">18 User</p>
                          </div>
                          <div class="rounded-md border border-line bg-surface p-2">
                            <p class="m-0 text-[10px] font-semibold text-ink-3">Penyimpanan DB</p>
                            <p class="m-0 font-bold text-[14px] text-ok-ink">42% (Normal)</p>
                          </div>
                          <div class="rounded-md border border-line bg-surface p-2">
                            <p class="m-0 text-[10px] font-semibold text-ink-3">Ambang Rotasi</p>
                            <p class="m-0 font-bold text-[14px] text-warn-ink">85% Limit</p>
                          </div>
                        </div>
                        <div class="rounded-md border border-line bg-inset p-2">
                          <div class="mb-1 flex justify-between text-[11px] font-semibold">
                            <span>Status Kapasitas Storage Failover</span>
                            <span class="font-bold text-ok-ink">2.1 GB / 5.0 GB</span>
                          </div>
                          <div class="h-2 overflow-hidden rounded-full bg-line">
                            <div class="h-full w-[42%] bg-brand"></div>
                          </div>
                        </div>
                      </div>

                      <!-- 5.2 Admin Users -->
                      <div v-else-if="s.visual === 'admin-users'" class="pt-mock w-full max-w-[560px] space-y-2.5 p-3 text-[12px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Manajemen Akun &amp; Role Pengguna</p>
                          <span class="pt-hl rounded bg-brand px-2 py-1 text-[11px] font-semibold text-white">+ Tambah User</span>
                        </div>
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <div>
                              <p class="m-0 font-bold">admin_bapperida <span class="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-extrabold text-brand">Admin</span></p>
                              <p class="m-0 text-[10px] text-ink-3">Akses penuh sistem &amp; audit</p>
                            </div>
                            <span class="rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-bold text-ok-ink">Aktif</span>
                          </div>
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <div>
                              <p class="m-0 font-bold">evaluator_diskes <span class="rounded border border-line bg-inset px-1.5 py-0.5 text-[10px] font-bold text-ink-2">User</span></p>
                              <p class="m-0 text-[10px] text-ink-3">Operator OPD Dinas Kesehatan</p>
                            </div>
                            <span class="rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-bold text-ok-ink">Aktif</span>
                          </div>
                        </div>
                      </div>

                      <!-- 5.3 Admin Menu Toggle -->
                      <div v-else-if="s.visual === 'admin-menu'" class="pt-mock w-full max-w-[540px] space-y-2.5 p-3 text-[12px]">
                        <div class="border-b border-line pb-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Kontrol Sakelar Akses Menu Global</p>
                          <p class="m-0 text-[11px] text-ink-3">Aktifkan atau batasi fitur aplikasi untuk role biasa</p>
                        </div>
                        <div class="space-y-2">
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <span class="font-semibold">Unggah Berkas RKA</span>
                            <span class="pt-hl rounded-full bg-brand px-3 py-1 text-[10px] font-extrabold text-white">Aktif</span>
                          </div>
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <span class="font-semibold text-ink-3">Simulasi Percakapan Agen AI</span>
                            <span class="rounded-full bg-bad-soft px-3 py-1 text-[10px] font-extrabold text-bad-ink">Nonaktif</span>
                          </div>
                        </div>
                      </div>

                      <!-- 5.4 Admin Config -->
                      <div v-else-if="s.visual === 'admin-config'" class="pt-mock w-full max-w-[560px] space-y-2.5 p-3 text-[12px]">
                        <div class="border-b border-line pb-2">
                          <p class="m-0 font-heading text-[13px] font-bold">Konfigurasi Kunci API &amp; Database Remote</p>
                          <p class="m-0 text-[11px] text-ink-3">Atur kredensial Gemini API Key &amp; PostgreSQL Neon</p>
                        </div>
                        <div class="space-y-2">
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Gemini API Key (Google AI Studio)</p>
                            <div class="pt-hl rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px]">AIzaSyB...********************</div>
                          </div>
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Database Neon Connection String</p>
                            <div class="truncate rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-[10px] text-ink-3">postgresql://neondb_owner:***@ep-cool-base-1234.us-east-2.aws.neon.tech/neondb</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <figcaption class="absolute bottom-2 right-3 text-[11px] font-semibold text-ink-3">{{ s.caption }}</figcaption>
                </figure>

                <!-- Nomor besar + judul langkah + rincian -->
                <div class="flex gap-3 px-4 py-6 sm:gap-5 sm:px-6">
                  <span class="w-10 shrink-0 font-heading text-[3.25rem] font-extrabold leading-[0.9] text-brand sm:w-14 sm:text-[3.75rem]" aria-hidden="true">{{ s.no }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="m-0 max-w-[68ch] text-[17px] font-normal leading-7 text-ink-2">
                      <strong class="font-bold text-ink" v-html="rich(s.title)"></strong>
                      <span v-html="' ' + rich(s.text)"></span>
                    </p>
                    <ul class="m-0 mt-3 max-w-[68ch] list-disc space-y-2 pl-5 text-[15px] leading-7 text-ink-2 marker:text-accent">
                      <li v-for="(b, bi) in s.bullets" :key="bi" class="pl-1" v-html="rich(b)"></li>
                    </ul>
                  </div>
                </div>
              </li>
            </ol>

            <!-- Penutup bagian -->
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-inset px-4 py-4 sm:px-6">
              <button
                type="button"
                class="pt-focus inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                @click="emit('navigate', part.cta.tab)"
              >
                {{ part.cta.label }}
              </button>
              <button
                v-if="part.next && !hasQuery"
                type="button"
                class="pt-focus inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
                @click="goTo(part.next)"
              >
                Lanjut ke Bagian {{ part.no + 1 }}
                <Ico name="arrow" :size="16" />
              </button>
            </div>
          </section>

          <!-- Hasil pencarian kosong -->
          <section v-if="hasQuery && !visibleParts.length" class="rounded-xl border border-line bg-surface px-6 py-12 text-center">
            <Ico name="search" :size="32" class="mx-auto text-ink-3" />
            <h3 class="m-0 mt-3 font-heading text-xl font-extrabold">Tidak ada langkah yang cocok</h3>
            <p class="m-0 mx-auto mt-2 max-w-[46ch] text-[15px] leading-7 text-ink-2">
              Tidak ada panduan yang memuat “{{ query.trim() }}”. Coba kata lain, misalnya
              <template v-for="(k, ki) in SUGGESTIONS" :key="k"><button type="button" class="pt-focus rounded font-semibold text-brand underline" @click="query = k">{{ k }}</button><span v-if="ki < SUGGESTIONS.length - 1">, </span></template>.
            </p>
            <button type="button" class="pt-focus mt-5 rounded-lg border border-line-strong bg-inset px-4 py-2 text-sm font-semibold" @click="clearSearch">Hapus pencarian</button>
          </section>
        </main>

        <!-- ── Sidebar kanan ───────────────────────────────────────────── -->
        <aside class="space-y-4 p-1 lg:sticky lg:top-[86px] lg:max-h-[calc(100vh-102px)] lg:overflow-y-auto" aria-label="Informasi tambahan">
          <!-- Daftar isi -->
          <nav class="rounded-xl border border-line bg-surface p-4" aria-labelledby="pt-toc-judul">
            <h3 id="pt-toc-judul" class="m-0 flex items-center gap-2 font-heading text-base font-extrabold">
              <Ico name="list" :size="18" class="text-brand" />Daftar isi
            </h3>
            <p v-if="!visibleParts.length" class="m-0 mt-3 text-sm text-ink-3">Tidak ada langkah yang cocok.</p>
            <div v-for="part in visibleParts" :key="part.id" class="mt-3">
              <button
                type="button"
                class="pt-focus flex w-full items-start gap-2 rounded-md py-1 text-left text-sm font-bold"
                :class="activePartId === part.id ? 'text-brand' : 'text-ink'"
                @click="goTo(part.id)"
              >
                <span class="shrink-0">Bagian {{ part.no }}.</span>
                <span class="min-w-0">{{ part.title }}</span>
              </button>
              <ul v-show="hasQuery || activePartId === part.id" class="m-0 mt-1 list-none space-y-0.5 p-0">
                <li v-for="s in part.steps" :key="s.id">
                  <button
                    type="button"
                    class="pt-focus w-full rounded-r-md border-l-2 py-1 pl-3 pr-2 text-left text-[13px] leading-5"
                    :class="activeId === s.id ? 'border-brand bg-brand-soft font-semibold text-ink' : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'"
                    :aria-current="activeId === s.id ? 'step' : undefined"
                    @click="goTo(s.id)"
                  >
                    {{ s.no }}. {{ s.short }}
                  </button>
                </li>
              </ul>
            </div>
            <button
              type="button"
              class="pt-focus mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-inset px-3 py-2.5 text-sm font-semibold hover:border-line-strong disabled:cursor-wait disabled:opacity-60"
              :disabled="!!pdfBusy"
              @click="downloadPdf('all')"
            >
              <Ico name="file" :size="16" class="text-accent" />
              {{ pdfBusy === 'all' ? 'Menyiapkan PDF...' : 'Unduh panduan lengkap (PDF)' }}
            </button>
          </nav>

          <!-- Catatan penting -->
          <section class="rounded-xl border border-line border-l-4 border-l-accent bg-surface p-4" aria-labelledby="pt-catatan-judul">
            <h3 id="pt-catatan-judul" class="m-0 flex items-center gap-2 font-heading text-base font-extrabold">
              <Ico name="info" :size="18" class="text-accent" />Catatan penting
            </h3>
            <ul class="m-0 mt-3 list-disc space-y-2 pl-5 text-[13px] leading-5 text-ink-2 marker:text-accent">
              <li v-for="n in CATATAN" :key="n">{{ n }}</li>
            </ul>
          </section>

          <!-- Format dan batas berkas -->
          <section class="rounded-xl border border-line bg-surface p-4" aria-labelledby="pt-batas-judul">
            <h3 id="pt-batas-judul" class="m-0 flex items-center gap-2 font-heading text-base font-extrabold">
              <Ico name="file" :size="18" class="text-brand" />Format dan batas berkas
            </h3>
            <dl class="m-0 mt-3 space-y-3 text-[13px] leading-5">
              <div v-for="f in FORMAT_CARDS" :key="f.menu">
                <dt class="font-bold text-ink">{{ f.menu }}</dt>
                <dd class="m-0 mt-0.5 text-ink-2">{{ f.format }}</dd>
                <dd class="m-0 text-ink-2">{{ f.batas }}</dd>
              </div>
            </dl>
          </section>

          <!-- Bantuan lain -->
          <section class="rounded-xl border border-line bg-surface p-4" aria-labelledby="pt-bantuan-judul">
            <h3 id="pt-bantuan-judul" class="m-0 font-heading text-base font-extrabold">Belum menemukan jawabannya?</h3>
            <div class="mt-3 flex flex-col gap-2">
              <button type="button" class="pt-focus flex items-center justify-between rounded-lg border border-line bg-inset px-3 py-2.5 text-left text-sm font-semibold hover:border-line-strong" @click="emit('navigate', 'faq')">
                Bantuan &amp; Pertanyaan<Ico name="arrow" :size="16" class="text-ink-3" />
              </button>
              <button type="button" class="pt-focus flex items-center justify-between rounded-lg border border-line bg-inset px-3 py-2.5 text-left text-sm font-semibold hover:border-line-strong" @click="emit('navigate', 'report')">
                Kirim laporan ke admin<Ico name="arrow" :size="16" class="text-ink-3" />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PageHero from './PageHero.vue';
import { useAnalysis } from '../composables/useAnalysis';

const emit = defineEmits(['navigate']);
const { showNotification } = useAnalysis();

/* ── Ikon (SVG inline bergaya Lucide; tanpa dependensi) ───────────────── */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  upload: '<path d="M12 13v8"/><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="m8 17 4-4 4 4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  chip: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>'
};
const Ico = (props) =>
  h('svg', {
    width: props.size || 16,
    height: props.size || 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    innerHTML: ICONS[props.name] || ''
  });
Ico.props = ['name', 'size'];

/* ── Isi panduan ──────────────────────────────────────────────────────────
   Teks: **tebal**. Tiap langkah: title (kalimat tebal), text (lanjutan), bullets (rincian),
   visual (kunci ilustrasi di template), caption/alt (teks gambar), img (opsional: tangkapan layar). */
const RAW_PARTS = [
  {
    id: 'bagian-1',
    title: 'Ringkasan Sistem & Unggah Dokumen RKA',
    lead: 'Dasbor Utama memberikan gambaran kesiapan sistem. Unggah berkas RKA berformat PDF untuk dianalisis oleh ASI DARA.',
    cta: { label: 'Buka Dasbor & Unggah Berkas RKA', tab: 'dashboard' },
    next: 'bagian-2',
    steps: [
      {
        id: 'b1-langkah-1',
        short: 'Periksa Dasbor Utama',
        title: 'Periksa status kesiapan sistem pada Dasbor Utama.',
        text: 'Buka menu **Dasbor Utama** untuk melihat indikator kesiapan model AI, total dokumen tersimpan, dan kecepatan analisis.',
        bullets: [
          'Kartu **Model Gemini 2.5 Flash** menandai status hijau bila server AI siap memproses.',
          'Kartu **Arsip Dokumen RKA** menampilkan jumlah dokumen RKA yang tersimpan di sistem.',
          'Kartu **Kecepatan Analisis AI** menginfokan waktu pemrosesan rata-rata per dokumen.',
          'Klik banner **Mulai Analisis** untuk langsung menuju halaman analisis.'
        ],
        visual: 'main-dash',
        caption: 'Dasbor Utama & Status Sistem',
        alt: 'Tampilan Dasbor Utama dengan kartu status Gemini 2.5 Flash, jumlah arsip dokumen, dan banner mulai analisis.',
        keywords: 'dasbor utama status gemini flash arsip dokumen kecepatan analisis siap banner',
        img: null
      },
      {
        id: 'b1-langkah-2',
        short: 'Siapkan berkas PDF',
        title: 'Siapkan berkas RKA berformat PDF.',
        text: 'Menu **Unggah Berkas RKA** hanya menerima dokumen RKA/DPA SKPD Kabupaten Cirebon dalam bentuk PDF.',
        bullets: [
          'Gunakan PDF digital asli yang teksnya bisa diseleksi, bukan foto atau hasil scan.',
          'Ukuran maksimal **100 MB** per berkas. Berkas kosong (0 byte) atau format XLSX/DOCX di menu ini akan ditolak.',
          'Untuk berkas Excel (XLSX) atau Word (DOCX), gunakan menu **Simulasi Percakapan Agen AI**.'
        ],
        visual: 'files',
        caption: 'Format berkas RKA',
        alt: 'Contoh daftar berkas: PDF RKA diterima, sedangkan berkas XLSX dan foto ditolak.',
        keywords: 'format pdf xlsx excel docx ukuran batas 100 mb persiapan siapkan berkas foto pindai scan',
        img: null
      },
      {
        id: 'b1-langkah-3',
        short: 'Pilih & unggah berkas',
        title: 'Buka menu Unggah Berkas RKA dan pantau pemrosesan.',
        text: 'Klik **Unggah Berkas RKA** di sidebar kiri. Klik **Pilih Dokumen RKA** atau tarik berkas PDF ke area unggah.',
        bullets: [
          'Beberapa berkas bisa dipilih sekaligus untuk diproses secara otomatis.',
          'Tunggu hingga status antrean mencapai 100% pada semua dokumen.',
          'Jangan menutup atau memuat ulang halaman selama antrean berjalan.'
        ],
        visual: 'dropzone',
        caption: 'Menu Unggah Berkas RKA',
        alt: 'Tampilan menu Unggah Berkas RKA dengan tombol Pilih Dokumen RKA di dalam kotak unggah.',
        keywords: 'unggah upload menu sidebar pilih dokumen tarik drop drag banyak berkas sekaligus nonaktif antrean',
        img: null
      },
      {
        id: 'b1-langkah-4',
        short: 'Verifikasi OPD & Pagu',
        title: 'Verifikasi nama Perangkat Daerah (OPD) dan Pagu.',
        text: 'ASI DARA membaca nama Perangkat Daerah dan Pagu Anggaran secara otomatis dari dokumen RKA.',
        bullets: [
          'Periksa nama OPD dan Pagu pada kartu header di halaman **Hasil Analisis**.',
          'Jika nama terbaca keliru, klik **Edit Manual**, buka bagian **Identitas & Pagu**, lalu sesuaikan kolom OPD.',
          'Anda juga dapat memilih **Unggah Ulang PDF** (maksimal 25 MB) untuk menganalisis ulang dokumen.'
        ],
        visual: 'opd',
        caption: 'Edit Manual, Identitas & Pagu',
        alt: 'Layar Edit Manual pada bagian Identitas dan Pagu, dengan kolom Perangkat Daerah (OPD) ditandai.',
        keywords: 'opd perangkat daerah skpd satuan kerja pilih ubah koreksi salah edit manual unggah ulang pagu',
        img: null
      }
    ]
  },
  {
    id: 'bagian-2',
    title: 'Menggunakan Simulasi Percakapan Agen AI',
    lead: 'Asisten AI interaktif untuk evaluasi RKA, revisi anggaran, dan konsultasi regulasi. Buka lewat menu Simulasi Percakapan Agen AI.',
    cta: { label: 'Buka Simulasi Percakapan Agen AI', tab: 'agentic-ai' },
    next: 'bagian-3',
    steps: [
      {
        id: 'b2-langkah-1',
        short: 'Pilih mode kerja',
        title: 'Buka Simulasi Percakapan Agen AI dan pilih mode kerja.',
        text: 'Pilih salah satu dari 3 mode kerja sesuai kebutuhan analisis Anda.',
        bullets: [
          '**Mode 1 - Analis Evaluasi RKA:** Menguji kepatuhan SBM, efisiensi anggaran, dan Nilai Prakiraan Dampak.',
          '**Mode 2 - Eksekutor Revisi RKA:** Rasionalisasi pagu dan menyusun draf DPA baru.',
          '**Mode 3 - Konsultasi Regulasi:** Tanya jawab seputar Permendagri 77, SIPD-RI, dan SSH.',
          'Pastikan status lencana di pojok atas menunjukkan **Server & AI Online**.'
        ],
        visual: 'modes',
        caption: 'Tiga mode kerja Agentic AI',
        alt: 'Tiga tab mode: Mode 1 Analis Evaluasi RKA, Mode 2 Eksekutor Revisi RKA, Mode 3 Konsultasi Regulasi.',
        keywords: 'chatbot ai agen mode 1 mode 2 mode 3 tab evaluasi revisi konsultasi regulasi server online',
        img: null
      },
      {
        id: 'b2-langkah-2',
        short: 'Input rincian anggaran',
        title: 'Masukkan data RKA via berkas atau tempel teks.',
        text: 'Pada Mode 1 dan Mode 2, Anda dapat mengunggah berkas atau menempelkan rincian anggaran.',
        bullets: [
          'Dukungan format berkas: PDF, DOCX, XLSX, XLS, CSV, TXT, dan JSON (maksimal **20 MB** per berkas).',
          'Teks rincian anggaran diekstrak otomatis ke kotak teks.',
          'Gunakan tombol **Contoh RKA** untuk mengisi data sampel secara instan.',
          'Klik **Bersihkan** untuk mengosongkan semua area input.'
        ],
        visual: 'input',
        caption: 'Panel Dokumen RKA & Input Data',
        alt: 'Panel input: kotak unggah dokumen dan kotak teks rincian anggaran berisi contoh program, kegiatan, dan rekening.',
        keywords: 'teks tempel paste rincian anggaran xlsx excel docx csv txt json 20 mb unggah contoh rka bersihkan',
        img: null
      },
      {
        id: 'b2-langkah-3',
        short: 'Jalankan & ekspor hasil',
        title: 'Tulis instruksi tambahan, jalankan, lalu ekspor hasilnya.',
        text: 'Tombol pemrosesan aktif setelah rincian anggaran terisi.',
        bullets: [
          'Mode 1: Isi **Instruksi Tambahan Evaluasi**, lalu klik **Jalankan Evaluasi & Reviu RKA**.',
          'Mode 2: Isi **Arahan Pemangkasan**, misal *"Pangkas honorarium tim 50%"*, lalu klik **Eksekusi & Generate Revisi RKA**.',
          'Gunakan ikon **Salin** untuk menyalin teks (Markdown) atau ikon **Cetak** untuk mengekspor ke PDF.'
        ],
        visual: 'run',
        caption: 'Jalankan dan hasil evaluasi/revisi',
        alt: 'Kolom instruksi dengan tombol Jalankan Evaluasi dan Reviu RKA, serta panel hasil dengan ikon salin dan cetak.',
        keywords: 'jalankan evaluasi reviu revisi eksekusi generate instruksi arahan pangkas salin copy cetak print pdf',
        img: null
      },
      {
        id: 'b2-langkah-4',
        short: 'Konsultasi Mode 3',
        title: 'Gunakan Mode 3 untuk bertanya seputar regulasi.',
        text: 'Ketik pertanyaan pada kolom obrolan interaktif.',
        bullets: [
          'Klik tombol cepat seperti **Geseran Belanja**, **Aturan SBM**, atau **Analisis Dampak**.',
          'Sebutkan nama subkegiatan, OPD, dan tahun anggaran agar jawaban akurat.',
          'Gunakan **Hapus Histori** jika ingin memulai sesi baru.'
        ],
        visual: 'chat',
        caption: 'Mode 3: Konsultasi Regulasi',
        alt: 'Percakapan Mode 3 dengan tombol pertanyaan cepat, gelembung obrolan, dan kolom pengetikan pesan.',
        keywords: 'konsultasi tanya jawab chat obrolan pertanyaan permendagri 77 ssh sbm geseran belanja hapus histori',
        img: null
      }
    ]
  },
  {
    id: 'bagian-3',
    title: 'Membaca & Mengedit Hasil Analisis',
    lead: 'Halaman Hasil Analisis menampilkan valuasi SROI, rasionalisasi belanja, serta fitur perbaikan manual/AI.',
    cta: { label: 'Buka Hasil Analisis', tab: 'analyzer' },
    next: 'bagian-4',
    steps: [
      {
        id: 'b3-langkah-1',
        short: 'Buka Hasil Analisis',
        title: 'Buka halaman Hasil Analisis & kelola versi.',
        text: 'Setelah antrean selesai, buka menu **Hasil Analisis** atau klik **Lihat Analisis** pada Arsip Dokumen RKA.',
        bullets: [
          'Pilih iterasi dokumen pada dropdown **Versi** bila memiliki beberapa draf revisi.',
          'Tombol aksi atas: **Edit Manual**, **Edit dengan AI**, **Unggah Ulang PDF**, **Unduh Laporan**, dan **Hapus**.'
        ],
        visual: 'header',
        caption: 'Bilah atas Hasil Analisis',
        alt: 'Bilah atas halaman Hasil Analisis dengan pilihan versi dan tombol Edit Manual, Edit dengan AI, Unggah Ulang PDF, Unduh Laporan, Hapus.',
        keywords: 'hasil analisis arsip lihat analisis versi tombol edit hapus buka dokumen',
        img: null
      },
      {
        id: 'b3-langkah-2',
        short: 'Identitas & Indikator',
        title: 'Periksa identitas, pagu, dan indikator kinerja.',
        text: 'Kartu header memuat rincian OPD, program, kegiatan, subkegiatan, dan total pagu.',
        bullets: [
          'Tinjau **Target Kinerja per Indikator** untuk melihat tolok ukur outcome dan output.',
          'Bagian **Kesesuaian Anggaran** menilai kecukupan pagu terhadap target output.'
        ],
        visual: 'hero',
        caption: 'Kartu identitas & pagu RKA',
        alt: 'Kartu identitas dokumen berisi subkegiatan, perangkat daerah, program, kegiatan, tahun anggaran, dan pagu anggaran.',
        keywords: 'pagu anggaran identitas subkeg program kegiatan tahun anggaran perangkat daerah indikator target',
        img: null
      },
      {
        id: 'b3-langkah-3',
        short: 'Pahami Nilai SROI',
        title: 'Pahami Rasio Nilai Prakiraan Dampak (SROI).',
        text: 'Rasio SROI mengukur perbandingan total dampak sosial bersih terhadap pagu anggaran.',
        bullets: [
          '**Layak (\u2265 1,0 - Hijau):** Dampak sosial bernilai lebih tinggi dari pagu anggaran.',
          '**Cukup (0,6 \u2013 0,99 - Kuning):** Dampak sosial sebanding dengan anggaran.',
          '**Kurang (< 0,6 - Merah):** Anggaran kurang efisien dalam menghasilkan dampak.',
          'Faktor penyesuaian: deadweight (maks 40%), attribution, displacement, drop-off, dan discount rate.'
        ],
        visual: 'sroi',
        caption: 'Rasio Nilai Prakiraan Dampak (SROI)',
        alt: 'Kartu rasio Nilai Prakiraan Dampak bernilai 1,24 berstatus Layak, empat kartu nilai rupiah, dan skala kurang, cukup, layak.',
        keywords: 'sroi nilai prakiraan dampak rasio layak cukup kurang deadweight attribution displacement drop-off discount rate',
        img: null
      },
      {
        id: 'b3-langkah-4',
        short: 'Rekomendasi Belanja',
        title: 'Tinjau rekomendasi komposisi belanja.',
        text: 'Diagram dan tabel belanja menampilkan usulan realokasi anggaran.',
        bullets: [
          'Diagram lingkaran membandingkan struktur belanja sebelum dan sesudah rekomendasi.',
          'Tabel rekening merinci status **Efisien** atau **Inefisien** serta besaran pengurangan.'
        ],
        visual: 'belanja',
        caption: 'Komponen & rekomendasi belanja',
        alt: 'Dua diagram lingkaran komposisi belanja dan tabel rekening dengan status efisien atau inefisien.',
        keywords: 'rekomendasi belanja komponen diagram pie rekening efisien inefisien alokasi dikurangi realokasi',
        img: null
      },
      {
        id: 'b3-langkah-5',
        short: 'Edit Manual & Edit AI',
        title: 'Gunakan Edit Manual, Edit AI, atau Unggah Ulang PDF.',
        text: 'Perbarui data analisis jika terdapat kekeliruan atau penyesuaian anggaran.',
        bullets: [
          '**Edit Manual:** Membuka dialog untuk mengedit Identitas & Pagu, Indikator, Belanja, dan SROI.',
          '**Edit dengan AI:** Memasukkan prompt ke AI untuk menyesuaikan analisis secara otomatis.',
          '**Unggah Ulang PDF:** Mengunggah berkas PDF baru (maks 25 MB) untuk membentuk versi baru.'
        ],
        visual: 'edit-modal',
        caption: 'Modal Edit Manual & Edit AI',
        alt: 'Tampilan modal Edit Manual dengan tab Identitas & Pagu, Indikator Kinerja, Komponen Belanja, Parameter SROI.',
        keywords: 'edit manual edit ai prompt unggah ulang pdf versi baru modal dialog perbaiki data',
        img: null
      },
      {
        id: 'b3-langkah-6',
        short: 'Unduh Laporan HTML/PDF',
        title: 'Unduh laporan analisis interaktif.',
        text: 'Klik **Unduh Laporan** untuk menyimpan dokumen hasil analisis.',
        bullets: [
          'Laporan diunduh dalam format berkas HTML interaktif.',
          'Untuk konversi ke PDF, buka berkas HTML di browser lalu tekan **Ctrl+P \u2192 Simpan sebagai PDF**.'
        ],
        visual: 'export',
        caption: 'Unduh Laporan HTML & PDF',
        alt: 'Tombol Unduh Laporan menghasilkan berkas HTML yang dapat dicetak menjadi PDF.',
        keywords: 'unduh download laporan html pdf cetak simpan ekspor',
        img: null
      }
    ]
  },
  {
    id: 'bagian-4',
    title: 'Arsip Dokumen, Cadangan & Laporan',
    lead: 'Kelola arsip RKA, lakukan pencarian data, ekspor database JSON/Zip, dan kirim laporan kendala.',
    cta: { label: 'Buka Arsip Dokumen RKA', tab: 'history' },
    next: 'bagian-5',
    steps: [
      {
        id: 'b4-langkah-1',
        short: 'Cari & Filter Arsip',
        title: 'Cari dan kelola dokumen pada Arsip Dokumen RKA.',
        text: 'Semua dokumen RKA yang pernah diolah tersimpan di menu **Arsip Dokumen RKA**.',
        bullets: [
          'Cari dokumen berdasarkan nama OPD, Subkegiatan, atau Tahun Anggaran.',
          'Tabel merinci Pagu, Rasio SROI, Jumlah Versi, serta tanggal pembuatan.',
          'Klik **Lihat Analisis** untuk membuka rincian dokumen.'
        ],
        visual: 'archive',
        caption: 'Daftar Arsip Dokumen RKA',
        alt: 'Tabel arsip dokumen RKA dengan kolom pencarian, pagu, rasio SROI, dan tombol aksi.',
        keywords: 'arsip dokumen rka pencarian filter opd subkegiatan tahun riwayat lihat analisis',
        img: null
      },
      {
        id: 'b4-langkah-2',
        short: 'Ekspor JSON & Backup',
        title: 'Ekspor database JSON dan lakukan backup/restore.',
        text: 'Amankan data perencanaan dengan fitur ekspor dan pemulihan.',
        bullets: [
          'Klik **Ekspor Full Database (JSON)** untuk mengunduh seluruh data arsip.',
          'Gunakan menu **Backup & Pemulihan** untuk mengimpor atau menggabungkan file cadangan (Zip/JSON).'
        ],
        visual: 'export',
        caption: 'Ekspor Database & Pemulihan',
        alt: 'Tombol Ekspor Full Database JSON dan Backup & Pemulihan pada halaman Arsip.',
        keywords: 'ekspor database json backup restore cadangan pemulihan zip simpan data',
        img: null
      },
      {
        id: 'b4-langkah-3',
        short: 'Kirim Laporan Kendala',
        title: 'Kirim laporan jika mengalami kendala atau menu nonaktif.',
        text: 'Jika sakelar menu dinonaktifkan oleh Admin, gunakan menu **Laporan**.',
        bullets: [
          'Buka menu **Laporan** atau klik tautan bantuan pada lencana **Nonaktif**.',
          'Isi formulir laporan kendala, sertakan rincian masalah dan lampiran bila ada.',
          'Laporan akan dikirim langsung ke Dasbor Admin.'
        ],
        visual: 'report-form',
        caption: 'Formulir Laporan Kendala',
        alt: 'Formulir kirim laporan kendala dengan isian subjek, rincian masalah, dan tombol kirim.',
        keywords: 'laporan kendala masukan menu nonaktif bantuan admin kirim pesan formulir',
        img: null
      }
    ]
  },
  {
    id: 'bagian-5',
    title: 'Panduan Khusus Admin & Audit System',
    lead: 'Dasbor khusus Administrator & Moderator untuk mengelola user, status rotasi storage 85%, sakelar menu, dan API Gemini.',
    cta: { label: 'Buka Dasbor Admin', tab: 'admin-dashboard' },
    next: null,
    steps: [
      {
        id: 'b5-langkah-1',
        short: 'Akses Dasbor Admin',
        title: 'Buka Dasbor Admin & pantau kesehatan sistem.',
        text: 'Akun berkewenangan **Admin** atau **Moderator** dapat mengakses menu **Dasbor Admin**.',
        bullets: [
          'Pantau statistik Total User, Total Dokumen RKA, dan Total Pagu Anggaran.',
          'Cek grafik **Penggunaan Penyimpanan**: Ambang batas rotasi/failover berada pada **85%** kuota.',
          'Pastikan indikator status **Gemini API** dan **Database Neon** menunjukkan hijau/terkonfigurasi.'
        ],
        visual: 'admin-stats',
        caption: 'Dasbor Admin & Audit Storage',
        alt: 'Tampilan Dasbor Admin dengan statistik user, indikator rotasi storage 85%, dan status API.',
        keywords: 'admin dasbor audit storage failover rotasi 85 percent gemini api status neon db',
        img: null
      },
      {
        id: 'b5-langkah-2',
        short: 'Manajemen User & Role',
        title: 'Kelola pengguna, peran (role), dan kata sandi.',
        text: 'Tab **Manajemen User** digunakan untuk mengatur akun dan hak akses pengguna.',
        bullets: [
          'Tambah pengguna baru dan tentukan perannya (**Admin**, **Moderator**, atau **User**).',
          'Aktifkan atau nonaktifkan akun pengguna.',
          'Lakukan **Reset Password** untuk pengguna yang lupa kata sandi.'
        ],
        visual: 'admin-users',
        caption: 'Manajemen Akun & Role',
        alt: 'Tab Manajemen User dengan daftar nama pengguna, badge role, status aktif, dan tombol reset password.',
        keywords: 'manajemen user role admin moderator pengguna akun reset password aktif nonaktif',
        img: null
      },
      {
        id: 'b5-langkah-3',
        short: 'Kontrol Sakelar Menu',
        title: 'Aktifkan atau nonaktifkan menu via Kontrol Menu.',
        text: 'Tab **Kontrol Menu** memungkinkan Admin mengendalikan fitur aplikasi.',
        bullets: [
          'Gunakan sakelar (toggle) untuk mengunci atau membuka akses menu seperti Unggah, Agentic AI, Arsip, dll.',
          'Menu yang dinonaktifkan akan menampilkan lencana **Nonaktif** bagi pengguna biasa.'
        ],
        visual: 'admin-menu',
        caption: 'Kontrol Sakelar Akses Menu',
        alt: 'Tab Kontrol Menu dengan daftar sakelar toggle menu aktif atau nonaktif.',
        keywords: 'kontrol menu sakelar toggle aktif nonaktif batasi akses fitur admin',
        img: null
      },
      {
        id: 'b5-langkah-4',
        short: 'Konfigurasi API & SSH',
        title: 'Atur Gemini API Key, Database Neon, dan SSH Config.',
        text: 'Kelola koneksi AI dan database remote pada tab konfigurasi.',
        bullets: [
          '**Konfigurasi API:** Masukkan Gemini API Key dari Google AI Studio.',
          '**Database Neon:** Atur string koneksi PostgreSQL Neon Cloud / DB lokal.',
          '**SSH Config:** Kelola parameter tunnel SSH server.'
        ],
        visual: 'admin-config',
        caption: 'Konfigurasi API & Database Remote',
        alt: 'Tab Konfigurasi API dengan isian Gemini API Key dan koneksi PostgreSQL Neon.',
        keywords: 'konfigurasi api gemini key google ai studio database neon postgresql ssh config',
        img: null
      },
      {
        id: 'b5-langkah-5',
        short: 'Log Audit & Pemulihan',
        title: 'Tinjau Log Aktivitas dan lakukan pemulihan penuh.',
        text: 'Sistem mencatat seluruh log audit trail demi transparansi dan keamanan.',
        bullets: [
          'Tab **Log Aktivitas:** Memantau riwayat login, pengeditan, unggah, dan penghapusan data.',
          'Tab **Backup & Pemulihan:** Unduh cadangan lengkap (HTML/JSON/Zip) dan lakukan pemulihan database.'
        ],
        visual: 'admin-stats',
        caption: 'Log Aktivitas (Audit Trail) & Backup Full',
        alt: 'Tab Log Aktivitas mencatat audit trail pengguna dan fitur backup database penuh.',
        keywords: 'log aktivitas audit trail backup full pemulihan cadangan restore sistem',
        img: null
      }
    ]
  }
];

/* ── Data ilustrasi & kartu sidebar ─────────────────────────────────────── */
const MODES = [
  { id: 'mode1', icon: 'search', title: 'Mode 1: Analis Evaluasi RKA', desc: 'Uji Kepatuhan SBM, Efisiensi & Nilai Prakiraan Dampak TAPD', hint: 'Tampil dua panel: input dokumen RKA di kiri, hasil evaluasi di kanan.' },
  { id: 'mode2', icon: 'pencil', title: 'Mode 2: Eksekutor Revisi RKA', desc: 'Rasionalisasi Pagu & Draf DPA Baru', hint: 'Tampil dua panel: input dokumen RKA dan arahan pemangkasan di kiri, draf revisi di kanan.' },
  { id: 'mode3', icon: 'chat', title: 'Mode 3: Konsultasi Regulasi', desc: 'Tanya Jawab Permendagri 77 & SSH', hint: 'Tampil kolom percakapan lengkap dengan tombol pertanyaan cepat.' }
];
const QUEUE_MOCK = [
  { name: 'RKA_Dinas_Kesehatan.pdf', status: 'Selesai', pct: 100 },
  { name: 'RKA_Dinas_Pendidikan.pdf', status: 'Sedang diproses', pct: 64 },
  { name: 'RKA_Dinas_Pertanian.pdf', status: 'Menunggu antrean...', pct: 0 }
];
const INDIKATOR_MOCK = [
  { level: 'Output', target: '12 Dokumen', nama: 'Jumlah dokumen perencanaan yang disusun' },
  { level: 'Hasil', target: '100%', nama: 'Persentase dokumen tersusun tepat waktu' }
];
const SROI_CARDS = [
  { label: 'Nilai Input (Pagu)', value: 'Rp 250.000.000' },
  { label: 'Total Nilai Dampak Sosial', value: 'Rp 420.000.000' },
  { label: 'Total Dampak Bersih', value: 'Rp 335.000.000' },
  { label: 'Dampak Nilai Saat Ini', value: 'Rp 310.000.000' }
];
const BELANJA_MOCK = [
  { nama: 'Honorarium Tim Penyusun Dokumen', efisien: false, alokasi: 'Rp 85.000.000', kurang: 'Rp 45.000.000' },
  { nama: 'Belanja Alat Tulis Kantor', efisien: true, alokasi: 'Rp 20.000.000', kurang: '-' }
];
const FORMAT_CARDS = [
  { menu: 'Unggah Berkas RKA', format: 'Format: PDF', batas: 'Maksimal 100 MB per berkas, boleh banyak berkas sekaligus' },
  { menu: 'Simulasi Percakapan Agen AI (Mode 1 & 2)', format: 'Format: PDF, DOCX, XLSX, XLS, CSV, TXT, JSON', batas: 'Maksimal 20 MB per berkas (1 berkas per analisis)' },
  { menu: 'Edit & Unggah Ulang PDF', format: 'Format: PDF', batas: 'Maksimal 25 MB per berkas' },
  { menu: 'Ekspor Arsip & Database', format: 'Format: JSON / HTML', batas: 'Ekspor arsip biasa atau full database (JSON)' },
  { menu: 'Cadangan & Pemulihan (Backup/Restore)', format: 'Format: Zip / JSON', batas: 'Kelola file cadangan sistem di Arsip & Dasbor Admin' }
];
const CATATAN = [
  'Hasil analisis AI berupa usulan & rekomendasi. Selalu verifikasi dengan dokumen RKA resmi sebelum penetapan anggaran.',
  'Pemrosesan dokumen RKA berlangsung di browser/server. Jangan menutup halaman saat antrean unggah sedang berjalan.',
  'Bila menu bertanda Nonaktif, fitur sedang dibatasi oleh Admin. Gunakan menu Laporan bila memerlukan akses.',
  'Dasbor Admin, Manajemen User, dan Audit Trail khusus untuk akun berkewenangan Admin atau Moderator.',
  'Kunci API Gemini & Database Remote Neon dapat dikonfigurasi secara mandiri pada Dasbor Admin.'
];
const SUGGESTIONS = ['unggah', 'mode', 'pagu', 'indikator', 'admin', 'arsip', 'revisi', 'backup'];

/* ── Pencarian ─────────────────────────────────────────────────────────── */
const normalize = (t) =>
  String(t || '')
    .replace(/\*\*/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const PARTS = RAW_PARTS.map((p, pi) => ({
  ...p,
  no: pi + 1,
  steps: p.steps.map((s, si) => ({
    ...s,
    no: si + 1,
    part: p.id,
    hay: normalize([p.title, s.title, s.text, s.keywords, ...s.bullets].join(' '))
  }))
}));

const query = ref('');
const searchEl = ref(null);
const tokens = computed(() => normalize(query.value).split(/\s+/).filter(Boolean));
const hasQuery = computed(() => tokens.value.length > 0);

const visibleParts = computed(() => {
  if (!hasQuery.value) return PARTS;
  return PARTS.map((p) => ({ ...p, steps: p.steps.filter((s) => tokens.value.every((t) => s.hay.includes(t))) })).filter((p) => p.steps.length);
});
const matchCount = computed(() => visibleParts.value.reduce((n, p) => n + p.steps.length, 0));
const totalSteps = PARTS.reduce((n, p) => n + p.steps.length, 0);

function clearSearch() {
  query.value = '';
  searchEl.value?.focus();
}
function jumpToFirstMatch() {
  const first = visibleParts.value[0]?.steps[0];
  if (first) goTo(first.id);
}

/* Teks kaya: **tebal** + sorot kata pencarian. Semua teks di-escape lebih dulu. */
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function highlight(text) {
  if (!hasQuery.value) return esc(text);
  // Cocokkan versi asli teks (tanpa mengubah huruf) terhadap token yang sudah dinormalkan.
  const re = new RegExp('(' + tokens.value.map(reEsc).join('|') + ')', 'gi');
  return text
    .split(re)
    .map((seg, i) => (i % 2 === 1 ? '<mark>' + esc(seg) + '</mark>' : esc(seg)))
    .join('');
}
function rich(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/)
    .map((seg) => (seg.startsWith('**') && seg.endsWith('**') ? '<strong>' + highlight(seg.slice(2, -2)) + '</strong>' : highlight(seg)))
    .join('');
}

/* ── Interaksi ilustrasi Mode ─────────────────────────────────────────── */
const mockMode = ref('mode1');
const activeMode = computed(() => MODES.find((m) => m.id === mockMode.value) || MODES[0]);

/* ── Navigasi + penanda posisi (scrollspy) ────────────────────────────── */
const activeId = ref(PARTS[0].steps[0].id);
const activePartId = computed(() => PARTS.find((p) => p.steps.some((s) => s.id === activeId.value))?.id || PARTS[0].id);

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function goTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const step = PARTS.flatMap((p) => p.steps).find((s) => s.id === id);
  if (step) activeId.value = id;
  else {
    const part = PARTS.find((p) => p.id === id);
    if (part) activeId.value = part.steps[0].id;
  }
}

let observer = null;
const inView = new Set();
function setupSpy() {
  observer?.disconnect();
  inView.clear();
  if (typeof IntersectionObserver === 'undefined') return;
  const order = visibleParts.value.flatMap((p) => p.steps.map((s) => s.id));
  if (!order.length) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? inView.add(e.target.id) : inView.delete(e.target.id)));
      const first = order.find((id) => inView.has(id));
      if (first) activeId.value = first;
    },
    { rootMargin: '-100px 0px -55% 0px', threshold: 0 }
  );
  document.querySelectorAll('#petunjuk-root [data-step]').forEach((el) => observer.observe(el));
}
watch(visibleParts, () => nextTick(setupSpy));
onMounted(() => nextTick(setupSpy));
onBeforeUnmount(() => observer?.disconnect());

/* ── Unduh PDF (html2pdf.js sudah menjadi dependensi proyek) ───────────── */
const pdfBusy = ref('');

function buildPdfElement(parts, isAll) {
  const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const inline = (t) => String(t).split(/(\*\*[^*]+\*\*)/).map((seg) => (seg.startsWith('**') && seg.endsWith('**') ? '<b>' + esc(seg.slice(2, -2)) + '</b>' : esc(seg))).join('');
  const stepHtml = (s) => `
        <div class="pdf-step" style="margin:0 0 14px;display:flex;gap:10px;page-break-inside:avoid;">
          <div style="width:34px;flex:none;font-size:26pt;font-weight:800;color:#1B4D46;line-height:1;">${s.no}</div>
          <div style="flex:1;">
            <p style="margin:0 0 4px;"><b>${inline(s.title)}</b> ${inline(s.text)}</p>
            ${s.img ? `<img src="${esc(s.img)}" style="width:100%;max-width:150mm;border:1px solid #E6E8EB;margin:4px 0;" />` : ''}
            <ul style="margin:4px 0 0 16px;padding:0;">${s.bullets.map((b) => `<li style="margin:0 0 3px;">${inline(b)}</li>`).join('')}</ul>
          </div>
        </div>`;
  // Judul bagian, ringkasan, dan langkah pertama dijadikan satu blok agar tidak terpisah di pergantian halaman.
  const body = parts
    .map(
      (p) => `
      <div class="pdf-h" style="margin:18px 0 0;page-break-inside:avoid;">
        <div style="margin:0 0 8px;padding:8px 12px;background:#1B4D46;color:#fff;border-radius:6px;">
          <span style="font-size:9pt;opacity:.8;">Bagian ${p.no}</span>
          <div style="font-size:14pt;font-weight:700;">${esc(p.title)}</div>
        </div>
        <p style="margin:0 0 10px;color:#5B6169;">${esc(p.lead)}</p>
        ${stepHtml(p.steps[0])}
      </div>
      ${p.steps.slice(1).map(stepHtml).join('')}`
    )
    .join('');

  // Pembungkus disembunyikan di luar layar; elemen dalamnya yang diklon html2pdf (tanpa gaya luar layar).
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-10000px;top:0;';
  const el = document.createElement('div');
  el.style.cssText = 'width:182mm;background:#fff;color:#1A1D21;font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.5;';
  el.innerHTML = `
    <div style="border-bottom:3px solid #C97B3D;padding-bottom:8px;margin-bottom:6px;">
      <div style="font-size:9pt;color:#5B6169;">ASI DARA oleh Bapperida Kabupaten Cirebon</div>
      <div style="font-size:21pt;font-weight:800;color:#1B4D46;">Petunjuk Penggunaan${isAll ? '' : ' (Bagian ' + parts[0].no + ')'}</div>
      <div style="font-size:9pt;color:#5B6169;">Diunduh ${esc(tgl)}</div>
    </div>${body}`;
  wrap.appendChild(el);
  return { wrap, el };
}

async function downloadPdf(scope) {
  if (pdfBusy.value) return;
  const isAll = scope === 'all';
  const parts = isAll ? PARTS : [scope];
  pdfBusy.value = isAll ? 'all' : scope.id;
  const { wrap, el } = buildPdfElement(parts, isAll);
  document.body.appendChild(wrap);
  const filename = isAll ? 'Petunjuk-Penggunaan-ASI-DARA.pdf' : `Petunjuk-Penggunaan-ASI-DARA-Bagian-${scope.no}.pdf`;
  try {
    const { default: html2pdf } = await import('html2pdf.js');
    await html2pdf()
      .set({
        margin: [14, 14, 18, 14],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-step', '.pdf-h'] }
      })
      .from(el)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        const total = pdf.internal.getNumberOfPages();
        const w = pdf.internal.pageSize.getWidth();
        const hgt = pdf.internal.pageSize.getHeight();
        for (let i = 1; i <= total; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(120);
          pdf.text(`ASI DARA - Petunjuk Penggunaan | Halaman ${i} dari ${total}`, w / 2, hgt - 8, { align: 'center' });
        }
      })
      .save();
    showNotification('PDF berhasil dibuat', `${filename} sedang diunduh.`, 'success');
  } catch (err) {
    console.error('Gagal membuat PDF petunjuk:', err);
    showNotification('Gagal membuat PDF', 'Terjadi kendala saat menyiapkan PDF. Muat ulang halaman lalu coba lagi.', 'danger');
  } finally {
    wrap.remove();
    pdfBusy.value = '';
  }
}
</script>

<style>
/* Gaya khusus halaman ini, dibatasi di #petunjuk-root agar tidak mengubah menu lain. */
#petunjuk-root *,
#petunjuk-root *::before,
#petunjuk-root *::after {
  border-width: 0;
  border-style: solid;
  border-color: var(--border-color);
}
#petunjuk-root button {
  font: inherit;
  cursor: pointer;
  background: none;
  color: inherit;
}
#petunjuk-root button:disabled { cursor: not-allowed; }

/* Bilah atas & lencana: teal tetap di terang maupun gelap agar teks putih selalu terbaca. */
#petunjuk-root .pt-bar,
#petunjuk-root .pt-badge { background: #1B4D46; color: #fff; }

/* Latar gambar langkah: teal sangat muda + pola titik ala "retro digital" aplikasi. */
#petunjuk-root .pt-media {
  background-color: rgba(var(--primary-rgb), 0.06);
  background-image: radial-gradient(var(--retro-dot-color, rgba(27, 77, 70, 0.12)) 1px, transparent 1.4px);
  background-size: var(--retro-grid-size, 22px) var(--retro-grid-size, 22px);
}

/* "Jendela" ilustrasi antarmuka */
#petunjuk-root .pt-mock {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  box-shadow: 0 12px 28px -14px rgba(17, 24, 39, 0.35), 0 2px 6px -2px rgba(17, 24, 39, 0.08);
}

/* Penanda "klik/periksa bagian ini" */
#petunjuk-root .pt-hl { outline: 2px solid var(--accent-color); outline-offset: 3px; border-radius: 6px; }
#petunjuk-root .pt-hl-key { outline: 2px solid var(--accent-color); outline-offset: 0; }

#petunjuk-root .pt-field-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
#petunjuk-root .pt-donut {
  position: relative;
  display: inline-block;
  width: 64px;
  height: 64px;
  flex: none;
  border-radius: 9999px;
}
#petunjuk-root .pt-donut::after {
  content: '';
  position: absolute;
  inset: 17px;
  border-radius: 9999px;
  background: var(--bg-tertiary);
}

#petunjuk-root mark {
  background: var(--accent-glow);
  color: inherit;
  border-radius: 3px;
  padding: 0 2px;
  box-shadow: inset 0 -2px 0 var(--accent-color);
}

/* Kolom pencarian & fokus keyboard */
#petunjuk-root .pt-search { border: 0; outline: none; }
#petunjuk-root .pt-search:focus-visible { outline: 3px solid var(--accent-color); outline-offset: 2px; }
#petunjuk-root .pt-focus:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }
#petunjuk-root .pt-focus-light:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
#petunjuk-root .pt-search::-webkit-search-cancel-button { display: none; }

@media (prefers-reduced-motion: reduce) {
  #petunjuk-root * { transition: none !important; animation: none !important; }
}
</style>
