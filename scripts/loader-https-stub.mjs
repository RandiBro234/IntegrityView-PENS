/* Loader hook untuk Node: mengarahkan import HTTPS gaya Deno
   (https://esm.sh/@supabase/supabase-js@2) ke stub lokal.

   Ini perlu karena Node tidak bisa meng-import URL https. Dengan hook ini,
   index.ts bisa dijalankan apa adanya tanpa mengubah kodenya.

   Stub sengaja dibuat pasif: hanya meniru bentuk klien yang dipakai
   (from().select().order().limit() dan rpc()), supaya rate limit dan
   pembacaan data memakai jalur yang sama seperti produksi tetapi tanpa
   supabase-js sungguhan.
*/

import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const STUB_SUPABASE = pathToFileURL(
  resolve(import.meta.dirname, 'stub-supabase-js.mjs')
).href;

registerHooks({
  resolve(spek, konteks, lanjut) {
    if (spek.startsWith('https://esm.sh/@supabase/')) {
      return { url: STUB_SUPABASE, shortCircuit: true };
    }
    return lanjut(spek, konteks);
  }
});
