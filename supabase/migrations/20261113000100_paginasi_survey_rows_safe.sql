-- Ganti survey_rows_safe() dengan versi berhalaman.
--
-- Dashboard sekarang membaca data dummy yang jumlahnya lebih dari batas
-- maksimum satu request PostgREST. Frontend memanggil RPC ini berulang
-- dengan p_limit/p_offset sampai halaman kosong.

drop function if exists public.survey_rows_safe();

create or replace function public.survey_rows_safe(
  p_limit integer default 1000,
  p_offset integer default 0
)
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
  order by r.created_at desc, r.id desc
  limit case
    when p_limit is null then null
    else greatest(0, least(p_limit, 1000))
  end
  offset greatest(0, p_offset);
$$;

revoke all on function public.survey_rows_safe(integer, integer) from public;
grant execute on function public.survey_rows_safe(integer, integer)
  to anon, authenticated;

comment on function public.survey_rows_safe(integer, integer) is
  'Baca baris survei berhalaman untuk dashboard tanpa email_responden dan tanpa kunci email di data_jawaban.';

notify pgrst, 'reload schema';
