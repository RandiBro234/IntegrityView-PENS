/* Tes perapian teks jawaban.

   Panel obrolan menampilkan teks apa adanya, jadi penanda markdown yang lolos
   dari model muncul sebagai karakter mentah (**tebal**, # judul).

   Dijalankan: node --test supabase/functions/chat/tests/format.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { rapikanJawaban } from '../lib/format.ts';

test('membuang penanda markdown', () => {
  assert.equal(rapikanJawaban('Butir **GRAT3** skor 3,13.'), 'Butir GRAT3 skor 3,13.');
  assert.equal(rapikanJawaban('## Ringkasan\nPakai `SPIP3`.'), 'Ringkasan\nPakai SPIP3.');
});

test('bullet jadi titik dan angka tidak berubah', () => {
  assert.equal(rapikanJawaban('- SPAK1: 3,60\n- SPAK2: 3,51'), '• SPAK1: 3,60\n• SPAK2: 3,51');
  assert.equal(rapikanJawaban('n=165, alpha 0,936'), 'n=165, alpha 0,936');
});

test('paragraf dipertahankan, baris kosong berlebih dirapatkan', () => {
  const teks = 'Paragraf satu.\n\nParagraf dua.';
  assert.equal(rapikanJawaban(teks), teks);
  assert.equal(rapikanJawaban('A.\n\n\n\nB.'), 'A.\n\nB.');
});
