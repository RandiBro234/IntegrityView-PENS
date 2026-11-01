import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const BATAS_KIRIM = 5;
export const BATAS_UPLOAD = 15;
export const JENDELA_MENIT = 10;

function ipDari(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',').pop()!.trim();
  return 'unknown';
}

async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get('RATE_LIMIT_SALT') || 'integrityview';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${ip}`)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* Fail-open: gangguan pada pencatat rate limit tidak boleh memblokir
   laporan yang sah. */
export async function cekBatas(
  supabase: SupabaseClient,
  req: Request,
  aksi: string,
  limit: number
): Promise<boolean> {
  try {
    const p_ip_hash = await hashIp(ipDari(req));
    const { data, error } = await supabase.rpc('cek_rate_limit', {
      p_ip_hash,
      p_aksi: aksi,
      p_limit: limit,
      p_window_menit: JENDELA_MENIT
    });
    if (error) {
      console.error('rate limit:', error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error('rate limit exception:', err);
    return true;
  }
}
