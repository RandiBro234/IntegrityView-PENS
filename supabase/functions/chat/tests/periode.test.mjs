/* Tes deteksi periode dari pertanyaan.

   Data survei mencakup 5 periode. Tanpa deteksi ini, pertanyaan tentang
   semester lain dijawab "data tidak tersedia" padahal datanya ada.

   Dijalankan: node --test supabase/functions/chat/tests/periode.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deteksiPeriode, urutkanPeriode } from '../lib/periode.ts';

const TERSEDIA = ['2024-ganjil', '2025-genap', '2025-ganjil', '2026-genap', '2026-ganjil'];

test('urutan periode: ganjil setelah genap pada tahun yang sama', () => {
  assert.deepEqual(urutkanPeriode(TERSEDIA), [
    '2026-ganjil',
    '2026-genap',
    '2025-ganjil',
    '2025-genap',
    '2024-ganjil'
  ]);
});

test('tahun dan semester dikenali, urutan bebas', () => {
  assert.equal(deteksiPeriode('berapa indeks SPAK semester 2025 genap?', TERSEDIA).periode, '2025-genap');
  assert.equal(deteksiPeriode('indeks 2025-ganjil berapa?', TERSEDIA).periode, '2025-ganjil');
  assert.equal(deteksiPeriode('genap 2024', TERSEDIA).periode, '2024-genap');
  assert.equal(deteksiPeriode('semester ganjil 2024', TERSEDIA).periode, '2024-ganjil');
});

test('kata relatif: semester lalu dan semester ini', () => {
  assert.equal(deteksiPeriode('bagaimana semester lalu?', TERSEDIA).periode, '2026-genap');
  assert.equal(deteksiPeriode('dibanding semester sebelumnya', TERSEDIA).periode, '2026-genap');
  assert.equal(deteksiPeriode('periode ini bagaimana?', TERSEDIA).periode, '2026-ganjil');
  assert.equal(deteksiPeriode('data terbaru', TERSEDIA).periode, '2026-ganjil');
});

test('tanpa petunjuk periode, kembalikan null (pakai terbaru)', () => {
  const hasil = deteksiPeriode('butir mana yang paling lemah?', TERSEDIA);
  assert.equal(hasil.periode, null);
  assert.equal(hasil.eksplisit, false);
});

test('periode yang tidak ada tetap dikembalikan agar bisa dijawab jujur', () => {
  /* 2023 tidak ada di data; penjawab akan menjawab "periode tidak tersedia". */
  assert.equal(deteksiPeriode('indeks 2023 ganjil', TERSEDIA).periode, '2023-ganjil');
});
