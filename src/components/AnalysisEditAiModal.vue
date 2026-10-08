<template>
  <Teleport to="body">
    <div class="ae-overlay" role="dialog" aria-modal="true" aria-labelledby="ae-ai-title" @mousedown.self="requestClose">
      <div class="ae-modal ae-modal--narrow">

        <!-- ══ HEADER ══ -->
        <div class="ae-head">
          <div class="ae-head-main">
            <div class="ae-head-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>
            </div>
            <div style="min-width:0;">
              <h3 id="ae-ai-title" class="ae-title">Edit dengan AI</h3>
              <div class="ae-subtitle" :title="docName">{{ docName }}</div>
            </div>
          </div>
          <button type="button" class="ae-x" aria-label="Tutup" @click="requestClose">&times;</button>
        </div>

        <!-- ══ TAHAP 1: INSTRUKSI ══ -->
        <div v-if="stage === 'input'" class="ae-ai-body">
          <div v-if="!analysis.id" class="ae-banner ae-banner--err">
            <span>Dokumen ini belum tersimpan di arsip sehingga belum dapat diedit. Buka dokumen dari menu Arsip terlebih dahulu.</span>
          </div>
          <div v-if="analysis.status === 'Approved'" class="ae-banner ae-banner--warn">
            <span>Dokumen ini berstatus <strong>Disahkan</strong>. Hasil edit disimpan sebagai versi baru dan angka Nilai Prakiraan Dampak pada dashboard ikut berubah.</span>
          </div>
          <div class="ae-banner ae-banner--info">
            <span>AI hanya <strong>mengusulkan</strong> perubahan. Anda meninjau perbandingan sebelum/sesudah, dan baru setelah disetujui hasilnya disimpan sebagai <strong>versi baru</strong> (data lama tetap aman).</span>
          </div>

          <div class="ae-field">
            <label for="ae-ai-instruksi">Apa yang ingin diubah?</label>
            <textarea
              id="ae-ai-instruksi"
              v-model="instruction"
              class="form-input"
              rows="4"
              :maxlength="MAX_CHARS"
              placeholder="Contoh: Turunkan deadweight menjadi 20% dan perjelas alasan pengurangan perjalanan dinas."
              @keydown.ctrl.enter.prevent="runAi"
              @keydown.meta.enter.prevent="runAi"
            ></textarea>
            <div class="ae-counter">{{ instruction.length }} / {{ MAX_CHARS }}</div>
          </div>

          <div class="ae-label">Contoh instruksi</div>
          <div class="ae-chips">
            <button v-for="q in QUICK_PROMPTS" :key="q" type="button" class="ae-chip" @click="instruction = q">{{ q }}</button>
          </div>

          <div class="ae-label">Bagian yang boleh diubah AI</div>
          <div class="ae-scope-list">
            <label v-for="s in AI_EDIT_SCOPES" :key="s.id" class="ae-scope" :class="{ 'is-on': selectedScopes.includes(s.id) }">
              <input v-model="selectedScopes" type="checkbox" :value="s.id" />
              <div>
                <b>{{ s.label }}</b>
                <span>{{ s.hint }}</span>
              </div>
            </label>
          </div>

          <div v-if="errorMsg" class="ae-banner ae-banner--err" style="margin-top:14px;">
            <span>{{ errorMsg }}</span>
          </div>
        </div>

        <!-- ══ TAHAP 2: MEMPROSES ══ -->
        <div v-else-if="stage === 'loading'" class="ae-ai-body">
          <div class="ae-loading">
            <div class="ae-spinner" aria-hidden="true"></div>
            <div>
              <strong>AI sedang menyusun usulan perubahan…</strong>
              <div class="ae-hint" style="margin-top:4px;">Biasanya 10–40 detik. Belum ada yang disimpan.</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" @click="cancelRequest">Batalkan</button>
          </div>
        </div>

        <!-- ══ TAHAP 3: PRATINJAU ══ -->
        <div v-else class="ae-ai-body">
          <div v-if="result.summary" class="ae-ai-summary">
            <strong>Ringkasan AI:</strong> {{ result.summary }}
            <div v-if="result.model" class="ae-model-tag" style="margin-top:4px;">Model: {{ result.model }}</div>
          </div>
          <div v-if="result.notes" class="ae-banner ae-banner--warn">
            <span><strong>Catatan AI:</strong> {{ result.notes }}</span>
          </div>
          <div v-if="ignoredCount > 0" class="ae-banner ae-banner--info">
            <span>{{ ignoredCount }} usulan AI diabaikan karena di luar bagian yang diizinkan atau nilainya tidak valid.</span>
          </div>

          <div v-if="!realMods.length" class="ae-banner ae-banner--info">
            <span>AI tidak mengusulkan perubahan apa pun pada data. Coba ubah instruksi agar lebih spesifik.</span>
          </div>

          <template v-else>
            <div v-if="sroiMod" class="ae-sroi-delta">
              <span>Rasio Nilai Prakiraan Dampak:</span>
              <span class="ae-pill">{{ sroiMod.from }}</span>
              <span aria-hidden="true">→</span>
              <span class="ae-pill">{{ sroiMod.to }}</span>
            </div>

            <div v-if="validation.errors.length" class="ae-banner ae-banner--err">
              <div>
                <strong>Usulan ini tidak dapat diterapkan:</strong>
                <ul><li v-for="(e, i) in validation.errors" :key="'e' + i">{{ e.msg }}</li></ul>
              </div>
            </div>
            <div v-if="validation.warnings.length" class="ae-banner ae-banner--warn">
              <div>
                <strong>Perlu dicek:</strong>
                <ul><li v-for="(w, i) in validation.warnings" :key="'w' + i">{{ w.msg }}</li></ul>
              </div>
            </div>

            <div class="ae-subhead"><span>{{ realMods.length }} perubahan diusulkan</span></div>
            <table class="ae-changes">
              <thead><tr><th style="width:34%;">Bagian</th><th style="width:33%;">Sebelum</th><th>Sesudah</th></tr></thead>
              <tbody>
                <tr v-for="(m, i) in realMods" :key="'m' + i">
                  <td><span class="ae-group-tag">{{ m.group }}</span><br />{{ m.label }}</td>
                  <td class="ae-from">{{ m.from }}</td>
                  <td class="ae-to">{{ m.to }}</td>
                </tr>
              </tbody>
            </table>

            <div class="ae-field" style="margin-top:16px;">
              <label for="ae-ai-vname">Nama Versi</label>
              <input id="ae-ai-vname" v-model="versionName" type="text" class="form-input-sm" maxlength="80" />
            </div>
            <p class="ae-hint">AI bisa keliru. Periksa setiap perubahan sebelum menerapkan. Versi sebelumnya tetap dapat dipilih kembali lewat pemilih “Versi”.</p>
          </template>
        </div>

        <!-- ══ FOOTER ══ -->
        <div class="ae-foot">
          <div v-if="confirmDiscard" class="ae-foot-msg is-error">Buang usulan AI ini?</div>
          <div v-else-if="stage === 'input'" class="ae-foot-msg">Ctrl + Enter untuk mengirim.</div>
          <div v-else-if="stage === 'preview'" class="ae-foot-msg" :class="{ 'is-error': validation.errors.length }">
            {{ validation.errors.length ? validation.errors[0].msg : (realMods.length ? 'Tinjau perubahan lalu terapkan.' : 'Tidak ada perubahan.') }}
          </div>
          <div v-else class="ae-foot-msg">Menunggu respons AI…</div>

          <div class="ae-foot-actions">
            <template v-if="confirmDiscard">
              <button type="button" class="btn btn-secondary btn-sm" @click="confirmDiscard = false">Kembali</button>
              <button type="button" class="btn btn-sm" style="background:var(--danger-color,#c4667a);color:#fff;border:none;" @click="emit('close')">Ya, Buang</button>
            </template>
            <template v-else-if="stage === 'input'">
              <button type="button" class="btn btn-secondary btn-sm" @click="requestClose">Batal</button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="!canRun" @click="runAi">Minta Usulan AI</button>
            </template>
            <template v-else-if="stage === 'preview'">
              <button type="button" class="btn btn-secondary btn-sm" :disabled="saving" @click="backToInput">Ubah Instruksi</button>
              <button type="button" class="btn btn-secondary btn-sm" :disabled="saving" @click="runAi">Coba Lagi</button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="!canApply" @click="applyResult">
                {{ saving ? 'Menyimpan...' : 'Terapkan sebagai Versi Baru' }}
              </button>
            </template>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import '../assets/analysis-edit.css';
import { useAnalysis } from '../composables/useAnalysis';
import {
  AI_EDIT_SCOPES,
  requestAiEdit,
  applyAiPatch,
  validateDraft,
  summarizeModifications,
  modificationsForStorage,
  defaultVersionName
} from '../utils/analysisEdit';

const props = defineProps({
  analysis: { type: Object, required: true }
});
const emit = defineEmits(['close', 'saved']);

const { saveManualVersion, currentUser } = useAnalysis();

const MAX_CHARS = 2000;
const QUICK_PROMPTS = [
  'Rapikan bahasa dan ejaan seluruh narasi analisis tanpa mengubah angka.',
  'Perjelas alasan rekomendasi pengurangan dan penambahan anggaran agar lebih spesifik.',
  'Tinjau ulang parameter Nilai Prakiraan Dampak (deadweight, attribution, drop-off) dan sesuaikan bila tidak wajar, sertakan alasannya.',
  'Sesuaikan status efisiensi tiap rekening dengan proporsinya terhadap pagu.',
  'Tulis ulang justifikasi outcome agar lebih ringkas dan formal.'
];

const docName = computed(
  () => props.analysis.namaDokumen || props.analysis.subKegiatan || props.analysis.program || props.analysis.id || 'Dokumen RKA'
);

// ── State ────────────────────────────────────────────────────────────
const stage = ref('input'); // 'input' | 'loading' | 'preview'
const instruction = ref('');
const selectedScopes = ref(AI_EDIT_SCOPES.filter((s) => s.defaultOn).map((s) => s.id));
const errorMsg = ref('');
const result = ref({ summary: '', notes: '', model: '', rejected: [] });
const applied = ref(null); // hasil applyAiPatch
const versionName = ref('');
const saving = ref(false);
const confirmDiscard = ref(false);
let controller = null;

const canRun = computed(
  () => !!props.analysis.id && instruction.value.trim().length >= 6 && selectedScopes.value.length > 0
);

const realMods = computed(() => (applied.value?.modifications || []).filter((m) => !m.derived));
const sroiMod = computed(() => (applied.value?.modifications || []).find((m) => m.derived) || null);
const validation = computed(() =>
  applied.value ? validateDraft(applied.value.afterDraft) : { errors: [], warnings: [] }
);
const ignoredCount = computed(() => {
  const proposed = Object.keys(result.value.patch || {}).length + (result.value.rejected || []).length;
  return Math.max(0, proposed - (applied.value?.appliedKeys.length || 0));
});
const canApply = computed(
  () => !saving.value && !!props.analysis.id && realMods.value.length > 0 && validation.value.errors.length === 0
);

// ── Minta usulan ke AI ───────────────────────────────────────────────
const runAi = async () => {
  if (!canRun.value || stage.value === 'loading') return;
  errorMsg.value = '';
  stage.value = 'loading';
  controller = new AbortController();
  const scopesUsed = [...selectedScopes.value];

  try {
    const data = await requestAiEdit({
      rkaId: props.analysis.id,
      analysis: props.analysis,
      instruction: instruction.value.trim(),
      scopes: scopesUsed,
      signal: controller.signal
    });
    result.value = {
      summary: data.summary || '',
      notes: data.notes || '',
      model: data.model || '',
      patch: data.patch || {},
      rejected: data.rejected || []
    };
    applied.value = applyAiPatch(props.analysis, data.patch || {}, scopesUsed);
    versionName.value = defaultVersionName('Edit AI');
    stage.value = 'preview';
  } catch (err) {
    if (err?.name === 'AbortError' && !controller) return; // dibatalkan pengguna
    errorMsg.value =
      err?.name === 'AbortError'
        ? 'Waktu tunggu habis. Layanan AI belum merespons — coba lagi sebentar lagi.'
        : err?.message || 'Gagal menghubungi layanan AI.';
    stage.value = 'input';
  } finally {
    controller = null;
  }
};

const cancelRequest = () => {
  const c = controller;
  controller = null; // tandai sebagai pembatalan oleh pengguna
  if (c) c.abort();
  stage.value = 'input';
};

const backToInput = () => {
  applied.value = null;
  stage.value = 'input';
};

// ── Terapkan sebagai versi baru ──────────────────────────────────────
const applyResult = async () => {
  if (!canApply.value) return;
  saving.value = true;
  try {
    const mods = applied.value.modifications;
    const aiNote = result.value.summary ? ` ${result.value.summary}` : '';
    const saved = await saveManualVersion(props.analysis.id, {
      parentVersionId: props.analysis.activeVersionId,
      versionName: versionName.value.trim() || defaultVersionName('Edit AI'),
      changesSummary:
        `Edit AI: “${instruction.value.trim().slice(0, 140)}”.${aiNote} ${summarizeModifications(mods)}`.slice(0, 600),
      data: applied.value.after,
      createdBy: currentUser.value?.username || currentUser.value?.name || 'Pengguna',
      source: 'ai-edit',
      modifications: modificationsForStorage(mods)
    });
    if (saved) emit('saved', saved);
  } finally {
    saving.value = false;
  }
};

// ── Tutup ────────────────────────────────────────────────────────────
const requestClose = () => {
  if (saving.value) return;
  if (stage.value === 'loading') {
    cancelRequest();
    return;
  }
  if (stage.value === 'preview' && realMods.value.length > 0) {
    confirmDiscard.value = true;
    return;
  }
  emit('close');
};

const onKeydown = (e) => {
  if (e.key === 'Escape') requestClose();
};
let prevOverflow = '';
onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = prevOverflow;
  if (controller) controller.abort();
});
</script>
