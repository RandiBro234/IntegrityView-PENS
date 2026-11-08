import { formatAngka } from '../../data/mock';
import { keSkor } from '../../lib/formatSkor';
import Delta from './Delta';
import '../instrumen/ReportTemplate.css';

function ShieldIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* Ringkasan dashboard satu halaman A4: KPI agregat + skor tiap instrumen.
   Memakai kelas .rt agar render PDF (html2canvas) sama gayanya dengan laporan
   per instrumen. Hanya agregat, tanpa PII. */
export default function RingkasanDashboardTemplate({ laporan, tanggalCetak }) {
  const r = laporan.ringkasan;
  const daftar = laporan.sebaran || [];
  const terendah = daftar[0];
  const tertinggi = daftar[daftar.length - 1];
  const simulasi = laporan.simulasiTerpakai > 0;
  const turun = laporan.perubahanTerbesar?.turun;
  const labelBanding = laporan.periodePembanding?.label;

  return (
    <div className="rt">
      <section className="rt__page">
        <header className="rt__header">
          <div className="rt__header-left">
            <span className="rt__shield"><ShieldIcon /></span>
            <div>
              <h1 className="rt__title">Ringkasan Dashboard Zona Integritas</h1>
              <p className="rt__subtitle">Politeknik Elektronika Negeri Surabaya</p>
            </div>
          </div>
          <div className="rt__header-right">
            <p className="rt__meta">Periode {laporan.periode.label}</p>
            <p className="rt__meta">Pembanding: {laporan.periodePembanding?.label || 'Tanpa pembanding'}</p>
            <p className="rt__meta">Dicetak {tanggalCetak}</p>
          </div>
        </header>

        <div className="rt__body">
          <div className="rt__section-title">
            <span className="rt__bullet" aria-hidden="true" />
            <h2>Ringkasan Statistik</h2>
          </div>
          <div className="rt__cards">
            <div className="rt__card">
              <span className="rt__card-label">Total Instrumen</span>
              <span className="rt__card-value">{r.totalInstrumen}</span>
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Jumlah Responden</span>
              <span className="rt__card-value">{r.responden.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Indeks Persepsi Integritas (0–100)</span>
              <span className="rt__card-value">{r.rataSkor == null ? '—' : formatAngka(r.rataSkor, 1)}</span>
              <Delta value={r.delta} />
            </div>
          </div>
          {r.ci && (
            <p className="rt__text" style={{ marginTop: 12 }}>
              Interval kepercayaan 95%: {formatAngka(r.ci.bawah, 1)} – {formatAngka(r.ci.atas, 1)} pada skala 0–100.
            </p>
          )}

          <div className="rt__section-title">
            <span className="rt__bullet" aria-hidden="true" />
            <h2>Skor per Instrumen</h2>
          </div>
          <table className="rt__table rt__table--butir">
            <thead>
              <tr>
                <th>Instrumen</th>
                <th className="rt__num--center">Responden</th>
                <th className="rt__num--center">Skor (1–4)</th>
                <th className="rt__num--center">{labelBanding ? `Selisih vs ${labelBanding}` : 'Selisih'}</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((d) => (
                <tr key={d.key}>
                  <td>{d.namaPanjang}</td>
                  <td className="rt__num rt__num--center">{d.n}</td>
                  <td className="rt__num rt__num--center">{formatAngka(keSkor(d.indeks), 2)}</td>
                  <td className="rt__num rt__num--center"><Delta value={d.delta} compact skalaSkor /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rt__text" style={{ marginTop: 8 }}>
            Skor memakai skala 1–4. Selisih = skor {laporan.periode.label} dikurangi skor {labelBanding || 'periode pembanding'}; tanda + berarti naik.
          </p>

          {terendah && tertinggi && (
            <>
              <div className="rt__section-title">
                <span className="rt__bullet" aria-hidden="true" />
                <h2>Sorotan</h2>
              </div>
              <ul className="rt__kualitas">
                <li>
                  Skor terendah: <strong>{terendah.nama}</strong> ({formatAngka(keSkor(terendah.indeks), 2)} dari 4).
                </li>
                <li>
                  Skor tertinggi: <strong>{tertinggi.nama}</strong> ({formatAngka(keSkor(tertinggi.indeks), 2)} dari 4).
                </li>
                {turun && (
                  <li>
                    Penurunan terbesar dibanding {laporan.periodePembanding?.label || 'pembanding'}: <strong>{turun.info.nama}</strong>.
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        <footer className="rt__footer">
          <span>
            {simulasi
              ? 'Sebagian data pada dokumen ini bersumber dari simulasi untuk keperluan demonstrasi.'
              : 'Data pada dokumen ini merupakan agregat hasil survei.'}
          </span>
          <span>Halaman 1</span>
        </footer>
      </section>
    </div>
  );
}
