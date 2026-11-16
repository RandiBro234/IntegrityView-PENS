/* Tes integrasi alur hitung-rekomendasi tanpa Deno dan tanpa jaringan.

   Database dan model bahasa diganti objek palsu, sehingga yang diuji adalah
   keputusan alur: kapan menyimpan, kapan menghapus penanda, kapan menundanya,
   dan apa yang benar-benar dikirim ke model bahasa.

   Dijalankan: node --test supabase/functions/hitung-rekomendasi/tests/endpoint.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { jalankanProses } from '../lib/proses.ts';
import { hashMasukan } from '../lib/saran.ts';
import { LlmTidakTersedia } from '../../_shared/llm.ts';

const KOMENTAR = [
  'Prosedur pelaporan benturan kepentingan belum jelas',
  'Alur pelaporan benturan kepentingan berbelit',
  'Kanal pelaporan benturan kepentingan tidak diketahui',
  'Sarana dan fasilitas ruang kerja perlu diperbaiki',
  'Fasilitas ruang kerja kurang memadai',
  'Sarana pendukung kerja belum lengkap'
];

function barisKomentar(teks, i) {
  return {
    data_jawaban: { Komentar: teks },
    created_at: `2026-10-0${(i % 9) + 1}T02:00:00Z`,
    responden_hash: `hash-${i}`
  };
}

function buatDb({ kotor = [], komentar = [], lama = [] } = {}) {
  const catatan = { simpan: [], hapus: [], tunda: [] };

  const db = {
    rpc(nama, args) {
      if (nama === 'survey_komentar_safe') {
        const mulai = args.p_offset ?? 0;
        const batas = args.p_limit ?? 1000;
        return Promise.resolve({ data: komentar.slice(mulai, mulai + batas), error: null });
      }
      if (nama === 'ganti_rekomendasi_terbuka') {
        catatan.simpan.push(args);
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: { message: `rpc tak dikenal: ${nama}` } });
    },

    from(tabel) {
      if (tabel === 'rekomendasi_kotor') {
        return {
          select: () => ({
            order: () => ({
              limit: (n) => Promise.resolve({ data: kotor.slice(0, n), error: null })
            })
          }),
          delete: () => ({
            eq: () => ({
              eq: () => ({
                lte: (k, v) => {
                  catatan.hapus.push({ k, v });
                  return Promise.resolve({ data: null, error: null });
                }
              })
            })
          }),
          update: (patch) => ({
            eq: () => ({
              eq: () => ({
                lte: (k, v) => {
                  catatan.tunda.push({ patch, k, v });
                  return Promise.resolve({ data: null, error: null });
                }
              })
            })
          })
        };
      }

      if (tabel === 'rekomendasi_terbuka') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: lama, error: null })
            })
          })
        };
      }

      throw new Error(`tabel tak dikenal: ${tabel}`);
    }
  };

  return { db, catatan };
}

const PENANDA = [
  { nama_instrumen: 'SPAK', periode: '2026-ganjil', ditandai_pada: '2026-11-16T00:00:00Z' }
];

const tanyaBerhasil = async () => 'Lakukan sosialisasi prosedur secara berkala.';

test('menyimpan kelompok lalu menghapus penanda saat semua saran berhasil', async () => {
  const { db, catatan } = buatDb({
    kotor: PENANDA,
    komentar: KOMENTAR.map(barisKomentar)
  });

  const hasil = await jalankanProses(db, { batas: 5, maksSaran: 10 }, tanyaBerhasil);

  assert.equal(hasil.diproses.length, 1);
  assert.equal(hasil.gagal.length, 0);
  assert.equal(catatan.simpan.length, 1);
  assert.equal(catatan.hapus.length, 1);
  assert.equal(catatan.tunda.length, 0);

  const baris = catatan.simpan[0].p_baris;
  assert.ok(baris.length >= 2, `kelompok: ${baris.length}`);
  for (const b of baris) {
    assert.ok(b.saran_langkah, 'saran kosong padahal model berhasil');
    assert.ok(b.hash_masukan, 'hash kosong padahal saran ada');
    assert.ok(b.porsi > 0 && b.porsi <= 1);
  }
});

test('menunda penanda saat model bahasa gagal, bukan menghapusnya', async () => {
  const { db, catatan } = buatDb({
    kotor: PENANDA,
    komentar: KOMENTAR.map(barisKomentar)
  });

  const tanyaGagal = async () => {
    throw new LlmTidakTersedia('penyedia sibuk');
  };

  const hasil = await jalankanProses(db, { batas: 5, maksSaran: 10 }, tanyaGagal);

  assert.equal(hasil.diproses.length, 1);
  assert.equal(catatan.hapus.length, 0, 'penanda dihapus padahal saran gagal');
  assert.equal(catatan.tunda.length, 1, 'penanda tidak ditunda');

  const baris = catatan.simpan[0].p_baris;
  for (const b of baris) {
    assert.equal(b.saran_langkah, null);
    assert.equal(b.hash_masukan, null, 'hash disimpan padahal saran kosong');
  }
  assert.ok(hasil.diproses[0].galat_saran.length > 0);
});

test('prompt ke model bahasa tidak memuat kalimat komentar', async () => {
  const { db } = buatDb({
    kotor: PENANDA,
    komentar: KOMENTAR.map(barisKomentar)
  });

  const dikirim = [];
  const tanya = async (pesan) => {
    dikirim.push(pesan);
    return 'Lakukan sosialisasi.';
  };

  await jalankanProses(db, { batas: 5, maksSaran: 10 }, tanya);

  assert.ok(dikirim.length >= 2);
  for (const pesan of dikirim) {
    const teks = `${pesan.system}\n${pesan.user}`;
    for (const komentar of KOMENTAR) {
      assert.ok(!teks.includes(komentar), `komentar mentah bocor: ${komentar}`);
    }
    assert.ok(teks.includes('SPAK'));
  }
});

test('menghormati batas kombinasi per jalan', async () => {
  const kotor = [
    { nama_instrumen: 'SPAK', periode: '2026-ganjil', ditandai_pada: '2026-11-16T00:00:00Z' },
    { nama_instrumen: 'SPIP', periode: '2026-ganjil', ditandai_pada: '2026-11-16T00:01:00Z' },
    { nama_instrumen: 'WBS', periode: '2026-ganjil', ditandai_pada: '2026-11-16T00:02:00Z' }
  ];

  const { db } = buatDb({ kotor, komentar: KOMENTAR.map(barisKomentar) });
  const hasil = await jalankanProses(db, { batas: 2, maksSaran: 10 }, tanyaBerhasil);

  assert.equal(hasil.diproses.length, 2);
  assert.equal(hasil.masih_kotor, 'mungkin');
});

test('memakai ulang saran lama bila hash masukan tidak berubah', async () => {
  /* Hash harus dihitung dari label dan jumlah yang benar-benar dihasilkan
     klasterisasi. Supaya tes tidak bergantung pada hasil k-means, jalankan
     sekali tanpa saran lama untuk mengetahui labelnya. */
  const pertama = buatDb({ kotor: PENANDA, komentar: KOMENTAR.map(barisKomentar) });
  await jalankanProses(pertama.db, { batas: 5, maksSaran: 10 }, tanyaBerhasil);
  const barisPertama = pertama.catatan.simpan[0].p_baris;

  const lama = [];
  for (const b of barisPertama) {
    lama.push({
      label: b.label,
      hash_masukan: await hashMasukan(b.label, b.jumlah, b.kata_kunci),
      saran_langkah: 'Saran lama yang masih berlaku.'
    });
  }

  const kedua = buatDb({ kotor: PENANDA, komentar: KOMENTAR.map(barisKomentar), lama });
  let dipanggil = 0;
  const tanya = async () => {
    dipanggil += 1;
    return 'Saran baru.';
  };

  const hasil = await jalankanProses(kedua.db, { batas: 5, maksSaran: 10 }, tanya);

  assert.equal(dipanggil, 0, 'model bahasa dipanggil padahal hash sama');
  assert.equal(hasil.diproses[0].saran_baru, 0);
  for (const b of kedua.catatan.simpan[0].p_baris) {
    assert.equal(b.saran_langkah, 'Saran lama yang masih berlaku.');
  }
});

test('kombinasi tanpa komentar tetap disimpan kosong dan penanda dibersihkan', async () => {
  const { db, catatan } = buatDb({ kotor: PENANDA, komentar: [] });
  const hasil = await jalankanProses(db, { batas: 5, maksSaran: 10 }, tanyaBerhasil);

  assert.equal(hasil.diproses[0].kelompok, 0);
  assert.equal(catatan.simpan[0].p_baris.length, 0);
  assert.equal(catatan.hapus.length, 1);
});
