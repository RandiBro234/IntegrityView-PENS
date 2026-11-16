/* Membentuk kelompok rekomendasi dari daftar komentar.

   Alur: dedup teks identik → praproses → TF-IDF → pilih k lewat silhouette →
   ambil kata teratas tiap pusat klaster → hitung porsi komentar.

   Komentar tanpa kata bermakna (mis. "sudah bagus") tidak dipaksa masuk
   klaster: vektornya nol, sehingga ia akan menempel ke klaster mana pun secara
   acak. Komentar seperti itu dihitung terpisah sebagai `tanpaKata` dan tidak
   dipakai sebagai penyebut porsi.

   Modul ini murni supaya bisa dites dengan Node.
*/

import { hitungTfIdf, kataTeratas } from './tfidf.ts';
import { pilihK } from './klaster.ts';
import { kataKapital, kataKunciUntukModel, praproses, tokenBermakna } from './teks.ts';

export interface Kelompok {
  label: string;
  /* Jumlah komentar (dengan pengulangan) yang masuk kelompok ini. */
  jumlah: number;
  /* Porsi terhadap komentar yang berhasil dikelompokkan, 0..1. */
  porsi: number;
  kata_kunci: string[];
  /* Indeks klaster asli, dipakai saat menelusuri hasil. */
  indeks: number;
}

export interface HasilKelompok {
  kelompok: Kelompok[];
  silhouette: number | null;
  k: number;
  /* Semua komentar yang masuk hitungan (setelah saringan sensitif). */
  jumlahKomentar: number;
  /* Jumlah teks yang berbeda sebelum dedup. */
  jumlahUnik: number;
  /* Komentar yang tidak punya kata bermakna, tidak dikelompokkan. */
  tanpaKata: number;
}

export interface OpsiKelompok {
  maksK?: number;
  benih?: number;
  maksKata?: number;
  sampelSilhouette?: number;
}

/* Bentuk kata yang paling sering muncul untuk tiap akar, supaya label terbaca
   sebagai "transparansi", bukan "transpar". */
function kamusPermukaan(teksList: string[]): Map<string, string> {
  const hitung = new Map<string, Map<string, number>>();

  for (const teks of teksList) {
    for (const { asal, akar } of tokenBermakna(teks)) {
      if (!hitung.has(akar)) hitung.set(akar, new Map());
      const perBentuk = hitung.get(akar)!;
      perBentuk.set(asal, (perBentuk.get(asal) ?? 0) + 1);
    }
  }

  const hasil = new Map<string, string>();
  for (const [akar, perBentuk] of hitung) {
    let terbaik = akar;
    let jumlahTerbaik = -1;
    for (const [asal, jumlah] of perBentuk) {
      if (jumlah > jumlahTerbaik || (jumlah === jumlahTerbaik && asal.length < terbaik.length)) {
        terbaik = asal;
        jumlahTerbaik = jumlah;
      }
    }
    hasil.set(akar, terbaik);
  }
  return hasil;
}

export function prioritasDari(porsi: number): 'Tinggi' | 'Sedang' | 'Pantau' {
  if (porsi >= 0.3) return 'Tinggi';
  if (porsi >= 0.15) return 'Sedang';
  return 'Pantau';
}

/* Label dari kata teratas, dirapikan agar tidak ada yang kosong. */
function labelDari(kata: string[]): string {
  if (!kata.length) return 'Topik umum';
  const teks = kata.join(', ');
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

export function bentukKelompok(komentar: string[], opsi: OpsiKelompok = {}): HasilKelompok {
  const maksK = opsi.maksK ?? 5;
  const benih = opsi.benih ?? 42;
  const maksKata = opsi.maksKata ?? 5;

  const unik = [...new Set(komentar)];
  const jumlahKomentar = komentar.length;

  /* Praproses sekali per teks unik, bukan per komentar: teks yang sama
     dijawab puluhan orang tidak perlu di-stem puluhan kali. */
  const tokenPerTeks = new Map<string, string[]>();
  for (const teks of unik) tokenPerTeks.set(teks, praproses(teks));

  const berisi = unik.filter((teks) => (tokenPerTeks.get(teks) ?? []).length > 0);
  const tanpaKata = komentar.filter((teks) => (tokenPerTeks.get(teks) ?? []).length === 0).length;

  if (berisi.length < 3) {
    return {
      kelompok: [],
      silhouette: null,
      k: 0,
      jumlahKomentar,
      jumlahUnik: unik.length,
      tanpaKata
    };
  }

  const dokumen = berisi.map((teks) => tokenPerTeks.get(teks)!);
  const { vektor, kosakata } = hitungTfIdf(dokumen);
  const hasil = pilihK(vektor, { maksK, benih, sampel: opsi.sampelSilhouette ?? 300 });

  /* Hitung komentar per klaster dengan pengulangan, bukan hanya teks unik:
     satu kalimat yang dijawab 30 orang adalah 30 keluhan, bukan satu. */
  const indeksUnik = new Map<string, number>();
  berisi.forEach((teks, i) => indeksUnik.set(teks, hasil.label[i]));

  const cacah = new Array<number>(Math.max(hasil.k, 1)).fill(0);
  for (const teks of komentar) {
    if ((tokenPerTeks.get(teks) ?? []).length === 0) continue;
    const label = indeksUnik.get(teks);
    if (label !== undefined) cacah[label] += 1;
  }

  const totalTerkelompok = cacah.reduce((a, b) => a + b, 0);
  if (totalTerkelompok === 0) {
    return {
      kelompok: [],
      silhouette: hasil.silhouette,
      k: 0,
      jumlahKomentar,
      jumlahUnik: unik.length,
      tanpaKata
    };
  }

  const permukaan = kamusPermukaan(berisi);
  const namaKapital = kataKapital(berisi);

  /* Gabungkan klaster yang kata kuncinya sama; desain melarang duplikasi
     di dalam rekomendasi komentar. */
  const gabungan = new Map<string, Kelompok>();

  for (let c = 0; c < hasil.pusat.length; c++) {
    if (!cacah[c]) continue;

    const atas = kataTeratas(hasil.pusat[c], kosakata, maksKata)
      .map((x) => permukaan.get(x.kata) ?? x.kata);

    const kataKunci = kataKunciUntukModel(atas, maksKata, namaKapital);
    const kunci = kataKunci.join('|') || `klaster-${c}`;

    const lama = gabungan.get(kunci);
    if (lama) {
      lama.jumlah += cacah[c];
      continue;
    }

    gabungan.set(kunci, {
      label: labelDari(kataKunci),
      jumlah: cacah[c],
      porsi: 0,
      kata_kunci: kataKunci,
      indeks: c
    });
  }

  const kelompok = [...gabungan.values()].sort((a, b) => b.jumlah - a.jumlah);
  for (const k of kelompok) k.porsi = k.jumlah / totalTerkelompok;

  return {
    kelompok,
    silhouette: hasil.silhouette,
    k: hasil.k,
    jumlahKomentar,
    jumlahUnik: unik.length,
    tanpaKata
  };
}
