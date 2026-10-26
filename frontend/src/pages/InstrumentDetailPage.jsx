import { useEffect, useMemo, useRef, useState } from 'react';
import ItemDistributionBar, { SkalaLegend } from '../components/instrumen/ItemDistributionBar';
import GroupComparisonBar, { urutkanPerSelisih } from '../components/instrumen/GroupComparisonBar';
import RecommendationList from '../components/instrumen/RecommendationList';
import RecommendationPanel from '../components/instrumen/RecommendationPanel';
import DataQualityBadges from '../components/instrumen/DataQualityBadges';
import PeriodTrend from '../components/instrumen/PeriodTrend';
import ReportTemplate from '../components/instrumen/ReportTemplate';
import ReportFilters from '../components/dashboard/ReportFilters';
import Delta from '../components/dashboard/Delta';
import { unduhLaporanPdf, namaFileLaporan } from '../lib/reportPdf';
import { formatAngka, SURVEI_INFO } from '../data/mock';
import { getReportData } from '../data/reportData';
import { useReportFilters } from '../data/useReportFilters';
import { getSurveyLink } from '../data/surveyLinks';
import './InstrumentDetailPage.css';

const ROW_MIN = 32;
const ROW_MAX = 48;

/* Tinggi satu blok Perbandingan Kelompok (px):
   judul ~18 + gap 8 + 2 baris × 28 + gap baris 6 + jarak bawah blok 22. */
const BLOK_TINGGI = 18 + 8 + 28 + 6 + 28 + 22;

export default function InstrumentDetailPage({ slug, onBack }) {
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState('distribusi');
  const [ekspor, setEkspor] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const reportRef = useRef(null);
  const { filter, setFilter } = useReportFilters();

  const distRef = useRef(null);
  const [distAvail, setDistAvail] = useState(0);

  const kelompokRef = useRef(null);
  const [kelompokAvail, setKelompokAvail] = useState(0);

  const info = useMemo(() => SURVEI_INFO.find((s) => s.key === slug), [slug]);
  const surveyLink = useMemo(() => getSurveyLink(slug), [slug]);
  const laporan = useMemo(() => getReportData(filter), [filter]);
  const hasil = laporan.instrumen.find((s) => s.info.key === slug);
  const st = hasil?.aktif;
  const rekomendasi = hasil?.rekomendasi || [];
  const duplikat = st?.duplikat ?? 0;

  /* Ukur tinggi area daftar distribusi. */
  useEffect(() => {
    if (!distRef.current) return;
    const el = distRef.current;
    const ro = new ResizeObserver((entries) => setDistAvail(entries[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab, st]);

  /* Ukur tinggi area daftar kelompok. */
  useEffect(() => {
    if (!kelompokRef.current) return;
    const el = kelompokRef.current;
    const ro = new ResizeObserver((entries) => setKelompokAvail(entries[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [st]);

  const sebaranButir = hasil?.sebaranButir || [];
  const jumlahButir = sebaranButir.length;

  const rowHeight = useMemo(() => {
    if (!jumlahButir || !distAvail) return ROW_MAX;
    const ideal = Math.floor(distAvail / jumlahButir);
    return Math.max(ROW_MIN, Math.min(ROW_MAX, ideal));
  }, [jumlahButir, distAvail]);

  const perluScroll = jumlahButir * rowHeight > distAvail + 1 && jumlahButir > 0;

  /* st berasal dari cache selector; nilainya stabil per filter. */
  const kelompokUrut = st ? urutkanPerSelisih(st.butir) : [];

  const jumlahKelompokMuat = useMemo(() => {
    if (!kelompokAvail) return 2;
    const muat = Math.floor((kelompokAvail + 22) / BLOK_TINGGI);
    return Math.max(1, Math.min(3, muat));
  }, [kelompokAvail]);

  const maxRekomendasi = rekomendasi.length > 3 ? 2 : 3;
  const rekomendasiTampil = rekomendasi.slice(0, maxRekomendasi);

  const [tanggalCetak] = useState(() => {
    const d = new Date();
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  });

  const handleUnduh = async () => {
    if (!reportRef.current || mengunduh) return;
    setMengunduh(true);
    try {
      const nama = namaFileLaporan(info?.nama || slug, laporan.periode.label);
      await unduhLaporanPdf(reportRef.current, nama);
      setEkspor(false);
    } finally {
      setMengunduh(false);
    }
  };

  if (!info || !st) {
    return (
      <div className="idp idp--empty">
        <p>Butir tidak tersedia untuk instrumen ini.</p>
        <button type="button" className="btn btn-outline-navy" onClick={onBack}>Kembali ke Ringkasan</button>
      </div>
    );
  }

  return (
    <div className="idp">
      <header className="idp__header">
        <nav className="idp__breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="idp__crumb-link" onClick={onBack}>Ringkasan</button>
          <span className="idp__crumb-sep" aria-hidden="true">/</span>
          <span className="idp__crumb-current">{info.namaPanjang}</span>
        </nav>

        <div className="idp__header-right">
          {surveyLink && (
            <a
              className="btn btn-outline-navy idp__isi"
              href={surveyLink.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Isi survei ${info.namaPanjang} di tab baru`}
            >
              Isi survei ini
            </a>
          )}
          <button type="button" className="btn btn-primary idp__ekspor" onClick={() => setEkspor(true)}>
            Ekspor
          </button>
        </div>
      </header>

      <ReportFilters filter={filter} onChange={setFilter} />

      {/* === 4 kartu KPI + selisih antar semester === */}
      <div className="idp__cards">
        <MiniCard
          label="Jumlah Responden (n)"
          value={st.jumlahResponden.toLocaleString('id-ID')}
          delta={hasil.pembanding ? st.jumlahResponden - hasil.pembanding.jumlahResponden : null}
          unit="responden"
        />
        <MiniCard label="Rata-rata Skor" value={formatAngka(st.skor) + '%'} delta={hasil.delta} />
        <MiniCard
          label="Setuju + Sangat Setuju"
          value={formatAngka(st.persenSetuju) + '%'}
          delta={hasil.pembanding ? st.persenSetuju - hasil.pembanding.persenSetuju : null}
        />
        <MiniCard
          label="Cronbach's Alpha"
          value={formatAngka(st.alpha, 2)}
          note={st.alpha >= 0.7 ? 'Reliabel' : null}
          delta={hasil.pembanding ? st.alpha - hasil.pembanding.alpha : null}
          unit="nilai"
          desimal={2}
        />
      </div>

      <div className="idp__panels">
        <section className="idp__panel idp__panel--left" aria-labelledby="dist-butir-title">
          <div className="idp__panel-head">
            <h2 className="idp__panel-title" id="dist-butir-title">
              {tab === 'distribusi' ? 'Distribusi Jawaban per Butir' : 'Perubahan antar semester'}
              {tab === 'distribusi' && <span className="idp__panel-count">{jumlahButir} butir</span>}
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
              <SkalaLegend />
              <div ref={distRef} className={`idp__dist-list ${perluScroll ? 'idp__dist-list--scroll' : ''}`}>
                {sebaranButir.map((item) => (
                  <div key={item.nama} className="idp__dist-row" style={{ height: rowHeight, minHeight: rowHeight }}>
                    <ItemDistributionBar item={item} height={rowHeight} compact={rowHeight < 40} />
                  </div>
                ))}
              </div>
              <p className="idp__panel-note">Diurutkan dari persentase Setuju + Sangat Setuju terendah.</p>
            </>
          ) : (
            <>
              <PeriodTrend tren={hasil.tren} selected={filter.periode} />
              {laporan.periodePembanding ? (
                <>
                  <p className="idp__panel-note">
                    Selisih indeks butir dibanding {laporan.periodePembanding.label} (poin).
                  </p>
                  <div className="idp__change-list">
                    {hasil.perubahanButir.map((b) => (
                      <div key={b.nama} className="idp__change-row">
                        <span className="idp__change-name" title={b.nama}>{b.nama}</span>
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
              <h2 className="idp__panel-title">Perbandingan Kelompok</h2>
              {kelompokUrut.length > jumlahKelompokMuat && (
                <button type="button" className="idp__more" onClick={() => setModal('kelompok')}>
                  Lihat semua butir
                </button>
              )}
            </div>
            <div ref={kelompokRef} className="idp__kelompok-list">
              {kelompokUrut.slice(0, jumlahKelompokMuat).map((b) => (
                <GroupComparisonBar
                  key={b.nama}
                  butir={b}
                  nDosen={st.responden.dosen}
                  nTendik={st.responden.tendik}
                />
              ))}
            </div>
          </div>

          <div className="idp__half idp__half--bottom">
            <div className="idp__half-head">
              <h2 className="idp__panel-title">Rekomendasi & Kualitas Data</h2>
              <RecommendationPanel items={rekomendasi} />
            </div>

            <RecommendationList
              items={rekomendasiTampil}
              max={maxRekomendasi}
              compact
              onDetail={(r) => setModal({ rekomendasi: r })}
            />

            <DataQualityBadges
              persenSeragam={st.persenSeragam}
              duplikat={duplikat}
              n={st.jumlahResponden}
            />
          </div>
        </section>
      </div>

      {modal && (
        <div className="idp__modal-overlay" onClick={() => setModal(null)} role="presentation">
          <div className="idp__modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="idp__modal-head">
              <h3>
                {modal === 'kelompok' && 'Perbandingan Kelompok — Semua Butir'}
                {modal.rekomendasi && 'Detail Rekomendasi'}
              </h3>
              <button type="button" className="idp__modal-close" onClick={() => setModal(null)} aria-label="Tutup">×</button>
            </div>

            <div className="idp__modal-body">
              {modal === 'kelompok' && kelompokUrut.map((b) => (
                <GroupComparisonBar
                  key={b.nama}
                  butir={b}
                  nDosen={st.responden.dosen}
                  nTendik={st.responden.tendik}
                />
              ))}

              {modal.rekomendasi && (
                <>
                  <span className={`reclist__prio prioritas--${modal.rekomendasi.prioritas.toLowerCase()}`}>
                    {modal.rekomendasi.prioritas}
                  </span>
                  <p className="idp__modal-rek-teks">{modal.rekomendasi.teks}</p>
                  <p className="idp__modal-rek-dasar">Dasar data: {modal.rekomendasi.dasar}</p>
                </>
              )}
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
            aria-label={`Pratinjau Laporan ${info?.namaPanjang}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="idp__modal-head">
              <h3>Pratinjau Laporan — {info?.namaPanjang}</h3>
              <button type="button" className="idp__modal-close" onClick={() => setEkspor(false)} aria-label="Tutup" disabled={mengunduh}>×</button>
            </div>

            <div className="idp__modal-preview">
              <div className="idp__preview-scale" ref={reportRef}>
                <ReportTemplate
                  info={info}
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
                {mengunduh ? (
                  <>
                    <span className="idp__spinner" aria-hidden="true" />
                    Menyiapkan…
                  </>
                ) : 'Unduh PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({ label, value, note, delta, unit, desimal }) {
  return (
    <article className="idp__minicard">
      <span className="idp__minicard-label">{label}</span>
      <span className="idp__minicard-value">
        {value}
        {note && <span className="idp__minicard-note">{note}</span>}
      </span>
      {delta != null && <Delta value={delta} unit={unit} desimal={desimal} compact />}
    </article>
  );
}
