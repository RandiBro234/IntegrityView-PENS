/* Skor disimpan sebagai indeks 0–100 karena begitulah statistik dihitung
   (total skor / skor maksimal × 100). Tetapi indeks tidak layak ditampilkan
   dengan tanda persen: ia bukan proporsi orang, dan penyebutnya bisa 4 atau 3
   sehingga angka yang sama bisa berarti 75% atau 66,7%.

   Semua tampilan memakai skala asli kuesioner 1–4. Konversi hanya terjadi di
   lapisan tampilan, data dan ambang (AMBANG di instrumentConfig) tetap apa
   adanya. */

export const PEMBAGI_INDEKS = 25;

/* Indeks 0–100 → skor 1–4. */
export function keSkor(indeks) {
  return indeks == null ? null : indeks / PEMBAGI_INDEKS;
}
