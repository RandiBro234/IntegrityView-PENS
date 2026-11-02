/* Notifikasi dashboard. Seluruh isi dihitung dari data yang sudah ada —
   tidak ada notifikasi karangan. Status "sudah dibaca" dan riwayat perubahan
   status laporan disimpan di localStorage karena tabel notifikasi di database
   belum ada (menunggu Supabase Auth). */

import { getPengaduanLokal, getRingkasanPengaduan } from './mock';
import { PERIODE } from './survey/constants';

const KUNCI_DIBACA = 'iv2_notif_dibaca';
const KUNCI_SNAPSHOT = 'iv2_notif_snapshot';
const KUNCI_MASUK = 'iv2_notif_masuk';
const MAKS_SIMPAN = 20;

function baca(kunci, cadangan) {
  try {
    const isi = JSON.parse(localStorage.getItem(kunci) || 'null');
    return isi ?? cadangan;
  } catch {
    return cadangan;
  }
}

function tulis(kunci, nilai) {
  try { localStorage.setItem(kunci, JSON.stringify(nilai)); } catch { /* abaikan */ }
}

export function periodeBerjalan() {
  return PERIODE.find((p) => p.berjalan) || PERIODE[PERIODE.length - 1];
}

/* Bandingkan status laporan di perangkat ini dengan snapshot terakhir.
   Perubahan dicatat sebagai peristiwa supaya tidak hilang saat muat ulang. */
function deteksiPerubahanStatus() {
  const snapshot = baca(KUNCI_SNAPSHOT, {});
  const masuk = baca(KUNCI_MASUK, []);
  const baru = [];

  getPengaduanLokal().forEach((p) => {
    const sebelum = snapshot[p.id];
    if (sebelum && sebelum !== p.status) {
      baru.push({
        id: `status-${p.id}-${p.status}`,
        kode: p.id,
        status: p.status,
        waktu: p.waktuUpdate || new Date().toISOString()
      });
    }
    snapshot[p.id] = p.status;
  });

  if (baru.length) {
    const dikenal = new Set(masuk.map((m) => m.id));
    tulis(KUNCI_MASUK, [...baru.filter((b) => !dikenal.has(b.id)), ...masuk].slice(0, MAKS_SIMPAN));
  }
  tulis(KUNCI_SNAPSHOT, snapshot);

  return baca(KUNCI_MASUK, []);
}

/* Peran admin mendapat notifikasi operasional, sivitas mendapat pengingat
   partisipasi dan kabar status laporannya sendiri. */
export function getNotifikasi(user) {
  if (!user) return [];
  const periode = periodeBerjalan();
  const daftar = [];

  if (user.role === 'admin') {
    const ringkas = getRingkasanPengaduan();
    if (ringkas.Baru > 0) {
      daftar.push({
        /* Id memuat jumlah: kalau bertambah, notifikasi muncul lagi sebagai
           belum dibaca meski versi sebelumnya sudah ditandai dibaca. */
        id: `laporan-baru-${ringkas.Baru}`,
        jenis: 'tindak-lanjut',
        judul: `${ringkas.Baru} laporan baru belum ditindaklanjuti`,
        detail: 'Buka Kelola Pengaduan untuk memproses.',
        halaman: 'kelola-pengaduan'
      });
    }
    daftar.push({
      id: `periode-${periode.key}`,
      jenis: 'periode',
      judul: `Periode ${periode.label} masih berjalan`,
      detail: `Rentang ${periode.rentang}. Angka periode ini belum final.`,
      halaman: 'dashboard'
    });
  } else {
    daftar.push({
      id: `survei-${periode.key}`,
      jenis: 'survei',
      judul: `Survei ${periode.label} sedang dibuka`,
      detail: 'Isi instrumen yang relevan lewat Pusat Survei.',
      halaman: 'survei'
    });
  }

  deteksiPerubahanStatus().forEach((m) => {
    daftar.push({
      id: m.id,
      jenis: 'status',
      judul: `${m.kode} kini ${m.status}`,
      detail: 'Status laporan yang dikirim dari perangkat ini berubah.',
      halaman: 'pengaduan',
      waktu: m.waktu
    });
  });

  const dibaca = new Set(baca(KUNCI_DIBACA, []));
  return daftar.map((n) => ({ ...n, dibaca: dibaca.has(n.id) }));
}

export function hitungBelumDibaca(daftar) {
  return daftar.filter((n) => !n.dibaca).length;
}

export function tandaiDibaca(daftar, id) {
  const dibaca = new Set(baca(KUNCI_DIBACA, []));
  dibaca.add(id);
  tulis(KUNCI_DIBACA, [...dibaca].slice(-50));
  return daftar.map((n) => (n.id === id ? { ...n, dibaca: true } : n));
}

export function tandaiSemuaDibaca(daftar) {
  const dibaca = new Set(baca(KUNCI_DIBACA, []));
  daftar.forEach((n) => dibaca.add(n.id));
  tulis(KUNCI_DIBACA, [...dibaca].slice(-50));
  return daftar.map((n) => ({ ...n, dibaca: true }));
}
