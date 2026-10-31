/* Klien Edge Function laporan. Anon key hanya untuk memanggil function dan RPC
   pelacakan; tabel pengaduan/whistleblowing tidak bisa diakses langsung dari
   browser. Lampiran diunggah ke Storage memakai signed upload URL. */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const TIMEOUT_MS = 15000;
const TIMEOUT_UPLOAD_MS = 60000;

export const laporanApiSiap = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const MAKS_LAMPIRAN = 3;
export const MAKS_UKURAN_LAMPIRAN = 10 * 1024 * 1024;

const EKSTENSI_TIPE = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png'
};

function headers() {
  const h = { apikey: SUPABASE_KEY, Accept: 'application/json' };
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

function ekstensi(nama) {
  return (nama.split('.').pop() || '').toLowerCase();
}

function batalkanSetelah(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

function pesanJaringan(err) {
  if (err.name === 'AbortError') {
    return 'Waktu permintaan habis. Periksa koneksi lalu coba lagi.';
  }
  return err.message || 'Gagal menghubungi server.';
}

async function bodyJson(res) {
  return res.json().catch(() => ({}));
}

export function tipeLampiran(file) {
  const dariMime = (file.type || '')
    .toLowerCase()
    .replace('image/jpg', 'image/jpeg')
    .replace('image/pjpeg', 'image/jpeg')
    .replace('image/x-png', 'image/png');
  const dariEkstensi = EKSTENSI_TIPE[ekstensi(file.name)] || '';
  if (dariEkstensi && (!dariMime || dariMime === 'application/octet-stream')) {
    return dariEkstensi;
  }
  return dariMime || dariEkstensi;
}

export function validasiLampiranFile(file) {
  const tipe = tipeLampiran(file);
  const ext = ekstensi(file.name);
  if (!tipe || !Object.values(EKSTENSI_TIPE).includes(tipe) || !EKSTENSI_TIPE[ext]) {
    return 'Format lampiran harus PDF, Word, JPG, atau PNG.';
  }
  if (EKSTENSI_TIPE[ext] !== tipe && !(ext === 'jpeg' && tipe === 'image/jpeg')) {
    return 'Isi file tidak sesuai dengan ekstensinya.';
  }
  if (!file.size) return 'File lampiran kosong.';
  if (file.size > MAKS_UKURAN_LAMPIRAN) return `${file.name} melebihi batas 10MB.`;
  return '';
}

async function panggilFunction(nama, payload) {
  if (!laporanApiSiap) {
    throw new Error('Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }

  const { controller, timer } = batalkanSetelah(TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${nama}`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const body = await bodyJson(res);
    if (!res.ok) {
      throw new Error(body.error || `Permintaan gagal (HTTP ${res.status}).`);
    }
    return body.data;
  } catch (err) {
    throw new Error(pesanJaringan(err));
  } finally {
    clearTimeout(timer);
  }
}

export async function kirimLaporan(payload) {
  const data = await panggilFunction('kirim-laporan', payload);
  if (!data?.kode) throw new Error('Server tidak mengembalikan kode laporan.');
  return data;
}

export async function unggahLampiran(jenis, file) {
  const tipe = tipeLampiran(file);
  const tanda = await panggilFunction('buat-upload-lampiran', {
    jenis,
    nama: file.name,
    tipe,
    ukuran: file.size
  });
  if (!tanda?.signedUrl || !tanda?.path) {
    throw new Error('Server tidak mengembalikan URL unggahan.');
  }

  const { controller, timer } = batalkanSetelah(TIMEOUT_UPLOAD_MS);
  try {
    const res = await fetch(tanda.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': tipe,
        'cache-control': '3600',
        'x-upsert': 'false'
      },
      body: file,
      signal: controller.signal
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const pesan = detail ? `: ${detail.slice(0, 160)}` : ` (HTTP ${res.status})`;
      throw new Error(`Gagal mengunggah ${file.name}${pesan}`);
    }
  } catch (err) {
    throw new Error(pesanJaringan(err));
  } finally {
    clearTimeout(timer);
  }

  return { path: tanda.path, nama: file.name, tipe, ukuran: file.size };
}

export async function lacakLaporan(kode) {
  if (!laporanApiSiap) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  const { controller, timer } = batalkanSetelah(TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lacak_laporan`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kode: kode }),
      signal: controller.signal
    });
    const body = await bodyJson(res);
    if (!res.ok) {
      throw new Error(body.message || body.error || `Gagal melacak laporan (HTTP ${res.status}).`);
    }
    return body || null;
  } catch (err) {
    throw new Error(pesanJaringan(err));
  } finally {
    clearTimeout(timer);
  }
}
