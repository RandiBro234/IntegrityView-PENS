/* Tipe bersama untuk perhitungan agregat di Edge Function.

   `BarisJawaban` adalah bentuk ternormalisasi satu responden, sepadan dengan
   objek yang dihasilkan `normalizeAnswers()` di
   frontend/src/data/survey/normalize.js. Bedanya, `items` di sini sudah pasti
   bilangan bulat 1-4 sebanyak butir instrumen (penyaringan dilakukan sebelum
   data masuk ke fungsi-fungsi di folder ini).
*/

export interface BarisJawaban {
  items: number[];
  terbuka?: string | null;
  kelompok?: string | null;
}

export interface ButirInfo {
  kode: string;
  nomor: number;
  label: string;
  teks: string;
}

export interface InstrumenInfo {
  slug: string;
  nama: string;
  nama_panjang: string;
  kategori: string;
  kelompok: string;
  jumlah_butir: number;
  punya_agregat: boolean;
  butir: ButirInfo[];
}

export interface Registri {
  instrumen: InstrumenInfo[];
  alias: Record<string, string>;
  ambang: Record<string, number>;
  skala: Array<{ nilai: number; label: string; singkat: string }>;
}
