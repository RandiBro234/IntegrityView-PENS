"""Migrasi data CSV Google Forms lama ke PostgreSQL.

Contoh pemakaian (jalankan dari folder backend):
    python migrasi.py --file data/SPAK.csv --instrumen SPAK
    python migrasi.py --file data/gratifikasi.csv --instrumen Gratifikasi

Opsi:
    --email-col      Nama kolom email (default: "Email Address")
    --timestamp-col  Nama kolom timestamp (default: "Timestamp")
    --hapus-dulu     Hapus data instrumen ini sebelum insert (hindari duplikat)
    --dry-run        Uji baca CSV tanpa menulis ke database

Kredensial diambil dari environment variable (lihat db_config.py).
"""

import argparse

import pandas as pd
from psycopg2.extras import Json

from db_config import get_db_connection


def bersihkan_nilai(nilai):
    """Ubah NaN/float menjadi string bersih agar tersimpan rapi di JSONB."""
    if pd.isna(nilai):
        return ""
    if isinstance(nilai, float) and nilai.is_integer():
        return str(int(nilai))
    return str(nilai).strip()


def parse_timestamp(nilai):
    if nilai is None or pd.isna(nilai):
        return None
    try:
        return pd.to_datetime(nilai, dayfirst=True, errors="raise").to_pydatetime()
    except Exception:
        return None


def migrasi(file_csv, instrumen, email_col, timestamp_col, hapus_dulu, dry_run):
    df = pd.read_csv(file_csv)
    df.columns = [str(c).strip() for c in df.columns]

    if timestamp_col in df.columns:
        df = df.drop(columns=[timestamp_col])

    records = []
    for _, row in df.iterrows():
        data_json = {col: bersihkan_nilai(val) for col, val in row.items()}
        email = data_json.get(email_col) or None
        records.append((instrumen, email, Json(data_json)))

    print(f"Terbaca {len(records)} baris untuk instrumen '{instrumen}' dari {file_csv}.")

    if dry_run:
        print("Mode dry-run: tidak ada data yang ditulis.")
        return

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        if hapus_dulu:
            cursor.execute(
                "DELETE FROM survey_responses WHERE nama_instrumen = %s", (instrumen,)
            )
            print(f"Menghapus {cursor.rowcount} baris lama untuk '{instrumen}'.")

        query = """
            INSERT INTO survey_responses (nama_instrumen, email_responden, data_jawaban)
            VALUES (%s, %s, %s)
        """
        cursor.executemany(query, records)
        conn.commit()
        cursor.close()
    finally:
        conn.close()

    print(f"Migrasi berhasil: {len(records)} baris untuk {instrumen}.")


def main():
    parser = argparse.ArgumentParser(description="Migrasi CSV Google Forms ke PostgreSQL.")
    parser.add_argument("--file", required=True, help="Path file CSV")
    parser.add_argument("--instrumen", required=True, help="Nama instrumen, mis. SPAK / Gratifikasi")
    parser.add_argument("--email-col", default="Email Address", help="Nama kolom email")
    parser.add_argument("--timestamp-col", default="Timestamp", help="Nama kolom timestamp")
    parser.add_argument("--hapus-dulu", action="store_true", help="Hapus data instrumen sebelum insert")
    parser.add_argument("--dry-run", action="store_true", help="Uji baca tanpa menulis")
    args = parser.parse_args()

    try:
        migrasi(
            args.file,
            args.instrumen,
            args.email_col,
            args.timestamp_col,
            args.hapus_dulu,
            args.dry_run,
        )
    except Exception as e:
        print(f"Error saat migrasi: {e}")


if __name__ == "__main__":
    main()
