import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function buatClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak tersedia');
  }
  return createClient(url, key);
}
