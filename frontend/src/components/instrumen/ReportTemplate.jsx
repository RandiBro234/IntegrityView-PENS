import { formatAngka, getDuplikatTerdeteksi } from '../../data/mock';
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

/* Template laporan A4. Dipakai untuk pratinjau modal DAN render ke PDF,
   agar tampilan pratinjau identik dengan hasil unduhan. */
export default function ReportTemplate({ info, st, rekomendasi, periode, tanggalCetak, laporan, hasil }) {
  const duplikat = st.duplikat ?? getDuplikatTerdeteksi(info.key);
  const reliabel = st.alpha >= 0.7;

  return (
    <div className="rt" id="report-template">
      {/* ============ HALAMAN 1 ============ */}
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
              <span className="rt__card-value">{st.jumlahResponden.toLocaleString('id-ID')}</span>
              <Delta value={hasil.pembanding && st.jumlahResponden - hasil.pembanding.jumlahResponden} unit="responden" />
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Rata-rata Skor</span>
              <span className="rt__card-value">{formatAngka(st.skor)}%</span>
              <Delta value={hasil.delta} />
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Setuju + Sangat Setuju</span>
              <span className="rt__card-value">{formatAngka(st.persenSetuju)}%</span>
              <Delta value={hasil.pembanding && st.persenSetuju - hasil.pembanding.persenSetuju} />
            </div>
            <div className="rt__card">
              <span className="rt__card-label">Cronbach's Alpha</span>
              <span className="rt__card-value">
                {formatAngka(st.alpha, 2)}
                {reliabel && <span className="rt__card-note">Reliabel</span>}
              </span>
              <Delta value={hasil.pembanding && st.alpha - hasil.pembanding.alpha} unit="nilai" desimal={2} />
            </div>
          </div>

          <div className="rt__section-title">
            <span className="rt__bullet" aria-hidden="true" />
            <h2>Rekomendasi</h2>
          </div>
          {rekomendasi.length === 0 ? (
            <p className="rt__text">Tidak ada rekomendasi — seluruh indikator dalam batas wajar.</p>
          ) : (
            <ol className="rt__rek">
              {rekomendasi.map((r, i) => (
                <li key={i} className="rt__rek-item">
                  <span className={`rt__prio ${PRIORITAS_KELAS[r.prioritas] || ''}`}>{r.prioritas}</span>
                  <div>
                    <p className="rt__rek-teks">{r.teks}</p>
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
            <li>Simpangan baku: <strong>{formatAngka(st.simpanganBaku, 2)}</strong>.</li>
            <li>Persentase jawaban seragam: <strong>{formatAngka(st.persenSeragam)}%</strong>.</li>
            <li>Jumlah duplikat terdeteksi: <strong>{duplikat}</strong>.</li>
            <li>Jumlah responden (n): <strong>{st.jumlahResponden}</strong>.</li>
            <li>Responden pembanding: <strong>{hasil.pembanding?.jumlahResponden ?? 'Tanpa pembanding'}</strong>.</li>
          </ul>

        </div>

        <footer className="rt__footer">
          <span>Sebagian data pada dokumen ini bersumber dari simulasi untuk keperluan demonstrasi.</span>
          <span>Halaman 1</span>
        </footer>
      </section>
      <section className="rt__page">
        <header className="rt__header"><div><h1 className="rt__title">Perubahan antar semester</h1><p className="rt__subtitle">{info.namaPanjang}</p></div></header>
        <div className="rt__body">
          <div className="rt__section-title"><span className="rt__bullet" aria-hidden="true" /><h2>Indeks per semester dan interval 95%</h2></div>
          <PeriodTrend tren={hasil.tren} selected={laporan.periode.key} />
          <p className="rt__text">Responden tiap semester berbeda; selisih bukan perubahan pada orang yang sama.</p>
          {laporan.periodePembanding ? <>
          <div className="rt__section-title"><span className="rt__bullet" aria-hidden="true" /><h2>Perubahan indeks per butir vs {laporan.periodePembanding.label}</h2></div>
          <table className="rt__table rt__table--changes">
            <thead><tr><th>Butir</th><th>Indeks {laporan.periode.label}</th><th>Indeks pembanding</th><th>Selisih (poin)</th></tr></thead>
            <tbody>{hasil.perubahanButir.map((b) => <tr key={b.nama}><td>{b.nama}</td><td className="rt__num">{formatAngka(b.skor)}%</td><td className="rt__num">{b.sebelumnya == null ? '—' : `${formatAngka(b.sebelumnya)}%`}</td><td><Delta value={b.delta} compact /></td></tr>)}</tbody>
          </table>
          </> : <p className="rt__text">{laporan.periode.label} belum memiliki semester pembanding.</p>}
        </div>
        <footer className="rt__footer"><span>Sebagian data pada dokumen ini bersumber dari simulasi untuk keperluan demonstrasi.</span><span>Halaman 2</span></footer>
      </section>
    </div>
  );
}
