<template>
  <div class="card laporan-card">

    <div class="card-body">
      <form class="laporan-form-grid" @submit.prevent="submitLaporan">
        <!-- Kolom utama: judul + deskripsi (mengisi seluruh tinggi tersedia) -->
        <div class="laporan-col laporan-col-main">
          <div class="form-group">
            <label class="form-label">Judul Laporan <span class="required">*</span></label>
            <input
              v-model="form.judul"
              type="text"
              class="form-input"
              placeholder="Contoh: Kendala saat mengunggah dokumen RKA"
              required
            />
          </div>

          <div class="form-group laporan-desc-group">
            <label class="form-label">Deskripsi Laporan <span class="required">*</span></label>
            <textarea
              v-model="form.deskripsi"
              class="form-input laporan-desc-textarea"
              placeholder="Jelaskan laporan Anda secara detail..."
              required
            ></textarea>
          </div>
        </div>

        <!-- Kolom samping: data pelapor + lampiran -->
        <div class="laporan-col laporan-col-side">
          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select v-model="form.kategori" class="form-input">
              <option>Kendala Teknis</option>
              <option>Bug Aplikasi</option>
              <option>Masukan &amp; Saran</option>
              <option>Permintaan Bantuan</option>
              <option>Lainnya</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nama Pelapor <span class="required">*</span></label>
            <input v-model="form.nama" type="text" class="form-input" placeholder="Nama Anda" required />
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Email Pelapor</label>
              <input
                v-model="form.email"
                type="email"
                class="form-input"
                placeholder="nama@email.com"
              />
            </div>
            <div class="form-group" style="flex: 1;">
              <label class="form-label">No. WhatsApp</label>
              <input
                v-model="form.noHp"
                type="text"
                class="form-input"
                placeholder="6281234567890"
              />
            </div>
          </div>
          <p class="contact-hint">Isi minimal salah satu — Email atau No. WhatsApp — supaya kami bisa menghubungi Anda balik.</p>

          <div class="form-group laporan-attach-group">
            <label class="form-label">Lampiran Gambar (opsional, maks. 5 gambar, 5MB/gambar)</label>
            <div
              :class="['laporan-dropzone', { dragover: isDragOver }]"
              @click="triggerFileSelect"
              @dragover.prevent="isDragOver = true"
              @dragleave="isDragOver = false"
              @drop.prevent="onDrop"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                style="display: none;"
                @change="onFileChange"
              />
              <i data-lucide="image-plus" class="dropzone-icon"></i>
              <p class="dropzone-text">Klik atau tarik gambar ke sini</p>
            </div>

            <div v-if="images.length > 0" class="image-preview-grid">
              <div v-for="(img, idx) in images" :key="idx" class="image-preview-item">
                <img :src="img.previewUrl" :alt="img.file.name" />
                <button type="button" class="image-remove-btn" @click.stop="removeImage(idx)" title="Hapus gambar">
                  <i data-lucide="x"></i>
                </button>
                <span class="image-name">{{ img.file.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer: status + tombol kirim, selebar penuh -->
        <div class="laporan-form-footer">
          <div v-if="statusMessage" :class="['laporan-status-msg', statusType]">
            <i :data-lucide="statusType === 'success' ? 'check-circle-2' : 'alert-circle'"></i>
            <span>{{ statusMessage }}</span>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <i data-lucide="send"></i>
            {{ isSubmitting ? 'Mengirim...' : 'Kirim Laporan' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useAnalysis } from '../composables/useAnalysis';
import { apiFetch } from '../utils/api';

const { currentUser } = useAnalysis();

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const form = reactive({
  judul: '',
  kategori: 'Kendala Teknis',
  nama: '',
  email: '',
  noHp: '',
  deskripsi: ''
});

const images = ref([]);
const fileInput = ref(null);
const isDragOver = ref(false);
const isSubmitting = ref(false);
const statusMessage = ref('');
const statusType = ref('');

function triggerFileSelect() {
  fileInput.value?.click();
}

function addFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    if (images.value.length >= MAX_IMAGES) {
      statusType.value = 'error';
      statusMessage.value = `Maksimal ${MAX_IMAGES} gambar per laporan.`;
      break;
    }
    if (!file.type.startsWith('image/')) continue;
    if (file.size > MAX_SIZE_BYTES) {
      statusType.value = 'error';
      statusMessage.value = `Gambar "${file.name}" melebihi 5MB dan dilewati.`;
      continue;
    }
    images.value.push({ file, previewUrl: URL.createObjectURL(file) });
  }
}

function onFileChange(e) {
  addFiles(e.target.files);
  e.target.value = '';
}

function onDrop(e) {
  isDragOver.value = false;
  addFiles(e.dataTransfer.files);
}

function removeImage(idx) {
  URL.revokeObjectURL(images.value[idx].previewUrl);
  images.value.splice(idx, 1);
}

// Konversi File → base64 string
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result = "data:image/png;base64,XXXX..." — ambil bagian setelah koma
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submitLaporan() {
  statusMessage.value = '';
  statusType.value = '';

  // Validasi frontend
  if (!form.judul.trim()) { statusType.value = 'error'; statusMessage.value = 'Judul laporan wajib diisi.'; return; }
  if (!form.nama.trim())  { statusType.value = 'error'; statusMessage.value = 'Nama pelapor wajib diisi.'; return; }
  if (!form.email.trim() && !form.noHp.trim()) { statusType.value = 'error'; statusMessage.value = 'Isi minimal salah satu: Email atau No. WhatsApp pelapor.'; return; }
  if (!form.deskripsi.trim()) { statusType.value = 'error'; statusMessage.value = 'Deskripsi laporan wajib diisi.'; return; }

  isSubmitting.value = true;
  try {
    // Konversi semua gambar ke base64 sebelum kirim
    const imagesBase64 = await Promise.all(
      images.value.map(async (img) => ({
        name: img.file.name,
        type: img.file.type,
        data: await fileToBase64(img.file),
      }))
    );

    // Kirim sebagai JSON biasa — tidak butuh multer di backend
    const res = await apiFetch('/api/v1/laporan/kirim', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judul:     form.judul,
        kategori:  form.kategori,
        nama:      form.nama,
        email:     form.email,
        noHp:      form.noHp,
        deskripsi: form.deskripsi,
        images:    imagesBase64,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal mengirim laporan.');

    statusType.value = 'success';
    statusMessage.value = result.message || 'Laporan berhasil dikirim ke aplikasi admin.';

    if (result.adminWa) {
      const waktu = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
      const waText =
        `*LAPORAN BAPPERIDA ASI DARA*\n\n` +
        `*Judul:* ${form.judul}\n` +
        `*Kategori:* ${form.kategori}\n` +
        `*Nama Pelapor:* ${form.nama}\n` +
        (form.email.trim() ? `*Email Pelapor:* ${form.email}\n` : '') +
        (form.noHp.trim() ? `*No. WhatsApp Pelapor:* ${form.noHp}\n` : '') +
        `*Waktu:* ${waktu}\n\n` +
        `*Deskripsi:*\n${form.deskripsi}` +
        (imagesBase64.length > 0 ? `\n\n_(${imagesBase64.length} gambar sudah tersimpan di aplikasi admin)_` : '');
      window.open(`https://wa.me/${result.adminWa}?text=${encodeURIComponent(waText)}`, '_blank');
    }

    // Reset form
    form.judul = '';
    form.kategori = 'Kendala Teknis';
    form.email = currentUser.value?.email || '';
    form.noHp = '';
    form.deskripsi = '';
    images.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    images.value = [];

  } catch (err) {
    statusType.value = 'error';
    statusMessage.value = err.message || 'Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.';
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  form.nama = currentUser.value?.name || currentUser.value?.username || '';
  if (currentUser.value?.email) form.email = currentUser.value.email;
  nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
});

watch(() => images.value.length, () => {
  nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
});

watch([statusMessage], () => {
  nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
});
</script>

<style scoped>
/* Kartu mengisi seluruh lebar & tinggi yang tersedia di halaman */
.laporan-card {
  width: 100%;
  max-width: none;
  margin-bottom: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Grid utama: kolom konten (judul+deskripsi) lebih lebar, kolom data pelapor di samping */
.laporan-form-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  grid-template-rows: 1fr auto;
  column-gap: 28px;
  row-gap: 16px;
}

.laporan-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.laporan-col-main { gap: 16px; }
.laporan-col-side { gap: 14px; }

.form-group { min-width: 0; }

/* Deskripsi mengisi seluruh sisa ruang vertikal */
.laporan-desc-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.laporan-desc-textarea {
  flex: 1;
  resize: none;
  min-height: 220px;
}

/* Lampiran gambar mengisi sisa ruang di kolom samping */
.laporan-attach-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.laporan-dropzone {
  flex: 0 0 auto;
}

.required { color: #ef4444; margin-left: 2px; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { min-width: 0; }
.contact-hint { font-size: 0.76rem; color: var(--text-muted); margin: -6px 0 0; }
textarea.form-input { resize: vertical; min-height: 100px; }
.laporan-dropzone {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 20px; text-align: center; cursor: pointer;
  transition: all 0.15s; background: var(--bg-tertiary);
}
.laporan-dropzone:hover, .laporan-dropzone.dragover {
  border-color: var(--primary-color);
  background: var(--primary-glow, rgba(46, 125, 116, 0.08));
}
.dropzone-icon { width: 28px; height: 28px; color: var(--primary-color); margin-bottom: 6px; }
.dropzone-text { font-size: 0.82rem; color: var(--text-muted); margin: 0; }
.image-preview-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px; margin-top: 12px; overflow-y: auto;
}
.image-preview-item {
  position: relative; border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm); overflow: hidden; background: var(--bg-tertiary);
}
.image-preview-item img { width: 100%; height: 70px; object-fit: cover; display: block; }
.image-name {
  display: block; font-size: 0.65rem; color: var(--text-muted);
  padding: 4px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.image-remove-btn {
  position: absolute; top: 4px; right: 4px; width: 20px; height: 20px;
  border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.image-remove-btn i { width: 12px; height: 12px; }

.laporan-status-msg {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: var(--border-radius-md);
  font-size: 0.82rem;
}
.laporan-status-msg i { width: 16px; height: 16px; flex-shrink: 0; }
.laporan-status-msg.success { background: rgba(16,185,129,0.12); color: #10b981; }
.laporan-status-msg.error { background: rgba(239,68,68,0.12); color: #ef4444; }

.laporan-form-footer {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 900px) {
  .laporan-form-grid { grid-template-columns: 1fr; grid-template-rows: none; }
  .laporan-col-main, .laporan-col-side { flex: none; }
  .laporan-desc-textarea { min-height: 160px; }
  .laporan-card { flex: none; }
}
@media (max-width: 640px) { .form-row { flex-direction: column; } }
</style>
