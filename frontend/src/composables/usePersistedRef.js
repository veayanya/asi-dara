// usePersistedRef — ref biasa yang nilainya diingat di localStorage selama 24 jam.
//
// Dipakai untuk state tampilan (tab aktif, kotak pencarian, filter) supaya tidak
// kembali ke pengaturan awal setiap halaman dimuat ulang. Masa simpan digeser
// (sliding): tiap kali nilai berubah atau dipulihkan, hitung mundur 24 jam mulai lagi.
// Setelah 24 jam tanpa dipakai, nilai dibuang dan kembali ke default.
//
// Ini hanya untuk preferensi tampilan di browser ini — bukan data aplikasi.
// Data (user, arsip, konfigurasi) tetap disimpan di server.
import { ref, watch } from 'vue';

export const UI_STATE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const PREFIX = 'sintra:ui:';

function save(storageKey, value, ttlMs) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ v: value, exp: Date.now() + ttlMs }));
  } catch { /* storage penuh / diblokir: abaikan, state tetap jalan di memori */ }
}

/**
 * @param {string} key      Nama unik. Sertakan username agar tiap akun punya state sendiri.
 * @param {*} initial       Nilai default (dipakai jika belum ada, kedaluwarsa, atau tidak valid).
 * @param {object} [opts]
 * @param {number} [opts.ttlMs]      Masa simpan, default 24 jam.
 * @param {(v:any)=>boolean} [opts.validate]  Tolak nilai lama yang sudah tidak berlaku.
 */
export function usePersistedRef(key, initial, { ttlMs = UI_STATE_TTL_MS, validate = () => true } = {}) {
  const storageKey = PREFIX + key;
  let start = initial;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved.exp === 'number' && saved.exp > Date.now() && validate(saved.v)) {
        start = saved.v;
        save(storageKey, start, ttlMs); // dipakai lagi → perpanjang 24 jam
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  } catch {
    try { localStorage.removeItem(storageKey); } catch { /* abaikan */ }
  }

  const state = ref(start);
  watch(state, (val) => save(storageKey, val, ttlMs), { deep: true });
  return state;
}
