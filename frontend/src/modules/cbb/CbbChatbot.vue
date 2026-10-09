<!--
  CbbChatbot.vue — menu "Simulasi Percakapan Agen AI" (modul Chatbot Bapperida / cbb).
  Menggantikan AiAgenChatbotRka.vue. Percakapan terintegrasi dengan Arsip Analisis ASI DARA.
-->
<template>
  <div class="cbb-root">
    <!-- Top Navigation Header -->
    <HeaderNav />

    <!-- Panel Integrasi & Pemilih Arsip Dokumen ASI DARA -->
    <div style="margin-bottom: 1rem; padding: 0.85rem 1.25rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius-md, 14px);">
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 240px; flex: 1;">
          <span style="font-size: 1.25rem;">📁</span>
          <div>
            <div style="font-weight: 700; font-size: 0.875rem; color: var(--text-primary);">
              Integrasi Arsip Analisis ASI DARA
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">
              Pilih dokumen arsip RKA untuk menanyakan alasan, faktor penyesuaian & rincian Nilai Prakiraan Dampak
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; max-width: 520px;">
          <select
            v-model="selectedRkaId"
            style="width: 100%; padding: 0.45rem 0.75rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.8rem; color: var(--text-primary); outline: none;"
          >
            <option value="">-- Pilih Arsip Dokumen RKA ({{ rkisList.length }} Berkas) --</option>
            <option
              v-for="item in rkisList"
              :key="item.id"
              :value="item.id"
            >
              {{ item.namaDokumen || item.subKegiatan || item.program || item.id }} ({{ item.opd || 'OPD' }}) — Nilai Prakiraan Dampak: {{ getDocRatioBadge(item) }}
            </option>
          </select>

          <button
            v-if="selectedRkaId"
            @click="selectedRkaId = ''"
            class="cbb-btn-secondary"
            style="padding: 0.45rem 0.75rem; font-size: 0.75rem; white-space: nowrap;"
            title="Reset Pilihan Arsip"
          >
            ❌ Lepas
          </button>
        </div>
      </div>

      <!-- Banner Arsip Aktif & Tombol Pertanyaan Cepat -->
      <div v-if="selectedDoc" style="margin-top: 0.85rem; padding: 0.75rem 1rem; background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-left: 3px solid var(--primary-color); border-radius: 8px; display: flex; flex-direction: column; gap: 0.6rem;" class="cbb-animate-fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <span style="font-weight: 700; font-size: 0.85rem; color: var(--primary-color);">
              📌 Arsip Ditanyakan: {{ selectedDoc.namaDokumen || selectedDoc.subKegiatan || selectedDoc.program || selectedDoc.id }}
            </span>
            <span style="font-size: 0.775rem; color: var(--text-secondary); margin-left: 8px;">
              • {{ selectedDoc.opd || 'OPD' }} | Pagu: Rp {{ (selectedDoc.pagu || selectedDoc.alokasi || 0).toLocaleString('id-ID') }}
            </span>
          </div>

          <span :class="['cbb-badge', getRatioBadgeClass(selectedDoc)]">
            Nilai Prakiraan Dampak: {{ getDocRatioBadge(selectedDoc) }}
          </span>
        </div>

        <!-- Tombol Pertanyaan Cepat untuk Arsip Ini -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; font-size: 0.75rem;">
          <span style="color: var(--text-muted); font-weight: 600;">Tanya Alasan & Detail:</span>
          <button
            @click="askQuickQuestion('💡 Mengapa rasio Nilai Prakiraan Dampak dokumen arsip ini bernilai demikian? Jelaskan alasan dan kausalitas kelayakannya.')"
            class="cbb-btn-secondary cbb-quick-btn"
            style="padding: 3px 9px; font-size: 0.725rem; border-radius: 20px;"
            :disabled="isTyping"
          >
            💡 Mengapa Rasio {{ getDocRatioBadge(selectedDoc) }}?
          </button>
          <button
            @click="askQuickQuestion('⚖️ Jelaskan rincian 5 Faktor Penyesuaian (Deadweight, Attribution, Displacement, Drop-off, Unintended) pada dokumen ini.')"
            class="cbb-btn-secondary cbb-quick-btn"
            style="padding: 3px 9px; font-size: 0.725rem; border-radius: 20px;"
            :disabled="isTyping"
          >
            ⚖️ Rincian 5 Faktor Penyesuaian
          </button>
          <button
            @click="askQuickQuestion('📝 Berikan rekomendasi perbaikan dan langkah strategis AI untuk dokumen RKA arsip ini.')"
            class="cbb-btn-secondary cbb-quick-btn"
            style="padding: 3px 9px; font-size: 0.725rem; border-radius: 20px;"
            :disabled="isTyping"
          >
            📝 Rekomendasi Strategis AI
          </button>
        </div>
      </div>
    </div>

    <!-- Main Chat Workspace -->
    <main style="flex: 1;">
      <ChatContainer
        :messages="messages"
        :is-typing="isTyping"
        @send-message="handleSendMessage"
        @clear-chat="handleClearChat"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import HeaderNav from './components/HeaderNav.vue';
import ChatContainer from './components/chat/ChatContainer.vue';
import { processUserMessage } from './services/chatEngine.js';
import { useAnalysis, computeSroi16Rules } from '@/composables/useAnalysis';
import confetti from 'canvas-confetti';
import './cbb.css';

const { rkis } = useAnalysis();

const isTyping = ref(false);
const apiKey = ref(localStorage.getItem('bapperida_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');

const selectedRkaId = ref('');
// Lacak ID terakhir yang sudah dinotifikasi agar pesan tidak duplikat
const lastNotifiedDocId = ref('');

const rkisList = computed(() => {
  return Array.isArray(rkis?.value) ? rkis.value : (Array.isArray(rkis) ? rkis : []);
});

const selectedDoc = computed(() => {
  if (!selectedRkaId.value) return null;
  return rkisList.value.find(r => r.id === selectedRkaId.value) || null;
});

function getDocRatioBadge(item) {
  if (!item) return '-';
  try {
    const metrics = computeSroi16Rules(item);
    return metrics?.sroiRatioWithBanding || `${item.sroi || item.sroiRatio || '0.00'} : 1`;
  } catch (e) {
    return `${item.sroi || item.sroiRatio || '0.00'} : 1`;
  }
}

function getRatioBadgeClass(item) {
  if (!item) return 'cbb-badge-gold';
  try {
    const metrics = computeSroi16Rules(item);
    if ((metrics?.sroiRatio ?? 0) >= 1.0) return 'cbb-badge-emerald';
    if ((metrics?.sroiRatio ?? 0) >= 0.6) return 'cbb-badge-gold';
    return 'cbb-badge-blue';
  } catch (e) {
    return 'cbb-badge-gold';
  }
}

const messages = ref([]);

function getInitialGreeting() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return {
    role: 'assistant',
    time: timeStr,
    badge: null,
    text: `Halo! Saya asisten AI yang terintegrasi langsung dengan Arsip Analisis ASI DARA & Bapperida. 🏛️\n\nAnda dapat **memilih arsip dokumen RKA** pada dropdown di atas untuk menanyakan alasan Nilai Prakiraan Dampak, 5 faktor penyesuaian, evaluasi kinerja, atau rekomendasi perbaikan secara spesifik!`
  };
}

function handleClearChat() {
  messages.value = [getInitialGreeting()];
}

function formatTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function askQuickQuestion(prompt) {
  handleSendMessage(prompt);
}

async function handleSendMessage(query) {
  if (!query || !query.trim()) return;

  const time = formatTime();

  messages.value.push({
    role: 'user',
    time,
    text: query
  });

  isTyping.value = true;

  setTimeout(async () => {
    try {
      const response = await processUserMessage(query, apiKey.value, selectedDoc.value);

      if (response.type === 'calculation' && response.text && (response.text.includes('Layak') || response.text.includes('Sangat Efektif') || response.text.includes('Optimal'))) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['var(--primary-color)', 'var(--info-color)', 'var(--warning-color)']
        });
      }

      messages.value.push({
        role: 'assistant',
        time: formatTime(),
        badge: response.badge || null,
        type: response.type || 'text',
        formula: response.formula || null,
        data: response.data || null,
        text: response.text
      });
    } catch (err) {
      console.error(err);
      messages.value.push({
        role: 'assistant',
        time: formatTime(),
        badge: null,
        text: 'Maaf, ada gangguan teknis. Coba lagi ya!'
      });
    } finally {
      isTyping.value = false;
    }
  }, 400);
}

// Watch pada selectedRkaId (primitif string) — hanya terpicu saat user
// benar-benar mengganti pilihan dropdown, bukan saat computed dievaluasi ulang.
watch(selectedRkaId, (newId) => {
  if (!newId || newId === lastNotifiedDocId.value) return;
  lastNotifiedDocId.value = newId;
  const doc = rkisList.value.find(r => r.id === newId);
  if (!doc) return;
  const title = doc.namaDokumen || doc.subKegiatan || doc.program || doc.id;
  messages.value.push({
    role: 'assistant',
    time: formatTime(),
    badge: 'Arsip Pilihan Terhubung',
    text: `📌 Berkas arsip **"${title}"** (${doc.opd || 'OPD'}) berhasil dihubungkan ke sesi percakapan.\n\nKlik salah satu tombol pertanyaan cepat di atas atau ketikkan pertanyaan Anda tentang alasan Nilai Prakiraan Dampak / faktor penyesuaian dokumen ini!`
  });
});

onMounted(() => {
  messages.value = [getInitialGreeting()];
});
</script>
