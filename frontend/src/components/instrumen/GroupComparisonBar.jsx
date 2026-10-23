import './GroupComparisonBar.css';
import { formatAngka, ujiTButir } from '../../data/mock';

/* Bar horizontal perbandingan rata-rata Dosen vs Tendik untuk satu butir. */
/* Bar horizontal perbandingan rata-rata Dosen vs Tendik untuk satu butir.
   Struktur: blok berisi judul + dua baris (Dosen, Tendik), alur dokumen normal. */
export default function GroupComparisonBar({ butir, nDosen, nTendik }) {
  const tampilDosen = nDosen >= 5;
  const tampilTendik = nTendik >= 5;
  if (!tampilDosen && !tampilTendik) return null;

  const p = ujiTButir(butir, nDosen, nTendik);
  const signifikan = p < 0.05;
  const selisih = Math.abs(butir.kelompok.dosen - butir.kelompok.tendik);

  const scale = 4;
  const pctDosen = (butir.kelompok.dosen / scale) * 100;
  const pctTendik = (butir.kelompok.tendik / scale) * 100;

  return (
    <div className="gcb">
      <div className="gcb__head">
        <span className="gcb__nama" title={butir.nama}>{butir.nama}</span>
        {signifikan && (
          <span className="gcb__sig" title={`Berbeda signifikan (p < 0,05), selisih ${formatAngka(selisih, 2)} poin`}>
            <span className="gcb__sig-dot" aria-hidden="true" />
            signifikan
          </span>
        )}
      </div>

      <div className="gcb__rows">
        {tampilDosen && (
          <div className="gcb__row">
            <span className="gcb__label">Dosen</span>
            <span className="gcb__track">
              <span className="gcb__fill gcb__fill--dosen" style={{ width: pctDosen + '%' }} />
            </span>
            <span className="gcb__val">{formatAngka(butir.kelompok.dosen, 2)}</span>
          </div>
        )}
        {tampilTendik && (
          <div className="gcb__row">
            <span className="gcb__label">Tendik</span>
            <span className="gcb__track">
              <span className="gcb__fill gcb__fill--tendik" style={{ width: pctTendik + '%' }} />
            </span>
            <span className="gcb__val">{formatAngka(butir.kelompok.tendik, 2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* Helper: urutkan butir dari selisih terbesar. */
export function urutkanPerSelisih(butirList) {
  return butirList
    .slice()
    .map((b) => ({ ...b, selisih: Math.abs(b.kelompok.dosen - b.kelompok.tendik) }))
    .sort((a, b) => b.selisih - a.selisih);
}
