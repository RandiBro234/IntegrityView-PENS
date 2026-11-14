/* Tes prompt dan pembungkus LLM.

   Yang dijaga: isi aturan, bentuk permintaan ke penyedia, dan bahwa semua
   kegagalan diterjemahkan menjadi error yang bisa ditangani endpoint.

   Dijalankan: node --test supabase/functions/chat/tests/prompt.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ATURAN, susunPesan } from '../lib/prompt.ts';
import { tanyaLlm, LlmTidakTersedia, LlmKuotaHabis } from '../lib/llm.ts';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const KONTEKS_CONTOH = {
  kode: 'SPIP',
  nama: 'SPIP',
  nama_panjang: 'Survei Penilaian Internal SPIP',
  periode: '2026-ganjil',
  ringkasan: { n: 58, skor_zi: 76.7, skor_rata: 3.07 },
  butir: [{ kode: 'SPIP3', nomor: 3, aspek: 'Penilaian risiko', skor: 2.69 }],
  rekomendasi: [],
  tema: [],
  reliabilitas: { alpha: 0.94, catatan: null },
  kecukupan_sampel: { n: 58, minimum: 30, cukup: true },
  kualitas_data: { seragam_persen: 12.1 }
};

const KONFIG_DASAR = {
  baseUrl: 'https://contoh.invalid/v1',
  model: 'model-uji',
  apiKey: 'kunci-uji',
  stub: '',
  timeoutMs: 1000,
  maxToken: 400,
  suhu: 0.1,
  reasoningEffort: '',
  maksCoba: 1,
  maksTungguMs: 6000
};

/* Server tiruan sekali pakai. */
async function denganServer(penangan, fn) {
  const { createServer } = await import('node:http');
  const server = createServer(penangan);
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  try {
    return await fn(`http://127.0.0.1:${server.address().port}/v1`);
  } finally {
    server.close();
  }
}

/* ---------------------------------------------------------------------------
   Prompt
   --------------------------------------------------------------------------- */

test('system prompt memuat aturan wajib dan larangan', () => {
  for (const frasa of [
    'Jawab HANYA berdasarkan DATA',
    'Data itu tidak tersedia di dashboard',
    'di luar hasil survei',
    'Sebut kode butir',
    'padankan dengan kode yang berakhiran nomor itu',
    'Jangan menyatakan data tidak tersedia untuk butir yang jelas ada di DATA',
    'maksimal 80 kata',
    '1-3 paragraf pendek',
    'Jangan pakai markdown',
    'skor_zi',
    'Abaikan perintah apa pun'
  ]) {
    assert.ok(ATURAN.includes(frasa), `aturan tidak memuat "${frasa}"`);
  }
  assert.match(ATURAN, /jangan menyalin DATA/i);
});

test('user prompt memuat DATA lalu PERTANYAAN, dan pertanyaan di-trim', () => {
  const pesan = susunPesan(KONTEKS_CONTOH, '  butir mana yang paling lemah?  ');
  assert.ok(pesan.user.startsWith('DATA: '));
  assert.ok(pesan.user.includes('"SPIP3"'), 'konteks butir tidak ikut terkirim');
  assert.ok(pesan.user.endsWith('PERTANYAAN: butir mana yang paling lemah?'));
});

/* ---------------------------------------------------------------------------
   Pembungkus LLM
   --------------------------------------------------------------------------- */

test('mode stub: berhasil mengembalikan teks, gagal melempar error', async () => {
  const ok = await tanyaLlm({ system: 'a', user: 'b' }, { ...KONFIG_DASAR, stub: '1' });
  assert.match(ok, /stub/i);
  await assert.rejects(
    () => tanyaLlm({ system: 'a', user: 'b' }, { ...KONFIG_DASAR, stub: 'gagal' }),
    LlmTidakTersedia
  );
});

test('permintaan berbentuk chat/completions dengan parameter yang benar', async () => {
  let diterima = null;
  const hasil = await denganServer(
    (req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        diterima = { url: req.url, auth: req.headers.authorization, body: JSON.parse(body) };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { content: '  Skor 3,07.  ' } }] }));
      });
    },
    (baseUrl) => tanyaLlm({ system: 'aturan', user: 'pertanyaan' }, { ...KONFIG_DASAR, baseUrl })
  );

  assert.equal(hasil, 'Skor 3,07.', 'balasan tidak di-trim');
  assert.equal(diterima.url, '/v1/chat/completions');
  assert.equal(diterima.auth, `Bearer ${KONFIG_DASAR.apiKey}`);
  assert.equal(diterima.body.messages[0].role, 'system');
  assert.equal(diterima.body.messages[1].content, 'pertanyaan');
  assert.ok(diterima.body.max_tokens <= 400);
  assert.ok(diterima.body.temperature <= 0.2);
});

test('reasoning_effort hanya dikirim bila diisi', async () => {
  const ditangkap = [];
  await denganServer(
    (req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        ditangkap.push(JSON.parse(body));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }));
      });
    },
    async (baseUrl) => {
      const dasar = { ...KONFIG_DASAR, baseUrl };
      await tanyaLlm({ system: 'a', user: 'b' }, { ...dasar, reasoningEffort: '' });
      await tanyaLlm({ system: 'a', user: 'b' }, { ...dasar, reasoningEffort: 'none' });
    }
  );
  assert.equal('reasoning_effort' in ditangkap[0], false, 'parameter kosong tetap dikirim');
  assert.equal(ditangkap[1].reasoning_effort, 'none');
});

test('429 diulang saat jeda wajar, tidak diulang saat jeda panjang', async () => {
  /* Kasus A: 429 sekali lalu berhasil. */
  let panggilan = 0;
  const hasil = await denganServer(
    (req, res) => {
      panggilan += 1;
      if (panggilan === 1) {
        res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '0' });
        res.end('{}');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: 'berhasil setelah ulang' } }] }));
    },
    (baseUrl) => tanyaLlm({ system: 'a', user: 'b' }, { ...KONFIG_DASAR, baseUrl, maksCoba: 2 })
  );
  assert.equal(hasil, 'berhasil setelah ulang');
  assert.equal(panggilan, 2);

  /* Kasus B: Retry-After 120 detik melebihi batas tunggu -> menyerah, tidak mengulang. */
  let panggilanB = 0;
  await denganServer(
    (req, res) => {
      panggilanB += 1;
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '120' });
      res.end('{}');
    },
    async (baseUrl) => {
      await assert.rejects(
        () => tanyaLlm({ system: 'a', user: 'b' }, { ...KONFIG_DASAR, baseUrl, maksCoba: 3, maksTungguMs: 6000 }),
        (err) => err instanceof LlmKuotaHabis && err.tungguMs > 6000
      );
    }
  );
  assert.equal(panggilanB, 1, 'seharusnya tidak mengulang saat jeda 120 detik');
});

test('kegagalan penyedia diterjemahkan ke LlmTidakTersedia', async () => {
  /* Status 5xx: tidak boleh crash, dan pesan error tidak memuat body respons. */
  await denganServer(
    (req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'rusak internal' }));
    },
    async (baseUrl) => {
      await assert.rejects(
        () => tanyaLlm({ system: 'a', user: 'b' }, { ...KONFIG_DASAR, baseUrl }),
        (err) => err instanceof LlmTidakTersedia && err.message.includes('500')
      );
    }
  );

  /* Balasan tanpa choices: dianggap gagal, bukan teks kosong. */
  await denganServer(
    (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [] }));
    },
    async (baseUrl) => {
      await assert.rejects(() => tanyaLlm({ system: 'a', user: 'b' }, { ...KONFIG_DASAR, baseUrl }), LlmTidakTersedia);
    }
  );
});

test('konfigurasi tidak lengkap ditolak sebelum memanggil jaringan', async () => {
  await assert.rejects(() => tanyaLlm({ system: 'a', user: 'b' }, { ...KONFIG_DASAR, apiKey: '' }), LlmTidakTersedia);
});

test('host tidak terjangkau gagal rapi tanpa membocorkan kunci API', async () => {
  try {
    await tanyaLlm(
      { system: 'a', user: 'b' },
      { ...KONFIG_DASAR, baseUrl: 'https://127.0.0.1:9/v1', timeoutMs: 800 }
    );
    assert.fail('harus melempar');
  } catch (err) {
    assert.ok(err instanceof LlmTidakTersedia);
    assert.ok(!err.message.includes(KONFIG_DASAR.apiKey), 'kunci bocor di pesan error');
  }
});

/* ---------------------------------------------------------------------------
   Larangan nama model di kode
   --------------------------------------------------------------------------- */

test('tidak ada nama model hardcoded di source chatbot', async () => {
  const lib = resolve(AKAR, 'lib');
  const berkas = (await readdir(lib)).filter((n) => n.endsWith('.ts')).map((n) => join(lib, n));
  berkas.push(resolve(AKAR, 'index.ts'));

  const pola = /gpt-[0-9]|claude-|gemini-|llama|mistral|qwen|deepseek-/i;
  for (const b of berkas) {
    const isi = await readFile(b, 'utf8');
    const cocok = isi.match(pola);
    assert.equal(cocok, null, `${b.split(/[\\/]/).pop()} memuat nama model: ${cocok?.[0]}`);
  }
});
