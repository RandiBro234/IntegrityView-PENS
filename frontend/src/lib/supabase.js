import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const KUNCI_SECRET = SUPABASE_KEY.startsWith('sb_secret_');

if (KUNCI_SECRET) {
  console.error('VITE_SUPABASE_ANON_KEY berisi secret key. Gunakan publishable/anon key, bukan sb_secret_.');
}

export const supabaseSiap = Boolean(SUPABASE_URL && SUPABASE_KEY && !KUNCI_SECRET);

export const supabase = supabaseSiap
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
  : null;

export { SUPABASE_KEY, SUPABASE_URL };
