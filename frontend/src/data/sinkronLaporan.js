/* Menyegarkan salinan lokal laporan yang pernah dikirim dari perangkat ini
   dengan status terbaru dari database. Dipakai profil/lacak agar perubahan
   status oleh admin ikut terlihat tanpa membuka ulang form pelacakan. */

import { getPengaduanLokal, simpanPengaduanLokal } from './mock';
import { lacakLaporan, laporanApiSiap } from './laporanApi';

export async function sinkronkanStatusLaporan() {
  if (!laporanApiSiap) return;

  const lokal = getPengaduanLokal();
  await Promise.all(lokal.map(async (lama) => {
    try {
      const server = await lacakLaporan(lama.id);
      if (!server) return;

      const baru = {
        ...lama,
        status: server.status || lama.status,
        riwayat: Array.isArray(server.riwayat) ? server.riwayat : lama.riwayat,
        balasan: Array.isArray(server.balasan) ? server.balasan : lama.balasan,
        waktuUpdate: server.updated_at || lama.waktuUpdate
      };

      if (
        baru.status !== lama.status
        || JSON.stringify(baru.riwayat) !== JSON.stringify(lama.riwayat)
        || JSON.stringify(baru.balasan) !== JSON.stringify(lama.balasan)
      ) {
        simpanPengaduanLokal(baru);
      }
    } catch {
      /* Offline atau laporan sudah tidak ada: biarkan salinan lokal. */
    }
  }));
}
