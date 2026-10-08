// composables/useRealtime.js
// Client SSE Real-time Synchronization untuk Sintra / Bapperida AI

import { ref, computed } from 'vue';

// Status dari koneksi SSE (event realtime push) — sumber utama.
const sseConnected = ref(false);
// Status dari ping ringan ke /api/health — cadangan, supaya dot tetap
// mencerminkan konektivitas ke server meski koneksi SSE spesifik gagal
// (mis. backend belum sempat "bangun" dari sleep, atau proxy memblokir SSE).
// Mirip pola indikator online/offline pada aplikasi seperti myBCA.
const pingHealthy = ref(false);
// Dot dianggap "terkoneksi" (biru) selama salah satu sinyal di atas hidup.
const isConnected = computed(() => sseConnected.value || pingHealthy.value);
const lastHeartbeat = ref(null);
const eventListeners = new Map();

let eventSource = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let manualDisconnect = false;
let pingTimer = null;
let pingInFlight = false;
let hiddenTimer = null;

const MIN_RECONNECT_MS = 1500;
const MAX_RECONNECT_MS = 30000;
const PING_INTERVAL_MS = 20000;
// Tab yang tersembunyi selama ini dianggap ditinggalkan: koneksi SSE ditutup supaya
// server tidak terus melayani (dan mem-polling database untuk) tab yang tidak dilihat.
// Saat tab dibuka lagi, koneksi & data disegarkan otomatis.
const HIDDEN_DISCONNECT_MS = 5 * 60 * 1000;

function getApiBaseUrl() {
 return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

function clearReconnectTimer() {
 if (reconnectTimer) {
 clearTimeout(reconnectTimer);
 reconnectTimer = null;
 }
}

async function pingOnce() {
 if (pingInFlight || !localStorage.getItem('auth_token')) return;
// Ping hanyalah cadangan: selama SSE hidup atau tab tidak terlihat, tidak perlu memanggil server.
if (sseConnected.value || document.visibilityState === 'hidden') return;
 pingInFlight = true;
 try {
 const baseUrl = getApiBaseUrl();
 const controller = new AbortController();
 const timeoutId = setTimeout(() => controller.abort(), 8000);
 const res = await fetch(`${baseUrl}/api/health`, { signal: controller.signal });
 clearTimeout(timeoutId);
 pingHealthy.value = res.ok;
 if (res.ok) lastHeartbeat.value = new Date().toISOString();
 } catch {
 pingHealthy.value = false;
 } finally {
 pingInFlight = false;
 }
}

function startPingLoop() {
 if (pingTimer) return;
 pingOnce();
 pingTimer = setInterval(pingOnce, PING_INTERVAL_MS);
}

function stopPingLoop() {
 if (pingTimer) {
 clearInterval(pingTimer);
 pingTimer = null;
 }
 pingHealthy.value = false;
}

function scheduleReconnect() {
 if (manualDisconnect || reconnectTimer || !localStorage.getItem('auth_token')) return;

 const delay = Math.min(
 MAX_RECONNECT_MS,
 MIN_RECONNECT_MS * Math.pow(2, Math.min(reconnectAttempt, 5))
 );
 reconnectAttempt += 1;

 reconnectTimer = setTimeout(() => {
 reconnectTimer = null;
 connect();
 }, delay);
}

function closeCurrentSource() {
 if (eventSource) {
 eventSource.onopen = null;
 eventSource.onmessage = null;
 eventSource.onerror = null;
 eventSource.close();
 eventSource = null;
 }
}

function connect() {
 if (manualDisconnect || !localStorage.getItem('auth_token')) return;
 startPingLoop();
 if (eventSource) return;

 const token = localStorage.getItem('auth_token');
 const baseUrl = getApiBaseUrl();
 const sseUrl = `${baseUrl}/api/v1/realtime/stream?token=${encodeURIComponent(token)}`;

 try {
 const source = new EventSource(sseUrl, { withCredentials: true });
 eventSource = source;

 source.onopen = () => {
 // Abaikan event dari EventSource lama yang sudah ditutup.
 if (eventSource !== source) return;
 const wasReconnect = reconnectAttempt > 0;
 reconnectAttempt = 0;
 sseConnected.value = true;
 lastHeartbeat.value = new Date().toISOString();
 clearReconnectTimer();

 if (wasReconnect) {
 triggerListeners('REALTIME_RECONNECTED', null, {
 type: 'REALTIME_RECONNECTED',
 timestamp: new Date().toISOString()
 });
 }
 };

 source.onmessage = (event) => {
 if (eventSource !== source) return;
 lastHeartbeat.value = new Date().toISOString();

 try {
 const data = JSON.parse(event.data);
 if (data && data.type) {
 if (data.type === 'CONNECTED') {
 triggerListeners('REALTIME_CONNECTED', data.payload ?? data, data);
 return;
 }
 triggerListeners(data.type, data.payload, data);
 }
 } catch (err) {
 console.warn('[Realtime] Payload SSE tidak valid:', err.message);
 }
 };

 source.onerror = () => {
 if (eventSource !== source) return;
 sseConnected.value = false;
closeCurrentSource();
scheduleReconnect();
pingOnce(); // SSE putus → cek cepat apakah server masih hidup (ping normal dilewati saat SSE aktif)
};
} catch (err) {
 console.warn('[Realtime] Gagal inisialisasi SSE:', err.message);
 sseConnected.value = false;
 scheduleReconnect();
 }
}

function disconnect() {
 manualDisconnect = true;
 clearReconnectTimer();
 reconnectAttempt = 0;
 closeCurrentSource();
 sseConnected.value = false;
 stopPingLoop();
}

function reconnect() {
 manualDisconnect = false;
 clearReconnectTimer();
 closeCurrentSource();
 sseConnected.value = false;
 reconnectAttempt = 0;
 connect();
}

function on(eventType, callback) {
 if (!eventListeners.has(eventType)) {
 eventListeners.set(eventType, new Set());
 }
 eventListeners.get(eventType).add(callback);
 return () => off(eventType, callback);
}

function off(eventType, callback) {
 const listeners = eventListeners.get(eventType);
 if (!listeners) return;
 listeners.delete(callback);
 if (listeners.size === 0) eventListeners.delete(eventType);
}

function triggerListeners(type, payload, raw) {
 const listeners = eventListeners.get(type);
 if (listeners) {
 for (const cb of [...listeners]) {
 try { cb(payload, raw); } catch (e) {
 console.error(`[Realtime Callback Error ${type}]:`, e);
 }
 }
 }

 const universal = eventListeners.get('*');
 if (universal) {
 for (const cb of [...universal]) {
 try { cb({ type, payload, raw }); } catch (e) {
 console.error('[Realtime Callback Error *]:', e);
 }
 }
 }
}

// Browser/network lifecycle: jangan biarkan tab yang kembali online menunggu
// exponential backoff terlalu lama.
if (typeof window !== 'undefined') {
 window.addEventListener('online', () => {
 if (localStorage.getItem('auth_token')) reconnect();
 });

 document.addEventListener('visibilitychange', () => {
if (document.visibilityState === 'hidden') {
clearTimeout(hiddenTimer);
hiddenTimer = setTimeout(() => {
if (document.visibilityState === 'hidden' && eventSource) disconnect();
}, HIDDEN_DISCONNECT_MS);
return;
}
clearTimeout(hiddenTimer);
hiddenTimer = null;
if (localStorage.getItem('auth_token') && !eventSource) {
manualDisconnect = false;
connect();
}
});
}

export function useRealtime() {
 return {
 isConnected,
 lastHeartbeat,
 connect: () => {
 manualDisconnect = false;
 connect();
 },
 reconnect,
 disconnect,
 on,
 off
 };
}
