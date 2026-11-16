/* Inti perhitungan rekomendasi jawaban terbuka.

   Dipisah dari `index.ts` supaya bisa dites dengan Node tanpa Deno.serve:
   database dan model bahasa dioper sebagai parameter, bukan diimpor langsung.

   Alur satu kombinasi:
     ambil komentar -> klasterisasi -> saran per kelompok -> simpan -> bersihkan
     penanda (atau tunda bila masih ada kelompok tanpa saran).
*/

import { LlmTidakTersedia } from '../../_shared/llm.ts';
import { ambilKomentar, type KlienRpc } from './sumber.ts';
import { bentukKelompok, prioritasDari } from './kelompok.ts';
import { hashMasukan, susunPrompt, uraiSaran } from './saran.ts';

export interface KlienDb extends KlienRpc {
  from(tabel: string): any;
}

export interface Penanda {
  nama_instrumen: string;
  periode: string;
  ditandai_pada: string;
}

export interface AnggaranSaran {
  sisa: number;
}

export interface Ringkasan {
  instrumen: string;
  periode: string;
  kelompok: number;
  komentar: number;
  tanpa_kata: number;
  silhouette: number | null;
  saran_baru: number;
  galat_saran: string[];
}

export interface HasilJalan {
  diproses: Ringkasan[];
  gagal: Array<{ instrumen: string; periode: string; pesan: string }>;
  sisa_kuota_saran: number;
  masih_kotor: 'mungkin' | 'tidak';
}

/* Fungsi pemanggil model bahasa. Di produksi diisi tanyaLlm; di tes diisi stub. */
export type Tanya = (pesan: { system: string; user: string }) => Promise<string>;

export async function ambilPenanda(db: KlienDb, batas: number): Promise<Penanda[]> {
  const { data, error } = await db
    .from('rekomendasi_kotor')
    .select('nama_instrumen, periode, ditandai_pada')
    .order('ditandai_pada', { ascending: true })
    .limit(batas);

  if (error) throw new Error(`gagal membaca penanda: ${error.message}`);
  return (data ?? []) as Penanda[];
}

interface BarisRekomendasi {
  label: string;
  judul: string | null;
  hash_masukan: string;
  saran_langkah: string | null;
}

async function saranTersimpan(
  db: KlienDb,
  instrumen: string,
  periode: string
): Promise<Map<string, BarisRekomendasi>> {
  const { data, error } = await db
    .from('rekomendasi_terbuka')
    .select('label, judul, hash_masukan, saran_langkah')
    .eq('nama_instrumen', instrumen)
    .eq('periode', periode);

  if (error) throw new Error(`gagal membaca rekomendasi lama: ${error.message}`);

  const peta = new Map<string, BarisRekomendasi>();
  for (const row of (data ?? []) as BarisRekomendasi[]) {
    if (row.hash_masukan) peta.set(row.label, row);
  }
  return peta;
}

async function susunSaran(
  instrumen: string,
  periode: string,
  kelompok: { label: string; jumlah: number; porsi: number; kata_kunci: string[] },
  anggaran: AnggaranSaran,
  galat: string[],
  tanya: Tanya
): Promise<{ judul: string | null; saran: string | null }> {
  if (anggaran.sisa <= 0) return { judul: null, saran: null };
  anggaran.sisa -= 1;

  try {
    const teks = await tanya(susunPrompt({ instrumen, periode, kelompok }));
    return uraiSaran(teks);
  } catch (err) {
    /* Model bahasa gagal bukan alasan menggagalkan seluruh perhitungan:
       kelompok tetap disimpan tanpa saran, dan akan dicoba lagi lain waktu
       karena hash_masukan dibiarkan kosong. */
    const alasan = err instanceof LlmTidakTersedia ? err.message : 'galat tidak dikenal';
    console.warn(`hitung-rekomendasi: saran LLM gagal untuk ${instrumen} ${periode}: ${alasan}`);
    galat.push(`${kelompok.label}: ${alasan}`);
    return { judul: null, saran: null };
  }
}

export async function prosesSatu(
  db: KlienDb,
  penanda: Penanda,
  anggaran: AnggaranSaran,
  tanya: Tanya
): Promise<Ringkasan> {
  const instrumen = penanda.nama_instrumen;
  const periode = penanda.periode;

  const komentar = await ambilKomentar(db, instrumen, periode);
  const hasil = bentukKelompok(komentar);
  const lama = await saranTersimpan(db, instrumen, periode);

  const baris: Record<string, unknown>[] = [];
  const galatSaran: string[] = [];
  let saranBaru = 0;

  for (const kelompok of hasil.kelompok) {
    const tersimpan = lama.get(kelompok.label);

    let judul: string | null = null;
    let saran: string | null = null;
    let hash: string | null = null;

    if (tersimpan) {
      /* Hash lama dihitung dengan judul lama. Bila isi kelompok tidak berubah,
         judul dan saran lama masih berlaku. */
      const hashLama = await hashMasukan(
        tersimpan.judul,
        kelompok.label,
        kelompok.jumlah,
        kelompok.kata_kunci
      );
      if (hashLama === tersimpan.hash_masukan) {
        judul = tersimpan.judul;
        saran = tersimpan.saran_langkah;
        hash = hashLama;
      }
    }

    if (!saran) {
      const baru = await susunSaran(instrumen, periode, kelompok, anggaran, galatSaran, tanya);
      judul = baru.judul;
      saran = baru.saran;
      if (saran) {
        hash = await hashMasukan(judul, kelompok.label, kelompok.jumlah, kelompok.kata_kunci);
        saranBaru += 1;
      }
    }

    baris.push({
      label: kelompok.label,
      /* Judul cadangan dipakai bila model bahasa tidak tersedia, supaya kartu
         tetap terbaca dan tidak kosong. */
      judul: judul || `Perkuat aspek ${kelompok.label.toLowerCase()}`,
      prioritas: prioritasDari(kelompok.porsi),
      jumlah: kelompok.jumlah,
      porsi: Math.round(kelompok.porsi * 10000) / 10000,
      kata_kunci: kelompok.kata_kunci,
      /* Hash hanya disimpan bila saran benar-benar ada, supaya kelompok yang
         gagal memanggil model bahasa dicoba lagi pada jalan berikutnya. */
      saran_langkah: saran,
      hash_masukan: saran ? hash : null,
      silhouette: hasil.silhouette,
      jumlah_komentar: hasil.jumlahKomentar,
      jumlah_unik: hasil.jumlahUnik,
      jumlah_tanpa_kata: hasil.tanpaKata
    });
  }

  const { error: galatSimpan } = await db.rpc('ganti_rekomendasi_terbuka', {
    p_instrumen: instrumen,
    p_periode: periode,
    p_baris: baris
  });
  if (galatSimpan) throw new Error(`gagal menyimpan rekomendasi: ${galatSimpan.message}`);

  /* Bila ada kelompok yang belum mendapat saran (model bahasa gagal atau kuota
     jalan ini habis), penanda tidak dihapus melainkan dimundurkan. Tanpa ini,
     kelompok tersebut tidak akan pernah dicoba lagi karena tidak ada data baru
     yang memicunya. Dimundurkan, bukan dibiarkan, supaya ia tidak selalu berada
     di urutan terdepan dan menghalangi kombinasi lain. */
  const perluUlang = galatSaran.length > 0 || baris.some((b) => !b.saran_langkah);

  if (perluUlang) {
    const { error: galatTunda } = await db
      .from('rekomendasi_kotor')
      .update({ ditandai_pada: new Date().toISOString() })
      .eq('nama_instrumen', instrumen)
      .eq('periode', periode)
      .lte('ditandai_pada', penanda.ditandai_pada);

    if (galatTunda) throw new Error(`gagal menunda penanda: ${galatTunda.message}`);
  } else {
    /* Hapus penanda hanya sampai waktu baca. Baris yang masuk saat perhitungan
       berjalan punya tanda lebih baru dan tetap kotor, jadi tidak hilang. */
    const { error: galatBersih } = await db
      .from('rekomendasi_kotor')
      .delete()
      .eq('nama_instrumen', instrumen)
      .eq('periode', periode)
      .lte('ditandai_pada', penanda.ditandai_pada);

    if (galatBersih) throw new Error(`gagal membersihkan penanda: ${galatBersih.message}`);
  }

  return {
    instrumen,
    periode,
    kelompok: baris.length,
    komentar: hasil.jumlahKomentar,
    tanpa_kata: hasil.tanpaKata,
    silhouette: hasil.silhouette,
    saran_baru: saranBaru,
    galat_saran: galatSaran
  };
}

export async function jalankanProses(
  db: KlienDb,
  opsi: { batas: number; maksSaran: number },
  tanya: Tanya
): Promise<HasilJalan> {
  const penanda = await ambilPenanda(db, opsi.batas);
  const anggaran: AnggaranSaran = { sisa: opsi.maksSaran };

  const diproses: Ringkasan[] = [];
  const gagal: HasilJalan['gagal'] = [];

  for (const satu of penanda) {
    try {
      diproses.push(await prosesSatu(db, satu, anggaran, tanya));
    } catch (err) {
      gagal.push({
        instrumen: satu.nama_instrumen,
        periode: satu.periode,
        pesan: err instanceof Error ? err.message : 'galat tidak dikenal'
      });
    }
  }

  return {
    diproses,
    gagal,
    sisa_kuota_saran: anggaran.sisa,
    masih_kotor: penanda.length === opsi.batas ? 'mungkin' : 'tidak'
  };
}
