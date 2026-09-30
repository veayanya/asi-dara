<template>
  <div 
    v-if="isOpen" 
    class="cbb-modal-backdrop"
    style="position: fixed; inset: 0; background: rgba(17, 24, 39, 0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;"
    @click.self="$emit('close')"
  >
    <div 
      class="cbb-glass-panel cbb-animate-fade-in"
      style="width: 100%; max-width: 760px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent); box-shadow: 0 20px 40px rgba(17, 24, 39, 0.35);"
    >
      <!-- Modal Header -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; background: color-mix(in srgb, var(--primary-color) 8%, transparent);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">🧮</span>
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
              Kalkulator Indikator Pembangunan & Kinerja Anggaran
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Kepmendagri No. 690.900-327 Tahun 1996 • Permendagri 86/2017 • Metodologi BPS
            </p>
          </div>
        </div>
        <button 
          @click="$emit('close')"
          style="background: transparent; border: none; font-size: 1.25rem; color: var(--text-secondary); cursor: pointer;"
          class="cbb-close-btn"
        >
          ✕
        </button>
      </div>

      <!-- Tab Buttons for Indicator Types -->
      <div style="display: flex; gap: 0.25rem; padding: 0.75rem 1.5rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-subtle); overflow-x: auto;">
        <button
          v-for="t in calcTabs"
          :key="t.id"
          @click="activeTab = t.id"
          :style="{
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.775rem',
            fontWeight: activeTab === t.id ? '700' : '500',
            background: activeTab === t.id ? 'color-mix(in srgb, var(--primary-color) 25%, transparent)' : 'transparent',
            color: activeTab === t.id ? 'var(--primary-color)' : 'var(--text-secondary)',
            border: activeTab === t.id ? '1px solid color-mix(in srgb, var(--primary-color) 40%, transparent)' : '1px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Modal Body (Form & Results) -->
      <div style="padding: 1.5rem; overflow-y: auto; flex: 1;">
        
        <!-- 1. Pertumbuhan PDRB -->
        <div v-if="activeTab === 'pdrb'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
            <strong>Rumus PDRB ADHK:</strong> ((PDRB th_n − PDRB th_n-1) / PDRB th_n-1) × 100%
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                PDRB Tahun Sebelumnya (th n-1)
              </label>
              <input 
                v-model="pdrb.nMin1" 
                type="number" 
                step="any"
                placeholder="53.4" 
                style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);"
              />
              <span style="font-size: 0.7rem; color: var(--text-muted);">(Misal dalam Triliun Rp)</span>
            </div>

            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                PDRB Tahun Berjalan (th n)
              </label>
              <input 
                v-model="pdrb.n" 
                type="number" 
                step="any"
                placeholder="56.2" 
                style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);"
              />
              <span style="font-size: 0.7rem; color: var(--text-muted);">(Misal dalam Triliun Rp)</span>
            </div>
          </div>

          <div v-if="pdrbResult.valid" style="background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent); border-radius: 12px; padding: 1.25rem; margin-top: 0.5rem;">
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Laju Pertumbuhan Ekonomi</div>
            <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color); font-family: var(--font-mono); margin: 0.25rem 0;">
              {{ pdrbResult.laju }}%
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary);">
              <strong>Interpretasi:</strong> {{ pdrbResult.interpretasi }}
            </p>
          </div>
        </div>

        <!-- 2. Efektivitas Anggaran (Kepmendagri 690/1996) -->
        <div v-if="activeTab === 'efektivitas'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--info-color) 8%, transparent); border-left: 3px solid var(--info-color); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
            <strong>Kepmendagri 690.900-327/1996:</strong> Efektivitas (%) = (Realisasi Output / Target Output) × 100%
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                Target Output RKA/DPA (Fisik/Outcome)
              </label>
              <input 
                v-model="efektivitasForm.target" 
                type="number" 
                step="any"
                placeholder="100" 
                style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);"
              />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                Realisasi Output Riil
              </label>
              <input 
                v-model="efektivitasForm.realisasi" 
                type="number" 
                step="any"
                placeholder="95" 
                style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);"
              />
            </div>
          </div>

          <div v-if="efektivitasResult.valid" style="background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--info-color) 40%, transparent); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Persentase Efektivitas</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--info-color); font-family: var(--font-mono);">
                  {{ efektivitasResult.persen }}%
                </div>
              </div>
              <span class="cbb-badge cbb-badge-blue" style="font-size: 0.85rem;">
                {{ efektivitasResult.predikat }}
              </span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.5rem;">
              {{ efektivitasResult.penjelasan }}
            </p>
          </div>
        </div>

        <!-- 3. Efisiensi Anggaran (Kepmendagri 690/1996) -->
        <div v-if="activeTab === 'efisiensi'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--warning-color) 8%, transparent); border-left: 3px solid var(--warning-color); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
            <strong>Kepmendagri 690.900-327/1996:</strong> Efisiensi (%) = (Rasio Serapan Anggaran / Rasio Capaian Output) × 100%
            <br><span style="font-size: 0.75rem; color: var(--warning-hover);">Semakin kecil rasio (&lt; 60%), semakin hemat/efisien program dilaksanakan.</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Pagu Anggaran (Rp)</label>
              <input v-model="efisiensiForm.pagu" type="number" step="any" placeholder="100000000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Realisasi Belanja Anggaran (Rp)</label>
              <input v-model="efisiensiForm.realAnggaran" type="number" step="any" placeholder="85000000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Target Kinerja Output (Fisik)</label>
              <input v-model="efisiensiForm.targetOut" type="number" step="any" placeholder="100" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Realisasi Kinerja Output (Fisik)</label>
              <input v-model="efisiensiForm.realOut" type="number" step="any" placeholder="100" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
          </div>

          <div v-if="efisiensiResult.valid" style="background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--warning-color) 40%, transparent); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Indeks Efisiensi Anggaran</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--warning-color); font-family: var(--font-mono);">
                  {{ efisiensiResult.efisiensi }}%
                </div>
              </div>
              <span class="cbb-badge cbb-badge-gold" style="font-size: 0.85rem;">
                {{ efisiensiResult.predikat }}
              </span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.5rem;">
              {{ efisiensiResult.penjelasan }}
            </p>
          </div>
        </div>

        <!-- 4. SROI Simulator (Social Return on Investment) -->
        <div v-if="activeTab === 'sroi'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
            <strong>SROI Ratio:</strong> (Total Nilai Manfaat Sosial − Faktor Pengurang) / Total Biaya Investasi
            <br><span style="font-size: 0.75rem; color: var(--primary-color);">SROI &gt; 1 = Dampak sosial positif melampaui biaya investasi daerah.</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                Total Investasi / Biaya Program (Rp)
              </label>
              <input v-model="sroiForm.investasi" type="number" step="any" placeholder="500000000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                Total Nilai Manfaat Sosial (Proxy Rp)
              </label>
              <input v-model="sroiForm.manfaat" type="number" step="any" placeholder="1250000000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div style="grid-column: span 2;">
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                Faktor Pengurang / Deadweight & Attribution (Rp) — Opsional
              </label>
              <input v-model="sroiForm.faktorPengurang" type="number" step="any" placeholder="100000000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
          </div>

          <div v-if="sroiResult.valid" style="background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Rasio SROI Program</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color); font-family: var(--font-mono);">
                  {{ sroiResult.ratio }}
                </div>
              </div>
              <span class="cbb-badge cbb-badge-emerald" style="font-size: 0.85rem;">
                {{ sroiResult.ratio > 1 ? 'Sangat Layak (Social Gain)' : 'Perlu Evaluasi' }}
              </span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.5rem;">
              {{ sroiResult.interpretasi }}
            </p>
          </div>
        </div>

        <!-- 5. Realisasi Anggaran (Serapan) -->
        <div v-if="activeTab === 'realisasi'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
            <strong>Rumus:</strong> (Realisasi Belanja / Pagu Anggaran) × 100%
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Pagu Alokasi Anggaran (DPA/APBD)</label>
              <input v-model="realisasi.pagu" type="number" step="any" placeholder="1000000000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Realisasi Belanja Riil</label>
              <input v-model="realisasi.real" type="number" step="any" placeholder="924000000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
          </div>

          <div v-if="realisasiResult.valid" style="background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Persentase Serapan</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color); font-family: var(--font-mono);">
                  {{ realisasiResult.persen }}%
                </div>
              </div>
              <span class="cbb-badge cbb-badge-emerald" style="font-size: 0.8rem;">
                {{ realisasiResult.predikat }}
              </span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.5rem;">
              {{ realisasiResult.status }}
            </p>
          </div>
        </div>

        <!-- 6. Simulasi IPM -->
        <div v-if="activeTab === 'ipm'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
            <strong>Metode Baru BPS:</strong> Rata-rata Geometrik Indeks Kesehatan, Pendidikan (HLS+RLS), dan Pengeluaran Riil.
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Umur Harapan Hidup / UHH (Tahun)</label>
              <input v-model="ipmForm.uhh" type="number" step="0.01" placeholder="74.2" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Harapan Lama Sekolah / HLS (Tahun)</label>
              <input v-model="ipmForm.hls" type="number" step="0.01" placeholder="12.5" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Rata-rata Lama Sekolah / RLS (Tahun)</label>
              <input v-model="ipmForm.rls" type="number" step="0.01" placeholder="8.1" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Pengeluaran Riil per Kapita (Rp/tahun)</label>
              <input v-model="ipmForm.pengeluaran" type="number" step="1000" placeholder="11200000" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
          </div>

          <div v-if="ipmResult.valid" style="background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Skor Indeks Pembangunan Manusia</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color); font-family: var(--font-mono);">
                  {{ ipmResult.ipm }}
                </div>
              </div>
              <span class="cbb-badge cbb-badge-emerald" style="font-size: 0.8rem;">
                Kategori: {{ ipmResult.kategori }}
              </span>
            </div>
          </div>
        </div>

        <!-- 7. Capaian Kinerja IKU -->
        <div v-if="activeTab === 'iku'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
            <strong>Permendagri 86/2017:</strong> Pengukuran ketercapaian target IKU Perangkat Daerah / RPJMD.
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Target Rencana (Renstra / RKPD)</label>
              <input v-model="ikuForm.target" type="number" step="any" placeholder="100" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Realisasi Kinerja Riil</label>
              <input v-model="ikuForm.realisasi" type="number" step="any" placeholder="96" style="width: 100%; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);" />
            </div>
          </div>

          <div v-if="ikuResult.valid" style="background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Tingkat Capaian Kinerja</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color); font-family: var(--font-mono);">
                  {{ ikuResult.capaian }}%
                </div>
              </div>
              <span class="cbb-badge cbb-badge-emerald" style="font-size: 0.8rem;">
                {{ ikuResult.predikat }}
              </span>
            </div>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; background: var(--bg-tertiary);">
        <button 
          @click="$emit('close')" 
          class="cbb-btn-secondary"
          style="padding: 0.5rem 1rem; font-size: 0.8rem;"
        >
          Tutup
        </button>
        <button 
          @click="insertIntoChat"
          class="cbb-btn-primary"
          style="padding: 0.5rem 1.25rem; font-size: 0.8rem;"
        >
          <span>💬</span> Masukkan Hasil ke Percakapan
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  hitungPertumbuhanEkonomi, 
  hitungRealisasiAnggaran, 
  hitungEfektivitasAnggaran,
  hitungEfisiensiAnggaran,
  hitungSROIRatio,
  hitungSimulasiIPM, 
  hitungCapaianKinerja 
} from '../../services/calculationEngine.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'insert-chat']);

const calcTabs = [
  { id: 'pdrb', label: '📈 Pertumbuhan PDRB' },
  { id: 'efektivitas', label: '🎯 Efektivitas (Kepmendagri 690)' },
  { id: 'efisiensi', label: '⚡ Efisiensi Anggaran' },
  { id: 'sroi', label: '💎 SROI Simulator' },
  { id: 'realisasi', label: '💰 Serapan Anggaran' },
  { id: 'ipm', label: '👥 Simulasi IPM' },
  { id: 'iku', label: '🏆 Capaian IKU' }
];

const activeTab = ref('pdrb');

// Form states
const pdrb = ref({ nMin1: 53.4, n: 56.2 });
const efektivitasForm = ref({ target: 100, realisasi: 95 });
const efisiensiForm = ref({ pagu: 100000000, realAnggaran: 85000000, targetOut: 100, realOut: 100 });
const sroiForm = ref({ investasi: 500000000, manfaat: 1250000000, faktorPengurang: 100000000 });
const realisasi = ref({ pagu: 1000000000, real: 924000000 });
const ipmForm = ref({ uhh: 74.2, hls: 12.5, rls: 8.1, pengeluaran: 11200000 });
const ikuForm = ref({ target: 100, realisasi: 96, jenis: 'positif' });

const pdrbResult = computed(() => hitungPertumbuhanEkonomi(pdrb.value.n, pdrb.value.nMin1));
const efektivitasResult = computed(() => hitungEfektivitasAnggaran(efektivitasForm.value.realisasi, efektivitasForm.value.target));
const efisiensiResult = computed(() => hitungEfisiensiAnggaran(efisiensiForm.value.realAnggaran, efisiensiForm.value.pagu, efisiensiForm.value.realOut, efisiensiForm.value.targetOut));
const sroiResult = computed(() => hitungSROIRatio(sroiForm.value.investasi, sroiForm.value.manfaat, sroiForm.value.faktorPengurang));
const realisasiResult = computed(() => hitungRealisasiAnggaran(realisasi.value.real, realisasi.value.pagu));
const ipmResult = computed(() => hitungSimulasiIPM(ipmForm.value.uhh, ipmForm.value.hls, ipmForm.value.rls, ipmForm.value.pengeluaran));
const ikuResult = computed(() => hitungCapaianKinerja(ikuForm.value.realisasi, ikuForm.value.target, ikuForm.value.jenis));

function insertIntoChat() {
  let promptText = '';
  if (activeTab.value === 'pdrb' && pdrbResult.value.valid) {
    promptText = `Hitung pertumbuhan PDRB dari ${pdrb.value.nMin1} triliun ke ${pdrb.value.n} triliun`;
  } else if (activeTab.value === 'efektivitas' && efektivitasResult.value.valid) {
    promptText = `Hitung efektivitas anggaran dengan realisasi ${efektivitasForm.value.realisasi} dan target ${efektivitasForm.value.target}`;
  } else if (activeTab.value === 'efisiensi' && efisiensiResult.value.valid) {
    promptText = `Hitung efisiensi anggaran: pagu ${efisiensiForm.value.pagu}, realisasi ${efisiensiForm.value.realAnggaran}, target output ${efisiensiForm.value.targetOut}, realisasi output ${efisiensiForm.value.realOut}`;
  } else if (activeTab.value === 'sroi' && sroiResult.value.valid) {
    promptText = `Hitung SROI untuk investasi Rp ${sroiForm.value.investasi} dan manfaat sosial Rp ${sroiForm.value.manfaat}`;
  } else if (activeTab.value === 'realisasi' && realisasiResult.value.valid) {
    promptText = `Hitung persentase realisasi anggaran ${realisasi.value.real} dari pagu ${realisasi.value.pagu}`;
  } else if (activeTab.value === 'ipm' && ipmResult.value.valid) {
    promptText = `Jelaskan capaian simulasi IPM dengan UHH ${ipmForm.value.uhh}, HLS ${ipmForm.value.hls}, RLS ${ipmForm.value.rls}, pengeluaran ${ipmForm.value.pengeluaran}`;
  } else if (activeTab.value === 'iku' && ikuResult.value.valid) {
    promptText = `Jelaskan analisis capaian kinerja IKU dengan target ${ikuForm.value.target} dan realisasi ${ikuForm.value.realisasi}`;
  }

  if (promptText) {
    emit('insert-chat', promptText);
    emit('close');
  }
}
</script>
