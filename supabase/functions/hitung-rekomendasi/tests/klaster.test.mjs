/* Tes TF-IDF dan klasterisasi.

   Dijalankan: node --test supabase/functions/hitung-rekomendasi/tests/klaster.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { hitungTfIdf, kemiripan, kataTeratas } from '../lib/tfidf.ts';
import { kmeans, silhouette, pilihK } from '../lib/klaster.ts';
import { praproses } from '../lib/teks.ts';

/* ---------------------------------------------------------------------------
   TF-IDF
   --------------------------------------------------------------------------- */

test('IDF menurunkan bobot kata yang muncul di semua dokumen', () => {
  const dokumen = [
    ['layan', 'cepat'],
    ['layan', 'lambat'],
    ['layan', 'biasa']
  ];
  const { kosakata, vektor } = hitungTfIdf(dokumen);
  const kolomLayan = kosakata.indexOf('layan');

  /* "layan" ada di ketiga dokumen, jadi IDF-nya paling kecil. */
  const bobotLayan = vektor.map((v) => v[kolomLayan]);
  const maksSemua = Math.max(...vektor.flat());
  assert.ok(bobotLayan.every((b) => b < maksSemua), 'kata umum seharusnya berbobot rendah');
});

test('vektor dinormalkan sehingga kemiripan diri sendiri = 1', () => {
  const { vektor } = hitungTfIdf([
    ['kanal', 'lapor'],
    ['sarana', 'rusak']
  ]);
  for (const v of vektor) {
    if (v.some((x) => x !== 0)) {
      assert.ok(Math.abs(kemiripan(v, v) - 1) < 1e-9, 'panjang vektor bukan 1');
    }
  }
});

test('kemiripan tinggi untuk teks mirip, rendah untuk berbeda', () => {
  const { vektor } = hitungTfIdf([
    praproses('Prosedur pelaporan benturan belum jelas'),
    praproses('Prosedur pelaporan benturan tidak jelas'),
    praproses('Sarana dan fasilitas perlu diperbaiki')
  ]);

  const mirip = kemiripan(vektor[0], vektor[1]);
  const beda = kemiripan(vektor[0], vektor[2]);

  assert.ok(mirip > beda, `mirip=${mirip} seharusnya > beda=${beda}`);
  assert.ok(mirip > 0.5, `teks hampir sama seharusnya sangat mirip, dapat ${mirip}`);
});

test('kataTeratas mengembalikan kata berbobot terbesar', () => {
  const { kosakata, vektor } = hitungTfIdf([['sop', 'sop', 'sosialisasi'], ['sarana']]);
  const atas = kataTeratas(vektor[0], kosakata, 2);

  assert.equal(atas[0].kata, 'sop', 'kata paling sering seharusnya di atas');
  assert.ok(atas.every((x) => x.bobot > 0));
});

test('TF-IDF menangani dokumen kosong', () => {
  const { vektor } = hitungTfIdf([[], []]);
  assert.equal(vektor.length, 2);
  assert.ok(vektor.every((v) => v.every((x) => x === 0)));
});

/* ---------------------------------------------------------------------------
   Klasterisasi
   --------------------------------------------------------------------------- */

/* Dua kelompok yang jelas berbeda, supaya hasil klasterisasi tidak ambigu. */
function dataDuaKelompok() {
  const a = [
    'Prosedur pelaporan benturan belum jelas',
    'Alur pelaporan benturan berbelit',
    'Kanal pelaporan benturan tidak diketahui'
  ];
  const b = [
    'Sarana dan fasilitas kantor perlu diperbaiki',
    'Fasilitas ruang kerja kurang memadai',
    'Sarana pendukung kerja belum lengkap'
  ];
  const { vektor } = hitungTfIdf([...a, ...b].map(praproses));
  return { vektor, jumlahA: a.length };
}

test('kmeans memisahkan data yang jelas berbeda', () => {
  const { vektor, jumlahA } = dataDuaKelompok();
  const { label } = kmeans(vektor, 2, { benih: 42 });

  const labelA = new Set(label.slice(0, jumlahA));
  const labelB = new Set(label.slice(jumlahA));

  assert.equal(labelA.size, 1, 'kelompok pertama harus satu label');
  assert.equal(labelB.size, 1, 'kelompok kedua harus satu label');
  assert.notEqual([...labelA][0], [...labelB][0], 'dua kelompok tidak boleh berlabel sama');
});

test('kmeans deterministik dengan benih yang sama', () => {
  const { vektor } = dataDuaKelompok();
  const satu = kmeans(vektor, 2, { benih: 7 });
  const dua = kmeans(vektor, 2, { benih: 7 });
  assert.deepEqual(satu.label, dua.label);
});

test('silhouette tinggi untuk kelompok yang terpisah jelas', () => {
  const { vektor } = dataDuaKelompok();
  const { label } = kmeans(vektor, 2, { benih: 42 });
  const skor = silhouette(vektor, label);

  assert.ok(skor != null);
  assert.ok(skor > 0.3, `silhouette terlalu rendah: ${skor}`);
});

test('silhouette menolak data terlalu sedikit atau satu klaster', () => {
  assert.equal(silhouette([[1, 0], [0, 1]], [0, 1]), null, 'dua dokumen tidak cukup');
  assert.equal(silhouette([[1], [1], [1]], [0, 0, 0]), null, 'satu klaster tidak bisa dinilai');
});

test('pilihK menemukan dua kelompok pada data dua kelompok', () => {
  const { vektor } = dataDuaKelompok();
  const hasil = pilihK(vektor, { maksK: 4, benih: 42 });

  assert.equal(hasil.k, 2, `seharusnya k=2, dapat k=${hasil.k}`);
  assert.ok(hasil.silhouette != null && hasil.silhouette > 0);
});

test('pilihK mengembalikan k=1 saat semua dokumen identik', () => {
  const { vektor } = hitungTfIdf([
    praproses('prosedur tidak jelas'),
    praproses('prosedur tidak jelas'),
    praproses('prosedur tidak jelas')
  ]);
  const hasil = pilihK(vektor, { maksK: 3, benih: 42 });

  assert.equal(hasil.k, 1);
  assert.equal(hasil.silhouette, null);
});
