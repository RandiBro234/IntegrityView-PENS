/* Pembungkus pemanggilan LLM.

   Aturan yang dijaga di sini:
   - Nama model dan endpoint HANYA dari environment. Tidak ada nama model di kode,
     supaya mengganti penyedia tidak perlu menyentuh source.
   - Batas waktu 20 detik, suhu rendah, keluaran maksimal 400 token.
   - Kegagalan apa pun (jaringan, timeout, status non-2xx, body rusak) diterjemahkan
     menjadi LlmTidakTersedia supaya endpoint bisa membalas 503 tanpa membocorkan
     detail internal ke pengguna.

   Modul ini memakai `fetch` dan `AbortSignal.timeout` yang tersedia di Deno maupun
   Node 24, sehingga bisa dites tanpa Deno.
*/

export class LlmTidakTersedia extends Error {}

/* Deno.env di produksi, process.env saat dites di Node. */
function env(nama: string): string {
  const deno = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno;
  if (deno) return (deno.env.get(nama) ?? '').trim();
  return (process.env[nama] ?? '').trim();
}

export interface KonfigLlm {
  baseUrl: string;
  model: string;
  apiKey: string;
  stub: string;
  timeoutMs: number;
  maxToken: number;
  suhu: number;
}

export function konfigLlm(): KonfigLlm {
  return {
    baseUrl: env('LLM_BASE_URL').replace(/\/$/, ''),
    model: env('LLM_MODEL'),
    apiKey: env('LLM_API_KEY'),
    stub: env('LLM_STUB').toLowerCase(),
    timeoutMs: Number(env('LLM_TIMEOUT_MS') || 20000),
    maxToken: Number(env('LLM_MAX_TOKEN') || 400),
    suhu: Number(env('LLM_SUHU') || 0.1)
  };
}

/* Balasan tetap untuk mode stub. Dipakai agar tes dan pengembangan UI tidak
   memanggil layanan berbayar. */
const BALASAN_STUB =
  'Ini jawaban contoh dari mode stub. Angka tidak diambil dari data sungguhan.';

export async function tanyaLlm(pesan: { system: string; user: string }, konfig = konfigLlm()): Promise<string> {
  /* LLM_STUB=1 -> balasan tetap; LLM_STUB=gagal -> mensimulasikan gangguan LLM. */
  if (konfig.stub === '1' || konfig.stub === 'ok' || konfig.stub === 'true') return BALASAN_STUB;
  if (konfig.stub === 'gagal') throw new LlmTidakTersedia('stub: gangguan disimulasikan');

  if (!konfig.baseUrl || !konfig.model || !konfig.apiKey) {
    throw new LlmTidakTersedia('konfigurasi LLM belum lengkap');
  }

  let res: Response;
  try {
    res = await fetch(`${konfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${konfig.apiKey}`
      },
      body: JSON.stringify({
        model: konfig.model,
        messages: [
          { role: 'system', content: pesan.system },
          { role: 'user', content: pesan.user }
        ],
        temperature: konfig.suhu,
        max_tokens: konfig.maxToken
      }),
      signal: AbortSignal.timeout(konfig.timeoutMs)
    });
  } catch (err) {
    /* Timeout dan gangguan jaringan diperlakukan sama: layanan tidak tersedia. */
    const alasan = err instanceof Error ? err.name : 'unknown';
    throw new LlmTidakTersedia(`gagal memanggil LLM (${alasan})`);
  }

  if (!res.ok) {
    /* Status saja, tanpa body: body bisa memuat potongan prompt atau kunci. */
    throw new LlmTidakTersedia(`LLM membalas HTTP ${res.status}`);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new LlmTidakTersedia('balasan LLM bukan JSON');
  }

  const isi = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
  if (typeof isi !== 'string' || !isi.trim()) {
    throw new LlmTidakTersedia('balasan LLM kosong');
  }
  return isi.trim();
}
