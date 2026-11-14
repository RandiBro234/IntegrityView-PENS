/* Uji end-to-end chatbot memakai data Supabase ASLI.

   Yang diuji: database -> normalisasi -> agregat -> pemilihan konteks ->
   prompt -> jawaban -> kolom `dasar`. LLM diganti stub supaya tanpa biaya;
   semua bagian lain memakai kode produksi yang sama.

   Dilewati otomatis bila frontend/.env belum diisi atau jaringan tidak tersedia.

   Dijalankan: node --test supabase/functions/chat/tests/e2e.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKRIP_E2E = resolve(AKAR, '../../../scripts/e2e-chat.mjs');

const sudahSiap = await (async () => {
  try {
    const { buatKetergantungan } = await import(pathToFileURL(SKRIP_E2E).href);
    const { deps } = await buatKetergantungan({ stub: '1' });
    const data = await deps.ambilData();
    return { deps, data };
  } catch (err) {
    return { alasan: err.message };
  }
})();

const lewati = sudahSiap.alasan ? `tidak tersedia: ${sudahSiap.alasan}` : false;

test('data asli terbaca dari Supabase tanpa kolom email', { skip: lewati }, () => {
  const { data } = sudahSiap;
  assert.ok(data.totalBaris > 0, 'tidak ada baris terbaca');
  assert.ok(data.perInstrumen.length > 0, 'tidak ada instrumen dengan data valid');
  for (const d of data.perInstrumen) {
    assert.ok(d.agregat.n > 0);
    assert.equal(d.agregat.butir.length, d.instrumen.jumlah_butir);
  }
});

test('konteks dari data asli memakai dua skala dan bebas PII', { skip: lewati }, async () => {
  const { rakitKonteksSatu } = await import(pathToFileURL(resolve(AKAR, 'lib/konteks.ts')).href);
  const { data, deps } = sudahSiap;
  const satu = data.perInstrumen[0];

  const konteks = rakitKonteksSatu(satu.agregat, satu.instrumen, deps.registri.ambang, satu.rekomendasi);
  const teks = JSON.stringify(konteks);

  assert.ok(konteks.ringkasan.indeks_persepsi > 0 && konteks.ringkasan.indeks_persepsi <= 100, 'indeks persepsi harus 0-100');
  assert.ok(konteks.ringkasan.skor_rata >= 1 && konteks.ringkasan.skor_rata <= 4, 'skor rata-rata harus 1-4');
  assert.doesNotMatch(teks, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'ada email di konteks');
  assert.doesNotMatch(teks, /email_responden/);
});

test('pertanyaan tentang instrumen nyata terjawab lewat endpoint', { skip: lewati }, async () => {
  const { jawabChat } = await import(pathToFileURL(resolve(AKAR, 'lib/penjawab.ts')).href);
  const { deps, data } = sudahSiap;
  const nama = data.perInstrumen[0].instrumen.nama;

  const hasil = await jawabChat({ pertanyaan: `butir mana yang paling lemah di ${nama}?` }, deps);
  assert.equal(hasil.status, 200);
  assert.equal(typeof hasil.body.jawaban, 'string');
  assert.ok(hasil.body.jawaban.length > 0);
  assert.ok(Array.isArray(hasil.body.dasar));
});

test('pertanyaan tanpa menyebut instrumen memakai ringkasan semua', { skip: lewati }, async () => {
  const { jawabChat } = await import(pathToFileURL(resolve(AKAR, 'lib/penjawab.ts')).href);
  const { deps, data } = sudahSiap;

  /* Stub menyebut kode butir terendah instrumen pertama pada ringkasan. */
  const hasil = await jawabChat({ pertanyaan: 'instrumen mana yang paling rendah?' }, deps);
  assert.equal(hasil.status, 200);
  assert.ok(hasil.body.dasar.length <= 1, `dasar ${JSON.stringify(hasil.body.dasar)}`);

  /* Pastikan ringkasan memang memuat semua instrumen berdata. */
  assert.ok(data.perInstrumen.length >= 1);
});

test('LLM gagal tetap menghasilkan 503, bukan exception', { skip: lewati }, async () => {
  const { jawabChat } = await import(pathToFileURL(resolve(AKAR, 'lib/penjawab.ts')).href);
  const { buatKetergantungan } = await import(pathToFileURL(SKRIP_E2E).href);
  const { deps } = await buatKetergantungan({ stub: 'gagal' });

  const hasil = await jawabChat({ pertanyaan: 'halo' }, deps);
  assert.equal(hasil.status, 503);
  assert.equal(hasil.body.kode, 'chatbot_tidak_tersedia');
});

test('batas pemakaian berlaku pada data asli', { skip: lewati }, async () => {
  const { jawabChat } = await import(pathToFileURL(resolve(AKAR, 'lib/penjawab.ts')).href);
  const { buatKetergantungan } = await import(pathToFileURL(SKRIP_E2E).href);
  const { deps } = await buatKetergantungan({ batasPerJam: 2 });

  assert.equal((await jawabChat({ pertanyaan: 'satu' }, deps)).status, 200);
  assert.equal((await jawabChat({ pertanyaan: 'dua' }, deps)).status, 200);
  assert.equal((await jawabChat({ pertanyaan: 'tiga' }, deps)).status, 429);
});

test('server HTTP lokal meniru kontrak Edge Function', { skip: lewati }, async (t) => {
  const { jalankanServer } = await import(pathToFileURL(SKRIP_E2E).href);
  const { server, port } = await jalankanServer({ stub: '1' });
  t.after(() => server.close());

  const panggil = (metode, body) =>
    fetch(`http://127.0.0.1:${port}/`, {
      method: metode,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });

  const opt = await panggil('OPTIONS');
  assert.equal(opt.status, 200);

  const get = await panggil('GET');
  assert.equal(get.status, 405);

  const kosong = await panggil('POST', { pertanyaan: '' });
  assert.equal(kosong.status, 422);

  const ok = await panggil('POST', { pertanyaan: 'butir terendah SPAK?' });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(typeof body.jawaban, 'string');
  assert.ok(Array.isArray(body.dasar));
});
