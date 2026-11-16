/* Mengambil jawaban terbuka dari satu baris survei.

   Aturan pengambilan disamakan dengan `normalizeAnswers` di chatbot dan
   frontend: kunci metadata (nama, unit kerja, email, ...) dilewati, jawaban
   angka (skor 1-4) dilewati, dan teks pertama yang bermakna dianggap komentar.

   Komentar sensitif tidak pernah diklasterisasi: komentar yang memuat kata
   bernada tuduhan atau nominal uang bisa memuat identitas pihak tertentu.
   Menyimpannya sebagai kelompok berarti menampilkannya kembali di dashboard.

   Modul ini murni supaya bisa dites dengan Node.
*/

const KOLOM_METADATA = new Set([
  'kelompok',
  'email address',
  'email',
  'timestamp',
  'nama',
  'nama lengkap',
  'unit kerja',
  'jabatan',
  'nip',
  'instansi',
  'prodi'
]);

const KATA_SENSITIF = ['rp', 'juta', 'miliar', 'dugaan', 'melaporkan', 'fiktif', 'mark up', 'markup'];

function safeParse(teks: string): Record<string, unknown> {
  try {
    const hasil = JSON.parse(teks);
    return hasil && typeof hasil === 'object' && !Array.isArray(hasil) ? (hasil as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function sumberJawaban(dataJawaban: unknown): Record<string, unknown> {
  if (typeof dataJawaban === 'string') return safeParse(dataJawaban);
  if (dataJawaban && typeof dataJawaban === 'object' && !Array.isArray(dataJawaban)) {
    return dataJawaban as Record<string, unknown>;
  }
  return {};
}

/* Komentar pertama yang bukan metadata dan bukan angka. */
export function komentarDari(dataJawaban: unknown): string | null {
  const sumber = sumberJawaban(dataJawaban);

  for (const [pertanyaan, mentah] of Object.entries(sumber)) {
    const kunci = String(pertanyaan).replace(/^\uFEFF/, '').trim().toLowerCase();
    if (KOLOM_METADATA.has(kunci)) continue;

    const nilai = Array.isArray(mentah) ? mentah[0] : mentah;
    const teks = String(nilai ?? '').trim();
    if (!teks || teks === '-') continue;
    if (/^-?\d+(\.\d+)?$/.test(teks)) continue;
    if (teks.length <= 3) continue;

    return teks;
  }

  return null;
}

/* Sama dengan `jawabanSensitif` di frontend/src/data/survey/normalize.js.
   Disalin, bukan diimpor, karena Edge Function tidak memuat kode frontend. */
export function jawabanSensitif(teks: string): boolean {
  const t = String(teks || '');
  if (t.length > 300) return true;
  const kecil = t.toLowerCase();
  return KATA_SENSITIF.some((kata) => kecil.includes(kata));
}
