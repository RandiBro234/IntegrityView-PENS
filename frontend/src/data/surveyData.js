/* =====================================================================
   Facade modul survei.
   Implementasi dipecah per tanggung jawab di folder ./survey, sedangkan
   file ini mempertahankan API lama agar pemakai tidak perlu berubah.
   Semua angka (landing, dashboard, detail, pusat survei, PDF) berasal
   dari getReportData(filter).
   ===================================================================== */

export {
  PERIODE,
  PERIODE_AWAL,
  PERIODE_DEFAULT,
  DEFAULT_FILTER,
  PILIHAN_PEMBANDING,
  PILIHAN_KATEGORI
} from './survey/constants.js';

export {
  periodeDariTanggal,
  normalisasiNilai,
  normalisasiKelompok,
  jawabanSensitif,
  temaTerbuka,
  normalizeAnswers,
  normalisasiBaris
} from './survey/normalize.js';

export { persenLargestRemainder, hitungAgregat } from './survey/statistics.js';
export { store, muatDataSurvei } from './survey/store.js';
export { normalisasiFilter } from './survey/filters.js';
export { arahPerubahan, getDelta } from './survey/recommendations.js';
export { getReportData, getRingkasanPublik } from './survey/report.js';
export { INSTRUMENTS, SURVEI_INFO, SKALA, AMBANG, getInstrumen } from './instrumentConfig.js';
