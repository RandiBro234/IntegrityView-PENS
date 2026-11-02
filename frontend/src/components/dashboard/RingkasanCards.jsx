import './RingkasanCards.css';
import { formatAngka } from '../../data/mock';
import Delta from './Delta';
import InfoTip from './InfoTip';
import Reveal from '../motion/Reveal';
import CountUp from '../motion/CountUp';

export default function RingkasanCards({ ringkasan, pembanding }) {
  const r = ringkasan;
  const vs = pembanding ? `dibanding ${pembanding.label}` : 'tanpa pembanding';

  const catatanSkor = [
    r.ci ? `Interval kepercayaan 95%: ${formatAngka(r.ci.bawah)}% – ${formatAngka(r.ci.atas)}%` : null,
    'Indeks = total skor aktual / total skor maksimal × 100',
    r.simulasiTerpakai > 0 ? `termasuk ${r.simulasiTerpakai} instrumen simulasi` : null
  ].filter(Boolean).join('\n');

  const catatanResponden = [
    `Dosen: ${r.responden.dosen.toLocaleString('id-ID')}`,
    `Tenaga Kependidikan: ${r.responden.tendik.toLocaleString('id-ID')}`
  ].join('\n');

  return (
    <div className="ringkasan-cards">
      <Reveal as="article" className="rcard" delay={0}>
        <div className="rcard__top">
          <p className="rcard__eyebrow">Total Instrumen</p>
          <InfoTip
            label="Kelompok instrumen"
            teks={`Layanan: ${r.kelompok.layanan.join(', ') || 'Tidak ada'}\nInternal: ${r.kelompok.internal.join(', ') || 'Tidak ada'}`}
          />
        </div>
        <div className="rcard__main">
          <strong className="rcard__num"><CountUp value={r.totalInstrumen} /></strong>
          {r.deltaInstrumen != null && r.deltaInstrumen !== 0 && (
            <span className="rcard__delta" title={vs}><Delta value={r.deltaInstrumen} unit="instrumen" /></span>
          )}
        </div>
      </Reveal>

      <Reveal as="article" className="rcard" delay={70}>
        <div className="rcard__top">
          <p className="rcard__eyebrow">Jumlah Responden</p>
          <InfoTip label="Rincian responden" teks={catatanResponden} />
        </div>
        <div className="rcard__main">
          <strong className="rcard__num"><CountUp value={r.responden.total} /></strong>
          {r.deltaResponden != null && r.deltaResponden !== 0 && (
            <span className="rcard__delta" title={vs}><Delta value={r.deltaResponden} unit="responden" /></span>
          )}
        </div>
      </Reveal>

      <Reveal as="article" className="rcard" delay={140}>
        <div className="rcard__top">
          <p className="rcard__eyebrow">Rata-rata Skor ZI</p>
          <InfoTip label="Metode skor" teks={catatanSkor} />
        </div>
        <div className="rcard__main">
          <strong className="rcard__num">
            {r.rataSkor == null
              ? 'Belum ada data'
              : <><CountUp value={r.rataSkor} desimal={1} /><span className="rcard__unit">%</span></>}
          </strong>
          {r.delta != null && <span className="rcard__delta" title={vs}><Delta value={r.delta} /></span>}
        </div>
      </Reveal>
    </div>
  );
}
