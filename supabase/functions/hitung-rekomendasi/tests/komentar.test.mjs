/* Tes pengambilan komentar dan pembentukan kelompok.

   Dijalankan: node --test supabase/functions/hitung-rekomendasi/tests/komentar.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { komentarDari, jawabanSensitif } from '../lib/komentar.ts';
import { periodeDariTanggal, urutkanPeriode } from '../lib/periode.ts';
import { komentarPeriode } from '../lib/sumber.ts';
import { bentukKelompok, prioritasDari } from '../lib/kelompok.ts';
import { susunPrompt, rapikanSaran, rapikanJudul, uraiSaran, hashMasukan } from '../lib/saran.ts';

/* ---------------------------------------------------------------------------
   Pengambilan komentar
   --------------------------------------------------------------------------- */

test('komentarDari melewati metadata dan jawaban angka', () => {
  const data = {
    Nama: 'Budi',
    'Unit Kerja': 'PENS',
    'Skor 1': '3',
    'Skor 2': 4,
    Saran: 'Sosialisasi SOP perlu lebih rutin'
  };
  assert.equal(komentarDari(data), 'Sosialisasi SOP perlu lebih rutin');
});

test('komentarDari menerima data_jawaban berbentuk string JSON', () => {
  const data = JSON.stringify({ Email: 'a@b.c', Komentar: 'Pelayanan sudah cepat' });
  assert.equal(komentarDari(data), 'Pelayanan sudah cepat');
});

test('komentarDari mengembalikan null bila tidak ada teks', () => {
  assert.equal(komentarDari({ Nama: 'Ani', Skor: '4' }), null);
  assert.equal(komentarDari({ Komentar: '-' }), null);
  assert.equal(komentarDari(null), null);
  assert.equal(komentarDari('bukan json'), null);
});

test('komentarDari mengambil array pertama', () => {
  assert.equal(komentarDari({ Komentar: ['Fasilitas perlu diperbaiki'] }), 'Fasilitas perlu diperbaiki');
});

test('jawabanSensitif menandai tuduhan dan nominal', () => {
  assert.equal(jawabanSensitif('Ada dugaan mark up anggaran'), true);
  assert.equal(jawabanSensitif('Nominal Rp 5 juta'), true);
  assert.equal(jawabanSensitif('x'.repeat(301)), true);
  assert.equal(jawabanSensitif('Sosialisasi perlu rutin'), false);
});

/* ---------------------------------------------------------------------------
   Periode
   --------------------------------------------------------------------------- */

test('periodeDariTanggal memakai WIB, bukan UTC', () => {
  /* 31 Agustus 17.30 UTC = 1 September 00.30 WIB -> ganjil tahun itu. */
  assert.equal(periodeDariTanggal('2025-08-31T17:30:00Z'), '2025-ganjil');
  assert.equal(periodeDariTanggal('2025-08-31T10:00:00Z'), '2025-genap');
});

test('periodeDariTanggal membagi tahun dengan benar', () => {
  assert.equal(periodeDariTanggal('2026-01-15T03:00:00Z'), '2025-ganjil');
  assert.equal(periodeDariTanggal('2026-03-01T03:00:00Z'), '2026-genap');
  assert.equal(periodeDariTanggal('2026-09-01T03:00:00Z'), '2026-ganjil');
  assert.equal(periodeDariTanggal('bukan tanggal'), null);
  assert.equal(periodeDariTanggal(null), null);
});

test('urutkanPeriode menaruh ganjil lebih baru dari genap', () => {
  assert.deepEqual(urutkanPeriode(['2026-genap', '2025-ganjil', '2026-ganjil']), [
    '2026-ganjil',
    '2026-genap',
    '2025-ganjil'
  ]);
});

/* ---------------------------------------------------------------------------
   Penyaringan komentar
   --------------------------------------------------------------------------- */

test('komentarPeriode membuang sensitif, periode lain, dan duplikat responden', () => {
  const rows = [
    { data_jawaban: { Komentar: 'Sosialisasi perlu rutin' }, created_at: '2026-10-01T02:00:00Z', responden_hash: 'a' },
    /* Hash sama: hanya yang terbaru dipakai (baris pertama sudah menang). */
    { data_jawaban: { Komentar: 'Sosialisasi perlu rutin' }, created_at: '2026-10-02T02:00:00Z', responden_hash: 'a' },
    { data_jawaban: { Komentar: 'Fasilitas ruang kerja kurang' }, created_at: '2026-10-03T02:00:00Z', responden_hash: 'b' },
    { data_jawaban: { Komentar: 'Ada dugaan mark up' }, created_at: '2026-10-04T02:00:00Z', responden_hash: 'c' },
    { data_jawaban: { Komentar: 'Periode lain' }, created_at: '2026-03-04T02:00:00Z', responden_hash: 'd' },
    { data_jawaban: { Komentar: 'Tanpa hash tetap masuk' }, created_at: '2026-10-05T02:00:00Z', responden_hash: null }
  ];

  assert.deepEqual(komentarPeriode(rows, '2026-ganjil'), [
    'Sosialisasi perlu rutin',
    'Fasilitas ruang kerja kurang',
    'Tanpa hash tetap masuk'
  ]);
});

/* ---------------------------------------------------------------------------
   Pembentukan kelompok
   --------------------------------------------------------------------------- */

function komentarDuaTopik() {
  return [
    'Prosedur pelaporan benturan kepentingan belum jelas',
    'Alur pelaporan benturan kepentingan berbelit',
    'Kanal pelaporan benturan kepentingan tidak diketahui',
    'Sarana dan fasilitas ruang kerja perlu diperbaiki',
    'Fasilitas ruang kerja kurang memadai',
    'Sarana pendukung kerja belum lengkap'
  ];
}

test('bentukKelompok memisahkan dua topik dan porsi berjumlah satu', () => {
  const hasil = bentukKelompok(komentarDuaTopik(), { maksK: 4 });

  assert.equal(hasil.kelompok.length >= 2, true, `kelompok: ${hasil.kelompok.length}`);
  assert.equal(hasil.jumlahKomentar, 6);
  assert.ok(hasil.silhouette != null && hasil.silhouette > 0.3, `silhouette: ${hasil.silhouette}`);

  const totalPorsi = hasil.kelompok.reduce((a, k) => a + k.porsi, 0);
  assert.ok(Math.abs(totalPorsi - 1) < 1e-9, `total porsi ${totalPorsi}`);

  const semuaKata = hasil.kelompok.flatMap((k) => k.kata_kunci).join(' ');
  assert.match(semuaKata, /lapor|kanal/);
  assert.match(semuaKata, /sarana|fasilitas/);
});

test('label kelompok memakai bentuk kata yang terbaca', () => {
  const hasil = bentukKelompok([
    'Transparansi anggaran perlu ditingkatkan',
    'Transparansi laporan keuangan kurang',
    'Transparansi pengelolaan dana belum jelas',
    'Fasilitas ruang kerja perlu diperbaiki',
    'Fasilitas kantor kurang memadai',
    'Fasilitas pendukung kerja belum lengkap'
  ]);

  for (const k of hasil.kelompok) {
    assert.match(k.kata_kunci.join(' '), /transparansi|fasilitas/, `label aneh: ${k.label}`);
  }
});

test('label kelompok membuang kata tindakan', () => {
  const hasil = bentukKelompok([
    'Prosedur yang ada sudah baik dan perlu dipertahankan',
    'Prosedur sudah berjalan dan harus dipertahankan',
    'Prosedur perlu dipertahankan karena sudah jelas',
    'Dokumentasi prosedur perlu diperbarui',
    'Dokumentasi prosedur belum lengkap',
    'Dokumentasi prosedur harus diperbarui'
  ]);

  const semua = hasil.kelompok.map((k) => k.label.toLowerCase()).join(' | ');
  assert.ok(!semua.includes('dipertahankan'), `label masih memuat kata tindakan: ${semua}`);
  assert.ok(!semua.includes('diperbarui'), `label masih memuat kata tindakan: ${semua}`);
  assert.match(semua, /prosedur|dokumentasi/);
});

test('bentukKelompok menghitung komentar berulang, bukan teks unik', () => {
  const hasil = bentukKelompok([
    ...Array(10).fill('Sosialisasi SOP perlu lebih rutin'),
    'Sosialisasi SOP belum merata',
    'Sosialisasi prosedur perlu dijadwalkan',
    'Fasilitas ruang kerja perlu diperbaiki',
    'Sarana pendukung kerja belum lengkap',
    'Alur layanan masih berbelit'
  ]);

  assert.equal(hasil.jumlahKomentar, 15);
  assert.equal(hasil.jumlahUnik, 6);
  /* Kelompok terbesar memuat 10 komentar yang sama + 2 yang bertopik sama. */
  assert.ok(hasil.kelompok[0].jumlah >= 10, `jumlah terbesar: ${hasil.kelompok[0].jumlah}`);
  assert.equal(hasil.kelompok.reduce((a, k) => a + k.jumlah, 0), 15);
});

test('bentukKelompok memisahkan komentar tanpa kata bermakna', () => {
  const hasil = bentukKelompok([
    'sudah bagus',
    'terima kasih',
    'Sosialisasi SOP perlu rutin',
    'Fasilitas ruang kerja kurang',
    'Alur layanan berbelit'
  ]);

  assert.equal(hasil.tanpaKata, 2);
  assert.equal(hasil.jumlahKomentar, 5);
  /* Porsi dihitung dari 3 komentar yang bisa dikelompokkan. */
  const total = hasil.kelompok.reduce((a, k) => a + k.jumlah, 0);
  assert.equal(total, 3);
});

test('bentukKelompok mengembalikan kosong bila komentar terlalu sedikit', () => {
  const hasil = bentukKelompok(['Sosialisasi SOP', 'Fasilitas rusak']);
  assert.deepEqual(hasil.kelompok, []);
  assert.equal(hasil.k, 0);
});

test('prioritas mengikuti porsi kelompok', () => {
  assert.equal(prioritasDari(0.45), 'Tinggi');
  assert.equal(prioritasDari(0.3), 'Tinggi');
  assert.equal(prioritasDari(0.2), 'Sedang');
  assert.equal(prioritasDari(0.15), 'Sedang');
  assert.equal(prioritasDari(0.14), 'Pantau');
});

/* ---------------------------------------------------------------------------
   Prompt dan saran
   --------------------------------------------------------------------------- */

test('susunPrompt hanya memuat kata kunci, bukan kalimat komentar', () => {
  const prompt = susunPrompt({
    instrumen: 'SPAK',
    periode: '2026-ganjil',
    kelompok: {
      label: 'Transparansi, korupsi',
      jumlah: 91,
      porsi: 0.68,
      kata_kunci: ['transparansi', 'korupsi']
    }
  });

  assert.ok(prompt.user.includes('SPAK'));
  assert.ok(prompt.user.includes('transparansi'));
  assert.ok(!prompt.user.includes('Pelaporan benturan'), 'kalimat komentar bocor ke prompt');
  assert.ok(prompt.system.includes('maksimal 25 kata'));
});

test('rapikanSaran memotong jadi satu kalimat pendek', () => {
  const panjang = Array.from({ length: 40 }, (_, i) => `kata${i}`).join(' ');
  const hasil = rapikanSaran(panjang);
  assert.ok(hasil.split(' ').length <= 25, `kata: ${hasil.split(' ').length}`);
  assert.ok(hasil.endsWith('.'));
  assert.equal(rapikanSaran('  "- Lakukan sosialisasi.\n"  '), 'Lakukan sosialisasi.');
});

test('hashMasukan stabil dan berubah saat isi berubah', async () => {
  const a = await hashMasukan(null, 'Transparansi', 10, ['transparansi']);
  const b = await hashMasukan(null, 'Transparansi', 10, ['transparansi']);
  const c = await hashMasukan(null, 'Transparansi', 11, ['transparansi']);
  const d = await hashMasukan('Judul lain', 'Transparansi', 10, ['transparansi']);

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.notEqual(a, d, 'judul tidak ikut dihitung');
  assert.equal(a.length, 64);
});

test('uraiSaran membaca dua baris JUDUL dan SARAN', () => {
  const hasil = uraiSaran('JUDUL: Prosedur belum dipahami pegawai\nSARAN: Sosialisasi prosedur secara berkala.');

  assert.equal(hasil.judul, 'Prosedur belum dipahami pegawai');
  assert.equal(hasil.saran, 'Sosialisasi prosedur secara berkala.');
});

test('uraiSaran tetap menyelamatkan saran bila format tidak diikuti', () => {
  const hasil = uraiSaran('Lakukan sosialisasi prosedur secara berkala.');

  assert.equal(hasil.judul, null);
  assert.equal(hasil.saran, 'Lakukan sosialisasi prosedur secara berkala.');
});

test('rapikanJudul membatasi sepuluh kata dan membuang titik akhir', () => {
  const panjang = Array.from({ length: 15 }, (_, i) => `kata${i}`).join(' ');
  const hasil = rapikanJudul(`${panjang}.`);

  assert.equal(hasil.split(' ').length, 10);
  assert.ok(!hasil.endsWith('.'));
  assert.equal(rapikanJudul('  "prosedur belum jelas."  '), 'Prosedur belum jelas');
  assert.equal(rapikanJudul('Korupsi dalam Kerja Menjadi Masalah'), 'Korupsi dalam kerja menjadi masalah');
});
