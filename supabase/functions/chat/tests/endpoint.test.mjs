/* Tes endpoint /chat: validasi 422, batas 429, gangguan 503, bentuk 200.

   Endpoint diuji lewat `jawabChat()` (inti logika), bukan Deno.serve, supaya
   bisa dijalankan dengan Node tanpa Edge Runtime.

   Dijalankan: node --test supabase/functions/chat/tests/endpoint.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jawabChat, cariDasar } from '../lib/penjawab.ts';
import { kumpulkan, periodeTerbaru, KOLOM } from '../lib/sumber.ts';
import { LlmTidakTersedia } from '../lib/llm.ts';
import { validasiChat, MAKS_PERTANYAAN } from '../lib/validasi.ts';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRI = JSON.parse(await readFile(resolve(AKAR, 'lib/instrumen.json'), 'utf8'));

/* Data contoh: bentuk sama dengan hasil kumpulkan(). */
const BARIS_CONTOH = buatBaris(REGISTRI);

function buatBaris(registri) {
  const instrumen = registri.instrumen.find((i) => i.slug === 'spip');
  const baris = [];
  for (let i = 0; i < 40; i++) {
    const jawaban = {};
    instrumen.butir.forEach((b, n) => {
      jawaban[b.teks] = String(((i + n) % 4) + 1);
    });
    baris.push({
      nama_instrumen: 'SPIP',
      data_jawaban: jawaban,
      created_at: '2026-10-15T03:00:00+00:00'
    });
  }
  return baris;
}

const DATA_CONTOH = kumpulkan(BARIS_CONTOH, REGISTRI);

function deps(ubah = {}) {
  return {
    registri: REGISTRI,
    ambilData: async () => DATA_CONTOH,
    tanyaLlm: async () => 'Butir terendah adalah SPIP3 dengan skor 1,50 dari 4.',
    cekBatas: async () => true,
    ...ubah
  };
}

/* ---------------------------------------------------------------------------
   Validasi 422
   --------------------------------------------------------------------------- */

test('pertanyaan kosong -> 422', async () => {
  const h = await jawabChat({ pertanyaan: '   ' }, deps());
  assert.equal(h.status, 422);
  assert.match(String(h.body.error), /kosong/i);
});

test('pertanyaan lebih dari 300 karakter -> 422', async () => {
  const h = await jawabChat({ pertanyaan: 'a'.repeat(MAKS_PERTANYAAN + 1) }, deps());
  assert.equal(h.status, 422);
});

test('pertanyaan tepat 300 karakter diterima', async () => {
  const h = await jawabChat({ pertanyaan: 'a'.repeat(MAKS_PERTANYAAN) }, deps());
  assert.equal(h.status, 200);
});

test('body bukan objek -> 422', async () => {
  for (const badan of [null, 'teks', [1, 2], 42]) {
    const h = await jawabChat(badan, deps());
    assert.equal(h.status, 422, `body ${JSON.stringify(badan)}`);
  }
});

test('instrumen tak dikenal -> 422', async () => {
  const h = await jawabChat({ pertanyaan: 'halo', instrumen: '<script>' }, deps());
  assert.equal(h.status, 422);
});

test('instrumen valid diterima dalam bentuk slug maupun nama', () => {
  assert.doesNotThrow(() => validasiChat({ pertanyaan: 'a', instrumen: 'spip' }, REGISTRI));
  assert.doesNotThrow(() => validasiChat({ pertanyaan: 'a', instrumen: 'SPIP' }, REGISTRI));
  assert.doesNotThrow(() => validasiChat({ pertanyaan: 'a', instrumen: 'Survei Persepsi Anti Korupsi' }, REGISTRI));
});

/* ---------------------------------------------------------------------------
   429 dan 503
   --------------------------------------------------------------------------- */

test('batas pemakaian terlampaui -> 429', async () => {
  const h = await jawabChat({ pertanyaan: 'halo' }, deps({ cekBatas: async () => false }));
  assert.equal(h.status, 429);
});

test('LLM gagal -> 503 dengan kode chatbot_tidak_tersedia', async () => {
  const h = await jawabChat(
    { pertanyaan: 'halo' },
    deps({
      tanyaLlm: async () => {
        throw new LlmTidakTersedia('uji');
      }
    })
  );
  assert.equal(h.status, 503);
  assert.equal(h.body.kode, 'chatbot_tidak_tersedia');
});

test('database gagal -> 503, bukan 500', async () => {
  const h = await jawabChat(
    { pertanyaan: 'halo' },
    deps({
      ambilData: async () => {
        throw new Error('koneksi putus');
      }
    })
  );
  assert.equal(h.status, 503);
});

test('penolakan 429 terjadi sebelum memanggil LLM', async () => {
  let dipanggil = false;
  const h = await jawabChat(
    { pertanyaan: 'halo' },
    deps({
      cekBatas: async () => false,
      tanyaLlm: async () => {
        dipanggil = true;
        return 'x';
      }
    })
  );
  assert.equal(h.status, 429);
  assert.equal(dipanggil, false, 'LLM dipanggil padahal sudah kena batas');
});

/* ---------------------------------------------------------------------------
   200 dan isi jawaban
   --------------------------------------------------------------------------- */

test('jawaban 200 berisi jawaban dan dasar', async () => {
  const h = await jawabChat({ pertanyaan: 'butir mana yang paling lemah di SPIP?' }, deps());
  assert.equal(h.status, 200);
  assert.equal(typeof h.body.jawaban, 'string');
  assert.deepEqual(h.body.dasar, ['SPIP3']);
});

test('dasar kosong bila jawaban tidak menyebut kode butir', async () => {
  const h = await jawabChat({ pertanyaan: 'halo' }, deps({ tanyaLlm: async () => 'Skor SPIP 3,07 dari 4.' }));
  assert.equal(h.status, 200);
  assert.deepEqual(h.body.dasar, []);
});

test('kode butir yang tidak ada di konteks tidak masuk dasar', () => {
  assert.deepEqual(cariDasar('menurut SPAK1 dan SPIP3', ['SPIP3']), ['SPIP3']);
  assert.deepEqual(cariDasar('SPIP30 bukan SPIP3', ['SPIP3']), ['SPIP3']);
});

test('tanpa data sama sekali -> 200 dengan pesan jelas, bukan 503', async () => {
  const h = await jawabChat(
    { pertanyaan: 'halo' },
    deps({ ambilData: async () => ({ periode: '', perInstrumen: [], dibuang: 0, totalBaris: 0 }) })
  );
  assert.equal(h.status, 200);
  assert.match(String(h.body.jawaban), /Belum ada data/i);
});

test('instrumen valid tetapi belum punya data dijawab tanpa memanggil LLM', async () => {
  let dipanggil = false;
  const h = await jawabChat(
    { pertanyaan: 'apa kabar SPAK?' },
    deps({
      ambilData: async () => ({ periode: '2026-ganjil', perInstrumen: DATA_CONTOH.perInstrumen, dibuang: 0, totalBaris: 0 }),
      tanyaLlm: async () => {
        dipanggil = true;
        return 'x';
      }
    })
  );
  assert.equal(h.status, 200);
  assert.match(String(h.body.jawaban), /belum tersedia/i);
});

/* ---------------------------------------------------------------------------
   Sumber data: kolom dan privasi
   --------------------------------------------------------------------------- */

test('query hanya mengambil kolom yang diizinkan', () => {
  const kolom = KOLOM.split(',');
  assert.deepEqual(kolom.sort(), ['created_at', 'data_jawaban', 'nama_instrumen'].sort());
  assert.ok(!KOLOM.includes('email'), 'email_responden tidak boleh di-select');
  assert.ok(!KOLOM.includes('id'), 'id baris tidak diperlukan');
});

test('kumpulkan() mengabaikan instrumen yang tidak dikenal', () => {
  const hasil = kumpulkan(
    [{ nama_instrumen: 'Instrumen Karangan', data_jawaban: {}, created_at: '2026-10-15T03:00:00+00:00' }],
    REGISTRI
  );
  assert.equal(hasil.perInstrumen.length, 0);
});

test('kumpulkan() membuang baris dengan jumlah butir salah', () => {
  const hasil = kumpulkan(
    [{ nama_instrumen: 'SPIP', data_jawaban: { 'Etika & integritas': '3' }, created_at: '2026-10-15T03:00:00+00:00' }],
    REGISTRI
  );
  assert.equal(hasil.dibuang, 1);
  assert.equal(hasil.perInstrumen.length, 0);
});

test('periode terbaru dipilih dengan urutan semester yang benar', () => {
  assert.equal(periodeTerbaru(['2025-genap', '2025-ganjil', '2026-genap']), '2026-genap');
  assert.equal(periodeTerbaru(['2025-ganjil', '2026-ganjil']), '2026-ganjil');
  assert.equal(periodeTerbaru([]), null);
});

test('periode ganjil dan genap pada tahun yang sama diurutkan benar', () => {
  /* Ganjil (Sep-Feb) terjadi SETELAH genap (Mar-Agu) pada tahun yang sama. */
  assert.equal(periodeTerbaru(['2026-genap', '2026-ganjil']), '2026-ganjil');
  assert.equal(periodeTerbaru(['2025-ganjil', '2026-genap']), '2026-genap');
});

test('pembanding memakai periode sebelumnya, bukan periode setelahnya', () => {
  const baris = [
    ...buatBarisPeriode('2025-genap', 30),
    ...buatBarisPeriode('2026-ganjil', 40)
  ];
  const hasil = kumpulkan(baris, REGISTRI);
  assert.equal(hasil.periode, '2026-ganjil');
  const spip = hasil.perInstrumen.find((d) => d.instrumen.slug === 'spip');
  assert.equal(spip.agregatBanding?.periode, '2025-genap');
});

test('kualitas dibuang dihitung per instrumen', () => {
  const baris = [
    ...buatBarisPeriode('2026-ganjil', 5),
    { nama_instrumen: 'SPIP', data_jawaban: { 'Etika & integritas': '3' }, created_at: '2026-10-16T03:00:00+00:00' }
  ];
  const hasil = kumpulkan(baris, REGISTRI);
  assert.equal(hasil.dibuang, 1);
  assert.equal(hasil.perInstrumen[0].agregat.kualitas.dibuang, 1);
});

function buatBarisPeriode(periode, jumlah) {
  const instrumen = REGISTRI.instrumen.find((i) => i.slug === 'spip');
  const bulan = periode.endsWith('ganjil') ? '10' : '04';
  const tahun = periode.split('-')[0];
  const baris = [];
  for (let i = 0; i < jumlah; i++) {
    const jawaban = {};
    instrumen.butir.forEach((b, n) => {
      jawaban[b.teks] = String(((i + n) % 4) + 1);
    });
    baris.push({
      nama_instrumen: 'SPIP',
      data_jawaban: jawaban,
      created_at: `${tahun}-${bulan}-15T03:00:00+00:00`
    });
  }
  return baris;
}
