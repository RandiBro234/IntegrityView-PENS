// Edge Function: menerima laporan pengaduan / whistleblowing dari frontend
// dan menyimpannya ke tabel public.pengaduan atau public.whistleblowing.
//
// Deploy (dari root project):
//   supabase functions deploy kirim-laporan --use-api
//
// Function ini sengaja tanpa JWT karena dipakai pengunjung publik. Validasi
// dilakukan di sini; anon tidak punya akses langsung ke tabel.

import { CORS, json } from './lib/http.ts';
import { buatClient } from './lib/supabase.ts';
import { PayloadError, validasiLaporan } from './lib/validasi.ts';

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

  const tabel = laporan.jenis === 'wbs' ? 'whistleblowing' : 'pengaduan';
  const riwayat = [
    {
      status: 'Baru',
      tanggal: new Date().toISOString(),
      catatan: 'Laporan diterima.'
    }
  ];

  const supabase = buatClient();
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
      balasan: []
    })
    .select('*')
    .single();

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({
    status: 'success',
    data: { ...data, jenis: laporan.jenis }
  });
});
