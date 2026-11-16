-- Judul rekomendasi jawaban terbuka.
--
-- Sebelumnya judul dibentuk dari daftar kata kunci ("Dipertahankan, prosedur"),
-- yang tidak menjelaskan masalah. Sekarang model bahasa menghasilkan judul yang
-- menyebut aspek dan masalahnya, disimpan di kolom `judul`.
--
-- Kolom ini boleh kosong: baris lama tetap terbaca, dan frontend memakai judul
-- cadangan bila kosong.

alter table public.rekomendasi_terbuka
  add column if not exists judul text;

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
    nama_instrumen, periode, label, judul, prioritas, jumlah, porsi, kata_kunci,
    saran_langkah, hash_masukan, silhouette, jumlah_komentar, jumlah_unik,
    jumlah_tanpa_kata, dihitung_pada
  )
  select
    p_instrumen,
    p_periode,
    b.label,
    b.judul,
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
    judul text,
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

-- Tipe hasil berubah (menambah `judul`), jadi function lama harus dibuang.
drop function if exists public.daftar_rekomendasi_terbuka(text, text);

create function public.daftar_rekomendasi_terbuka(
  p_instrumen text default null,
  p_periode text default null
)
returns table (
  nama_instrumen text,
  periode text,
  label text,
  judul text,
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
    r.nama_instrumen, r.periode, r.label, r.judul, r.prioritas, r.jumlah, r.porsi,
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

notify pgrst, 'reload schema';
