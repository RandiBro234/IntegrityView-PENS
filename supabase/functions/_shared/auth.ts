import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type Pengguna = {
  id: string;
  role: 'admin' | 'sivitas';
  email?: string;
};

export async function penggunaDariRequest(
  req: Request
): Promise<{ pengguna?: Pengguna; error?: string }> {
  const otoritas = req.headers.get('authorization') || '';
  const token = otoritas.toLowerCase().startsWith('bearer ')
    ? otoritas.slice(7).trim()
    : '';
  if (!token) {
    return { error: 'Sesi tidak ditemukan. Silakan masuk.' };
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) {
    return { error: 'Konfigurasi Supabase tidak lengkap.' };
  }

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return { error: 'Sesi tidak valid. Silakan masuk ulang.' };
  }

  const role = data.user.app_metadata?.role === 'admin' ? 'admin' : 'sivitas';
  return {
    pengguna: {
      id: data.user.id,
      role,
      email: data.user.email
    }
  };
}
