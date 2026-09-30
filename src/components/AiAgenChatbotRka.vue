<!--
  AiAgenChatbotRka.vue — menu "AI Agen Chatbot RKA" (AIbot, Vue 3 <script setup>)

  Dependensi frontend:
    • npm i marked            (render Markdown)
    • FontAwesome 6 CSS       (ikon fa-solid; mis. <link> cdnjs di index.html)
    • Font 'Plus Jakarta Sans' & 'Outfit' (opsional; ada fallback sistem)

  Backend: b-baru-main → /api/v1/aibot/{health,analyze,revise,chat,upload}
  Auth   : cookie sesi (credentials: 'include') dan/atau prop `authToken` (Bearer).

  Pemakaian:
    <AiAgenChatbotRka :api-base="API_URL" :auth-token="token" />
-->
<template>
  <div class="aibot-root">
    <!-- PAGE HEADER (pola sama dengan halaman lain: kicker + judul + deskripsi) -->
    <header class="aibot-head">
      <div class="aibot-head-text">
        <span class="page-kicker">AI Agen Chatbot RKA</span>
        <h2 class="page-title-lg brand-title">
          BAPPERIDA <span class="badge-ai">AI-RKA</span>
        </h2>
        <p class="page-desc">Sistem Analis Perencanaan & Pengendalian Anggaran Daerah</p>
      </div>

      <div class="aibot-head-actions">
        <div class="status-badge" :class="{ 'online': isServerOnline }" role="status" aria-live="polite">
          <span class="status-pulse"></span>
          <span>{{ isServerOnline ? 'Server & AI Online' : 'Menghubungkan...' }}</span>
          <span class="model-tag">{{ currentModel }}</span>
        </div>

        <button type="button" class="btn btn-secondary btn-sm" @click="loadSamplePreset">
          <i class="fa-solid fa-file-invoice-dollar"></i> Contoh RKA
        </button>
      </div>
    </header>

    <!-- MAIN BODY -->
    <main class="aibot-main">
      <!-- MODE NAVIGATION TABS -->
      <div class="tabs-container" role="tablist" aria-label="Mode AI Agen">
        <button 
          type="button"
          role="tab"
          class="tab-btn" 
          :class="{ active: activeTab === 'mode1' }"
          :aria-selected="activeTab === 'mode1'"
          @click="activeTab = 'mode1'"
        >
          <i class="fa-solid fa-magnifying-glass-chart"></i>
          <div>
            <div class="tab-title">Mode 1: Analis Evaluasi RKA</div>
            <div class="tab-desc">Uji Kepatuhan SBM, Efisiensi &amp; Nilai Prakiraan Dampak TAPD</div>
          </div>
        </button>

        <button 
          type="button"
          role="tab"
          class="tab-btn" 
          :class="{ active: activeTab === 'mode2' }"
          :aria-selected="activeTab === 'mode2'"
          @click="activeTab = 'mode2'"
        >
          <i class="fa-solid fa-pen-to-square"></i>
          <div>
            <div class="tab-title">Mode 2: Eksekutor Revisi RKA</div>
            <div class="tab-desc">Rasionalisasi Pagu & Draf DPA Baru</div>
          </div>
        </button>

        <button 
          type="button"
          role="tab"
          class="tab-btn" 
          :class="{ active: activeTab === 'mode3' }"
          :aria-selected="activeTab === 'mode3'"
          @click="activeTab = 'mode3'"
        >
          <i class="fa-solid fa-comments"></i>
          <div>
            <div class="tab-title">Mode 3: Konsultasi Regulasi</div>
            <div class="tab-desc">Tanya Jawab Permendagri 77 & SSH</div>
          </div>
        </button>
      </div>

      <!-- WORKSPACE GRID (For Mode 1 and Mode 2) -->
      <div v-if="activeTab !== 'mode3'" class="workspace-grid">
        <!-- LEFT PANEL: INPUT & UPLOAD -->
        <div class="card panel-input">
          <div class="panel-header">
            <div class="panel-title">
              <i class="fa-solid fa-file-lines"></i>
              <span>Dokumen RKA & Input Data</span>
            </div>
            <button type="button" class="btn-text" @click="clearInput" title="Bersihkan input">
              <i class="fa-solid fa-trash-can"></i> Bersihkan
            </button>
          </div>

          <!-- DROPZONE / UPLOADER -->
          <div 
            class="dropzone" 
            :class="{ 'dragging': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
            @keydown.enter.prevent="triggerFileInput"
            @keydown.space.prevent="triggerFileInput"
            role="button"
            tabindex="0"
            aria-label="Unggah dokumen RKA"
          >
            <input 
              type="file" 
              ref="fileInputRef" 
              style="display: none;" 
              accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.json"
              @change="handleFileUpload" 
            />
            <div v-if="!isUploading" class="dropzone-content">
              <i class="fa-solid fa-cloud-arrow-up drop-icon"></i>
              <div class="drop-text">
                <strong>Unggah Dokumen RKA</strong> (PDF, DOCX, XLSX, CSV, TXT)
              </div>
              <div class="drop-hint">Tarik file ke sini atau klik untuk memilih file</div>
            </div>
            <div v-else class="uploading-state">
              <i class="fa-solid fa-circle-notch animate-spin"></i>
              <span>Mengekstrak data dokumen...</span>
            </div>
          </div>

          <!-- TEXTAREA FOR RKA -->
          <div class="aibot-field">
            <label>Teks / Struktur Rincian Anggaran (RKA):</label>
            <textarea 
              v-model="rkaText" 
              class="form-control rka-textarea" 
              placeholder="Tempel rincian RKA di sini, contoh:
PROGRAM: Penyelenggaraan Pemerintahan
KEGIATAN: Penyusunan Dokumen Perencanaan
1. Honorarium Tim: Rp 85.000.000 (SBM: Rp 40.000.000)
2. Sewa Hotel: Rp 120.000.000..."
            ></textarea>
          </div>

          <!-- OPTIONAL INSTRUCTION -->
          <div v-if="activeTab === 'mode1'" class="aibot-field">
            <label>Instruksi Tambahan Evaluasi (Opsional):</label>
            <input 
              type="text" 
              v-model="customInstruction" 
              class="form-control" 
              placeholder="Contoh: Fokus pada pos perjalanan dinas dan kepatuhan SBM"
            />
          </div>

          <div v-if="activeTab === 'mode2'" class="aibot-field">
            <label>Arahan Rasionalisasi / Pemangkasan Anggaran:</label>
            <textarea 
              v-model="revisionInstruction" 
              class="form-control" 
              rows="3"
              placeholder="Contoh: Pangkas honorarium tim 50%, hapus sewa hotel dan ganti dengan rapat dalam kantor, pertahankan belanja perangkat geospasial."
            ></textarea>
          </div>

          <!-- ACTION BUTTON -->
          <button 
            type="button"
            class="btn btn-primary btn-block" 
            :disabled="isLoading || !rkaText.trim()"
            @click="runProcessing"
          >
            <span v-if="isLoading" class="btn-content">
              <i class="fa-solid fa-circle-notch animate-spin"></i>
              <span>{{ activeTab === 'mode1' ? 'Menganalisis RKA...' : 'Menyusun Revisi RKA...' }}</span>
            </span>
            <span v-else class="btn-content">
              <i :class="activeTab === 'mode1' ? 'fa-solid fa-microchip' : 'fa-solid fa-wand-magic-sparkles'"></i>
              <span>{{ activeTab === 'mode1' ? 'Jalankan Evaluasi & Reviu RKA' : 'Eksekusi & Generate Revisi RKA' }}</span>
            </span>
          </button>
        </div>

        <!-- RIGHT PANEL: RESULTS & ANALYSIS -->
        <div class="card panel-output">
          <div class="panel-header">
            <div class="panel-title">
              <i class="fa-solid fa-clipboard-check"></i>
              <span>{{ activeTab === 'mode1' ? 'Hasil Evaluasi & Rekomendasi TAPD' : 'Draf Revisi & Matriks Anggaran' }}</span>
            </div>
            
            <div class="output-actions" v-if="analysisResult">
              <button type="button" class="btn-icon" @click="copyResult" title="Salin Markdown" aria-label="Salin Markdown">
                <i :class="copied ? 'fa-solid fa-check text-success' : 'fa-solid fa-copy'"></i>
              </button>
              <button type="button" class="btn-icon" @click="printReport" title="Cetak / Unduh PDF" aria-label="Cetak atau unduh PDF">
                <i class="fa-solid fa-print"></i>
              </button>
            </div>
          </div>

          <!-- LOADING STATE -->
          <div v-if="isLoading" class="loading-container">
            <div class="ai-orb pulse-glow">
              <i class="fa-solid fa-brain"></i>
            </div>
            <h3 class="loading-title">AI Analis BAPPERIDA Sedang Bekerja...</h3>
            <p class="loading-subtitle">
              Memvalidasi terhadap standar harga satuan, Permendagri No. 77/2020, dan efisiensi fiskal.
            </p>
          </div>

          <!-- EMPTY STATE -->
          <div v-else-if="!analysisResult" class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-chart-line"></i>
            </div>
            <h3>Siap Menganalisis Dokumen RKA</h3>
            <p>Masukkan rincian anggaran pada panel kiri atau klik tombol <strong>"Contoh RKA"</strong> di pojok kanan atas untuk uji coba langsung.</p>
          </div>

          <!-- RESULT VIEW -->
          <div v-else class="result-container" id="printable-report">
            <div class="markdown-body" v-html="renderedMarkdown"></div>
          </div>
        </div>
      </div>

      <!-- MODE 3: INTERACTIVE CONSULTATION CHAT -->
      <div v-else class="card chat-card">
        <div class="chat-header">
          <div class="chat-title">
            <i class="fa-solid fa-graduation-cap"></i>
            <div>
              <h3>Konsultasi Interaktif Perencanaan & Anggaran Daerah</h3>
              <p>Didukung AI Analis Senior BAPPERIDA & Regulasi Pengelolaan Keuangan Daerah</p>
            </div>
          </div>

          <div class="chat-quick-actions">
            <button type="button" class="chip-btn" @click="sendQuickPrompt('Bagaimana mekanisme pengalihan anggaran belanja barang ke belanja modal?')">
              <i class="fa-solid fa-right-left"></i> Geseran Belanja
            </button>
            <button type="button" class="chip-btn" @click="sendQuickPrompt('Jelaskan batas maksimal honorarium narasumber sesuai SBM')">
              <i class="fa-solid fa-file-signature"></i> Aturan SBM
            </button>
            <button type="button" class="chip-btn" @click="sendQuickPrompt('Bagaimana cara menghitung Nilai Prakiraan Dampak untuk belanja riset?')">
              <i class="fa-solid fa-lightbulb"></i> Analisis Nilai Prakiraan Dampak
            </button>
            <button
              type="button"
              class="chip-btn chip-btn-danger"
              title="Hapus histori chat"
              aria-label="Hapus histori chat"
              @click="clearChatHistory"
            >
              <i class="fa-solid fa-trash-can"></i> Hapus Histori
            </button>
          </div>
        </div>

        <div class="chat-messages" ref="chatMessagesRef" role="log" aria-live="polite">
          <div 
            v-for="(msg, idx) in chatHistory" 
            :key="idx" 
            class="chat-bubble-wrapper"
            :class="msg.role"
          >
            <div class="aibot-avatar">
              <i :class="msg.role === 'user' ? 'fa-solid fa-user' : 'fa-solid fa-robot'"></i>
            </div>
            <div class="chat-bubble">
              <div class="bubble-sender">{{ msg.role === 'user' ? 'Anda' : 'Analis BAPPERIDA' }}</div>
              <div class="markdown-body" v-html="renderChatMarkdown(msg.content)"></div>
            </div>
          </div>

          <div v-if="isChatLoading" class="chat-bubble-wrapper model">
            <div class="aibot-avatar">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div class="chat-bubble typing">
              <span class="aibot-dot"></span>
              <span class="aibot-dot"></span>
              <span class="aibot-dot"></span>
            </div>
          </div>
        </div>

        <div class="chat-input-container">
          <input 
            type="text" 
            v-model="chatInput" 
            class="form-control chat-input" 
            aria-label="Pertanyaan konsultasi"
            placeholder="Ketik pertanyaan konsultasi seputar RKA, Permendagri 77, SIPD-RI..."
            @keyup.enter="sendChatMessage"
            :disabled="isChatLoading"
          />
          <button 
            type="button"
            class="btn btn-primary btn-chat" 
            aria-label="Kirim pesan"
            @click="sendChatMessage" 
            :disabled="isChatLoading || !chatInput.trim()"
          >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { marked } from 'marked';

// Props — dipakai host app (f-baru) untuk mengarahkan ke backend b-baru
const props = defineProps({
  // Base URL backend, mis. "https://b-baru.onrender.com". Kosong = origin yang sama / proxy Vite.
  apiBase: { type: String, default: import.meta.env?.VITE_API_URL || '' },
  // Token JWT (opsional). Bila diisi dikirim sebagai "Authorization: Bearer".
  // Cookie sesi (authToken) selalu ikut terkirim lewat credentials: 'include'.
  authToken: { type: String, default: '' }
});

const AIBOT_API = '/api/v1/aibot';

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (props.authToken) headers.Authorization = `Bearer ${props.authToken}`;
  const response = await fetch(`${props.apiBase.replace(/\/$/, '')}${AIBOT_API}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { success: false, error: `Respons server tidak valid (HTTP ${response.status})` };
  }
  if (response.status === 401) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' };
  }
  return data;
}

// State Variables
const isServerOnline = ref(false);
const currentModel = ref('gemini-3.5-flash-lite');
const activeTab = ref('mode1');

// Mode 1 & 2 State
const rkaText = ref('');
const customInstruction = ref('');
const revisionInstruction = ref('Pangkas honorarium tim 50%, sewa hotel dialokasikan ulang ke rapat kantor');
const analysisResult = ref('');
const isLoading = ref(false);
const isUploading = ref(false);
const isDragging = ref(false);
const copied = ref(false);
const fileInputRef = ref(null);

// Mode 3 State (Chat)
const chatInput = ref('');
const isChatLoading = ref(false);
const chatMessagesRef = ref(null);
const chatHistory = ref([
  {
    role: 'model',
    content: `Halo! Saya adalah **Sistem AI Analis Senior BAPPERIDA**. 
    
Saya siap membantu Anda dalam:
- Evaluasi kesesuaian nomenklatur dan kepatuhan SBM/SSH.
- Analisis efisiensi belanja daerah dan *Value for Money*.
- Konsultasi regulasi Permendagri No. 77/2020 dan penyusunan APBD.

Silakan ajukan pertanyaan atau pilih topik cepat di atas!`
  }
]);

// Pesan sambutan awal dipakai lagi setiap kali histori chat dihapus/direset
function getWelcomeMessage() {
  return {
    role: 'model',
    content: `Halo! Saya adalah **Sistem AI Analis Senior BAPPERIDA**. 
    
Saya siap membantu Anda dalam:
- Evaluasi kesesuaian nomenklatur dan kepatuhan SBM/SSH.
- Analisis efisiensi belanja daerah dan *Value for Money*.
- Konsultasi regulasi Permendagri No. 77/2020 dan penyusunan APBD.

Silakan ajukan pertanyaan atau pilih topik cepat di atas!`
  };
}

function clearChatHistory() {
  if (isChatLoading.value) return;
  const confirmed = window.confirm('Hapus seluruh histori percakapan ini? Tindakan ini tidak dapat dibatalkan.');
  if (!confirmed) return;
  chatHistory.value = [getWelcomeMessage()];
}

// Sample Preset RKA
const sampleRKA = `PROGRAM: Program Penyelenggaraan Pemerintahan dan Pelayanan Publik
KEGIATAN: Penyusunan Dokumen Perencanaan BAPPERIDA

RINCIAN ANGGARAN:
1. Rekening 5.1.02.01.0001 (Honorarium Tim Penyusun Dokumen RPJMD)
   - Anggaran: Rp 85.000.000
   - SBM: Rp 40.000.000
   - Target Output: 1 Dokumen

2. Rekening 5.1.02.02.0005 (Sewa Hotel Rapat Koordinasi)
   - Anggaran: Rp 120.000.000
   - SBM: Rp 60.000.000
   - Target Output: 2 Hari Rapat

3. Rekening 5.2.02.05.0001 (Pengadaan Perangkat Sistem Informasi Geospasial BAPPERIDA)
   - Anggaran: Rp 45.000.000
   - SBM: Rp 50.000.000
   - Estimasi Moneter Manfaat Sosial (Nilai Prakiraan Dampak): Rp 350.000.000
`;

// Markdown Computed
// Output AI bisa memuat HTML mentah (mis. akibat isi dokumen yang diunggah).
// marked TIDAK menyaring HTML, jadi hasilnya disanitasi dulu sebelum masuk v-html.
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'HR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI',
  'STRONG', 'B', 'EM', 'I', 'DEL', 'S', 'CODE', 'PRE', 'BLOCKQUOTE',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'A', 'SPAN', 'DIV', 'SUP', 'SUB'
]);
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH']);

function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');

  const clean = node => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        continue;
      }
      const tag = child.tagName.toUpperCase();
      if (DROP_WITH_CONTENT.has(tag)) {
        child.remove();
        continue;
      }
      clean(child);
      if (!ALLOWED_TAGS.has(tag)) {
        child.replaceWith(...Array.from(child.childNodes)); // buang tag, pertahankan isi
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const keep =
          (tag === 'A' && name === 'href' && /^(https?:|mailto:|#)/i.test(attr.value.trim())) ||
          (tag === 'CODE' && name === 'class' && /^language-[\w-]+$/.test(attr.value)) ||
          ((tag === 'TH' || tag === 'TD') && name === 'align' && /^(left|right|center)$/i.test(attr.value));
        if (!keep) child.removeAttribute(attr.name);
      }
      if (tag === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };

  clean(doc.body);
  return doc.body.innerHTML;
}

function renderMarkdownSafe(text) {
  return sanitizeHtml(marked.parse(text || ''));
}

const renderedMarkdown = computed(() => {
  if (!analysisResult.value) return '';
  return renderMarkdownSafe(analysisResult.value);
});

function renderChatMarkdown(text) {
  return renderMarkdownSafe(text);
}

// Lifecycle
onMounted(async () => {
  await checkHealth();
});

// Check API Health
async function checkHealth() {
  try {
    const data = await apiFetch('/health');
    if (data.status === 'online') {
      isServerOnline.value = true;
      currentModel.value = data.model;
    } else {
      isServerOnline.value = false;
    }
  } catch (err) {
    console.error('Health check failed:', err);
    isServerOnline.value = false;
  }
}

// Load Preset
function loadSamplePreset() {
  rkaText.value = sampleRKA;
  customInstruction.value = 'Uji kepatuhan SBM dan hitung potensi efisiensi TAPD';
}

function clearInput() {
  rkaText.value = '';
  customInstruction.value = '';
  analysisResult.value = '';
}

// File Upload Handlers
function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (file) await uploadFile(file);
}

async function handleDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) await uploadFile(file);
}

async function uploadFile(file) {
  try {
    isUploading.value = true;
    const formData = new FormData();
    formData.append('file', file);

    const data = await apiFetch('/upload', { method: 'POST', body: formData });
    if (data.success) {
      rkaText.value = data.extractedText;
    } else {
      alert(`Gagal mengekstrak file: ${data.error}`);
    }
  } catch (err) {
    alert(`Terjadi kesalahan upload: ${err.message}`);
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
}

// Main Processing (Mode 1 & Mode 2)
async function runProcessing() {
  if (!rkaText.value.trim()) return;

  isLoading.value = true;
  analysisResult.value = '';

  try {
    if (activeTab.value === 'mode1') {
      const data = await apiFetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rkaText: rkaText.value,
          customInstruction: customInstruction.value
        })
      });
      if (data.success) {
        analysisResult.value = data.result;
      } else {
        analysisResult.value = `### Error Analisis\n${data.error}`;
      }
    } else if (activeTab.value === 'mode2') {
      const data = await apiFetch('/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rkaText: rkaText.value,
          instruction: revisionInstruction.value
        })
      });
      if (data.success) {
        analysisResult.value = data.result;
      } else {
        analysisResult.value = `### Error Revisi\n${data.error}`;
      }
    }
  } catch (err) {
    analysisResult.value = `### Gangguan Komunikasi\n${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

// Copy to Clipboard
function copyResult() {
  if (!analysisResult.value) return;
  navigator.clipboard.writeText(analysisResult.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

// Print / PDF
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Cetak hanya isi laporan lewat jendela terpisah supaya tidak ikut mencetak
// sidebar/menu aplikasi induk.
function printReport() {
  if (!analysisResult.value) return;
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan.');
    return;
  }
  const title = activeTab.value === 'mode1' ? 'Hasil Evaluasi RKA' : 'Draf Revisi RKA';
  win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; line-height: 1.6; padding: 24px; font-size: 13px; }
  h1, h2, h3, h4 { margin: 1.2em 0 0.5em; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #efe8da; color: #1b4d46; }
  pre, code { font-family: Consolas, monospace; background: #f5f5f5; }
  pre { padding: 10px; overflow-x: auto; white-space: pre-wrap; }
  blockquote { border-left: 4px solid #c97b3d; margin: 10px 0; padding: 4px 12px; background: #fbf3ea; }
</style></head><body>${renderedMarkdown.value}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// Chat Handlers
function sendQuickPrompt(prompt) {
  chatInput.value = prompt;
  sendChatMessage();
}

async function sendChatMessage() {
  const msg = chatInput.value.trim();
  if (!msg || isChatLoading.value) return;

  chatHistory.value.push({ role: 'user', content: msg });
  chatInput.value = '';
  isChatLoading.value = true;

  await nextTick();
  scrollToChatBottom();

  try {
    const data = await apiFetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: chatHistory.value.slice(0, -1),
        message: msg,
        mode: 'Konsultasi Perencanaan BAPPERIDA'
      })
    });
    if (data.success) {
      chatHistory.value.push({ role: 'model', content: data.reply });
    } else {
      chatHistory.value.push({ role: 'model', content: `**Error:** ${data.error}` });
    }
  } catch (err) {
    chatHistory.value.push({ role: 'model', content: `**Gagal menghubungi server:** ${err.message}` });
  } finally {
    isChatLoading.value = false;
    await nextTick();
    scrollToChatBottom();
  }
}

function scrollToChatBottom() {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
}
</script>

<style scoped>
/*
  Gaya mengikuti design system ASI DARA (assets/style.css): krem hangat + teal tua,
  aksen terrakota untuk elemen "AI", kartu soft-UI, tombol datar tanpa gradien.
  Semua warna memakai token global (var(--bg-*), --primary-color, dst.), jadi tema
  terang/gelap ([data-theme="dark"]) otomatis ikut berganti.
*/

/* ── Header halaman ─────────────────────────────────────────────────── */
.aibot-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 16px;
}

.aibot-head-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.badge-ai {
  font-family: var(--font-body);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 999px;
  color: var(--aibot-accent-text);
  background: var(--accent-glow);
  border: 1px solid rgba(var(--accent-rgb), 0.3);
}

.aibot-head-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  box-shadow: var(--shadow-raised);
}

.status-pulse {
  width: 8px;
  height: 8px;
  background: var(--warning-color);
  border-radius: 50%;
  flex-shrink: 0;
}

.status-badge.online .status-pulse {
  background: var(--success-color);
  box-shadow: 0 0 0 3px var(--success-glow);
}

.model-tag {
  background: var(--info-glow);
  color: var(--aibot-teal-text);
  padding: 1px 7px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-family: var(--font-mono);
}

/* ── Layout utama ───────────────────────────────────────────────────── */
/* Padding & lebar sudah diatur .content-wrapper aplikasi induk. */
.aibot-main {
  width: 100%;
  min-width: 0;
}

/* ── Tab mode ───────────────────────────────────────────────────────── */
.tabs-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-raised);
  transition: background-color var(--transition-speed), border-color var(--transition-speed), color var(--transition-speed);
}

.tab-btn i {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 1.1rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-inset);
  transition: color var(--transition-speed), background-color var(--transition-speed);
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--text-primary);
}

.tab-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Aktif: sama dengan item aktif pada sidebar (tint teal + aksen terrakota di kiri) */
.tab-btn.active {
  background: var(--gradient-brand-soft);
  border-color: rgba(var(--primary-rgb), 0.35);
  box-shadow: inset 3px 0 0 0 var(--accent-color), 0 0 12px var(--primary-glow);
  color: var(--aibot-teal-text);
}

.tab-btn.active i {
  color: #fff;
  background: var(--aibot-teal-solid);
  box-shadow: none;
}

.tab-title {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--text-primary);
}

.tab-btn.active .tab-title {
  color: var(--aibot-teal-text);
}

.tab-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* ── Grid kerja ─────────────────────────────────────────────────────── */
.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 992px) {
  .workspace-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Kartu: tampilan dasar dari .card global; di sini hanya jarak isi. */
.card {
  padding: 20px;
  margin-bottom: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.panel-title i {
  color: var(--aibot-teal-text);
}

.output-actions {
  display: flex;
  gap: 8px;
}

.panel-output {
  min-height: 460px;
}

/* ── Dropzone ───────────────────────────────────────────────────────── */
.dropzone {
  border: 2px dashed var(--border-color-strong);
  border-radius: var(--border-radius-md);
  padding: 18px;
  text-align: center;
  cursor: pointer;
  background: var(--bg-tertiary);
  transition: border-color var(--transition-speed), background-color var(--transition-speed);
  margin-bottom: 16px;
}

.dropzone:hover,
.dropzone.dragging,
.dropzone:focus-visible {
  border-color: var(--primary-color);
  background: var(--gradient-brand-soft);
  outline: none;
}

.drop-icon {
  font-size: 1.9rem;
  color: var(--aibot-teal-text);
  margin-bottom: 6px;
}

.drop-text {
  font-size: 0.88rem;
  color: var(--text-primary);
}

.drop-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.uploading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--aibot-teal-text);
  font-size: 0.88rem;
}

/* ── Form ───────────────────────────────────────────────────────────── */
.aibot-field {
  margin-bottom: 14px;
}

.aibot-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-primary);
  padding: 11px 14px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  outline: none;
  box-shadow: var(--shadow-inset);
  transition: border-color var(--transition-speed), box-shadow var(--transition-speed);
}

.form-control::placeholder {
  color: var(--text-muted);
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-inset), 0 0 0 3px var(--primary-glow);
}

.form-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rka-textarea {
  height: 220px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.5;
  resize: vertical;
}

/* ── Tombol ─────────────────────────────────────────────────────────── */
/* .btn / .btn-primary / .btn-secondary dipakai langsung dari CSS global. */
.btn-block {
  width: 100%;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
}

.btn-text:hover {
  color: var(--danger-color);
  background: var(--danger-glow);
}

.btn-icon {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 34px;
  height: 34px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-raised);
  transition: color var(--transition-speed), border-color var(--transition-speed);
}

.btn-icon:hover {
  color: var(--aibot-teal-text);
  border-color: var(--aibot-teal-text);
}

.text-success {
  color: var(--success-color);
}

/* ── Loading & keadaan kosong ───────────────────────────────────────── */
.loading-container,
.empty-state {
  text-align: center;
  padding: 56px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Tekstur titik "retro-digital" tipis, sesuai token tema */
.empty-state {
  background-image: radial-gradient(var(--retro-dot-color) 1px, transparent 1px);
  background-size: var(--retro-grid-size) var(--retro-grid-size);
  border-radius: var(--border-radius-md);
}

.ai-orb {
  width: 64px;
  height: 64px;
  background: var(--accent-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  color: #fff;
  margin-bottom: 20px;
}

.loading-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.loading-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 420px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  background: var(--gradient-brand-soft);
  border: 1px solid rgba(var(--primary-rgb), 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: var(--aibot-teal-text);
  margin-bottom: 14px;
}

.empty-state h3 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.empty-state p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 400px;
}

/* ── Hasil ──────────────────────────────────────────────────────────── */
.result-container {
  max-height: min(70vh, 760px);
  overflow-y: auto;
  padding-right: 8px;
}

/* ── Chat ───────────────────────────────────────────────────────────── */
.chat-card {
  height: clamp(480px, 72vh, 820px);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.chat-title > i {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 1.2rem;
  color: #fff;
  background: var(--aibot-teal-solid);
}

.chat-title h3 {
  font-size: 1.05rem;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.chat-title p {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.chat-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 5px 12px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--transition-speed), border-color var(--transition-speed), background-color var(--transition-speed);
}

.chip-btn i {
  color: var(--accent-color);
}

.chip-btn:hover {
  background: var(--gradient-brand-soft);
  border-color: var(--aibot-teal-text);
  color: var(--aibot-teal-text);
}

.chip-btn-danger i {
  color: #ef4444;
}

.chip-btn-danger:hover {
  background: rgba(239,68,68,0.08);
  border-color: #ef4444;
  color: #ef4444;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.chat-bubble-wrapper {
  display: flex;
  gap: 12px;
  max-width: min(760px, 86%);
}

.chat-bubble-wrapper.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-bubble-wrapper.model {
  align-self: flex-start;
}

.aibot-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
  color: var(--aibot-teal-text);
  background: var(--gradient-brand-soft);
  border: 1px solid rgba(var(--primary-rgb), 0.28);
}

.chat-bubble-wrapper.user .aibot-avatar {
  background: var(--accent-color);
  border-color: transparent;
  color: #fff;
}

.chat-bubble {
  min-width: 0;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px var(--border-radius-md) var(--border-radius-md) var(--border-radius-md);
  padding: 12px 16px;
}

.chat-bubble-wrapper.user .chat-bubble {
  background: var(--aibot-teal-solid);
  border-color: var(--aibot-teal-solid);
  border-radius: var(--border-radius-md) 4px var(--border-radius-md) var(--border-radius-md);
}

.bubble-sender {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
}

.chat-bubble-wrapper.user .bubble-sender {
  color: rgba(255, 255, 255, 0.75);
}

.chat-input-container {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.btn-chat {
  flex-shrink: 0;
  padding-inline: 18px;
}

/* Indikator mengetik */
.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 16px;
}

.aibot-dot {
  width: 6px;
  height: 6px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing .aibot-dot:nth-child(2) { animation-delay: 0.2s; }
.typing .aibot-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

@media (max-width: 640px) {
  .aibot-head-actions { width: 100%; justify-content: space-between; }
  .chat-title p,
  .tab-desc { display: none; }
  .tab-btn { padding: 10px 14px; }
  .chat-bubble-wrapper { max-width: 94%; }
  .card { padding: 16px; }
  .chat-card { padding: 0; }
}
</style>

<style>
/* Root komponen: transparan, mewarisi latar krem/gelap dari aplikasi induk.
   Token warna/ukuran diambil dari :root di assets/style.css. */
.aibot-root {
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  /* Teal tua (--primary-color) terlalu gelap untuk teks di atas latar gelap,
     jadi tema gelap memakai teal & terrakota yang lebih terang. */
  --aibot-teal-text: var(--primary-color);
  --aibot-teal-solid: var(--primary-color);
  --aibot-accent-text: var(--accent-hover);
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
  min-width: 0;
  color: var(--text-primary);
  font-family: var(--font-body);
  line-height: 1.6;
}

[data-theme="dark"] .aibot-root {
  --aibot-teal-text: #6fc3b2;
  --aibot-teal-solid: #2a7f71;
  --aibot-accent-text: #e59a5b;
}

/* Markdown (konten v-html tidak kena style scoped, jadi dibuat global tapi dibatasi ke .aibot-root) */
.aibot-root .markdown-body {
  color: var(--text-primary);
  font-size: 0.92rem;
  line-height: 1.7;
  overflow-wrap: break-word;
}

.aibot-root .markdown-body > :first-child { margin-top: 0; }
.aibot-root .markdown-body > :last-child { margin-bottom: 0; }

.aibot-root .markdown-body h1,
.aibot-root .markdown-body h2,
.aibot-root .markdown-body h3,
.aibot-root .markdown-body h4 {
  font-family: var(--font-heading);
  color: var(--text-primary);
  margin-top: 1.4rem;
  margin-bottom: 0.7rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.aibot-root .markdown-body h1 {
  font-size: 1.4rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--aibot-teal-text);
}

.aibot-root .markdown-body h2 {
  font-size: 1.15rem;
  color: var(--aibot-teal-text);
  border-left: 3px solid var(--accent-color);
  padding-left: 0.7rem;
}

.aibot-root .markdown-body h3 {
  font-size: 1.02rem;
  color: var(--aibot-teal-text);
}

.aibot-root .markdown-body p {
  margin-bottom: 0.9rem;
}

.aibot-root .markdown-body ul,
.aibot-root .markdown-body ol {
  padding-left: 1.4rem;
  margin-bottom: 0.9rem;
}

.aibot-root .markdown-body li {
  margin-bottom: 0.3rem;
}

.aibot-root .markdown-body a {
  color: var(--aibot-teal-text);
  text-decoration: underline;
}

.aibot-root .markdown-body blockquote {
  border-left: 4px solid var(--accent-color);
  background: var(--accent-glow);
  padding: 0.7rem 1.1rem;
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  margin: 1rem 0;
  color: var(--text-primary);
}

.aibot-root .markdown-body blockquote p:last-child { margin-bottom: 0; }

.aibot-root .markdown-body table {
  display: block;               /* tabel lebar bisa digeser, tidak melebarkan halaman */
  overflow-x: auto;
  width: 100%;
  border-collapse: collapse;
  margin: 1.1rem 0;
  font-size: 0.85rem;
}

.aibot-root .markdown-body th {
  background: var(--bg-tertiary);
  color: var(--aibot-teal-text);
  font-weight: 700;
  text-align: left;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

.aibot-root .markdown-body th,
.aibot-root .markdown-body td {
  overflow-wrap: normal;
  word-break: normal;
}

.aibot-root .markdown-body td {
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.aibot-root .markdown-body tr:nth-child(even) td {
  background: var(--bg-primary);
}

.aibot-root .markdown-body tr:hover td {
  background: var(--gradient-brand-soft);
}

.aibot-root .markdown-body pre {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: 0.9rem 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.aibot-root .markdown-body code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--bg-tertiary);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  color: var(--aibot-accent-text);
}

.aibot-root .markdown-body pre code {
  background: transparent;
  padding: 0;
  color: var(--text-primary);
}

/* Teks di dalam gelembung pengguna (latar teal) harus terang */
.aibot-root .chat-bubble-wrapper.user .markdown-body,
.aibot-root .chat-bubble-wrapper.user .markdown-body p,
.aibot-root .chat-bubble-wrapper.user .markdown-body li,
.aibot-root .chat-bubble-wrapper.user .markdown-body strong {
  color: #fff;
}

/* Animasi */
@keyframes aibotPulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-glow); }
  50% { box-shadow: 0 0 0 14px transparent; }
}
.aibot-root .pulse-glow { animation: aibotPulseGlow 2.4s infinite; }

@keyframes aibotSpin {
  to { transform: rotate(360deg); }
}
.aibot-root .animate-spin { animation: aibotSpin 1s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .aibot-root .pulse-glow,
  .aibot-root .animate-spin { animation: none; }
}
</style>
