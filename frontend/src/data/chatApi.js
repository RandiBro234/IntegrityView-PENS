/* Klien Edge Function `chat`.

   Alasannya lewat Edge Function, bukan memanggil penyedia LLM langsung: kunci
   API tidak boleh ada di browser. Yang diketahui frontend hanya URL function.

   Bila VITE_CHAT_API_URL kosong, panel kembali memakai jawaban contoh sehingga
   aplikasi tetap berjalan tanpa backend (pola yang sama dengan mock.js).
*/

const CHAT_URL = (import.meta.env.VITE_CHAT_API_URL || '').replace(/\/$/, '');
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const TIMEOUT_MS = 25000;

/* Endpoint efektif:
   - VITE_CHAT_API_URL diisi        -> dipakai apa adanya (server lokal/proxy)
   - kosong, tapi Supabase ada      -> function `chat` di project Supabase
   - kosong semuanya                -> null, panel pakai jawaban contoh */
function urlChat() {
  if (CHAT_URL) return CHAT_URL;
  if (SUPABASE_URL && SUPABASE_KEY) return `${SUPABASE_URL}/functions/v1/chat`;
  return null;
}

export const chatSiap = Boolean(urlChat());

function headers() {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (SUPABASE_KEY) h.apikey = SUPABASE_KEY;
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

export class ChatError extends Error {
  constructor(status, pesan) {
    super(pesan);
    this.status = status;
  }
}

/* Pesan yang dilihat pengguna. Sengaja tidak menampilkan detail teknis. */
const PESAN_STATUS = {
  422: 'Pertanyaan tidak valid. Coba tulis lebih singkat.',
  429: 'Terlalu sering bertanya. Coba lagi beberapa saat lagi.',
  503: 'Asisten sedang tidak tersedia. Coba lagi nanti.'
};

export async function tanyaChat(pertanyaan, { instrumen = null } = {}) {
  const url = urlChat();
  if (!url) throw new ChatError(0, 'Chatbot belum diaktifkan.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(instrumen ? { pertanyaan, instrumen } : { pertanyaan }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new ChatError(res.status, PESAN_STATUS[res.status] || 'Asisten sedang tidak tersedia. Coba lagi nanti.');
    }

    const data = await res.json();
    const jawaban = typeof data.jawaban === 'string' ? data.jawaban.trim() : '';
    if (!jawaban) throw new ChatError(502, 'Asisten mengirim jawaban kosong. Coba lagi.');

    return {
      jawaban,
      dasar: Array.isArray(data.dasar) ? data.dasar.filter((k) => typeof k === 'string') : []
    };
  } catch (err) {
    if (err instanceof ChatError) throw err;
    if (err.name === 'AbortError') throw new ChatError(504, 'Asisten terlalu lama menjawab. Coba lagi.');
    throw new ChatError(0, 'Tidak dapat menghubungi asisten. Periksa koneksi.');
  } finally {
    clearTimeout(timer);
  }
}
