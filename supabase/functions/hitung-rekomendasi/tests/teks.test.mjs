/* Tes praproses teks komentar.

   Dijalankan: node --test supabase/functions/hitung-rekomendasi/tests/teks.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalisasi,
  tokenisasi,
  akarKata,
  praproses,
  bigram,
  kataKunciUntukModel,
  STOPWORD
} from '../lib/teks.ts';

test('normalisasi membuang URL, email, angka, dan tanda baca', () => {
  assert.equal(normalisasi('Lihat https://pens.ac.id ya!'), 'lihat ya');
  assert.equal(normalisasi('Email saya budi@example.com'), 'email saya');
  assert.equal(normalisasi('NIP 12345678 perlu dicek'), 'nip perlu dicek');
  assert.equal(normalisasi('Prosedur, alur; dan (syarat)!'), 'prosedur alur dan syarat');
  assert.equal(normalisasi('   Banyak   spasi   '), 'banyak spasi');
});

test('normalisasi tidak menyisakan karakter non-huruf', () => {
  const hasil = normalisasi('Harga Rp 5.000.000 / orang #mahal @kampus');
  assert.match(hasil, /^[a-z\s]*$/);
});

test('tokenisasi memecah dengan benar', () => {
  assert.deepEqual(tokenisasi('Pelaporan benturan kepentingan'), ['pelaporan', 'benturan', 'kepentingan']);
  assert.deepEqual(tokenisasi(''), []);
  assert.deepEqual(tokenisasi('!!!'), []);
});

test('akarKata menyatukan bentuk berimbuhan', () => {
  /* Inti dari stemming: tiga bentuk ini harus bertemu. */
  const a = akarKata('pelaporan');
  const b = akarKata('melaporkan');
  const c = akarKata('dilaporkan');
  assert.equal(a, b, `pelaporan=${a} vs melaporkan=${b}`);
  assert.equal(b, c, `melaporkan=${b} vs dilaporkan=${c}`);
});

test('akarKata tidak menggerus kata sampai terlalu pendek', () => {
  for (const kata of ['sop', 'sarana', 'waktu', 'antre', 'layanan', 'prosedur']) {
    assert.ok(akarKata(kata).length >= 3, `"${kata}" jadi "${akarKata(kata)}"`);
  }
});

test('akarKata membiarkan kata tanpa imbuhan', () => {
  assert.equal(akarKata('sarana'), 'sarana');
  assert.equal(akarKata('prosedur'), 'prosedur');
});

test('akarKata tidak menggerus kata sampai kehilangan makna', () => {
  /* Kasus yang pernah salah saat memakai dua putaran imbuhan. */
  assert.equal(akarKata('kepentingan'), 'penting');
  assert.equal(akarKata('transparansi'), 'transparansi');
  assert.equal(akarKata('gratifikasi'), 'gratifikasi');
  assert.equal(akarKata('komunikasi'), 'komunikasi');
  assert.equal(akarKata('fasilitas'), 'fasilitas');
});

test('akarKata memulihkan huruf yang diserap imbuhan', () => {
  /* meN- + sampaikan, bukan + ampaikan. */
  assert.equal(akarKata('menyampaikan'), 'sampai');
  assert.equal(akarKata('penyediaan'), 'sedia');
  assert.equal(akarKata('kebersihan'), 'bersih');
});

test('praproses membuang stopword dan kata umum', () => {
  const hasil = praproses('Prosedur pelaporan sudah jelas dan sangat membantu sekali');
  assert.ok(hasil.includes('prosedur'), `hasil: ${hasil.join(',')}`);
  assert.ok(!hasil.includes('sudah'), 'stopword "sudah" lolos');
  assert.ok(!hasil.includes('sangat'), 'kata umum "sangat" lolos');
  assert.ok(!hasil.includes('dan'), 'stopword "dan" lolos');
});

test('praproses menghasilkan token tanpa angka dan tanpa imbuhan', () => {
  for (const token of praproses('Sosialisasi SOP perlu dilakukan lebih rutin setiap 3 bulan')) {
    assert.match(token, /^[a-z]+$/, `token tidak bersih: ${token}`);
    assert.ok(token.length >= 4, `token terlalu pendek: ${token}`);
  }
});

test('praproses menangani teks kosong', () => {
  assert.deepEqual(praproses(''), []);
  assert.deepEqual(praproses('   '), []);
  assert.deepEqual(praproses('dan atau yang'), []);
});

test('bigram menjaga frasa berdampingan', () => {
  assert.deepEqual(bigram(['kanal', 'lapor', 'jelas']), ['kanal_lapor', 'lapor_jelas']);
  assert.deepEqual(bigram(['satu']), []);
});

test('kataKunciUntukModel menyaring kata yang tidak layak dikirim', () => {
  const hasil = kataKunciUntukModel(['prosedur', 'lapor', 'nip', '12345', 'kanal_lapor', 'sosialisasi'], 5);

  assert.ok(hasil.includes('prosedur'));
  assert.ok(hasil.includes('sosialisasi'));
  /* "lapor" 5 huruf dan tanpa angka, jadi memang lolos. */
  assert.ok(hasil.includes('lapor'));
  assert.ok(!hasil.includes('nip'), 'kata 3 huruf tidak boleh lolos');
  assert.ok(!hasil.includes('12345'), 'angka tidak boleh lolos');
  assert.ok(!hasil.some((k) => k.includes('_')), 'bigram tidak boleh lolos');
  assert.ok(hasil.length <= 5);
});

test('kataKunciUntukModel membatasi jumlah', () => {
  const huruf = 'abcdefghijklmnopqrst';
  const banyak = Array.from({ length: 20 }, (_, i) => `katapanjang${huruf[i]}`);
  assert.equal(kataKunciUntukModel(banyak, 5).length, 5);
});

test('daftar stopword memuat kata fungsi yang paling sering muncul', () => {
  for (const kata of ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'ini', 'itu', 'tidak']) {
    assert.ok(STOPWORD.has(kata), `"${kata}" tidak ada di stopword`);
  }
});
