<template>
  <div class="document-pane menu-inactive-pane">
    <div class="pane-body menu-inactive-body">
      <i data-lucide="lock" class="menu-inactive-icon"></i>
      <h3 class="menu-inactive-title">Menu Belum Aktif</h3>
      <p class="menu-inactive-text">
        Menu ini sedang dinonaktifkan sementara oleh admin. Silakan hubungi admin jika Anda membutuhkan akses ke halaman ini.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue';

onMounted(() => {
  nextTick(() => {
    if (window.lucide) window.lucide.createIcons();
  });
});
</script>

<style scoped>
.menu-inactive-pane {
  max-width: 640px;
  margin: 20px auto;
}

.menu-inactive-body {
  padding: 56px 24px;
  text-align: center;
}

.menu-inactive-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.menu-inactive-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.menu-inactive-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 420px;
  margin: 0 auto;
  line-height: 1.5;
}
</style>
