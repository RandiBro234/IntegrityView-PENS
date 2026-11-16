/* Klasterisasi k-means untuk vektor TF-IDF.

   Kenapa k-means: sederhana, deterministik bila benih acaknya tetap, dan
   hasilnya mudah dijelaskan — setiap klaster punya titik pusat yang bisa
   diterjemahkan menjadi daftar kata teratas.

   Inisialisasi memakai k-means++ (menyebar titik awal), lalu iterasi
   Lloyd sampai label tidak berubah atau batas iterasi tercapai.

   Jumlah klaster tidak ditentukan pengguna: `pilihK` mencoba beberapa nilai
   dan memilih yang silhouette score-nya tertinggi.

   Modul ini murni (tanpa Deno/node API) supaya bisa dites dengan Node.
*/

import { kemiripan } from './tfidf.ts';

/* Generator berbenih supaya hasil selalu sama untuk masukan yang sama. */
function prng(benih: number): () => number {
  let s = benih >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function jarakKuadrat(a: number[], b: number[]): number {
  let hasil = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    hasil += d * d;
  }
  return hasil;
}

function pusat(anggota: number[][]): number[] {
  if (!anggota.length) return [];
  const hasil = new Array<number>(anggota[0].length).fill(0);
  for (const v of anggota) for (let i = 0; i < v.length; i++) hasil[i] += v[i];
  for (let i = 0; i < hasil.length; i++) hasil[i] /= anggota.length;
  return hasil;
}

/* Inisialisasi k-means++: titik awal pertama acak, sisanya dipilih dengan
   peluang sebanding jarak kuadrat ke pusat terdekat. */
function pilihPusatAwal(vektor: number[][], k: number, acak: () => number): number[][] {
  const pusatList: number[][] = [vektor[Math.floor(acak() * vektor.length)]];

  while (pusatList.length < k) {
    const jarak = vektor.map((v) => {
      let terdekat = Infinity;
      for (const p of pusatList) terdekat = Math.min(terdekat, jarakKuadrat(v, p));
      return terdekat;
    });

    const total = jarak.reduce((a, b) => a + b, 0);
    if (total === 0) {
      /* Semua dokumen identik: tidak ada titik yang lebih baik. */
      pusatList.push(vektor[Math.floor(acak() * vektor.length)]);
      continue;
    }

    let sasaran = acak() * total;
    let terpilih = 0;
    for (let i = 0; i < jarak.length; i++) {
      sasaran -= jarak[i];
      if (sasaran <= 0) {
        terpilih = i;
        break;
      }
    }
    pusatList.push(vektor[terpilih]);
  }

  return pusatList;
}

export interface HasilKlaster {
  label: number[];
  pusat: number[][];
  iterasi: number;
  /* Jumlah kuadrat jarak tiap dokumen ke pusat klasternya. Semakin kecil
     semakin rapat. Dipakai memilih hasil terbaik antar percobaan. */
  inertia: number;
}

/* Satu kali jalan k-means dari titik awal tertentu. */
function satuKaliJalan(
  vektor: number[][],
  kEfektif: number,
  acak: () => number,
  maksIterasi: number
): HasilKlaster {
  let pusatList = pilihPusatAwal(vektor, kEfektif, acak);
  const label = new Array<number>(vektor.length).fill(0);
  let iterasi = 0;

  for (let putaran = 0; putaran < maksIterasi; putaran++) {
    iterasi = putaran + 1;
    let berubah = false;

    /* Langkah 1: tetapkan tiap dokumen ke pusat terdekat. */
    for (let i = 0; i < vektor.length; i++) {
      let terbaik = 0;
      let jarakTerbaik = Infinity;
      for (let c = 0; c < pusatList.length; c++) {
        const d = jarakKuadrat(vektor[i], pusatList[c]);
        if (d < jarakTerbaik) {
          jarakTerbaik = d;
          terbaik = c;
        }
      }
      if (label[i] !== terbaik) {
        label[i] = terbaik;
        berubah = true;
      }
    }

    if (!berubah) break;

    /* Langkah 2: hitung ulang pusat. Klaster kosong tetap dipertahankan. */
    const kelompok: number[][][] = pusatList.map(() => []);
    vektor.forEach((v, i) => kelompok[label[i]].push(v));
    pusatList = pusatList.map((lama, c) => (kelompok[c].length ? pusat(kelompok[c]) : lama));
  }

  const inertia = vektor.reduce((total, v, i) => total + jarakKuadrat(v, pusatList[label[i]] ?? []), 0);
  return { label, pusat: pusatList, iterasi, inertia };
}

/* k-means dengan beberapa percobaan. k-means++ bisa memilih dua titik awal
   dari kelompok yang sama, dan hasilnya berhenti di optimum lokal yang buruk.
   Menjalankan beberapa kali lalu mengambil inertia terkecil menghilangkan
   masalah itu — cara yang sama dipakai scikit-learn (n_init). */
export function kmeans(
  vektor: number[][],
  k: number,
  opsi: { benih?: number; maksIterasi?: number; ulang?: number } = {}
): HasilKlaster {
  const benih = opsi.benih ?? 42;
  const maksIterasi = opsi.maksIterasi ?? 100;
  const ulang = Math.max(1, opsi.ulang ?? 8);

  if (!vektor.length) return { label: [], pusat: [], iterasi: 0, inertia: 0 };
  const kEfektif = Math.max(1, Math.min(k, vektor.length));

  let terbaik: HasilKlaster | null = null;
  for (let percobaan = 0; percobaan < ulang; percobaan++) {
    const hasil = satuKaliJalan(vektor, kEfektif, prng(benih + percobaan * 7919), maksIterasi);
    if (!terbaik || hasil.inertia < terbaik.inertia) terbaik = hasil;
  }

  return terbaik!;
}

/* Silhouette score rata-rata. Rentang -1..1; makin tinggi makin terpisah.
   Biaya O(n^2), jadi pemanggil harus membatasi jumlah dokumen. */
export function silhouette(vektor: number[][], label: number[]): number | null {
  const n = vektor.length;
  if (n < 3) return null;

  const unik = new Set(label);
  if (unik.size < 2) return null;

  const nilai: number[] = [];

  for (let i = 0; i < n; i++) {
    const kelompokSendiri = label[i];

    /* a = rata-rata jarak ke anggota klaster sendiri (selain dirinya). */
    let jumlahSendiri = 0;
    let cacahSendiri = 0;
    const jumlahLain = new Map<number, number>();
    const cacahLain = new Map<number, number>();

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      /* Pakai jarak kosinus: 1 - kemiripan. */
      const d = 1 - kemiripan(vektor[i], vektor[j]);
      if (label[j] === kelompokSendiri) {
        jumlahSendiri += d;
        cacahSendiri += 1;
      } else {
        jumlahLain.set(label[j], (jumlahLain.get(label[j]) ?? 0) + d);
        cacahLain.set(label[j], (cacahLain.get(label[j]) ?? 0) + 1);
      }
    }

    if (!cacahSendiri) continue;
    const a = jumlahSendiri / cacahSendiri;

    /* b = rata-rata jarak terendah ke klaster lain. */
    let b = Infinity;
    for (const [c, jumlah] of jumlahLain) {
      b = Math.min(b, jumlah / (cacahLain.get(c) ?? 1));
    }
    if (!Number.isFinite(b)) continue;

    const s = (b - a) / Math.max(a, b);
    if (Number.isFinite(s)) nilai.push(s);
  }

  if (!nilai.length) return null;
  return nilai.reduce((x, y) => x + y, 0) / nilai.length;
}

export interface HasilPilihK {
  k: number;
  label: number[];
  pusat: number[][];
  silhouette: number | null;
}

/* Coba k dari 2 sampai `maksK`, pilih silhouette tertinggi.
   Bila tidak ada yang menghasilkan silhouette (mis. semua dokumen identik),
   kembalikan k=1 sebagai keadaan "satu kelompok saja". */
/* Silhouette cenderung memilih jumlah klaster besar pada data sedikit, karena
   klaster kecil selalu terlihat "rapat". Syarat ukuran minimum mencegah satu
   atau dua komentar berdiri sebagai klaster sendiri. */
function ukuranMinimum(n: number): number {
  return Math.max(3, Math.ceil(n * 0.05));
}

export function pilihK(
  vektor: number[][],
  opsi: { maksK?: number; benih?: number } = {}
): HasilPilihK {
  const maksK = opsi.maksK ?? 5;
  const benih = opsi.benih ?? 42;

  if (vektor.length < 3) {
    const satu = kmeans(vektor, 1, { benih });
    return { k: 1, label: satu.label, pusat: satu.pusat, silhouette: null };
  }

  const minimum = ukuranMinimum(vektor.length);
  let terbaik: HasilPilihK | null = null;

  for (let k = 2; k <= Math.min(maksK, vektor.length - 1); k++) {
    /* Lewati k yang memaksa klaster lebih kecil dari batas. */
    if (vektor.length < k * minimum) continue;

    const hasil = kmeans(vektor, k, { benih });
    const cacah = new Array<number>(k).fill(0);
    hasil.label.forEach((l) => (cacah[l] += 1));
    if (cacah.some((c) => c < minimum)) continue;

    const skor = silhouette(vektor, hasil.label);
    if (skor == null) continue;
    if (!terbaik || (terbaik.silhouette ?? -2) < skor) {
      terbaik = { k, label: hasil.label, pusat: hasil.pusat, silhouette: skor };
    }
  }

  if (terbaik) return terbaik;

  const satu = kmeans(vektor, 1, { benih });
  return { k: 1, label: satu.label, pusat: satu.pusat, silhouette: null };
}
