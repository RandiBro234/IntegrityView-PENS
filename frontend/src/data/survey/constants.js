export const PERIODE = [
  { key: '2024-ganjil', label: '2024 Ganjil', tahun: '2024', semester: 'Ganjil', rentang: 'Sep 2024–Feb 2025' },
  { key: '2025-genap', label: '2025 Genap', tahun: '2025', semester: 'Genap', rentang: 'Mar–Agu 2025' },
  { key: '2025-ganjil', label: '2025 Ganjil', tahun: '2025', semester: 'Ganjil', rentang: 'Sep 2025–Feb 2026' },
  { key: '2026-genap', label: '2026 Genap', tahun: '2026', semester: 'Genap', rentang: 'Mar–Agu 2026' },
  { key: '2026-ganjil', label: '2026 Ganjil', tahun: '2026', semester: 'Ganjil', rentang: 'Sep 2026–Feb 2027', berjalan: true }
];

export const PERIODE_AWAL = PERIODE[0].key;
export const PERIODE_DEFAULT = '2026-ganjil';

export const DEFAULT_FILTER = {
  periode: PERIODE_DEFAULT,
  pembanding: 'sebelumnya',
  kategori: 'Semua'
};

export const PILIHAN_PEMBANDING = [
  { key: 'sebelumnya', label: 'Semester sebelumnya' },
  { key: 'tanpa', label: 'Tanpa pembanding' }
];
export const PILIHAN_KATEGORI = ['Semua', 'Layanan', 'Internal'];
