-- Migrasi ADDITIVE untuk privasi email responden survei.
--
-- Tujuan:
--   1. Menambah responden_hash (HMAC-SHA256 email) untuk deduplikasi.
--   2. Menyediakan fungsi sanitasi yang membuang kunci email dari
--      data_jawaban.
--   3. Menyediakan RPC survey_rows_safe() sebagai jalur baca dashboard.
--
-- Migrasi ini sengaja BELUM mencabut akses SELECT tabel mentah agar
-- dashboard lama tidak langsung mati. Urutan deploy yang disarankan:
--   1. Jalankan migrasi ini.
--   2. Jalankan scripts/backfill-responden-hash.mjs.
--   3. Deploy frontend yang memakai survey_rows_safe().
--   4. Jalankan supabase/manual/20261109000100_kunci_akses_email_responden.sql
--      secara manual (jangan lewat db push sebelum frontend baru live).
--
-- Setelah backfill selesai, email_responden boleh dikosongkan lalu dihapus
-- pada migrasi terpisah. Jangan jalankan DROP sebelum backfill diverifikasi.

alter table public.survey_responses
  add column if not exists responden_hash text;

alter table public.survey_responses
  add column if not exists hash_version smallint not null default 1;

create index if not exists idx_survey_responses_responden_hash
  on public.survey_responses (responden_hash, nama_instrumen, created_at desc);

comment on column public.survey_responses.responden_hash is
  'HMAC-SHA256 dari email responden yang dinormalisasi. Email asli tidak disimpan.';

create or replace function public.sanitasi_data_jawaban(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when jsonb_typeof(coalesce(p_data, '{}'::jsonb)) <> 'object' then '{}'::jsonb
    else coalesce((
      select jsonb_object_agg(entry.key, entry.value)
      from jsonb_each(coalesce(p_data, '{}'::jsonb)) as entry
      where lower(btrim(entry.key)) not in (
        'email', 'email address', 'alamat email', 'email responden',
        'surel', 'respondent email', '__respondent_email'
      )
        and lower(btrim(entry.key)) not like '%email%'
    ), '{}'::jsonb)
  end;
$$;

revoke all on function public.sanitasi_data_jawaban(jsonb)
  from public, anon, authenticated;
grant execute on function public.sanitasi_data_jawaban(jsonb) to service_role;

create or replace function public.survey_rows_safe()
returns table (
  id bigint,
  nama_instrumen text,
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
    r.id,
    r.nama_instrumen,
    public.sanitasi_data_jawaban(r.data_jawaban) as data_jawaban,
    r.created_at,
    r.responden_hash
  from public.survey_responses r
  order by r.created_at desc;
$$;

revoke all on function public.survey_rows_safe() from public;
grant execute on function public.survey_rows_safe() to anon, authenticated;

comment on function public.survey_rows_safe() is
  'Baca baris survei untuk dashboard tanpa email_responden dan tanpa kunci email di data_jawaban.';
