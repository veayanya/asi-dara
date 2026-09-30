<template>
  <div 
    v-if="isOpen" 
    class="cbb-modal-backdrop"
    style="position: fixed; inset: 0; background: rgba(17, 24, 39, 0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;"
    @click.self="$emit('close')"
  >
    <div 
      class="cbb-glass-panel cbb-animate-fade-in"
      style="width: 100%; max-width: 820px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent); box-shadow: 0 20px 40px rgba(17, 24, 39, 0.35);"
    >
      <!-- Modal Header -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; background: color-mix(in srgb, var(--primary-color) 10%, transparent);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">⚡</span>
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
              Integrasi & Sematkan ke Sistem Web Anda
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Solusi integrasi cepat untuk memperbarui web sistem pemerintah / OPD yang sudah ada
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

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 0.25rem; padding: 0.75rem 1.5rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-subtle); overflow-x: auto;">
        <button
          v-for="st in settingsTabs"
          :key="st.id"
          @click="activeSubTab = st.id"
          :style="{
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.775rem',
            fontWeight: activeSubTab === st.id ? '700' : '500',
            background: activeSubTab === st.id ? 'color-mix(in srgb, var(--primary-color) 25%, transparent)' : 'transparent',
            color: activeSubTab === st.id ? 'var(--primary-color)' : 'var(--text-secondary)',
            border: activeSubTab === st.id ? '1px solid color-mix(in srgb, var(--primary-color) 40%, transparent)' : '1px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }"
        >
          {{ st.label }}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div style="padding: 1.5rem; overflow-y: auto; flex: 1;">
        
        <!-- 1. Floating Widget Snippet -->
        <div v-if="activeSubTab === 'widget'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); padding: 0.75rem; border-radius: 4px; font-size: 0.825rem; color: var(--text-secondary);">
            Pasang kode berikut sebelum tag penutup <code>&lt;/body&gt;</code> di web sistem Anda untuk memunculkan tombol chat melayang di pojok kanan bawah.
          </div>

          <div style="position: relative;">
            <pre style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem; font-family: var(--font-mono); font-size: 0.775rem; color: var(--primary-color); overflow-x: auto; line-height: 1.5;">{{ widgetSnippet }}</pre>
            <button 
              @click="copySnippet(widgetSnippet, 'widget')"
              class="cbb-btn-secondary" 
              style="position: absolute; top: 10px; right: 10px; padding: 4px 10px; font-size: 0.725rem;"
            >
              {{ copiedType === 'widget' ? '✓ Tersalin!' : '📋 Salin Kode' }}
            </button>
          </div>
        </div>

        <!-- 2. Iframe / Portal Embed -->
        <div v-if="activeSubTab === 'iframe'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--info-color) 8%, transparent); border-left: 3px solid var(--info-color); padding: 0.75rem; border-radius: 4px; font-size: 0.825rem; color: var(--text-secondary);">
            Sematkan sebagai halaman utuh atau bagian menu dashboard sistem internal:
          </div>

          <div style="position: relative;">
            <pre style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem; font-family: var(--font-mono); font-size: 0.775rem; color: var(--info-color); overflow-x: auto; line-height: 1.5;">{{ iframeSnippet }}</pre>
            <button 
              @click="copySnippet(iframeSnippet, 'iframe')"
              class="cbb-btn-secondary" 
              style="position: absolute; top: 10px; right: 10px; padding: 4px 10px; font-size: 0.725rem;"
            >
              {{ copiedType === 'iframe' ? '✓ Tersalin!' : '📋 Salin Kode' }}
            </button>
          </div>
        </div>

        <!-- 3. Vue 3 Integration Guide -->
        <div v-if="activeSubTab === 'vue'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); padding: 0.75rem; border-radius: 4px; font-size: 0.825rem; color: var(--text-secondary);">
            Jika web sistem Anda berbasis <strong>Vue 3</strong>, Anda dapat mengimpor komponen atau service langsung:
          </div>

          <div style="position: relative;">
            <pre style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem; font-family: var(--font-mono); font-size: 0.775rem; color: var(--primary-color); overflow-x: auto; line-height: 1.5;">{{ vueSnippet }}</pre>
            <button 
              @click="copySnippet(vueSnippet, 'vue')"
              class="cbb-btn-secondary" 
              style="position: absolute; top: 10px; right: 10px; padding: 4px 10px; font-size: 0.725rem;"
            >
              {{ copiedType === 'vue' ? '✓ Tersalin!' : '📋 Salin Kode' }}
            </button>
          </div>
        </div>

        <!-- 4. System Prompt Inspector -->
        <div v-if="activeSubTab === 'prompt'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.825rem; color: var(--text-secondary);">
              System Prompt acuan resmi Bapperida Kabupaten Cirebon:
            </span>
            <button 
              @click="copySnippet(systemPromptContent, 'prompt')"
              class="cbb-btn-secondary" 
              style="padding: 4px 10px; font-size: 0.725rem;"
            >
              {{ copiedType === 'prompt' ? '✓ Tersalin!' : '📋 Salin Prompt' }}
            </button>
          </div>

          <textarea 
            readonly
            :value="systemPromptContent"
            style="width: 100%; height: 260px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); outline: none; resize: vertical;"
          ></textarea>
        </div>

        <!-- 5. API Key Settings -->
        <div v-if="activeSubTab === 'api'" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: color-mix(in srgb, var(--warning-color) 8%, transparent); border-left: 3px solid var(--warning-color); padding: 0.75rem; border-radius: 4px; font-size: 0.825rem; color: var(--warning-hover);">
            <strong>Opsional:</strong> Aplikasi saat ini berjalan mandiri dengan basis data lokal Bapperida Cirebon (cepat dan gratis). Masukkan API Key jika Anda ingin menghubungkan dengan model LLM live secara langsung.
          </div>

          <div>
            <label style="display: block; font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
              Google Gemini API Key
            </label>
            <input 
              v-model="apiKeyInput" 
              type="password" 
              placeholder="AIzaSy..." 
              style="width: 100%; padding: 0.65rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-family: var(--font-mono);"
            />
            <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; display: block;">
              Kunci disimpan aman hanya di browser (Local Storage) pengguna.
            </span>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button 
              @click="saveApiKey"
              class="cbb-btn-primary" 
              style="padding: 0.5rem 1.25rem; font-size: 0.8rem;"
            >
              Simpan Pengaturan API
            </button>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; background: var(--bg-tertiary);">
        <button 
          @click="$emit('close')" 
          class="cbb-btn-secondary"
          style="padding: 0.5rem 1.25rem; font-size: 0.8rem;"
        >
          Selesai
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  currentApiKey: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'update:apiKey']);

const settingsTabs = [
  { id: 'widget', label: '🔘 Floating Widget' },
  { id: 'iframe', label: '🖼️ Iframe Embed' },
  { id: 'vue', label: '📦 Komponen Vue 3' },
  { id: 'prompt', label: '📄 System Prompt' },
  { id: 'api', label: '🔑 Pengaturan API LLM' }
];

const activeSubTab = ref('widget');
const apiKeyInput = ref(props.currentApiKey);
const copiedType = ref(null);

const widgetSnippet = `<!-- Widget Bapperida Kabupaten Cirebon -->
<script>
  window.BAPPERIDA_BOT_CONFIG = {
    targetUrl: "https://bapperida.cirebonkab.go.id/chatbot",
    theme: "emerald-dark",
    initialPersona: "asn"
  };
<\/script>
<script src="https://bapperida.cirebonkab.go.id/widget/bapperida-bot.js" async><\/script>`;

const iframeSnippet = `<!-- Iframe Chatbot Bapperida Kabupaten Cirebon -->
<iframe 
  src="https://bapperida.cirebonkab.go.id/chatbot" 
  width="100%" 
  height="700px" 
  style="border: none; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" 
  title="Chatbot Bapperida Kabupaten Cirebon">
</iframe>`;

const vueSnippet = `// Dalam proyek Vue 3 web sistem Anda:
import ChatContainer from './components/chat/ChatContainer.vue';
import { processUserMessage } from './services/chatEngine.js';

// Pasang langsung di template Anda:
// <ChatContainer :messages="chatMessages" activePersona="asn" @send-message="handleSend" />`;

const systemPromptContent = `# SYSTEM PROMPT — CHATBOT BAPPERIDA KABUPATEN CIREBON

## 1. IDENTITAS & PERAN
Asisten virtual resmi Badan Perencanaan, Penelitian, dan Pengembangan Daerah (Bapperida) Kabupaten Cirebon.
- Pusat informasi tugas pokok dan fungsi (tupoksi) Bapperida
- Asisten pemahaman dokumen perencanaan (RPJPD, RPJMD, RKPD, Renstra, Renja, KUA-PPAS)
- Kalkulator/penjelas rumus indikator pembangunan dan kinerja anggaran
- Pusat diagnosis awal permasalahan yang berkaitan dengan tugas Bapperida
- Penghubung informasi lintas bidang di Bapperida

## 2. REGULASI ACUAN
- UU No. 25/2004, UU No. 23/2014, Permendagri No. 86/2017, Permendagri No. 90/2019
- Kepmendagri No. 690.900-327 Tahun 1996 (Penilaian Kinerja Keuangan Daerah)

## 3. MODUL ANALISIS KINERJA ANGGARAN (RKA)
- Efektivitas (%) = (Realisasi Output / Target Output) × 100%
- Efisiensi (%) = (Realisasi Anggaran / Pagu Anggaran) : (Realisasi Output / Target Output) × 100%
- SROI Ratio = Total Nilai Manfaat Sosial / Total Nilai Investasi (Input)
Format 5 Langkah: Rumus -> Data Sumber -> Langkah Hitung -> Hasil Akhir & Kategori -> Catatan/Disclaimer.

## 4. MODUL PENANGANAN PERMASALAHAN BAPPERIDA (DIAGNOSIS 6 KATEGORI)
1. Perencanaan & Sinkronisasi Dokumen
2. Data & Pelaporan (SIPD & Satu Data)
3. Anggaran & Kinerja (RKA/DPA)
4. Koordinasi Lintas OPD/Level
5. Layanan ke Masyarakat & Musrenbang
6. Regulasi & Kepatuhan Hukum
Format Diagnosis: Ringkasan Masalah -> Kategori -> Kemungkinan Akar Masalah -> Rekomendasi Pihak & Langkah -> Dasar Hukum.

## 5. ATURAN SUMBER DATA (KASUS 1 vs KASUS 2)
- Kasus 1 (Data Riil): User menanyakan data resmi tanpa memberi angka sendiri. JANGAN MENGARANG ANGKA! Arahkan ke SIPD-RI / BPS.
- Kasus 2 (Skenario Hipotesis/Contoh/Simulasi): User memberikan angkanya sendiri dengan kata "misal", "seandainya", "kalau ada", "contohnya". WAJIB DIJAWAB LANGSUNG! Hitung dan analisis berdasarkan rumus/skala kinerja (efektivitas, efisiensi, realisasi). JANGAN PERNAH menolak atau melempar ke SIPD/BPS jika user sudah memberikan angkanya sendiri.`;

function copySnippet(text, type) {
  navigator.clipboard.writeText(text);
  copiedType.value = type;
  setTimeout(() => {
    copiedType.value = null;
  }, 2000);
}

function saveApiKey() {
  emit('update:apiKey', apiKeyInput.value);
  alert('Pengaturan API Key tersimpan!');
}
</script>
