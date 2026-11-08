/* Stub @supabase/supabase-js untuk pengujian lokal tanpa Docker.

   Meniru bagian klien yang dipakai Edge Function IntegrityView:
     - from(tabel).select(kolom).order(kolom, {ascending}).limit(n)
     - rpc(nama, argumen)
     - storage.from(bucket).remove(paths)   (dipakai kirim-laporan)
     - storage.from(bucket).createSignedUploadUrl()

   Semua panggilan diteruskan ke REST PostgREST / RPC Supabase sungguhan
   memakai anon key di environment. Jadi data tetap asli; yang diganti hanya
   pustaka kliennya.
*/

const URL_PROYEK = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KUNCI = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

function headers(extra = {}) {
  const key = KUNCI();
  const h = { apikey: key, 'Content-Type': 'application/json', ...extra };
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
  return h;
}

class QueryBuilder {
  #tabel;
  #kolom = '*';
  #urut = null;
  #batas = null;
  #filter = [];

  constructor(tabel) {
    this.#tabel = tabel;
  }

  select(kolom) {
    this.#kolom = kolom;
    return this;
  }

  eq(kolom, nilai) {
    this.#filter.push(`${kolom}=eq.${encodeURIComponent(String(nilai))}`);
    return this;
  }

  order(kolom, opsi = {}) {
    this.#urut = `${kolom}.${opsi.ascending === false ? 'desc' : 'asc'}`;
    return this;
  }

  limit(n) {
    this.#batas = n;
    return this;
  }

  /* QueryBuilder bersifat thenable supaya `await` tanpa .limit() juga jalan. */
  then(resolve_, reject_) {
    return this.#eksekusi().then(resolve_, reject_);
  }

  async #eksekusi() {
    const param = new URLSearchParams({ select: this.#kolom });
    if (this.#urut) param.set('order', this.#urut);
    if (this.#batas != null) param.set('limit', String(this.#batas));
    this.#filter.forEach((f) => {
      const [k, v] = f.split('=');
      param.append(k, v);
    });

    const res = await fetch(`${URL_PROYEK()}/rest/v1/${this.#tabel}?${param}`, { headers: headers() });
    if (!res.ok) {
      const teks = await res.text();
      return { data: null, error: { message: `HTTP ${res.status}: ${teks.slice(0, 120)}` } };
    }
    return { data: await res.json(), error: null };
  }
}

export function createClient() {
  return {
    from(tabel) {
      return new QueryBuilder(tabel);
    },
    async rpc(nama, argumen = {}) {
      const res = await fetch(`${URL_PROYEK()}/rest/v1/rpc/${nama}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(argumen)
      });
      if (!res.ok) {
        const teks = await res.text();
        return { data: null, error: { message: `HTTP ${res.status}: ${teks.slice(0, 120)}` } };
      }
      return { data: await res.json(), error: null };
    },
    storage: {
      from() {
        return {
          async remove() {
            return { data: null, error: { message: 'storage tidak dipakai pada uji chatbot' } };
          },
          async createSignedUploadUrl() {
            return { data: null, error: { message: 'storage tidak dipakai pada uji chatbot' } };
          },
          getPublicUrl() {
            return { data: { publicUrl: '' } };
          }
        };
      }
    }
  };
}
