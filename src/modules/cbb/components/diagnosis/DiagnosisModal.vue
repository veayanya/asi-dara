<template>
  <div 
    v-if="isOpen" 
    class="cbb-modal-backdrop"
    style="position: fixed; inset: 0; background: rgba(17, 24, 39, 0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;"
    @click.self="$emit('close')"
  >
    <div 
      class="cbb-glass-panel cbb-animate-fade-in"
      style="width: 100%; max-width: 840px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--danger-color) 30%, transparent); box-shadow: 0 20px 40px rgba(17, 24, 39, 0.35);"
    >
      <!-- Modal Header -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; background: color-mix(in srgb, var(--danger-color) 8%, transparent);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">🩺</span>
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
              Pusat Diagnosis Permasalahan Bapperida (Modul 5)
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Identifikasi Masalah, Akar Penyebab Umum, dan Rekomendasi Pihak Berwenang
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

      <!-- Quick Issue Input Bar -->
      <div style="padding: 1rem 1.5rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-subtle);">
        <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
          Ketik kendala atau permasalahan yang Anda alami:
        </label>
        <div style="display: flex; gap: 0.5rem;">
          <input 
            v-model="customProblem" 
            type="text" 
            placeholder="Contoh: Usulan Musrenbang kecamatan kami tidak muncul di APBD, atau SIPD telat diinput..."
            style="flex: 1; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-size: 0.825rem;"
            @keyup.enter="diagnoseCustom"
          />
          <button 
            @click="diagnoseCustom" 
            class="cbb-btn-primary" 
            style="padding: 0.5rem 1rem; font-size: 0.8rem; background: var(--danger-color);"
            :disabled="!customProblem.trim()"
          >
            Diagnosis Sekarang
          </button>
        </div>
      </div>

      <!-- 6 Problem Categories Grid -->
      <div style="padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1rem;">
        <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">
          Pilih salah satu dari 6 Kategori Permasalahan Bapperida:
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1rem;">
          <div 
            v-for="cat in KATEGORI_MASALAH_BAPPERIDA" 
            :key="cat.id"
            class="cbb-glass-card"
            style="padding: 1rem 1.15rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.5rem; border-left: 3px solid var(--danger-color);"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span class="cbb-badge" style="background: color-mix(in srgb, var(--danger-color) 15%, transparent); color: var(--danger-color); border: 1px solid color-mix(in srgb, var(--danger-color) 30%, transparent); font-size: 0.7rem;">
                Kategori {{ cat.nomor }}
              </span>
            </div>

            <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">
              {{ cat.nama }}
            </h3>

            <!-- Gejala / Contoh Masalah -->
            <div style="margin-top: 0.25rem;">
              <div style="font-size: 0.725rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 0.25rem;">
                Contoh Kasus / Gejala:
              </div>
              <ul style="padding-left: 1.1rem; font-size: 0.775rem; color: var(--text-secondary); line-height: 1.4;">
                <li v-for="(g, gIdx) in cat.gejala" :key="gIdx">
                  {{ g }}
                </li>
              </ul>
            </div>

            <!-- Rekomendasi Arah -->
            <div style="background: var(--bg-tertiary); border-radius: 6px; padding: 0.5rem; font-size: 0.725rem; margin-top: 0.25rem;">
              <div style="color: var(--primary-color); font-weight: 600;">🏛️ Ditujukan ke: {{ cat.tujuanArah }}</div>
              <div style="color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">⚖️ {{ cat.dasarHukum }}</div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 0.25rem;">
              <button 
                @click="diagnoseCategory(cat)"
                class="cbb-btn-secondary" 
                style="padding: 0.35rem 0.75rem; font-size: 0.725rem;"
              >
                🩺 Konsultasikan Masalah Ini
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary);">
        <span style="font-size: 0.725rem; color: var(--text-muted);">
          ⚠️ Dugaan penyimpangan/korupsi dialihkan langsung ke Inspektorat / SP4N-LAPOR!
        </span>
        <button 
          @click="$emit('close')" 
          class="cbb-btn-secondary"
          style="padding: 0.45rem 1.25rem; font-size: 0.8rem;"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { KATEGORI_MASALAH_BAPPERIDA } from '../../data/bapperidaKnowledge.js';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'ask-diagnosis']);

const customProblem = ref('');

function diagnoseCategory(cat) {
  emit('ask-diagnosis', `Diagnosis masalah Bapperida: ${cat.gejala[0]}`);
  emit('close');
}

function diagnoseCustom() {
  if (!customProblem.value.trim()) return;
  const p = customProblem.value;
  customProblem.value = '';
  emit('ask-diagnosis', `Diagnosis masalah Bapperida: ${p}`);
  emit('close');
}
</script>
