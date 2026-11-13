import { bersihkanCacheSurvei } from './cache.js';
import { normalisasiBaris } from './normalize.js';

/* ---------------------------------------------------------------------
   Store data nyata
   --------------------------------------------------------------------- */
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const SIMULASI_AKTIF = String(import.meta.env.VITE_ENABLE_SIMULATION ?? 'true') !== 'false';

export const store = {
  loaded: false,
  error: null,
  records: [],
  dibuang: {},
  duplikat: {},
  periodeTersedia: {},
  rlsTerbuka: false
};

/* Ambil baris survei lewat RPC aman secara berhalaman. Server sudah membuang
   email dari data_jawaban dan tidak mengirim kolom email_responden. */
export async function muatDataSurvei() {
  if (store.loaded) return store;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    store.loaded = true;
    store.error = 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi';
    return store;
  }
  try {
    const headers = {
      apikey: SUPABASE_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    if (SUPABASE_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
    const rows = [];
    const ukuranHalaman = 1000;
    for (let offset = 0; ;) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/survey_rows_safe`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_limit: ukuranHalaman, p_offset: offset })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} saat membaca survey_rows_safe`);
      const halaman = await res.json();
      if (!Array.isArray(halaman) || halaman.length === 0) break;
      rows.push(...halaman);
      offset += halaman.length;
    }
    store.rlsTerbuka = false;
    const { records, dibuang, duplikat } = normalisasiBaris(rows);
    store.records = records;
    store.dibuang = dibuang;
    store.duplikat = duplikat;
    records.forEach((r) => {
      store.periodeTersedia[r.periode] = (store.periodeTersedia[r.periode] || 0) + 1;
    });
    store.error = null;
    /* Buang cache yang sempat dihitung dari simulasi sebelum data tiba. */
    bersihkanCacheSurvei();
  } catch (err) {
    store.error = err.message;
  } finally {
    store.loaded = true;
  }
  return store;
}
