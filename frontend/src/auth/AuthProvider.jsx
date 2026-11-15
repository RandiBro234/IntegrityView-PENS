import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseSiap } from '../lib/supabase';

const AuthContext = createContext(null);

const LABEL_ROLE = {
  admin: 'Admin Zona Integritas',
  sivitas: 'Dosen & Tenaga Kependidikan'
};

function inisial(nama) {
  const bagian = String(nama || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!bagian.length) return 'TM';
  return bagian.slice(0, 2).map((k) => k[0]).join('').toUpperCase();
}

function bikinUser(session) {
  if (!session?.user) return null;
  const akun = session.user;
  const role = akun.app_metadata?.role === 'admin' ? 'admin' : 'sivitas';
  const meta = akun.user_metadata || {};
  const nama = meta.nama
    || (role === 'admin' ? 'Admin SPI' : 'Dosen PENS');
  const sejak = meta.sejak
    || (akun.created_at ? String(new Date(akun.created_at).getFullYear()) : '—');

  return {
    id: akun.id,
    role,
    roleLabel: LABEL_ROLE[role],
    nama,
    inisial: meta.inisial || inisial(nama),
    email: akun.email || '—',
    nip: meta.nip || '—',
    unit: meta.unit || '—',
    jabatan: meta.jabatan || (role === 'admin' ? 'Admin Zona Integritas' : 'Dosen / Tenaga Kependidikan'),
    sejak,
    bergabung: akun.created_at || null
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return undefined;

    let aktif = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!aktif) return;
      setSession(data.session || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sesi) => {
      setSession(sesi || null);
      setLoading(false);
    });

    return () => {
      aktif = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => bikinUser(session), [session]);

  const signIn = async (email, password) => {
    if (!supabase) {
      return { error: new Error('Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).') };
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      setSession(null);
      return;
    }
    setSession(null);
  };

  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signOut,
    supabaseSiap
  }), [session, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  return ctx;
}
