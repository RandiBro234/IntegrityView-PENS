import { useEffect, useState } from 'react';
import { DEFAULT_FILTER, normalisasiFilter, muatDataSurvei } from './surveyData';
import { FilterContext } from './useReportFilters';

function dariUrl() {
  if (typeof window === 'undefined') return DEFAULT_FILTER;
  const params = new URLSearchParams(window.location.search);
  return normalisasiFilter(Object.fromEntries(Object.keys(DEFAULT_FILTER).map((key) => [key, params.get(key)])));
}

export function ReportFilterProvider({ children }) {
  const [filter, setFilter] = useState(dariUrl);
  const [siap, setSiap] = useState(false);

  /* Muat data asli sekali; selector membaca store yang sama. */
  useEffect(() => {
    let aktif = true;
    muatDataSurvei().then(() => { if (aktif) setSiap(true); });
    return () => { aktif = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    /* Filter default tidak ditulis ke URL agar alamat tetap bersih. Filter yang
       diubah tetap disimpan supaya tautan bisa dibagikan dan dibuka kembali. */
    Object.entries(filter).forEach(([key, value]) => {
      if (value === DEFAULT_FILTER[key]) params.delete(key);
      else params.set(key, value);
    });
    const query = params.toString();
    const alamat = query
      ? `${window.location.pathname}?${query}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, '', alamat);
  }, [filter]);

  useEffect(() => {
    const sync = () => setFilter(dariUrl());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return (
    <FilterContext.Provider value={{ filter, setFilter, siap }}>
      {children}
    </FilterContext.Provider>
  );
}
