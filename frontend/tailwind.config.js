/** @type {import('tailwindcss').Config} */
// Tailwind di proyek ini dipakai HANYA untuk halaman "Petunjuk Penggunaan"
// (src/components/PetunjukPenggunaan.vue) supaya tampilan menu lain tidak berubah:
//   • content   : hanya memindai komponen tersebut
//   • important : semua utilitas dibatasi di dalam #petunjuk-root
//   • preflight : dimatikan (tidak mereset gaya global aplikasi)
// Warna memakai token di assets/style.css sehingga tema terang/gelap ikut bekerja.
export default {
  content: ['./src/components/PetunjukPenggunaan.vue'],
  important: '#petunjuk-root',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: 'rgba(var(--primary-rgb), <alpha-value>)',
        'brand-soft': 'var(--primary-glow)',
        accent: 'rgba(var(--accent-rgb), <alpha-value>)',
        'accent-soft': 'var(--accent-glow)',
        surface: 'var(--bg-secondary)',
        inset: 'var(--bg-tertiary)',
        line: 'var(--border-color)',
        'line-strong': 'var(--border-color-strong)',
        ink: 'var(--text-primary)',
        'ink-2': 'var(--text-secondary)',
        'ink-3': 'var(--text-muted)',
        ok: 'var(--success-color)',
        'ok-soft': 'var(--success-glow)',
        'ok-ink': 'var(--success-hover)',
        warn: 'var(--warning-color)',
        'warn-soft': 'var(--warning-glow)',
        bad: 'var(--danger-color)',
        'bad-soft': 'var(--danger-glow)',
        'bad-ink': 'var(--danger-hover)'
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif']
      }
    }
  },
  plugins: []
};
