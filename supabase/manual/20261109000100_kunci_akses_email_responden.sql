-- SQL MANUAL penguncian akses setelah frontend memakai survey_rows_safe().
-- File ini sengaja tidak ada di supabase/migrations agar `supabase db push`
-- tidak mencabut akses tabel mentah sebelum frontend baru live.
--
-- Efek:
--   1. Anon/authenticated tidak bisa lagi SELECT tabel survey_responses.
--   2. View agregat memakai responden_hash, bukan email.
--   3. Dashboard tetap bisa membaca lewat RPC survey_rows_safe().
--   4. Chatbot/dashboard publik memakai RPC survey_aggregate() yang hanya
--      mengembalikan agregat tanpa PII.
--
-- Jalankan migrasi ini SETELAH:
--   - 20261109000000_privasi_email_responden.sql
--   - backfill responden_hash selesai
--   - frontend baru sudah deploy

drop function if exists public.survey_aggregate(text);
drop view if exists public.survey_aggregates_public;
drop view if exists public.survey_answers_normalized;

create view public.survey_answers_normalized as
with mentah as (
  select
    id,
    nama_instrumen,
    nullif(btrim(responden_hash), '') as responden_key,
    data_jawaban,
    created_at,
    case
      when extract(month from (created_at at time zone 'Asia/Jakarta')) >= 9
        then extract(year from (created_at at time zone 'Asia/Jakarta'))::int::text || '-ganjil'
      when extract(month from (created_at at time zone 'Asia/Jakarta')) <= 2
        then (extract(year from (created_at at time zone 'Asia/Jakarta'))::int - 1)::text || '-ganjil'
      else extract(year from (created_at at time zone 'Asia/Jakarta'))::int::text || '-genap'
    end as periode,
    nullif(trim(data_jawaban ->> 'Kelompok'), '') as kelompok,
    (
      select nilai
      from jsonb_each_text(data_jawaban) as t(kunci, nilai)
      where lower(t.kunci) not in ('kelompok', 'email address', 'email', 'timestamp')
        and trim(t.nilai) <> ''
        and t.nilai !~ '^-?[0-9]+(\.[0-9]+)?$'
      order by length(t.nilai) desc
      limit 1
    ) as terbuka,
    (
      select array_agg((t.nilai)::int order by t.kunci)
      from jsonb_each_text(data_jawaban) as t(kunci, nilai)
      where lower(t.kunci) not in ('kelompok', 'email address', 'email', 'timestamp')
        and trim(t.nilai) ~ '^-?[0-9]+$'
        and (t.nilai)::int between 1 and 4
    ) as items
  from public.survey_responses
),
target as (
  select * from (values
    ('spip', 9, 'spip'), ('spak', 6, 'spak'), ('spkp', 8, 'spkp'),
    ('gratifikasi', 5, 'gratifikasi'), ('benturan', 6, 'benturan'),
    ('wbs', 6, 'wbs'), ('pengaduan', 6, 'pengaduan'),
    ('budayazi', 7, 'budaya-zi'), ('pensjoss', 6, 'pens-joss'), ('5r', 7, '5r')
  ) as v(kunci, jumlah_butir, slug)
)
select
  m.id,
  m.nama_instrumen,
  t.slug as slug,
  coalesce(m.responden_key, 'row:' || m.id::text) as responden_key,
  m.periode,
  m.kelompok,
  m.terbuka,
  m.items,
  m.created_at
from mentah m
join target t on t.kunci = lower(regexp_replace(m.nama_instrumen, '[^a-zA-Z0-9]', '', 'g'))
where array_length(m.items, 1) = t.jumlah_butir;

create view public.survey_aggregates_public as
with dedup as (
  select distinct on (slug, responden_key, periode)
    slug,
    nama_instrumen,
    responden_key,
    periode,
    kelompok,
    items,
    created_at
  from public.survey_answers_normalized
  order by slug, responden_key, periode, created_at desc
),
per_butir as (
  select
    s.slug, s.nama_instrumen, s.periode,
    idx.i as butir_ke,
    count(*) as n,
    avg(s.items[idx.i]) as rata,
    count(*) filter (where s.items[idx.i] >= 3) as setuju
  from dedup s
  cross join lateral generate_subscripts(s.items, 1) as idx(i)
  group by s.slug, s.nama_instrumen, s.periode, idx.i
),
ringkas as (
  select
    slug,
    nama_instrumen,
    periode,
    count(*) as n,
    avg((select avg(v) from unnest(items) as v) / 4.0 * 100) as indeks,
    stddev_samp((select avg(v) from unnest(items) as v) / 4.0 * 100) as sd,
    percentile_cont(0.5) within group (
      order by (select avg(v) from unnest(items) as v) / 4.0 * 100
    ) as median,
    count(*) filter (where (select count(distinct v) from unnest(items) as v) = 1) as seragam,
    count(*) filter (where kelompok = 'Dosen') as n_dosen,
    count(*) filter (where kelompok = 'Tenaga Kependidikan') as n_tendik,
    min(created_at) as pertama,
    max(created_at) as terakhir
  from dedup
  group by slug, nama_instrumen, periode
)
select
  r.slug,
  r.nama_instrumen,
  r.periode,
  r.n,
  round(r.indeks::numeric, 2) as indeks,
  round(r.sd::numeric, 3) as sd,
  round(r.median::numeric, 2) as median,
  r.seragam,
  r.n_dosen,
  r.n_tendik,
  r.pertama,
  r.terakhir,
  (
    select jsonb_agg(jsonb_build_object(
      'butir_ke', p.butir_ke,
      'n', p.n,
      'rata', round(p.rata::numeric, 3),
      'setuju', p.setuju
    ) order by p.butir_ke)
    from per_butir p
    where p.slug = r.slug and p.periode = r.periode
  ) as butir
from ringkas r;

create or replace function public.survey_aggregate(p_periode text default null)
returns setof public.survey_aggregates_public
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select *
  from public.survey_aggregates_public
  where p_periode is null or periode = p_periode;
$$;

-- Tabel mentah hanya untuk service_role. Anon/authenticated memakai RPC
-- survey_rows_safe() atau survey_aggregate().
revoke all on public.survey_responses from anon, authenticated;
drop policy if exists "baca publik survey_responses" on public.survey_responses;

revoke all on public.survey_answers_normalized from public, anon, authenticated;
revoke all on public.survey_aggregates_public from public, anon, authenticated;
grant select on public.survey_answers_normalized to service_role;
grant select on public.survey_aggregates_public to service_role;

revoke all on function public.survey_aggregate(text) from public;
grant execute on function public.survey_aggregate(text) to anon, authenticated;

comment on view public.survey_aggregates_public is
  'Agregat dashboard tanpa email, nama, NIP, atau jawaban terbuka mentah.';
comment on function public.survey_aggregate(text) is
  'RPC agregat dashboard untuk chatbot; tidak mengembalikan PII.';
