<template>
  <PageHero icon="bot" title="Simulasi Percakapan Agen AI" subtitle="Tanya jawab seputar RKA" style="margin-bottom: 1.25rem;">
      <button
        id="btn-diagnosis-open"
        @click="$emit('open-diagnosis')"
        class="cbb-btn-secondary"
        style="padding: 0.45rem 0.85rem; font-size: 0.775rem; border-color: color-mix(in srgb, var(--danger-color) 40%, transparent);"
      >
        <span>🩺</span> Diagnosis
      </button>

      <button
        id="btn-calculator-open"
        @click="$emit('open-calculator')"
        class="cbb-btn-secondary"
        style="padding: 0.45rem 0.85rem; font-size: 0.775rem;"
      >
        <span>🧮</span> Kalkulator
      </button>

      <button
        id="btn-docs-open"
        @click="$emit('open-docs')"
        class="cbb-btn-secondary"
        style="padding: 0.45rem 0.85rem; font-size: 0.775rem;"
      >
        <span>📚</span> Regulasi
      </button>
    </PageHero>
</template>

<script setup>
import PageHero from '@/components/PageHero.vue';
defineEmits(['open-diagnosis', 'open-calculator', 'open-docs']);
</script>
