-- Autentikasi pelaporan: tautkan laporan ke akun Supabase Auth.
--
-- Kolom user_id hanya dipakai internal. Frontend admin tidak pernah menerima
-- kolom ini; Edge Function kelola-laporan memilih kolom secara eksplisit.
-- Laporan anonim tetap tidak menyimpan nama/kontak, tetapi tetap tertaut ke
-- akun pelapor agar muncul di "Laporan Saya".

alter table public.pengaduan
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.whistleblowing
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_pengaduan_user_id
  on public.pengaduan (user_id, created_at desc);

create index if not exists idx_whistleblowing_user_id
  on public.whistleblowing (user_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function public.laporan_saya()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with hasil as (
    select
      'pengaduan'::text as jenis,
      kode, judul, kategori, anonim, status, riwayat, balasan,
      coalesce(jsonb_array_length(lampiran), 0) as jumlah_lampiran,
      created_at, updated_at
    from public.pengaduan
    where user_id = auth.uid()

    union all

    select
      'wbs'::text,
      kode, judul, kategori, anonim, status, riwayat, balasan,
      coalesce(jsonb_array_length(lampiran), 0),
      created_at, updated_at
    from public.whistleblowing
    where user_id = auth.uid()
  )
  select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc), '[]'::jsonb)
  from hasil h;
$$;

revoke all on function public.laporan_saya() from public, anon;
grant execute on function public.laporan_saya() to authenticated;

create or replace function public.lacak_laporan(p_kode text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with hasil as (
    select
      'pengaduan'::text as jenis,
      kode, judul, kategori, status, riwayat, balasan,
      coalesce(jsonb_array_length(lampiran), 0) as jumlah_lampiran,
      created_at, updated_at
    from public.pengaduan
    where upper(kode) = upper(btrim(p_kode))
      and (public.is_admin() or user_id = auth.uid())

    union all

    select
      'wbs'::text,
      kode, judul, kategori, status, riwayat, balasan,
      coalesce(jsonb_array_length(lampiran), 0),
      created_at, updated_at
    from public.whistleblowing
    where upper(kode) = upper(btrim(p_kode))
      and (public.is_admin() or user_id = auth.uid())
  )
  select to_jsonb(h) from hasil h limit 1;
$$;

revoke all on function public.lacak_laporan(text) from public, anon, authenticated;
grant execute on function public.lacak_laporan(text) to authenticated;

comment on function public.laporan_saya() is
  'Daftar laporan milik pengguna yang sedang login, tanpa PII pelapor dan tanpa user_id.';

comment on function public.lacak_laporan(text) is
  'Pelacakan laporan oleh pemilik atau admin. Anon tidak lagi memiliki akses.';

notify pgrst, 'reload schema';
