/* Port dari frontend/src/data/survey/normalize.js (bagian tema komentar).

   Dipakai untuk merangkum jawaban terbuka menjadi tema tanpa pernah memuat
   teks mentahnya ke konteks LLM. Daftar kata kunci harus sama dengan versi JS;
   kalau berubah di sana, ubah di sini juga dan jalankan ulang tes golden.
*/

const KATA_SENSITIF = ['rp', 'juta', 'miliar', 'dugaan', 'melaporkan', 'fiktif', 'mark up', 'markup'];

export function jawabanSensitif(teks: unknown): boolean {
  const t = String(teks || '');
  if (t.length > 300) return true;
  const kecil = t.toLowerCase();
  return KATA_SENSITIF.some((kata) => kecil.includes(kata));
}

/* Tema sederhana dari frekuensi kata kunci. Tanpa layanan AI eksternal dan
   tanpa menampilkan teks mentah. */
export const KATA_KUNCI_TEMA: ReadonlyArray<readonly [string, string]> = [
  ['sosialisasi', 'Sosialisasi'],
  ['pelatihan', 'Pelatihan'],
  ['transparan', 'Transparansi'],
  ['sop', 'Kejelasan SOP'],
  ['tindak lanjut', 'Tindak lanjut'],
  ['sarana', 'Perbaikan sarana'],
  ['fasilitas', 'Perbaikan fasilitas'],
  ['digital', 'Digitalisasi'],
  ['integritas', 'Penguatan integritas'],
  ['korupsi', 'Pencegahan korupsi'],
  ['gratifikasi', 'Pemahaman gratifikasi'],
  ['komunikasi', 'Komunikasi antar unit'],
  ['antre', 'Antrean layanan'],
  ['waktu', 'Waktu layanan']
];

export function temaTerbuka(teksList: string[]): Array<{ tema: string; jumlah: number }> {
  if (!teksList.length) return [];
  const hitung = new Map<string, number>();
  teksList.forEach((teks) => {
    const kecil = String(teks).toLowerCase();
    KATA_KUNCI_TEMA.forEach(([kata, tema]) => {
      if (kecil.includes(kata)) hitung.set(tema, (hitung.get(tema) || 0) + 1);
    });
  });
  return [...hitung.entries()]
    .map(([tema, jumlah]) => ({ tema, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 3);
}
