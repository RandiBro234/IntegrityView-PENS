-- Migrasi ADDITIVE untuk IntegrityView (Supabase PRODUCTION).
-- TIDAK mengubah, menghapus, atau me-rename kolom/tabel, dan tidak
-- menjalankan UPDATE/DELETE pada data. Tinjau dulu sebelum dijalankan.
--
-- Tujuan:
--   1. Index untuk query per instrumen + waktu.
--   2. View agregat per (instrumen, periode) agar dashboard publik tidak
--      perlu membaca baris mentah (termasuk email_responden).
--   3. RPC agregat dengan security definer.
--
-- Catatan penting:
--   * Bentuk data_jawaban saat ini: objek { "Kelompok", "Email Address",
--     "<butir 1>": "3", ..., "<pertanyaan terbuka>": "teks" }.
--   * Normalisasi butir di SQL memakai urutan kunci numerik (jsonb_each_text)
--     dan hanya menerima nilai bilangan bulat 1-4.
--   * Definisi butir resmi ada di frontend (src/data/instrumentConfig.js).
--     View ini menghitung butir secara generik berdasarkan jumlah nilai valid.

-- ============ 1. INDEX (additive) ============
create index if not exists idx_survey_responses_instrumen_created
  on public.survey_responses (nama_instrumen, created_at);

-- ============ 2. VIEW BARIS TERNORMALISASI ============
-- Hanya baris valid: semua nilai numerik 1-4, dan jumlahnya sama dengan
-- jumlah butir yang diharapkan untuk instrumen tersebut.
create or replace view public.survey_answers_normalized
with (security_invoker = true) as
with mentah as (
  select
    id,
    nama_instrumen,
    nullif(lower(trim(email_responden)), '') as email,
    data_jawaban,
    created_at,
    -- Periode akademik berdasarkan WIB (Asia/Jakarta)
    case
      when extract(month from (created_at at time zone 'Asia/Jakarta')) >= 9
        then extract(year from (created_at at time zone 'Asia/Jakarta'))::int::text || '-ganjil'
      when extract(month from (created_at at time zone 'Asia/Jakarta')) <= 2
        then (extract(year from (created_at at time zone 'Asia/Jakarta'))::int - 1)::text || '-ganjil'
      else extract(year from (created_at at time zone 'Asia/Jakarta'))::int::text || '-genap'
    end as periode,
    -- Kelompok responden (jika ada)
    nullif(trim(data_jawaban ->> 'Kelompok'), '') as kelompok,
    -- Pertanyaan terbuka: nilai non-numerik terpanjang
    (
      select nilai
      from jsonb_each_text(data_jawaban) as t(kunci, nilai)
      where lower(t.kunci) not in ('kelompok', 'email address', 'email', 'timestamp')
        and trim(t.nilai) <> ''
        and t.nilai !~ '^-?[0-9]+(\.[0-9]+)?$'
      order by length(t.nilai) desc
      limit 1
    ) as terbuka,
    -- Nilai butir numerik sesuai urutan kunci
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
  -- Jumlah butir resmi per instrumen (samakan dengan instrumentConfig.js)
  select * from (values
    ('spip', 9), ('spak', 6), ('spkp', 8), ('gratifikasi', 5), ('benturan', 6),
    ('wbs', 6), ('pengaduan', 6), ('budaya-zi', 7), ('pens-joss', 6), ('5r', 7)
  ) as v(slug, jumlah_butir)
)
select
  m.id,
  m.nama_instrumen,
  m.email,
  m.periode,
  m.kelompok,
  m.terbuka,
  m.items,
  m.created_at
from mentah m
join target t on t.slug = lower(regexp_replace(m.nama_instrumen, '[^a-zA-Z0-9]', '', 'g'))
where array_length(m.items, 1) = t.jumlah_butir;

-- ============ 3. VIEW AGREGAT PUBLIK ============
-- Satu baris per (instrumen, periode). Tidak memuat email atau teks terbuka.
create or replace view public.survey_aggregates_public
with (security_invoker = true) as
with dedup as (
  select distinct on (slug_key, email, periode)
    lower(regexp_replace(nama_instrumen, '[^a-zA-Z0-9]', '', 'g')) as slug_key,
    nama_instrumen,
    email,
    periode,
    kelompok,
    items,
    created_at
  from public.survey_answers_normalized
  where email is not null
  order by slug_key, email, periode, created_at desc
),
tanpa_email as (
  select
    lower(regexp_replace(nama_instrumen, '[^a-zA-Z0-9]', '', 'g')) as slug_key,
    nama_instrumen, email, periode, kelompok, items, created_at
  from public.survey_answers_normalized
  where email is null
),
semua as (
  select * from dedup
  union all
  select * from tanpa_email
),
per_butir as (
  select
    s.slug_key, s.nama_instrumen, s.periode,
    idx.i as butir_ke,
    count(*) as n,
    avg(s.items[idx.i]) as rata,
    count(*) filter (where s.items[idx.i] >= 3) as setuju
  from semua s
  cross join lateral generate_subscripts(s.items, 1) as idx(i)
  group by s.slug_key, s.nama_instrumen, s.periode, idx.i
),
ringkas as (
  select
    slug_key,
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
  from semua
  group by slug_key, nama_instrumen, periode
)
select
  r.slug_key,
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
    where p.slug_key = r.slug_key and p.periode = r.periode
  ) as butir
from ringkas r;

-- ============ 4. RPC AGREGAT ============
create or replace function public.survey_aggregate(p_periode text default null)
returns setof public.survey_aggregates_public
language sql
security definer
set search_path = public
as $$
  select *
  from public.survey_aggregates_public
  where p_periode is null or periode = p_periode;
$$;

revoke all on function public.survey_aggregate(text) from public;
grant execute on function public.survey_aggregate(text) to anon, authenticated;

-- ============ 5. TEMUAN RLS (TIDAK DITERAPKAN OTOMATIS) ============
-- Saat ini anon dapat membaca baris mentah survey_responses (termasuk
-- email_responden). Perbaikan yang diusulkan, jalankan hanya setelah
-- frontend memakai RPC di atas:
--
--   revoke select on public.survey_responses from anon, authenticated;
--   grant select on public.survey_aggregates_public to anon, authenticated;
--
-- Baris mentah dan jawaban terbuka sebaiknya hanya untuk role admin:
--
--   create policy "admin baca baris mentah" on public.survey_responses
--     for select to authenticated
--     using (exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.role = 'admin'
--     ));
