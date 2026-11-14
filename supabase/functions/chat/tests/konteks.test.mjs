/* Tes perakit konteks: pemilihan instrumen dan bentuk JSON yang dikirim ke LLM.

   Dua hal yang dijaga:
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

function instrumenDari(slug) {
  return REGISTRI.instrumen.find((i) => i.slug === slug) ?? null;
}

function agregatDari(slug) {
  const k = FIXTURE.kasus.find((x) => x.slug === slug);
  return hitungAgregat(instrumenDari(slug), k.periode, k.records, 'simulated', { dibuang: 3, duplikat: 1 });
}

const DAFTAR_SEMUA = FIXTURE.kasus.map((k) => ({
  agregat: hitungAgregat(instrumenDari(k.slug), k.periode, k.records, 'simulated', { dibuang: 3, duplikat: 1 }),
  instrumen: instrumenDari(k.slug)
}));

/* ---------------------------------------------------------------------------
   Pemilihan instrumen
   --------------------------------------------------------------------------- */

test('instrumen dipilih: permintaan > teks pertanyaan > ringkasan semua', () => {
  /* Request menang atas teks. */
  assert.equal(pilihInstrumen('bagaimana hasil SPAK?', 'spip', REGISTRI)?.slug, 'spip');
  /* Tanpa request, kode atau nama di teks yang menentukan. */
  assert.equal(pilihInstrumen('butir mana di SPIP yang paling lemah?', null, REGISTRI)?.slug, 'spip');
  assert.equal(pilihInstrumen('jelaskan Survei Persepsi Anti Korupsi', null, REGISTRI)?.slug, 'spak');
  /* Tidak disebut apa pun -> ringkasan semua. */
  assert.equal(pilihInstrumen('instrumen mana yang paling rendah?', null, REGISTRI), null);
  /* Alias nama dari database dikenali. */
  assert.equal(pilihInstrumen('apa itu?', 'Survei Persepsi Anti Korupsi', REGISTRI)?.slug, 'spak');
});

test('kode instrumen tidak tertangkap di dalam kata lain', () => {
  /* "5r" jangan cocok pada "15responden". */
  assert.equal(pilihInstrumen('ada 15responden ya', null, REGISTRI), null);
});

test('instrumen tanpa agregat tidak pernah dipilih', () => {
  /* pengaduan ada di registry tetapi punya_agregat=false. */
  assert.equal(pilihInstrumen('bagaimana pengaduan masyarakat?', 'pengaduan', REGISTRI), null);
});

/* ---------------------------------------------------------------------------
   Bentuk konteks
   --------------------------------------------------------------------------- */

test('konteks satu instrumen: memuat butir berkode dan dua skala', () => {
  const agregat = agregatDari('spip');
  const konteks = rakitKonteksSatu(agregat, instrumenDari('spip'), AMBANG);

  assert.equal(konteks.kode, 'SPIP');
  assert.equal(konteks.butir.length, 9);
  assert.equal(konteks.butir[0].kode, 'SPIP1');
  assert.equal(konteks.ringkasan.n, agregat.n);

  /* indeks_persepsi 0-100 (kartu utama dashboard), skor_rata & butir 1-4. */
  assert.ok(Math.abs(konteks.ringkasan.indeks_persepsi - agregat.indeks) < 0.1);
  assert.ok(Math.abs(konteks.ringkasan.skor_rata - agregat.indeks / 25) < 0.01);
  for (const b of konteks.butir) assert.ok(b.skor >= 1 && b.skor <= 4, `${b.kode} skor ${b.skor}`);
});

test('konteks satu instrumen tidak memuat PII', () => {
  const teks = JSON.stringify(rakitKonteksSatu(agregatDari('spak'), instrumenDari('spak'), AMBANG));
  assert.doesNotMatch(teks, /@/, 'konteks memuat karakter @ (kemungkinan email)');
  assert.doesNotMatch(teks, /email/i);
  assert.doesNotMatch(teks, /respondentId/);
  assert.ok(!teks.includes('Perlu sosialisasi rutin'), 'komentar mentah bocor ke konteks');
});

test('ringkasan semua instrumen kecil dan tanpa butir lengkap', () => {
  const konteks = rakitKonteksSemua(DAFTAR_SEMUA);
  const teks = JSON.stringify(konteks);

  assert.equal(konteks.cakupan, 'semua-instrumen');
  assert.equal(konteks.jumlah_instrumen, 2);
  assert.ok(ukuranKonteks(konteks) < DAFTAR_SEMUA.length * 1024, 'konteks terlalu besar');
  assert.doesNotMatch(teks, /"butir":/, 'butir lengkap ikut terkirim');
  assert.doesNotMatch(teks, /@/);
});

test('ambang sampel minimum mengikuti registri, bukan hardcoded', () => {
  const konteks = rakitKonteksSatu(agregatDari('spak'), instrumenDari('spak'), AMBANG);
  assert.equal(konteks.kecukupan_sampel.minimum, AMBANG.respondenMinimum);
  assert.equal(konteks.kecukupan_sampel.cukup, konteks.ringkasan.n >= AMBANG.respondenMinimum);
});

test('konteks tetap jauh di bawah ambang biaya', () => {
  /* Harga penyedia bisa melonjak di atas 100K token input per permintaan.
     Konteks terbesar (SPIP) ~4,4 KB; batas peringatan 40 KB. */
  const terbesar = Math.max(
    ...DAFTAR_SEMUA.map((d) => ukuranKonteks(rakitKonteksSatu(d.agregat, d.instrumen, AMBANG)))
  );
  assert.ok(terbesar < 10_000, `konteks ${terbesar} byte terlalu besar`);
});
