/* Tes cache data survei.

   Yang dijaga: data dipakai ulang dalam masa berlaku, diambil ulang setelah
   kedaluwarsa, dan permintaan bersamaan tidak memicu pengambilan berulang.

   Dijalankan: node --test supabase/functions/chat/tests/cache.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buatCache } from '../lib/cache.ts';

test('memakai ulang data dalam masa berlaku', async () => {
  let panggilan = 0;
  let waktu = 1000;
  const ambil = buatCache({
    umurMs: 60_000,
    sekarang: () => waktu,
    ambil: async () => {
      panggilan += 1;
      return `data-${panggilan}`;
    }
  });

  assert.equal(await ambil(), 'data-1');
  waktu += 30_000;
  assert.equal(await ambil(), 'data-1', 'seharusnya memakai cache');
  assert.equal(panggilan, 1);
});

test('mengambil ulang setelah kedaluwarsa', async () => {
  let panggilan = 0;
  let waktu = 1000;
  const ambil = buatCache({
    umurMs: 60_000,
    sekarang: () => waktu,
    ambil: async () => {
      panggilan += 1;
      return `data-${panggilan}`;
    }
  });

  assert.equal(await ambil(), 'data-1');
  waktu += 60_001;
  assert.equal(await ambil(), 'data-2', 'seharusnya mengambil ulang');
  assert.equal(panggilan, 2);
});

test('permintaan bersamaan berbagi satu pengambilan', async () => {
  let panggilan = 0;
  const ambil = buatCache({
    umurMs: 60_000,
    ambil: async () => {
      panggilan += 1;
      /* Tunda sedikit supaya ketiga permintaan benar-benar bersamaan. */
      await new Promise((ok) => setTimeout(ok, 10));
      return 'data';
    }
  });

  const hasil = await Promise.all([ambil(), ambil(), ambil()]);
  assert.deepEqual(hasil, ['data', 'data', 'data']);
  assert.equal(panggilan, 1, 'pengambilan tidak boleh berulang');
});

test('kegagalan tidak disimpan sebagai cache', async () => {
  let panggilan = 0;
  const ambil = buatCache({
    umurMs: 60_000,
    ambil: async () => {
      panggilan += 1;
      if (panggilan === 1) throw new Error('gagal sekali');
      return 'berhasil';
    }
  });

  await assert.rejects(() => ambil(), /gagal sekali/);
  assert.equal(await ambil(), 'berhasil', 'percobaan berikutnya harus jalan');
  assert.equal(panggilan, 2);
});
