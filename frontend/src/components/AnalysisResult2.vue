<template>
 <div class="sroi-result">

 <!-- ══════════ 1. HEADER ANALISIS (NAMA OPD, PROGRAM, KEGIATAN, SUB KEGIATAN, PAGU & TAHUN ANGGARAN) ══════════ -->
      <div class="rka-hero" style="margin-bottom: 20px;">
        <!-- 1. NAMA OPD -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">NAMA OPD</div>
          <div class="rka-hero-main-val">{{ cleanOpdName(analysis.opd || analysis.perangkatDaerah || '-') }}</div>
        </div>

        <!-- 2. PROGRAM -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">PROGRAM</div>
          <div class="rka-hero-text-val">{{ analysis.namaProgram || analysis.program || '-' }}</div>
        </div>

        <!-- 3. KEGIATAN -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">KEGIATAN</div>
          <div class="rka-hero-text-val">{{ analysis.kegiatan || analysis.namaKegiatan || '-' }}</div>
        </div>

        <!-- 4. SUB KEGIATAN -->
        <div class="rka-hero-row">
          <div class="rka-hero-label">SUB KEGIATAN</div>
          <div class="rka-hero-text-val">{{ analysis.subKegiatan || '-' }}</div>
        </div>

        <!-- 5. PAGU ANGGARAN (kiri) & TAHUN ANGGARAN (kanan) -->
        <div class="rka-hero-split-grid">

          <!-- Kolom Kiri -->
          <div class="rka-hero-col-left">
            <div class="rka-hero-item">
 <div class="rka-hero-label">PAGU ANGGARAN</div>
 <div class="rka-hero-text-val rka-pagu-val">{{ formatRupiah(analysis.pagu) }}</div>
 </div>
          </div>

          <!-- Kolom Kanan: TAHUN ANGGARAN & KOMPARASI TAHUN SEBELUMNYA -->
 <div class="rka-hero-col-right">
 <div class="rka-hero-label" style="margin-bottom: 8px;">TAHUN ANGGARAN</div>

 <div class="tahun-anggaran-box">
 <div class="tab-header-row">
 <span class="tab-year-title">TAHUN {{ currentYearCard.tahun }}</span>
 <span class="tab-year-badge">TAHUN BERJALAN</span>
 </div>
 <div class="tab-amount-num">{{ formatRupiah(currentYearCard.jumlah) }}</div>
 <div class="tab-delta-info" :class="currentYearCard.deltaClass">
 <span v-if="currentYearCard.hasDelta">
 <span class="tab-arrow">{{ currentYearCard.arrow }}</span>
 {{ currentYearCard.deltaLabel }} dari Tahun {{ currentYearCard.prevTahun }} ({{ currentYearCard.deltaPercent }}%)
 </span>
 <span v-else class="tab-neutral-info">
 Alokasi Definitif Tahun Anggaran {{ currentYearCard.tahun }}
 </span>
 </div>
 </div>
 </div>

 </div>
 </div>

 <!-- ══════════ TOP GRID: RATIO CARD + CHARTS ══════════ -->
 <div class="sroi-top-grid">

 <!-- Left column -->
 <div class="sroi-left-col">
 <div class="sroi-ratio-card" :class="sroiMetrics.tone">
 <div class="sroi-ratio-top">
 <span class="sroi-ratio-eyebrow">Rasio Nilai Prakiraan Dampak</span>
 <span class="sroi-status-pill" :class="sroiMetrics.tone">{{ sroiMetrics.sroiStatus }}</span>
 </div>
 <div class="sroi-ratio-value">{{ sroiMetrics.sroiRatioText }}</div>
 <div class="sroi-ratio-formula">Rasio Nilai Prakiraan Dampak = Nilai Dampak yang Dihasilkan Saat Ini ÷ Nilai Input</div>
 </div>

 <div class="sroi-stats-grid">
 <div class="sroi-stat-card">
 <div class="stat-label">Nilai Input (Pagu)</div>
 <div class="stat-value">{{ formatRupiah(sroiMetrics.valueOfInputs) }}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Total Nilai Dampak</div>
 <div class="stat-value">{{ formatRupiah(sroiMetrics.totalNilaiDampak) }}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Total Dampak Bersih</div>
 <div class="stat-value positive">{{ formatRupiah(sroiMetrics.netImpact) }}</div>
 </div>
 <div class="sroi-stat-card">
 <div class="stat-label">Dampak Nilai Saat Ini</div>
 <div class="stat-value positive">{{ formatRupiah(sroiMetrics.pvImpact) }}</div>
 </div>
 </div>

 <!-- Faktor Penyesuaian Dampak SROI -->
 <div class="sroi-factors-card">
 <div class="sroi-factors-title"> Faktor Penyesuaian Dampak Sosial</div>
 <div class="sroi-factors-grid">
 <div class="sroi-factor-item">
 <span class="factor-name">Kerugian Bobot</span>
 <span class="factor-val">{{ sroiMetrics.deadweight }}%</span>
 <span v-if="sroiGapExplanation" class="factor-loss">− {{ formatRupiah(sroiGapExplanation.lossDeadweight) }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Atribusi</span>
 <span class="factor-val">{{ sroiMetrics.attribution }}%</span>
 <span v-if="analysis.attributionReason" class="factor-hint">{{ analysis.attributionReason }}</span>
 <span v-if="sroiGapExplanation" class="factor-loss">− {{ formatRupiah(sroiGapExplanation.lossAttribution) }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Pergeseran Manfaat</span>
 <span class="factor-val">{{ sroiMetrics.displacement }}%</span>
 <span v-if="analysis.displacementReason" class="factor-hint">{{ analysis.displacementReason }}</span>
 <span v-if="sroiGapExplanation" class="factor-loss">− {{ formatRupiah(sroiGapExplanation.lossDisplacement) }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Penyusutan</span>
 <span class="factor-val">{{ sroiMetrics.dropOff }}%</span>
 <span class="factor-hint">{{ sroiMetrics.durationYears > 1 ? 'Penurunan multi-tahun' : 'Tidak berlaku (durasi 1 thn)' }}</span>
 </div>
 <div class="sroi-factor-item">
 <span class="factor-name">Tingkat Diskonto</span>
 <span class="factor-val">{{ sroiMetrics.discountRate }}%</span>
 <span class="factor-hint">{{ sroiMetrics.durationYears > 1 ? 'Diskonto masa depan' : 'Tidak berlaku (durasi 1 thn)' }}</span>
 </div>
 </div>
 </div>

 <!-- Rantai Transparansi Perhitungan SROI -->
 <div class="sroi-transparency-card">
 <div class="transparency-header">
 <span class="icon"></span> Rantai Transparansi Perhitungan Nilai Prakiraan Dampak
 </div>
 <div class="transparency-flow">
 <div class="flow-step">
 <div class="step-num">1</div>
 <div class="step-title">Nilai Input</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.valueOfInputs) }}</div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">2</div>
 <div class="step-title">Nilai Dampak</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.totalNilaiDampak) }}</div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">3</div>
 <div class="step-title">− Kerugian Bobot ({{ sroiMetrics.deadweight }}%)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.dampakSetelahDeadweight) }}</div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">4</div>
 <div class="step-title">− Atribusi ({{ sroiMetrics.attribution }}%)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.dampakSetelahAttribution) }}</div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">5</div>
 <div class="step-title">− Pergeseran Manfaat ({{ sroiMetrics.displacement }}%)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.dampakSetelahDisplacement) }}</div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">6</div>
 <div class="step-title">Dampak Bersih Tahun 1</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.netImpact) }}</div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step">
 <div class="step-num">7</div>
 <div class="step-title">Dampak Nilai Saat Ini ({{ sroiMetrics.durationYears }} thn)</div>
 <div class="step-val">{{ formatRupiah(sroiMetrics.pvImpact) }}</div>
 </div>
 <div class="flow-arrow">→</div>
 <div class="flow-step highlight">
 <div class="step-num">8</div>
 <div class="step-title">Rasio Nilai Prakiraan Dampak</div>
 <div class="step-val">{{ sroiMetrics.sroiRatioText }}</div>
 </div>
 </div>

 <!-- Rincian Penyusutan & Diskonto per Tahun (jika durasi manfaat > 1 tahun) -->
 <div v-if="sroiMetrics.yearlyBreakdown && sroiMetrics.yearlyBreakdown.length > 1" class="sroi-yearly-table-wrap">
 <div class="sroi-yearly-title">Rincian Penyusutan &amp; Diskonto Multi-Tahun</div>
 <table class="sroi-yearly-table">
 <thead>
 <tr>
 <th>Tahun ke-</th>
 <th>Dampak Bersih (setelah Penyusutan {{ sroiMetrics.dropOff }}%)</th>
 <th>Nilai Sekarang (didiskonto {{ sroiMetrics.discountRate }}%)</th>
 </tr>
 </thead>
 <tbody>
 <tr v-for="row in sroiMetrics.yearlyBreakdown" :key="row.year">
 <td>Tahun {{ row.year }}</td>
 <td>{{ formatRupiah(row.impact) }}</td>
 <td>{{ formatRupiah(row.discounted) }}</td>
 </tr>
 </tbody>
 <tfoot>
 <tr>
 <td colspan="2">Total Dampak Nilai Saat Ini</td>
 <td>{{ formatRupiah(sroiMetrics.pvImpact) }}</td>
 </tr>
 </tfoot>
 </table>
 </div>

 <!-- Rumus Akhir SROI (pedoman baku) -->
 <div class="sroi-formula-box">
 <p class="sroi-formula-desc">
 Rumus utama untuk menghitung rasio nilai prakiraan dampak adalah membandingkan nilai dampak yang dihasilkan saat ini dengan total nilai input yang digunakan.
 </p>
 <div class="sroi-formula-title">Rumus Rasio Nilai Prakiraan Dampak</div>
 <div class="sroi-formula-eq">
 <span class="sroi-formula-label">Rasio Nilai Prakiraan Dampak&nbsp;=</span>
 <span class="sroi-formula-fraction">
 <span class="sroi-formula-num">Nilai Dampak yang Dihasilkan Saat Ini</span>
 <span class="sroi-formula-bar"></span>
 <span class="sroi-formula-den">Nilai Input</span>
 </span>
 </div>
 <div class="sroi-formula-eq sroi-formula-eq-numeric">
 <span class="sroi-formula-label">Rasio Nilai Prakiraan Dampak&nbsp;=</span>
 <span class="sroi-formula-fraction">
 <span class="sroi-formula-num">{{ formatRupiah(sroiMetrics.pvImpact) }}</span>
 <span class="sroi-formula-bar"></span>
 <span class="sroi-formula-den">{{ formatRupiah(sroiMetrics.valueOfInputs) }}</span>
 </span>
 <span class="sroi-formula-result">= {{ sroiMetrics.sroiRatioText }}</span>
 </div>
 <p class="sroi-formula-note">
 {{ sroiMetrics.sroiInterpretation }} Berdasarkan pedoman ambang batas kelayakan, rasio {{ sroiMetrics.sroiRatioText }} tergolong <strong>{{ sroiMetrics.sroiStatus }}</strong>.
 </p>

 <!-- Penjabaran konkret kenapa rasio belum mencapai kategori Layak (≥ 1,0) -->
 <div v-if="sroiGapExplanation && sroiGapExplanation.isBelowLayak" class="sroi-gap-box">
 <div class="sroi-gap-title">Kenapa belum masuk kategori "Layak" (≥ 1,0)?</div>
 <p class="sroi-gap-desc">
 Dari Total Nilai Dampak Sosial {{ formatRupiah(sroiMetrics.totalNilaiDampak) }}, berikut rincian nilai yang tereduksi di tiap tahap sampai menjadi Dampak Nilai Saat Ini {{ formatRupiah(sroiMetrics.pvImpact) }}:
 </p>
 <ul class="sroi-gap-list">
 <li v-if="sroiGapExplanation.lossDeadweight > 0">
 <span class="gap-label">Kerugian Bobot ({{ sroiMetrics.deadweight }}%)</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossDeadweight) }}</span>
 <span class="gap-note">— outcome yang tetap terjadi meski tanpa program ini.</span>
 </li>
 <li v-if="sroiGapExplanation.lossAttribution > 0">
 <span class="gap-label">Atribusi ({{ sroiMetrics.attribution }}%)</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossAttribution) }}</span>
 <span class="gap-note">— porsi dampak yang turut disumbang pihak lain.{{ analysis.attributionReason ? ' ' + analysis.attributionReason : '' }}</span>
 </li>
 <li v-if="sroiGapExplanation.lossDisplacement > 0">
 <span class="gap-label">Pergeseran Manfaat ({{ sroiMetrics.displacement }}%)</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossDisplacement) }}</span>
 <span class="gap-note">— manfaat lain yang tergeser akibat program ini.{{ analysis.displacementReason ? ' ' + analysis.displacementReason : '' }}</span>
 </li>
 <li v-if="sroiGapExplanation.lossDropOffDiscount > 0">
 <span class="gap-label">Penyusutan &amp; Diskonto Multi-Tahun</span>
 <span class="gap-val">− {{ formatRupiah(sroiGapExplanation.lossDropOffDiscount) }}</span>
 <span class="gap-note">— penyusutan dampak di tahun berikutnya + diskonto {{ sroiMetrics.discountRate }}%.</span>
 </li>
 </ul>
 <p class="sroi-gap-summary">
 Total nilai tereduksi: <strong>{{ formatRupiah(sroiGapExplanation.totalLoss) }}</strong>. Selisih menuju rasio 1,0: <strong>{{ formatRupiah(sroiGapExplanation.shortfall) }}</strong>.
 </p>
 <p class="sroi-gap-suggestion">
 Persentase Kerugian Bobot/Atribusi/Pergeseran Manfaat bisa disesuaikan lewat menu edit manual bila ada data pendukung yang lebih kuat. Alternatifnya, perlu tambahan sekitar {{ formatRupiah(sroiGapExplanation.additionalDampakNeeded) }} pada estimasi Total Nilai Dampak Sosial (sebelum potongan) agar Dampak Nilai Saat Ini menyamai Nilai Input.
 </p>
 </div>
 </div>
 </div>
 <div class="efficiency-summary-card">
 <div class="efficiency-title"><span class="icon"></span> Status Efisiensi per Rekening</div>
 <div class="efficiency-list">
 <div
 v-for="(item, i) in efficiencyList"
 :key="i"
 class="efficiency-list-item"
 :class="{ 'is-open': openRekeningIndexes.has(i) }"
 role="button"
 tabindex="0"
 :aria-expanded="openRekeningIndexes.has(i)"
 @click="toggleRekeningDetail(i)"
 @keydown.enter="toggleRekeningDetail(i)"
 @keydown.space.prevent="toggleRekeningDetail(i)"
 >
 <div class="efficiency-list-row">
 <span class="efficiency-item-name">{{ item.nama }}</span>
 <span class="efficiency-item-status" :class="item.class">
 {{ item.icon }} {{ item.status }}
 </span>
 <span class="efficiency-item-chevron">{{ openRekeningIndexes.has(i) ? '▲' : '▼' }}</span>
 </div>
 <div v-if="openRekeningIndexes.has(i)" class="efficiency-item-reason">
 {{ item.alasan }}
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- Right column: pie charts -->
 <div class="sroi-right-col">
 <div class="sroi-chart-panel">
 <h3><span class="chart-icon">◔</span> Distribusi Dana Anggaran RKA (Awal vs Usulan AI)</h3>

 <div class="pie-block">
 <div class="pie-block-title"><span></span> Awal (PDF)</div>
 <div class="pie-canvas-wrap"><canvas ref="pieAwalEl"></canvas></div>
 <ul class="pie-legend">
 <li v-for="(item, i) in awalData" :key="'a'+i">
 <span class="dot" :style="{ background: palette[i % palette.length] }"></span>
 {{ item.nama }} ({{ item.persen }}%)
 </li>
 </ul>
 </div>

 <div class="pie-block">
 <div class="pie-block-title"><span></span> Usulan AI</div>
 <div class="pie-canvas-wrap"><canvas ref="pieUsulanEl"></canvas></div>
 <ul class="pie-legend">
 <li v-for="(item, i) in usulanData" :key="'u'+i">
 <span class="dot" :style="{ background: palette[i % palette.length] }"></span>
 {{ item.nama }} ({{ item.persen }}%)
 </li>
 </ul>
 </div>
 </div>
 </div>
 </div>

 <!-- ══════════ TAB: TEMUAN AUDIT & TARGET ══════════ -->
 <div class="tab-panel">
 <div class="info-box target-box">
 <div class="info-box-label"><span></span> Target Kuantitatif Output RKA</div>
 <div class="info-box-text">{{ analysis.targetKuantitatif }}</div>
 </div>

 <div class="info-box justifikasi-box">
 <div class="info-box-label"><span></span> Justifikasi Outcome</div>
 <div class="info-box-text">{{ analysis.justifikasiOutcome }}</div>
 </div>

 <div class="kepatuhan-section">
 <div class="kepatuhan-title">Rincian Temuan Kepatuhan &amp; SSH:</div>
 <div
 v-for="(k, i) in analysis.kepatuhanFindings"
 :key="i"
 class="kepatuhan-item"
 :class="k.status"
 >
 <span class="kepatuhan-icon">{{ k.status === 'sesuai' ? '' : '' }}</span>
 <div>
 <div class="kepatuhan-label">
 {{ k.label }} ({{ k.status === 'sesuai' ? 'Sesuai' : 'Tidak Sesuai' }})
 </div>
 <div class="kepatuhan-desc">{{ k.description }}</div>
 </div>
 </div>
 </div>

 <div class="realokasi-grid">
 <div class="realokasi-col kurangi">
 <div class="realokasi-header">
 <span>⊖</span> Kenapa Harus Dikurangi?
 </div>
 <div v-for="(j, i) in kurangiList" :key="'k'+i" class="realokasi-card">
 <div class="realokasi-top">
 <span class="realokasi-kode">{{ j.kode }}</span>
 <div class="realokasi-nilai-group" style="display: flex; align-items: center; gap: 8px;">
 <span class="realokasi-nilai-awal" v-if="j.nilai_awal" style="text-decoration: line-through; color: #888; font-size: 0.85em;">{{ formatRupiah(j.nilai_awal) }}</span>
 <span class="realokasi-nilai minus">-{{ formatRupiah(j.nilai_dikurangi) }}</span>
 </div>
 </div>
 <div class="realokasi-nama">{{ j.rekening_nama }}</div>
 <div class="realokasi-alasan">{{ j.alasan_dikurangi }}</div>
 </div>
 <p v-if="!kurangiList.length" class="realokasi-empty">Tidak ada rekomendasi pengurangan.</p>
 </div>

 <div class="realokasi-col tambah">
 <div class="realokasi-header">
 <span>⊕</span> Kenapa Harus Dialokasikan ke Sini?
 </div>
 <div v-for="(j, i) in tambahList" :key="'t'+i" class="realokasi-card">
 <div class="realokasi-top">
 <span class="realokasi-kode">{{ j.kode }}</span>
 <div class="realokasi-nilai-group" style="display: flex; align-items: center; gap: 8px;">
 <span class="realokasi-nilai-awal" v-if="j.nilai_awal" style="color: #888; font-size: 0.85em;">Awal: {{ formatRupiah(j.nilai_awal) }}</span>
 <span class="realokasi-nilai plus">+{{ formatRupiah(j.nilai_ditambah) }}</span>
 </div>
 </div>
 <div class="realokasi-nama">{{ j.rekening_nama }}</div>
 <div class="realokasi-alasan">{{ j.alasan_dialokasikan }}</div>
 </div>
 <p v-if="!tambahList.length" class="realokasi-empty">Tidak ada rekomendasi penambahan.</p>
 </div>
 </div>
 </div>



 </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import {
 Chart,
 ArcElement,
 Tooltip,
 Legend,
 PieController,
} from 'chart.js';
import { computeSroi16Rules, cleanOpdName } from '../composables/useAnalysis';

Chart.register(ArcElement, Tooltip, Legend, PieController);

// ── Props ────────────────────────────────────────────────────────────
// Pass a real `analysis` object from your parent/composable. Sensible
// defaults (matching the sample RKA stunting-posyandu case) are provided
// so this component also renders correctly on its own.
const openRekeningIndexes = ref(new Set());
const toggleRekeningDetail = (i) => { openRekeningIndexes.value.has(i) ? openRekeningIndexes.value.delete(i) : openRekeningIndexes.value.add(i); };

const props = defineProps({
 analysis: {
 type: Object,
 default: () => ({
 model: 'GEMINI 1.5 PRO',
 pagu: 180000000,
 outcome: 260000000,
 deadweight: 15,
 opd: 'Dinas Kesehatan',
 program: 'Penurunan Stunting',
 targetKuantitatif: 'Revitalisasi 12 posyandu di daerah lokus stunting',
 justifikasiOutcome:
 'Menurunkan persentase balita stunting di 12 posyandu sebesar 15% melalui monitoring tumbuh kembang yang lebih intensif.',
 kepatuhanFindings: [
 {
 label: 'Sasaran Program',
 description: 'Target puskesmas berada di wilayah zona merah stunting.',
 status: 'sesuai',
 },
 ],
 rekeningProporsi: [
 { nama: 'Bahan Makanan Tambahan (PMT)', persen: 20 },
 { nama: 'Obat/Suplemen Zinc & Vitamin Fe', persen: 20 },
 { nama: 'Honor Kader Posyandu', persen: 20 },
 { nama: 'Transport Kunjungan Rumah (Home Visit)', persen: 20 },
 { nama: 'Konsumsi & Snack Rapat Koordinasi', persen: 2 },
 { nama: 'Cetak Spanduk & Baliho Sosialisasi', persen: 18 },
 ],
 rekeningProporsiUsulan: [
 { nama: 'Bahan Makanan Tambahan (PMT)', persen: 45.7 },
 { nama: 'Obat/Suplemen Zinc & Vitamin Fe', persen: 17.1 },
 { nama: 'Honor Kader Posyandu', persen: 16.5 },
 { nama: 'Transport Kunjungan Rumah (Home Visit)', persen: 10.7 },
 { nama: 'Konsumsi & Snack Rapat Koordinasi', persen: 0 },
 { nama: 'Cetak Spanduk & Baliho Sosialisasi', persen: 10.1 },
 ],
 reallocationJustifications: [
 {
 kode: '5.2.06.01',
 rekening_nama: 'Belanja Perjalanan Dinas Dalam Daerah',
 aksi: 'KURANGI',
 alasan_dikurangi:
 'Koordinasi lapangan rutin dapat diganti sebagian dengan rapat daring (online meeting) untuk menghemat BBM & uang harian.',
 nilai_dikurangi: 4500000,
 },
 {
 kode: '5.2.02.01',
 rekening_nama: 'Belanja Konsumsi & Snack Rapat Koordinasi',
 aksi: 'KURANGI',
 alasan_dikurangi:
 'Rapat koordinasi lintas sektor cukup dengan konsumsi standar SSH — tidak perlu catering eksternal untuk efisiensi.',
 nilai_dikurangi: 3600000,
 },
 {
 kode: '5.2.05.02',
 rekening_nama: 'Belanja Cetak Spanduk & Baliho Sosialisasi',
 aksi: 'KURANGI',
 alasan_dikurangi:
 'Edukasi gizi dapat memanfaatkan media sosial resmi Dinkes secara gratis, mengurangi kebutuhan cetak fisik.',
 nilai_dikurangi: 2700000,
 },
 {
 kode: '5.2.02.27',
 rekening_nama: 'Belanja Bahan Makanan Tambahan (PMT) Bergizi',
 aksi: 'TAMBAH',
 alasan_dialokasikan:
 'Rekening utama program — kecukupan gizi langsung menentukan capaian penurunan prevalensi stunting. Tidak boleh dikurangi.',
 nilai_ditambah: 99000000,
 },
 {
 kode: '5.2.02.13',
 rekening_nama: 'Belanja Obat & Suplemen Vitamin (Zinc, Fe)',
 aksi: 'TAMBAH',
 alasan_dialokasikan:
 'Suplemen pendukung wajib diberikan bersama PMT sesuai Permenkes No. 29/2019 tentang pencegahan stunting.',
 nilai_ditambah: 14400000,
 },
 {
 kode: '5.2.03.03',
 rekening_nama: 'Honor Kader Posyandu & Tenaga Gizi',
 aksi: 'TAMBAH',
 alasan_dialokasikan:
 'Kader posyandu adalah ujung tombak pemantauan tumbuh kembang balita — honorarium memastikan kehadiran dan konsistensi monitoring.',
 nilai_ditambah: 10800000,
 },
 ],
 }),
 },
});

// ── Formatting helpers ──────────────────────────────────────────────
const formatRupiah = (val) => {
 if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
 return 'Rp ' + Math.round(val).toLocaleString('id-ID');
};

// ── Core SROI math (16 Aturan Baku SROI) ─────────────────────────────
const sroiMetrics = computed(() => {
 if (!props.analysis) return computeSroi16Rules({});
 return computeSroi16Rules({
 pagu: props.analysis.pagu,
 outcome: props.analysis.outcome,
 deadweight: props.analysis.deadweight,
 attribution: props.analysis.attribution,
 displacement: props.analysis.displacement,
 dropOff: props.analysis.dropOff,
 discountRate: props.analysis.discountRate,
 benefitDurationYears: props.analysis.benefitDurationYears
 });
});

const netBenefit = computed(() => sroiMetrics.value.netImpact);
const pvImpact = computed(() => sroiMetrics.value.pvImpact);
const sroi = computed(() => sroiMetrics.value.sroiRatio);
const feasibility = computed(() => ({
 label: sroiMetrics.value.sroiStatus,
 tone: sroiMetrics.value.tone
}));

// ── Penjabaran "kenapa belum Layak" — rincian Rupiah yang tereduksi per faktor ──
const sroiGapExplanation = computed(() => {
 const m = sroiMetrics.value;
 if (!m || !m.isValid) return null;

 const lossDeadweight = Math.max(0, m.totalNilaiDampak - m.dampakSetelahDeadweight);
 const lossAttribution = Math.max(0, m.dampakSetelahDeadweight - m.dampakSetelahAttribution);
 const lossDisplacement = Math.max(0, m.dampakSetelahAttribution - m.dampakSetelahDisplacement);
 const lossDropOffDiscount = Math.max(0, m.netImpact - m.pvImpact);
 const totalLoss = lossDeadweight + lossAttribution + lossDisplacement + lossDropOffDiscount;

 const isBelowLayak = m.sroiRatio < 1.0;
 const shortfall = Math.max(0, m.valueOfInputs - m.pvImpact);

 const retentionFactor = m.totalNilaiDampak > 0 ? (m.pvImpact / m.totalNilaiDampak) : 0;
 const neededTotalDampak = retentionFactor > 0 ? Math.round(m.valueOfInputs / retentionFactor) : 0;
 const additionalDampakNeeded = Math.max(0, neededTotalDampak - m.totalNilaiDampak);

 return {
 lossDeadweight: Math.round(lossDeadweight),
 lossAttribution: Math.round(lossAttribution),
 lossDisplacement: Math.round(lossDisplacement),
 lossDropOffDiscount: Math.round(lossDropOffDiscount),
 totalLoss: Math.round(totalLoss),
 isBelowLayak,
 shortfall: Math.round(shortfall),
 additionalDampakNeeded: Math.round(additionalDampakNeeded)
 };
});

// ── Reallocation lists ───────────────────────────────────────────────
const kurangiList = computed(() =>
 (props.analysis.reallocationJustifications || []).filter((j) => j.aksi === 'KURANGI')
);
const tambahList = computed(() =>
 (props.analysis.reallocationJustifications || []).filter((j) => j.aksi === 'TAMBAH')
);

const efficiencyList = computed(() => {
 const proporsi = props.analysis.rekeningProporsi || [];
 const reallocs = props.analysis.reallocationJustifications || [];

 return proporsi.map(rek => {
 let status = rek.status;
 let alasan = rek.alasan;

 const matchedRealloc = reallocs.find(r =>
 (r.rekening_nama && r.rekening_nama.toLowerCase().includes(rek.nama.toLowerCase())) ||
 (rek.nama && rek.nama.toLowerCase().includes(r.rekening_nama.toLowerCase()))
 );

 if (!status) {
 if (matchedRealloc) {
 if (matchedRealloc.aksi === 'KURANGI') {
 status = 'Inefisien';
 } else {
 status = 'Efisien';
 }
 } else {
 status = 'Efisien';
 }
 }

 if (!alasan) {
 if (matchedRealloc) {
 if (matchedRealloc.aksi === 'KURANGI') {
 alasan = matchedRealloc.alasan_dikurangi || 'Item belanja ini terindikasi kurang efisien dan berpotensi diefisienkan.';
 } else {
 alasan = matchedRealloc.alasan_dialokasikan || 'Alokasi anggaran belanja ini dinilai tepat untuk mendukung sasaran utama program.';
 }
 } else {
 if (status === 'Inefisien') {
 alasan = 'Alokasi belanja ini melebihi batas efisiensi operasional atau tidak sepadan dengan keluaran.';
 } else if (status === 'Belum Dapat Dinilai') {
 alasan = 'Data pembanding harga satuan atau rincian belum mencukupi untuk menilai efisiensi secara valid.';
 } else {
 alasan = 'Alokasi anggaran belanja ini dinilai wajar dan berada dalam batas efisiensi standar.';
 }
 }
 }

 let toneClass = 'tone-green';
 let icon = '';

 if (status === 'Inefisien') {
 toneClass = 'tone-red';
 icon = '';
 } else if (status === 'Belum Dapat Dinilai') {
 toneClass = 'tone-gray';
 icon = '?';
 } else {
 status = 'Efisien';
 toneClass = 'tone-green';
 icon = '';
 }

 return {
 nama: rek.nama,
 status: status,
 alasan: alasan,
 icon: icon,
 class: toneClass
 };
 });
});

// ── Pie chart data ───────────────────────────────────────────────────
const palette = ['var(--primary-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)', 'var(--accent-color)', 'var(--primary-color)', 'var(--border-color-strong)'];

const withLainnya = (dataset) => {
 if (!dataset || dataset.length === 0) return [];
 const sumPersen = dataset.reduce((s, d) => s + (Number(d.persen) || 0), 0);
 if (sumPersen < 99) {
 return [...dataset, { nama: 'Lainnya', persen: Number((100 - sumPersen).toFixed(1)) }];
 }
 return dataset;
};

const awalData = computed(() => withLainnya(props.analysis.rekeningProporsi || []));
const usulanData = computed(() => withLainnya(props.analysis.rekeningProporsiUsulan || []));

// Kartu Tahun Anggaran Berjalan (Hero Header)
const currentYearCard = computed(() => {
 const list = [...(props.analysis.anggaranTahunan || [])].sort((a, b) => Number(a.tahun) - Number(b.tahun));
 const targetYear = Number(props.analysis.tahunRencana || props.analysis.tahun || new Date().getFullYear());

 let targetItem = list.find(a => Number(a.tahun) === targetYear);
 let targetIdx = targetItem ? list.indexOf(targetItem) : -1;

 if (!targetItem && list.length > 0) {
 targetItem = list[list.length - 1];
 targetIdx = list.length - 1;
 }

 const currentNominal = targetItem ? Number(targetItem.jumlah) : (Number(props.analysis.pagu) || 0);
 const currentYear = targetItem ? targetItem.tahun : targetYear;

 // Previous year comparison
 const prevItem = (targetIdx > 0) ? list[targetIdx - 1] : (list.length > 1 && list[0].tahun !== currentYear ? list[0] : null);

 if (prevItem && Number(prevItem.jumlah) > 0) {
 const diff = currentNominal - Number(prevItem.jumlah);
 const pct = ((diff / Number(prevItem.jumlah)) * 100).toFixed(1);
 return {
 tahun: currentYear,
 jumlah: currentNominal,
 hasDelta: true,
 prevTahun: prevItem.tahun,
 diff: diff,
 arrow: diff >= 0 ? '▲' : '▼',
 deltaClass: diff >= 0 ? 'delta-up' : 'delta-down',
 deltaLabel: (diff >= 0 ? '+Rp ' : '-Rp ') + Math.abs(diff).toLocaleString('id-ID'),
 deltaPercent: (diff >= 0 ? '+' : '') + pct
 };
 }

 return {
 tahun: currentYear,
 jumlah: currentNominal,
 hasDelta: false,
 prevTahun: null,
 deltaClass: 'delta-neutral',
 deltaLabel: '',
 deltaPercent: ''
 };
});

// ── Chart.js instances ───────────────────────────────────────────────
const pieAwalEl = ref(null);
const pieUsulanEl = ref(null);
let pieAwalChart = null;
let pieUsulanChart = null;

const buildPieConfig = (dataset) => ({
 type: 'pie',
 data: {
 labels: dataset.map((d) => d.nama),
 datasets: [
 {
 data: dataset.map((d) => d.persen),
 backgroundColor: dataset.map((_, i) => palette[i % palette.length]),
 borderWidth: 2,
 borderColor: '#ffffff',
 },
 ],
 },
 options: {
 responsive: true,
 maintainAspectRatio: false,
 plugins: {
 legend: { display: false },
 tooltip: {
 callbacks: {
 label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
 },
 },
 },
 },
});

const renderCharts = () => {
 if (pieAwalChart) pieAwalChart.destroy();
 if (pieUsulanChart) pieUsulanChart.destroy();

 if (pieAwalEl.value) {
 pieAwalChart = new Chart(pieAwalEl.value, buildPieConfig(awalData.value));
 }
 if (pieUsulanEl.value) {
 pieUsulanChart = new Chart(pieUsulanEl.value, buildPieConfig(usulanData.value));
 }
};

onMounted(() => nextTick(renderCharts));
onBeforeUnmount(() => {
 if (pieAwalChart) pieAwalChart.destroy();
 if (pieUsulanChart) pieUsulanChart.destroy();
});
watch([awalData, usulanData], () => nextTick(renderCharts));

// ── Tabs ─────────────────────────────────────────────────────────────
const activeTab = ref('temuan');

// ── JSON output tab ──────────────────────────────────────────────────
const prettyJson = computed(() =>
 JSON.stringify(
 {
 sroi_ratio: Number(sroi.value.toFixed(2)),
 status_kelayakan: feasibility.value.label,
 investasi_pagu: props.analysis.pagu,
 proyeksi_outcome: props.analysis.outcome,
 faktor_deadweight_persen: props.analysis.deadweight,
 nilai_manfaat_bersih: Math.round(netBenefit.value),
 target_kuantitatif: props.analysis.targetKuantitatif,
 justifikasi_outcome: props.analysis.justifikasiOutcome,
 temuan_kepatuhan: props.analysis.kepatuhanFindings,
 rekomendasi_realokasi: props.analysis.reallocationJustifications,
 },
 null,
 2
 )
);

const copied = ref(false);
const copyJson = async () => {
 try {
 await navigator.clipboard.writeText(prettyJson.value);
 copied.value = true;
 setTimeout(() => (copied.value = false), 1500);
 } catch (e) {
 console.error('Gagal menyalin JSON:', e);
 }
};
</script>

<style scoped>
/* ══════ 1. Header Analisis (Hero matching user specification) ══════ */
.rka-hero {
 background: #0c2340;
 border-radius: var(--radius-lg);
 padding: 24px 28px;
 color: #ffffff;
 box-shadow: 0 8px 24px rgba(12, 35, 64, 0.25);
 display: flex;
 flex-direction: column;
 gap: 18px;
 border: 1px solid rgba(255, 255, 255, 0.1);
}

.rka-hero-row {
 display: flex;
 flex-direction: column;
 gap: 4px;
}

.rka-hero-label {
 font-size: 11px;
 font-weight: 800;
 letter-spacing: 0.08em;
 text-transform: uppercase;
 color: #93c5fd;
}

.rka-hero-main-val {
 font-size: 18px;
 font-weight: 800;
 color: #ffffff;
 line-height: 1.35;
}

.rka-hero-split-grid {
 display: grid;
 grid-template-columns: 1.2fr 1fr;
 gap: 24px;
 align-items: flex-end;
 padding-top: 16px;
 border-top: 1px solid rgba(255, 255, 255, 0.12);
}

@media (max-width: 960px) {
 .rka-hero-split-grid {
 grid-template-columns: 1fr;
 align-items: stretch;
 }
}

.rka-hero-col-left {
 display: flex;
 flex-direction: column;
 gap: 14px;
}

.rka-hero-item {
 display: flex;
 flex-direction: column;
 gap: 3px;
}

.rka-hero-text-val {
 font-size: 14px;
 font-weight: 700;
 color: #ffffff;
 line-height: 1.4;
}

.rka-pagu-val {
 font-size: 18px;
 font-weight: 800;
 color: #6ee7b7;
}

.rka-hero-col-right {
 display: flex;
 flex-direction: column;
}

/* Tahun Anggaran Card */
.tahun-anggaran-box {
 background: #f0fdf4;
 border: 1.5px solid #86efac;
 border-radius: 10px;
 padding: 16px 20px;
 box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.tab-header-row {
 display: flex;
 align-items: center;
 justify-content: space-between;
 margin-bottom: 8px;
}

.tab-year-title {
 font-size: 12px;
 font-weight: 800;
 letter-spacing: 0.05em;
 color: #475569;
 text-transform: uppercase;
}

.tab-year-badge {
 background: #16a34a;
 color: #ffffff;
 font-size: 10px;
 font-weight: 800;
 padding: 3px 10px;
 border-radius: 12px;
 letter-spacing: 0.04em;
}

.tab-amount-num {
 font-size: 22px;
 font-weight: 800;
 color: #0f172a;
 margin-bottom: 6px;
 letter-spacing: -0.01em;
}

.tab-delta-info {
 font-size: 12px;
 font-weight: 700;
 display: flex;
 align-items: center;
 gap: 4px;
}

.tab-delta-info.delta-up {
 color: #16a34a;
}

.tab-delta-info.delta-down {
 color: #dc2626;
}

.tab-delta-info.delta-neutral {
 color: #64748b;
}

.tab-arrow {
 font-size: 11px;
}

.sroi-result {
 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
 color: var(--text-primary);
 width: 100%;
}

/* Header */
.sroi-header {
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 16px 20px;
 border-bottom: 1px solid var(--border-color);
}
.sroi-header-left { display: flex; align-items: center; gap: 10px; }
.sroi-header-icon { color: var(--primary-color); font-size: 18px; }
.sroi-header h2 { font-size: 16px; font-weight: 700; margin: 0; }
.model-badge {
 background: var(--success-glow);
 color: var(--success-text);
 font-size: 11px;
 font-weight: 700;
 padding: 4px 10px;
 border-radius: 20px;
 letter-spacing: 0.03em;
}

/* Top grid */
.sroi-top-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 20px;
 padding: 20px;
}
@media (max-width: 900px) {
 .sroi-top-grid { grid-template-columns: 1fr; }
}

.sroi-left-col { display: flex; flex-direction: column; gap: 16px; }

/* Ratio card */
.sroi-ratio-card {
 border-radius: 14px;
 padding: 24px;
 color: #fff;
 background: var(--success-hover);
}
.sroi-ratio-card.tone-yellow { background: var(--warning-color); }
.sroi-ratio-card.tone-red { background: var(--danger-color); }

.sroi-ratio-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 8px;
}
.sroi-ratio-eyebrow {
 font-size: 11px;
 font-weight: 700;
 letter-spacing: 0.05em;
 text-transform: uppercase;
 opacity: 0.9;
}
.sroi-status-pill {
 background: rgba(255, 255, 255, 0.22);
 padding: 4px 10px;
 border-radius: 20px;
 font-size: 11px;
 font-weight: 700;
 text-transform: uppercase;
}
.sroi-ratio-value { font-size: 48px; font-weight: 800; line-height: 1; margin: 6px 0 10px; }
.sroi-ratio-formula { font-size: 12px; opacity: 0.85; margin-bottom: 10px; }
.sroi-ratio-desc { font-size: 13px; font-weight: 600; margin: 0; line-height: 1.4; }

/* Stat mini-cards */
.sroi-stats-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 12px;
}
.sroi-stat-card {
 background: var(--bg-primary);
 border: 1px solid var(--border-color);
 border-radius: 10px;
 padding: 14px 16px;
}
.stat-label {
 font-size: 10px;
 font-weight: 700;
 letter-spacing: 0.04em;
 text-transform: uppercase;
 color: var(--text-muted);
 margin-bottom: 6px;
}
.stat-value { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.stat-value.deadweight { color: var(--danger-text); }
.stat-value.positive { color: var(--success-hover); }

.efficiency-summary-card {
 background: var(--bg-primary);
 border: 1px dashed var(--border-color-strong);
 border-radius: 10px;
 padding: 16px;
 margin-top: 4px;
}
.efficiency-title {
 font-size: 13px;
 font-weight: 700;
 color: var(--text-primary);
 margin-bottom: 12px;
 display: flex;
 align-items: center;
 gap: 6px;
}
.efficiency-list {
 display: flex;
 flex-direction: column;
 gap: 8px;
 max-height: 250px;
 overflow-y: auto;
 padding-right: 4px;
}
.efficiency-list::-webkit-scrollbar {
 width: 4px;
}
.efficiency-list::-webkit-scrollbar-thumb {
 background: var(--border-color-strong);
 border-radius: 4px;
}
.efficiency-list-item {
 padding: 6px 6px 8px;
 margin: 0 -6px;
 border-bottom: 1px solid var(--border-color);
 border-radius: 8px;
 cursor: pointer;
 transition: background 0.15s ease;
}
.efficiency-list-item:hover {
 background: var(--bg-primary);
}
.efficiency-list-item:focus-visible {
 outline: 2px solid var(--primary-color);
 outline-offset: 2px;
}
.efficiency-list-item.is-open {
 background: var(--bg-primary);
}
.efficiency-list-item:last-child {
 border-bottom: none;
 padding-bottom: 6px;
}
.efficiency-list-row {
 display: flex;
 justify-content: space-between;
 align-items: center;
}
.efficiency-item-name {
 font-size: 12px;
 color: var(--text-primary);
 flex: 1;
 padding-right: 10px;
 line-height: 1.3;
}
.efficiency-item-status {
 font-size: 10.5px;
 font-weight: 700;
 padding: 4px 8px;
 border-radius: 12px;
 white-space: nowrap;
 display: flex;
 align-items: center;
 gap: 4px;
}
.efficiency-item-chevron {
 font-size: 9px;
 color: var(--text-muted);
 margin-left: 8px;
 flex-shrink: 0;
}
.efficiency-item-reason {
 font-size: 11.5px;
 color: var(--text-secondary);
 line-height: 1.45;
 background: #ffffff;
 border: 1px solid var(--border-color);
 border-radius: 8px;
 padding: 8px 10px;
 margin-top: 8px;
}
.efficiency-item-status.tone-red {
 background: var(--danger-glow);
 color: var(--danger-text);
}
.efficiency-item-status.tone-green {
 background: var(--success-glow);
 color: var(--success-text);
}
.efficiency-item-status.tone-blue {
 background: var(--info-glow);
 color: var(--info-hover);
}

/* Chart panel */
.sroi-chart-panel {
 background: #fff;
 border: 1px solid var(--border-color);
 border-radius: 14px;
 padding: 18px;
 height: 100%;
}
.sroi-chart-panel h3 {
 font-size: 13px;
 font-weight: 700;
 margin: 0 0 14px;
 display: flex;
 align-items: center;
 gap: 6px;
}
.chart-icon { color: var(--primary-color); }

.pie-block { margin-bottom: 22px; }
.pie-block:last-child { margin-bottom: 0; }
.pie-block-title {
 font-size: 12px;
 font-weight: 700;
 color: var(--text-secondary);
 text-align: center;
 margin-bottom: 8px;
}
.pie-canvas-wrap { position: relative; height: 170px; margin: 0 auto; max-width: 220px; }
.pie-legend { list-style: none; margin: 10px 0 0; padding: 0; font-size: 11.5px; color: var(--text-secondary); }
.pie-legend li { display: flex; align-items: center; gap: 6px; padding: 2px 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Tabs */
.sroi-tabs {
 display: flex;
 gap: 4px;
 padding: 0 20px;
 border-bottom: 1px solid var(--border-color);
}
.tab-btn {
 display: flex;
 align-items: center;
 gap: 6px;
 background: none;
 border: none;
 padding: 12px 14px;
 font-size: 13px;
 font-weight: 600;
 color: var(--text-muted);
 cursor: pointer;
 border-bottom: 2px solid transparent;
}
.tab-btn.active { color: var(--primary-hover); border-bottom-color: var(--primary-hover); }
.tab-icon { font-size: 12px; }

.tab-panel { padding: 20px; }

/* Info boxes */
.info-box {
 background: var(--bg-primary);
 border-radius: 10px;
 padding: 14px 16px;
 margin-bottom: 14px;
}
.info-box-label {
 font-size: 10.5px;
 font-weight: 700;
 letter-spacing: 0.04em;
 text-transform: uppercase;
 color: var(--text-muted);
 display: flex;
 align-items: center;
 gap: 6px;
 margin-bottom: 6px;
}
.info-box-text { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.justifikasi-box .info-box-label,
.justifikasi-box .info-box-text { background: var(--info-glow); }
.justifikasi-box { background: var(--info-glow); }

/* Kepatuhan */
.kepatuhan-section { margin-bottom: 20px; }
.kepatuhan-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
.kepatuhan-item {
 display: flex;
 align-items: flex-start;
 gap: 10px;
 border: 1px solid var(--border-color);
 border-left: 3px solid var(--success-color);
 border-radius: 8px;
 padding: 10px 14px;
 margin-bottom: 8px;
}
.kepatuhan-item:not(.sesuai) { border-left-color: var(--danger-color); }
.kepatuhan-icon { color: var(--success-text); font-weight: 700; }
.kepatuhan-item:not(.sesuai) .kepatuhan-icon { color: var(--danger-text); }
.kepatuhan-label { font-size: 13px; font-weight: 700; }
.kepatuhan-desc { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

/* Realokasi grid */
.realokasi-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 16px;
}
@media (max-width: 900px) {
 .realokasi-grid { grid-template-columns: 1fr; }
}
.realokasi-header {
 display: flex;
 align-items: center;
 gap: 6px;
 font-size: 12.5px;
 font-weight: 700;
 padding: 10px 14px;
 border-radius: 8px;
 margin-bottom: 10px;
}
.realokasi-col.kurangi .realokasi-header { background: var(--danger-glow); color: var(--danger-text); }
.realokasi-col.tambah .realokasi-header { background: var(--success-glow); color: var(--success-text); }

.realokasi-card {
 border: 1px solid var(--border-color);
 border-radius: 10px;
 padding: 12px 14px;
 margin-bottom: 10px;
}
.realokasi-top {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 4px;
}
.realokasi-kode { font-family: monospace; font-size: 11.5px; color: var(--text-muted); }
.realokasi-nama { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.realokasi-alasan { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
.realokasi-nilai { font-size: 13px; font-weight: 700; }
.realokasi-nilai.minus { color: var(--danger-text); }
.realokasi-nilai.plus { color: var(--success-hover); }
.realokasi-empty { font-size: 12px; color: var(--text-muted); font-style: italic; }

/* JSON tab */
.json-toolbar {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 10px;
}
.json-toolbar-label { font-size: 12px; color: var(--text-muted); }
.btn-copy-json {
 background: var(--primary-hover);
 color: #fff;
 border: none;
 border-radius: 8px;
 padding: 6px 12px;
 font-size: 12px;
 font-weight: 600;
 cursor: pointer;
}
.json-output {
 background: var(--text-primary);
 color: #a5f3fc;
 border-radius: 10px;
 padding: 16px;
 font-size: 12px;
 line-height: 1.5;
/* SROI Factors & Transparency (16 Rules) */
.sroi-factors-card {
 margin-top: 14px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: var(--radius-md, 10px);
 padding: 14px;
}
.sroi-factors-title {
 font-size: 12.5px;
 font-weight: 700;
 margin-bottom: 10px;
 color: var(--text-primary);
}
.sroi-factors-grid {
 display: grid;
 grid-template-columns: repeat(5, 1fr);
 gap: 8px;
}
@media (max-width: 900px) {
 .sroi-factors-grid { grid-template-columns: repeat(2, 1fr); }
}
.sroi-factor-item {
 background: var(--bg-hover, #f8fafc);
 border: 1px solid var(--border-color);
 border-radius: 6px;
 padding: 8px 10px;
 display: flex;
 flex-direction: column;
}
.factor-name {
 font-size: 10px;
 font-weight: 700;
 color: var(--text-muted);
 text-transform: uppercase;
}
.factor-val {
 font-size: 14px;
 font-weight: 800;
 color: var(--text-primary);
}
.factor-hint {
 font-size: 9.5px;
 color: var(--text-muted);
 line-height: 1.25;
 margin-top: 2px;
}
.factor-loss {
 font-size: 10px;
 font-weight: 700;
 color: #dc2626;
 margin-top: 2px;
}

.sroi-transparency-card {
 margin-top: 14px;
 background: var(--bg-card);
 border: 1px solid var(--border-color);
 border-radius: var(--radius-md, 10px);
 padding: 14px;
}
.transparency-header {
 font-size: 12.5px;
 font-weight: 700;
 color: var(--text-primary);
 margin-bottom: 12px;
}
.transparency-flow {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 6px;
 overflow-x: auto;
}
.flow-step {
 flex: 1;
 min-width: 90px;
 background: var(--bg-hover, #f8fafc);
 border: 1px solid var(--border-color);
 border-radius: 6px;
 padding: 8px 10px;
}
.flow-step.highlight {
 background: #f0fdf4;
 border-color: #86efac;
}
.step-num {
 font-size: 9px;
 font-weight: 800;
 width: 16px;
 height: 16px;
 background: #cbd5e1;
 color: #334155;
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 margin-bottom: 4px;
}
.flow-step.highlight .step-num {
 background: var(--success-hover, #10b981);
 color: #ffffff;
}
.step-title {
 font-size: 9.5px;
 font-weight: 700;
 color: var(--text-muted);
 margin-bottom: 2px;
}
.step-val {
 font-size: 11px;
 font-weight: 800;
 color: var(--text-primary);
}
.flow-arrow {
 color: var(--text-muted);
 font-weight: 800;
 font-size: 14px;
}

/* ══════ Rincian Multi-Tahun (Penyusutan & Diskonto) ══════ */
.sroi-yearly-table-wrap {
 margin-top: 14px;
 padding-top: 12px;
 border-top: 1px dashed var(--border-color);
}
.sroi-yearly-title {
 font-size: 11px;
 font-weight: 700;
 color: var(--text-muted);
 margin-bottom: 8px;
}
.sroi-yearly-table {
 width: 100%;
 border-collapse: collapse;
 font-size: 11px;
}
.sroi-yearly-table th {
 text-align: left;
 padding: 6px 8px;
 background: var(--bg-hover, #f8fafc);
 color: var(--text-muted);
 font-weight: 700;
 border: 1px solid var(--border-color);
}
.sroi-yearly-table td {
 padding: 6px 8px;
 border: 1px solid var(--border-color);
 color: var(--text-primary);
}
.sroi-yearly-table tfoot td {
 font-weight: 800;
 background: #f0fdf4;
 color: #1B4D46;
}

/* ══════ Rumus Akhir SROI (pedoman baku) ══════ */
.sroi-formula-box {
 margin-top: 14px;
 padding-top: 14px;
 border-top: 1px dashed var(--border-color);
}
.sroi-formula-desc {
 font-size: 11.5px;
 color: var(--text-secondary, var(--text-muted));
 line-height: 1.6;
 margin: 0 0 12px;
}
.sroi-formula-title {
 font-size: 13px;
 font-weight: 800;
 color: var(--text-primary);
 margin-bottom: 8px;
}
.sroi-formula-eq {
 display: flex;
 align-items: center;
 gap: 10px;
 flex-wrap: wrap;
 margin-bottom: 8px;
}
.sroi-formula-eq-numeric {
 padding-top: 10px;
 border-top: 1px solid var(--border-color);
}
.sroi-formula-label {
 font-size: 12px;
 font-weight: 700;
 color: var(--text-primary);
 white-space: nowrap;
}
.sroi-formula-fraction {
 display: inline-flex;
 flex-direction: column;
 align-items: center;
 text-align: center;
}
.sroi-formula-num,
.sroi-formula-den {
 font-size: 11.5px;
 font-weight: 700;
 color: var(--text-primary);
 padding: 0 6px;
 white-space: nowrap;
}
.sroi-formula-bar {
 width: 100%;
 height: 2px;
 background: var(--text-primary);
 margin: 3px 0;
}
.sroi-formula-result {
 font-size: 16px;
 font-weight: 900;
 color: var(--success-hover, #10b981);
}
.sroi-formula-note {
 font-size: 11px;
 color: var(--text-muted);
 line-height: 1.6;
 margin: 0;
}

/* ══════ Penjabaran "Kenapa Belum Layak" ══════ */
.sroi-gap-box {
 margin-top: 14px;
 padding: 12px 14px;
 background: rgba(249, 115, 22, 0.08);
 border: 1px solid rgba(249, 115, 22, 0.35);
 border-radius: var(--radius-md, 10px);
}
.sroi-gap-title {
 font-size: 12px;
 font-weight: 800;
 color: #c2410c;
 margin-bottom: 8px;
}
.sroi-gap-desc {
 font-size: 11px;
 color: var(--text-secondary, var(--text-muted));
 line-height: 1.6;
 margin: 0 0 10px;
}
.sroi-gap-list {
 list-style: none;
 margin: 0 0 10px;
 padding: 0;
 display: flex;
 flex-direction: column;
 gap: 7px;
}
.sroi-gap-list li {
 font-size: 11px;
 line-height: 1.5;
 padding-bottom: 7px;
 border-bottom: 1px dashed rgba(249, 115, 22, 0.3);
}
.sroi-gap-list li:last-child {
 border-bottom: none;
 padding-bottom: 0;
}
.gap-label {
 font-weight: 700;
 color: var(--text-primary);
}
.gap-val {
 font-weight: 800;
 color: #dc2626;
 margin-left: 6px;
}
.gap-note {
 display: block;
 color: var(--text-muted);
 margin-top: 2px;
}
.sroi-gap-summary {
 font-size: 11.5px;
 color: var(--text-primary);
 line-height: 1.6;
 margin: 0 0 8px;
 padding-top: 8px;
 border-top: 1px solid rgba(249, 115, 22, 0.3);
}
.sroi-gap-suggestion {
 font-size: 11px;
 color: var(--text-secondary, var(--text-muted));
 line-height: 1.6;
 margin: 0;
 font-style: italic;
}

.tone-gray {
 background: #475569 !important;
 color: #ffffff !important;
}
</style>