import { useRef, useState } from 'react';
import RecommendationList from '../components/instrumen/RecommendationList';
import RecommendationPanel from '../components/instrumen/RecommendationPanel';
import PeriodTrend from '../components/instrumen/PeriodTrend';
import ReportTemplate from '../components/instrumen/ReportTemplate';
import ReportFilters from '../components/dashboard/ReportFilters';
import Delta from '../components/dashboard/Delta';
import { unduhLaporanPdf, namaFileLaporan } from '../lib/reportPdf';
import { formatAngka } from '../data/mock';
import { getInstrumen, getReportData, SKALA } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import './InstrumentDetailPage.css';

export default function InstrumentDetailPage({ slug, onBack }) {
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState('distribusi');
  const [ekspor, setEkspor] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const reportRef = useRef(null);
  const { filter, setFilter, siap } = useReportFilters();

  const instrumen = getInstrumen(slug);
  const laporan = getReportData(filter);
  const hasil = laporan.instrumen.find((s) => s.info.key === slug);
  const st = hasil?.aktif;
  const rekomendasi = hasil?.rekomendasi || [];
  const surveyUrl = instrumen?.url;

  const [tanggalCetak] = useState(() => {
    const d = new Date();
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  });

  const handleUnduh = async () => {
    if (!reportRef.current || mengunduh) return;
    setMengunduh(true);
    try {
      await unduhLaporanPdf(reportRef.current, namaFileLaporan(instrumen?.nama || slug, laporan.periode.label));
      setEkspor(false);
    } finally {
      setMengunduh(false);
    }
  };

  if (!instrumen) {
    return (
      <div className="idp idp--empty">
        <p>Instrumen tidak dikenal.</p>
        <button type="button" className="btn btn-outline-navy" onClick={onBack}>Kembali ke Ringkasan</button>
      </div>
    );
  }

  if (!siap) {
    return (
      <div className="idp idp--loading" role="status" aria-label="Memuat detail instrumen">
        <div className="skeleton" style={{ height: 48 }} />
        <div className="idp__cards">
          <div className="skeleton" /><div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
        </div>
        <div className="skeleton" style={{ flex: 1 }} />
      </div>
    );
  }

  if (!st) {
    return (
      <div className="idp idp--empty">
        <p>Belum ada responden untuk {instrumen.namaPanjang} pada periode ini.</p>
        <button type="button" className="btn btn-outline-navy" onClick={onBack}>Kembali ke Ringkasan</button>
      </div>
    );
  }

  const rekomendasiTampil = rekomendasi.slice(0, 3);

  return (
    <div className="idp">
      <header className="idp__header">
        <nav className="idp__breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="idp__crumb-link" onClick={onBack}>Ringkasan</button>
          <span className="idp__crumb-sep" aria-hidden="true">/</span>
          <span className="idp__crumb-current">{instrumen.namaPanjang}</span>
        </nav>

        <div className="idp__header-right">
          {surveyUrl && (
            <a
              className="btn btn-outline-navy idp__isi"
              href={surveyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Isi survei ${instrumen.namaPanjang} di tab baru`}
            >
              Isi survei ini
            </a>
          )}
          <button type="button" className="btn btn-primary idp__ekspor" onClick={() => setEkspor(true)}>
            Ekspor
          </button>
        </div>
      </header>

      <ReportFilters filter={filter} onChange={setFilter} memakaiSimulasi={laporan.memakaiSimulasi} />

      <div className="idp__cards">
        <MiniCard label="Jumlah Responden (n)" value={st.n.toLocaleString('id-ID')} />
        <MiniCard label="Rata-rata Skor" value={formatAngka(st.indeks) + '%'} delta={hasil.delta} />
        <MiniCard
          label="Setuju + Sangat Setuju"
          value={formatAngka(st.setuju) + '%'}
          delta={hasil.pembanding ? st.setuju - hasil.pembanding.setuju : null}
        />
        <MiniCard
          label="Cronbach's Alpha"
          value={st.alpha == null ? '—' : formatAngka(st.alpha, 2)}
          note={st.alphaCatatan ? 'n kecil' : st.alpha >= 0.7 ? 'Reliabel' : null}
        />
      </div>

      <div className="idp__panels">
        <section className="idp__panel idp__panel--left" aria-labelledby="butir-title">
          <div className="idp__panel-head">
            <h2 className="idp__panel-title" id="butir-title">
              {tab === 'distribusi' ? 'Distribusi Jawaban per Butir' : 'Perubahan antar semester'}
              {tab === 'distribusi' && <span className="idp__panel-count">{st.jumlahButir} butir</span>}
            </h2>
            <div className="idp__tabs" role="group" aria-label="Tampilan instrumen">
              <button
                type="button"
                aria-pressed={tab === 'distribusi'}
                className={tab === 'distribusi' ? 'is-active' : ''}
                onClick={() => setTab('distribusi')}
              >
                Distribusi
              </button>
              <button
                type="button"
                aria-pressed={tab === 'perubahan'}
                className={tab === 'perubahan' ? 'is-active' : ''}
                onClick={() => setTab('perubahan')}
              >
                Perubahan antar semester
              </button>
            </div>
          </div>

          {tab === 'distribusi' ? (
            <>
              <div className="idp__legend" aria-label="Skala jawaban">
                {SKALA.map((s) => (
                  <span key={s.singkat} className="idp__legend-item" title={`${s.singkat} · ${s.label}`}>
                    <span className="idp__legend-swatch" style={{ backgroundColor: s.warna }} />
                    {s.label}
                  </span>
                ))}
              </div>

              <div className="idp__butir-table">
                <div className="idp__butir-head">
                  <span>Butir</span>
                  <span className="idp__butir-rata">Rata-rata</span>
                  <span className="idp__butir-setuju">S+SS</span>
                  <span className="idp__butir-bar">Distribusi 1-4</span>
                </div>
                <div className="idp__butir-body">
                  {st.butir.map((b) => (
                    <div key={b.label} className="idp__butir-row">
                      <span className="idp__butir-teks" title={b.teks}>{b.teks}</span>
                      <span className="idp__butir-rata">{formatAngka(b.rata, 2)}</span>
                      <span className="idp__butir-setuju">{formatAngka(b.persenSetuju)}%</span>
                      <span className="idp__butir-bar">
                        {b.distribusiPersen.map((pct, i) => (
                          <span
                            key={i}
                            className="idp__butir-seg"
                            style={{ width: pct + '%', backgroundColor: SKALA[i].warna }}
                            title={`${SKALA[i].label}: ${formatAngka(pct)}%`}
                          />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <PeriodTrend tren={hasil.tren} selected={filter.periode} />
              {laporan.periodePembanding ? (
                <>
                  <p className="idp__panel-note">
                    Selisih indeks butir dibanding {laporan.periodePembanding.label} (poin persen).
                  </p>
                  <div className="idp__change-list">
                    {hasil.perubahanButir.map((b) => (
                      <div key={b.label} className="idp__change-row">
                        <span className="idp__change-name" title={b.teks}>{b.label}</span>
                        <span className="idp__change-track">
                          <i
                            className={`idp__change-bar idp__change-bar--${b.delta == null ? 'stabil' : b.delta >= 0.5 ? 'naik' : b.delta <= -0.5 ? 'turun' : 'stabil'}`}
                            style={{
                              width: b.delta == null ? '0%' : `${Math.min(48, Math.abs(b.delta) * 2)}%`,
                              left: b.delta == null || b.delta >= 0 ? '50%' : 'auto',
                              right: b.delta != null && b.delta < 0 ? '50%' : 'auto'
                            }}
                          />
                        </span>
                        <span className="idp__change-delta"><Delta value={b.delta} compact /></span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="idp__panel-note">{laporan.periode.label} belum memiliki semester pembanding.</p>
              )}
            </>
          )}
        </section>

        <section className="idp__panel idp__panel--right">
          <div className="idp__half">
            <div className="idp__half-head">
              <h2 className="idp__panel-title">Rekomendasi</h2>
              {rekomendasi.length > 0 && <RecommendationPanel items={rekomendasi} />}
            </div>
            {rekomendasi.length ? (
              <RecommendationList
                items={rekomendasiTampil}
                max={3}
                compact
                onDetail={(r) => setModal({ rekomendasi: r })}
              />
            ) : (
              <p className="idp__panel-note">
                Butir dengan skor terendah: {st.butirTerendah.label} (rata-rata {formatAngka(st.butirTerendah.rata, 2)}).
                Tidak ada butir yang perlu perhatian khusus pada periode ini.
              </p>
            )}
          </div>

          <div className="idp__half idp__half--bottom">
            <div className="idp__half-head">
              <h2 className="idp__panel-title">Kualitas Data</h2>
            </div>
            <ul className="idp__kualitas">
              <li><span>Jawaban seragam</span><strong>{formatAngka(st.kualitas.seragam)}%</strong></li>
              <li><span>Duplikat dibuang</span><strong>{st.kualitas.duplikat}</strong></li>
              <li><span>Baris tidak valid dibuang</span><strong>{st.kualitas.dibuang}</strong></li>
              <li><span>Jawaban terbuka</span><strong>{st.kualitas.terbuka}</strong></li>
              <li><span>Ditahan untuk tinjauan WBS</span><strong>{st.kualitas.tertahan}</strong></li>
              <li><span>Responden (n)</span><strong>{st.kualitas.n}</strong></li>
            </ul>
            {st.kualitas.tema.length > 0 && (
              <div className="idp__tema">
                <p className="idp__tema-head">Tema jawaban terbuka</p>
                <ul className="idp__tema-list">
                  {st.kualitas.tema.map((t) => (
                    <li key={t.tema}><span>{t.tema}</span><strong>{t.jumlah}</strong></li>
                  ))}
                </ul>
              </div>
            )}
            <p className="idp__panel-note">
              Teks mentah tidak ditampilkan. Jawaban sensitif diarahkan ke alur WBS.
            </p>
          </div>
        </section>
      </div>

      {modal && (
        <div className="idp__modal-overlay" onClick={() => setModal(null)} role="presentation">
          <div className="idp__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="idp__modal-head">
              <h3>Detail Rekomendasi</h3>
              <button type="button" className="idp__modal-close" onClick={() => setModal(null)} aria-label="Tutup">×</button>
            </div>
            <div className="idp__modal-body">
              <span className={`reclist__prio prioritas--${modal.rekomendasi.prioritas.toLowerCase()}`}>
                {modal.rekomendasi.prioritas}
              </span>
              <p className="idp__modal-rek-teks">{modal.rekomendasi.judul}</p>
              <p className="idp__modal-rek-dasar">Dasar data: {modal.rekomendasi.dasar}</p>
            </div>
          </div>
        </div>
      )}

      {ekspor && (
        <div className="idp__modal-overlay" onClick={() => !mengunduh && setEkspor(false)} role="presentation">
          <div
            className="idp__modal idp__modal--report"
            role="dialog"
            aria-modal="true"
            aria-label={`Pratinjau Laporan ${instrumen.namaPanjang}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="idp__modal-head">
              <h3>Pratinjau Laporan — {instrumen.namaPanjang}</h3>
              <button type="button" className="idp__modal-close" onClick={() => setEkspor(false)} aria-label="Tutup" disabled={mengunduh}>×</button>
            </div>
            <div className="idp__modal-preview">
              <div className="idp__preview-scale" ref={reportRef}>
                <ReportTemplate
                  info={instrumen}
                  st={st}
                  rekomendasi={rekomendasi}
                  periode={laporan.periode.label}
                  tanggalCetak={tanggalCetak}
                  laporan={laporan}
                  hasil={hasil}
                />
              </div>
            </div>
            <div className="idp__modal-foot">
              <button type="button" className="btn btn-outline-navy" onClick={() => setEkspor(false)} disabled={mengunduh}>
                Batal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleUnduh} disabled={mengunduh}>
                {mengunduh ? (<><span className="idp__spinner" aria-hidden="true" />Menyiapkan…</>) : 'Unduh PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({ label, value, note, delta }) {
  return (
    <article className="idp__minicard">
      <span className="idp__minicard-label">{label}</span>
      <span className="idp__minicard-value">
        {value}
        {note && <span className="idp__minicard-note">{note}</span>}
      </span>
      {delta != null && <Delta value={delta} compact />}
    </article>
  );
}

