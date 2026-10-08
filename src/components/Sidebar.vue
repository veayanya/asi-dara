<template>
 <aside class="sidebar">
 <div class="sidebar-header">
 <div class="logo-container">
 <img
 :src="logoBapperida"
 alt="Logo BAPPERIDA"
 class="logo-image"
 />
 </div>
 <div class="logo-text">
 <span class="logo-title">ASI DARA</span>
 <span class="logo-subtitle">Bapperida Kab. Cirebon</span>
 </div>
 </div>

 <nav class="sidebar-nav">
 <!-- Admin / Moderator Dashboard -->
 <a
 v-if="props.currentUser?.role === 'admin' || props.currentUser?.role === 'moderator'"
 href="#"
 :class="['nav-item', props.currentUser?.role === 'admin' ? 'nav-item-admin' : 'nav-item-moderator', { active: currentTab === 'admin-dashboard' }]"
 @click.prevent="selectTab('admin-dashboard')"
 >
 <i :data-lucide="props.currentUser?.role === 'admin' ? 'shield' : 'activity'"></i>
 <span>{{ props.currentUser?.role === 'admin' ? 'Admin Dashboard' : 'Audit & Backup' }}</span>
 </a>

 <a href="#"
 :class="['nav-item', 'nav-item-upload', { active: currentTab === 'dashboard' }]"
 @click.prevent="selectTab('dashboard')">
 <i data-lucide="upload-cloud"></i>
 <span style="flex: 1;">Unggah Berkas RKA</span>
 <span v-if="!isMenuEnabled('dashboard')" class="menu-off-badge">Nonaktif</span>
 </a>
 <a href="#"
 :class="['nav-item', { active: currentTab === 'main-dashboard' }]"
 @click.prevent="selectTab('main-dashboard')">
 <i data-lucide="layout-dashboard"></i>
 <span style="flex: 1;">Dasbor Utama</span>
 <span v-if="!isMenuEnabled('main-dashboard')" class="menu-off-badge">Nonaktif</span>
 </a>
 <a href="#"
 :class="['nav-item', { active: currentTab === 'pra-rka' }]"
 @click.prevent="selectTab('pra-rka')">
 <i data-lucide="clipboard-list"></i>
 <span style="flex: 1;">Buat Pra RKA</span>
 <span v-if="!isMenuEnabled('pra-rka')" class="menu-off-badge">Nonaktif</span>
 </a>
 <a href="#"
 :class="['nav-item nav-item-analyzer', { active: currentTab === 'analyzer' }]"
 @click.prevent="selectTab('analyzer')">
 <i data-lucide="cpu"></i>
 <span style="flex: 1;">Hasil Analisis</span>
 <span v-if="!isMenuEnabled('analyzer')" class="menu-off-badge">Nonaktif</span>
 </a>
 <a href="#"
 :class="['nav-item nav-item-agent', { active: currentTab === 'agentic-ai' }]"
 @click.prevent="selectTab('agentic-ai')">
 <i data-lucide="bot"></i>
 <span style="flex: 1;">AI Agen Chatbot RKA</span>
 <span v-if="!isMenuEnabled('agentic-ai')" class="menu-off-badge">Nonaktif</span>
 <span v-else class="agent-badge-pulse">AI</span>
 </a>
 <a href="#"
 :class="['nav-item', { active: currentTab === 'history' }]"
 @click.prevent="selectTab('history')">
 <i data-lucide="folder-archive"></i>
 <span style="flex: 1;">Arsip Dokumen RKA</span>
 <span v-if="!isMenuEnabled('history')" class="menu-off-badge">Nonaktif</span>
 </a>

 <div class="nav-divider"></div>

 <a href="#"
 :class="['nav-item', { active: currentTab === 'petunjuk' }]"
 @click.prevent="selectTab('petunjuk')">
 <i data-lucide="book-open"></i>
 <span style="flex: 1;">Petunjuk Penggunaan</span>
 <span v-if="!isMenuEnabled('petunjuk')" class="menu-off-badge">Nonaktif</span>
 </a>
 <a href="#"
 :class="['nav-item', { active: currentTab === 'faq' }]"
 @click.prevent="selectTab('faq')">
 <i data-lucide="help-circle"></i>
 <span style="flex: 1;">Bantuan & Pertanyaan</span>
 <span v-if="!isMenuEnabled('faq')" class="menu-off-badge">Nonaktif</span>
 </a>
 </nav>

 <div class="sidebar-footer">
 <!-- Status AI -->
      <div
        class="api-status-pill"
        :title="apiStatus.geminiKeySet ? 'Gemini 2.5 Flash terhubung' : (props.currentUser?.role === 'admin' ? 'Atur di Admin Dashboard → Konfigurasi API' : 'AI belum dikonfigurasi')"
      >
        <span :class="['api-status-dot-mini', apiStatus.geminiKeySet ? 'dot-on' : 'dot-off']"></span>
        <span class="api-dot-label">{{ apiStatus.geminiKeySet ? 'AI siap' : 'AI belum aktif' }}</span>
      </div>

      <!-- User Profile & Logout -->
 <div class="user-profile">
 <div :class="['avatar', props.currentUser?.role === 'admin' ? 'avatar-admin-style' : (props.currentUser?.role === 'moderator' ? 'avatar-moderator-style' : '')]">
 {{ userInitials }}
 </div>
 <div class="user-info">
 <span class="user-name">{{ props.currentUser?.name || 'Pengguna' }}</span>
 <span class="user-role">
 <span :class="['role-tag', props.currentUser?.role === 'admin' ? 'role-tag-admin' : (props.currentUser?.role === 'moderator' ? 'role-tag-moderator' : 'role-tag-user')]">
 {{ props.currentUser?.role === 'admin' ? 'Admin' : (props.currentUser?.role === 'moderator' ? 'Moderator' : 'User') }}
 </span>
 </span>
 </div>
 <button class="logout-btn" @click="handleLogout" title="Logout">
 <i data-lucide="log-out"></i>
 </button>
 </div>
 </div>
 </aside>
</template>

<script setup>
import { onMounted, watch, ref, computed } from 'vue';
import { useAnalysis } from '../composables/useAnalysis';
import logoBapperida from '@/assets/logo-bapperida.png';
import { apiFetch } from '@/utils/api';

const props = defineProps({
 currentUser: { type: Object, default: null }
});

const emit = defineEmits(['logout']);

const { currentTab, isMenuEnabled } = useAnalysis();

function selectTab(tab) {
 currentTab.value = tab;
}

function shouldShowMenu(tabId) {
 if (props.currentUser?.role === 'admin' || props.currentUser?.role === 'moderator') return true;
 return isMenuEnabled(tabId);
}

// API status (hanya status, bukan key asli)
const apiStatus = ref({ geminiKeySet: false });

async function loadApiStatus() {
 try {
 const res = await apiFetch('/api/auth/api-status', { credentials: 'include' });
 if (res.ok) apiStatus.value = await res.json();
 } catch {}
}

const userInitials = computed(() => {
 const name = props.currentUser?.name || props.currentUser?.username || 'U';
 return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

function handleLogout() {
 emit('logout');
}

onMounted(() => {
 loadApiStatus();
 if (window.lucide) window.lucide.createIcons();
});

watch([currentTab], () => {
 if (window.lucide) {
 setTimeout(() => window.lucide.createIcons(), 50);
 }
});
</script>

<style scoped>
.logo-container {
 width: 52px;
 height: 52px;
 border-radius: 14px;
 background: #ffffff;
 display: flex;
 align-items: center;
 justify-content: center;
 overflow: hidden;
 flex-shrink: 0;
 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.logo-image {
 width: 42px;
 height: 42px;
 object-fit: contain;
}

/* Admin nav item */
.nav-item-admin {
 position: relative;
 background: rgba(14,107,94,0.08) !important;
 border: 1px solid rgba(14,107,94,0.2) !important;
 border-radius: 10px !important;
 margin-bottom: 4px;
}

.admin-nav-badge {
 background: #1B4D46;
 color: #ffffff;
 font-size: 9px;
 font-weight: 800;
 padding: 2px 7px;
 border-radius: 10px;
 letter-spacing: 0.05em;
}

/* Nav Item Agentic AI Specific */
.nav-item-agent {
 position: relative;
}

.agent-badge-pulse {
 background: var(--gradient-brand);
 color: #ffffff;
 font-size: 10px;
 font-weight: 800;
 padding: 2px 7px;
 border-radius: 10px;
 letter-spacing: 0.05em;
 box-shadow: 0 2px 6px var(--primary-glow);
 animation: pulseBadge 2.5s infinite;
}

@keyframes pulseBadge {
 0%, 100% { transform: scale(1); opacity: 1; }
 50% { transform: scale(1.06); opacity: 0.9; }
}

/* === API Status === */
.api-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  margin: 0 0 10px 4px;
  border-radius: 999px;
  background: var(--bg-tertiary);
}

.api-status-row {
 padding: 8px 12px;
 background: var(--bg-tertiary);
 border-radius: 8px;
 margin: 4px 12px 8px;
 display: flex;
 flex-direction: column;
 gap: 5px;
}

.api-dots-row {
 display: flex;
 align-items: center;
 gap: 5px;
}

.api-status-dot-mini {
 width: 8px;
 height: 8px;
 border-radius: 50%;
 flex-shrink: 0;
}

.dot-on { background: #10b981; }
.dot-off { background: #ef4444; }

.api-dot-label {
 font-size: 10px;
 color: var(--text-muted);
 font-weight: 600;
}

.api-not-config-msg {
 font-size: 9.5px;
 color: var(--text-muted);
 line-height: 1.4;
 margin: 0;
 display: flex;
 gap: 4px;
 align-items: flex-start;
}

/* === User Profile === */
.user-profile {
 display: flex;
 align-items: center;
 gap: 10px;
 padding: 10px 12px;
 border-top: 1px solid var(--border-color);
 margin-top: 4px;
}

.avatar {
 width: 34px;
 height: 34px;
 border-radius: 10px;
 background: var(--bg-tertiary);
 color: var(--text-secondary);
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 11px;
 font-weight: 800;
 flex-shrink: 0;
 border: 1px solid var(--border-color);
}

.avatar-admin-style {
 background: #1B4D46 !important;
 color: white !important;
 border: none !important;
}

.avatar-moderator-style {
 background: #8b5cf6 !important;
 color: white !important;
 border: none !important;
}

.nav-item-moderator {
 color: #8b5cf6 !important;
 font-weight: 700;
}

.nav-item-moderator:hover {
 background: rgba(139,92,246,0.08) !important;
}

.nav-item-moderator.active {
 background: rgba(139,92,246,0.14) !important;
 border-left: 3px solid #8b5cf6;
}

.badge-mod {
 background: #3b82f6 !important;
}

.menu-off-badge {
 background: rgba(239, 68, 68, 0.12);
 color: #ef4444;
 font-size: 9px;
 font-weight: 800;
 padding: 2px 7px;
 border-radius: 10px;
 letter-spacing: 0.02em;
 flex-shrink: 0;
}

.user-info {
 flex: 1;
 min-width: 0;
}

.user-name {
 display: block;
 font-size: 12px;
 font-weight: 700;
 color: var(--text-primary);
 white-space: nowrap;
 overflow: hidden;
 text-overflow: ellipsis;
}

.user-role {
 display: block;
 font-size: 10px;
 color: var(--text-muted);
 margin-top: 2px;
}

.role-tag {
 display: inline-block;
 padding: 1px 6px;
 border-radius: 6px;
 font-size: 9.5px;
 font-weight: 700;
}

.role-tag-admin { background: rgba(14,107,94,0.12); color: #1B4D46; }
.role-tag-moderator { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.role-tag-user { background: var(--bg-tertiary); color: var(--text-muted); }

.logout-btn {
 width: 30px;
 height: 30px;
 border-radius: 8px;
 border: 1px solid var(--border-color);
 background: var(--bg-secondary);
 cursor: pointer;
 display: flex;
 align-items: center;
 justify-content: center;
 color: var(--text-muted);
 flex-shrink: 0;
 transition: all 0.15s;
}

.logout-btn i { width: 14px; height: 14px; }

.logout-btn:hover {
 background: rgba(239,68,68,0.1);
 border-color: #ef4444;
 color: #ef4444;
}
</style>
