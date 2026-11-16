-- Jadwal perhitungan rekomendasi jawaban terbuka.
--
-- Pemicu utama tetap webhook-survei (langsung setelah data baru tersimpan).
-- Jadwal ini adalah jaring pengaman: menyapu penanda yang tertinggal bila
-- pemicu webhook gagal, atau bila data masuk lewat jalur lain (impor/manual).
--
-- Service role key TIDAK ditulis di sini. Simpan sekali lewat Vault:
--
--   select vault.create_secret(
--     '<SERVICE_ROLE_KEY>',
--     'hitung_rekomendasi_key',
--     'Kunci service role untuk memicu Edge Function hitung-rekomendasi'
--   );
--
-- Tanpa secret itu, job tetap berjalan tetapi permintaannya ditolak (401),
-- dan tidak ada data yang rusak.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'hitung-rekomendasi',
  '*/30 * * * *',
  $job$
    select net.http_post(
      url := 'https://hgzfgxdcrvuwzprdhmjm.supabase.co/functions/v1/hitung-rekomendasi',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'hitung_rekomendasi_key'
        ),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $job$
);
