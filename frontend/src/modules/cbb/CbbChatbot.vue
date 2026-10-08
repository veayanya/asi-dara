<!--
  CbbChatbot.vue — menu "AI Agen Chatbot RKA" (modul Chatbot Bapperida / cbb).
  Menggantikan AiAgenChatbotRka.vue. Tanpa props; percakapan dijalankan oleh
  services/chatEngine.js (knowledge base lokal + Gemini bila API key tersedia).
  API key dibaca dari localStorage 'bapperida_api_key' atau VITE_GEMINI_API_KEY.
-->
<template>
  <div class="cbb-root">
    <!-- Top Navigation Header -->
    <HeaderNav
      @open-diagnosis="showDiagnosisModal = true"
      @open-calculator="showCalculatorModal = true"
      @open-docs="showDocsModal = true"
      @open-embed="showEmbedModal = true"
    />

    <!-- Main Chat Workspace -->
    <main style="flex: 1;">
      <ChatContainer
        :messages="messages"
        :is-typing="isTyping"
        @send-message="handleSendMessage"
        @clear-chat="handleClearChat"
      />
    </main>

    <!-- Modals -->
    <DiagnosisModal
      :is-open="showDiagnosisModal"
      @close="showDiagnosisModal = false"
      @ask-diagnosis="handleSendMessage"
    />

    <CalculatorModal
      :is-open="showCalculatorModal"
      @close="showCalculatorModal = false"
      @insert-chat="handleSendMessage"
    />

    <DocumentModal
      :is-open="showDocsModal"
      @close="showDocsModal = false"
      @ask-doc="handleSendMessage"
    />

    <EmbedModal
      :is-open="showEmbedModal"
      :current-api-key="apiKey"
      @close="showEmbedModal = false"
      @update:api-key="handleApiKeyUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import HeaderNav from './components/HeaderNav.vue';
import ChatContainer from './components/chat/ChatContainer.vue';
import CalculatorModal from './components/calculator/CalculatorModal.vue';
import DocumentModal from './components/documents/DocumentModal.vue';
import DiagnosisModal from './components/diagnosis/DiagnosisModal.vue';
import EmbedModal from './components/settings/EmbedModal.vue';
import { processUserMessage } from './services/chatEngine.js';
import confetti from 'canvas-confetti';
import './cbb.css';

const isTyping = ref(false);
const apiKey = ref(localStorage.getItem('bapperida_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');

function handleApiKeyUpdate(val) {
  apiKey.value = val;
  if (val) {
    localStorage.setItem('bapperida_api_key', val);
  } else {
    localStorage.removeItem('bapperida_api_key');
  }
}

// Modals
const showDiagnosisModal = ref(false);
const showCalculatorModal = ref(false);
const showDocsModal = ref(false);
const showEmbedModal = ref(false);

const messages = ref([]);

function getInitialGreeting() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return {
    role: 'assistant',
    time: timeStr,
    badge: null,
    text: `Halo! Saya asisten AI yang punya keahlian mendalam soal Bapperida dan perencanaan daerah. 🏛️\n\nTapi nggak harus nanya yang teknis kok — mau ngobrol biasa, minta tolong nulis sesuatu, atau diskusi soal anggaran & RKPD, semuanya bisa. Tanya aja langsung!`
  };
}

function handleClearChat() {
  messages.value = [getInitialGreeting()];
}

function formatTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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
      const response = await processUserMessage(query, apiKey.value);

      // Subtle confetti for clearly excellent performance results
      if (response.type === 'calculation' && response.text && (response.text.includes('Sangat Efektif') || response.text.includes('Sangat Efisien') || response.text.includes('Optimal'))) {
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

onMounted(() => {
  messages.value = [getInitialGreeting()];
});
</script>
