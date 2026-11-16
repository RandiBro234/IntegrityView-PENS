-- Rekomendasi dari jawaban terbuka (klasterisasi komentar).
--
-- Alur:
--   survey_responses (insert/update/delete)
--     -> trigger menandai rekomendasi_kotor (murah, tanpa menghitung apa pun)
--     -> pg_cron memanggil Edge Function hitung-rekomendasi
--     -> Edge Function menulis rekomendasi_terbuka
--     -> dashboard & chatbot membaca lewat daftar_rekomendasi_terbuka()
--
-- Teks komentar tidak pernah dikirim ke model bahasa. Function hanya mengirim
-- label kelompok + kata kunci tersaring (lihat lib/saran.ts).

-- =====================================================================
-- Periode dari created_at, memakai WIB (bukan UTC). Sama dengan
-- periodeDariTanggal di frontend dan Edge Function.
-- =====================================================================
create or replace function public.periode_survei(p_waktu timestamptz)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when extract(month from (p_waktu at time zone 'Asia/Jakarta')) >= 9
      then extract(year from (p_waktu at time zone 'Asia/Jakarta'))::int || '-ganjil'
    when extract(month from (p_waktu at time zone 'Asia/Jakarta')) <= 2
      then (extract(year from (p_waktu at time zone 'Asia/Jakarta'))::int - 1) || '-ganjil'
    else extract(year from (p_waktu at time zone 'Asia/Jakarta'))::int || '-genap'
  end;
$$;

revoke all on function public.periode_survei(timestamptz) from public;
grant execute on function public.periode_survei(timestamptz)
  to anon, authenticated, service_role;

-- =====================================================================
-- Tabel
-- =====================================================================
create table if not exists public.rekomendasi_kotor (
  nama_instrumen text not null,
  periode text not null,
  ditandai_pada timestamptz not null default now(),
  primary key (nama_instrumen, periode)
);

create table if not exists public.rekomendasi_terbuka (
  nama_instrumen text not null,
  periode text not null,
  label text not null,
  prioritas text not null check (prioritas in ('Tinggi', 'Sedang', 'Pantau')),
  jumlah integer not null check (jumlah >= 0),
  porsi numeric not null check (porsi >= 0 and porsi <= 1),
  kata_kunci text[] not null default '{}',
  saran_langkah text,
  hash_masukan text,
  silhouette numeric,
  jumlah_komentar integer not null default 0,
  jumlah_unik integer not null default 0,
  jumlah_tanpa_kata integer not null default 0,
  versi_algoritma smallint not null default 1,
  dihitung_pada timestamptz not null default now(),
  primary key (nama_instrumen, periode, label)
);

create index if not exists rekomendasi_terbuka_periode_idx
  on public.rekomendasi_terbuka (periode, nama_instrumen);

alter table public.rekomendasi_kotor enable row level security;
alter table public.rekomendasi_terbuka enable row level security;
-- Tanpa policy: hanya service_role (Edge Function) yang menulis/membaca
-- langsung. Dashboard membaca lewat RPC di bawah.

-- =====================================================================
-- Penanda kotor
-- =====================================================================
create or replace function public.tandai_rekomendasi_kotor()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_instrumen text;
  v_waktu timestamptz;
begin
  if tg_op = 'DELETE' then
    v_instrumen := old.nama_instrumen;
    v_waktu := old.created_at;
  else
    v_instrumen := new.nama_instrumen;
    v_waktu := new.created_at;
  end if;

  if v_instrumen is null or v_waktu is null then
    return coalesce(new, old);
  end if;

  insert into public.rekomendasi_kotor (nama_instrumen, periode)
  values (v_instrumen, public.periode_survei(v_waktu))
  on conflict (nama_instrumen, periode) do nothing;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_rekomendasi_kotor on public.survey_responses;
create trigger trg_rekomendasi_kotor
  after insert or update or delete on public.survey_responses
  for each row execute function public.tandai_rekomendasi_kotor();

-- Tandai semua kombinasi yang sudah ada supaya hasil pertama tidak kosong.
insert into public.rekomendasi_kotor (nama_instrumen, periode)
select distinct r.nama_instrumen, public.periode_survei(r.created_at)
from public.survey_responses r
where r.nama_instrumen is not null
on conflict (nama_instrumen, periode) do nothing;

-- =====================================================================
-- Baca komentar satu kombinasi (khusus service_role)
-- =====================================================================
create or replace function public.survey_komentar_safe(
  p_instrumen text,
  p_periode text,
  p_limit integer default 1000,
  p_offset integer default 0
)
returns table (
  data_jawaban jsonb,
  created_at timestamptz,
  responden_hash text
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    public.sanitasi_data_jawaban(r.data_jawaban) as data_jawaban,
    r.created_at,
    r.responden_hash
  from public.survey_responses r
  where lower(btrim(r.nama_instrumen)) = lower(btrim(p_instrumen))
    and public.periode_survei(r.created_at) = p_periode
  order by r.created_at desc, r.id desc
  limit case
    when p_limit is null then null
    else greatest(0, least(p_limit, 1000))
  end
  offset greatest(0, p_offset);
$$;

revoke all on function public.survey_komentar_safe(text, text, integer, integer) from public;
grant execute on function public.survey_komentar_safe(text, text, integer, integer)
  to service_role;

-- =====================================================================
-- Tulis hasil satu kombinasi (ganti total, satu transaksi)
-- =====================================================================
create or replace function public.ganti_rekomendasi_terbuka(
  p_instrumen text,
  p_periode text,
  p_baris jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_jumlah integer;
begin
  delete from public.rekomendasi_terbuka
  where nama_instrumen = p_instrumen and periode = p_periode;

  insert into public.rekomendasi_terbuka (
    nama_instrumen, periode, label, prioritas, jumlah, porsi, kata_kunci,
    saran_langkah, hash_masukan, silhouette, jumlah_komentar, jumlah_unik,
    jumlah_tanpa_kata, dihitung_pada
  )
  select
    p_instrumen,
    p_periode,
    b.label,
    b.prioritas,
    b.jumlah,
    b.porsi,
    coalesce(b.kata_kunci, '{}'),
    b.saran_langkah,
    b.hash_masukan,
    b.silhouette,
    b.jumlah_komentar,
    b.jumlah_unik,
    b.jumlah_tanpa_kata,
    now()
  from jsonb_to_recordset(coalesce(p_baris, '[]'::jsonb)) as b(
    label text,
    prioritas text,
    jumlah integer,
    porsi numeric,
    kata_kunci text[],
    saran_langkah text,
    hash_masukan text,
    silhouette numeric,
    jumlah_komentar integer,
    jumlah_unik integer,
    jumlah_tanpa_kata integer
  );

  get diagnostics v_jumlah = row_count;
  return v_jumlah;
end;
$$;

revoke all on function public.ganti_rekomendasi_terbuka(text, text, jsonb) from public;
grant execute on function public.ganti_rekomendasi_terbuka(text, text, jsonb)
  to service_role;

-- =====================================================================
-- Baca rekomendasi untuk dashboard & chatbot
-- =====================================================================
create or replace function public.daftar_rekomendasi_terbuka(
  p_instrumen text default null,
  p_periode text default null
)
returns table (
  nama_instrumen text,
  periode text,
  label text,
  prioritas text,
  jumlah integer,
  porsi numeric,
  kata_kunci text[],
  saran_langkah text,
  silhouette numeric,
  jumlah_komentar integer,
  jumlah_unik integer,
  jumlah_tanpa_kata integer,
  dihitung_pada timestamptz
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    r.nama_instrumen, r.periode, r.label, r.prioritas, r.jumlah, r.porsi,
    r.kata_kunci, r.saran_langkah, r.silhouette, r.jumlah_komentar,
    r.jumlah_unik, r.jumlah_tanpa_kata, r.dihitung_pada
  from public.rekomendasi_terbuka r
  where (p_instrumen is null or lower(btrim(r.nama_instrumen)) = lower(btrim(p_instrumen)))
    and (p_periode is null or r.periode = p_periode)
  order by
    array_position(array['Tinggi', 'Sedang', 'Pantau'], r.prioritas),
    r.porsi desc,
    r.nama_instrumen;
$$;

revoke all on function public.daftar_rekomendasi_terbuka(text, text) from public;
grant execute on function public.daftar_rekomendasi_terbuka(text, text)
  to anon, authenticated;

comment on function public.daftar_rekomendasi_terbuka(text, text) is
  'Rekomendasi dari jawaban terbuka. Tidak memuat teks komentar mentah.';

-- =====================================================================
-- Penjadwalan
-- =====================================================================
-- Jalur yang dipakai sekarang: Edge Function dipanggil dari webhook-survei
-- setelah data baru tersimpan (lihat functions/webhook-survei/index.ts).
--
-- Bila ingin penjadwalan berkala, aktifkan pg_cron + pg_net lalu jalankan
-- (ganti <PROJECT_REF> dan <SERVICE_ROLE_KEY>):
--
--   select cron.schedule(
--     'hitung-rekomendasi',
--     '*/30 * * * *',
--     $$
--       select net.http_post(
--         url := 'https://<PROJECT_REF>.supabase.co/functions/v1/hitung-rekomendasi',
--         headers := jsonb_build_object(
--           'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--           'Content-Type', 'application/json'
--         ),
--         body := '{}'::jsonb
--       );
--     $$
--   );

notify pgrst, 'reload schema';
