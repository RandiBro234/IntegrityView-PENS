import {
  PERIODE, PERIODE_AWAL, DEFAULT_FILTER, PILIHAN_PEMBANDING, PILIHAN_KATEGORI
} from './constants.js';

/* ---------------------------------------------------------------------
   Filter
   --------------------------------------------------------------------- */
export function normalisasiFilter(filter = {}) {
  const periode = PERIODE.some((p) => p.key === filter.periode) ? filter.periode : DEFAULT_FILTER.periode;
  const pembanding = periode === PERIODE_AWAL
    ? 'tanpa'
    : PILIHAN_PEMBANDING.some((p) => p.key === filter.pembanding)
      ? filter.pembanding
      : DEFAULT_FILTER.pembanding;
  return {
    periode,
    pembanding,
    kategori: PILIHAN_KATEGORI.includes(filter.kategori) ? filter.kategori : DEFAULT_FILTER.kategori
  };
}
