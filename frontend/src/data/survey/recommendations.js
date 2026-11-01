import { AMBANG } from '../instrumentConfig.js';

export function arahPerubahan(delta) {
  if (delta == null || Number.isNaN(delta)) return null;
  const bulat = Math.round(delta * 10) / 10;
  if (bulat >= AMBANG.deltaStabil) return 'naik';
  if (bulat <= -AMBANG.deltaStabil) return 'turun';
  return 'stabil';
}

export function getDelta(aktif, pembanding) {
  if (aktif == null || pembanding == null) return null;
  return Math.round((aktif - pembanding) * 10) / 10;
}

/* ---------------------------------------------------------------------
   Rekomendasi
   --------------------------------------------------------------------- */
export function rekomendasiUntuk(agregatAktif, agregatBanding, perubahanButir) {
  if (!agregatAktif) return [];
  const daftar = [];
  const k = agregatAktif.jumlahButir;

  agregatAktif.butir.forEach((b) => {
    const tinggi = b.rata < AMBANG.rataRataTinggi || b.persenNegatif >= AMBANG.negatifTinggi;
    const pantau = !tinggi && (b.rata <= AMBANG.rataRataPantau || (b.persenNegatif >= AMBANG.negatifPantau && b.persenNegatif < AMBANG.negatifTinggi));
    if (!tinggi && !pantau) return;
    daftar.push({
      prioritas: tinggi ? 'Tinggi' : 'Pantau',
      judul: `Perkuat aspek ${b.label}`,
      dasar: `rata-rata ${b.rata.toFixed(2).replace('.', ',')}, terendah dari ${k} butir`
        + (b.persenNegatif >= AMBANG.negatifPantau ? `; ${b.persenNegatif.toFixed(1).replace('.', ',')}% menjawab 1-2` : '')
    });
  });

  if (agregatBanding) {
    const delta = getDelta(agregatAktif.indeks, agregatBanding.indeks);
    const ciTidakTumpang = agregatAktif.ci && agregatBanding.ci
      && (agregatAktif.ci.bawah > agregatBanding.ci.atas || agregatBanding.ci.bawah > agregatAktif.ci.atas);
    const nCukup = agregatAktif.n >= AMBANG.respondenMinimum && agregatBanding.n >= AMBANG.respondenMinimum;
    if (nCukup && Math.abs(delta) >= AMBANG.perubahanBermakna && ciTidakTumpang) {
      const turun = perubahanButir.find((x) => x.delta != null && x.delta < 0);
      daftar.push({
        prioritas: delta < 0 ? 'Tinggi' : 'Pantau',
        judul: delta < 0
          ? `Telusuri penurunan skor ${agregatAktif.slug}`
          : 'Pertahankan praktik yang berjalan',
        dasar: `selisih ${Math.abs(delta).toFixed(1).replace('.', ',')} poin`
          + (turun ? `; penurunan terbesar pada ${turun.label}` : '')
      });
    }
    if (!nCukup) {
      daftar.push({
        prioritas: 'Sedang',
        judul: 'Perbandingan belum dapat diandalkan',
        dasar: `n ${agregatAktif.n} dan ${agregatBanding.n}; minimum ${AMBANG.respondenMinimum} per semester`
      });
    }
  }

  const urutan = { Tinggi: 0, Sedang: 1, Pantau: 2 };
  daftar.sort((a, b) => urutan[a.prioritas] - urutan[b.prioritas]);
  return daftar;
}
