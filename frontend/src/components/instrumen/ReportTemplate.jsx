import { formatAngka } from '../../data/mock';
import PeriodTrend from './PeriodTrend';
import Delta from '../dashboard/Delta';
import './ReportTemplate.css';

const PRIORITAS_KELAS = {
  'Tinggi': 'rt-prio--tinggi',
  'Sedang': 'rt-prio--sedang',
  'Pantau': 'rt-prio--pantau'
};

function ShieldIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* Template laporan A4. Pratinjau modal dan render PDF memakai komponen yang
   sama. Hanya agregat: tanpa email, tanpa teks terbuka mentah. */
export default function ReportTemplate({ info, st, rekomendasi, periode, tanggalCetak, laporan, hasil }) {
  const reliabel = st.alpha != null && st.alpha >= 0.7;
  const simulasi = st.sumber === 'simulated' || hasil.pembanding?.sumber === 'simulated';

  return (
    <div className="rt" id="report-template">
      <section className="rt__page">
        <header className="rt__header">
          <div className="rt__header-left">
            <span className="rt__shield"><ShieldIcon /></span>
            <div>
              <h1 className="rt__title">Laporan Hasil Survei</h1>
              <p className="rt__subtitle">{info.namaPanjang}</p>
            </div>
          </div>
          <div className="rt__header-right">
            <p className="rt__meta">Periode {periode}</p>
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
              <span className="rt__card-label">Jumlah Responden</span>
              <span className="rt__card-value">{st.n.toLocaleString('id-ID')}</span>
              <Delta value={hasil.pembanding ? st.n - hasil.pembanding.n : null} unit="responden" />
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Rata-rata Skor</span>
              <span className="rt__card-value">{formatAngka(st.indeks)}%</span>
              <Delta value={hasil.delta} />
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Setuju + Sangat Setuju</span>
              <span className="rt__card-value">{formatAngka(st.setuju)}%</span>
              <Delta value={hasil.pembanding ? st.setuju - hasil.pembanding.setuju : null} />
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Cronbach's Alpha</span>
              <span className="rt__card-value">
                {st.alpha == null ? '—' : formatAngka(st.alpha, 2)}
                {reliabel && <span className="rt__card-note">Reliabel</span>}
              </span>
            </div>
          </div>

          <div className="rt__section-title">
            <span className="rt__bullet" aria-hidden="true" />
            <h2>Skor per Butir</h2>
          </div>
          <table className="rt__table rt__table--butir">
            <thead>
              <tr>
                <th>Butir</th>
                <th className="rt__num rt__num--center">Rata-rata</th>
                <th className="rt__num rt__num--center">Setuju + SS</th>
              </tr>
            </thead>
            <tbody>
              {st.butir.map((b) => (
                <tr key={b.label}>
                  <td>{b.teks}</td>
                  <td className="rt__num rt__num--center">{formatAngka(b.rata, 2)}</td>
                  <td className="rt__num rt__num--center">{formatAngka(b.persenSetuju)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rt__section-title">
            <span className="rt__bullet" aria-hidden="true" />
            <h2>Rekomendasi</h2>
          </div>
          {rekomendasi.length === 0 ? (
            <p className="rt__text">
              Butir dengan skor terendah: {st.butirTerendah.label} (rata-rata {formatAngka(st.butirTerendah.rata, 2)}).
              Tidak ada butir yang perlu perhatian khusus pada periode ini.
            </p>
          ) : (
            <ol className="rt__rek">
              {rekomendasi.map((r, i) => (
                <li key={i} className="rt__rek-item">
                  <span className={`rt__prio ${PRIORITAS_KELAS[r.prioritas] || ''}`}>{r.prioritas}</span>
                  <div>
                    <p className="rt__rek-teks">{r.judul}</p>
                    <p className="rt__rek-dasar">Dasar data: {r.dasar}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="rt__section-title">
            <span className="rt__bullet" aria-hidden="true" />
            <h2>Catatan Kualitas Data</h2>
          </div>
          <ul className="rt__kualitas">
            <li>Median skor: <strong>{formatAngka(st.median)}%</strong>.</li>
            <li>Simpangan baku: <strong>{formatAngka(st.sd, 2)}</strong>.</li>
            <li>Persentase jawaban seragam: <strong>{formatAngka(st.kualitas.seragam)}%</strong>.</li>
            <li>Duplikat dibuang: <strong>{st.kualitas.duplikat}</strong>.</li>
            <li>Baris tidak valid dibuang: <strong>{st.kualitas.dibuang}</strong>.</li>
            <li>Jawaban terbuka ditahan: <strong>{st.kualitas.tertahan}</strong>.</li>
            {st.kualitas.tema.length > 0 && (
              <li>
                Tema jawaban terbuka: <strong>{st.kualitas.tema.map((t) => `${t.tema} (${t.jumlah})`).join(', ')}</strong>.
              </li>
            )}
            <li>Jumlah responden (n): <strong>{st.n}</strong>.</li>
            {hasil.pembanding && (
              <li>Responden pembanding: <strong>{hasil.pembanding.n}</strong>.</li>
            )}
          </ul>
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

      <section className="rt__page">
        <header className="rt__header">
          <div>
            <h1 className="rt__title">Perubahan antar semester</h1>
            <p className="rt__subtitle">{info.namaPanjang}</p>
          </div>
        </header>
        <div className="rt__body">
          <div className="rt__section-title"><span className="rt__bullet" aria-hidden="true" /><h2>Indeks per semester dan interval 95%</h2></div>
          <PeriodTrend tren={hasil.tren} selected={laporan.periode.key} />
          <p className="rt__text">Responden tiap semester berbeda; selisih bukan perubahan pada orang yang sama.</p>
          {laporan.periodePembanding ? (
            <>
              <div className="rt__section-title"><span className="rt__bullet" aria-hidden="true" /><h2>Perubahan indeks per butir vs {laporan.periodePembanding.label}</h2></div>
              <table className="rt__table rt__table--changes">
                <thead>
                  <tr>
                    <th>Butir</th>
                    <th className="rt__num--center">Indeks {laporan.periode.label}</th>
                    <th className="rt__num--center">Indeks pembanding</th>
                    <th className="rt__num--center">Selisih (poin)</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.perubahanButir.map((b) => (
                    <tr key={b.label}>
                      <td>{b.label}</td>
                      <td className="rt__num rt__num--center">{formatAngka(b.skor)}%</td>
                      <td className="rt__num rt__num--center">{b.sebelumnya == null ? '—' : `${formatAngka(b.sebelumnya)}%`}</td>
                      <td className="rt__num rt__num--center"><Delta value={b.delta} compact /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="rt__text">{laporan.periode.label} belum memiliki semester pembanding.</p>
          )}
        </div>
        <footer className="rt__footer">
          <span>
            {simulasi
              ? 'Sebagian data pada dokumen ini bersumber dari simulasi untuk keperluan demonstrasi.'
              : 'Data pada dokumen ini merupakan agregat hasil survei.'}
          </span>
          <span>Halaman 2</span>
        </footer>
      </section>
    </div>
  );
}
