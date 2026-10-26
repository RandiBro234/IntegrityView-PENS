import { useEffect, useRef, useState } from 'react';

/* Utilitas gerak bersama. Tanpa dependency tambahan: hanya IntersectionObserver
   dan requestAnimationFrame. Semua menghormati prefers-reduced-motion. */

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tanpaObserver() {
  return typeof window === 'undefined'
    || typeof IntersectionObserver === 'undefined'
    || prefersReducedMotion();
}

/* Reveal sekali saja saat elemen pertama terlihat.
   Mengembalikan ref + status terlihat. */
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null);
  /* Tanpa observer atau saat reduced motion, konten langsung dianggap terlihat. */
  const [terlihat, setTerlihat] = useState(tanpaObserver);

  useEffect(() => {
    const el = ref.current;
    if (!el || terlihat) return undefined;
    if (tanpaObserver()) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setTerlihat(true);
        /* Animasi hanya sekali: berhenti memantau elemen ini. */
        observer.unobserve(entry.target);
      });
    }, { threshold, rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, terlihat]);

  return { ref, terlihat };
}

/* Hitung naik dari 0 (atau dari nilai sebelumnya) ke nilai baru.
   Format akhir selalu benar, termasuk saat animasi dilewati. */
export function useCountUp(target, { durasi = 1200, desimal = 0, aktif = true } = {}) {
  const akhir = Number.isFinite(Number(target)) ? Number(target) : 0;
  const [nilai, setNilai] = useState(0);
  const dariRef = useRef(0);
  const frameRef = useRef(0);
  const lewati = !aktif || prefersReducedMotion() || typeof requestAnimationFrame === 'undefined';

  useEffect(() => {
    if (lewati) return undefined;

    const dari = dariRef.current;
    const mulai = performance.now();
    const faktor = 10 ** desimal;
    const bulat = (v) => Math.round(v * faktor) / faktor;

    const langkah = (now) => {
      const t = Math.min(1, (now - mulai) / durasi);
      const eased = 1 - (1 - t) ** 3;
      setNilai(bulat(dari + (akhir - dari) * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(langkah);
      } else {
        dariRef.current = akhir;
        setNilai(akhir);
      }
    };

    frameRef.current = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(frameRef.current);
  }, [akhir, durasi, desimal, lewati]);

  /* Saat animasi dilewati, nilai akhir dipakai langsung tanpa state. */
  return lewati ? akhir : nilai;
}

/* Transisi halaman memakai View Transitions API bila tersedia. */
export function dukungViewTransition() {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}
