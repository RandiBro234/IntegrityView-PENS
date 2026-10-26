/* Satu-satunya pemformat angka perubahan.

   Dipakai oleh komponen Delta (kartu KPI, kolom selisih pada bar, metrik
   panel statistik, halaman detail) agar semua angka bertanda memakai format
   yang sama. Intl.NumberFormat('id-ID') menghasilkan pemisah desimal koma
   dan tanda minus yang benar. */

function bulatkan(value, desimal) {
  const faktor = 10 ** desimal;
  const hasil = Math.round(value * faktor) / faktor;
  /* Hindari "-0" saat nilai sangat kecil. */
  return Object.is(hasil, -0) ? 0 : hasil;
}

/* Angka bertanda untuk perubahan naik/turun, mis. "+3,0" atau "-9,1". */
export function formatDeltaAngka(value, desimal = 1) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
    signDisplay: 'exceptZero'
  }).format(bulatkan(Number(value), desimal));
}

/* Angka tanpa tanda untuk perubahan stabil, mis. "0,1". */
export function formatDeltaNetral(value, desimal = 1) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
    signDisplay: 'never'
  }).format(Math.abs(bulatkan(Number(value), desimal)));
}
