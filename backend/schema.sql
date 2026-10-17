-- Skema IntegrityView (single-table + JSONB)
-- Jalankan setelah database integrity_view_db dibuat:
--   psql -U postgres -d integrity_view_db -f schema.sql

CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    nama_instrumen VARCHAR(50) NOT NULL,
    email_responden VARCHAR(100),
    data_jawaban JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks agar filter per instrumen dan urutan waktu tetap cepat.
CREATE INDEX IF NOT EXISTS idx_survey_responses_instrumen
    ON survey_responses (nama_instrumen);

CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at
    ON survey_responses (created_at DESC);
