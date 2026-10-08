<template>
  <main class="login-root">

    <!-- Panel Form Login -->
    <div class="login-right">
      <div class="login-form-box">

        <img src="@/assets/logo-bapperida.png" alt="Logo Bapperida" class="logo-bapperida" />
        <h1 class="form-title">Login</h1>
        <p class="form-sub">Selamat datang kembali di Sistem Analisis Valuasi Prakiraan Dampak Program</p>

        <form @submit.prevent="handleLogin" novalidate>
          <!-- Username -->
          <label class="field-label" for="login-username">Username</label>
          <div class="field" :class="{ 'has-error': errors.username }">
            <i data-lucide="user" class="field-ico" aria-hidden="true"></i>
            <input
              id="login-username"
              ref="usernameEl"
              v-model="form.username"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              :aria-invalid="errors.username ? 'true' : 'false'"
              :aria-describedby="errors.username ? 'login-username-err' : undefined"
              :disabled="loading"
              @input="errors.username = ''"
            />
          </div>
          <p v-if="errors.username" id="login-username-err" class="field-err" role="alert">{{ errors.username }}</p>

          <!-- Password -->
          <label class="field-label" for="login-password">Password</label>
          <div class="field" :class="{ 'has-error': errors.password }">
            <i data-lucide="lock" class="field-ico" aria-hidden="true"></i>
            <input
              id="login-password"
              ref="passwordEl"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="has-toggle"
              autocomplete="current-password"
              :aria-invalid="errors.password ? 'true' : 'false'"
              :aria-describedby="errors.password ? 'login-password-err' : undefined"
              :disabled="loading"
              @input="errors.password = ''"
            />
            <button
              type="button"
              class="field-ico-right"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              :aria-pressed="showPassword ? 'true' : 'false'"
            >
              <!-- SVG inline: ikon ini berganti saat runtime, jadi tidak memakai lucide.createIcons() -->
              <svg v-if="showPassword" class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              <svg v-else class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <p v-if="errors.password" id="login-password-err" class="field-err" role="alert">{{ errors.password }}</p>

          <!-- Error login -->
          <div v-if="loginError" class="login-error-alert" role="alert">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <span>{{ loginError }}</span>
          </div>

          <!-- Submit -->
          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="loading" class="btn-spin">
              <svg class="ico spin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Memverifikasi…
            </span>
            <span v-else class="btn-spin">
              Login
              <svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </button>
        </form>

        <p class="login-credit">ⓒ Copyright 2026 Bapperida Kab. Cirebon. All rights reserved</p>
      </div>
    </div>

  </main>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { apiFetch } from '@/utils/api';

const emit = defineEmits(['login-success']);

const form = ref({ username: '', password: '' });
const errors = ref({ username: '', password: '' });
const showPassword = ref(false);
const usernameEl = ref(null);
const passwordEl = ref(null);
const loading = ref(false);
const loginError = ref('');

function validate() {
  let ok = true;
  errors.value.username = '';
  errors.value.password = '';
  if (!form.value.username.trim()) {
    errors.value.username = 'Isi username.';
    ok = false;
  }
  if (!form.value.password) {
    errors.value.password = 'Isi password.';
    ok = false;
  }
  return ok;
}

async function handleLogin() {
  if (!validate()) {
    // Pindahkan fokus ke field pertama yang gagal
    nextTick(() => (errors.value.username ? usernameEl.value : passwordEl.value)?.focus());
    return;
  }
  loading.value = true;
  loginError.value = '';
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: form.value.username.trim(),
        password: form.value.password
      })
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.value = data.error || 'Login gagal. Periksa username dan password.';
      return;
    }
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    emit('login-success', data.user);
  } catch (err) {
    loginError.value = err.name === 'AbortError'
      ? 'Server tidak merespons. Tunggu beberapa saat lalu coba lagi.'
      : 'Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  nextTick(() => {
    if (window.lucide) window.lucide.createIcons();
  });
});
</script>

<style scoped>
/* === ROOT === */
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 6vh 5vw;
  box-sizing: border-box;
  font-family: 'Outfit', 'Inter', sans-serif;
  background: #ffffff;
}

/* === FORM PANEL (dipusatkan, tanpa gambar) ===
   Tinggi memakai min-height supaya kartu ikut tumbuh saat ada label, pesan error,
   teks diperbesar atau zoom 200% (sebelumnya height tetap + ::before kembar). */
.login-right {
  width: min(460px, 90vw);
  min-height: min(78vh, 560px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #f5f2ec;
  box-shadow: 0 24px 60px rgba(30, 47, 94, 0.16);
  padding: 40px 24px;
}

.login-form-box {
  width: 100%;
  max-width: 300px;
}

/* Logo Bapperida */
.logo-bapperida {
  display: block;
  height: 52px;
  width: auto;
  margin-bottom: 14px;
  object-fit: contain;
}

/* Form title */
.form-title {
  font-size: 2rem;
  font-weight: 400;
  color: #1e2640;
  margin: 0 0 6px;
  letter-spacing: -0.4px;
  text-wrap: balance;
}

.form-sub {
  font-size: 0.82rem;
  color: #666c85; /* 4.64:1 di atas #f5f2ec (sebelumnya #7a8099 = 3.50:1) */
  margin: 0 0 24px;
  text-wrap: pretty;
}

/* Label */
.field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #1e2640;
  margin: 0 0 6px 2px;
}

/* Input field */
.field {
  position: relative;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  background: #ffffff;
  border: 1.5px solid #99876b; /* >= 3:1 di atas #fff (3.48) dan #f5f2ec (3.12); sebelumnya #e2ddd5 = 1.35:1 */
  border-radius: 12px;
  font-size: 0.88rem;
  color: #1e2640;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.field input.has-toggle {
  padding-right: 48px;
}

.field input::placeholder {
  color: #7c7467; /* 4.61:1 di atas #fff (sebelumnya #b0aaa0 = 2.31:1) */
}

.field input:focus {
  border-color: #1e2f5e;
}

.field input:focus-visible {
  outline: 2px solid #1e2f5e;
  outline-offset: 2px;
}

.field input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.field.has-error input {
  border-color: #c0394b;
}

/* Field icons */
.field-ico {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #999184; /* 3.12:1 di atas #fff (sebelumnya #b0aaa0 = 2.31:1) */
  pointer-events: none;
}

/* Tombol tampilkan/sembunyikan password: area klik 36x36 (sebelumnya 16x16) */
.field-ico-right {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #746c60; /* >= 4.6:1 di atas #fff */
  transition: color 0.15s;
}

.field-ico-right:hover { color: #1e2640; }

.field-ico-right:focus-visible {
  outline: 2px solid #1e2f5e;
  outline-offset: 0;
}

.ico {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Field error */
.field-err {
  font-size: 0.8rem;
  color: #c0394b;
  margin: 0 0 10px 4px;
}

/* Login error alert */
.login-error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(192, 57, 75, 0.08);
  border: 1px solid rgba(192, 57, 75, 0.22);
  border-radius: 10px;
  color: #a02a3a;
  font-size: 0.85rem;
  margin: 12px 0;
}

/* Gerak hanya jika pengguna tidak meminta pengurangan gerak.
   Pesan error dan label "Memverifikasi…" tetap membawa maknanya tanpa animasi. */
@media (prefers-reduced-motion: no-preference) {
  .login-error-alert { animation: shake 0.4s ease; }
  .spin-icon { animation: spin 1s linear infinite; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Login button */
.login-btn {
  width: 100%;
  padding: 14px;
  background: #1e2f5e;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: background-color 0.2s, transform 0.15s, box-shadow 0.2s;
  letter-spacing: 0.03em;
}

.login-btn:hover:not(:disabled) {
  background: #162348;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(30, 47, 94, 0.28);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.login-btn:focus-visible {
  outline: 2px solid #1e2f5e;
  outline-offset: 3px;
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-spin {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Credit */
.login-credit {
  font-size: 0.75rem;
  color: #746c60; /* 4.63:1 di atas #f5f2ec (sebelumnya #b0aaa0 = 2.06:1) */
  text-align: center;
  margin: 24px 0 0;
}

/* iOS Safari memperbesar halaman bila teks input < 16px */
@media (hover: none) and (pointer: coarse) {
  .field input { font-size: 16px; }
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .login-root {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: 0;
  }
  .login-right {
    width: 100%;
    min-height: 100vh;
    border-radius: 0;
    box-shadow: none;
    padding: 32px 24px;
  }
  .form-title { font-size: 1.6rem; }
}
</style>
