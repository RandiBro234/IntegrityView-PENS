/* Tes perakit konteks: pemilihan instrumen dan bentuk JSON yang dikirim ke LLM.

   Dua hal yang dijaga di sini:
   1. Aturan pemilihan instrumen (permintaan > teks pertanyaan > ringkasan semua).
   2. Konteks tidak pernah memuat email, komentar mentah, atau data laporan.

   Dijalankan: node --test supabase/functions/chat/tests/konteks.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hitungAgregat } from '../lib/statistik.ts';
import { pilihInstrumen, rakitKonteksSatu, rakitKonteksSemua, ukuranKonteks } from '../lib/konteks.ts';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRI = JSON.parse(await readFile(resolve(AKAR, 'lib/instrumen.json'), 'utf8'));
const FIXTURE = JSON.parse(await readFile(resolve(AKAR, 'tests/fixtures/agregat.json'), 'utf8'));

const AMBANG = REGISTRI.ambang;

function kasus(slug) {
  return FIXTURE.kasus.find((k) => k.slug === slug);
}

function instrumenDari(slug) {
  return REGISTRI.instrumen.find((i) => i.slug === slug) ?? null;
}

function agregatDari(slug) {
  const k = kasus(slug);
  return hitungAgregat(instrumenDari(slug), k.periode, k.records, 'simulated', { dibuang: 3, duplikat: 1 });
}

/* ---------------------------------------------------------------------------
   Pemilihan instrumen
   --------------------------------------------------------------------------- */

test('kode dari permintaan menang atas kode di teks', () => {
  /* Pertanyaan menyebut SPAK, tetapi halaman yang dibuka SPIP. */
  const hasil = pilihInstrumen('bagaimana hasil SPAK?', 'spip', REGISTRI);
  assert.equal(hasil?.slug, 'spip');
});

test('kode instrumen di teks terdeteksi bila permintaan kosong', () => {
  assert.equal(pilihInstrumen('butir mana di SPIP yang paling lemah?', null, REGISTRI)?.slug, 'spip');
  assert.equal(pilihInstrumen('spak tahun ini gimana', undefined, REGISTRI)?.slug, 'spak');
});

test('nama panjang instrumen terdeteksi', () => {
  const hasil = pilihInstrumen('jelaskan Survei Persepsi Anti Korupsi', null, REGISTRI);
  assert.equal(hasil?.slug, 'spak');
});

test('tanpa kode dan tanpa nama mengembalikan null (ringkasan semua)', () => {
  assert.equal(pilihInstrumen('instrumen mana yang paling rendah?', null, REGISTRI), null);
});

test('kode instrumen tidak tertangkap di dalam kata lain', () => {
  /* "5r" jangan cocok pada "15responden" atau "5ribu". */
  assert.equal(pilihInstrumen('ada 15responden ya', null, REGISTRI), null);
});

test('instrumen tanpa agregat tidak pernah dipilih', () => {
  /* pengaduan ada di registry tetapi punya_agregat=false. */
  assert.equal(pilihInstrumen('bagaimana pengaduan masyarakat?', 'pengaduan', REGISTRI), null);
});

test('alias nama dari database dikenali', () => {
  const hasil = pilihInstrumen('apa itu?', 'Survei Persepsi Anti Korupsi', REGISTRI);
  assert.equal(hasil?.slug, 'spak');
});

/* ---------------------------------------------------------------------------
   Bentuk konteks satu instrumen
   --------------------------------------------------------------------------- */

test('konteks satu instrumen memuat field wajib dan dua skala', () => {
  const agregat = agregatDari('spip');
  const konteks = rakitKonteksSatu(agregat, instrumenDari('spip'), AMBANG);

  assert.equal(konteks.kode, 'SPIP');
  assert.equal(konteks.periode, '2026-ganjil');
  assert.equal(konteks.ringkasan.n, agregat.n);
  assert.equal(konteks.butir.length, 9);
  assert.equal(konteks.butir[0].kode, 'SPIP1');

  /* Skor ZI 0-100 (kartu utama dashboard) dan skor rata-rata 1-4 (detail). */
  assert.ok(konteks.ringkasan.skor_zi > 0 && konteks.ringkasan.skor_zi <= 100, `skor_zi ${konteks.ringkasan.skor_zi}`);
  assert.ok(konteks.ringkasan.skor_rata > 1 && konteks.ringkasan.skor_rata <= 4, `skor_rata ${konteks.ringkasan.skor_rata}`);
  assert.ok(Math.abs(konteks.ringkasan.skor_zi - agregat.indeks) < 0.1);
  assert.ok(Math.abs(konteks.ringkasan.skor_rata - agregat.indeks / 25) < 0.01);

  for (const b of konteks.butir) {
    assert.ok(b.skor >= 1 && b.skor <= 4, `${b.kode} skor ${b.skor}`);
  }
});

test('konteks satu instrumen tidak memuat PII', () => {
  const konteks = rakitKonteksSatu(agregatDari('spak'), instrumenDari('spak'), AMBANG);
  const teks = JSON.stringify(konteks);

  assert.doesNotMatch(teks, /@/, 'konteks memuat karakter @ (kemungkinan email)');
  assert.doesNotMatch(teks, /email/i);
  assert.doesNotMatch(teks, /respondentId/);
  /* Komentar mentah tidak boleh muncul; hanya tema dan jumlahnya. */
  assert.ok(!teks.includes('Perlu sosialisasi rutin'), 'komentar mentah bocor ke konteks');
});

test('ambang sampel minimum mengikuti registri, bukan angka hardcoded', () => {
  const konteks = rakitKonteksSatu(agregatDari('spak'), instrumenDari('spak'), AMBANG);
  assert.equal(konteks.kecukupan_sampel.minimum, AMBANG.respondenMinimum);
  assert.equal(konteks.kecukupan_sampel.cukup, konteks.ringkasan.n >= AMBANG.respondenMinimum);
});

/* ---------------------------------------------------------------------------
   Ringkasan semua instrumen
   --------------------------------------------------------------------------- */

test('ringkasan semua instrumen tetap kecil', () => {
  const daftar = FIXTURE.kasus.map((k) => ({
    agregat: hitungAgregat(instrumenDari(k.slug), k.periode, k.records, 'simulated', { dibuang: 3, duplikat: 1 }),
    instrumen: instrumenDari(k.slug)
  }));
  const konteks = rakitKonteksSemua(daftar);

  assert.equal(konteks.cakupan, 'semua-instrumen');
  assert.equal(konteks.jumlah_instrumen, 2);

  const ukuran = ukuranKonteks(konteks);
  /* Dua instrumen; batas 1 KB per instrumen cukup longgar tetapi tetap menjaga. */
  assert.ok(ukuran < daftar.length * 1024, `konteks ${ukuran} byte terlalu besar`);
});

test('ringkasan semua instrumen tidak memuat butir lengkap maupun PII', () => {
  const daftar = FIXTURE.kasus.map((k) => ({
    agregat: hitungAgregat(instrumenDari(k.slug), k.periode, k.records, 'simulated', { dibuang: 3, duplikat: 1 }),
    instrumen: instrumenDari(k.slug)
  }));
  const teks = JSON.stringify(rakitKonteksSemua(daftar));

  assert.doesNotMatch(teks, /@/);
  /* Hanya butir terendah, bukan seluruh daftar butir. */
  assert.doesNotMatch(teks, /"butir":/);
});
