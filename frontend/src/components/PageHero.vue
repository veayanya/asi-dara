<template>
  <header class="page-hero">
    <div class="page-hero-icon" aria-hidden="true">
      <i :data-lucide="icon"></i>
    </div>
    <div class="page-hero-text">
      <h2 class="page-hero-title">{{ title }}</h2>
      <p v-if="subtitle" class="page-hero-sub">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="page-hero-actions">
      <slot />
    </div>
  </header>
</template>

<script setup>
import { onMounted, nextTick, watch } from 'vue';

const props = defineProps({
  icon: { type: String, default: 'layout-dashboard' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
});

function renderIcons() {
  if (window.lucide) nextTick(() => window.lucide.createIcons());
}
onMounted(renderIcons);
watch(() => props.icon, renderIcons);
</script>

<style scoped>
.page-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg, 14px);
  box-shadow: var(--shadow-raised, none);
}

.page-hero-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--gradient-brand-soft, var(--bg-tertiary));
  color: var(--primary-color);
}

.page-hero-icon i,
.page-hero-icon svg {
  width: 22px;
  height: 22px;
}

.page-hero-text {
  flex: 1;
  min-width: 0;
}

.page-hero-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.page-hero-sub {
  margin: 2px 0 0;
  font-size: 0.83rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .page-hero { flex-wrap: wrap; padding: 14px; gap: 12px; }
  .page-hero-actions { width: 100%; justify-content: flex-start; }
}
</style>
