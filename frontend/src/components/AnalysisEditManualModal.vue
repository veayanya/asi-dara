<template>
  <Teleport to="body">
    <div class="ae-overlay" role="dialog" aria-modal="true" aria-labelledby="ae-manual-title" @mousedown.self="requestClose">
      <div class="ae-modal">

        <!-- ══ HEADER ══ -->
        <div class="ae-head">
          <div class="ae-head-main">
            <div class="ae-head-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>
            </div>
            <div style="min-width:0;">
              <h3 id="ae-manual-title" class="ae-title">Edit Manual Hasil Analisis</h3>
              <div class="ae-subtitle" :title="docName">{{ docName }}</div>
            </div>
          </div>
          <button type="button" class="ae-x" aria-label="Tutup" @click="requestClose">&times;</button>
        </div>

        <!-- ══ ISI ══ -->
        <div class="ae-body">

          <!-- Navigasi bagian -->
          <nav class="ae-nav" aria-label="Bagian hasil analisis">
            <button
              v-for="s in SECTIONS"
              :key="s.id"
              type="button"
              class="ae-nav-btn"
              :class="{ 'is-active': tab === s.id }"
              @click="tab = s.id"
            >
              <span>{{ s.label }}</span>
              <span v-if="badgeOf(s.id).err" class="ae-badge ae-badge--err" title="Perlu diperbaiki">{{ badgeOf(s.id).err }}</span>
              <span v-else-if="badgeOf(s.id).warn" class="ae-badge ae-badge--warn" title="Perlu dicek">{{ badgeOf(s.id).warn }}</span>
            </button>
          </nav>

          <!-- Formulir -->
          <div class="ae-content">

            <div v-if="analysis.status === 'Approved'" class="ae-banner ae-banner--warn">
              <span>Dokumen ini berstatus <strong>Disahkan</strong>. Perubahan disimpan sebagai versi baru dan angka Nilai Prakiraan Dampak pada dashboard ikut berubah.</span>
            </div>
            <div v-if="!analysis.id" class="ae-banner ae-banner--err">
              <span>Dokumen ini belum tersimpan di arsip sehingga belum dapat diedit. Buka dokumen dari menu Arsip terlebih dahulu.</span>
            </div>

            <!-- 1. IDENTITAS & PAGU -->
            <section v-show="tab === 'identitas'">
              <h4 class="ae-section-title">Identitas &amp; Pagu Anggaran</h4>
              <p class="ae-section-desc">Data pada kartu header halaman analisis (Subkeg, Perangkat Daerah, Program, Kegiatan, Pagu, dan Tahun Anggaran).</p>

              <div class="ae-field">
                <label for="ae-subkeg">Sub Kegiatan</label>
                <input id="ae-subkeg" v-model="draft.subKegiatan" type="text" class="form-input-sm" placeholder="Nama sub kegiatan" />
              </div>
              <div class="ae-field">
                <label for="ae-opd">Perangkat Daerah (OPD)</label>
                <input id="ae-opd" v-model="draft.opd" type="text" class="form-input-sm" placeholder="Nama OPD / satuan kerja" />
              </div>
              <div class="ae-grid-2">
                <div class="ae-field">
                  <label for="ae-program">Program</label>
                  <input id="ae-program" v-model="draft.program" type="text" class="form-input-sm" placeholder="Nama program" />
                </div>
                <div class="ae-field">
                  <label for="ae-kegiatan">Kegiatan</label>
                  <input id="ae-kegiatan" v-model="draft.kegiatan" type="text" class="form-input-sm" placeholder="Nama kegiatan" />
                </div>
                <div class="ae-field">
                  <label for="ae-pagu">Pagu Anggaran (Rp)</label>
                  <input id="ae-pagu" v-model.number="draft.pagu" type="number" min="0" class="form-input-sm" />
                  <span class="ae-hint">{{ formatRp(draft.pagu) }}</span>
                </div>
                <div class="ae-field">
                  <label for="ae-tahun">Tahun Anggaran</label>
                  <input id="ae-tahun" v-model.number="draft.tahunRencana" type="number" min="2000" max="2100" class="form-input-sm" />
                </div>
              </div>

              <div class="ae-subhead">
                <span>Anggaran per Tahun</span>
                <button type="button" class="ae-btn-add" @click="draft.anggaranTahunan.push(emptyAnggaranRow(nextYear()))">+ Tambah Tahun</button>
              </div>
              <p v-if="!draft.anggaranTahunan.length" class="ae-empty">Belum ada data anggaran per tahun.</p>
              <div class="ae-rows">
                <div v-for="(r, i) in draft.anggaranTahunan" :key="'ag' + i" class="ae-row">
                  <div class="ae-row-line ae-row-line--anggaran">
                    <input v-model.number="r.tahun" type="number" min="2000" max="2100" class="form-input-sm" placeholder="Tahun" aria-label="Tahun" />
                    <div>
                      <input v-model.number="r.jumlah" type="number" min="0" class="form-input-sm" placeholder="Jumlah (Rp)" aria-label="Jumlah anggaran" />
                      <span class="ae-hint">{{ formatRp(r.jumlah) }}</span>
                    </div>
                    <button type="button" class="ae-btn-icon" title="Hapus baris" @click="draft.anggaranTahunan.splice(i, 1)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- 2. INDIKATOR & TARGET KINERJA -->
            <section v-show="tab === 'kinerja'">
              <h4 class="ae-section-title">Indikator &amp; Target Kinerja</h4>

              <div class="ae-field">
                <label for="ae-target-kuant">Target Kuantitatif</label>
                <input id="ae-target-kuant" v-model="draft.targetKuantitatif" type="text" class="form-input-sm" placeholder="Contoh: 12 Dokumen" />
              </div>

              <div class="ae-subhead">
                <span>Tolok Ukur per Level</span>
                <button type="button" class="ae-btn-add" @click="draft.indikatorKinerja.push(emptyIndikatorRow())">+ Tambah Indikator</button>
              </div>
              <datalist id="ae-level-list">
                <option v-for="l in LEVELS" :key="l" :value="l" />
              </datalist>
              <p v-if="!draft.indikatorKinerja.length" class="ae-empty">Belum ada indikator kinerja.</p>
              <div class="ae-rows">
                <div v-for="(r, i) in draft.indikatorKinerja" :key="'ik' + i" class="ae-row">
                  <div class="ae-row-line ae-row-line--indikator">
                    <input v-model="r.level" list="ae-level-list" type="text" class="form-input-sm" placeholder="Level (mis. Tujuan (Ultimate))" aria-label="Level" />
                    <input v-model="r.tolok_ukur" type="text" class="form-input-sm" placeholder="Tolok ukur" aria-label="Tolok ukur" />
                    <input v-model="r.target" type="text" class="form-input-sm" placeholder="Target" aria-label="Target" />
                    <button type="button" class="ae-btn-icon" title="Hapus baris" @click="draft.indikatorKinerja.splice(i, 1)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg>
                    </button>
                  </div>
                  <div v-if="/kegiatan/i.test(r.level || '')" class="ae-rincian">
                    <label class="ae-rincian-label">Rincian isi (tampil sebagai dropdown) — satu baris per item, format: Nama | isi/komponen</label>
                    <textarea
                      class="form-input-sm"
                      rows="4"
                      placeholder="Laporan 1: Rapat Koordinasi ... | berisi ...&#10;Laporan 2: Konsultasi SKPD ... | berisi ..."
                      :value="rincianToText(r.rincian)"
                      @input="r.rincian = textToRincian($event.target.value)"
                    ></textarea>
                  </div>
                </div>
              </div>
            </section>

            <!-- 3. KESESUAIAN & JUSTIFIKASI -->
            <section v-show="tab === 'kesesuaian'">
              <h4 class="ae-section-title">Kesesuaian Anggaran &amp; Justifikasi Outcome</h4>
              <p class="ae-section-desc">Penilaian kesesuaian pagu tahun berjalan terhadap target kinerja, proyeksi ketercapaian target, dan justifikasi dampak sosial-ekonomi.</p>

              <div class="ae-grid-2">
                <div class="ae-field">
                  <label for="ae-kes-status">Status Kesesuaian</label>
                  <select id="ae-kes-status" v-model="draft.kesesuaian.status" class="form-input-sm">
                    <option value="">— Belum dinilai —</option>
                    <option v-for="s in KESESUAIAN_STATUS" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="ae-field">
                  <label for="ae-kes-estimasi">Estimasi Biaya per Output</label>
                  <input id="ae-kes-estimasi" v-model="draft.kesesuaian.estimasi_biaya_per_output" type="text" class="form-input-sm" placeholder="Contoh: Rp 58.828 per peserta didik" />
                </div>
              </div>
              <div class="ae-field">
                <label for="ae-kes-penjelasan">Penjelasan Kesesuaian</label>
                <textarea id="ae-kes-penjelasan" v-model="draft.kesesuaian.penjelasan" class="form-input" rows="3"></textarea>
              </div>
              <div class="ae-field">
                <label for="ae-kes-proyeksi">Apakah anggaran ini akan menyentuh target?</label>
                <select id="ae-kes-proyeksi" v-model="draft.kesesuaian.proyeksi_pencapaian_target" class="form-input-sm">
                  <option value="">— Belum dinilai —</option>
                  <option v-for="s in PROYEKSI_STATUS" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="ae-field">
                <label for="ae-kes-alasan">Alasan Proyeksi</label>
                <textarea id="ae-kes-alasan" v-model="draft.kesesuaian.alasan_proyeksi_target" class="form-input" rows="3"></textarea>
              </div>
              <div class="ae-field">
                <label for="ae-justifikasi">Justifikasi Outcome</label>
                <textarea id="ae-justifikasi" v-model="draft.justifikasiOutcome" class="form-input" rows="4" placeholder="Penjelasan dampak sosial/manfaat dari program ini"></textarea>
              </div>
            </section>

            <!-- 4. BELANJA & REALOKASI -->
            <section v-show="tab === 'belanja'">
              <h4 class="ae-section-title">Analisis Komponen Belanja &amp; Rekomendasi Belanja</h4>
              <p class="ae-section-desc">
                Diagram bisa diedit langsung: klik irisan atau barisnya, lalu ubah persen atau nilai (Rp), status
                Efisien/Inefisien, dan usulan Dikurangi/Dialokasikan. Perubahan tersinkron dengan form di bawah dan
                menghitung ulang Nilai Prakiraan Dampak.
              </p>

              <div class="ae-pie-grid">
                <!-- ── Pie kiri: Analisis Komponen Belanja (rincian rekening) ── -->
                <div class="ae-pie-col">
                  <div class="ae-pie-col-title">Analisis Komponen Belanja</div>
                  <div class="ae-pie-canvas-wrap"><canvas ref="pieAwalEl"></canvas></div>
                  <ul class="ae-pie-legend ae-pie-legend--edit">
                    <li
                      v-for="(row, k) in awalRows"
                      :key="'pa' + row.i"
                      :class="{ 'is-selected': selAwal === row.i }"
                    >
                      <div class="ae-pie-line" @click="toggleAwal(row.i)">
                        <span class="ae-pie-dot" :style="{ background: chartPaletteCss[k % chartPaletteCss.length] }"></span>
                        <span class="ae-pie-legend-name">{{ row.r.nama || '(tanpa nama)' }}</span>
                        <span v-if="row.r.status" class="ae-pie-tag" :class="statusTagClass(row.r.status)">{{ row.r.status }}</span>
                        <label class="ae-pct" @click.stop>
                          <input
                            v-model.number="row.r.persen"
                            type="number" min="0" max="100" step="0.01"
                            class="ae-pct-input"
                            aria-label="Persen"
                            @input="onRekPersen(row.r)"
                          />%
                        </label>
                      </div>
                      <div v-if="selAwal === row.i" class="ae-pie-detail">
                        <input
                          :value="row.r.nama"
                          type="text" class="form-input-sm" placeholder="Nama belanja" aria-label="Nama belanja"
                          @change="renameRekening(row.r, $event.target.value)"
                        />
                        <input
                          :value="row.r.persen"
                          type="range" min="0" max="100" step="0.1" class="ae-range" aria-label="Geser persen"
                          @input="setRekPersen(row.r, $event.target.value)"
                        />
                        <div class="ae-pie-detail-grid">
                          <label>
                            <span>Nilai (Rp)</span>
                            <input v-model.number="row.r.nilai" type="number" min="0" class="form-input-sm" @input="onRekNilai(row.r)" />
                          </label>
                          <label>
                            <span>Status efisiensi</span>
                            <select v-model="row.r.status" class="form-input-sm">
                              <option value="">Otomatis</option>
                              <option v-for="s in REKENING_STATUS" :key="s" :value="s">{{ s }}</option>
                            </select>
                          </label>
                        </div>
                        <input v-model="row.r.alasan" type="text" class="form-input-sm" placeholder="Alasan status efisiensi (opsional)" aria-label="Alasan status efisiensi" />
                        <div class="ae-pie-detail-foot">
                          <span class="ae-hint">{{ formatRp(row.r.nilai) }}</span>
                          <button type="button" class="ae-link-danger" @click="removeRekening(row.i)">Hapus irisan</button>
                        </div>
                      </div>
                    </li>
                    <li v-if="awalLainnya > 0" class="is-static">
                      <div class="ae-pie-line">
                        <span class="ae-pie-dot" :style="{ background: chartPaletteCss[awalRows.length % chartPaletteCss.length] }"></span>
                        <span class="ae-pie-legend-name">Lainnya <span class="ae-hint">(sisa dari 100%)</span></span>
                        <span class="ae-pie-legend-pct">{{ awalLainnya }}%</span>
                      </div>
                    </li>
                  </ul>
                  <p v-if="!awalRows.length" class="ae-empty">Belum ada rincian rekening untuk digambar.</p>
                  <button type="button" class="ae-btn-add ae-pie-add" @click="addRekeningSlice">+ Tambah irisan</button>
                </div>

                <!-- ── Pie kanan: Rekomendasi Belanja (hasil Dikurangi / Dialokasikan) ── -->
                <div class="ae-pie-col">
                  <div class="ae-pie-col-title ae-pie-col-title--ai">Rekomendasi Belanja</div>
                  <div class="ae-pie-canvas-wrap"><canvas ref="pieUsulanEl"></canvas></div>
                  <ul class="ae-pie-legend ae-pie-legend--edit">
                    <li
                      v-for="(s, k) in usulanSlices"
                      :key="'pu' + k"
                      :class="{ 'is-selected': selUsulan === k }"
                    >
                      <div class="ae-pie-line" @click="toggleUsulan(k)">
                        <span class="ae-pie-dot" :style="{ background: chartPaletteCss[k % chartPaletteCss.length] }"></span>
                        <span class="ae-pie-legend-name">{{ s.nama }}</span>
                        <span v-if="aksiOf(s).text" class="ae-pie-tag" :class="aksiOf(s).cls">{{ aksiOf(s).text }}</span>
                        <label class="ae-pct" @click.stop>
                          <input
                            :value="s.persen"
                            type="number" min="0" max="100" step="0.01"
                            class="ae-pct-input"
                            aria-label="Persen usulan"
                            @change="setUsulanPersen(k, $event.target.value)"
                          />%
                        </label>
                      </div>
                      <div v-if="selUsulan === k" class="ae-pie-detail">
                        <input
                          v-if="!s.fromAwal"
                          :value="s.nama"
                          type="text" class="form-input-sm" placeholder="Nama rekening" aria-label="Nama rekening"
                          @change="renameUsulan(k, $event.target.value)"
                        />
                        <input
                          :value="s.persen"
                          type="range" min="0" max="100" step="0.1" class="ae-range" aria-label="Geser persen usulan"
                          @input="setUsulanPersen(k, $event.target.value)"
                        />
                        <div class="ae-pie-detail-grid">
                          <label>
                            <span>Nilai usulan (Rp)</span>
                            <input :value="s.nilai" type="number" min="0" class="form-input-sm" @change="setUsulanNilai(k, $event.target.value)" />
                          </label>
                          <label v-if="s.fromAwal && s.rekRef">
                            <span>Status efisiensi</span>
                            <select v-model="s.rekRef.status" class="form-input-sm">
                              <option value="">Otomatis</option>
                              <option v-for="st in REKENING_STATUS" :key="st" :value="st">{{ st }}</option>
                            </select>
                          </label>
                        </div>
                        <div class="ae-pie-delta">
                          Awal {{ formatRp(s.awalNilai) }} &rarr; Usulan {{ formatRp(s.nilai) }}
                          <b :class="aksiOf(s).cls">{{ deltaText(s) }}</b>
                        </div>
                        <input
                          v-if="s.rows.length"
                          v-model="draft.realokasi[s.rows[0]].alasan"
                          type="text" class="form-input-sm"
                          :placeholder="draft.realokasi[s.rows[0]].aksi === 'KURANGI' ? 'Kenapa harus dikurangi?' : 'Kenapa harus dialokasikan ke sini?'"
                          aria-label="Alasan usulan"
                        />
                        <div class="ae-pie-detail-foot">
                          <button v-if="balanceGap !== 0" type="button" class="ae-link" @click="absorbGap(k)">
                            {{ balanceGap > 0 ? 'Alokasikan sisa ' + formatRp(balanceGap) + ' ke sini' : 'Kurangi ' + formatRp(-balanceGap) + ' dari sini' }}
                          </button>
                          <button v-if="s.fromAwal && s.rows.length" type="button" class="ae-link" @click="setUsulanNilai(k, s.awalNilai)">Kembalikan ke nilai awal</button>
                          <button v-if="!s.fromAwal" type="button" class="ae-link-danger" @click="removeUsulan(k)">Hapus irisan</button>
                        </div>
                      </div>
                    </li>
                    <li v-if="usulanLainnya > 0" class="is-static">
                      <div class="ae-pie-line">
                        <span class="ae-pie-dot" :style="{ background: chartPaletteCss[usulanSlices.length % chartPaletteCss.length] }"></span>
                        <span class="ae-pie-legend-name">Lainnya <span class="ae-hint">(sisa dari 100%)</span></span>
                        <span class="ae-pie-legend-pct">{{ usulanLainnya }}%</span>
                      </div>
                    </li>
                  </ul>
                  <p v-if="!usulanSlices.length" class="ae-empty">Belum ada usulan realokasi.</p>
                  <div v-if="sumKurang || sumTambah" class="ae-pie-balance" :class="balanceGap === 0 ? 'is-good' : 'is-bad'">
                    {{ balanceText }}
                  </div>
                  <button type="button" class="ae-btn-add ae-pie-add" @click="addUsulanSlice">+ Tambah irisan</button>
                </div>
              </div>
              <p v-if="pieHint" class="ae-pie-note" role="alert">{{ pieHint }}</p>


              <div class="ae-subhead">
                <span>Rincian Rekening Belanja</span>
                <button type="button" class="ae-btn-add" @click="draft.rekeningProporsi.push(emptyRekeningRow())">+ Tambah Rekening</button>
              </div>
              <p v-if="!draft.rekeningProporsi.length" class="ae-empty">Belum ada rincian rekening.</p>
              <div class="ae-rows">
                <div v-for="(r, i) in draft.rekeningProporsi" :key="'rk' + i" class="ae-row">
                  <div class="ae-row-line ae-row-line--rekening">
                    <input v-model="r.kode" type="text" class="form-input-sm" placeholder="Kode" aria-label="Kode rekening" />
                    <input v-model="r.nama" type="text" class="form-input-sm" placeholder="Nama belanja" aria-label="Nama belanja" />
                    <input v-model.number="r.persen" type="number" min="0" max="100" step="0.01" class="form-input-sm" placeholder="%" aria-label="Persen" @input="onRekPersen(r)" />
                    <input v-model.number="r.nilai" type="number" min="0" class="form-input-sm" placeholder="Nilai (Rp)" aria-label="Nilai rupiah" @input="onRekNilai(r)" />
                    <button type="button" class="ae-btn-icon" title="Hapus rekening" @click="draft.rekeningProporsi.splice(i, 1)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg>
                    </button>
                  </div>
                  <div class="ae-row-line ae-row-line--rekening2">
                    <select v-model="r.status" class="form-input-sm" aria-label="Status efisiensi">
                      <option value="">Status: otomatis</option>
                      <option v-for="s in REKENING_STATUS" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <input v-model="r.alasan" type="text" class="form-input-sm" placeholder="Alasan status efisiensi (opsional)" aria-label="Alasan" />
                  </div>
                </div>
              </div>
              <div class="ae-totals">
                <span>Total persen: <b :class="sumPersen > 100.5 ? 'is-bad' : ''">{{ round2(sumPersen) }}%</b></span>
                <span>Total nilai: <b :class="sumNilai > draft.pagu * 1.005 ? 'is-bad' : ''">{{ formatRp(sumNilai) }}</b></span>
                <span>Pagu: <b>{{ formatRp(draft.pagu) }}</b></span>
              </div>

              <datalist id="ae-rek-names">
                <option v-for="(r, i) in draft.rekeningProporsi" :key="'dl' + i" :value="r.nama" />
              </datalist>

              <!-- Kurangi -->
              <div class="ae-subhead">
                <span>Kenapa Harus Dikurangi?</span>
                <button type="button" class="ae-btn-add" @click="addRealokasi('KURANGI')">+ Tambah Pengurangan</button>
              </div>
              <p v-if="!hasAksi('KURANGI')" class="ae-empty">Tidak ada rekomendasi pengurangan.</p>
              <div class="ae-rows">
                <template v-for="(r, i) in draft.realokasi" :key="'rl' + i">
                  <div v-if="r.aksi === 'KURANGI'" class="ae-row is-kurangi">
                    <div class="ae-row-line ae-row-line--realokasi">
                      <input v-model="r.kode" type="text" class="form-input-sm" placeholder="Kode" aria-label="Kode rekening" />
                      <input v-model="r.rekening_nama" list="ae-rek-names" type="text" class="form-input-sm" placeholder="Nama rekening" aria-label="Nama rekening" @change="onRealokasiNama(r)" />
                      <input v-model.number="r.nilai_awal" type="number" min="0" class="form-input-sm" placeholder="Nilai awal (Rp)" aria-label="Nilai awal" />
                      <input v-model.number="r.nilai" type="number" min="0" class="form-input-sm" placeholder="Dikurangi (Rp)" aria-label="Nilai dikurangi" />
                      <button type="button" class="ae-btn-icon" title="Hapus baris" @click="removeRealokasi(i)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg>
                      </button>
                    </div>
                    <textarea v-model="r.alasan" class="form-input-sm" rows="2" placeholder="Alasan pengurangan"></textarea>
                  </div>
                </template>
              </div>

              <!-- Tambah -->
              <div class="ae-subhead">
                <span>Kenapa Harus Dialokasikan ke Sini?</span>
                <button type="button" class="ae-btn-add" @click="addRealokasi('TAMBAH')">+ Tambah Penambahan</button>
              </div>
              <p v-if="!hasAksi('TAMBAH')" class="ae-empty">Tidak ada rekomendasi penambahan.</p>
              <div class="ae-rows">
                <template v-for="(r, i) in draft.realokasi" :key="'rt' + i">
                  <div v-if="r.aksi === 'TAMBAH'" class="ae-row is-tambah">
                    <div class="ae-row-line ae-row-line--realokasi">
                      <input v-model="r.kode" type="text" class="form-input-sm" placeholder="Kode" aria-label="Kode rekening" />
                      <input v-model="r.rekening_nama" list="ae-rek-names" type="text" class="form-input-sm" placeholder="Nama rekening" aria-label="Nama rekening" @change="onRealokasiNama(r)" />
                      <input v-model.number="r.nilai_awal" type="number" min="0" class="form-input-sm" placeholder="Nilai awal (Rp)" aria-label="Nilai awal" />
                      <input v-model.number="r.nilai" type="number" min="0" class="form-input-sm" placeholder="Ditambah (Rp)" aria-label="Nilai ditambah" />
                      <button type="button" class="ae-btn-icon" title="Hapus baris" @click="removeRealokasi(i)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg>
                      </button>
                    </div>
                    <textarea v-model="r.alasan" class="form-input-sm" rows="2" placeholder="Alasan penambahan alokasi"></textarea>
                  </div>
                </template>
              </div>

              <div class="ae-totals">
                <span>Total dikurangi: <b>{{ formatRp(sumKurang) }}</b></span>
                <span>Total ditambah: <b>{{ formatRp(sumTambah) }}</b></span>
                <span v-if="balanceGap === 0" class="is-good">Berimbang</span>
                <span v-else class="is-bad">Selisih: {{ formatRp(Math.abs(balanceGap)) }}</span>
              </div>
            </section>

            <!-- 5. PARAMETER SROI -->
            <section v-show="tab === 'sroi'">
              <h4 class="ae-section-title">Parameter &amp; Nilai Rasio Nilai Prakiraan Dampak</h4>
              <p class="ae-section-desc">Rasio Nilai Prakiraan Dampak = Nilai Dampak yang Dihasilkan Saat Ini &divide; Nilai Input (pagu). Hasil dihitung ulang otomatis; lihat panel di sebelah kanan.</p>

              <div class="ae-field">
                <label for="ae-outcome">Total Nilai Dampak Sosial (Rp)</label>
                <input id="ae-outcome" v-model.number="draft.outcome" type="number" min="0" class="form-input-sm" />
                <span class="ae-hint">{{ formatRp(draft.outcome) }} — kuantitas outcome &times; financial proxy</span>
              </div>

              <div class="ae-grid-3">
                <div class="ae-field">
                  <label for="ae-dw">Kerugian Bobot (%)</label>
                  <input id="ae-dw" v-model.number="draft.deadweight" type="number" min="0" max="100" step="0.1" class="form-input-sm" />
                  <span class="ae-hint">Outcome tanpa intervensi</span>
                </div>
                <div class="ae-field">
                  <label for="ae-attr">Atribusi (%)</label>
                  <input id="ae-attr" v-model.number="draft.attribution" type="number" min="0" max="100" step="0.1" class="form-input-sm" />
                  <span class="ae-hint">Kontribusi pihak lain</span>
                </div>
                <div class="ae-field">
                  <label for="ae-disp">Pergeseran Manfaat (%)</label>
                  <input id="ae-disp" v-model.number="draft.displacement" type="number" min="0" max="100" step="0.1" class="form-input-sm" />
                  <span class="ae-hint">Pengurangan manfaat lain</span>
                </div>
                <div class="ae-field">
                  <label for="ae-drop">Penyusutan (%)</label>
                  <input id="ae-drop" v-model.number="draft.dropOff" type="number" min="0" max="100" step="0.1" class="form-input-sm" />
                  <span class="ae-hint">Penurunan multi-tahun</span>
                </div>
                <div class="ae-field">
                  <label for="ae-disc">Tingkat Diskonto (%)</label>
                  <input id="ae-disc" v-model.number="draft.discountRate" type="number" min="0" max="100" step="0.1" class="form-input-sm" />
                  <span class="ae-hint">Diskonto masa depan</span>
                </div>
                <div class="ae-field">
                  <label for="ae-dur">Durasi Manfaat (tahun)</label>
                  <input id="ae-dur" v-model.number="draft.benefitDurationYears" type="number" min="1" max="20" step="1" class="form-input-sm" />
                  <span class="ae-hint">Penyusutan &amp; diskonto berlaku bila &gt; 1 tahun</span>
                </div>
              </div>

              <div class="ae-field" style="margin-top:8px;">
                <label for="ae-attr-reason">Alasan Atribusi</label>
                <textarea id="ae-attr-reason" v-model="draft.attributionReason" class="form-input" rows="2"></textarea>
              </div>
              <div class="ae-field">
                <label for="ae-disp-reason">Alasan Pergeseran Manfaat</label>
                <textarea id="ae-disp-reason" v-model="draft.displacementReason" class="form-input" rows="2"></textarea>
              </div>
            </section>

            <!-- 6. RINGKASAN & SIMPAN -->
            <section v-show="tab === 'ringkasan'">
              <h4 class="ae-section-title">Ringkasan Perubahan &amp; Simpan</h4>
              <p class="ae-section-desc">Periksa perubahan sebelum menyimpan. Data dan versi sebelumnya tetap tersimpan; hasil ini menjadi versi baru yang bisa dipilih lewat pemilih &ldquo;Versi&rdquo;.</p>

              <div v-if="validation.errors.length" class="ae-banner ae-banner--err">
                <div>
                  <strong>Perbaiki dulu sebelum menyimpan:</strong>
                  <ul><li v-for="(e, i) in validation.errors" :key="'e' + i">{{ e.msg }}</li></ul>
                </div>
              </div>
              <div v-if="validation.warnings.length" class="ae-banner ae-banner--warn">
                <div>
                  <strong>Perlu dicek:</strong>
                  <ul><li v-for="(w, i) in validation.warnings" :key="'w' + i">{{ w.msg }}</li></ul>
                </div>
              </div>

              <div class="ae-grid-2">
                <div class="ae-field">
                  <label for="ae-vname">Nama Versi</label>
                  <input id="ae-vname" v-model="versionName" type="text" class="form-input-sm" maxlength="80" />
                </div>
                <div class="ae-field">
                  <label for="ae-vnote">Catatan (opsional)</label>
                  <input id="ae-vnote" v-model="versionNote" type="text" class="form-input-sm" maxlength="200" placeholder="Alasan perubahan" />
                </div>
              </div>

              <div class="ae-subhead"><span>{{ realMods.length }} perubahan</span></div>
              <p v-if="!mods.length" class="ae-empty">Belum ada perubahan dari data saat ini.</p>
              <table v-else class="ae-changes">
                <thead><tr><th style="width:34%;">Bagian</th><th style="width:33%;">Sebelum</th><th>Sesudah</th></tr></thead>
                <tbody>
                  <tr v-for="(m, i) in mods" :key="'m' + i" :class="{ 'is-derived': m.derived }">
                    <td><span class="ae-group-tag">{{ m.group }}</span><br />{{ m.label }}</td>
                    <td class="ae-from">{{ m.from }}</td>
                    <td class="ae-to">{{ m.to }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          <!-- Panel pratinjau Nilai Prakiraan Dampak -->
          <aside class="ae-side" aria-label="Pratinjau Nilai Prakiraan Dampak">
            <div class="ae-preview-title">PRATINJAU NILAI PRAKIRAAN DAMPAK</div>
            <div class="ae-sroi-card" :class="sroiNow.tone">
              <div class="ae-sroi-big">{{ sroiNow.sroiScore }}</div>
              <div class="ae-sroi-label">{{ sroiNow.shortLabel }} · {{ sroiNow.sroiStatus }}</div>
              <div v-if="sroiNow.sroiScore !== sroiBefore.sroiScore" class="ae-sroi-was">
                Sebelumnya {{ sroiBefore.sroiScore }} ({{ sroiBefore.shortLabel }})
              </div>
              <div v-else class="ae-sroi-was">Sama dengan sebelum diedit</div>
            </div>
            <div class="ae-kv"><span>Nilai Input</span><span>{{ formatRp(sroiNow.valueOfInputs) }}</span></div>
            <div class="ae-kv"><span>Nilai Dampak</span><span>{{ formatRp(sroiNow.totalNilaiDampak) }}</span></div>
            <div class="ae-kv"><span>Setelah Kerugian Bobot</span><span>{{ formatRp(sroiNow.dampakSetelahDeadweight) }}</span></div>
            <div class="ae-kv"><span>Dampak Bersih</span><span>{{ formatRp(sroiNow.netImpact) }}</span></div>
            <div class="ae-kv"><span>Dampak Nilai Saat Ini</span><span>{{ formatRp(sroiNow.pvImpact) }}</span></div>
            <p class="ae-hint" style="margin-top:10px;">{{ sroiNow.sroiInterpretation }}</p>
          </aside>
        </div>

        <!-- ══ FOOTER ══ -->
        <div class="ae-foot">
          <div v-if="confirmDiscard" class="ae-foot-msg is-error">Ada {{ realMods.length }} perubahan yang belum disimpan. Buang perubahan?</div>
          <div v-else-if="validation.errors.length" class="ae-foot-msg is-error">{{ validation.errors[0].msg }}</div>
          <div v-else class="ae-foot-msg">
            {{ realMods.length ? realMods.length + ' perubahan belum disimpan.' : 'Belum ada perubahan.' }}
          </div>

          <div class="ae-foot-actions">
            <template v-if="confirmDiscard">
              <button type="button" class="btn btn-secondary btn-sm" @click="confirmDiscard = false">Lanjut Edit</button>
              <button type="button" class="btn btn-sm" style="background:var(--danger-color,#c4667a);color:#fff;border:none;" @click="emit('close')">Ya, Buang</button>
            </template>
            <template v-else>
              <button type="button" class="btn btn-secondary btn-sm" :disabled="saving || !realMods.length" @click="resetDraft">Kembalikan</button>
              <button type="button" class="btn btn-secondary btn-sm" :disabled="saving" @click="requestClose">Batal</button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="!canSave" @click="save">
                {{ saving ? 'Menyimpan...' : 'Simpan sebagai Versi Baru' }}
              </button>
            </template>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import '../assets/analysis-edit.css';
import { useAnalysis, buildUsulanProporsi } from '../composables/useAnalysis';
import {
  Chart, ArcElement, Tooltip, Legend, PieController
} from 'chart.js';
import {
  KESESUAIAN_STATUS,
  PROYEKSI_STATUS,
  REKENING_STATUS,
  createDraft,
  emptyIndikatorRow,
  rincianToText,
  textToRincian,
  emptyAnggaranRow,
  emptyRekeningRow,
  emptyRealokasiRow,
  computeSroiFromDraft,
  validateDraft,
  draftToAnalysis,
  diffDrafts,
  withSroiDelta,
  summarizeModifications,
  modificationsForStorage,
  defaultVersionName,
  formatRp
} from '../utils/analysisEdit';
import {
  buildRecommendationSlices,
  applyTargetNilai,
  removeSliceRows,
  renameSliceRows,
  realokasiRowsOfRekening,
  isRekeningUsed,
  uniqueName
} from '../utils/belanjaChartEdit';

// Chart.js tree-shaken build wajib registrasi eksplisit; aman dipanggil berulang.
Chart.register(ArcElement, Tooltip, Legend, PieController);

const props = defineProps({
  analysis: { type: Object, required: true }
});
const emit = defineEmits(['close', 'saved']);

const { saveManualVersion, currentUser } = useAnalysis();

// ── Draft: baseDraft = keadaan awal (untuk diff), draft = yang sedang diedit ──
const baseDraft = createDraft(props.analysis);
const draft = reactive(createDraft(props.analysis));

const SECTIONS = [
  { id: 'identitas', label: 'Identitas & Pagu' },
  { id: 'kinerja', label: 'Indikator & Target' },
  { id: 'kesesuaian', label: 'Kesesuaian & Outcome' },
  { id: 'belanja', label: 'Analisis Komponen Belanja & Rekomendasi Belanja' },
  { id: 'sroi', label: 'Parameter Nilai Prakiraan Dampak' },
  { id: 'ringkasan', label: 'Ringkasan & Simpan' }
];
const LEVELS = [
  'Tujuan (Ultimate)',
  'Sasaran (Intermediate)',
  'Program (Immediate)',
  'Kegiatan (Immediate)',
  'Sub Kegiatan (Output)',
  'Kelompok Sasaran'
];
const tab = ref('identitas');

const docName = computed(
  () => props.analysis.namaDokumen || props.analysis.subKegiatan || props.analysis.program || props.analysis.id || 'Dokumen RKA'
);

// ── Turunan: validasi, SROI, diff ────────────────────────────────────
const validation = computed(() => validateDraft(draft));
const sroiNow = computed(() => computeSroiFromDraft(draft));
const sroiBefore = computeSroiFromDraft(baseDraft);
const mods = computed(() => withSroiDelta(diffDrafts(baseDraft, draft), baseDraft, draft));
const realMods = computed(() => mods.value.filter((m) => !m.derived));

const badgeOf = (id) => ({
  err: validation.value.errors.filter((e) => e.section === id).length,
  warn: validation.value.warnings.filter((w) => w.section === id).length
});

// ── Helper angka ─────────────────────────────────────────────────────
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round(n * 100) / 100;
const nextYear = () => {
  const years = draft.anggaranTahunan.map((r) => toNumber(r.tahun));
  return years.length ? Math.max(...years) + 1 : toNumber(draft.tahunRencana) || new Date().getFullYear();
};

// ── Rekening: nilai ⇄ persen ─────────────────────────────────────────
// Dipanggil SETELAH v-model memperbarui field yang diketik (listener v-model
// terdaftar lebih dulu), sehingga field lawannya dihitung dari nilai terbaru.
const onRekNilai = (r) => {
  const pagu = toNumber(draft.pagu);
  if (pagu > 0) r.persen = round2((toNumber(r.nilai) / pagu) * 100);
};
const onRekPersen = (r) => {
  const pagu = toNumber(draft.pagu);
  if (pagu > 0) r.nilai = Math.round((toNumber(r.persen) / 100) * pagu);
};

const sumPersen = computed(() => draft.rekeningProporsi.reduce((s, r) => s + toNumber(r.persen), 0));
const sumNilai = computed(() => draft.rekeningProporsi.reduce((s, r) => s + toNumber(r.nilai), 0));

// ── Realokasi ────────────────────────────────────────────────────────
const hasAksi = (aksi) => draft.realokasi.some((r) => r.aksi === aksi);
const addRealokasi = (aksi) => draft.realokasi.push(emptyRealokasiRow(aksi));
const removeRealokasi = (i) => draft.realokasi.splice(i, 1);
const onRealokasiNama = (r) => {
  const key = String(r.rekening_nama || '').trim().toLowerCase();
  if (!key) return;
  const match = draft.rekeningProporsi.find((x) => String(x.nama || '').trim().toLowerCase() === key);
  if (!match) return;
  if (!r.kode) r.kode = match.kode;
  if (!toNumber(r.nilai_awal)) r.nilai_awal = match.nilai;
};
const sumKurang = computed(() =>
  draft.realokasi.filter((r) => r.aksi === 'KURANGI').reduce((s, r) => s + toNumber(r.nilai), 0)
);
const sumTambah = computed(() =>
  draft.realokasi.filter((r) => r.aksi === 'TAMBAH').reduce((s, r) => s + toNumber(r.nilai), 0)
);
const balanceGap = computed(() => Math.round(sumKurang.value) - Math.round(sumTambah.value));

// ── Diagram Belanja yang bisa DIEDIT ─────────────────────────────────
// Pie kiri  = rincian rekening (draft.rekeningProporsi): nama, %, Rp, status
//             efisiensi diedit langsung dari legend / panel irisan.
// Pie kanan = komposisi setelah usulan Dikurangi/Dialokasikan diterapkan.
//             Mengubah nilai irisan menulis ulang baris draft.realokasi
//             (lihat utils/belanjaChartEdit.js), sehingga form di bawah,
//             pratinjau SROI, dan ringkasan perubahan selalu ikut sinkron.
// Komponen ini dipakai sama persis di halaman Arsip dan Hasil Analisis.
const withLainnya = (dataset) => {
  if (!dataset || dataset.length === 0) return [];
  const sumP = dataset.reduce((s, d) => s + (toNumber(d.persen) || 0), 0);
  if (sumP < 99) return [...dataset, { nama: 'Lainnya', persen: Number((100 - sumP).toFixed(1)) }];
  return dataset;
};

// Irisan kiri: baris rincian rekening yang ikut digambar (beserta indeks aslinya).
const awalRows = computed(() =>
  draft.rekeningProporsi.map((r, i) => ({ r, i })).filter(({ r }) => isRekeningUsed(r))
);
const awalChartData = computed(() =>
  withLainnya(awalRows.value.map(({ r }) => ({ nama: r.nama || '(tanpa nama)', persen: r.persen })))
);
const awalLainnya = computed(() =>
  awalChartData.value.length > awalRows.value.length
    ? round2(toNumber(awalChartData.value[awalChartData.value.length - 1].persen))
    : 0
);

// Irisan kanan: dihitung oleh buildUsulanProporsi (sumber kebenaran aplikasi),
// lalu dipetakan kembali ke baris realokasi yang membentuknya.
const usulanSlices = computed(() =>
  buildRecommendationSlices({
    rekening: draft.rekeningProporsi,
    realokasi: draft.realokasi,
    pagu: toNumber(draft.pagu),
    buildUsulan: buildUsulanProporsi
  })
);
const usulanChartData = computed(() =>
  withLainnya(usulanSlices.value.map((s) => ({ nama: s.nama, persen: s.persen })))
);
const usulanLainnya = computed(() =>
  usulanChartData.value.length > usulanSlices.value.length
    ? round2(toNumber(usulanChartData.value[usulanChartData.value.length - 1].persen))
    : 0
);

// Seleksi irisan (klik irisan pada diagram ATAU barisnya pada legend)
const selAwal = ref(null); // indeks pada draft.rekeningProporsi
const selUsulan = ref(null); // indeks pada usulanSlices
const pieHint = ref('');
const awalSelPos = computed(() => awalRows.value.findIndex((x) => x.i === selAwal.value));
const toggleAwal = (i) => { selAwal.value = selAwal.value === i ? null : i; };
const toggleUsulan = (k) => { selUsulan.value = selUsulan.value === k ? null : k; };

const statusTagClass = (s) => (s === 'Efisien' ? 'is-good' : s === 'Inefisien' ? 'is-bad' : '');
const deltaOf = (s) => Math.round(s.nilai - s.awalNilai);
const aksiOf = (s) => {
  const d = deltaOf(s);
  if (d < 0) return { text: 'Dikurangi', cls: 'is-kurangi' };
  if (d > 0) return { text: 'Dialokasikan', cls: 'is-tambah' };
  return s.fromAwal ? { text: '', cls: '' } : { text: 'Baru', cls: 'is-tambah' };
};
const deltaText = (s) => {
  const d = deltaOf(s);
  if (d < 0) return `Dikurangi ${formatRp(-d)}`;
  if (d > 0) return `Dialokasikan +${formatRp(d)}`;
  return 'Tidak berubah';
};
const balanceText = computed(() =>
  balanceGap.value === 0
    ? 'Berimbang: total dikurangi sama dengan total dialokasikan'
    : balanceGap.value > 0
      ? `Dana dikurangi yang belum dialokasikan: ${formatRp(balanceGap.value)}`
      : `Alokasi melebihi pengurangan: ${formatRp(-balanceGap.value)}`
);

// ── Edit pie kiri (rincian rekening) ─────────────────────────────────
const setRekPersen = (r, v) => {
  r.persen = round2(toNumber(v));
  onRekPersen(r);
};
// Ganti nama rekening sekaligus baris usulan yang menunjuk ke nama lama,
// supaya usulan Dikurangi/Dialokasikan tidak "terlepas" dari rekeningnya.
const renameRekening = (r, value) => {
  const name = String(value || '').trim();
  if (!name || name === r.nama) return;
  const old = { kode: r.kode, nama: r.nama };
  realokasiRowsOfRekening(draft.realokasi, old).forEach((i) => { draft.realokasi[i].rekening_nama = name; });
  r.nama = name;
};
const removeRekening = (i) => {
  const r = draft.rekeningProporsi[i];
  if (!r) return;
  // Usulan yang menunjuk rekening ini ikut dihapus agar tidak menjadi irisan yatim.
  const rowSet = new Set(realokasiRowsOfRekening(draft.realokasi, r));
  const keep = draft.realokasi.filter((_, idx) => !rowSet.has(idx)).map((x) => ({ ...x }));
  draft.realokasi.splice(0, draft.realokasi.length, ...keep);
  draft.rekeningProporsi.splice(i, 1);
  selAwal.value = null;
  selUsulan.value = null;
  pieHint.value = '';
};
const addRekeningSlice = () => {
  const nama = uniqueName('Rekening Baru', draft.rekeningProporsi.map((r) => r.nama));
  draft.rekeningProporsi.push({ ...emptyRekeningRow(), nama });
  selAwal.value = draft.rekeningProporsi.length - 1;
};

// ── Edit pie kanan (usulan Dikurangi / Dialokasikan) ─────────────────
const replaceRealokasi = (rows) => draft.realokasi.splice(0, draft.realokasi.length, ...rows);
// Terapkan perubahan, lalu periksa hasilnya di diagram. Bila ternyata gagal
// (mis. dua nama rekening saling mengandung sehingga baris jatuh ke irisan
// lain), perubahan dibatalkan dan pengguna diberi tahu.
const tryRealokasiChange = (nextRows, check, failMsg) => {
  const prev = draft.realokasi.map((r) => ({ ...r }));
  const prevLen = usulanSlices.value.length;
  replaceRealokasi(nextRows);
  if (check(usulanSlices.value, prevLen)) {
    pieHint.value = '';
    return true;
  }
  replaceRealokasi(prev);
  pieHint.value = failMsg;
  return false;
};
const AMBIGU_MSG =
  'Perubahan dibatalkan: nama rekening ini terlalu mirip dengan rekening lain sehingga usulan tidak bisa dipetakan. ' +
  'Ubah nama rekening agar tidak saling mengandung, atau atur lewat form di bawah.';

const setUsulanNilai = (k, value) => {
  const s = usulanSlices.value[k];
  if (!s) return;
  const target = Math.max(0, Math.round(toNumber(value)));
  tryRealokasiChange(
    applyTargetNilai(draft.realokasi, s, target),
    (after, prevLen) => after.length === prevLen && !!after[s.key] && Math.round(after[s.key].nilai) === target,
    AMBIGU_MSG
  );
};
const setUsulanPersen = (k, value) => {
  const pagu = toNumber(draft.pagu);
  if (!(pagu > 0)) {
    pieHint.value = 'Isi Pagu Anggaran (bagian Identitas & Pagu) dulu agar persen bisa dihitung ke rupiah.';
    return;
  }
  setUsulanNilai(k, (toNumber(value) / 100) * pagu);
};
const absorbGap = (k) => {
  const s = usulanSlices.value[k];
  if (s) setUsulanNilai(k, s.nilai + balanceGap.value);
};
const addUsulanSlice = () => {
  const nama = uniqueName('Rekening Baru', [
    ...draft.rekeningProporsi.map((r) => r.nama),
    ...draft.realokasi.map((r) => r.rekening_nama)
  ]);
  draft.realokasi.push({ ...emptyRealokasiRow('TAMBAH'), rekening_nama: nama });
  selUsulan.value = usulanSlices.value.length - 1;
  pieHint.value = '';
};
const renameUsulan = (k, value) => {
  const s = usulanSlices.value[k];
  const name = String(value || '').trim();
  if (!s || s.fromAwal || !name || name === s.nama) return;
  tryRealokasiChange(
    renameSliceRows(draft.realokasi, s, name),
    (after, prevLen) => after.length === prevLen && !!after[s.key] && after[s.key].nama === name,
    AMBIGU_MSG
  );
};
const removeUsulan = (k) => {
  const s = usulanSlices.value[k];
  if (!s || s.fromAwal) return;
  replaceRealokasi(removeSliceRows(draft.realokasi, s));
  selUsulan.value = null;
  pieHint.value = '';
};

// ── Chart.js ─────────────────────────────────────────────────────────
const resolveCssVar = (varName, fallback) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
};
const buildChartPalette = () => [
  resolveCssVar('--primary-color', '#1B4D46'),
  resolveCssVar('--success-color', '#2FC98E'),
  resolveCssVar('--warning-color', '#F0AC42'),
  resolveCssVar('--danger-color', '#F0708A'),
  resolveCssVar('--accent-color', '#C97B3D'),
  resolveCssVar('--info-color', '#2E7D74'),
  resolveCssVar('--border-color-strong', '#C7DEDA')
];
const chartPaletteCss = ['var(--primary-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)', 'var(--accent-color)', 'var(--info-color)', 'var(--border-color-strong)'];

const pieAwalEl = ref(null);
const pieUsulanEl = ref(null);
let pieAwalChart = null;
let pieUsulanChart = null;

const pieDatasetOf = (dataset, palette, selectedPos) => ({
  data: dataset.map((d) => toNumber(d.persen)),
  backgroundColor: dataset.map((_, i) => palette[i % palette.length]),
  // Irisan terpilih "keluar" sedikit dari pie.
  offset: dataset.map((_, i) => (i === selectedPos ? 10 : 0)),
  borderWidth: 2,
  borderColor: '#ffffff',
  hoverBorderWidth: 3
});

const buildPieConfig = (dataset, palette, selectedPos, onSlice) => ({
  type: 'pie',
  data: {
    labels: dataset.map((d) => d.nama),
    datasets: [pieDatasetOf(dataset, palette, selectedPos)]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 8 },
    animation: { animateRotate: true, duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}%` } }
    },
    // Klik irisan = pilih irisan itu untuk diedit.
    onClick: (_evt, elements) => {
      if (elements && elements.length) onSlice(elements[0].index);
    },
    onHover: (evt, elements) => {
      const t = evt && evt.native && evt.native.target;
      if (t && t.style) t.style.cursor = elements && elements.length ? 'pointer' : 'default';
    }
  }
});

const onAwalSlice = (idx) => {
  const row = awalRows.value[idx]; // indeks di luar rincian = irisan "Lainnya": diabaikan
  if (row) toggleAwal(row.i);
};
const onUsulanSlice = (idx) => {
  if (usulanSlices.value[idx]) toggleUsulan(idx);
};

// Buat pie baru, atau perbarui pie yang sudah ada di tempat (tanpa animasi)
// agar menggeser slider terasa mulus.
const upsertPie = (chart, el, dataset, palette, selectedPos, onSlice) => {
  if (!el || !dataset.length) {
    if (chart) chart.destroy();
    return null;
  }
  if (chart && chart.canvas === el) {
    chart.data.labels = dataset.map((d) => d.nama);
    chart.data.datasets[0] = { ...chart.data.datasets[0], ...pieDatasetOf(dataset, palette, selectedPos) };
    chart.update('none');
    return chart;
  }
  if (chart) chart.destroy();
  return new Chart(el, buildPieConfig(dataset, palette, selectedPos, onSlice));
};

const syncBelanjaCharts = () => {
  if (tab.value !== 'belanja') return;
  const palette = buildChartPalette();
  pieAwalChart = upsertPie(pieAwalChart, pieAwalEl.value, awalChartData.value, palette, awalSelPos.value, onAwalSlice);
  pieUsulanChart = upsertPie(pieUsulanChart, pieUsulanEl.value, usulanChartData.value, palette, selUsulan.value, onUsulanSlice);
};
const destroyBelanjaCharts = () => {
  if (pieAwalChart) { pieAwalChart.destroy(); pieAwalChart = null; }
  if (pieUsulanChart) { pieUsulanChart.destroy(); pieUsulanChart = null; }
};

// Canvas berada di dalam tab yang disembunyikan (v-show) sampai pengguna
// membuka bagian "belanja" — Chart.js perlu ukuran canvas yang sudah final,
// jadi saat tab dibuka pie dibuat ulang setelah layout selesai. Perubahan
// data/seleksi berikutnya cukup memperbarui pie yang sudah ada.
const renderBelanjaChartsNextFrame = () => {
  destroyBelanjaCharts();
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(syncBelanjaCharts);
    });
  });
};

watch(tab, (val) => {
  if (val === 'belanja') renderBelanjaChartsNextFrame();
});
watch([awalChartData, usulanChartData, awalSelPos, selUsulan], () => {
  if (tab.value === 'belanja') nextTick(syncBelanjaCharts);
});
onMounted(() => {
  if (tab.value === 'belanja') renderBelanjaChartsNextFrame();
});
onBeforeUnmount(destroyBelanjaCharts);


// ── Simpan / tutup ───────────────────────────────────────────────────
const versionName = ref(defaultVersionName('Edit Manual'));
const versionNote = ref('');
const saving = ref(false);
const confirmDiscard = ref(false);

const canSave = computed(
  () => !saving.value && !!props.analysis.id && realMods.value.length > 0 && validation.value.errors.length === 0
);

const resetDraft = () => {
  Object.assign(draft, createDraft(props.analysis));
  selAwal.value = null;
  selUsulan.value = null;
  pieHint.value = '';
};

const requestClose = () => {
  if (saving.value) return;
  if (realMods.value.length > 0) {
    confirmDiscard.value = true;
    return;
  }
  emit('close');
};

const save = async () => {
  if (!canSave.value) return;
  saving.value = true;
  try {
    const note = versionNote.value.trim();
    const summary = summarizeModifications(mods.value);
    const result = await saveManualVersion(props.analysis.id, {
      parentVersionId: props.analysis.activeVersionId,
      versionName: versionName.value.trim() || defaultVersionName('Edit Manual'),
      changesSummary: note ? `${note} — ${summary}` : `Edit manual. ${summary}`,
      data: draftToAnalysis(props.analysis, draft),
      createdBy: currentUser.value?.username || currentUser.value?.name || 'Pengguna',
      source: 'manual',
      modifications: modificationsForStorage(mods.value)
    });
    if (result) emit('saved', result);
  } finally {
    saving.value = false;
  }
};

// ── Esc menutup, kunci scroll halaman di belakang modal ──────────────
const onKeydown = (e) => {
  if (e.key === 'Escape') requestClose();
};
let prevOverflow = '';
onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = prevOverflow;
});
</script>
