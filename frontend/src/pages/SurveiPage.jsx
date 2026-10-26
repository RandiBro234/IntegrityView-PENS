import { useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { getUser } from '../data/mock';
import { SURVEI_DESKRIPSI } from '../data/instrumentConfig';
import { getReportData } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import './SurveiPage.css';

const KATEGORI = ['Semua', 'Integritas & Korupsi', 'Pelayanan Publik', 'Pelaporan', 'Budaya & 5R'];

export default function SurveiPage({ onNavigate, onOpenInstrument }) {
  const user = getUser();
  const [kategori, setKategori] = useState('Semua');

  const { filter } = useReportFilters();
  /* Selector sudah punya cache internal; dihitung langsung agar ikut diperbarui setelah data asli tiba. */
  const laporan = getReportData({ ...filter, kategori: 'Semua' });

  const daftar = useMemo(() => laporan.instrumen.map(({ info, aktif }) => {
    const jumlahButir = info.jumlahButir || 0;
    return {
      ...info,
      deskripsi: SURVEI_DESKRIPSI[info.key] || '',
      jumlahButir,
      estimasiMenit: Math.max(3, Math.ceil(jumlahButir / 3)),
      responden: aktif?.n || 0,
      url: info.url || null,
      requiresGoogleLogin: !!info.requiresGoogleLogin
    };
  }), [laporan]);

  const jumlahInstrumen = daftar.length;
  const totalResponden = laporan.ringkasan.responden.total;

  const filtered = useMemo(() => {
    if (kategori === 'Semua') return daftar;
    return daftar.filter((d) => d.kategori === kategori);
  }, [daftar, kategori]);

  const handleMenu = (key) => {
    if (onNavigate) onNavigate(key);
  };

  return (
    <div className="app-shell">
      <Sidebar active="survei" onNavigate={handleMenu} user={user} />

      <div className="app-main">
        <Topbar user={user} notifCount={3} onProfil={() => handleMenu('profil')} />

        <main className="app-content">
          <section className="survei-hero">
            <div className="survei-hero__text">
              <p className="label-eyebrow">Pusat Survei</p>
              <h1 className="survei-hero__title">Semua instrumen Zona Integritas di satu tempat.</h1>
              <p className="survei-hero__lead">
                Pengisian survei dilakukan lewat Google Form. Pilih instrumen, buka formulirnya,
                lalu kembali ke sini untuk melihat hasil agregatnya di dashboard.
              </p>
            </div>

            <div className="survei-hero__progress">
              <div className="survei-hero__progress-num">
                {jumlahInstrumen}<span className="survei-hero__progress-of"> instrumen</span>
              </div>
              <p className="survei-hero__progress-label">Terhubung ke Google Form</p>
              <p className="survei-hero__progress-note">
                Formulir terbuka di tab baru. Hasil dibaca dari data agregat yang sudah masuk.
              </p>
            </div>
          </section>

          <section className="survei-stats">
            <div className="survei-stat">
              <span className="survei-stat__num">{jumlahInstrumen}</span>
              <span className="survei-stat__label">Total instrumen</span>
            </div>
            <div className="survei-stat">
              <span className="survei-stat__num">{totalResponden.toLocaleString('id-ID')}</span>
              <span className="survei-stat__label">Total responden</span>
            </div>
            <div className="survei-stat">
              <span className="survei-stat__num">{laporan.ringkasan.totalInstrumen}</span>
              <span className="survei-stat__label">Instrumen aktif</span>
            </div>
            <div className="survei-stat">
              <span className="survei-stat__num">{laporan.periode.label}</span>
              <span className="survei-stat__label">Periode data</span>
            </div>
          </section>

          <div className="survei-toolbar">
            <div className="survei-filter" role="group" aria-label="Filter kategori instrumen">
              {KATEGORI.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`survei-filter__btn ${kategori === k ? 'is-active' : ''}`}
                  aria-pressed={kategori === k}
                  onClick={() => setKategori(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <p className="survei-note">
            Form terbuka di tab baru. Setelah selesai, kembali ke sini untuk melihat hasil di dashboard.
          </p>

          {filtered.length === 0 ? (
            <p className="survei-empty">Tidak ada instrumen pada kategori ini.</p>
          ) : (
            <div className="survei-grid">
              {filtered.map((d) => (
                <article key={d.key} className="scard">
                  <div className="scard__top">
                    <span className="scard__kategori">{d.kategori}</span>
                    {d.requiresGoogleLogin && <span className="scard__tag">Perlu akun Google</span>}
                  </div>
                  <h3 className="scard__name">{d.namaPanjang}</h3>
                  <p className="scard__desc">{d.deskripsi}</p>
                  <div className="scard__meta">
                    <span>{d.jumlahButir} pertanyaan</span>
                    <span aria-hidden="true">Â·</span>
                    <span>Â± {d.estimasiMenit} menit</span>
                    <span aria-hidden="true">Â·</span>
                    <span>{d.kelompok}</span>
                  </div>
                  <div className="scard__actions">
                    {d.url ? (
                      <a
                        className="btn btn-primary scard__cta"
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Isi survei ${d.namaPanjang} di tab baru`}
                      >
                        Isi Survei
                      </a>
                    ) : (
                      <span className="btn scard__cta scard__cta--disabled" aria-disabled="true">
                        Form belum tersedia
                      </span>
                    )}
                    <button
                      type="button"
                      className="scard__result"
                      onClick={() => onOpenInstrument && onOpenInstrument(d.key)}
                    >
                      Lihat hasil
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}






