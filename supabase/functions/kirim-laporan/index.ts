// Edge Function: menerima laporan pengaduan / whistleblowing dari frontend
// dan menyimpannya ke tabel public.pengaduan atau public.whistleblowing.
//
// Deploy (dari root project):
//   supabase functions deploy kirim-laporan --use-api
//
// Function ini sengaja tanpa JWT karena dipakai pengunjung publik. Validasi
// dilakukan di sini; anon tidak punya akses langsung ke tabel.

import { CORS, json } from '../_shared/http.ts';
import { buatClient } from '../_shared/supabase.ts';
import { cekBatas, BATAS_KIRIM } from '../_shared/limit.ts';
import { PayloadError } from '../_shared/errors.ts';
import {
  BUCKET,
  validasiLampiran,
  type LampiranMeta
} from '../_shared/lampiran.ts';
import { validasiLaporan } from './lib/validasi.ts';

async function hapusLampiran(
  supabase: ReturnType<typeof buatClient>,
  lampiran: LampiranMeta[]
) {
  if (!lampiran.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(lampiran.map((l) => l.path));
  if (error) console.error('Gagal menghapus lampiran:', error.message);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body bukan JSON yang valid' }, 400);
  }

  let laporan;
  try {
    laporan = validasiLaporan(body);
  } catch (error) {
    if (error instanceof PayloadError) {
      return json({ error: error.message }, 400);
    }
    throw error;
  }

  let lampiran: LampiranMeta[];
  try {
    const data = body as Record<string, unknown>;
    lampiran = validasiLampiran(data.lampiran, laporan.jenis);
  } catch (error) {
    if (error instanceof PayloadError) {
      return json({ error: error.message }, 400);
    }
    throw error;
  }

  const tabel = laporan.jenis === 'wbs' ? 'whistleblowing' : 'pengaduan';
  const riwayat = [
    {
      status: 'Baru',
      tanggal: new Date().toISOString(),
      catatan: 'Laporan diterima.'
    }
  ];

  const supabase = buatClient();

  if (!(await cekBatas(supabase, req, 'kirim', BATAS_KIRIM))) {
    await hapusLampiran(supabase, lampiran);
    return json(
      { error: 'Terlalu banyak laporan dari jaringan ini. Coba lagi dalam 10 menit.' },
      429
    );
  }

  const { data, error } = await supabase
    .from(tabel)
    .insert({
      judul: laporan.judul,
      kategori: laporan.kategori,
      lokasi: laporan.lokasi,
      deskripsi: laporan.deskripsi,
      anonim: laporan.anonim,
      nama_pelapor: laporan.nama_pelapor,
      kontak_pelapor: laporan.kontak_pelapor,
      hubungan: laporan.hubungan,
      status: 'Baru',
      riwayat,
      catatan_internal: [],
      balasan: [],
      lampiran
    })
    .select('*')
    .single();

  if (error) {
    await hapusLampiran(supabase, lampiran);
    return json({ error: error.message }, 500);
  }

  return json({
    status: 'success',
    data: { ...data, jenis: laporan.jenis }
  });
});
