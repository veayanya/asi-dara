<template>
  <div 
    v-if="isOpen" 
    class="cbb-modal-backdrop"
    style="position: fixed; inset: 0; background: rgba(17, 24, 39, 0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;"
    @click.self="$emit('close')"
  >
    <div 
      class="cbb-glass-panel cbb-animate-fade-in"
      style="width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--info-color) 30%, transparent); box-shadow: 0 20px 40px rgba(17, 24, 39, 0.35);"
    >
      <!-- Modal Header -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; background: color-mix(in srgb, var(--info-color) 8%, transparent);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">📚</span>
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
              Pustaka Dokumen & Regulasi Perencanaan Daerah
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Bapperida Kabupaten Cirebon • Permendagri 86/2017 & UU 25/2004
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

      <!-- Category Filter Tabs -->
      <div style="display: flex; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-subtle); overflow-x: auto;">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :style="{
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.775rem',
            fontWeight: selectedCategory === cat.id ? '700' : '500',
            background: selectedCategory === cat.id ? 'color-mix(in srgb, var(--info-color) 25%, transparent)' : 'transparent',
            color: selectedCategory === cat.id ? 'var(--info-color)' : 'var(--text-secondary)',
            border: selectedCategory === cat.id ? '1px solid color-mix(in srgb, var(--info-color) 40%, transparent)' : '1px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Content Area -->
      <div style="padding: 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1rem;">
        
        <!-- Dokumen Perencanaan List -->
        <template v-if="selectedCategory === 'dokumen'">
          <div 
            v-for="doc in DOKUMEN_PERENCANAAN" 
            :key="doc.kode"
            class="cbb-glass-card"
            style="padding: 1.25rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.5rem;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="cbb-badge cbb-badge-emerald" style="font-size: 0.75rem;">{{ doc.kode }}</span>
                <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">{{ doc.nama }}</h3>
              </div>
              <span style="font-size: 0.725rem; color: var(--text-secondary); background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px;">
                Periode: {{ doc.periode }}
              </span>
            </div>

            <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.5;">
              {{ doc.deskripsi }}
            </p>

            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.25rem;">
              ⚖️ Dasar Hukum: {{ doc.dasarHukum }}
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
              <button 
                @click="askAbout(doc.kode)"
                class="cbb-btn-secondary"
                style="padding: 0.35rem 0.75rem; font-size: 0.75rem;"
              >
                💬 Tanyakan Dokumen Ini
              </button>
            </div>
          </div>
        </template>

        <!-- Regulasi List -->
        <template v-if="selectedCategory === 'regulasi'">
          <div 
            v-for="(reg, rIdx) in REGULASI_ACUAN" 
            :key="rIdx"
            class="cbb-glass-card"
            style="padding: 1.25rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.5rem;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span class="cbb-badge cbb-badge-blue" style="font-size: 0.75rem;">{{ reg.nomor }}</span>
            </div>
            <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">{{ reg.tentang }}</h3>
            <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.5;">
              <strong>Poin Kunci di Bapperida:</strong> {{ reg.poinKunci }}
            </p>

            <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
              <button 
                @click="askAbout(reg.nomor)"
                class="cbb-btn-secondary"
                style="padding: 0.35rem 0.75rem; font-size: 0.75rem;"
              >
                💬 Pelajari Regulasi Ini
              </button>
            </div>
          </div>
        </template>

        <!-- Alur Musrenbang -->
        <template v-if="selectedCategory === 'musrenbang'">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div 
              v-for="m in TAHAPAN_MUSRENBANG" 
              :key="m.tahap"
              class="cbb-glass-card"
              style="padding: 1rem 1.25rem; border-radius: 10px; display: flex; gap: 1rem; align-items: flex-start;"
            >
              <div style="width: 32px; height: 32px; border-radius: 50%; background: color-mix(in srgb, var(--primary-color) 20%, transparent); border: 1px solid var(--primary-color); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--primary-color); font-size: 0.85rem; flex-shrink: 0;">
                {{ m.tahap }}
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                  <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">{{ m.nama }}</h4>
                  <span class="cbb-badge cbb-badge-gold" style="font-size: 0.7rem;">{{ m.waktu }}</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                  {{ m.fokus }}
                </p>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
            <button 
              @click="askAbout('Alur Musrenbang Kabupaten Cirebon')"
              class="cbb-btn-primary"
              style="padding: 0.45rem 1rem; font-size: 0.775rem;"
            >
              💬 Konsultasikan Alur Musrenbang di Chat
            </button>
          </div>
        </template>

      </div>

      <!-- Modal Footer -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; background: var(--bg-tertiary);">
        <button 
          @click="$emit('close')" 
          class="cbb-btn-secondary"
          style="padding: 0.5rem 1.25rem; font-size: 0.8rem;"
        >
          Tutup Pustaka
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { DOKUMEN_PERENCANAAN, REGULASI_ACUAN, TAHAPAN_MUSRENBANG } from '../../data/bapperidaKnowledge.js';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'ask-doc']);

const categories = [
  { id: 'dokumen', label: '📑 Dokumen Perencanaan' },
  { id: 'musrenbang', label: '🔄 Tahapan Musrenbang' },
  { id: 'regulasi', label: '⚖️ Regulasi Acuan' }
];

const selectedCategory = ref('dokumen');

function askAbout(term) {
  emit('ask-doc', `Jelaskan secara rinci tentang ${term}`);
  emit('close');
}
</script>
