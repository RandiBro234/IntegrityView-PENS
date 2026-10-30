/* Klien Edge Function kirim-laporan. Anon key hanya untuk memanggil function;
   tabel pengaduan/whistleblowing tidak bisa diakses langsung dari browser. */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const TIMEOUT_MS = 15000;

export const laporanApiSiap = Boolean(SUPABASE_URL && SUPABASE_KEY);

function headers() {
  const h = { apikey: SUPABASE_KEY, Accept: 'application/json' };
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

export async function kirimLaporan(payload) {
  if (!laporanApiSiap) {
    throw new Error('Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/kirim-laporan`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || `Gagal mengirim laporan (HTTP ${res.status}).`);
    }
    return body.data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Waktu pengiriman habis. Periksa koneksi lalu coba lagi.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
