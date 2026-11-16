/* Pembobotan TF-IDF.

   Tujuan: setiap komentar diwakili vektor angka, sehingga kemiripan antar
   komentar bisa dihitung. Kata yang muncul di semua komentar (mis. "layanan")
   otomatis berbobot rendah; kata yang khas di sedikit komentar berbobot tinggi.

   Rumus yang dipakai:
     TF  = jumlah kemunculan kata di dokumen / jumlah token dokumen
     IDF = ln(N / (1 + df)) + 1        (df = jumlah dokumen yang memuat kata)
     bobot = TF x IDF, lalu vektor dinormalkan ke panjang 1

   Normalisasi ke panjang 1 membuat kemiripan kosinus cukup dihitung dengan
   dot product, dan mencegah komentar panjang mendominasi komentar pendek.

   Modul ini murni (tanpa Deno/node API) supaya bisa dites dengan Node.
*/

export interface HasilTfIdf {
  /* Satu vektor per dokumen, panjangnya sama dengan `kosakata`. */
  vektor: number[][];
  kosakata: string[];
  /* Peta kata -> indeks kolom, untuk menelusuri kata penting per klaster. */
  indeks: Map<string, number>;
}

export function hitungTfIdf(dokumen: string[][]): HasilTfIdf {
  const jumlahDokumen = dokumen.length;

  /* Hitung frekuensi per dokumen dan frekuensi dokumen (df). */
  const df = new Map<string, number>();
  const tfPerDokumen: Map<string, number>[] = [];

  for (const tokens of dokumen) {
    const tf = new Map<string, number>();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
    tfPerDokumen.push(tf);
    for (const kata of tf.keys()) df.set(kata, (df.get(kata) ?? 0) + 1);
  }

  const kosakata = [...df.keys()].sort();
  const indeks = new Map<string, number>();
  kosakata.forEach((kata, i) => indeks.set(kata, i));

  const vektor = tfPerDokumen.map((tf) => {
    const baris = new Array<number>(kosakata.length).fill(0);
    const totalToken = [...tf.values()].reduce((a, b) => a + b, 0) || 1;

    for (const [kata, jumlah] of tf) {
      const kolom = indeks.get(kata);
      if (kolom === undefined) continue;
      const idf = Math.log(jumlahDokumen / (1 + (df.get(kata) ?? 1))) + 1;
      baris[kolom] = (jumlah / totalToken) * idf;
    }

    /* Normalkan ke panjang 1. Dokumen tanpa kata berguna dibiarkan nol. */
    const panjang = Math.sqrt(baris.reduce((a, v) => a + v * v, 0));
    if (panjang > 0) for (let i = 0; i < baris.length; i++) baris[i] /= panjang;
    return baris;
  });

  return { vektor, kosakata, indeks };
}

/* Kemiripan kosinus. Karena vektor sudah dinormalkan, cukup dot product. */
export function kemiripan(a: number[], b: number[]): number {
  let hasil = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) hasil += a[i] * b[i];
  return hasil;
}

/* Kata dengan bobot terbesar pada sebuah vektor (centroid klaster). */
export function kataTeratas(
  vektor: number[],
  kosakata: string[],
  jumlah = 5
): Array<{ kata: string; bobot: number }> {
  return vektor
    .map((bobot, i) => ({ kata: kosakata[i], bobot }))
    .filter((x) => x.bobot > 0)
    .sort((a, b) => b.bobot - a.bobot)
    .slice(0, jumlah);
}
