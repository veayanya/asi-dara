<template>
 <div class="dashboard-container">
 <PageHero icon="upload-cloud" title="Unggah Berkas RKA" subtitle="PDF dianalisis otomatis" />
    <div style="width: 100%; margin: 12px 0 0;">
 <UploadSection />
 </div>
 </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue';
import PageHero from './PageHero.vue';
import UploadSection from './UploadSection.vue';

onMounted(() => {
 if (window.lucide) {
 nextTick(() => window.lucide.createIcons());
 }
});
</script>

