-- Skema IntegrityView untuk PostgreSQL LOKAL (single-table + JSONB).
-- Produksi/Supabase memakai supabase/schema.sql (termasuk RLS).
-- Jalankan setelah database integrity_view_db dibuat:
--   psql -U postgres -d integrity_view_db -f schema.sql

CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    nama_instrumen VARCHAR(50) NOT NULL,
    responden_hash VARCHAR(64),
    sumber_data VARCHAR(10) NOT NULL DEFAULT 'asli'
        CHECK (sumber_data IN ('asli', 'dummy')),
    data_jawaban JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks agar filter per instrumen dan urutan waktu tetap cepat.
CREATE INDEX IF NOT EXISTS idx_survey_responses_instrumen
    ON survey_responses (nama_instrumen);

CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at
    ON survey_responses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_responden_hash
    ON survey_responses (responden_hash);

CREATE INDEX IF NOT EXISTS idx_survey_responses_sumber_data
    ON survey_responses (sumber_data, nama_instrumen, created_at DESC);
