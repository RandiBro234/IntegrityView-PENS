import { useEffect, useMemo, useRef, useState } from 'react';
import ItemDistributionBar, { SkalaLegend } from '../components/instrumen/ItemDistributionBar';
import GroupComparisonBar, { urutkanPerSelisih } from '../components/instrumen/GroupComparisonBar';
import RecommendationList from '../components/instrumen/RecommendationList';
import DataQualityBadges from '../components/instrumen/DataQualityBadges';
import {
  SURVEI_INFO, getStatistikInstrumen, getRekomendasi,
  getDuplikatTerdeteksi, formatAngka
} from '../data/mock';
import { useSurveiData } from '../data/api';
import './InstrumentDetailPage.css';

const ROW_MIN = 32;
const ROW_MAX = 48;

/* Tinggi satu blok Perbandingan Kelompok (px):
   judul ~18 + gap 8 + 2 baris × 28 + gap baris 6 + jarak bawah blok 22. */
const BLOK_TINGGI = 18 + 8 + 28 + 6 + 28 + 22;

export default function InstrumentDetailPage({ slug, onBack }) {
  const [modal, setModal] = useState(null);
  const { dataset, loading } = useSurveiData();

  const distRef = useRef(null);
  const [distAvail, setDistAvail] = useState(0);

  const kelompokRef = useRef(null);
  const [kelompokAvail, setKelompokAvail] = useState(0);

  const info = useMemo(() => SURVEI_INFO.find((s) => s.key === slug), [slug]);
  const st = useMemo(
    () => (dataset ? getStatistikInstrumen(slug, dataset) : null),
    [slug, dataset]
  );
  const rekomendasi = useMemo(
    () => (dataset ? getRekomendasi(slug, dataset) : []),
    [slug, dataset]
  );
  const duplikat = useMemo(
    () => (dataset ? getDuplikatTerdeteksi(slug, dataset) : 0),
    [slug, dataset]
  );

  /* Ukur tinggi area daftar distribusi. */
  useEffect(() => {
    if (!distRef.current) return;
    const el = distRef.current;
    const ro = new ResizeObserver((entries) => {
      setDistAvail(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  /* Ukur tinggi area daftar kelompok, hitung ulang otomatis saat resize. */
  useEffect(() => {
    if (!kelompokRef.current) return;
    const el = kelompokRef.current;
    const ro = new ResizeObserver((entries) => {
      setKelompokAvail(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const sebaranButir = useMemo(() => {
    if (!st) return [];
    return st.butir
      .map((b) => {
        const n = b.distribusi[0] + b.distribusi[1] + b.distribusi[2] + b.distribusi[3];
        const persen = n ? b.distribusi.map((v) => (v / n) * 100) : [0, 0, 0, 0];
        return {
          nama: b.nama,
          sumber: st.sumber,
          n,
          distribusiAbsolut: b.distribusi,
          distribusiPersen: persen.map((v) => Number(v.toFixed(1))),
          persenSetuju: Number((persen[2] + persen[3]).toFixed(1))
        };
      })
      .sort((a, b) => a.persenSetuju - b.persenSetuju);
  }, [st]);

  const jumlahButir = sebaranButir.length;

  const rowHeight = useMemo(() => {
    if (!jumlahButir || !distAvail) return ROW_MAX;
    const ideal = Math.floor(distAvail / jumlahButir);
    return Math.max(ROW_MIN, Math.min(ROW_MAX, ideal));
  }, [jumlahButir, distAvail]);

  const perluScroll = jumlahButir * rowHeight > distAvail + 1 && jumlahButir > 0;

  const kelompokUrut = useMemo(() => (st ? urutkanPerSelisih(st.butir) : []), [st]);

  /* Jumlah blok kelompok yang muat utuh = floor(tinggi tersedia / tinggi blok).
     Minimal 1 agar panel tidak pernah kosong, maksimal 3. */
  const jumlahKelompokMuat = useMemo(() => {
    if (!kelompokAvail) return 2;
    const muat = Math.floor((kelompokAvail + 22) / BLOK_TINGGI);
    return Math.max(1, Math.min(3, muat));
  }, [kelompokAvail]);

  const maxRekomendasi = rekomendasi.length > 3 ? 2 : 3;
  const rekomendasiTampil = rekomendasi.slice(0, maxRekomendasi);

  const handleEkspor = () => {
    if (!st) return;
    const baris = [
      ['Butir', 'STS', 'TS', 'S', 'SS', 'Rata-rata', 'Dosen', 'Tendik'],
      ...st.butir.map((b) => [
        b.nama,
        ...b.distribusi,
        b.rata.toFixed(2),
        b.kelompok.dosen.toFixed(2),
        b.kelompok.tendik.toFixed(2)
      ])
    ];
    const csv = baris.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrityview-${slug}-distribusi.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
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
      {/* === Header === */}
      <header className="idp__header">
        <nav className="idp__breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="idp__crumb-link" onClick={onBack}>Ringkasan</button>
          <span className="idp__crumb-sep" aria-hidden="true">/</span>
          <span className="idp__crumb-current">{info.namaPanjang}</span>
        </nav>

        <div className="idp__header-right">
          <span className={`idp__badge ${st.sumber === 'riil' ? 'idp__badge--riil' : ''}`}>
            {st.sumber === 'riil' ? 'Data riil' : 'Data simulasi'}
          </span>
          <span className="chip">Periode Mar–Agu 2026</span>
          <button type="button" className="btn btn-primary idp__ekspor" onClick={handleEkspor}>
            Ekspor
          </button>
        </div>
      </header>

      {/* === 4 kartu === */}
      <div className="idp__cards">
        <MiniCard label="Jumlah Responden (n)" value={st.jumlahResponden.toLocaleString('id-ID')} />
        <MiniCard label="Rata-rata Skor" value={formatAngka(st.skor) + '%'} />
        <MiniCard label="Setuju + Sangat Setuju" value={formatAngka(st.persenSetuju) + '%'} />
        <MiniCard
          label="Cronbach's Alpha"
          value={formatAngka(st.alpha, 2)}
          note={st.alpha >= 0.7 ? 'Reliabel' : null}
        />
      </div>

      {/* === Dua panel === */}
      <div className="idp__panels">
        <section className="idp__panel idp__panel--left" aria-labelledby="dist-butir-title">
          <div className="idp__panel-head">
            <h2 className="idp__panel-title" id="dist-butir-title">
              Distribusi Jawaban per Butir
              <span className="idp__panel-count">{jumlahButir} butir</span>
            </h2>
            <SkalaLegend />
          </div>

          <div
            ref={distRef}
            className={`idp__dist-list ${perluScroll ? 'idp__dist-list--scroll' : ''}`}
          >
            {sebaranButir.map((item) => (
              <div key={item.nama} className="idp__dist-row" style={{ height: rowHeight, minHeight: rowHeight }}>
                <ItemDistributionBar item={item} height={rowHeight} compact={rowHeight < 40} />
              </div>
            ))}
          </div>

          <p className="idp__panel-note">
            {perluScroll
              ? 'Butir banyak — gulir untuk melihat seluruhnya. '
              : ''}
            Diurutkan dari persentase Setuju + Sangat Setuju terendah.
          </p>
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
              {rekomendasi.length > maxRekomendasi && (
                <button type="button" className="idp__more" onClick={() => setModal('rekomendasi-all')}>
                  Lihat semua rekomendasi
                </button>
              )}
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

      {/* === Modal === */}
      {modal && (
        <div className="idp__modal-overlay" onClick={() => setModal(null)} role="presentation">
          <div
            className="idp__modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="idp__modal-head">
              <h3>
                {modal === 'kelompok' && 'Perbandingan Kelompok — Semua Butir'}
                {modal === 'rekomendasi-all' && 'Semua Rekomendasi'}
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

              {modal === 'rekomendasi-all' && (
                <RecommendationList
                  items={rekomendasi}
                  max={rekomendasi.length}
                  onDetail={(r) => setModal({ rekomendasi: r })}
                />
              )}

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
    </div>
  );
}

function MiniCard({ label, value, note }) {
  return (
    <article className="idp__minicard">
      <span className="idp__minicard-label">{label}</span>
      <span className="idp__minicard-value">
        {value}
        {note && <span className="idp__minicard-note">{note}</span>}
      </span>
    </article>
  );
}
