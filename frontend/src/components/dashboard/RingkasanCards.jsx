import './RingkasanCards.css';
import { formatAngka } from '../../data/mock';
import Delta from './Delta';
import InfoTip from './InfoTip';

export default function RingkasanCards({ ringkasan, pembanding }) {
  const r = ringkasan;

  return (
    <div className="ringkasan-cards">
      <article className="rcard">
        <div className="rcard__top"><p className="rcard__eyebrow">Total Instrumen</p><InfoTip label="Kelompok instrumen" teks={`Layanan: ${r.kelompok.layanan.join(', ') || 'Tidak ada'}\nInternal: ${r.kelompok.internal.join(', ') || 'Tidak ada'}`} /></div>
        <div className="rcard__main"><strong className="rcard__num">{r.totalInstrumen}</strong>{r.deltaInstrumen != null && r.deltaInstrumen !== 0 && <span className="rcard__delta" title={pembanding ? `dibanding ${pembanding.label}` : undefined}><Delta value={r.deltaInstrumen} unit="instrumen" /></span>}</div>
      </article>

      <article className="rcard">
        <div className="rcard__top"><p className="rcard__eyebrow">Jumlah Responden</p><InfoTip label="Rincian responden" teks={`Dosen: ${r.responden.dosen.toLocaleString('id-ID')}\nTenaga Kependidikan: ${r.responden.tendik.toLocaleString('id-ID')}`} /></div>
        <div className="rcard__main"><strong className="rcard__num">{r.responden.total.toLocaleString('id-ID')}</strong>{r.deltaResponden != null && <span className="rcard__delta" title={pembanding ? `dibanding ${pembanding.label}` : undefined}><Delta value={r.deltaResponden} unit="responden" /></span>}</div>
      </article>

      <article className="rcard">
        <div className="rcard__top"><p className="rcard__eyebrow">Rata-rata Skor ZI</p><InfoTip label="Metode skor" teks={`Interval kepercayaan 95%: ${r.rataSkor == null ? 'n kurang dari 5' : `${formatAngka(r.ci.bawah)}% – ${formatAngka(r.ci.atas)}%`}\nIndeks = total skor aktual / total skor maksimal × 100`} /></div>
        <div className="rcard__main"><strong className="rcard__num">{r.rataSkor == null ? 'n kurang dari 5' : formatAngka(r.rataSkor)}{r.rataSkor != null && <span className="rcard__unit">%</span>}</strong>{r.delta != null && <span className="rcard__delta" title={pembanding ? `dibanding ${pembanding.label}` : undefined}><Delta value={r.delta} /></span>}</div>
      </article>
    </div>
  );
}
