import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BlobDecor } from '../components/cards/StatCard';
import { KONTAK, labelPartisipan } from '../data/mock';
import { getReportData } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import Delta from '../components/dashboard/Delta';
import SatisViewLink from '../components/laporan/SatisViewLink';
import Reveal from '../components/motion/Reveal';
import CountUp from '../components/motion/CountUp';
import { kategoriPerGrup } from '../data/reportCategories';
import { formatDeltaAngka } from '../lib/formatDelta';
import './LandingPage.css';

const ALUR = [
  { n: 1, judul: 'Isi Survei lewat Google Form', desc: 'Dosen dan tenaga kependidikan mengisi survei lewat Google Form dari Pusat Survei. Laporan pelanggaran tetap lewat kanal WBS.' },
  { n: 2, judul: 'Data Masuk ke Sistem', desc: 'Respons terverifikasi Unit Penjaminan Mutu dan tercatat di basis data survei.' },
  { n: 3, judul: 'Dianalisis Tim SPI', desc: 'Satuan Pengawasan Internal menghitung skor indeks dan menelaah temuan.' },
  { n: 4, judul: 'Ditindaklanjuti & Dipublikasi', desc: 'Hasil tampil di dashboard publik sebagai agregat dan rekomendasi diteruskan ke unit terkait.' }
];

/* Gradasi latar per langkah, arah seragam 135deg, satu keluarga warna tema:
   1) navy tua -> biru tua   2) biru tua -> biru muda
   3) biru muda -> oranye muda   4) oranye muda -> oranye
   Langkah 1-2 berlatar gelap (teks putih, nomor oranye solid);
   langkah 3-4 berlatar terang (teks navy, nomor navy solid). */
const ALUR_GRADIENTS = [
  { bg: 'linear-gradient(135deg, #0B1B33 0%, #14294A 100%)', numBg: '#F5843C', numColor: '#0B1B33', textColor: '#FFFFFF', descColor: 'rgba(241,244,249,0.78)' },
  { bg: 'linear-gradient(135deg, #14294A 0%, #2E5F9E 100%)', numBg: '#F5843C', numColor: '#0B1B33', textColor: '#FFFFFF', descColor: 'rgba(241,244,249,0.78)' },
  { bg: 'linear-gradient(135deg, #8FB6E0 0%, #F6D3B4 100%)', numBg: '#0B1B33', numColor: '#FFFFFF', textColor: '#0B1B33', descColor: 'rgba(11,27,51,0.72)' },
  { bg: 'linear-gradient(135deg, #FDDFC8 0%, #F5843C 100%)', numBg: '#0B1B33', numColor: '#FFFFFF', textColor: '#0B1B33', descColor: 'rgba(11,27,51,0.72)' },
];

const SECTION_NAV = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'instrumen', label: 'Instrumen' },
  { id: 'lapor', label: 'Lapor' },
  { id: 'alur', label: 'Alur' }
];

const LEBAR_INDIKATOR = 100;

/* Langkah ke-5 dan seterusnya (bila ALUR bertambah) meneruskan gradasi
   dengan interpolasi warna pada arah yang sama. */
function gradientLangkah(i) {
  const dasar = ALUR_GRADIENTS;
  if (i < dasar.length) return dasar[i];
  const dari = dasar[dasar.length - 2];
  const ke = dasar[dasar.length - 1];
  const campur = Math.min(1, (i - dasar.length + 2) / 2);
  return {
    bg: `linear-gradient(135deg, ${ke.bg.match(/#[0-9A-Fa-f]{6}/)[0]} 0%, ${campur > 0.5 ? '#F5843C' : dari.bg.match(/#[0-9A-Fa-f]{6}/)[0]} 100%)`,
    numBg: ke.numBg,
    numColor: ke.numColor,
    textColor: ke.textColor,
    descColor: ke.descColor
  };
}

export default function LandingPage({ onEnterDashboard, session }) {
  const [scrollY, setScrollY] = useState(0);
  const [aktifSection, setAktifSection] = useState('');
  const [indikator, setIndikator] = useState(null);
  const navRef = useRef(null);

  const { filter } = useReportFilters();
  /* Selector sudah punya cache internal; dihitung langsung agar ikut diperbarui setelah data asli tiba. */
  const laporan = getReportData({ ...filter, kategori: 'Semua' });
  const ringkasan = laporan.ringkasan;
  const ringkasanResponden = ringkasan.responden.total;
  const surveiLanding = laporan.instrumen.filter((s) => s.aktif).map((s) => ({ ...s.info, responden: s.aktif.n }));
  const kategoriSkor = laporan.kategoriSkor;
  const { naik, turun } = laporan.perubahanTerbesar;

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Scroll-spy: section yang sedang terlihat menentukan menu aktif. */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const sections = SECTION_NAV
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const terlihat = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (terlihat) setAktifSection(terlihat.target.id);
    }, { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.15, 0.5, 1] });
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /* Garis bawah menu aktif bergeser memakai transform (bukan width/left). */
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || !aktifSection) { setIndikator(null); return; }
    const link = nav.querySelector(`[data-section="${aktifSection}"]`);
    if (!link) { setIndikator(null); return; }
    const navBox = nav.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    setIndikator({
      x: linkBox.left - navBox.left,
      skala: linkBox.width / LEBAR_INDIKATOR
    });
  }, [aktifSection]);

  const parallax = Math.min(20, scrollY * 0.06);
  const navbarPadat = scrollY > 8;
  const lewatHero = scrollY > (typeof window !== 'undefined' ? window.innerHeight * 0.7 : 500);

  return (
    <div className="landing">
      <div className="landing__first-screen">
        <header className={`landing__topbar ${navbarPadat ? 'is-padat' : ''}`}>
          <div className="landing__brand">
            <span className="landing__brand-name">IntegrityView</span>
          </div>
          <nav className="landing__nav" ref={navRef} aria-label="Navigasi halaman">
            {SECTION_NAV.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                data-section={s.id}
                className={aktifSection === s.id ? 'is-active' : ''}
                aria-current={aktifSection === s.id ? 'true' : undefined}
              >
                {s.label}
              </a>
            ))}
            <span
              className="landing__nav-indikator"
              aria-hidden="true"
              style={indikator ? {
                opacity: 1,
                transform: `translateX(${indikator.x}px) scaleX(${indikator.skala})`
              } : { opacity: 0 }}
            />
          </nav>
          {session ? (
            <button
              type="button"
              className="landing__avatar"
              onClick={onEnterDashboard}
              aria-label={`Akun ${session.nama}`}
              title={session.nama}
            >
              {session.inisial}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onEnterDashboard}>Masuk</button>
          )}
        </header>

        <section className="landing__hero">
          <div className="landing__hero-inner">
            <div className="landing__hero-text">
              <Reveal as="p" className="label-eyebrow" delay={0}>Zona Integritas PENS</Reveal>
              <Reveal as="h1" className="landing__hero-title" delay={70}>
                Capaian integritas kampus, terbuka untuk diperiksa siapa saja.
              </Reveal>
              <Reveal as="p" className="landing__hero-lead" delay={140}>
                Platform ini menyatukan {ringkasan.totalInstrumen} instrumen survei, dashboard analitik publik, dan kanal pelaporan WBS dalam satu alamat. Pimpinan dan assessor membaca data tanpa menunggu laporan manual.
              </Reveal>
              <Reveal className="landing__hero-cta" delay={210}>
                <button type="button" className="btn btn-primary" onClick={onEnterDashboard}>
                  Buka Dashboard Publik
                </button>
                <button type="button" className="btn btn-outline-light" onClick={() => onEnterDashboard('survei')}>Lihat Pusat Survei</button>
              </Reveal>
            </div>

            <div className="landing__hero-visual" aria-hidden="true">
              <div className="landing__hero-frame" style={{ transform: `translateY(${parallax * 0.4}px)` }}>
                <div className="landing__hero-photo">
                  <img src="/pens.jpeg" alt="" loading="eager" />
                  <div className="landing__hero-photo-scrim" />
                </div>

                <Reveal className="landing__bento landing__bento--a" variant="scale-in" delay={280}>
                  <BlobDecor color="#0B1B33" />
                  <p className="label-eyebrow">Skor ZI {laporan.periode.label}</p>
                  <div className="landing__bento-value">
                    <CountUp value={ringkasan.rataSkor} desimal={1} suffix="%" langsung />
                  </div>
                  <Delta value={ringkasan.delta} />
                </Reveal>

                <Reveal className="landing__bento landing__bento--b" variant="scale-in" delay={350}>
                  <BlobDecor color="#FFFFFF" />
                  <p className="label-eyebrow" style={{ color: 'rgba(241,244,249,0.7)' }}>Responden</p>
                  <div className="landing__bento-value" style={{ color: '#fff' }}>
                    <CountUp value={ringkasan.responden.total} langsung />
                  </div>
                  <span className="landing__bento-note">{laporan.periode.label}</span>
                </Reveal>

                <Reveal className="landing__bento landing__bento--c" variant="scale-in" delay={420}>
                  <p className="label-eyebrow" style={{ color: 'rgba(11,27,51,0.6)' }}>Instrumen aktif</p>
                  <div className="landing__bento-value">
                    <CountUp value={ringkasan.totalInstrumen} langsung />
                  </div>
                  <div className="landing__bento-bars">
                    <span style={{ height: '40%' }} />
                    <span style={{ height: '60%' }} />
                    <span style={{ height: '80%' }} />
                    <span style={{ height: '100%' }} />
                  </div>
                </Reveal>
              </div>
            </div>
          </div>

          <div className={`landing__scroll-hint ${scrollY > 24 ? 'is-berhenti' : ''}`} aria-hidden="true">
            <span>Selengkapnya</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </section>
      </div>

      <section className="landing__about landing__section-anchor" id="tentang">
        <Reveal className="landing__about-inner">
          <div className="landing__about-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="label-eyebrow">Tentang</p>
            <h2 className="landing__section-title">Zona Integritas adalah komitmen, bukan slogan.</h2>
            <p className="landing__about-text">
              Zona Integritas (ZI) adalah program nasional Kementerian PANRB untuk membangun birokrasi yang bersih, bebas korupsi, dan berorientasi layanan. PENS sebagai perguruan tinggi negeri wajib membuktikan capaiannya lewat survei terstandar dan kanal pelaporan WBS yang transparan.
            </p>
            <p className="landing__about-text">
              IntegrityView dikelola oleh <strong>{KONTAK.unit}</strong> untuk menyatukan pengisian survei, pemantauan skor, dan tindak lanjut laporan dalam satu platform terbuka.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="landing__stats">
        <Reveal className="landing__section-head">
          <div>
            <p className="label-eyebrow">Statistik Ringkas</p>
            <h2 className="landing__section-title">Skor per kategori instrumen.</h2>
          </div>
        </Reveal>

        <div className="landing__stats-grid">
          {kategoriSkor.map((k, i) => (
            <Reveal as="article" key={k.kategori} className="landing__stat-card" delay={i * 70}>
              <BlobDecor color="#0B1B33" />
              <p className="label-eyebrow">{k.kategori}</p>
              <div className="landing__stat-num">
                <CountUp value={k.skor} desimal={1} />
                <span className="landing__stat-unit">%</span>
              </div>
              <p className="landing__stat-label">
                <Delta value={k.delta} />
              </p>
            </Reveal>
          ))}

          {naik && turun && (
            <Reveal as="article" className="landing__stat-card landing__stat-card--peach" delay={kategoriSkor.length * 70}>
              <BlobDecor color="#FFFFFF" />
              <p className="label-eyebrow" style={{ color: 'rgba(255,255,255,0.72)' }}>Perubahan Terbesar</p>

              <div className="landing__rentang">
                <div className="landing__rentang-row">
                  <div className="landing__rentang-left">
                    <span className="landing__rentang-tag landing__rentang-tag--high">Kenaikan</span>
                    <span className="landing__rentang-nama">
                      {naik.info.nama}
                    </span>
                  </div>
                  <span className="landing__rentang-skor">{formatDeltaAngka(naik.delta)} poin</span>
                </div>

                <div className="landing__rentang-row">
                  <div className="landing__rentang-left">
                    <span className="landing__rentang-tag landing__rentang-tag--low">Penurunan</span>
                    <span className="landing__rentang-nama">
                      {turun.info.nama}
                    </span>
                  </div>
                  <span className="landing__rentang-skor">{formatDeltaAngka(turun.delta)} poin</span>
                </div>

                <div className="landing__rentang-selisih">
                  <span>vs {laporan.periodePembanding?.label}</span>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="landing__instrumen landing__section-anchor" id="instrumen">
        <Reveal className="landing__section-head">
          <div>
            <p className="label-eyebrow">Pusat Survei</p>
            <h2 className="landing__section-title">{ringkasan.totalInstrumen} instrumen integritas.</h2>
          </div>
        </Reveal>
        <div className="landing__instr-grid">
          {surveiLanding.map((s, i) => (
            <Reveal
              as="button"
              type="button"
              key={s.key}
              className="landing__instr-card"
              delay={(i % 4) * 70}
              onClick={() => onEnterDashboard('survei')}
              aria-label={`Buka Pusat Survei untuk ${s.namaPanjang}`}
            >
              <span className="landing__instr-chevron arah-link" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
              <span className="landing__instr-kategori">{s.kategori}</span>
              <span className="landing__instr-name">{s.namaPanjang}</span>
              <span className="landing__instr-foot">
                <span className="landing__instr-resp">{labelPartisipan(s)}</span>
                <span className="landing__instr-key">{s.nama}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="landing__lapor landing__section-anchor" id="lapor">
        <Reveal className="landing__section-head">
          <div>
            <p className="label-eyebrow">Kanal Pelaporan</p>
            <h2 className="landing__section-title">Laporkan dugaan pelanggaran integritas.</h2>
          </div>
        </Reveal>

        <div className="landing__lapor-grid">
          <Reveal as="article" className="landing__lapor-card landing__lapor-card--dark">
            <span className="landing__lapor-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
            </span>
            <h3 className="landing__lapor-title">Whistleblowing System</h3>
            <p className="landing__lapor-desc">
              Satu kanal resmi untuk melaporkan dugaan pelanggaran integritas di PENS:
              gratifikasi, pungli, korupsi, benturan kepentingan, penyalahgunaan wewenang,
              atau pelanggaran etika.
            </p>
            <ul className="landing__lapor-list">
              <li>Mendukung pelaporan anonim penuh</li>
              <li>Identitas tidak disimpan bila anonim</li>
              <li>Pantau status dengan kode laporan</li>
              <li>Ditangani langsung Tim Zona Integritas</li>
            </ul>
            <div className="landing__lapor-actions">
              <button
                type="button"
                className="btn btn-primary landing__lapor-btn"
                onClick={() => onEnterDashboard('pengaduan', 'buat')}
              >
                Buat Laporan
              </button>
              <button
                type="button"
                className="btn btn-outline-light landing__lapor-btn"
                onClick={() => onEnterDashboard('pengaduan', 'lacak')}
              >
                Lacak Status
              </button>
            </div>
          </Reveal>

          <Reveal as="article" className="landing__lapor-card" delay={70}>
            <h3 className="landing__lapor-title">Yang dapat dilaporkan</h3>
            <p className="landing__lapor-desc">
              Pilih kategori yang paling mendekati kejadian. Bila ragu, gunakan
              &quot;Dugaan Pelanggaran Integritas Lainnya&quot;.
            </p>
            <div className="landing__lapor-groups">
              {kategoriPerGrup().map((grup) => (
                <div key={grup.key} className="landing__lapor-group">
                  <p className="landing__lapor-group-title">{grup.label}</p>
                  <div className="landing__lapor-chips">
                    {grup.kategori.map((k) => (
                      <span key={k.key} className="landing__lapor-chip">{k.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="landing__lapor-note">
              Keluhan fasilitas atau kepuasan layanan? Gunakan <SatisViewLink />.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="landing__alur landing__section-anchor" id="alur">
        <Reveal className="landing__section-head">
          <div>
            <p className="label-eyebrow">Alur Kerja</p>
            <h2 className="landing__section-title">Dari pengisian sampai publikasi.</h2>
          </div>
        </Reveal>
        <ol className="landing__alur-list">
          {ALUR.map((a, i) => {
            const g = gradientLangkah(i);
            return (
              <Reveal
                as="li"
                key={a.n}
                className="landing__alur-step"
                delay={i * 70}
                style={{ background: g.bg }}
              >
                <div className="landing__alur-num" style={{ background: g.numBg, color: g.numColor }}>{a.n}</div>
                <h3 className="landing__alur-judul" style={{ color: g.textColor }}>{a.judul}</h3>
                <p className="landing__alur-desc" style={{ color: g.descColor }}>{a.desc}</p>
                {i < ALUR.length - 1 && (
                  <svg className="landing__alur-arrow" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </Reveal>
            );
          })}
        </ol>
      </section>

      <Reveal as="section" className="landing__cta-band">
        <BlobDecor color="#FFFFFF" />
        <div className="landing__cta-inner">
          <div className="landing__cta-text">
            <h2>Jadi bagian dari transparansi kampus.</h2>
            <p>
              Terbuka untuk <strong>dosen dan tenaga kependidikan</strong> PENS.
              Pengisian lewat Google Form. Hasil ditampilkan sebagai agregat di dashboard publik tanpa menampilkan identitas responden.
            </p>
            <p className="landing__cta-partisipan">
              <strong className="landing__cta-partisipan-n">
                <CountUp value={ringkasanResponden} />
              </strong> responden telah berpartisipasi
            </p>
          </div>
          <button type="button" className="btn btn-ghost-light landing__cta-btn" onClick={() => onEnterDashboard('survei')}>
            Mulai Isi Survei
            <svg className="arah-link" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </Reveal>

      <Reveal as="footer" className="landing__footer">
        <div className="landing__footer-grid">
          <div className="landing__footer-col">
            <div className="landing__brand" style={{ marginBottom: 12 }}>
              <span className="landing__brand-mark">IV</span>
              <span className="landing__brand-name">IntegrityView</span>
            </div>
            <p>Platform Analitik Zona Integritas PENS, dikelola oleh {KONTAK.unit}.</p>
          </div>

          <div className="landing__footer-col">
            <h4>Kontak Pelaporan</h4>
            <ul>
              <li><a href={`mailto:${KONTAK.email}`}>{KONTAK.email}</a></li>
              <li><a href={`tel:${KONTAK.telp.replace(/[^\d+]/g, '')}`}>{KONTAK.telp}</a></li>
              <li>WA: {KONTAK.wa}</li>
              <li>{KONTAK.alamat}</li>
            </ul>
          </div>

          <div className="landing__footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#instrumen">Pusat Survei</a></li>
              <li><button type="button" className="landing__footer-linkbtn" onClick={onEnterDashboard}>Dashboard Publik</button></li>
              <li><a href="#alur">Alur Kerja</a></li>
            </ul>
          </div>

          <div className="landing__footer-col">
            <h4>Legal & Sosial</h4>
            <ul>
              <li><a href="#" onClick={e => e.preventDefault()}>Kebijakan Privasi Pelapor</a></li>
              <li><a href="#" onClick={e => e.preventDefault()}>Syarat Penggunaan Data</a></li>
            </ul>
            <div className="landing__footer-social">
              <a href="#" onClick={e => e.preventDefault()} aria-label="Instagram PENS">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" onClick={e => e.preventDefault()} aria-label="YouTube PENS">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2.5" y="5" width="19" height="14" rx="4" />
                  <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" onClick={e => e.preventDefault()} aria-label="Situs web PENS">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="landing__footer-bottom">
          <span>IntegrityView, prototipe v3 · 2026.</span>
          <span>Politeknik Elektronika Negeri Surabaya · Zona Integritas</span>
        </div>
      </Reveal>

      <button type="button" className="landing__help" aria-label="Butuh bantuan">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        <span className="landing__help-label">Butuh Bantuan?</span>
      </button>

      <button
        type="button"
        className={`landing__to-top ${lewatHero ? 'is-tampil' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Kembali ke atas"
        tabIndex={lewatHero ? 0 : -1}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
