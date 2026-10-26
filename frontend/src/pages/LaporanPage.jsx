import { useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import {
  getUser, isAdmin, getRingkasanPengaduan, getPengaduan, formatAngka
} from '../data/mock';
import { PERIODE, getReportData } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import Delta from '../components/dashboard/Delta';
import './LaporanPage.css';

export default function LaporanPage({ onNavigate }) {
  const user = getUser();
  const admin = isAdmin();
  const { filter, setFilter } = useReportFilters();

  /* Sumber angka yang sama dengan dashboard: selector tunggal. */
  /* Selector sudah punya cache internal; dihitung langsung agar ikut diperbarui setelah data asli tiba. */
  const laporan = getReportData(filter);
  const periode = laporan.periode.label;

  const rekap = admin
    ? laporan.instrumen.filter((s) => s.aktif).map((s) => ({
      key: s.info.key,
      nama: s.info.nama,
      namaPanjang: s.info.namaPanjang,
      skor: s.aktif.indeks,
      delta: s.delta,
      responden: s.aktif.n
    }))
    : [];

  const ringkasAduan = useMemo(() => getRingkasanPengaduan(), []);
  const pengaduan = useMemo(() => getPengaduan(), []);

  const rekapKategori = useMemo(() => {
    const peta = {};
    pengaduan.forEach((p) => {
      if (!peta[p.kategori]) peta[p.kategori] = { Baru: 0, Diproses: 0, Selesai: 0 };
      peta[p.kategori][p.status] = (peta[p.kategori][p.status] || 0) + 1;
    });
    return Object.entries(peta)
      .map(([kategori, v]) => ({ kategori, ...v, total: v.Baru + v.Diproses + v.Selesai }))
      .sort((a, b) => b.total - a.total);
  }, [pengaduan]);

  if (!admin) {
    return (
      <div className="app-shell">
        <Sidebar active="laporan" onNavigate={onNavigate} user={user} />
        <div className="app-main">
          <Topbar user={user} notifCount={0} onProfil={() => onNavigate && onNavigate('profil')} />
          <main className="app-content">
            <div className="lpr-guard">
              <h2>Halaman ini untuk admin Zona Integritas</h2>
              <p>Rekap laporan memuat data yang menyangkut integritas dan hanya dapat dibaca setelah login sebagai admin.</p>
              <button type="button" className="btn btn-primary" onClick={() => onNavigate && onNavigate('beranda')}>
                Kembali ke Beranda
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleMenu = (key) => onNavigate && onNavigate(key);
  const rataSkor = laporan.ringkasan.rataSkor ?? 0;

  const ekspor = () => {
    const baris = [['Instrumen', 'Nama Lengkap', 'Skor', 'Selisih', 'Responden', 'Periode']];
    rekap.forEach((r) => {
      baris.push([r.nama, r.namaPanjang, r.skor + '%', r.delta == null ? '-' : r.delta.toFixed(2), r.responden, periode]);
    });
    const csv = baris.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-zi-${periode.replace(/\s/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <Sidebar active="laporan" onNavigate={handleMenu} user={user} />
      <div className="app-main">
        <Topbar user={user} notifCount={ringkasAduan.Baru} onProfil={() => handleMenu('profil')} />
        <main className="app-content">
          <header className="lpr-head">
            <div>
              <p className="label-eyebrow">Laporan Â· Admin</p>
              <h1 className="lpr-head__title">Rekap Capaian Zona Integritas</h1>
              <p className="lpr-head__sub">Ringkasan skor seluruh instrumen dan pengaduan untuk periode terpilih.</p>
            </div>
            <div className="lpr-head__actions">
              <select
                value={filter.periode}
                onChange={(e) => setFilter({ ...filter, periode: e.target.value })}
                aria-label="Periode laporan"
              >
                {PERIODE.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <button type="button" className="btn btn-primary" onClick={ekspor}>Ekspor CSV</button>
            </div>
          </header>

          <div className="lpr-kpi">
            <Kpi label="Instrumen Terpantau" value={laporan.ringkasan.totalInstrumen} />
            <Kpi label="Rata-rata Skor" value={formatAngka(rataSkor) + '%'} />
            <Kpi label="Total Laporan" value={ringkasAduan.total} />
            <Kpi label="Laporan Baru" value={ringkasAduan.Baru} tone="warn" />
          </div>

          <section className="lpr-block">
            <h2 className="lpr-block__title">Rekap skor per instrumen</h2>
            <div className="lpr-table-wrap">
              <table className="lpr-table">
                <thead>
                  <tr><th>Instrumen</th><th>Nama</th><th>Skor</th><th>Selisih</th><th>Responden</th></tr>
                </thead>
                <tbody>
                  {rekap.map((r) => (
                    <tr key={r.key}>
                      <td className="lpr-id">{r.nama}</td>
                      <td>{r.namaPanjang}</td>
                      <td className="lpr-id">{formatAngka(r.skor)}%</td>
                      <td><Delta value={r.delta} compact /></td>
                      <td className="lpr-muted">{r.responden.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="lpr-block">
            <h2 className="lpr-block__title">Ringkasan pengaduan per kategori</h2>
            <div className="lpr-table-wrap">
              <table className="lpr-table">
                <thead>
                  <tr><th>Kategori</th><th>Baru</th><th>Diproses</th><th>Selesai</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {rekapKategori.map((k) => (
                    <tr key={k.kategori}>
                      <td>{k.kategori}</td>
                      <td>{k.Baru}</td>
                      <td>{k.Diproses}</td>
                      <td>{k.Selesai}</td>
                      <td className="lpr-id">{k.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  return (
    <article className={`lpr-kpi__card ${tone === 'warn' ? 'lpr-kpi__card--warn' : ''}`}>
      <span className="lpr-kpi__value">{value}</span>
      <span className="lpr-kpi__label">{label}</span>
    </article>
  );
}



