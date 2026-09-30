<template>
  <div class="ba-wrapper">

    <!-- ═══════════════════════════════════════════════════════════════════
         TOOLBAR KONTROL
    ════════════════════════════════════════════════════════════════════ -->
    <div class="ba-toolbar">
      <div class="ba-toolbar-left">
        <span class="ba-toolbar-title">
          <i class="fa-solid fa-file-contract"></i>
          Berita Acara Verifikasi &amp; Validasi Rancangan Awal Renja PD 2027
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

    <!-- ═══════════════════════════════════════════════════════════════════
         FORM INPUT (IDENTITAS DOKUMEN)
    ════════════════════════════════════════════════════════════════════ -->
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
          <label class="ba-label">Tahun</label>
          <input v-model="form.tahun" type="number" class="form-input" placeholder="2026" />
        </div>
        <div class="ba-field ba-field-full">
          <label class="ba-label">Nama Perangkat Daerah</label>
          <input v-model="form.namaOpd" type="text" class="form-input" placeholder="Dinas / Badan / Kecamatan …" />
        </div>

        <!-- Verifikator -->
        <div class="ba-field">
          <label class="ba-label">Bidang Verifikator (Kabid)</label>
          <input v-model="form.kabid" type="text" class="form-input" placeholder="Bidang Perencanaan …" />
        </div>
        <div class="ba-field">
          <label class="ba-label">Nama Verifikator</label>
          <input v-model="form.namaVerifikator" type="text" class="form-input" placeholder="Nama lengkap verifikator" />
        </div>

        <!-- TTD OPD -->
        <div class="ba-field">
          <label class="ba-label">Nama Ketua Tim Penyusun OPD</label>
          <input v-model="form.namaOpd2" type="text" class="form-input" placeholder="Nama lengkap" />
        </div>
        <div class="ba-field ba-field-full">
          <label class="ba-label">Nama Perangkat Daerah (Formulir 2)</label>
          <input v-model="form.namaOpdF2" type="text" class="form-input" placeholder="Sama seperti nama OPD di atas bila sama" />
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         PRATINJAU DOKUMEN (KERTAS F4)
    ════════════════════════════════════════════════════════════════════ -->
    <div class="ba-canvas" id="ba-print-area">

      <!-- ── HALAMAN 1: BERITA ACARA UTAMA ──────────────────────────── -->
      <div class="ba-paper">
        <div class="ba-doc-title">BERITA ACARA</div>
        <div class="ba-doc-subtitle">HASIL VERIFIKASI RANCANGAN</div>
        <div class="ba-doc-subtitle">RENCANA KERJA (RENJA) PERANGKAT DAERAH TAHUN 2027</div>

        <p class="ba-para">
          Pada hari ini, <span class="ba-fill">{{ form.hari || '………….' }}</span>, tanggal
          <span class="ba-fill">{{ form.tanggal || '……' }}</span> bulan
          <span class="ba-fill">{{ form.bulan || '………………………' }}</span> tahun
          <span class="ba-fill">{{ form.tahun || '2026' }}</span>
          telah dilaksanakan verifikasi terhadap Rancangan Renja Perangkat Daerah
          <span class="ba-fill">{{ form.namaOpd || '…………………………………………………………' }}</span>
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
              <td>Berdasarkan saran dan rekomendasi penyempurnaan sebagaimana dimaksud pada diktum kesatu dan kedua, Kepala Perangkat Daerah menyempurnakan Rancangan Renja Perangkat Daerah dan menyampaikan kembali kepada Kepala Bappelitbangda paling lambat 1 (satu) minggu setelah verifikasi dilakukan.</td>
            </tr>
          </tbody>
        </table>

        <p class="ba-para">Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

        <table class="ba-table ba-ttd-table">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPELITBANGDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah/</div>
                <div class="ba-ttd-sub">Ketua Tim Penyusun</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaOpd2', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaOpd2 || (editMode ? '' : '………………………………….') }}</span>)</div>
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

      <!-- ── HALAMAN 2: FORMULIR 1 ───────────────────────────────────── -->
      <div class="ba-paper">
        <div class="ba-form-label">Formulir 1.</div>
        <div class="ba-form-title">Pengendalian dan Evaluasi terhadap Kebijakan Renja-PD</div>
        <div class="ba-opd-label">PD : <span class="ba-fill">{{ form.namaOpd || '……………………………………' }}</span></div>

        <table class="ba-table ba-checklist-table">
          <thead>
            <tr>
              <th rowspan="2" class="ba-th-no">No</th>
              <th rowspan="2" class="ba-th-kegiatan">Jenis Kegiatan</th>
              <th colspan="4">Hasil Pengendalian dan Evaluasi</th>
            </tr>
            <tr>
              <th class="ba-th-kesesuaian" colspan="2">Kesesuaian</th>
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
                <input type="radio" :name="'f1-' + idx" value="ada"
                  v-model="formulir1Results[idx].kesesuaian" />
              </td>
              <td class="ba-td-c">
                <input type="radio" :name="'f1-' + idx" value="tidak"
                  v-model="formulir1Results[idx].kesesuaian" />
              </td>
              <td>
                <input v-if="formulir1Results[idx].kesesuaian === 'tidak'"
                  v-model="formulir1Results[idx].faktor"
                  type="text" class="ba-inline-input" placeholder="Isi faktor…" />
              </td>
              <td>
                <input v-if="formulir1Results[idx].kesesuaian === 'tidak'"
                  v-model="formulir1Results[idx].tindak"
                  type="text" class="ba-inline-input" placeholder="Isi tindak lanjut…" />
              </td>
            </tr>
          </tbody>
        </table>

        <table class="ba-table ba-ttd-table" style="margin-top:24px;">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPELITBANGDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah</div>
                <div class="ba-ttd-sub"><span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaOpd', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaOpd || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaOpd2', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaOpd2 || (editMode ? '' : '………………………………….') }}</span>)</div>
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

      <!-- ── HALAMAN 3: FORMULIR 2 ───────────────────────────────────── -->
      <div class="ba-paper">
        <div class="ba-form-label">Formulir 2.</div>
        <div class="ba-form-title">
          Kesimpulan Pengendalian dan Evaluasi terhadap Kebijakan Renja Perangkat Daerah
          <span class="ba-fill">{{ form.namaOpdF2 || form.namaOpd || '………………………………………' }}</span>
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

        <table class="ba-table ba-ttd-table" style="margin-top:24px;">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPELITBANGDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah/</div>
                <div class="ba-ttd-sub">Ketua Tim Penyusun</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaOpd2', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaOpd2 || (editMode ? '' : '………………………………….') }}</span>)</div>
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

      <!-- ── HALAMAN 4: FORMULIR 3 ───────────────────────────────────── -->
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
              <th>(1)</th>
              <th>(2)</th>
              <th>(3)</th>
              <th>(4)</th>
              <th>(5)</th>
              <th>(6)</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, idx) in formulir3Items" :key="idx">
              <!-- Baris bab (header) -->
              <tr v-if="item.isHeader" class="ba-row-header">
                <td class="ba-td-c">{{ item.no }}</td>
                <td colspan="5"><strong>{{ item.sistematika }}</strong></td>
              </tr>
              <!-- Baris item biasa -->
              <tr v-else>
                <td class="ba-td-c">{{ item.no }}</td>
                <td>{{ item.sistematika }}</td>
                <td class="ba-td-c">
                  <input type="radio" :name="'f3-' + idx" value="ada"
                    v-model="formulir3Results[idx].kesesuaian" />
                </td>
                <td class="ba-td-c">
                  <input type="radio" :name="'f3-' + idx" value="tidak"
                    v-model="formulir3Results[idx].kesesuaian" />
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

        <table class="ba-table ba-ttd-table" style="margin-top:24px;">
          <tbody>
            <tr>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">VERIFIKATOR,</div>
                <div class="ba-ttd-sub">A.n Kepala BAPPELITBANGDA</div>
                <div class="ba-ttd-sub">Kabid <span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('kabid', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.kabid || (editMode ? '' : '………………………………….') }}</span></div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaVerifikator', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaVerifikator || (editMode ? '' : '………………………………….') }}</span>)</div>
              </td>
              <td class="ba-ttd-col">
                <div class="ba-ttd-label">A.n. KEPALA Perangkat Daerah/</div>
                <div class="ba-ttd-sub">Ketua Tim Penyusun</div>
                <div class="ba-ttd-space"></div>
                <div class="ba-ttd-name">(<span class="ba-fill" :class="{ 'ba-fill-editable': editMode }" :contenteditable="editMode" @blur="onFieldBlur('namaOpd2', $event)" @keydown.enter.prevent="$event.target.blur()">{{ form.namaOpd2 || (editMode ? '' : '………………………………….') }}</span>)</div>
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

/* ── Form identitas ─────────────────────────────────────────────────── */
const form = reactive({
  hari: '',
  tanggal: '',
  bulan: '',
  tahun: '2026',
  namaOpd: '',
  kabid: '',
  namaVerifikator: '',
  namaOpd2: '',
  namaOpdF2: '',
});

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/* ── Formulir 1: daftar kegiatan ────────────────────────────────────── */
const formulir1Items = [
  { no: '1.', kegiatan: 'Pembentukan tim penyusun Renja Perangkat Daerah dan Penyusunan Agenda Kerja' },
  { no: '2.', kegiatan: 'Pengolahan data dan informasi.' },
  { no: '3.', kegiatan: 'Analisis gambaran pelayanan Perangkat Daerah kabupaten/kota' },
  { no: '4.', kegiatan: 'Mengkaji hasil evaluasi Renja-Perangkat Daerah kabupaten/kota tahun lalu berdasarkan renstra-Perangkat Daerah kabupaten/kota.' },
  { no: '5.', kegiatan: 'Penentuan isu-isu penting penyelenggaraan tugas dan fungsi Perangkat Daerah kabupaten/kota.' },
  { no: '6.', kegiatan: 'Penelaahan rancangan awal RKPD kabupaten/kota.' },
  { no: '7.', kegiatan: 'Perumusan tujuan dan sasaran.' },
  { no: '8.', kegiatan: 'Penelaahan usulan masyarakat.' },
  { no: '9.', kegiatan: 'Perumusan kegiatan prioritas.' },
  { no: '10.', kegiatan: 'Pelaksanaan forum Perangkat Daerah kabupaten/kota.' },
  { no: '10.a', kegiatan: 'Menyelaraskan program dan kegiatan Perangkat Daerah kabupaten/kota dengan usulan program dan kegiatan hasil Musrenbang kecamatan.' },
  { no: '10.b', kegiatan: 'Mempertajam indikator dan target kinerja program dan kegiatan Perangkat Daerah kabupaten/kota sesuai dengan tugas dan fungsi Perangkat Daerah kabupaten/kota.' },
  { no: '10.c.', kegiatan: 'Mensinkronkan program dan kegiatan antar Perangkat Daerah kabupaten/kota dalam rangka optimalisasi pencapaian sasaran sesuai dengan kewenangan dan sinergitas pelaksanaan.' },
  { no: '10.d', kegiatan: 'Menyesuaikan pendanaan program dan kegiatan prioritas berdasarkan pagu indikatif untuk masing-masing Perangkat Daerah kabupaten/kota sesuai surat edaran bupati/wali kota.' },
  { no: '11.', kegiatan: 'Sasaran program dan kegiatan Perangkat Daerah kabupaten/kota disusun berdasarkan pendekatan kinerja, perencanaan dan penganggaran terpadu.' },
  { no: '12.', kegiatan: 'Program dan kegiatan antar Perangkat Daerah kabupaten/kota dengan Perangkat Daerah lainnya dalam rangka optimalisasi pencapaian sasaran prioritas pembangunan daerah telah dibahas dalam Forum Perangkat Daerah kabupaten/kota.' },
  { no: '13.', kegiatan: 'Pendanaan program dan kegiatan prioritas berdasarkan pagu indikatif untuk masing-masing Perangkat Daerah kabupaten/kota telah menyusun dan memperhitungkan prakiraan maju.' },
  { no: '14.', kegiatan: 'Dokumen Renja Perangkat Daerah kabupaten/kota yang telah disahkan.' },
];

const formulir1Results = reactive(
  formulir1Items.map(() => ({ kesesuaian: '', faktor: '', tindak: '' }))
);

/* ── Formulir 2 ─────────────────────────────────────────────────────── */
const formulir2 = reactive({ aspek1: '', aspek2: '' });

/* ── Formulir 3: sistematika tata naskah ────────────────────────────── */
const formulir3Items = [
  { no: 'I',    sistematika: 'Bab I PENDAHULUAN', isHeader: true },
  { no: '1.1',  sistematika: 'Latar Belakang' },
  { no: '1.2',  sistematika: 'Landasan Hukum' },
  { no: '1.3',  sistematika: 'Maksud dan Tujuan' },
  { no: '1.4',  sistematika: 'Sistematika penulisan' },
  { no: 'II',   sistematika: 'BAB II. HASIL EVALUASI RENJA PERANGKAT DAERAH TAHUN LALU', isHeader: true },
  { no: '2.1',  sistematika: 'Evaluasi Pelaksanaan Renja Perangkat Daerah Tahun Lalu dan Capaian Renstra Perangkat Daerah' },
  { no: '2.2',  sistematika: 'Analisis Kinerja Pelayanan Perangkat Daerah' },
  { no: '2.3',  sistematika: 'Isu-isu Penting Penyelenggaraan Tugas dan Fungsi Perangkat Daerah' },
  { no: '2.4',  sistematika: 'Review terhadap Rancangan Awal RKPD' },
  { no: '2.5',  sistematika: 'Penelaahan Usulan Program dan Kegiatan Masyarakat' },
  { no: 'III',  sistematika: 'BAB III. TUJUAN DAN SASARAN PERANGKAT DAERAH', isHeader: true },
  { no: '3.1',  sistematika: 'Telaahan terhadap Kebijakan Nasional' },
  { no: '3.2',  sistematika: 'Tujuan dan sasaran Renja Perangkat Daerah' },
  { no: '3.3',  sistematika: 'Program dan Kegiatan' },
  { no: 'IV',   sistematika: 'RENCANA KERJA DAN PENDANAAN PERANGKAT DAERAH', isHeader: true },
  { no: 'V',    sistematika: 'BAB V. PENUTUP', isHeader: true },
  { no: '',     sistematika: 'Catatan penting yang perlu mendapat perhatian, baik dalam rangka pelaksanaannya maupun seandainya ketersediaan anggaran tidak sesuai dengan kebutuhan' },
  { no: '',     sistematika: 'Kaidah-kaidah pelaksanaan' },
  { no: '',     sistematika: 'Rencana tindak lanjut' },
];

const formulir3Results = reactive(
  formulir3Items.map(() => ({ kesesuaian: '', faktor: '', tindak: '' }))
);

/* ── Aksi ────────────────────────────────────────────────────────────── */
function resetForm() {
  Object.assign(form, {
    hari: '', tanggal: '', bulan: '', tahun: '2026',
    namaOpd: '', kabid: '', namaVerifikator: '', namaOpd2: '', namaOpdF2: ''
  });
  formulir1Results.forEach(r => Object.assign(r, { kesesuaian: '', faktor: '', tindak: '' }));
  formulir2.aspek1 = '';
  formulir2.aspek2 = '';
  formulir3Results.forEach(r => Object.assign(r, { kesesuaian: '', faktor: '', tindak: '' }));
}

/* ── Edit langsung di kertas (blok tanda tangan) ────────────────────── */
const editMode = ref(false);

function toggleEditMode() {
  editMode.value = !editMode.value;
}

// Dipanggil saat kursor keluar (blur) dari salah satu span contenteditable
// di blok tanda tangan. Update disimpan ke `form` supaya semua kemunculan
// blok VERIFIKATOR (halaman 1, Formulir 1, 2, 3) tetap sinkron.
function onFieldBlur(field, event) {
  form[field] = event.target.innerText.trim();
}

/* ── Kolom penandatangan tambahan (bisa tambah/hapus) ───────────────── */
// Dua kolom bawaan (Verifikator & Ketua Tim) tetap tetap; array ini
// menampung kolom EKSTRA yang ditambahkan lewat tombol "+ Tambah
// Penandatangan". Karena reactive & dipakai di ke-4 halaman, satu kali
// tambah/hapus langsung sinkron di seluruh dokumen.
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
  // Matikan mode edit dulu supaya garis putus-putus & style edit
  // tidak ikut tercetak / masuk PDF.
  const wasEditing = editMode.value;
  editMode.value = false;
  requestAnimationFrame(() => {
    window.print();
    if (wasEditing) editMode.value = true;
  });
}
</script>

<style scoped>
/* ── Wrapper & toolbar ─────────────────────────────────────────────── */
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

/* ── Form input card ───────────────────────────────────────────────── */
.ba-form-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}
.ba-form-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  font-weight: 700;
  font-size: 0.85rem;
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

/* ── Canvas (area cetak) ───────────────────────────────────────────── */
.ba-canvas {
  display: flex;
  flex-direction: column;
  gap: 32px;
  background: var(--bg-primary);
  padding: 28px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--card-border-radius);
}

/* ── Kertas F4 ─────────────────────────────────────────────────────── */
.ba-paper {
  width: 215mm;
  min-height: 330mm;
  margin: 0 auto;
  padding: 20mm 20mm 25mm;
  background: #ffffff;
  color: #1a1d21;
  box-shadow: 0 12px 30px -10px rgba(17, 24, 39, 0.35);
  font-family: 'Bookman Old Style', 'Bookman', 'URW Bookman', Georgia, serif;
  font-size: 11pt;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Judul berita acara */
.ba-doc-title {
  text-align: center;
  font-size: 14pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ba-doc-subtitle {
  text-align: center;
  font-size: 12pt;
  font-weight: 700;
  text-transform: uppercase;
}

.ba-para { text-align: justify; }
.ba-fill { font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
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

/* Label formulir */
.ba-form-label { font-weight: 700; }
.ba-form-title {
  font-size: 11pt;
  font-weight: 700;
  margin-bottom: 4px;
  text-align: center;
}
.ba-opd-label { font-weight: 600; margin-bottom: 6px; }

/* ── Tabel umum ─────────────────────────────────────────────────────── */
.ba-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5pt;
}
.ba-table th,
.ba-table td {
  border: 1px solid #1a1d21;
  padding: 5px 7px;
  vertical-align: top;
}
.ba-table th {
  background: #f1f3f5;
  text-align: center;
  font-weight: 700;
}
.ba-td-c { text-align: center; }
.ba-th-no { width: 40px; }
.ba-th-kegiatan { width: 42%; }
.ba-th-ada { width: 52px; text-align: center; }
.ba-th-penyebab { width: 18%; }
.ba-th-tindak { width: 18%; }
.ba-th-kesesuaian { }
.ba-th-sub th { font-size: 8.5pt; }
.ba-row-header td { background: #e8edf3; font-weight: 700; }

/* Tabel diktum */
.ba-diktum-table { margin: 4px 0; }
.ba-diktum-no { width: 70px; font-weight: 700; white-space: nowrap; }
.ba-diktum-sep { width: 20px; text-align: center; }

/* Tabel TTD */
.ba-ttd-table { margin-top: 20px; table-layout: fixed; width: 100%; }
.ba-ttd-col {
  text-align: center;
  border: none;
  padding: 6px 12px;
  position: relative;
  vertical-align: top;
}
.ba-ttd-label { font-weight: 700; }
.ba-ttd-sub { font-size: 10pt; }
.ba-ttd-space { height: 70px; }
.ba-ttd-name { font-weight: 700; border-top: 1px solid #1a1d21; display: inline-block; padding-top: 4px; min-width: 180px; }

/* Kolom penandatangan ekstra: tombol tambah/hapus */
.ba-signer-remove {
  position: absolute;
  top: 0;
  right: 4px;
  width: 20px;
  height: 20px;
  line-height: 18px;
  border: 1px solid #e03131;
  color: #e03131;
  background: #fff5f5;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.ba-signer-remove:hover { background: #e03131; color: #fff; }
.ba-signer-add-row { text-align: center; margin: 10px 0 4px; }
.ba-signer-add {
  border: 1px dashed #495057;
  background: #f8f9fa;
  color: #495057;
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 9pt;
  cursor: pointer;
}
.ba-signer-add:hover { background: #e9ecef; }

/* ── Input di dalam tabel ───────────────────────────────────────────── */
.ba-inline-input {
  width: 100%;
  border: 1px dashed #aaa;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 8.5pt;
  font-family: inherit;
  background: #fafafa;
  box-sizing: border-box;
}
.ba-inline-input:focus { outline: 2px solid var(--primary-color); border-color: transparent; background: #fff; }

.ba-inline-textarea {
  width: 100%;
  border: 1px dashed #aaa;
  border-radius: 4px;
  padding: 5px 7px;
  font-size: 9pt;
  font-family: inherit;
  background: #fafafa;
  box-sizing: border-box;
  resize: vertical;
}
.ba-inline-textarea:focus { outline: 2px solid var(--primary-color); border-color: transparent; background: #fff; }

/* ── Responsif ─────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .ba-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ba-paper { width: 100%; padding: 12mm 10mm; }
}
@media (max-width: 600px) {
  .ba-form-grid { grid-template-columns: 1fr; }
}

/* ── Print ─────────────────────────────────────────────────────────── */
@media print {
  .ba-toolbar, .ba-form-card { display: none !important; }
  .ba-canvas { background: white; padding: 0; border: none; gap: 0; }
  .ba-paper {
    box-shadow: none;
    page-break-after: always;
    padding: 20mm;
  }
  .ba-inline-input, .ba-inline-textarea {
    border: none;
    background: transparent;
    padding: 0;
  }
  .ba-fill-editable {
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
  .ba-signer-remove, .ba-signer-add-row { display: none !important; }
}
</style>
