import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseSiap } from '../lib/supabase';

const AuthContext = createContext(null);
const KUNCI_DEMO = 'integrityview_demo_role';

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
  const [demoRole, setDemoRole] = useState(() => {
    try { return localStorage.getItem(KUNCI_DEMO) || ''; } catch { return ''; }
  });
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

  const demoUser = demoRole === 'admin'
    ? { id: 'demo-spi', role: 'admin', roleLabel: LABEL_ROLE.admin, nama: 'Tim SPI', inisial: 'SPI', email: 'demo.spi@pens.ac.id', nip: '—', unit: 'Satuan Pengawasan Internal PENS', jabatan: 'Tim SPI', sejak: 'Demo',     bergabung: null, demo: true }
    : { id: 'demo-dosen', role: 'sivitas', roleLabel: LABEL_ROLE.sivitas, nama: 'Dosen Demo', inisial: 'DD', email: 'demo.dosen@pens.ac.id', nip: '—', unit: 'Demo PENS', jabatan: 'Dosen / Tenaga Kependidikan', sejak: 'Demo', bergabung: null, demo: true };

  const user = demoRole ? demoUser : bikinUser(session);

  const masukDemo = (role) => {
    setDemoRole(role);
    try { localStorage.setItem(KUNCI_DEMO, role); } catch { /* storage opsional */ }
  };

  const signIn = async (email, password) => {
    setDemoRole('');
    try { localStorage.removeItem(KUNCI_DEMO); } catch { /* storage opsional */ }
    if (!supabase) {
      return { error: new Error('Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).') };
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    try {
      if (supabase && !demoRole) await supabase.auth.signOut();
    } catch {
      setSession(null);
    }
    setSession(null);
    setDemoRole('');
    try { localStorage.removeItem(KUNCI_DEMO); } catch { /* storage opsional */ }
  };

  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signOut,
    masukDemo,
    supabaseSiap,
    demoMode: Boolean(demoRole)
  }), [session, user, loading, demoRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  return ctx;
}
