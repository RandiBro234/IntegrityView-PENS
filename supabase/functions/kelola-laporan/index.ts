// Edge Function khusus admin: membaca daftar laporan, memperbarui status,
// dan menambah balasan. Tabel hanya bisa diakses memakai service role.
//
// Deploy (dari root project):
//   supabase functions deploy kelola-laporan --use-api
//
// Secret yang diperlukan:
//   ADMIN_KELOLA_TOKEN

import { CORS, json } from '../_shared/http.ts';
import { buatClient } from '../_shared/supabase.ts';
import { PayloadError } from '../_shared/errors.ts';

const TABEL = {
  pengaduan: 'pengaduan',
  wbs: 'whistleblowing'
} as const;

type Jenis = keyof typeof TABEL;

const STATUS = new Set(['Baru', 'Diproses', 'Selesai']);

function tokenValid(req: Request) {
  const expected = Deno.env.get('ADMIN_KELOLA_TOKEN') || '';
  const actual = req.headers.get('x-admin-token') || '';
  if (!expected || actual.length !== expected.length) return false;

  let beda = 0;
  for (let i = 0; i < expected.length; i += 1) {
    beda |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }
  return beda === 0;
}

function teks(nilai: unknown, nama: string, maks: number, wajib = false) {
  if (nilai == null) {
    if (wajib) throw new PayloadError(`${nama} wajib diisi.`);
    return '';
  }
  if (typeof nilai !== 'string') throw new PayloadError(`${nama} tidak valid.`);
  const hasil = nilai.trim();
  if (wajib && !hasil) throw new PayloadError(`${nama} wajib diisi.`);
  if (hasil.length > maks) throw new PayloadError(`${nama} maksimal ${maks} karakter.`);
  return hasil;
}

function jenisValid(nilai: unknown): Jenis {
  if (nilai === 'pengaduan' || nilai === 'wbs') return nilai;
  throw new PayloadError('jenis harus "pengaduan" atau "wbs".');
}

function statusValid(nilai: unknown) {
  if (typeof nilai !== 'string' || !STATUS.has(nilai)) {
    throw new PayloadError('status tidak valid.');
  }
  return nilai;
}

function arrayJson(nilai: unknown) {
  return Array.isArray(nilai) ? nilai : [];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (!tokenValid(req)) {
    return json({ error: 'Akses admin tidak valid.' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new PayloadError('Body harus berupa objek JSON.');
    }
    body = parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof PayloadError) return json({ error: error.message }, 400);
    return json({ error: 'Body bukan JSON yang valid.' }, 400);
  }

  const aksi = teks(body.aksi, 'aksi', 30, true);
  const supabase = buatClient();

  try {
    if (aksi === 'daftar') {
      const [pengaduan, whistleblowing] = await Promise.all([
        supabase.from(TABEL.pengaduan).select('*').order('created_at', { ascending: false }),
        supabase.from(TABEL.wbs).select('*').order('created_at', { ascending: false })
      ]);

      if (pengaduan.error) throw new Error(pengaduan.error.message);
      if (whistleblowing.error) throw new Error(whistleblowing.error.message);

      const laporan = [
        ...(pengaduan.data || []).map((row) => ({ ...row, jenis: 'pengaduan' })),
        ...(whistleblowing.data || []).map((row) => ({ ...row, jenis: 'wbs' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return json({ status: 'success', data: { laporan } });
    }

    if (aksi === 'perbarui') {
      const jenis = jenisValid(body.jenis);
      const kode = teks(body.kode, 'kode', 50, true);
      const status = statusValid(body.status);
      const pic = teks(body.pic, 'PIC', 200);
      const catatanPublik = teks(body.catatanPublik, 'catatan publik', 2000);
      const catatanInternalBaru = teks(body.catatanInternalBaru, 'catatan internal', 2000);

      if (status !== 'Baru' && !pic) {
        throw new PayloadError('PIC wajib diisi jika status bukan Baru.');
      }

      const { data: lama, error: galatBaca } = await supabase
        .from(TABEL[jenis])
        .select('*')
        .eq('kode', kode)
        .maybeSingle();

      if (galatBaca) throw new Error(galatBaca.message);
      if (!lama) return json({ error: 'Laporan tidak ditemukan.' }, 404);

      const sekarang = new Date().toISOString();
      const riwayat = arrayJson(lama.riwayat).slice();
      if (status !== lama.status) {
        riwayat.push({ status, tanggal: sekarang, catatan: catatanPublik });
      }

      const catatanInternal = arrayJson(lama.catatan_internal).slice();
      if (catatanInternalBaru) {
        catatanInternal.push({ tanggal: sekarang, catatan: catatanInternalBaru });
      }

      const { data, error } = await supabase
        .from(TABEL[jenis])
        .update({
          status,
          pic,
          riwayat,
          catatan_internal: catatanInternal,
          updated_at: sekarang
        })
        .eq('kode', kode)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return json({ status: 'success', data: { laporan: { ...data, jenis } } });
    }

    if (aksi === 'balas') {
      const jenis = jenisValid(body.jenis);
      const kode = teks(body.kode, 'kode', 50, true);
      const balasanTeks = teks(body.teks, 'balasan', 2000, true);
      const oleh = teks(body.oleh, 'nama admin', 200) || 'Admin Zona Integritas';

      const { data: lama, error: galatBaca } = await supabase
        .from(TABEL[jenis])
        .select('*')
        .eq('kode', kode)
        .maybeSingle();

      if (galatBaca) throw new Error(galatBaca.message);
      if (!lama) return json({ error: 'Laporan tidak ditemukan.' }, 404);

      const sekarang = new Date().toISOString();
      const balasan = arrayJson(lama.balasan).concat([{
        id: `bal-${crypto.randomUUID()}`,
        teks: balasanTeks,
        tanggal: sekarang,
        oleh,
        lampiran: []
      }]);

      const { data, error } = await supabase
        .from(TABEL[jenis])
        .update({ balasan, updated_at: sekarang })
        .eq('kode', kode)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return json({ status: 'success', data: { laporan: { ...data, jenis } } });
    }

    return json({ error: 'aksi tidak dikenal.' }, 400);
  } catch (error) {
    if (error instanceof PayloadError) return json({ error: error.message }, 400);
    console.error('kelola-laporan:', error);
    return json({ error: error instanceof Error ? error.message : 'Gagal memproses laporan.' }, 500);
  }
});
