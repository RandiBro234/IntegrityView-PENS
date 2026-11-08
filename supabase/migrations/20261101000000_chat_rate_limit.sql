-- Migrasi ADDITIVE untuk rate limit chatbot.
-- Tidak mengubah tabel/fungsi yang sudah ada, tidak menghapus data.
--
-- Isi:
--   1. Fungsi cek_batas_harian: penghitung global per hari untuk seluruh sistem
--      (bukan per IP). Dipakai sebagai pengaman biaya LLM.
--   2. Indeks tambahan untuk membersihkan baris rate limit yang kedaluwarsa.
--
-- Catatan privasi: tabel rate_limit_laporan hanya menyimpan HASH IP
-- (SHA-256 + RATE_LIMIT_SALT), bukan alamat IP. Baris lama dibersihkan lewat
-- fungsi bersihkan_rate_limit() yang bisa dijadwalkan (pg_cron) atau dipanggil
-- manual.

-- ============ 1. BATAS HARIAN SISTEM ============
create or replace function public.cek_batas_harian(
  p_aksi text,
  p_limit integer default 200
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jumlah integer;
  v_hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
begin
  insert into public.rate_limit_laporan as r (ip_hash, aksi, window_start, jumlah)
  values ('__sistem__', p_aksi, now(), 1)
  on conflict (ip_hash, aksi) do update
    set jumlah = case
          when (r.window_start at time zone 'Asia/Jakarta')::date < v_hari_ini then 1
          else r.jumlah + 1
        end,
        window_start = case
          when (r.window_start at time zone 'Asia/Jakarta')::date < v_hari_ini then now()
          else r.window_start
        end
  returning jumlah into v_jumlah;

  return v_jumlah <= greatest(coalesce(p_limit, 200), 1);
end;
$$;

revoke all on function public.cek_batas_harian(text, integer)
  from public, anon, authenticated;
grant execute on function public.cek_batas_harian(text, integer)
  to service_role;

-- ============ 2. PEMBERSIHAN ============
-- Baris rate limit tidak perlu disimpan lama. Fungsi ini aman dipanggil
-- berulang; jadwalkan harian bila pg_cron tersedia.
create or replace function public.bersihkan_rate_limit(p_hari integer default 2)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_terhapus integer;
begin
  delete from public.rate_limit_laporan
  where window_start < now() - make_interval(days => greatest(coalesce(p_hari, 2), 1));
  get diagnostics v_terhapus = row_count;
  return v_terhapus;
end;
$$;

revoke all on function public.bersihkan_rate_limit(integer)
  from public, anon, authenticated;
grant execute on function public.bersihkan_rate_limit(integer)
  to service_role;

-- Indeks untuk query pembersihan.
create index if not exists idx_rate_limit_window
  on public.rate_limit_laporan (window_start);

-- ============ 3. KOMENTAR ============
comment on function public.cek_batas_harian(text, integer) is
  'Batas harian global (seluruh sistem) untuk satu aksi. Baris sentinel memakai ip_hash = __sistem__.';
comment on function public.bersihkan_rate_limit(integer) is
  'Hapus baris rate limit yang lebih lama dari p_hari hari. Aman dipanggil berulang.';
