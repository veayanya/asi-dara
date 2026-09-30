<template>
  <div class="cbb-glass-panel" style="display: flex; flex-direction: column; height: calc(100vh - 250px); min-height: 520px; overflow: hidden; position: relative;">
    <!-- Slim toolbar: just clear chat -->
    <div style="padding: 0.5rem 1.25rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; font-size: 0.775rem;">
      <span style="color: var(--text-muted); font-size: 0.725rem;">Bapperida Kabupaten Cirebon · Asisten AI</span>
      <button
        @click="$emit('clear-chat')"
        title="Bersihkan riwayat percakapan"
        style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px;"
        class="cbb-clear-btn"
      >
        🗑️ Bersihkan Chat
      </button>
    </div>

    <!-- Messages Scroll Area -->
    <div
      ref="messageContainerRef"
      style="flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;"
    >
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          maxWidth: '100%'
        }"
        class="cbb-animate-fade-in"
      >
        <!-- Message Header & Avatar -->
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; font-size: 0.75rem; color: var(--text-secondary);">
          <template v-if="msg.role === 'user'">
            <span style="font-weight: 600; color: var(--text-secondary);">Anda</span>
            <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--info-color); display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">👤</span>
          </template>
          <template v-else>
            <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">🏛️</span>
            <span style="font-weight: 700; color: var(--primary-color);">Asisten Bapperida</span>
            <span v-if="msg.badge" class="cbb-badge cbb-badge-emerald" style="font-size: 0.65rem; padding: 1px 6px;">
              {{ msg.badge }}
            </span>
            <span style="color: var(--text-muted); font-size: 0.7rem;">{{ msg.time }}</span>
          </template>
        </div>

        <!-- Bubble Body -->
        <div
          :style="{
            maxWidth: '82%',
            padding: '1rem 1.15rem',
            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--bg-tertiary)',
            border: msg.role === 'user'
              ? '1px solid var(--primary-color)'
              : '1px solid var(--border-color)',
            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
            boxShadow: '0 2px 6px -2px rgba(17, 24, 39, 0.12)',
            fontSize: '0.875rem'
          }"
        >
          <!-- Warning / Ethic Notice -->
          <div v-if="msg.type === 'warning'" style="display: flex; align-items: center; gap: 0.5rem; background: color-mix(in srgb, var(--danger-color) 15%, transparent); border: 1px solid color-mix(in srgb, var(--danger-color) 30%, transparent); border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; color: var(--danger-color); font-size: 0.775rem;">
            <span>⚠️</span>
            <span>Isu ini di luar kewenangan asisten — mohon arahkan ke pihak berwenang.</span>
          </div>

          <!-- Formula & Calculation Card (only when msg.data is set AND has items) -->
          <div v-if="msg.type === 'calculation' && msg.data && msg.data.length" style="margin-bottom: 0.85rem; background: var(--bg-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent); border-radius: 10px; padding: 0.75rem;">
            <div v-if="msg.formula" style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--primary-color); margin-bottom: 0.5rem; background: var(--bg-tertiary); padding: 4px 8px; border-radius: 6px;">
              {{ msg.formula }}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem;">
              <div v-for="(item, i) in msg.data" :key="i" style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.5rem;">
                <div style="font-size: 0.6875rem; color: var(--text-secondary);">{{ item.label }}</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- Rich Markdown Text -->
          <div style="line-height: 1.65;" v-html="formatMessageText(msg.text)"></div>

          <!-- Copy Button for Bot Messages -->
          <div v-if="msg.role !== 'user'" style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
            <button
              @click="copyText(msg.text, idx)"
              style="background: transparent; border: none; font-size: 0.7rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px;"
              class="cbb-copy-btn"
            >
              <span>{{ copiedIndex === idx ? '✓ Tersalin' : '📋 Salin' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" style="display: flex; align-items: center; gap: 0.5rem;" class="cbb-animate-fade-in">
        <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">🏛️</span>
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 0.5rem 0.85rem; display: flex; align-items: center; gap: 6px;">
          <span class="cbb-pulse-indicator" style="animation-delay: 0s;"></span>
          <span class="cbb-pulse-indicator" style="animation-delay: 0.2s;"></span>
          <span class="cbb-pulse-indicator" style="animation-delay: 0.4s;"></span>
          <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 4px;">sedang memproses...</span>
        </div>
      </div>
    </div>

    <!-- Suggested Quick Prompts -->
    <div style="padding: 0.5rem 1.25rem; background: var(--bg-tertiary); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.5rem; overflow-x: auto; white-space: nowrap;">
      <span style="font-size: 0.725rem; color: var(--text-muted); flex-shrink: 0;">💡</span>
      <button
        v-for="(chip, cIdx) in promptChips"
        :key="cIdx"
        @click="sendPrompt(chip)"
        style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); color: var(--text-secondary); border-radius: 999px; padding: 0.3rem 0.75rem; font-size: 0.725rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;"
        class="cbb-chip"
      >
        {{ chip }}
      </button>
    </div>

    <!-- Input Box -->
    <div style="padding: 0.875rem 1.25rem; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle);">
      <form @submit.prevent="handleSubmit" style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="flex: 1; position: relative;">
          <input
            id="chat-input-box"
            v-model="inputQuery"
            type="text"
            placeholder="Tanya apa saja — soal Bapperida, hitung kinerja anggaran, atau obrolan biasa..."
            style="width: 100%; padding: 0.75rem 1rem; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; outline: none; transition: all 0.2s;"
            class="cbb-input"
            :disabled="isTyping"
          />
        </div>

        <button
          id="btn-send-message"
          type="submit"
          class="cbb-btn-primary"
          style="padding: 0.75rem 1.25rem;"
          :disabled="isTyping || !inputQuery.trim()"
        >
          <span>Kirim</span>
          <span>➔</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';

const props = defineProps({
  messages: { type: Array, required: true },
  isTyping: { type: Boolean, default: false }
});

const emit = defineEmits(['send-message', 'clear-chat']);

const inputQuery = ref('');
const messageContainerRef = ref(null);
const copiedIndex = ref(null);

// Static chips — no longer persona-specific, covers a good spread of use cases
const promptChips = [
  'Misal RKA 19M realisasi 78%, gimana?',
  'Hitung efektivitas: realisasi 95 target 100',
  'Hitung SROI investasi 500jt manfaat 1.25M',
  'Alur Musrenbang itu gimana?',
  'SIPD telat diinput, data beda sama BPS',
  'Hitung pertumbuhan PDRB 54 ke 58 triliun',
  'Apa itu KUA-PPAS?',
  'Beda RPJMD dan RKPD apa?',
];

function handleSubmit() {
  if (!inputQuery.value.trim() || props.isTyping) return;
  const q = inputQuery.value;
  inputQuery.value = '';
  emit('send-message', q);
  scrollToBottom();
}

function sendPrompt(text) {
  emit('send-message', text);
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
    }
  });
}

watch(() => props.messages.length, () => { scrollToBottom(); });

function copyText(rawText, idx) {
  if (!rawText) return;
  navigator.clipboard.writeText(rawText);
  copiedIndex.value = idx;
  setTimeout(() => { copiedIndex.value = null; }, 2000);
}

function formatMessageText(text) {
  if (!text) return '';
  return text
    // H3 headings (### text)
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:700;color:var(--primary-color);margin:0.75rem 0 0.35rem;line-height:1.3;">$1</h3>')
    // H4 headings (#### text)
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin:0.5rem 0 0.25rem;">$1</h4>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code style="background:var(--bg-tertiary);padding:2px 5px;border-radius:4px;font-family:var(--font-mono);color:var(--primary-color);font-size:0.8em;">$1</code>')
    // Bullet points (• or -)
    .replace(/^[•\-]\s+(.+)$/gm, '<div style="display:flex;gap:0.5rem;margin:0.2rem 0;"><span style="color:var(--primary-color);flex-shrink:0;">•</span><span>$1</span></div>')
    // Numbered list (1. 2. 3.)
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div style="display:flex;gap:0.5rem;margin:0.2rem 0;"><span style="color:var(--text-secondary);font-weight:600;flex-shrink:0;min-width:1rem;">$1.</span><span>$2</span></div>')
    // Line breaks
    .replace(/\n/g, '<br>');
}
</script>
