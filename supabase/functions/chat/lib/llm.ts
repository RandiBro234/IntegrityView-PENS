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

/* Kuota/limit penyedia habis. Dipisah dari LlmTidakTersedia supaya endpoint bisa
   memberi pesan yang berbeda: ini bukan gangguan, hanya perlu tunggu. */
export class LlmKuotaHabis extends LlmTidakTersedia {
  tungguMs: number;

  constructor(pesan: string, tungguMs: number) {
    super(pesan);
    this.tungguMs = tungguMs;
  }
}

/* Deno.env di produksi, process.env saat dites di Node. */
function env(nama: string): string {
  const deno = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno;
  if (deno) return (deno.env.get(nama) ?? '').trim();
  return (process.env[nama] ?? '').trim();
}

/* Penyedia sedang sibuk (503/overload). Transien: layak dicoba ulang. */
export class LlmSibuk extends LlmTidakTersedia {
  tungguMs: number;

  constructor(pesan: string, tungguMs: number) {
    super(pesan);
    this.tungguMs = tungguMs;
  }
}

export interface KonfigLlm {
  baseUrl: string;
  model: string;
  apiKey: string;
  stub: string;
  timeoutMs: number;
  maxToken: number;
  suhu: number;
  reasoningEffort: string;
  /* Jumlah percobaan total (1 = tanpa ulang). */
  maksCoba: number;
  /* Batas tunggu yang masih diterima sebelum mengulang; lebih dari ini langsung
     menyerah supaya pengguna tidak menggantung. */
  maksTungguMs: number;
  /* Header tambahan untuk agregator yang memerlukannya (mis. HTTP-Referer).
     Ditulis sebagai JSON di LLM_EXTRA_HEADERS. */
  extraHeaders: Record<string, string>;
}

/* JSON yang salah bentuk tidak boleh membuat chatbot mati; cukup diabaikan. */
function bacaHeaderEkstra(mentah: string): Record<string, string> {
  if (!mentah) return {};
  try {
    const hasil = JSON.parse(mentah);
    if (!hasil || typeof hasil !== 'object' || Array.isArray(hasil)) return {};
    const bersih: Record<string, string> = {};
    for (const [k, v] of Object.entries(hasil)) {
      if (typeof v === 'string') bersih[k] = v;
    }
    return bersih;
  } catch {
    return {};
  }
}

export function konfigLlm(): KonfigLlm {
  return {
    baseUrl: env('LLM_BASE_URL').replace(/\/$/, ''),
    model: env('LLM_MODEL'),
    apiKey: env('LLM_API_KEY'),
    stub: env('LLM_STUB').toLowerCase(),
    timeoutMs: Number(env('LLM_TIMEOUT_MS') || 20000),
    maxToken: Number(env('LLM_MAX_TOKEN') || 300),
    suhu: Number(env('LLM_SUHU') || 0.1),
    reasoningEffort: env('LLM_REASONING_EFFORT'),
    maksCoba: Number(env('LLM_MAKS_COBA') || 3),
    maksTungguMs: Number(env('LLM_MAKS_TUNGGU_MS') || 6000),
    extraHeaders: bacaHeaderEkstra(env('LLM_EXTRA_HEADERS'))
  };
}

/* Balasan tetap untuk mode stub. Dipakai agar tes dan pengembangan UI tidak
   memanggil layanan berbayar. */
const BALASAN_STUB =
  'Ini jawaban contoh dari mode stub. Angka tidak diambil dari data sungguhan.';

/* Retry-After boleh berupa detik ("12") atau tanggal HTTP. Tanpa nilai, pakai
   jeda bawaan yang masih wajar untuk batas per menit. */
function tungguDari(res: Response): number {
  const nilai = res.headers.get('retry-after');
  if (!nilai) return 3000;
  const detik = Number(nilai);
  if (Number.isFinite(detik) && detik >= 0) return Math.min(detik * 1000, 30000);
  const tanggal = Date.parse(nilai);
  if (!Number.isNaN(tanggal)) return Math.max(0, Math.min(tanggal - Date.now(), 30000));
  return 3000;
}

const jeda = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export async function tanyaLlm(pesan: { system: string; user: string }, konfig = konfigLlm()): Promise<string> {
  /* LLM_STUB=1 -> balasan tetap; LLM_STUB=gagal -> mensimulasikan gangguan LLM. */
  if (konfig.stub === '1' || konfig.stub === 'ok' || konfig.stub === 'true') return BALASAN_STUB;
  if (konfig.stub === 'gagal') throw new LlmTidakTersedia('stub: gangguan disimulasikan');

  if (!konfig.baseUrl || !konfig.model || !konfig.apiKey) {
    throw new LlmTidakTersedia('konfigurasi LLM belum lengkap');
  }

  const maksCoba = Math.max(1, konfig.maksCoba);

  for (let coba = 1; coba <= maksCoba; coba++) {
    let res: Response;
    try {
      res = await fetch(`${konfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${konfig.apiKey}`,
          ...konfig.extraHeaders
        },
        body: JSON.stringify({
          model: konfig.model,
          messages: [
            { role: 'system', content: pesan.system },
            { role: 'user', content: pesan.user }
          ],
          temperature: konfig.suhu,
          max_tokens: konfig.maxToken,
          /* Hanya dikirim bila diisi. Gemini butuh "none"/"low" untuk mematikan
             proses berpikir; tanpa ini sebagian jatah token habis untuk thinking
             dan jawaban bisa terpotong. */
          ...(konfig.reasoningEffort ? { reasoning_effort: konfig.reasoningEffort } : {})
        }),
        signal: AbortSignal.timeout(konfig.timeoutMs)
      });
    } catch (err) {
      /* Timeout dan gangguan jaringan diperlakukan sama: layanan tidak tersedia. */
      const alasan = err instanceof Error ? err.name : 'unknown';
      throw new LlmTidakTersedia(`gagal memanggil LLM (${alasan})`);
    }

    if (res.status === 429) {
      /* Batas laju penyedia. Coba sekali lagi bila jedanya masih wajar;
         kalau tidak, laporkan sebagai kuota habis (bukan gangguan). */
      const tungguMs = tungguDari(res);
      if (coba < maksCoba && tungguMs <= konfig.maksTungguMs) {
        console.warn(`chatbot: batas laju penyedia, ulang dalam ${tungguMs} ms (percobaan ${coba}/${maksCoba})`);
        await jeda(tungguMs);
        continue;
      }
      throw new LlmKuotaHabis('kuota penyedia LLM sedang penuh', tungguMs);
    }

    if (res.status === 503 || res.status === 502 || res.status === 504) {
      /* Overload sementara di sisi penyedia ("high demand"). Ini gangguan
         sesaat, bukan salah konfigurasi, jadi dicoba ulang dengan jeda pendek. */
      const tungguMs = coba * 1500;
      if (coba < maksCoba) {
        console.warn(`chatbot: penyedia sibuk (HTTP ${res.status}), ulang dalam ${tungguMs} ms (percobaan ${coba}/${maksCoba})`);
        await jeda(tungguMs);
        continue;
      }
      throw new LlmSibuk(`penyedia LLM sibuk (HTTP ${res.status})`, tungguMs);
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

  throw new LlmTidakTersedia('LLM tidak merespons setelah beberapa percobaan');
}
