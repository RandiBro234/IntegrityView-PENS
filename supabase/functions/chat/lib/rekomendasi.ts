/* Port dari frontend/src/data/survey/recommendations.js.

   Rekomendasi di sini dipakai chatbot sebagai konteks, jadi isinya harus sama
   dengan yang tampil di dashboard. Ambang batas tidak ditulis di file ini:
   nilainya dibaca dari `instrumen.json` (hasil generate), yang mengambil
   `AMBANG` dari instrumentConfig.js.
*/

import type { Agregat } from './statistik.ts';

export interface Rekomendasi {
  prioritas: 'Tinggi' | 'Sedang' | 'Pantau';
  judul: string;
  dasar: string;
  kode_butir: string | null;
}

export interface PerubahanButir {
  kode: string;
  label: string;
  delta: number | null;
}

export function arahPerubahan(delta: number | null, deltaStabil: number): string | null {
  if (delta == null || Number.isNaN(delta)) return null;
  const bulat = Math.round(delta * 10) / 10;
  if (bulat >= deltaStabil) return 'naik';
  if (bulat <= -deltaStabil) return 'turun';
  return 'stabil';
}

export function getDelta(aktif: number | null, pembanding: number | null): number | null {
  if (aktif == null || pembanding == null) return null;
  return Math.round((aktif - pembanding) * 10) / 10;
}

export function rekomendasiUntuk(
  agregatAktif: Agregat | null,
  agregatBanding: Agregat | null,
  perubahanButir: PerubahanButir[],
  ambang: Record<string, number>
): Rekomendasi[] {
  if (!agregatAktif) return [];
  const daftar: Rekomendasi[] = [];
  const k = agregatAktif.jumlahButir;

  agregatAktif.butir.forEach((b) => {
    const tinggi = b.rata < ambang.rataRataTinggi || b.persenNegatif >= ambang.negatifTinggi;
    const pantau =
      !tinggi &&
      (b.rata <= ambang.rataRataPantau ||
        (b.persenNegatif >= ambang.negatifPantau && b.persenNegatif < ambang.negatifTinggi));
    if (!tinggi && !pantau) return;
    daftar.push({
      prioritas: tinggi ? 'Tinggi' : 'Pantau',
      judul: `Perkuat aspek ${b.label}`,
      dasar:
        `rata-rata ${b.rata.toFixed(2).replace('.', ',')}, terendah dari ${k} butir` +
        (b.persenNegatif >= ambang.negatifPantau
          ? `; ${b.persenNegatif.toFixed(1).replace('.', ',')}% menjawab 1-2`
          : ''),
      kode_butir: b.kode
    });
  });

  if (agregatBanding) {
    const delta = getDelta(agregatAktif.indeks, agregatBanding.indeks);
    const ciTidakTumpang =
      agregatAktif.ci &&
      agregatBanding.ci &&
      (agregatAktif.ci.bawah > agregatBanding.ci.atas || agregatBanding.ci.bawah > agregatAktif.ci.atas);
    const nCukup = agregatAktif.n >= ambang.respondenMinimum && agregatBanding.n >= ambang.respondenMinimum;
    if (nCukup && delta != null && Math.abs(delta) >= ambang.perubahanBermakna && ciTidakTumpang) {
      const turun = perubahanButir.find((x) => x.delta != null && x.delta < 0);
      daftar.push({
        prioritas: delta < 0 ? 'Tinggi' : 'Pantau',
        judul: delta < 0 ? `Telusuri penurunan skor ${agregatAktif.slug}` : 'Pertahankan praktik yang berjalan',
        dasar:
          `selisih ${Math.abs(delta).toFixed(1).replace('.', ',')} poin` +
          (turun ? `; penurunan terbesar pada ${turun.label}` : ''),
        kode_butir: turun ? turun.kode : null
      });
    }
    if (!nCukup) {
      daftar.push({
        prioritas: 'Sedang',
        judul: 'Perbandingan belum dapat diandalkan',
        dasar: `n ${agregatAktif.n} dan ${agregatBanding.n}; minimum ${ambang.respondenMinimum} per semester`,
        kode_butir: null
      });
    }
  }

  const urutan: Record<string, number> = { Tinggi: 0, Sedang: 1, Pantau: 2 };
  daftar.sort((a, b) => urutan[a.prioritas] - urutan[b.prioritas]);
  return daftar;
}
