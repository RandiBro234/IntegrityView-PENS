export type JenisLaporan = 'pengaduan' | 'wbs';

export interface LaporanValid {
  jenis: JenisLaporan;
  judul: string;
  kategori: string;
  lokasi: string;
  deskripsi: string;
  anonim: boolean;
  nama_pelapor: string | null;
  kontak_pelapor: string | null;
  hubungan: string | null;
}

export class PayloadError extends Error {}

function teks(nilai: unknown): string {
  return typeof nilai === 'string' ? nilai.trim() : '';
}

function batas(nilai: string, nama: string, min: number, max: number) {
  if (nilai.length < min || nilai.length > max) {
    throw new PayloadError(`${nama} harus ${min}-${max} karakter.`);
  }
}

export function validasiLaporan(body: unknown): LaporanValid {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new PayloadError('Body laporan tidak valid.');
  }

  const data = body as Record<string, unknown>;
  const jenis: JenisLaporan | null =
    data.jenis === 'wbs' ? 'wbs' : data.jenis === 'pengaduan' ? 'pengaduan' : null;
  if (!jenis) throw new PayloadError('jenis harus "pengaduan" atau "wbs".');

  const judul = teks(data.judul);
  const kategori = teks(data.kategori);
  const lokasi = teks(data.lokasi);
  const deskripsi = teks(data.deskripsi);
  const anonim = data.anonim === true;

  batas(judul, 'Judul', 3, 200);
  batas(kategori, 'Kategori', 1, 100);
  batas(deskripsi, 'Deskripsi', 10, 5000);
  if (lokasi.length > 200) throw new PayloadError('Lokasi maksimal 200 karakter.');

  const nama = anonim ? null : teks(data.nama_pelapor) || null;
  const kontak = anonim ? null : teks(data.kontak_pelapor) || null;
  const hubungan = anonim ? null : teks(data.hubungan) || null;

  if (!anonim) {
    if (!nama) throw new PayloadError('Nama wajib diisi jika tidak anonim.');
    if (!kontak) throw new PayloadError('Kontak wajib diisi jika tidak anonim.');
    if (!hubungan) throw new PayloadError('Hubungan wajib diisi jika tidak anonim.');
    batas(nama, 'Nama', 1, 200);
    batas(kontak, 'Kontak', 1, 200);
    batas(hubungan, 'Hubungan', 1, 100);
  }

  return {
    jenis,
    judul,
    kategori,
    lokasi,
    deskripsi,
    anonim,
    nama_pelapor: nama,
    kontak_pelapor: kontak,
    hubungan
  };
}
