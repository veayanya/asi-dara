<template>
 <div class="card" id="rka-upload-widget">
 <div class="card-body">
 <!-- Dropzone -->
 <div
 :class="['upload-container', { dragover: isDragOver }]"
 id="upload-dropzone"
 @click="triggerFileSelect"
 @dragover.prevent="onDragOver"
 @dragleave="onDragLeave"
 @drop.prevent="onDrop"
 >
 <input
 type="file"
 ref="fileInput"
 style="display: none;"
 accept=".pdf"
 multiple
 @change="onFileChange"
 >

 <!-- Start state -->
 <div v-if="!isProcessing" id="upload-start-state">
 <div class="upload-icon"><i data-lucide="file-digit"></i></div>
 <h3 class="upload-title">Tarik PDF ke sini</h3>
 <p class="upload-text">atau klik untuk memilih berkas</p>
 <button
 class="btn btn-primary"
 id="btn-select-file"
 @click.stop="triggerFileSelect"
 >
 <i data-lucide="search"></i> Pilih berkas
 </button>
 </div>

 <!-- Processing state -->
 <div v-else class="ai-processing-state" id="upload-processing-state">
 <h3 class="processing-title">Memproses Antrean Dokumen...</h3>
 <p class="scanning-status">{{ statusText }}</p>

 <!-- Upload Queue UI -->
 <div class="upload-queue">
 <div v-for="item in uploadQueue" :key="item.id" class="queue-item" :class="item.status">
 <div class="queue-info">
 <span class="queue-name">{{ item.name }}</span>
 <div class="queue-status-wrapper">
 <span class="queue-status-text">{{ item.statusText }}</span>
 <span class="queue-percent-badge">{{ Math.round(item.progress || 0) }}%</span>
 </div>
 </div>
 <div class="queue-progress-bar-container">
 <div class="queue-progress-bar" :style="{ width: (item.progress || 0) + '%' }"></div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useAnalysis } from '../composables/useAnalysis';

const { isProcessing, progress, statusText, handleRkaFiles, uploadQueue } = useAnalysis();

const isDragOver = ref(false);
const fileInput = ref(null);

const triggerFileSelect = () => {
 if (fileInput.value) {
 fileInput.value.click();
 }
};

const onDragOver = () => {
 isDragOver.value = true;
};

const onDragLeave = () => {
 isDragOver.value = false;
};

const onDrop = (e) => {
 isDragOver.value = false;
 if (e.dataTransfer.files.length > 0) {
 handleRkaFiles(Array.from(e.dataTransfer.files));
 }
};

const onFileChange = (e) => {
 if (e.target.files.length > 0) {
 handleRkaFiles(Array.from(e.target.files));
 }
};

const getStepClass = (step) => {
 const p = progress.value;
 if (step === 'ocr') {
 if (p >= 30) return 'done';
 return 'active';
 } else if (step === 'ai') {
 if (p >= 70) return 'done';
 if (p >= 30) return 'active';
 return '';
 } else if (step === 'json') {
 if (p >= 90) return 'done';
 if (p >= 70) return 'active';
 return '';
 } else if (step === 'sroi') {
 if (p >= 100) return 'done';
 if (p >= 90) return 'active';
 return '';
 }
 return '';
};

// Re-render Lucide icons on updates
watch([isProcessing, progress], () => {
 nextTick(() => {
 if (window.lucide) {
 window.lucide.createIcons();
 }
 });
});
</script>

<style scoped>
.upload-queue {
 margin-top: 20px;
 display: flex;
 flex-direction: column;
 gap: 12px;
}
.queue-item {
 background: var(--bg-alt);
 border: 1px solid var(--border-color);
 border-radius: 8px;
 padding: 12px;
 text-align: left;
}
.queue-info {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 8px;
 font-size: 13px;
 gap: 12px;
}
.queue-name {
 font-weight: 600;
 color: var(--text-color);
 word-break: break-word;
}
.queue-status-wrapper {
 display: flex;
 align-items: center;
 gap: 10px;
 flex-shrink: 0;
}
.queue-status-text {
 color: var(--text-muted);
}
.queue-percent-badge {
 font-size: 11px;
 font-weight: 700;
 color: var(--primary-color, #0f766e);
 background: rgba(15, 118, 110, 0.12);
 padding: 2px 8px;
 border-radius: 9999px;
 min-width: 42px;
 text-align: center;
}
.queue-progress-bar-container {
 height: 8px;
 background: var(--border-color, #e2e8f0);
 border-radius: 4px;
 overflow: hidden;
}
.queue-progress-bar {
 height: 100%;
 background: var(--primary-color, #0f766e);
 transition: width 0.3s ease;
}
.queue-item.done .queue-progress-bar {
 background: var(--success-color, #10b981);
}
.queue-item.done .queue-percent-badge {
 background: rgba(16, 185, 129, 0.15);
 color: var(--success-color, #10b981);
}
.queue-item.error .queue-progress-bar {
 background: var(--danger-color, #ef4444);
}
.queue-item.error .queue-percent-badge {
 background: rgba(239, 68, 68, 0.15);
 color: var(--danger-color, #ef4444);
}
.queue-item.error .queue-name,
.queue-item.error .queue-status-text {
 color: var(--danger-text);
}
</style>
