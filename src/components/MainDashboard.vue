<template>
  <div class="main-dashboard-container">
    <PageHero icon="layout-dashboard" title="Dasbor Utama" subtitle="Ringkasan sistem" />

    <!-- Stats Grid -->
    <div class="stats-grid">
      
      <!-- Card: Model Gemini 2.5 Flash -->
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(46, 125, 116, 0.15); color: #2E7D74;">
          <i data-lucide="cpu"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Model Gemini 2.5 Flash</div>
          <div class="stat-value" style="color: var(--success-text); display: flex; align-items: center; gap: 8px;">
            <div class="status-dot pulsing"></div> Siap
          </div>
          <div class="stat-subtext">Google AI Studio</div>
        </div>
      </div>

      <!-- Card: Jumlah Dokumen -->
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(201, 123, 61, 0.15); color: #C97B3D;">
          <i data-lucide="file-text"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Arsip Dokumen RKA</div>
          <div class="stat-value">{{ rkis.length }} <span style="font-size: 1rem; color: var(--text-muted);">Dokumen</span></div>
          <div class="stat-subtext">Tersimpan</div>
        </div>
      </div>

      <!-- Card: Chatbot Status -->
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(60, 156, 109, 0.15); color: #3C9C6D;">
          <i data-lucide="message-square"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">AI Agen Chatbot RKA</div>
          <div class="stat-value" style="color: #3C9C6D; display: flex; align-items: center; gap: 8px;">
            <div class="status-dot" style="background-color: #3C9C6D;"></div> Tersedia
          </div>
          <div class="stat-subtext">Konsultasi RKA</div>
        </div>
      </div>

      <!-- Card: Kecepatan Upload -->
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">
          <i data-lucide="zap"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Kecepatan Analisis AI</div>
          <div class="stat-value">1.8s <span style="font-size: 0.9rem; color: var(--text-muted);">/ doc</span></div>
          <div class="stat-subtext">Rata-rata per dokumen</div>
        </div>
      </div>

    </div>

    <!-- Banner: Analisis Valuasi Prakiraan Dampak Program -->
    <div class="banner-card" @click="goToAnalyzer">
      <div class="banner-content">
                <h3 class="banner-title">Mulai analisis</h3>
        <p class="banner-text">Unggah RKA, dapatkan hasilnya.</p>
        <button class="btn btn-primary banner-btn">
          Buka <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
      <div class="banner-visual">
        <i data-lucide="bar-chart-2"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue';
import PageHero from './PageHero.vue';
import { useAnalysis } from '../composables/useAnalysis';

const { rkis, currentTab } = useAnalysis();

function goToAnalyzer() {
  currentTab.value = 'analyzer';
}

onMounted(() => {
  if (window.lucide) {
    nextTick(() => window.lucide.createIcons());
  }
});
</script>

<style scoped>
.main-dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: var(--shadow-raised);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-raised-hover);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  width: 24px;
  height: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  font-family: var(--font-heading);
  margin-bottom: 2px;
}

.stat-subtext {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.status-dot {
  width: 10px;
  height: 10px;
  background-color: var(--success-color);
  border-radius: 50%;
  position: relative;
}

.status-dot.pulsing::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: var(--success-color);
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

.banner-card {
  background: var(--gradient-brand);
  border-radius: var(--border-radius-lg);
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 10px 30px var(--primary-glow);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;
}

.banner-card:hover {
  transform: scale(1.01);
}

.banner-card::before {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background-image: var(--retro-dot-color);
  background-size: var(--retro-grid-size) var(--retro-grid-size);
  opacity: 0.5;
  pointer-events: none;
}

.banner-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
}

.banner-badge {
  background: rgba(255, 255, 255, 0.2);
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.banner-title {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.banner-text {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin-bottom: 24px;
}

.banner-btn {
  background: white;
  color: var(--primary-color);
  border: none;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
}

.banner-btn:hover {
  background: #f0f0f0;
}

.banner-visual {
  position: relative;
  z-index: 1;
  opacity: 0.15;
  transform: scale(4);
  transform-origin: center right;
  margin-right: 40px;
}
</style>
