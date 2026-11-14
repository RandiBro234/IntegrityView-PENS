/* Perakit konteks untuk chatbot: memilih instrumen yang relevan lalu menyusun
   JSON ringkas yang ditempelkan ke prompt.

   Aturan pemilihan (sama dengan 07-chatbot.md bagian 2):
     1. kode instrumen dari permintaan (frontend mengirim halaman yang dibuka)
     2. kode atau nama instrumen yang disebut di teks pertanyaan
     3. ringkasan semua instrumen

   Prinsip: yang masuk konteks HANYA angka agregat. Email responden, komentar
   terbuka mentah, dan data laporan tidak pernah ikut. */

import type { Agregat } from './statistik.ts';
import type { InstrumenInfo, Registri } from './tipe.ts';

export interface KonteksRingkasInstrumen {
  kode: string;
  nama: string;
  n: number;
  indeks_persepsi: number;
  skor_rata: number;
  butir_terendah: { kode: string; aspek: string; skor: number } | null;
  judul_rekomendasi: string[];
}

export interface KonteksSatuInstrumen {
  kode: string;
  nama: string;
  nama_panjang: string;
  periode: string;
  ringkasan: {
    n: number;
    indeks_persepsi: number;
    skor_rata: number;
    median_skor: number;
    sd_skor: number;
    interval_kepercayaan_95: { bawah: number; atas: number } | null;
    setuju_ss_persen: number;
    tidak_setuju_persen: number;
  };
  butir: Array<{
    kode: string;
    nomor: number;
    aspek: string;
    pernyataan: string;
    skor: number;
    setuju_ss_persen: number;
    tidak_setuju_persen: number;
  }>;
  rekomendasi: Array<{ prioritas: string; judul: string; dasar: string; kode_butir: string | null }>;
  tema: Array<{ label: string; jumlah_komentar: number }>;
  reliabilitas: { alpha: number | null; catatan: string | null };
  kecukupan_sampel: { n: number; minimum: number; cukup: boolean };
  kualitas_data: {
    seragam_persen: number;
    komentar_terbuka: number;
    komentar_ditahan: number;
    duplikat: number;
    dibuang: number;
  };
}

export interface KonteksSemua {
  cakupan: 'semua-instrumen';
  periode: string;
  jumlah_instrumen: number;
  /* Rata-rata seluruh instrumen, dihitung sama seperti dashboard: rata-rata
     tidak tertimbang dari indeks tiap instrumen (bukan rata-rata tertimbang
     jumlah responden). */
  ringkasan_keseluruhan: {
    indeks_persepsi: number;
    skor_rata: number;
    jumlah_instrumen: number;
    responden_unik: number;
  };
  instrumen: KonteksRingkasInstrumen[];
}

export type Konteks = KonteksSatuInstrumen | KonteksSemua;

/* Indeks 0-100 dipakai di perhitungan, tetapi dashboard menampilkan skala 1-4
   (lihat frontend/src/lib/formatSkor.js). Chatbot harus bicara dalam skala yang
   sama dengan grafik, kalau tidak angkanya akan terlihat berbeda dari yang
   dibaca pengguna. */
const PEMBAGI_INDEKS = 25;

function keSkor(indeks: number): number {
  return indeks / PEMBAGI_INDEKS;
}

function bulat(nilai: number, desimal = 2): number {
  return Number(nilai.toFixed(desimal));
}

/* Cari instrumen yang disebut di pertanyaan. Cocokkan nama pendek, nama
   panjang, dan slug, dengan batas kata supaya "5r" tidak tertangkap di dalam
   kata lain. Bila beberapa cocok, ambil yang namanya paling panjang (paling
   spesifik). */
function cariInstrumenDiTeks(pertanyaan: string, registri: Registri): InstrumenInfo | null {
  const teks = pertanyaan.toLowerCase();
  let terbaik: { info: InstrumenInfo; panjang: number } | null = null;

  for (const info of registri.instrumen) {
    if (!info.punya_agregat) continue;
    for (const nama of [info.nama, info.nama_panjang, info.slug]) {
      if (!nama) continue;
      const aman = nama.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pola = new RegExp(`(?<![a-z0-9])${aman}(?![a-z0-9])`, 'i');
      if (pola.test(teks) && (!terbaik || nama.length > terbaik.panjang)) {
        terbaik = { info, panjang: nama.length };
      }
    }
  }
  return terbaik?.info ?? null;
}

export function pilihInstrumen(
  pertanyaan: string,
  instrumenDariRequest: string | null | undefined,
  registri: Registri
): InstrumenInfo | null {
  if (instrumenDariRequest) {
    const kunci = instrumenDariRequest.trim().toLowerCase();
    const langsung = registri.instrumen.find(
      (i) => i.punya_agregat && (i.slug === kunci || i.nama.toLowerCase() === kunci)
    );
    if (langsung) return langsung;
    /* Terima juga alias nama_instrumen dari database (mis. "Whistleblowing System"). */
    const slugAlias = registri.alias[kunci.replace(/[^a-z0-9]/g, '')];
    if (slugAlias) {
      const viaAlias = registri.instrumen.find((i) => i.slug === slugAlias && i.punya_agregat);
      if (viaAlias) return viaAlias;
    }
  }

  return cariInstrumenDiTeks(pertanyaan, registri);
}

export function rakitKonteksSatu(
  agregat: Agregat,
  instrumen: InstrumenInfo,
  ambang: Record<string, number>,
  rekomendasi: KonteksSatuInstrumen['rekomendasi'] = []
): KonteksSatuInstrumen {
  const minimum = ambang.respondenMinimum ?? 30;

  return {
    kode: instrumen.nama,
    nama: instrumen.nama,
    nama_panjang: instrumen.nama_panjang,
    periode: agregat.periode,
    ringkasan: {
      n: agregat.n,
      /* Dua skala sengaja dikirim: dashboard menampilkan Indeks Persepsi
         Integritas 0-100 di kartu utama, tetapi detail butir memakai skala
         asli 1-4. Tanpa keduanya, chatbot akan menyebut angka yang tidak sama
         dengan yang dilihat pengguna di layar. */
      indeks_persepsi: bulat(agregat.indeks, 1),
      skor_rata: bulat(keSkor(agregat.indeks), 2),
      median_skor: bulat(keSkor(agregat.median), 2),
      sd_skor: bulat(keSkor(agregat.sd), 2),
      interval_kepercayaan_95: agregat.ci
        ? { bawah: bulat(keSkor(agregat.ci.bawah), 2), atas: bulat(keSkor(agregat.ci.atas), 2) }
        : null,
      setuju_ss_persen: bulat(agregat.setuju, 1),
      tidak_setuju_persen: bulat(100 - agregat.setuju, 1)
    },
    butir: agregat.butir.map((b) => ({
      kode: b.kode,
      nomor: b.nomor,
      aspek: b.label,
      pernyataan: b.teks,
      skor: bulat(b.rata, 2),
      setuju_ss_persen: bulat(b.persenSetuju, 1),
      tidak_setuju_persen: bulat(b.persenNegatif, 1)
    })),
    rekomendasi,
    tema: agregat.kualitas.tema.map((t) => ({ label: t.tema, jumlah_komentar: t.jumlah })),
    reliabilitas: {
      alpha: agregat.alpha == null ? null : bulat(agregat.alpha, 3),
      catatan: agregat.alphaCatatan
    },
    kecukupan_sampel: { n: agregat.n, minimum, cukup: agregat.n >= minimum },
    kualitas_data: {
      seragam_persen: bulat(agregat.kualitas.seragam, 1),
      komentar_terbuka: agregat.kualitas.terbuka,
      komentar_ditahan: agregat.kualitas.tertahan,
      duplikat: agregat.kualitas.duplikat,
      dibuang: agregat.kualitas.dibuang
    }
  };
}

export function rakitKonteksSemua(
  daftar: Array<{ agregat: Agregat; instrumen: InstrumenInfo; judulRekomendasi?: string[] }>,
  respondenUnik = 0
): KonteksSemua {
  const indeksRata = daftar.length
    ? daftar.reduce((a, d) => a + d.agregat.indeks, 0) / daftar.length
    : 0;

  return {
    cakupan: 'semua-instrumen',
    periode: daftar[0]?.agregat.periode ?? '',
    jumlah_instrumen: daftar.length,
    ringkasan_keseluruhan: {
      indeks_persepsi: bulat(indeksRata, 1),
      skor_rata: bulat(keSkor(indeksRata), 2),
      jumlah_instrumen: daftar.length,
      responden_unik: respondenUnik
    },
    instrumen: daftar.map(({ agregat, instrumen, judulRekomendasi }) => {
      const terendah = agregat.butirTerendah;
      return {
        kode: instrumen.nama,
        nama: instrumen.nama,
        n: agregat.n,
        indeks_persepsi: bulat(agregat.indeks, 1),
        skor_rata: bulat(keSkor(agregat.indeks), 2),
        butir_terendah: terendah
          ? { kode: terendah.kode, aspek: terendah.label, skor: bulat(terendah.rata, 2) }
          : null,
        judul_rekomendasi: judulRekomendasi ?? []
      };
    })
  };
}

/* Ukuran konteks dijaga tetap kecil: prompt yang membengkak menaikkan biaya
   sekaligus memperbesar peluang model melewatkan angka penting. */
export function ukuranKonteks(konteks: Konteks): number {
  return JSON.stringify(konteks).length;
}
