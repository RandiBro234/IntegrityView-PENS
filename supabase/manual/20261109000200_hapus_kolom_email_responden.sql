-- SQL MANUAL: hapus kolom email_responden setelah backfill diverifikasi.
--
-- JANGAN jalankan sebelum:
--   1. 20261109000000_privasi_email_responden.sql diterapkan.
--   2. scripts/backfill-responden-hash.mjs selesai (idealnya HAPUS_EMAIL=true).
--   3. Jumlah responden dashboard sebelum/sesudah sama.
--   4. Backup database tersedia.
--
-- File ini sengaja tidak ada di supabase/migrations agar tidak ikut
-- `supabase db push`.

-- Cek sisa email yang belum di-hash/kosong.
select count(*) as sisa_email
from public.survey_responses
where email_responden is not null
  and btrim(email_responden) <> '';

-- Setelah aman:
-- alter table public.survey_responses
--   drop column if exists email_responden;
