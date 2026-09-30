<template>
  <span
    ref="el"
    class="ba-fill"
    :class="{ 'ba-fill-editable': editable }"
    :contenteditable="editable"
    :data-ph="ph"
    spellcheck="false"
    @blur="commit"
    @keydown.enter.prevent="$event.target.blur()"
    @paste="onPaste"
  ></span>
</template>

<script setup>
/**
 * Isian langsung di kertas.
 * - Kosong  -> tampil titik-titik (placeholder via CSS ::before), ikut tercetak
 *              sehingga bisa ditulis tangan di kertas hasil cetak.
 * - Diisi   -> teks tampil dengan garis bawah seperti biasa.
 * Teks diatur lewat textContent (bukan interpolasi Vue) supaya tidak bentrok
 * dengan node teks yang diubah browser saat mengetik.
 */
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  editable: { type: Boolean, default: false },
  ph: { type: String, default: '…………………………' },
});
const emit = defineEmits(['update:modelValue']);
const el = ref(null);

function sync() {
  if (!el.value) return;
  const v = props.modelValue == null ? '' : String(props.modelValue);
  if (el.value.textContent !== v) el.value.textContent = v;
  if (!v) el.value.innerHTML = ''; // buang <br> sisa browser agar :empty aktif
}

function commit() {
  if (!el.value) return;
  const v = (el.value.textContent || '').replace(/\s+/g, ' ').trim();
  emit('update:modelValue', v);
  nextTick(sync);
}

function onPaste(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ');
  document.execCommand('insertText', false, text);
}

onMounted(sync);
watch(() => props.modelValue, sync);
</script>

<style scoped>
.ba-fill:empty::before {
  content: attr(data-ph);
  font-weight: 600;
}
.ba-fill-editable:empty {
  min-width: 60px;
}
</style>
