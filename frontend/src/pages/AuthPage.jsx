import { useState } from 'react';
import { BlobDecor } from '../components/cards/StatCard';
import { useAuth } from '../auth/AuthProvider';
import { formatAngka } from '../data/mock';
import { getReportData } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import { keSkor } from '../lib/formatSkor';
import './AuthPage.css';

const EMAIL_RE = /^[^\s@]+@pens\.ac\.id$/i;

function pesanLogin(error) {
  const pesan = String(error?.message || '').toLowerCase();
  if (pesan.includes('invalid login credentials')) return 'Email atau kata sandi salah.';
  if (pesan.includes('email not confirmed')) return 'Email belum dikonfirmasi. Hubungi SPI.';
  if (pesan.includes('too many')) return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
  if (pesan.includes('supabase belum dikonfigurasi')) return 'Layanan login belum dikonfigurasi.';
  return error?.message || 'Gagal masuk. Coba lagi.';
}

export default function AuthPage({ onSuccess, onBack }) {
  const { filter } = useReportFilters();
  const ringkasan = getReportData({ ...filter, kategori: 'Semua' }).ringkasan;
  const { signIn, supabaseSiap } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [mengirim, setMengirim] = useState(false);

  const submitLogin = async (e) => {
    e.preventDefault();
    if (mengirim) return;

    const err = {};
    if (!EMAIL_RE.test(loginEmail.trim())) err.email = 'Gunakan email institusi (@pens.ac.id).';
    if (!loginPass) err.pass = 'Kata sandi wajib diisi.';
    setLoginErrors(err);
    if (Object.keys(err).length) return;

    setMengirim(true);
    const { error } = await signIn(loginEmail.trim(), loginPass);
    setMengirim(false);

    if (error) {
      setLoginErrors({ form: pesanLogin(error) });
      return;
    }

    setShowSuccess(true);
    window.setTimeout(() => {
      if (onSuccess) onSuccess();
    }, 900);
  };

  return (
    <div className="auth">
      {/* === Kolom kiri: panel brand === */}
      <aside className="auth__brand">
        <BlobDecor color="#FFFFFF" />
        <button type="button" className="auth__brand-logo" onClick={onBack} aria-label="Kembali ke landing">
          IntegrityView
        </button>

        <div className="auth__brand-body">
          <h1 className="auth__brand-title">Satu akun, akses penuh ke ekosistem integritas kampus.</h1>
          <p className="auth__brand-lead">
            Masuk dengan akun yang dibuat Satuan Pengawasan Internal. Dosen dan tenaga
            kependidikan mengisi survei serta memantau laporan, admin menjaga kualitas data
            dan menindaklanjuti laporan.
          </p>

          <div className="auth__brand-stats">
            <div className="auth__brand-stat">
              <span className="auth__brand-stat-num">{formatAngka(keSkor(ringkasan.rataSkor), 2)}</span>
              <span className="auth__brand-stat-label">Rata-rata Indeks Persepsi Integritas (1–4)</span>
            </div>
            <div className="auth__brand-stat">
              <span className="auth__brand-stat-num">{ringkasan.responden.total.toLocaleString('id-ID')}</span>
              <span className="auth__brand-stat-label">Responden aktif</span>
            </div>
            <div className="auth__brand-stat">
              <span className="auth__brand-stat-num">{ringkasan.totalInstrumen}</span>
              <span className="auth__brand-stat-label">Instrumen berjalan</span>
            </div>
          </div>
        </div>

        <p className="auth__brand-foot">Zona Integritas PENS · Politeknik Elektronika Negeri Surabaya</p>
      </aside>

      {/* === Kolom kanan: form === */}
      <main className="auth__panel">
        <div className="auth__card">
          <form className="auth__form" onSubmit={submitLogin} noValidate>
            <h2 className="auth__form-title">Selamat datang kembali.</h2>
            <p className="auth__form-sub">Masuk dengan email institusi dan kata sandi akun Anda.</p>

            <Field label="Email institusi" error={loginErrors.email}>
              <input
                type="email"
                placeholder="nama@pens.ac.id"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                aria-invalid={!!loginErrors.email}
                autoComplete="email"
              />
            </Field>

            <Field label="Kata sandi" error={loginErrors.pass}>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                aria-invalid={!!loginErrors.pass}
                autoComplete="current-password"
              />
            </Field>

            {loginErrors.form && <p className="auth__error">{loginErrors.form}</p>}
            {!supabaseSiap && (
              <p className="auth__error">
                Supabase belum dikonfigurasi. Hubungi pengelola sistem.
              </p>
            )}

            <button type="submit" className="btn btn-primary auth__submit" disabled={mengirim || !supabaseSiap}>
              {mengirim ? 'Memeriksa…' : 'Masuk'}
            </button>

            <div className="auth__admin-note" role="note">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <p>
                Akun tidak dapat didaftarkan mandiri. Pengajuan akun atau reset kata sandi
                dilakukan oleh Satuan Pengawasan Internal (SPI) melalui <a href="mailto:spi@pens.ac.id">spi@pens.ac.id</a>.
              </p>
            </div>
          </form>
        </div>

        <button type="button" className="auth__back" onClick={onBack}>
          ← Kembali ke beranda
        </button>
      </main>

      {showSuccess && (
        <div className="auth__success" role="status">
          <div className="auth__success-card">
            <span className="auth__success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
            <h3>Berhasil masuk</h3>
            <p>Mengarahkan Anda ke dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className={`auth__field ${error ? 'has-error' : ''}`}>
      <label className="auth__label">{label}</label>
      {children}
      {error && <p className="auth__error">{error}</p>}
    </div>
  );
}
