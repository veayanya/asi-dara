<template>
 <div class="app-root">
 <!-- ══ OVERLAY: Server sedang bangun dari sleep (Render free tier) ═══ -->
 <div v-if="wakeStatus.phase !== 'ready'" class="wake-overlay">
 <div class="wake-box">
 <div class="wake-spinner"></div>
 <template v-if="wakeStatus.phase === 'error'">
 <h3>Server Tidak Merespons</h3>
 <p>{{ wakeStatus.message }}</p>
 <button class="btn btn-primary" @click="startWakeCheck">Coba Lagi</button>
 </template>
 <template v-else-if="wakeStatus.phase === 'waking'">
 <h3>Menyiapkan Server…</h3>
 <p>Aplikasi ini baru pertama kali diakses setelah idle, jadi server sedang dinyalakan ulang secara otomatis. Biasanya butuh 30–60 detik. Mohon tunggu, jangan tutup halaman ini.</p>
 </template>
 <template v-else>
 <h3>Menghubungkan…</h3>
 <p>Sedang menghubungkan ke server.</p>
 </template>
 </div>
 </div>

 <!-- ══ LOGIN PAGE (belum login) ══════════════════════════════════════ -->
 <LoginPage v-if="wakeStatus.phase === 'ready' && !isLoggedIn" @login-success="onLoginSuccess" />

 <!-- ══ MAIN APP (sudah login) ════════════════════════════════════════ -->
 <div v-else-if="isLoggedIn" class="app-container">
 <!-- Sidebar Navigation -->
 <Sidebar :current-user="currentUser" @logout="handleLogout" />

 <!-- Main Content Area -->
 <main class="main-content">

 <!-- Top Header Bar -->
 <Header :current-user="currentUser" @logout="handleLogout" />

 <!-- Dynamic Section Wrapper -->
 <div class="content-wrapper">

 <!-- ── ADMIN / MODERATOR DASHBOARD ──────────────────────────── -->
 <section
 v-if="currentUser?.role === 'admin' || currentUser?.role === 'moderator'"
 v-show="currentTab === 'admin-dashboard'"
 class="page-section active"
 id="admin-dashboard-section"
 >
 <AdminDashboard />
 </section>

 <!-- 1. DASHBOARD / UPLOAD SECTION -->
 <section
 v-show="currentTab === 'dashboard'"
 class="page-section active"
 id="dashboard-section"
 >
 <MenuNonaktif v-if="isMenuBlocked('dashboard')" />
 <Dashboard v-else />
 </section>

 <!-- 2. AI ANALYZER SECTION -->
 <section v-show="currentTab === 'analyzer'" class="page-section active" id="analyzer-section">
 <MenuNonaktif v-if="isMenuBlocked('analyzer')" />
 <template v-else>
 <PageHero icon="bar-chart-3" title="Hasil Analisis" subtitle="Nilai prakiraan dampak per dokumen" />
 <!-- Result visualizer -->
 <div v-if="activeAnalysis">
 <AnalysisResult :analysis="activeAnalysis" />
 </div>
 <!-- Placeholder when no active document loaded -->
 <div v-else class="document-pane">
 <div class="pane-header">
 <span class="pane-title"><i data-lucide="cpu" style="color: var(--primary-color);"></i> Dokumen RKA</span>
 </div>
 <div class="pane-body">
 <div class="doc-placeholder-msg" style="padding: 40px 20px;">
 <i data-lucide="file-search" style="width: 56px; height: 56px; opacity: 0.4; margin-bottom: 12px; color: var(--primary-color);"></i>
 <h3 style="font-size: 1.25rem; font-weight: 700;">Pilih dokumen</h3>
 <p style="max-width: 540px; margin: 6px auto 20px; color: var(--text-secondary);">
 {{ rkis.length > 0
 ? rkis.length + ' dokumen siap dibuka'
 : 'Belum ada dokumen. Unggah PDF RKA dulu.' }}
 </p>

 <div v-if="rkis.length > 0" style="display: flex; flex-direction: column; gap: 10px; max-width: 620px; margin: 0 auto 20px;">
 <div
 v-for="(doc, idx) in rkis.slice(0, 5)"
 :key="doc.id || idx"
 style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-hover, #f8fafc); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 16px; text-align: left; cursor: pointer; transition: all 0.2s;"
 @click="loadHistoricalDocIntoAnalyzer(doc)"
 >
 <div>
 <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">{{ doc.namaDokumen || doc.program || doc.id }}</div>
 <div style="font-size: 0.8rem; color: var(--text-muted);">{{ doc.opd }} · Pagu: Rp {{ Number(doc.pagu || 0).toLocaleString('id-ID') }} · Nilai Prakiraan Dampak: {{ formatSroiSnippet(doc) }}</div>
 </div>
 <button class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
 <i data-lucide="eye"></i> Lihat Analisis
 </button>
 </div>
 </div>

 <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
 <button v-if="rkis.length > 0" class="btn btn-primary" @click="loadHistoricalDocIntoAnalyzer(rkis[0])">
 <i data-lucide="eye"></i> Buka yang terakhir
 </button>
 <button class="btn btn-secondary" @click="currentTab = 'dashboard'">
 <i data-lucide="upload-cloud"></i> Unggah baru
 </button>
 </div>
 </div>
 </div>
 </div>
 </template>
 </section>

 <!-- 3. ARSIP DOKUMEN RKA SECTION -->
 <section v-show="currentTab === 'history'" class="page-section active" id="history-section">
 <MenuNonaktif v-if="isMenuBlocked('history')" />
 <ArsipDokumen v-else />
 </section>

 <!-- 3.2. AGENTIC AI WORKSPACE SECTION -->
 <section v-show="currentTab === 'agentic-ai'" class="page-section active" id="agentic-section">
 <MenuNonaktif v-if="isMenuBlocked('agentic-ai')" />
<CbbChatbot v-else />
 </section>


 <!-- 4. RULES CONFIGURATION SECTION -->
 <section v-show="currentTab === 'config'" class="page-section active" id="config-section">
 <FormSection />
 </section>

 <!-- NEW PLACEHOLDER SECTIONS -->
 <section v-show="currentTab === 'main-dashboard'" class="page-section active">
 <MenuNonaktif v-if="isMenuBlocked('main-dashboard')" />
 <MainDashboard v-else />
 </section>

 <section v-show="currentTab === 'pra-rka'" class="page-section active">
 <MenuNonaktif v-if="isMenuBlocked('pra-rka')" />
 <template v-else>
 <PageHero icon="clipboard-list" title="Buat Pra RKA" subtitle="Susun rancangan Renja PD" />
 <ErenjaStudio />
 </template>
 </section>

 <section v-show="currentTab === 'petunjuk'" class="page-section active">
   <MenuNonaktif v-if="isMenuBlocked('petunjuk')" />
   <PetunjukPenggunaan v-else @navigate="currentTab = $event" />
 </section>

 <section v-show="currentTab === 'report'" class="page-section active">
 <MenuNonaktif v-if="isMenuBlocked('report')" />
 <template v-else>
 <PageHero icon="flag" title="Laporan" subtitle="Kirim kendala atau masukan" />
 <LaporanForm />
 </template>
 </section>

 <section v-show="currentTab === 'faq'" class="page-section active">
 <MenuNonaktif v-if="isMenuBlocked('faq')" />
 <BantuanPertanyaan v-else @navigate="currentTab = $event" />
 </section>

 </div>
 </main>

 <!-- Reactive Notifications Container -->
 <div class="toasts-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;">
 <div
 v-for="toast in notificationsList"
 :key="toast.id"
 class="toast-item"
 :style="{ borderLeft: '4px solid ' + getToastBorderColor(toast.type) }"
 >
 <div :style="{ color: getToastBorderColor(toast.type), fontSize: '1.2rem', display: 'flex', alignItems: 'center' }">
 <i :data-lucide="getToastIcon(toast.type)"></i>
 </div>
 <div style="display:flex; flex-direction:column; gap:2px;">
 <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">{{ toast.title }}</div>
 <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.3;">{{ toast.message }}</div>
 </div>
 </div>
 </div>
 </div>

 <!-- ══ FLOATING CHATBOT BAPPERIDA AI (dari aibot) ════════════════════ -->
 <!-- <ChatBot v-if="isLoggedIn" /> -->

 </div>
</template>

<script setup>
import { onMounted, watch, nextTick, ref } from 'vue';
import { useAnalysis, computeSroi16Rules } from './composables/useAnalysis';
import { waitForBackendAwake } from './utils/api';
import LoginPage from './components/LoginPage.vue';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Dashboard from './components/Dashboard.vue';
import FormSection from './components/FormSection.vue';
import AnalysisResult from './components/AnalysisResult.vue';
import ArsipDokumen from './components/ArsipDokumen.vue';
import MainDashboard from './components/MainDashboard.vue';
import CbbChatbot from './modules/cbb/CbbChatbot.vue';
import PageHero from './components/PageHero.vue';
import LaporanForm from './components/LaporanForm.vue';
import MenuNonaktif from './components/MenuNonaktif.vue';
import BantuanPertanyaan from './components/BantuanPertanyaan.vue';
import PetunjukPenggunaan from './components/PetunjukPenggunaan.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import ErenjaStudio from './components/ErenjaStudio.vue';

const {
 currentTab,
 activeAnalysis,
 rkis,
 loadHistoricalDocIntoAnalyzer,
 notificationsList,
 isLoggedIn,
 currentUser,
 checkSession,
 connectRealtimeAfterLogin,
 logout,
 isMenuEnabled
} = useAnalysis();

// Menu yang dinonaktifkan admin diblokir untuk user biasa; admin/moderator tetap bisa akses.
function isMenuBlocked(tabId) {
 const role = currentUser.value?.role;
 if (role === 'admin' || role === 'moderator') return false;
 return !isMenuEnabled(tabId);
}

// Status "membangunkan" backend Render (lihat utils/api.js: waitForBackendAwake)
const wakeStatus = ref({ phase: 'checking' });

async function startWakeCheck() {
 wakeStatus.value = { phase: 'checking' };
 const awake = await waitForBackendAwake((status) => {
 wakeStatus.value = status;
 });
 if (awake) {
 // Backend sudah siap — lanjutkan proses normal (cek sesi login)
 await checkSession();
 nextTick(() => {
 if (window.lucide) window.lucide.createIcons();
 });
 }
}

const rkaFacts = [
 'Analisis RKA membantu mengidentifikasi potensi ketidakefisienan anggaran. Struktur belanja dapat dianalisis untuk melihat proporsi belanja utama dan penunjang. RKA dapat dianalisis berdasarkan kode rekening, kegiatan, sub-kegiatan, dan nilai anggaran. Distribusi RPD membantu mengidentifikasi risiko penumpukan penarikan dana pada periode tertentu. Analisis Nilai Prakiraan Dampak dapat membantu melihat hubungan antara investasi anggaran dan dampak yang dihasilkan.'
];

// Handle login success — redirect ke tab sesuai role
function onLoginSuccess(user) {
 currentUser.value = user;
 isLoggedIn.value = true;
 if (user.role === 'admin' || user.role === 'moderator') {
 currentTab.value = 'admin-dashboard';
 } else {
 currentTab.value = 'main-dashboard';
 }
 // Sambungkan SSE realtime segera setelah login, agar dot indikator langsung
 // jadi biru (terkoneksi) tanpa perlu refresh halaman.
 connectRealtimeAfterLogin();
 nextTick(() => {
 if (window.lucide) window.lucide.createIcons();
 });
}

async function handleLogout() {
 await logout();
 nextTick(() => {
 if (window.lucide) window.lucide.createIcons();
 });
}

// Toast helpers
const getToastBorderColor = (type) => {
 if (type === 'success') return 'var(--success-color)';
 if (type === 'danger') return 'var(--danger-color)';
 if (type === 'warning') return 'var(--warning-color)';
 return 'var(--primary-color)';
};

// Helper format SROI snippet (Format ringkas)
function formatSroiSnippet(doc) {
 if (!doc) return '-';
 const calc = computeSroi16Rules(doc);
 if (calc.isValid) {
 const label = calc.sroiRatio >= 1.0 ? 'Layak' : (calc.sroiRatio >= 0.6 ? 'Cukup' : 'Kurang');
 return `${calc.sroiRatio.toFixed(2)} (${label})`;
 }
 return doc.sroi ? String(doc.sroi).replace(' : 1', '').trim() : '-';
}

const getToastIcon = (type) => {
 if (type === 'success') return 'check-circle-2';
 if (type === 'danger') return 'alert-octagon';
 if (type === 'warning') return 'alert-triangle';
 return 'info';
};

onMounted(async () => {
 // 1. Pastikan backend Render sudah "bangun" sebelum cek sesi login
 // 2. checkSession() (cek cookie httpOnly) dipanggil di dalam startWakeCheck
 // begitu backend siap
 await startWakeCheck();

 if ((currentUser.value?.role === 'admin' || currentUser.value?.role === 'moderator') && currentTab.value !== 'admin-dashboard') {
   currentTab.value = 'admin-dashboard';
 }
});

watch([currentTab, notificationsList, isLoggedIn], () => {
 nextTick(() => {
 if (window.lucide) window.lucide.createIcons();
 });
});
</script>

<style scoped>
.app-root {
 min-height: 100vh;
}

.wake-overlay {
 position: fixed;
 inset: 0;
 z-index: 9999;
 background: rgba(43, 38, 32, 0.45);
 display: flex;
 align-items: center;
 justify-content: center;
 padding: 24px;
}

.wake-box {
 max-width: 420px;
 text-align: center;
 color: #2B2620;
 background: #F8F3E9;
 border-radius: 20px;
 padding: 32px 28px;
 box-shadow: 0 20px 50px -10px rgba(43,38,32,0.28), 0 1px 0 rgba(255,255,255,0.6) inset;
}

.wake-box h3 {
 margin: 16px 0 8px;
 font-size: 18px;
 color: #2B2620;
}

.wake-box p {
 font-size: 14px;
 line-height: 1.5;
 color: #6B6151;
 margin: 0;
}

.wake-spinner {
 width: 40px;
 height: 40px;
 margin: 0 auto;
 border: 4px solid rgba(27, 77, 70, 0.15);
 border-top-color: #1B4D46;
 border-radius: 50%;
 animation: wake-spin 0.9s linear infinite;
}

@keyframes wake-spin {
 to { transform: rotate(360deg); }
}
</style>
