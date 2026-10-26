import { useState } from 'react';
import { BlobDecor } from '../components/cards/StatCard';
import { ROLES, loginAs, formatAngka } from '../data/mock';
import { getReportData } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import './AuthPage.css';

const UNIT_OPTIONS = [
  'D3 Teknik Elektro',
  'D3 Teknik Informatika',
  'D3 Teknik Mesin',
  'D4 Teknik Elektronika',
  'D4 Teknik Telekomunikasi',
  'D4 Teknik Komputer',
  'D4 Teknik Mekatronika',
  'D4 Sistem Informasi Bisnis',
  'D4 Teknologi Rekayasa Internet',
  'D4 Teknik Kimia Industri',
  'D4 Teknik Sipil',
  'Pascasarjana',
  'Unit / Biro Lainnya'
];

const EMAIL_RE = /^[^\s@]+@pens\.ac\.id$/i;

export default function AuthPage({ onSuccess, onBack }) {
  const { filter } = useReportFilters();
  const ringkasan = getReportData({ ...filter, kategori: 'Semua' }).ringkasan;
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showSuccess, setShowSuccess] = useState(false);
  const [loginRole, setLoginRole] = useState('sivitas');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErrors, setLoginErrors] = useState({});

  // Register state
  const [reg, setReg] = useState({
    nama: '', nip: '', unit: '', email: '', pass: '', pass2: '', setuju: false
  });
  const [regErrors, setRegErrors] = useState({});

  const switchMode = (m) => {
    setMode(m);
    setLoginErrors({});
    setRegErrors({});
  };

  const submitLogin = (e) => {
    e.preventDefault();
    const err = {};
    if (!EMAIL_RE.test(loginEmail)) err.email = 'Gunakan email institusi (@pens.ac.id).';
    if (!loginPass) err.pass = 'Kata sandi wajib diisi.';
    setLoginErrors(err);
    if (Object.keys(err).length) return;
    finishAuth(loginRole);
  };

  const submitRegister = (e) => {
    e.preventDefault();
    const err = {};
    if (!reg.nama.trim()) err.nama = 'Nama lengkap wajib diisi.';
    if (!reg.nip.trim()) err.nip = 'NIP/NIK wajib diisi.';
    if (!reg.unit) err.unit = 'Pilih unit/jurusan.';
    if (!EMAIL_RE.test(reg.email)) err.email = 'Gunakan email institusi (@pens.ac.id).';
    if (reg.pass.length < 8) err.pass = 'Minimal 8 karakter.';
    if (reg.pass2 !== reg.pass || !reg.pass2) err.pass2 = 'Konfirmasi tidak cocok.';
    if (!reg.setuju) err.setuju = 'Persetujuan wajib dicentang.';
    setRegErrors(err);
    if (Object.keys(err).length) return;
    finishAuth('sivitas');
  };

  const finishAuth = (roleKey) => {
    loginAs(roleKey);
    setShowSuccess(true);
    window.setTimeout(() => {
      if (onSuccess) onSuccess(roleKey);
    }, 1600);
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
              Masuk sesuai peran Anda, dosen dan tenaga kependidikan mengisi survei dan memantau capaian, admin menjaga kualitas data dan menindaklanjuti laporan.
          </p>

          <div className="auth__brand-stats">
            <div className="auth__brand-stat">
              <span className="auth__brand-stat-num">{formatAngka(ringkasan.rataSkor)}%</span>
              <span className="auth__brand-stat-label">Skor ZI periode ini</span>
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
          <div className="auth__tabs" role="tablist" aria-label="Mode autentikasi">
            <button
              type="button" role="tab"
              aria-selected={mode === 'login'}
              className={`auth__tab ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Masuk
            </button>
            <button
              type="button" role="tab"
              aria-selected={mode === 'register'}
              className={`auth__tab ${mode === 'register' ? 'is-active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Daftar
            </button>
          </div>

          {mode === 'login' ? (
            <form className="auth__form" onSubmit={submitLogin} noValidate>
              <h2 className="auth__form-title">Selamat datang kembali.</h2>
              <p className="auth__form-sub">Pilih peran Anda, lalu masuk dengan email institusi.</p>

              <div className="auth__roles" role="radiogroup" aria-label="Pilih peran">
                {Object.values(ROLES).map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    role="radio"
                    aria-checked={loginRole === r.key}
                    className={`auth__role ${loginRole === r.key ? 'is-active' : ''}`}
                    onClick={() => setLoginRole(r.key)}
                  >
                    <span className="auth__role-head">
                      <span className="auth__role-check" aria-hidden="true" />
                      <span className="auth__role-label">{r.label}</span>
                    </span>
                    <span className="auth__role-desc">{r.deskripsi}</span>
                  </button>
                ))}
              </div>

              <Field
                label="Email institusi"
                error={loginErrors.email}
              >
                <input
                  type="email"
                  placeholder="nama@pens.ac.id"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  aria-invalid={!!loginErrors.email}
                  autoComplete="email"
                />
              </Field>

              <Field
                label="Kata sandi"
                error={loginErrors.pass}
              >
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  aria-invalid={!!loginErrors.pass}
                  autoComplete="current-password"
                />
              </Field>

              <button type="submit" className="btn btn-primary auth__submit">Masuk</button>

              <p className="auth__switch">
                Belum punya akun?{' '}
                <button type="button" className="auth__link" onClick={() => switchMode('register')}>
                  Daftar sekarang
                </button>
              </p>
            </form>
          ) : (
            <form className="auth__form" onSubmit={submitRegister} noValidate>
              <h2 className="auth__form-title">Buat akun dosen/tendik.</h2>
              <p className="auth__form-sub">Satu akun untuk seluruh instrumen survei dan kanal pengaduan.</p>

              <Field label="Nama lengkap" error={regErrors.nama}>
                <input
                  type="text"
                  placeholder="Nama sesuai identitas kampus"
                  value={reg.nama}
                  onChange={(e) => setReg({ ...reg, nama: e.target.value })}
                  aria-invalid={!!regErrors.nama}
                  autoComplete="name"
                />
              </Field>

              <div className="auth__row">
                <Field label="NIP / NIK" error={regErrors.nip}>
                  <input
                    type="text"
                    placeholder="Nomor induk"
                    value={reg.nip}
                    onChange={(e) => setReg({ ...reg, nip: e.target.value })}
                    aria-invalid={!!regErrors.nip}
                  />
                </Field>
                <Field label="Unit / Jurusan" error={regErrors.unit}>
                  <select
                    value={reg.unit}
                    onChange={(e) => setReg({ ...reg, unit: e.target.value })}
                    aria-invalid={!!regErrors.unit}
                  >
                    <option value="">Pilih unit/jurusan</option>
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Email institusi" error={regErrors.email}>
                <input
                  type="email"
                  placeholder="nama@pens.ac.id"
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  aria-invalid={!!regErrors.email}
                  autoComplete="email"
                />
              </Field>

              <div className="auth__row">
                <Field label="Kata sandi" error={regErrors.pass}>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={reg.pass}
                    onChange={(e) => setReg({ ...reg, pass: e.target.value })}
                    aria-invalid={!!regErrors.pass}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Konfirmasi sandi" error={regErrors.pass2}>
                  <input
                    type="password"
                    placeholder="Ulangi sandi"
                    value={reg.pass2}
                    onChange={(e) => setReg({ ...reg, pass2: e.target.value })}
                    aria-invalid={!!regErrors.pass2}
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              <label className={`auth__consent ${regErrors.setuju ? 'has-error' : ''}`}>
                <input
                  type="checkbox"
                  checked={reg.setuju}
                  onChange={(e) => setReg({ ...reg, setuju: e.target.checked })}
                />
                <span>
                  Saya menyatakan data yang diisi benar dan setuju digunakan untuk keperluan survei serta pemantauan Zona Integritas PENS.
                </span>
              </label>
              {regErrors.setuju && <p className="auth__error">{regErrors.setuju}</p>}

              <button type="submit" className="btn btn-primary auth__submit">Daftar</button>

              <div className="auth__admin-note" role="note">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <p>
                  Akun admin tidak dapat didaftarkan mandiri. Akses admin dibuat langsung oleh Satuan Pengawasan Internal (SPI) untuk menjaga integritas data responden. Hubungi <a href="mailto:spi@pens.ac.id">spi@pens.ac.id</a> untuk pengajuan akses.
                </p>
              </div>

              <p className="auth__switch">
                Sudah punya akun?{' '}
                <button type="button" className="auth__link" onClick={() => switchMode('login')}>
                  Masuk di sini
                </button>
              </p>
            </form>
          )}
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

