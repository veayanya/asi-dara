<template>
  <div class="ba-wrapper">

    <!-- ═══════════════════════════════════════════════════════════════
         TOOLBAR KONTROL
    ════════════════════════════════════════════════════════════════ -->
    <div class="ba-toolbar">
      <div class="ba-toolbar-left">
        <span class="ba-toolbar-title">
          <i class="fa-solid fa-file-circle-check"></i>
          Berita Acara Verifikasi &amp; Validasi Rancangan <strong>Akhir</strong> Renja PD 2027
        </span>
      </div>
      <div class="ba-toolbar-right">
        <button type="button" class="btn btn-sm" :class="editMode ? 'btn-success' : 'btn-secondary'" @click="toggleEditMode">
          <i class="fa-solid" :class="editMode ? 'fa-check' : 'fa-pen'"></i>
          {{ editMode ? 'Selesai Edit' : 'Edit di Kertas' }}
        </button>
        <button type="button" class="btn btn-secondary btn-sm" @click="resetForm">
          <i class="fa-solid fa-rotate-left"></i> Reset
        </button>
        <button type="button" class="btn btn-primary btn-sm" @click="cetakDokumen">
          <i class="fa-solid fa-print"></i> Cetak / Simpan PDF
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         FORM INPUT (IDENTITAS DOKUMEN)
    ════════════════════════════════════════════════════════════════ -->
    <div class="ba-form-card">
      <div class="ba-form-head">
        <i class="fa-solid fa-pen-to-square"></i>
        <span>Isi Data Dokumen</span>
      </div>
      <div class="ba-form-grid">
        <div class="ba-field">
          <label class="ba-label">Hari</label>
          <input v-model="form.hari" type="text" class="form-input" placeholder="Senin / Selasa …" />
        </div>
        <div class="ba-field">
          <label class="ba-label">Tanggal</label>
          <input v-model="form.tanggal" type="number" class="form-input" min="1" max="31" placeholder="1 – 31" />
        </div>
        <div class="ba-field">
          <label class="ba-label">Bulan</label>
          <select v-model="form.bulan" class="form-input">
            <option value="">— Pilih Bulan —</option>
            <option v-for="b in bulanList" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="ba-field">
          <label class="ba-label">Jenis OPD</label>
          <select v-model="form.jenisOpd" class="form-input">
            <option value="Kecamatan">Kecamatan</option>
            <option value="Dinas">Dinas</option>
            <option value="Badan">Badan</option>
          </select>
        </div>
        <div class="ba-field ba-field-full">
          <label class="ba-label">Nama Perangkat Daerah</label>
          <input v-model="form.namaOpd" type="text" class="form-input" placeholder="Nama Kecamatan / Dinas / Badan …" />
        </div>
        <div class="ba-field">
          <label class="ba-label">Bidang Verifikator (Kabid)</label>
          <input v-model="form.kabid" type="text" class="form-input" placeholder="Bidang Perencanaan …" />
        </div>
        <div class="ba-field">
          <label class="ba-label">Nama Verifikator</label>
          <input v-model="form.namaVerifikator" type="text" class="form-input" placeholder="Nama lengkap verifikator" />
        </div>
        <div class="ba-field">
          <label class="ba-label">Nama Ketua Tim Penyusun OPD</label>
          <input v-model="form.namaKetuaTim" type="text" class="form-input" placeholder="Nama lengkap" />
        </div>
        <div class="ba-field">
          <label class="ba-label">Nama OPD (Formulir 2 &amp; TTD)</label>
          <input v-model="form.namaOpdF2" type="text" class="form-input" placeholder="Sama bila sama dengan nama di atas" />
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         PRATINJAU DOKUMEN (KERTAS F4)
    ════════════════════════════════════════════════════════════════ -->
    <div class="ba-canvas" id="ba-print-area-akhir">

      <!-- ── HALAMAN 1: BERITA ACARA UTAMA ──────────────────────── -->
      <div class="ba-paper">
        <div class="ba-doc-title">BERITA ACARA</div>
        <div class="ba-doc-subtitle">HASIL VERIFIKASI RANCANGAN AKHIR</div>
        <div class="ba-doc-subtitle">RENCANA KERJA (RENJA) PERANGKAT DAERAH TAHUN 2027</div>

        <p class="ba-para">
          Pada hari ini, <span class="ba-fill">{{ form.hari || '…' }}</span>, tanggal
          <span class="ba-fill">{{ form.tanggal || '…' }}</span> bulan
          <span class="ba-fill">{{ form.bulan || '…' }}</span>
          tahun Dua Ribu Dua Puluh Enam telah dilaksanakan verifikasi terhadap Rancangan Akhir
          Renja Perangkat Daerah
          <span class="ba-fill">{{ form.jenisOpd || 'Kecamatan/Dinas/Badan' }}/{{ form.namaOpd || '…' }}</span>
          Kabupaten Cirebon, yang dihadiri tim penyusun Renja Perangkat Daerah sebagaimana
          Surat Keputusan Bupati, terlampir.
        </p>
        <p class="ba-para">Setelah membaca, menelaah dan mempertimbangkan maka disepakati bahwa :</p>

        <table class="ba-table ba-diktum-table">
          <tbody>
            <tr>
              <td class="ba-diktum-no">Kesatu</td>
              <td class="ba-diktum-sep">:</td>
              <td>Dituangkan simpulan saran dan rekomendasi penyempurnaan sesuai hasil verifikasi terhadap proses penyusunan, sebagaimana terlampir;</td>
            </tr>
            <tr>
              <td class="ba-diktum-no">Kedua</td>
              <td class="ba-diktum-sep">:</td>
              <td>Dituangkan simpulan saran dan rekomendasi penyempurnaan sesuai hasil verifikasi terhadap sistematika/tata naskah renja, sebagaimana terlampir;</td>
            </tr>
            <tr>
              <td class="ba-diktum-no">Ketiga</td>
              <td class="ba-diktum-sep">:</td>
              <td>Hasil verifikasi terhadap substansi renja sesuai hasil analisis penilaian prioritas, sebagaimana terlampir;</td>
            </tr>
            <tr>
              <td class="ba-diktum-no">Keempat</td>
              <td class="ba-diktum-sep">:</td>
              <td>
                Berdasarkan saran dan rekomendasi penyempurnaan sebagaimana dimaksud pada diktum kesatu dan kedua,
                Kepala Perangkat Daerah menyempurnakan Rancangan Renja Perangkat Daerah dan menyampaikan kembali
                kepada Kepala Bapperida paling lambat 1 (satu) minggu setelah verifikasi dilakukan pada tautan:
                <span class="ba-link">https://s.id/renjaPD27KabCrb</span>.
              </td>
            </tr>
          </tbody>
        </table>

        <p class="ba-para">Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

        <table class="ba-table ba-ttd-table">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPERIDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah/</div>
                <div class="ba-ttd-sub">Ketua Tim Penyusun</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaKetuaTim', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaKetuaTim || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td v-for="(s, sIdx) in extraSigners" :key="s.id" class="ba-ttd-col">
                <button v-if="editMode" type="button" class="ba-signer-remove" @click="removeSigner(sIdx)" title="Hapus penandatangan ini">&times;</button>
                <div class="ba-ttd-label" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'label', $event)">{{ s.label }}</div>
                <div class="ba-ttd-sub" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'sub', $event)">{{ s.sub }}</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'name', $event)">{{ s.name || (editMode ? '' : '………………………………………….') }}</span>)</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="editMode" class="ba-signer-add-row">
          <button type="button" class="ba-signer-add" @click="addSigner">
            <i class="fa-solid fa-plus"></i> Tambah Penandatangan
          </button>
        </div>
      </div>

      <!-- ── HALAMAN 2: FORMULIR 1 ─────────────────────────────── -->
      <div class="ba-paper">
        <div class="ba-form-label">Formulir 1.</div>
        <div class="ba-form-title">Pengendalian dan Evaluasi terhadap Kebijakan Renja-PD</div>
        <div class="ba-opd-label">PD : <span class="ba-fill">{{ form.namaOpd || '…' }}</span></div>

        <table class="ba-table ba-checklist-table">
          <thead>
            <tr>
              <th rowspan="2" class="ba-th-no">No</th>
              <th rowspan="2" class="ba-th-kegiatan">Jenis Kegiatan</th>
              <th colspan="4">Hasil Pengendalian dan Evaluasi</th>
            </tr>
            <tr>
              <th colspan="2" class="ba-th-kesesuaian">Kesesuaian</th>
              <th class="ba-th-penyebab">Faktor Penyebab Ketidak Sesuaian</th>
              <th class="ba-th-tindak">Tindak Lanjut Penyempurnaan Apabila Tidak</th>
            </tr>
            <tr class="ba-th-sub">
              <th>(1)</th>
              <th>(2)</th>
              <th class="ba-th-ada">Ada</th>
              <th class="ba-th-ada">Tidak Ada</th>
              <th>(5)</th>
              <th>(6)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in formulir1Items" :key="idx">
              <td class="ba-td-c">{{ item.no }}</td>
              <td>{{ item.kegiatan }}</td>
              <td class="ba-td-c">
                <input type="radio" :name="'f1a-' + idx" value="ada" v-model="formulir1Results[idx].kesesuaian" />
              </td>
              <td class="ba-td-c">
                <input type="radio" :name="'f1a-' + idx" value="tidak" v-model="formulir1Results[idx].kesesuaian" />
              </td>
              <td>
                <input v-if="formulir1Results[idx].kesesuaian === 'tidak'"
                  v-model="formulir1Results[idx].faktor"
                  type="text" class="ba-inline-input" placeholder="Isi faktor…" />
              </td>
              <td>
                <input v-if="formulir1Results[idx].kesesuaian === 'tidak'"
                  v-model="formulir1Results[idx].tindak"
                  type="text" class="ba-inline-input" placeholder="Tindak lanjut…" />
              </td>
            </tr>
          </tbody>
        </table>

        <table class="ba-table ba-ttd-table" style="margin-top:20px;">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPERIDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah</div>
                <div class="ba-ttd-sub"><span class="ba-fill">{{ form.namaOpdF2 || form.namaOpd || '………………………………….' }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaKetuaTim', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaKetuaTim || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td v-for="(s, sIdx) in extraSigners" :key="s.id" class="ba-ttd-col">
                <button v-if="editMode" type="button" class="ba-signer-remove" @click="removeSigner(sIdx)" title="Hapus penandatangan ini">&times;</button>
                <div class="ba-ttd-label" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'label', $event)">{{ s.label }}</div>
                <div class="ba-ttd-sub" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'sub', $event)">{{ s.sub }}</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'name', $event)">{{ s.name || (editMode ? '' : '………………………………………….') }}</span>)</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="editMode" class="ba-signer-add-row">
          <button type="button" class="ba-signer-add" @click="addSigner">
            <i class="fa-solid fa-plus"></i> Tambah Penandatangan
          </button>
        </div>
      </div>

      <!-- ── HALAMAN 3: FORMULIR 2 ─────────────────────────────── -->
      <div class="ba-paper">
        <div class="ba-form-label">Formulir 2.</div>
        <div class="ba-form-title">
          Kesimpulan Pengendalian dan Evaluasi terhadap Kebijakan Renja Perangkat Daerah
          <span class="ba-fill">{{ form.jenisOpd || '' }} {{ form.namaOpdF2 || form.namaOpd || '…………………………………' }}</span>
          Kabupaten Cirebon
        </div>

        <table class="ba-table ba-checklist-table">
          <thead>
            <tr>
              <th class="ba-th-no">No</th>
              <th>Aspek</th>
              <th>Penjelasan Hasil Pengendalian dan Evaluasi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="ba-td-c">1.</td>
              <td>Perumusan prioritas dan sasaran pembangunan daerah tahunan lingkup kabupaten telah berpedoman pada kebijakan umum dan program Pembangunan jangka menengah daerah kabupaten serta mengacu pada RKPD provinsi dan RKP.</td>
              <td>
                <textarea v-model="formulir2.aspek1" class="ba-inline-textarea"
                  placeholder="Isi penjelasan hasil evaluasi…" rows="4"></textarea>
              </td>
            </tr>
            <tr>
              <td class="ba-td-c">2.</td>
              <td>Perumusan rencana program dan kegiatan prioritas daerah lingkup kabupaten dalam rangka pencapaian sasaran pembangunan jangka Menengah daerah serta pencapaian sasaran pembangunan tahunan provinsi dan nasional.</td>
              <td>
                <textarea v-model="formulir2.aspek2" class="ba-inline-textarea"
                  placeholder="Isi penjelasan hasil evaluasi…" rows="4"></textarea>
              </td>
            </tr>
          </tbody>
        </table>

        <table class="ba-table ba-ttd-table" style="margin-top:20px;">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPERIDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah/</div>
                <div class="ba-ttd-sub">Ketua Tim Penyusun</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaKetuaTim', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaKetuaTim || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td v-for="(s, sIdx) in extraSigners" :key="s.id" class="ba-ttd-col">
                <button v-if="editMode" type="button" class="ba-signer-remove" @click="removeSigner(sIdx)" title="Hapus penandatangan ini">&times;</button>
                <div class="ba-ttd-label" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'label', $event)">{{ s.label }}</div>
                <div class="ba-ttd-sub" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'sub', $event)">{{ s.sub }}</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'name', $event)">{{ s.name || (editMode ? '' : '………………………………………….') }}</span>)</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="editMode" class="ba-signer-add-row">
          <button type="button" class="ba-signer-add" @click="addSigner">
            <i class="fa-solid fa-plus"></i> Tambah Penandatangan
          </button>
        </div>
      </div>

      <!-- ── HALAMAN 4: FORMULIR 3 ─────────────────────────────── -->
      <div class="ba-paper">
        <div class="ba-form-label">Formulir 3.</div>
        <div class="ba-form-title">Verifikasi Tata Naskah Renja-PD</div>

        <table class="ba-table ba-checklist-table">
          <thead>
            <tr>
              <th rowspan="2" class="ba-th-no">No</th>
              <th rowspan="2" class="ba-th-kegiatan">Sistematika</th>
              <th colspan="4">Hasil Verifikasi</th>
            </tr>
            <tr>
              <th class="ba-th-ada">Ada</th>
              <th class="ba-th-ada">Tidak Ada</th>
              <th class="ba-th-penyebab">Faktor penyebab ketidaksesuaian</th>
              <th class="ba-th-tindak">Tindak lanjut penyempurnaan apabila tidak sesuai</th>
            </tr>
            <tr class="ba-th-sub">
              <th>(1)</th><th>(2)</th><th>(3)</th><th>(4)</th><th>(5)</th><th>(6)</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, idx) in formulir3Items" :key="idx">
              <tr v-if="item.isHeader" class="ba-row-header">
                <td class="ba-td-c">{{ item.no }}</td>
                <td colspan="5"><strong>{{ item.sistematika }}</strong></td>
              </tr>
              <tr v-else>
                <td class="ba-td-c">{{ item.no }}</td>
                <td>{{ item.sistematika }}</td>
                <td class="ba-td-c">
                  <input type="radio" :name="'f3a-' + idx" value="ada" v-model="formulir3Results[idx].kesesuaian" />
                </td>
                <td class="ba-td-c">
                  <input type="radio" :name="'f3a-' + idx" value="tidak" v-model="formulir3Results[idx].kesesuaian" />
                </td>
                <td>
                  <input v-if="formulir3Results[idx].kesesuaian === 'tidak'"
                    v-model="formulir3Results[idx].faktor"
                    type="text" class="ba-inline-input" placeholder="Isi faktor…" />
                </td>
                <td>
                  <input v-if="formulir3Results[idx].kesesuaian === 'tidak'"
                    v-model="formulir3Results[idx].tindak"
                    type="text" class="ba-inline-input" placeholder="Tindak lanjut…" />
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <table class="ba-table ba-ttd-table" style="margin-top:20px;">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPERIDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah/</div>
                <div class="ba-ttd-sub">Ketua Tim Penyusun</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaKetuaTim', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaKetuaTim || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td v-for="(s, sIdx) in extraSigners" :key="s.id" class="ba-ttd-col">
                <button v-if="editMode" type="button" class="ba-signer-remove" @click="removeSigner(sIdx)" title="Hapus penandatangan ini">&times;</button>
                <div class="ba-ttd-label" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'label', $event)">{{ s.label }}</div>
                <div class="ba-ttd-sub" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'sub', $event)">{{ s.sub }}</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onSignerBlur(s, 'name', $event)">{{ s.name || (editMode ? '' : '………………………………………….') }}</span>)</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="editMode" class="ba-signer-add-row">
          <button type="button" class="ba-signer-add" @click="addSigner">
            <i class="fa-solid fa-plus"></i> Tambah Penandatangan
          </button>
        </div>
      </div>

    </div><!-- /ba-canvas -->
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

/* ── Form identitas ─────────────────────────────────────────────── */
const form = reactive({
  hari: '',
  tanggal: '',
  bulan: '',
  jenisOpd: 'Kecamatan',
  namaOpd: '',
  kabid: '',
  namaVerifikator: '',
  namaKetuaTim: '',
  namaOpdF2: '',
});

const bulanList = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

/* ── Formulir 1 (Rancangan Akhir — 17 item) ────────────────────── */
const formulir1Items = [
  { no: '1.',   kegiatan: 'Pembentukan tim penyusun Renja Perangkat Daerah dan Penyusunan Agenda Kerja' },
  { no: '2.',   kegiatan: 'Pengolahan data dan informasi.' },
  { no: '3.',   kegiatan: 'Analisis gambaran pelayanan Perangkat Daerah kabupaten/kota' },
  { no: '4.',   kegiatan: 'Mengkaji hasil evaluasi Renja-Perangkat Daerah kabupaten/kota tahun lalu berdasarkan renstra-Perangkat Daerah kabupaten/kota.' },
  { no: '5.',   kegiatan: 'Penentuan isu-isu penting penyelenggaraan tugas dan fungsi Perangkat Daerah kabupaten/kota.' },
  { no: '6.',   kegiatan: 'Penelaahan rancangan awal RKPD kabupaten/kota.' },
  { no: '7.',   kegiatan: 'Perumusan tujuan dan sasaran.' },
  { no: '8.',   kegiatan: 'Kualitas Rumusan Hasil (Tujuan/Sasaran) telah jelas menggambarkan kondisi kinerja yang akan dicapai.' },
  { no: '9.',   kegiatan: 'Ukuran Keberhasilan (Indikator Kinerja) telah memenuhi kriteria SMART' },
  { no: '10.',  kegiatan: 'Target yang ditetapkan dalam Perencanaan Kinerja dapat dicapai (achievable), menantang, dan realistis disesuaikan dengan anggaran yang tersedia' },
  { no: '11.',  kegiatan: 'Penelaahan usulan masyarakat.' },
  { no: '12.',  kegiatan: 'Perumusan kegiatan prioritas.' },
  { no: '13.',  kegiatan: 'Pelaksanaan forum Perangkat Daerah kabupaten/kota.' },
  { no: '13.a', kegiatan: 'Menyelaraskan program dan kegiatan Perangkat Daerah kabupaten/kota dengan usulan program dan kegiatan hasil Musrenbang kecamatan.' },
  { no: '13.b', kegiatan: 'Mempertajam indikator dan target kinerja program dan kegiatan Perangkat Daerah kabupaten/kota sesuai dengan tugas dan fungsi Perangkat Daerah kabupaten/kota.' },
  { no: '13.c.',kegiatan: 'Mensinkronkan program dan kegiatan antar Perangkat Daerah kabupaten/kota dalam rangka optimalisasi pencapaian sasaran sesuai dengan kewenangan dan sinergitas pelaksanaan.' },
  { no: '13.d', kegiatan: 'Menyesuaikan pendanaan program dan kegiatan prioritas berdasarkan pagu indikatif untuk masing-masing Perangkat Daerah kabupaten/kota sesuai surat edaran bupati/wali kota.' },
  { no: '14.',  kegiatan: 'Sasaran program dan kegiatan Perangkat Daerah kabupaten/kota disusun berdasarkan pendekatan kinerja, perencanaan dan penganggaran terpadu.' },
  { no: '15.',  kegiatan: 'Anggaran yang ditetapkan untuk perangkat daerah telah diarahkan pada sub kegiatan yang mengacu langsung pada Kinerja yang ingin dicapai. (outcome, sasaran dan tujuan)' },
  { no: '16.',  kegiatan: 'Aktifitas atau rincian belanja pada Pra RKA yang disusun telah mendukung kinerja yang ingin dicapai' },
  { no: '17.',  kegiatan: 'Terdapat perbaikan/penyempurnaan Dokumen Perencanaan Kinerja yang ditetapkan dari hasil analisis perbaikan kinerja sebelumnya (BA hasil Verifikasi Ranwal Renja PD dan LHE SAKIP dari Inspektorat)' },
];

const formulir1Results = reactive(
  formulir1Items.map(() => ({ kesesuaian: '', faktor: '', tindak: '' }))
);

/* ── Formulir 2 ─────────────────────────────────────────────────── */
const formulir2 = reactive({ aspek1: '', aspek2: '' });

/* ── Formulir 3 (Rancangan Akhir — sistematika lebih lengkap) ──── */
const formulir3Items = [
  /* BAB I */
  { no: 'I',   sistematika: 'Bab I PENDAHULUAN', isHeader: true },
  { no: '1.1', sistematika: 'Latar Belakang Penyusunan Renja PD (memuat pengertian dan proses penyusunan Renja, keterkaitan Renja dokumen perencanaan yang lain dan RAPBD amanat regulasi, dan nilai strategis Renja Perangkat Daerah)' },
  { no: '1.2', sistematika: 'Landasan Hukum (dibuat secara berjenjang dari UU sampai Perbup dan berurutan tahunnya yang relevan dan signifikan dalam penyusunan Renja Perangkat Daerah Tahun 2027 serta disusun sesuai dengan kaidah produk hukum)' },
  { no: '1.3', sistematika: 'Maksud dan Tujuan Penyusunan Renja PD Tahun 2027' },
  { no: '1.4', sistematika: 'Sistematika penulisan' },
  /* BAB II */
  { no: 'II',  sistematika: 'BAB II. HASIL EVALUASI RENJA PERANGKAT DAERAH TAHUN LALU', isHeader: true },
  { no: '2.1', sistematika: 'Evaluasi Pelaksanaan Renja Perangkat Daerah Tahun Lalu dan Capaian Renstra Perangkat Daerah (dibuat Analisa target kinerja program, kegiatan yang tidak terpenuhi, memenuhi target dan melebihi target dan faktor penyebabnya)' },
  { no: '2.2', sistematika: 'Analisis Kinerja Pelayanan Perangkat Daerah (memuat indikator SPM, IKK, SDGs bagi PD pengampu urusan harus dibuat target proyeksi thn berjalan dan tahun depannya sebagai bahan Bab 5 dan Bab 6 RKPD)' },
  { no: '2.3', sistematika: 'Rumusan permasalahan dan isu strategis tahun 2027 berdasarkan Renstra Perangkat Daerah Tahun 2025–2029, RKPD Tahun 2027, dan evaluasi hasil Renja Perangkat Daerah Tahun 2025, dan kondisi lingkungan dinamis.' },
  { no: '2.4', sistematika: 'Review terhadap Rancangan Awal RKPD' },
  { no: '2.5', sistematika: 'Penelaahan Usulan Program dan Kegiatan Masyarakat (Usulan PIK dan POKIR agar dicantumkan kalau ada)' },
  { no: '2.6', sistematika: 'Telaah pokok-pokok pikiran DPRD' },
  { no: '2.7', sistematika: 'Inovasi bidang urusan dalam upaya memberikan pelayanan kepada masyarakat' },
  /* BAB III */
  { no: 'III', sistematika: 'BAB III. TUJUAN DAN SASARAN PERANGKAT DAERAH', isHeader: true },
  { no: '3.1', sistematika: 'Telaahan terhadap Kebijakan Nasional (yang ada di RPJMN, Renstra Kementerian/Lembaga sesuai urusannya)' },
  { no: '3.2', sistematika: 'Tujuan, sasaran Renja Perangkat Daerah Definisi operasional dan rumus perhitungannya' },
  { no: '3.3', sistematika: 'Program dan Kegiatan beserta definisi operasional dan rumus perhitungan outcome program' },
  { no: '3.4', sistematika: 'Arah kebijakan yang sudah diselaraskan dengan Renstra Perangkat Daerah Tahun 2025–2029, RKP Tahun 2027, RKPD Tahun 2027, dan kebijakan nasional/daerah lainnya.' },
  /* BAB IV */
  { no: 'IV',  sistematika: 'BAB IV. RENCANA KERJA DAN PENDANAAN PERANGKAT DAERAH', isHeader: true },
  { no: '4.1', sistematika: 'Pohon Kinerja dan cross cutting (mengacu pada Permenpan No 89/2021 tent Penjenjangan Kinerja sebagai bahan penilaian AKIP dari kemenpan)' },
  { no: '4.2', sistematika: 'Cascading Kinerja Renja PD dan crosscutting sesuai pagu yang diterima (mengacu pada Permenpan No 89/2021 tent Penjenjangan Kinerja sebagai bahan penilaian AKIP dari kemenpan)' },
  { no: '4.3', sistematika: 'Program dan kegiatan Prioritas berdasarkan cascading kinerja' },
  { no: '4.4', sistematika: 'Pencapaian program prioritas daerah, kontribusi terhadap pencapaian target nasional, pencapaian SPM (bagi bidang urusan terkait), dan tematik lainnya sesuai bidang urusan.' },
  /* BAB V */
  { no: 'V',   sistematika: 'BAB V. KINERJA PENYELENGGARAAN BIDANG URUSAN', isHeader: true },
  { no: '5.1', sistematika: 'Indikator Kinerja Utama Tahun 2027 yang didasarkan pada Renstra Perangkat Daerah Tahun 2025–2029 dan evaluasi hasil Renja Perangkat Daerah Tahun 2025' },
  { no: '5.2', sistematika: 'Indikator Kinerja Kunci (dan Indikator Utama Pembangunan/IUP) Tahun 2027 yang didasarkan pada Renstra Perangkat Daerah Tahun 2025–2029 dan evaluasi hasil Renja Perangkat Daerah Tahun 2025.' },
  /* BAB VI */
  { no: 'VI',  sistematika: 'BAB VI. PENUTUP', isHeader: true },
  { no: '',    sistematika: 'Catatan penting yang perlu mendapat perhatian, baik dalam rangka pelaksanaannya maupun seandainya ketersediaan anggaran tidak sesuai dengan kebutuhan' },
  { no: '',    sistematika: 'Kaidah-kaidah pelaksanaan' },
  { no: '',    sistematika: 'Rencana tindak lanjut' },
];

const formulir3Results = reactive(
  formulir3Items.map(() => ({ kesesuaian: '', faktor: '', tindak: '' }))
);

/* ── Aksi ────────────────────────────────────────────────────────── */
function resetForm() {
  Object.assign(form, {
    hari: '', tanggal: '', bulan: '', jenisOpd: 'Kecamatan',
    namaOpd: '', kabid: '', namaVerifikator: '', namaKetuaTim: '', namaOpdF2: ''
  });
  formulir1Results.forEach(r => Object.assign(r, { kesesuaian: '', faktor: '', tindak: '' }));
  formulir2.aspek1 = '';
  formulir2.aspek2 = '';
  formulir3Results.forEach(r => Object.assign(r, { kesesuaian: '', faktor: '', tindak: '' }));
}

/* ── Edit langsung di kertas (blok tanda tangan) ──────────────────── */
const editMode = ref(false);

function toggleEditMode() {
  editMode.value = !editMode.value;
}

// Dipanggil saat kursor keluar (blur) dari span contenteditable di blok
// tanda tangan. Update disimpan ke `form` supaya semua kemunculan blok
// VERIFIKATOR (halaman 1, Formulir 1, 2, 3) tetap sinkron.
function onFieldBlur(field, event) {
  form[field] = event.target.innerText.trim();
}

/* ── Kolom penandatangan tambahan (bisa tambah/hapus) ─────────────── */
let signerSeq = 0;
const extraSigners = reactive([]);

function addSigner() {
  signerSeq += 1;
  extraSigners.push({
    id: `signer-${Date.now()}-${signerSeq}`,
    label: 'PENANDATANGAN,',
    sub: 'Jabatan / Instansi',
    name: '',
  });
}

function removeSigner(idx) {
  extraSigners.splice(idx, 1);
}

function onSignerBlur(signer, field, event) {
  signer[field] = event.target.innerText.trim();
}

function cetakDokumen() {
  const wasEditing = editMode.value;
  editMode.value = false;
  requestAnimationFrame(() => {
    window.print();
    if (wasEditing) editMode.value = true;
  });
}
</script>

<style scoped>
/* ── Wrapper & toolbar ───────────────────────────────────────────── */
.ba-wrapper { display: flex; flex-direction: column; gap: 20px; }

.ba-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
}
.ba-toolbar-title {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.ba-toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; }

/* ── Form card ───────────────────────────────────────────────────── */
.ba-form-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}
.ba-form-head {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 18px;
  font-weight: 700; font-size: 0.85rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}
.ba-form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
}
.ba-field { display: flex; flex-direction: column; gap: 5px; }
.ba-field-full { grid-column: 1 / -1; }
.ba-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }

/* ── Canvas ──────────────────────────────────────────────────────── */
.ba-canvas {
  display: flex; flex-direction: column; gap: 32px;
  background: var(--bg-primary);
  padding: 28px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--card-border-radius);
}

/* ── Kertas F4 ───────────────────────────────────────────────────── */
.ba-paper {
  width: 215mm; min-height: 330mm;
  margin: 0 auto;
  padding: 20mm 20mm 25mm;
  background: #ffffff; color: #1a1d21;
  box-shadow: 0 12px 30px -10px rgba(17,24,39,.35);
  font-family: 'Bookman Old Style','Bookman','URW Bookman',Georgia,serif;
  font-size: 11pt; line-height: 1.6;
  display: flex; flex-direction: column; gap: 14px;
}

.ba-doc-title   { text-align:center; font-size:14pt; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
.ba-doc-subtitle{ text-align:center; font-size:12pt; font-weight:700; text-transform:uppercase; }

.ba-para { text-align: justify; }
.ba-fill { font-weight:600; text-decoration:underline; text-underline-offset:3px; }
.ba-fill-editable {
  display: inline-block;
  min-width: 60px;
  padding: 0 2px;
  outline: none;
  cursor: text;
  background: #fff9db;
  border-radius: 2px;
}
.ba-fill-editable:focus { background: #fff3bf; box-shadow: 0 0 0 1px #f59f00; }
.ba-link { font-weight:600; color:#1b4d46; }

.ba-form-label { font-weight:700; }
.ba-form-title { font-size:11pt; font-weight:700; margin-bottom:4px; text-align:center; }
.ba-opd-label  { font-weight:600; margin-bottom:6px; }

/* ── Tabel ───────────────────────────────────────────────────────── */
.ba-table { width:100%; border-collapse:collapse; font-size:9.5pt; }
.ba-table th,
.ba-table td { border:1px solid #1a1d21; padding:5px 7px; vertical-align:top; }
.ba-table th  { background:#f1f3f5; text-align:center; font-weight:700; }
.ba-td-c      { text-align:center; }
.ba-th-no     { width:40px; }
.ba-th-kegiatan{ width:42%; }
.ba-th-ada    { width:52px; text-align:center; }
.ba-th-penyebab{ width:17%; }
.ba-th-tindak { width:17%; }
.ba-th-sub th { font-size:8.5pt; }
.ba-row-header td { background:#e8edf3; font-weight:700; }

.ba-diktum-table  { margin:4px 0; }
.ba-diktum-no     { width:72px; font-weight:700; white-space:nowrap; }
.ba-diktum-sep    { width:20px; text-align:center; }

.ba-ttd-table { margin-top:20px; table-layout:fixed; width:100%; }
.ba-ttd-col   { text-align:center; border:none; padding:6px 12px; position:relative; vertical-align:top; }

/* Kolom penandatangan ekstra: tombol tambah/hapus */
.ba-signer-remove {
  position: absolute; top: 0; right: 4px;
  width: 20px; height: 20px; line-height: 18px;
  border: 1px solid #e03131; color: #e03131; background: #fff5f5;
  border-radius: 50%; font-size: 13px; font-weight: 700; cursor: pointer; padding: 0;
}
.ba-signer-remove:hover { background: #e03131; color: #fff; }
.ba-signer-add-row { text-align: center; margin: 10px 0 4px; }
.ba-signer-add {
  border: 1px dashed #495057; background: #f8f9fa; color: #495057;
  border-radius: 6px; padding: 5px 14px; font-size: 9pt; cursor: pointer;
}
.ba-signer-add:hover { background: #e9ecef; }
.ba-ttd-label { font-weight:700; }
.ba-ttd-sub   { font-size:10pt; }
.ba-ttd-space { height:70px; }
.ba-ttd-name  { font-weight:700; border-top:1px solid #1a1d21; display:inline-block; padding-top:4px; min-width:180px; }

/* ── Inline input ────────────────────────────────────────────────── */
.ba-inline-input {
  width:100%; border:1px dashed #aaa; border-radius:4px;
  padding:3px 5px; font-size:8.5pt; font-family:inherit;
  background:#fafafa; box-sizing:border-box;
}
.ba-inline-input:focus { outline:2px solid var(--primary-color); border-color:transparent; background:#fff; }

.ba-inline-textarea {
  width:100%; border:1px dashed #aaa; border-radius:4px;
  padding:5px 7px; font-size:9pt; font-family:inherit;
  background:#fafafa; box-sizing:border-box; resize:vertical;
}
.ba-inline-textarea:focus { outline:2px solid var(--primary-color); border-color:transparent; background:#fff; }

/* ── Responsif ───────────────────────────────────────────────────── */
@media (max-width:900px) {
  .ba-form-grid { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .ba-paper { width:100%; padding:12mm 10mm; }
}
@media (max-width:600px) {
  .ba-form-grid { grid-template-columns:1fr; }
}

/* ── Print ───────────────────────────────────────────────────────── */
@media print {
  .ba-toolbar,.ba-form-card { display:none !important; }
  .ba-canvas { background:white; padding:0; border:none; gap:0; }
  .ba-paper  { box-shadow:none; page-break-after:always; padding:20mm; }
  .ba-inline-input,.ba-inline-textarea { border:none; background:transparent; padding:0; }
  .ba-fill-editable { background:transparent !important; box-shadow:none !important; outline:none !important; }
  .ba-signer-remove, .ba-signer-add-row { display:none !important; }
}
</style>
