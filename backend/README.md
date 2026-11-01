# Backend IntegrityView

> **Produksi memakai Supabase**, bukan folder ini. Alur aktif:
> Google Form → Apps Script (`supabase/apps_script_webhook.js`) → Edge Function
> (`supabase/functions/webhook-survei`) → tabel `survey_responses`.
> Frontend membaca data langsung dari Supabase (`frontend/src/data/api.js`).

Folder `backend/` berisi API FastAPI opsional untuk pengembangan lokal dan
script operasional (migrasi CSV, setup PostgreSQL lokal). Jangan menaruh
kredensial di kode; gunakan `backend/.env`.

## Struktur

```
backend/
  main.py                  shim: uvicorn main:app
  app/
    main.py                create_app() + registrasi router
    config.py              env, DB_CONFIG, CORS
    db.py                  koneksi + context manager cursor
    schemas.py             model request/response (Pydantic)
    routers/               endpoint HTTP
      health.py            GET /
      webhook.py           POST /api/webhook/survei
      survei.py            GET /api/survei
      instrumen.py         GET /api/instrumen
    services/              logika bisnis
      survey_service.py    validasi + orkestrasi
      email.py             ekstraksi email responden
    repositories/
      survey_repository.py query tabel survey_responses
  scripts/
    migrasi.py             impor CSV ke PostgreSQL
    setup_db.py            buat DB lokal + schema.sql
  schema.sql               schema PostgreSQL lokal (Supabase: supabase/schema.sql)
```

## Menjalankan

Dari folder `backend`:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Cek: `GET http://localhost:8000/` → `{"status":"ok",...}`.

## Migrasi CSV

```bash
python scripts/migrasi.py --file data/SPAK.csv --instrumen SPAK
python scripts/migrasi.py --file data/gratifikasi.csv --instrumen Gratifikasi
```

Gunakan `--dry-run` untuk uji baca, `--hapus-dulu` untuk menghindari duplikat.
Shim lama `python migrasi.py` tetap berfungsi.

## Setup PostgreSQL lokal

```bash
python scripts/setup_db.py
```

Untuk Supabase, jalankan `supabase/schema.sql` lewat SQL Editor dashboard.

## Catatan

- File CSV berisi data pribadi dan tidak di-track git (`backend/data/*.csv`).
- `backend/.env` tidak di-track; hanya `.env.example` yang boleh di-commit.
- `backend/apps_script_webhook.js` sudah dihapus; versi aktif ada di
  `supabase/apps_script_webhook.js`.
