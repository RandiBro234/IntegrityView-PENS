/* Peniru Deno minimal untuk menjalankan index.ts tanpa Docker.

   Tujuan: memverifikasi bahwa `index.ts` benar-benar bisa di-import dan
   dijalankan — menangkap salah sintaks, salah path import, atau salah rangkai
   dependensi — tanpa perlu Edge Runtime.

   Yang ditiru:
   - Deno.env.get()        -> process.env
   - Deno.serve(handler)   -> server HTTP lokal
   Yang TIDAK ditiru (tidak dipakai index.ts): Deno.readFile, KV, cron, dll.
*/

import { createServer } from 'node:http';

export function pasangDeno(env = {}) {
  process.env = { ...process.env, ...env };

  let handler = null;

  const Deno = {
    env: {
      get(nama) {
        return process.env[nama];
      }
    },
    serve(fn) {
      handler = fn;
      return Promise.resolve();
    }
  };

  globalThis.Deno = Deno;

  return {
    /* Jalankan satu permintaan terhadap handler yang sudah didaftarkan. */
    async panggil(metode, body, { headers = {} } = {}) {
      if (!handler) throw new Error('Deno.serve() belum dipanggil oleh index.ts');

      const req = new Request('http://127.0.0.1/chat', {
        method: metode,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
      });

      const res = await handler(req);
      const teks = await res.text();
      let json = null;
      try {
        json = JSON.parse(teks);
      } catch {
        /* bukan JSON */
      }
      return { status: res.status, teks, json, headers: Object.fromEntries(res.headers) };
    }
  };
}

/* Server HTTP sungguhan, untuk menguji lewat fetch. */
export async function jalankanDenganDeno(env = {}) {
  const peniru = pasangDeno(env);
  const modul = await import('../supabase/functions/chat/index.ts');

  const server = createServer(async (req, res) => {
    const bagian = [];
    for await (const b of req) bagian.push(b);
    const body = Buffer.concat(bagian).toString('utf8');

    const r = await peniru.panggil(req.method, body || undefined, { headers: req.headers });
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(r.teks);
  });

  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { server, port: server.address().port, modul, peniru };
}
