<template>
 <header class="top-header">
 <div class="header-title-container">
 <button class="sidebar-toggle-btn" id="sidebar-toggle" aria-label="Toggle Sidebar" @click="toggleSidebar">
 <i data-lucide="menu"></i>
 </button>
 <nav class="crumbs" id="current-breadcrumb" aria-label="Breadcrumb">
          <svg class="crumbs-home" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/></svg>
          <span class="crumbs-item">Beranda</span>
          <template v-if="sectionLabel">
            <svg class="crumbs-sep" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            <span class="crumbs-item crumbs-current" aria-current="page">{{ sectionLabel }}</span>
          </template>
        </nav>
        <h1 class="header-title sr-only" id="current-page-title">{{ pageTitle }}</h1>
 </div>

 <div class="header-actions">
 <!-- Current Date -->
 <span class="header-date">{{ today }}</span>

 <!-- Realtime Connection Indicator -->
 <span
 class="realtime-dot"
 :class="isRealtimeConnected ? 'realtime-dot-connected' : 'realtime-dot-disconnected'"
 :title="isRealtimeConnected ? 'Realtime terkoneksi' : 'Realtime terputus'"
 role="status"
 aria-live="polite"
 ></span>

 <!-- Theme Toggle -->
 <button class="icon-button" id="theme-toggle" title="Ubah Tema" aria-label="Ubah Tema" @click="toggleTheme">
 <i :data-lucide="theme === 'light' ? 'sun' : 'moon'"></i>
 </button>

 <!-- Laporan -->
 <button
 :class="['icon-button', { 'icon-button-active': currentTab === 'report' }]"
 id="laporan-btn"
 title="Laporan"
 aria-label="Laporan"
 @click="currentTab = 'report'"
 >
 <i data-lucide="flag"></i>
 </button>

 <!-- Notifications -->
 <div class="header-notifications" @click="showNotifMenu = !showNotifMenu" style="position:relative;cursor:pointer;">
 <button class="icon-button" id="notifications-btn" title="Notifikasi" aria-label="Notifikasi">
 <i data-lucide="bell"></i>
 <span v-if="notificationHistory && notificationHistory.length > 0" class="notification-badge" id="notif-badge-count">
 {{ notificationHistory.length }}
 </span>
 </button>

 <!-- Notif Dropdown -->
 <div v-if="showNotifMenu" class="profile-dropdown notif-dropdown" @click.stop style="right: 0; min-width: 250px; max-height: 400px; overflow-y: auto;">
 <div class="profile-dropdown-info" style="border-bottom: 1px solid var(--border-color); padding: 10px 16px; display: flex; align-items: center; justify-content: space-between;">
 <div class="pd-name">Histori Notifikasi</div>
 <button
 v-if="notificationHistory && notificationHistory.length > 0"
 type="button"
 class="notif-clear-all-btn"
 title="Hapus semua notifikasi"
 aria-label="Hapus semua notifikasi"
 @click.stop="clearNotifHistory()"
 >
 Hapus semua
 </button>
 </div>
 <div v-if="!notificationHistory || notificationHistory.length === 0" style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
 Tidak ada notifikasi.
 </div>
 <div v-else style="display: flex; flex-direction: column;">
 <div v-for="notif in notificationHistory" :key="notif.id" class="notif-history-item" style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px; position: relative;">
 <button
 type="button"
 class="notif-delete-btn"
 title="Hapus notifikasi ini"
 aria-label="Hapus notifikasi ini"
 @click.stop="deleteNotifHistory(notif.id)"
 >
 <i data-lucide="x"></i>
 </button>
 <div style="font-weight: bold; font-size: 0.85rem; padding-right: 20px;" :style="{ color: notif.type === 'danger' ? 'var(--danger-text)' : (notif.type === 'success' ? 'var(--success-text)' : 'var(--text-primary)') }">{{ notif.title }}</div>
 <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">{{ notif.message }}</div>
 <div style="font-size: 0.65rem; color: var(--text-muted); text-align: right; margin-top: 4px;">
 {{ new Date(notif.time).toLocaleString('id-ID') }}
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- Profile dengan role badge -->
 <div class="header-profile" @click="showProfileMenu = !showProfileMenu" style="position:relative;cursor:pointer;">
 <div :class="['header-profile-avatar', props.currentUser?.role === 'admin' ? 'avatar-admin' : '']">
 {{ userInitials }}
 </div>
 <div class="header-user-info">
 <span class="header-user-name">{{ props.currentUser?.name || 'Pengguna' }}</span>
 <span :class="['header-role-badge', props.currentUser?.role === 'admin' ? 'badge-admin' : 'badge-user']">
 {{ props.currentUser?.role === 'admin' ? 'Admin' : 'User' }}
 </span>
 </div>

 <!-- Dropdown -->
 <div v-if="showProfileMenu" class="profile-dropdown" @click.stop>
 <div class="profile-dropdown-info">
 <div class="pd-name">{{ props.currentUser?.name }}</div>
 <div class="pd-username">@{{ props.currentUser?.username }}</div>
 </div>
 <div class="profile-dropdown-divider"></div>
 <button class="pd-logout-btn" @click="handleLogout">
 <i data-lucide="log-out"></i>
 Logout
 </button>
 </div>
 </div>
 </div>
 </header>
</template>

<script setup>
import { computed, onMounted, watch, ref, nextTick } from 'vue';
import { useAnalysis, notificationHistory } from '../composables/useAnalysis';
import { useRealtime } from '../composables/useRealtime';

const props = defineProps({
 currentUser: { type: Object, default: null }
});

const emit = defineEmits(['logout']);

const { currentTab, theme, notificationsList, deleteNotifHistory, clearNotifHistory } = useAnalysis();
const { isConnected: isRealtimeConnected } = useRealtime();

const showProfileMenu = ref(false);
const showNotifMenu = ref(false);

watch(showNotifMenu, (open) => {
 if (open) {
 nextTick(() => {
 if (window.lucide) window.lucide.createIcons();
 });
 }
});

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const pageMeta = {
 'main-dashboard': { title: 'Dasbor Utama', section: 'Dasbor Utama' },
 'admin-dashboard': { title: 'Admin Dashboard', section: 'Admin Dashboard' },
 dashboard: { title: 'Unggah Berkas RKA', section: 'Unggah Berkas RKA' },
 analyzer: { title: 'Hasil Analisis', section: 'Hasil Analisis' },
 'agentic-ai': { title: 'AI Agen Chatbot RKA', section: 'AI Agen Chatbot RKA' },
 ssh: { title: 'Pengaturan SSH', section: 'Pengaturan SSH' },
 history: { title: 'Arsip Dokumen RKA', section: 'Arsip Dokumen RKA' },
 config: { title: 'Pengaturan', section: 'Pengaturan' },
 report: { title: 'Laporan', section: 'Laporan' },
 'pra-rka': { title: 'Buat Pra RKA', section: 'Buat Pra RKA' },
 petunjuk: { title: 'Petunjuk Penggunaan', section: 'Petunjuk Penggunaan' },
 faq: { title: 'Bantuan & Pertanyaan', section: 'Bantuan & Pertanyaan' },
};

const pageTitle = computed(() => pageMeta[currentTab.value]?.title || 'Beranda');
const sectionLabel = computed(() => pageMeta[currentTab.value]?.section || '');

const userInitials = computed(() => {
 const name = props.currentUser?.name || props.currentUser?.username || 'U';
 return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

const toggleTheme = () => {
 theme.value = theme.value === 'light' ? 'dark' : 'light';
 if (window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
};

const toggleSidebar = () => {
 const sidebar = document.querySelector('.sidebar');
 if (sidebar) sidebar.classList.toggle('open');
};

function handleLogout() {
 showProfileMenu.value = false;
 emit('logout');
}

// Tutup dropdown jika klik di luar
function onClickOutside(e) {
 if (!e.target.closest('.header-profile')) {
 showProfileMenu.value = false;
 }
 if (!e.target.closest('.header-notifications')) {
 showNotifMenu.value = false;
 }
}

onMounted(() => {
 if (window.lucide) window.lucide.createIcons();
 document.addEventListener('click', onClickOutside);
});

watch(theme, () => {
 if (window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
});
</script>

<style scoped>
/* === Realtime Connection Indicator === */
.realtime-dot {
 display: inline-block;
 position: relative;
 width: 10px;
 height: 10px;
 border-radius: 50%;
 flex-shrink: 0;
 transition: background-color 0.2s ease;
}

.realtime-dot::after {
 content: '';
 position: absolute;
 inset: 0;
 border-radius: 50%;
 background-color: inherit;
 animation: realtime-dot-pulse 1.8s ease-out infinite;
}

.realtime-dot-connected {
 background-color: #2563eb; /* biru = terkoneksi */
 box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.realtime-dot-disconnected {
 background-color: #f97316; /* oranye = terputus */
 box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.18);
}

@keyframes realtime-dot-pulse {
 0% { transform: scale(1); opacity: 0.7; }
 100% { transform: scale(2.6); opacity: 0; }
}

/* === Profile Avatar === */
.header-profile {
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 5px 8px;
 border-radius: 10px;
 cursor: pointer;
 transition: background 0.15s;
}

.header-profile:hover {
 background: var(--bg-tertiary);
}

.header-profile-avatar {
 width: 32px;
 height: 32px;
 border-radius: 9px;
 background: var(--bg-tertiary);
 color: var(--text-secondary);
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 10px;
 font-weight: 800;
 flex-shrink: 0;
 border: 1px solid var(--border-color);
}

.avatar-admin {
 background: #1B4D46 !important;
 color: white !important;
 border: none !important;
}

.header-user-info {
 display: flex;
 flex-direction: column;
 align-items: flex-start;
 gap: 1px;
}

.header-user-name {
 font-size: 0.82rem;
 font-weight: 700;
 color: var(--text-primary);
 white-space: nowrap;
 max-width: 120px;
 overflow: hidden;
 text-overflow: ellipsis;
}

.header-role-badge {
 font-size: 0.68rem;
 font-weight: 700;
 padding: 1px 7px;
 border-radius: 8px;
}

.badge-admin { background: rgba(14,107,94,0.12); color: #1B4D46; }
.badge-user { background: var(--bg-tertiary); color: var(--text-muted); }

/* === Profile Dropdown === */
.profile-dropdown {
 position: absolute;
 top: calc(100% + 8px);
 right: 0;
 min-width: 180px;
 background: var(--bg-primary, #fff);
 border: 1px solid var(--border-color);
 border-radius: 12px;
 box-shadow: 0 8px 24px rgba(0,0,0,0.3);
 z-index: 1000;
 overflow: hidden;
 animation: dropdownFade 0.15s ease;
 backdrop-filter: none;
}

@keyframes dropdownFade {
 from { opacity: 0; transform: translateY(-6px); }
 to { opacity: 1; transform: translateY(0); }
}

.profile-dropdown-info {
 padding: 14px 16px;
}

.pd-name {
 font-size: 0.88rem;
 font-weight: 700;
 color: var(--text-primary);
}

.pd-username {
 font-size: 0.75rem;
 color: var(--text-muted);
 margin-top: 2px;
}

.profile-dropdown-divider {
 height: 1px;
 background: var(--border-color);
}

.pd-logout-btn {
 width: 100%;
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 12px 16px;
 border: none;
 background: none;
 cursor: pointer;
 font-size: 0.84rem;
 font-weight: 600;
 color: #ef4444;
 transition: background 0.15s;
 text-align: left;
}

.pd-logout-btn i { width: 15px; height: 15px; }

.pd-logout-btn:hover {
 background: rgba(239,68,68,0.08);
}

/* === Notifikasi: hapus item & hapus semua === */
.notif-clear-all-btn {
 border: none;
 background: none;
 color: var(--text-muted);
 font-size: 0.7rem;
 font-weight: 700;
 cursor: pointer;
 padding: 2px 6px;
 border-radius: 6px;
 transition: background 0.15s, color 0.15s;
 white-space: nowrap;
}

.notif-clear-all-btn:hover {
 background: rgba(239,68,68,0.08);
 color: #ef4444;
}

.notif-history-item:hover {
 background: var(--bg-tertiary);
}

.notif-delete-btn {
 position: absolute;
 top: 10px;
 right: 12px;
 border: none;
 background: none;
 color: var(--text-muted);
 cursor: pointer;
 width: 18px;
 height: 18px;
 display: flex;
 align-items: center;
 justify-content: center;
 border-radius: 50%;
 padding: 0;
 transition: background 0.15s, color 0.15s;
}

.notif-delete-btn i {
 width: 12px;
 height: 12px;
}

.notif-delete-btn:hover {
 background: rgba(239,68,68,0.12);
 color: #ef4444;
}
</style>
