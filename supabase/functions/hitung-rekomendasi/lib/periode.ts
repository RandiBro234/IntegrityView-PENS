/* Periode survei dari tanggal simpan.

   Sama dengan `periodeDariTanggal` di chatbot dan frontend: waktu dikonversi
   ke WIB dulu, karena server menyimpan UTC. Tanpa konversi, kiriman tanggal
   1 September pukul 00.30 WIB akan jatuh ke periode genap.

   Modul ini murni supaya bisa dites dengan Node.
*/

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function periodeDariTanggal(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;

  const wib = new Date(ms + WIB_OFFSET_MS);
  const tahun = wib.getUTCFullYear();
  const bulan = wib.getUTCMonth() + 1;

  if (bulan >= 9) return `${tahun}-ganjil`;
  if (bulan <= 2) return `${tahun - 1}-ganjil`;
  return `${tahun}-genap`;
}

/* Ganjil (Sep-Feb) terjadi setelah genap (Mar-Agu) pada tahun yang sama. */
export function urutkanPeriode(periode: string[] = []): string[] {
  const kunci = (p: string) => {
    const [tahun, semester] = p.split('-');
    return Number(tahun) * 10 + (semester === 'ganjil' ? 1 : 0);
  };
  return (periode ?? []).slice().sort((a, b) => kunci(b) - kunci(a));
}
