/* Cache sederhana dengan masa berlaku, untuk data yang mahal diambil.

   Kenapa perlu: satu permintaan chatbot menarik seluruh baris survei
   (>7.000 baris, 8 request berurutan ke Supabase). Tanpa cache, setiap
   pertanyaan mengulang semuanya.

   Dua hal yang dijaga:
   1. Masa berlaku, supaya data tidak basi terlalu lama.
   2. Permintaan bersamaan berbagi satu pengambilan. Tanpa ini, tiga pengguna
      yang bertanya pada saat cache kosong akan memicu tiga pengambilan
      sekaligus — persis beban yang ingin dihindari.

   Modul ini murni (tanpa Deno/node API) supaya bisa dites dengan Node.
*/

export interface OpsiCache<T> {
  umurMs: number;
  ambil: () => Promise<T>;
  /* Bisa diganti saat tes supaya waktu tidak perlu ditunggu. */
  sekarang?: () => number;
}

export function buatCache<T>(opsi: OpsiCache<T>): () => Promise<T> {
  const sekarang = opsi.sekarang ?? (() => Date.now());
  let isi: { waktu: number; nilai: T } | null = null;
  let sedang: Promise<T> | null = null;

  return async function ambilDenganCache(): Promise<T> {
    if (isi && sekarang() - isi.waktu < opsi.umurMs) return isi.nilai;

    /* Sudah ada pengambilan berjalan: ikut menunggu, jangan menambah beban. */
    if (sedang) return sedang;

    sedang = opsi
      .ambil()
      .then((nilai) => {
        isi = { waktu: sekarang(), nilai };
        return nilai;
      })
      .finally(() => {
        sedang = null;
      });

    return sedang;
  };
}
