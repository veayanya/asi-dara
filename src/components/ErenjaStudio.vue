<!--
  ErenjaStudio.vue
  ─────────────────────────────────────────────────────────────────────
  Komponen ini sebelumnya berisi seluruh logika e-Renja Studio (7 tab).
  Kode tersebut telah dihapus dan digantikan oleh modul modular di:
    src/modules/pra-rka/
  
  Komponen ini kini hanya menjadi pass-through ke PraRka.vue agar
  App.vue (yang memanggil <ErenjaStudio />) tidak perlu diubah.
-->
<template>
  <PraRka />
</template>

<script setup>
import PraRka from '../modules/pra-rka/PraRka.vue';
</script>
