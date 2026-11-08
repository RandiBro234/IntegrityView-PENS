/* Tes perapian teks jawaban.

   Panel obrolan menampilkan teks apa adanya, jadi penanda markdown yang lolos
   dari model akan tampil sebagai karakter mentah (**tebal**, # judul).
   Fungsi ini harus membuang penanda tanpa mengubah isi atau angka.

   Dijalankan: node --test supabase/functions/chat/tests/format.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { rapikanJawaban } from '../lib/format.ts';

test('membuang penanda tebal', () => {
  assert.equal(rapikanJawaban('Butir **GRAT3** memiliki skor 3,13.'), 'Butir GRAT3 memiliki skor 3,13.');
  assert.equal(rapikanJawaban('__penting__ dan **juga**'), 'penting dan juga');
});

test('membuang penanda miring', () => {
  assert.equal(rapikanJawaban('Ini *miring* saja.'), 'Ini miring saja.');
});

test('membuang penanda kode', () => {
  assert.equal(rapikanJawaban('Pakai `SPIP3` ya.'), 'Pakai SPIP3 ya.');
  assert.equal(rapikanJawaban('```json\n{}\n```'), '{}');
});

test('membuang judul markdown', () => {
  assert.equal(rapikanJawaban('## Ringkasan\nSkor 3,61'), 'Ringkasan\nSkor 3,61');
});

test('bullet jadi karakter titik', () => {
  assert.equal(rapikanJawaban('- SPAK1\n- SPAK2'), '• SPAK1\n• SPAK2');
  assert.equal(rapikanJawaban('* satu\n* dua'), '• satu\n• dua');
});

test('mempertahankan pemisah paragraf', () => {
  const teks = 'Paragraf pertama.\n\nParagraf kedua.';
  assert.equal(rapikanJawaban(teks), teks);
});

test('merapatkan baris kosong berlebih', () => {
  assert.equal(rapikanJawaban('A.\n\n\n\nB.'), 'A.\n\nB.');
});

test('tidak mengubah angka', () => {
  const teks = 'Skor 3,61 dengan n=165 dan alpha 0,936; persentase 96,3%.';
  assert.equal(rapikanJawaban(teks), teks);
});

test('teks kosong tetap kosong', () => {
  assert.equal(rapikanJawaban(''), '');
  assert.equal(rapikanJawaban('   \n\n  '), '');
});

test('tidak merusak tanda bintang yang bukan markdown', () => {
  /* Perkalian atau catatan kaki bertanda bintang tidak lazim di jawaban ini,
     tetapi jangan sampai menghapus isi. */
  assert.equal(rapikanJawaban('a * b = c'), 'a * b = c');
});
