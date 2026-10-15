<script setup>
// Tombol "Muat Ulang PDF": generate ulang analisis AI dari teks PDF yang sudah
// tersimpan di server — TANPA unggah PDF lagi.
// Dipakai di 2 tempat: menu titik tiga (variant="menu") dan halaman hasil analisis (variant="button").
import { ref } from 'vue'

const props = defineProps({
  doc: { type: Object, required: true },          // dokumen RKA (punya id & hasSourceText)
  variant: { type: String, default: 'button' },   // 'menu' | 'button'
  rules: { type: Array, default: () => [] },      // aturan threshold aktif (opsional)
  apiBase: { type: String, default: import.meta.env.VITE_API_URL || '' },
})
const emit = defineEmits(['done', 'error'])        // done → kirim dokumen terbaru

const loading = ref(false)
const errorMsg = ref('')

async function muatUlang() {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`${props.apiBase}/api/v1/rkis/${props.doc.id}/regenerate`, {
      method: 'POST',
      credentials: 'include', // sesuaikan dengan cara auth yang dipakai fetch lain di f-baru
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: props.rules }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      errorMsg.value = data.code === 'SOURCE_TEXT_MISSING'
        ? 'Dokumen lama: unggah ulang PDF sekali agar Muat Ulang PDF bisa dipakai.'
        : (data.error || 'Gagal memuat ulang.')
      emit('error', errorMsg.value)
      return
    }
    emit('done', data.rka) // parent mengganti dokumen di store → hasil analisis langsung tampil
  } catch (e) {
    errorMsg.value = e.message || 'Gagal memuat ulang.'
    emit('error', errorMsg.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Item di menu titik tiga -->
  <button
    v-if="variant === 'menu'"
    type="button"
    class="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
    :disabled="loading || !doc.hasSourceText"
    :title="doc.hasSourceText ? 'Generate ulang analisis AI tanpa unggah PDF' : 'Dokumen lama: unggah ulang PDF sekali'"
    @click.stop="muatUlang"
  >
    {{ loading ? 'Memuat ulang…' : '↻ Muat Ulang PDF' }}
  </button>

  <!-- Tombol di halaman hasil analisis -->
  <div v-else class="inline-flex flex-col gap-1">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
      :disabled="loading || !doc.hasSourceText"
      :title="doc.hasSourceText ? 'Generate ulang analisis AI tanpa unggah PDF' : 'Dokumen lama: unggah ulang PDF sekali'"
      @click="muatUlang"
    >
      {{ loading ? 'AI sedang menganalisis ulang…' : '↻ Muat Ulang PDF' }}
    </button>
    <span v-if="errorMsg" class="text-xs text-red-600">{{ errorMsg }}</span>
  </div>
</template>
