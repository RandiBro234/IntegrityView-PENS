/* Rekomendasi dari jawaban terbuka (hasil klasterisasi Edge Function).

   Data dihitung di server dan disimpan di tabel rekomendasi_terbuka. Frontend
   hanya membaca lewat RPC `daftar_rekomendasi_terbuka`, yang tidak memuat teks
   komentar mentah — hanya label kelompok, kata kunci, jumlah, dan saran langkah.

   Hasil disimpan di memori modul, bukan localStorage: angka bisa berubah setiap
   kali Edge Function selesai menghitung, dan menyimpannya di perangkat berisiko
   menampilkan hasil basi setelah data baru masuk.
*/

import { useEffect, useSyncExternalStore } from 'react';
import { INSTRUMENTS } from '../instrumentConfig.js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const AWAL = {
  status: 'idle',
  versi: 0,
  baris: [],
  error: null
};

let keadaan = AWAL;
const pendengar = new Set();

function ubah(patch) {
  keadaan = { ...keadaan, ...patch, versi: keadaan.versi + 1 };
  pendengar.forEach((fn) => fn());
}

/* Peta nama instrumen di database -> slug frontend. Nama di database memakai
   `nama` dari instrumentConfig (mis. "PENS JOSS", "Budaya ZI"). */
const NAMA_KE_SLUG = new Map(INSTRUMENTS.map((i) => [i.nama.toLowerCase(), i.slug]));

export async function muatRekomendasiTerbuka() {
  if (keadaan.status === 'memuat' || keadaan.status === 'siap') return keadaan;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    ubah({ status: 'kosong', error: 'Supabase belum dikonfigurasi' });
    return keadaan;
  }

  ubah({ status: 'memuat', error: null });

  try {
    const headers = {
      apikey: SUPABASE_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    if (SUPABASE_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_KEY}`;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/daftar_rekomendasi_terbuka`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_instrumen: null, p_periode: null })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} saat membaca rekomendasi terbuka`);

    const data = await res.json();
    ubah({ status: 'siap', baris: Array.isArray(data) ? data : [], error: null });
  } catch (err) {
    /* Dashboard tetap tampil dengan rekomendasi skor saja. */
    ubah({ status: 'gagal', error: err instanceof Error ? err.message : 'gagal memuat' });
  }

  return keadaan;
}

export function snapshotRekomendasi() {
  return keadaan;
}

function langganan(fn) {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

/* Memicu pemuatan sekali dan mengembalikan keadaan terbaru. */
export function useRekomendasiTerbuka() {
  const keadaanSekarang = useSyncExternalStore(langganan, snapshotRekomendasi, snapshotRekomendasi);

  useEffect(() => {
    void muatRekomendasiTerbuka();
  }, []);

  return keadaanSekarang;
}

function persen(porsi) {
  return Math.round(Number(porsi) * 100);
}

/* Samakan kapitalisasi judul dari model bahasa: kalimat biasa, bukan Title Case.
   Dilakukan di tampilan supaya baris lama tidak perlu dihitung ulang. */
function judulRapi(teks) {
  const kata = String(teks || '').trim().split(/\s+/).filter(Boolean);
  if (!kata.length) return '';
  const hasil = kata
    .map((k, i) => (i === 0 || /^[A-Z]{2,}$/.test(k) ? k : k.toLowerCase()))
    .join(' ');
  return hasil.charAt(0).toUpperCase() + hasil.slice(1);
}

/* Rekomendasi komentar untuk satu instrumen pada satu periode, dalam bentuk
   yang sama dengan rekomendasi skor supaya bisa digabung di satu daftar. */
export function rekomendasiTerbukaUntuk(slugAtauNama, periode) {
  const kunci = String(slugAtauNama || '').toLowerCase();
  const slug = NAMA_KE_SLUG.get(kunci) ?? kunci;

  return keadaan.baris
    .filter((b) => {
      const slugBaris = NAMA_KE_SLUG.get(String(b.nama_instrumen || '').toLowerCase());
      return (slugBaris === slug || String(b.nama_instrumen || '').toLowerCase() === kunci)
        && b.periode === periode;
    })
    .map((b) => ({
      prioritas: b.prioritas,
      /* Judul dari model bahasa menyebut aspek dan masalahnya. Bila kosong
         (baris lama atau model gagal), pakai pola yang sama dengan rekomendasi
         skor supaya kartu tetap terbaca. */
      judul: judulRapi(b.judul) || `Perkuat aspek ${String(b.label || '').toLowerCase()}`,
      dasar: `${b.jumlah} komentar (${persen(b.porsi)}%) membahas topik ini`,
      saran: b.saran_langkah || null,
      sumber: 'komentar',
      jumlah: b.jumlah,
      porsi: Number(b.porsi),
      kataKunci: b.kata_kunci || [],
      /* Dipakai untuk menandai kelompok yang dibentuk dari sedikit kalimat
         berbeda (ciri data sintetis), supaya pembaca tidak menganggapnya
         sebagai ragam pendapat yang luas. */
      jumlahUnik: Number(b.jumlah_unik ?? 0),
      jumlahKomentar: Number(b.jumlah_komentar ?? 0),
      tanpaKata: Number(b.jumlah_tanpa_kata ?? 0)
    }));
}

/* Gabungkan dua sumber tanpa menghapus salah satunya: keduanya menjawab
   pertanyaan berbeda (butir mana yang lemah vs apa yang dikeluhkan).
   Di dalam prioritas yang sama, urutannya diselang-seling skor-komentar supaya
   kartu ringkasan yang hanya menampilkan tiga baris tetap memuat keduanya. */
export function gabungRekomendasi(daftarSkor, daftarKomentar) {
  const hasil = [];

  for (const prioritas of ['Tinggi', 'Sedang', 'Pantau']) {
    const skor = daftarSkor.filter((r) => r.prioritas === prioritas);
    const komentar = daftarKomentar.filter((r) => r.prioritas === prioritas);
    const jumlah = Math.max(skor.length, komentar.length);

    for (let i = 0; i < jumlah; i++) {
      if (skor[i]) hasil.push(skor[i]);
      if (komentar[i]) hasil.push(komentar[i]);
    }
  }

  /* Prioritas di luar tiga nilai baku tetap ditampilkan di akhir. */
  const dikenal = new Set(['Tinggi', 'Sedang', 'Pantau']);
  return hasil.concat(
    [...daftarSkor, ...daftarKomentar].filter((r) => !dikenal.has(r.prioritas))
  );
}
