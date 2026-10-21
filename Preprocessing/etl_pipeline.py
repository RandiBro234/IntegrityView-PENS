"""
INTEGRITY VIEW - Pipeline ETL & Spam Filter
===========================================
Alur:  Google Form -> (Google Sheets API / Excel / CSV) -> Standardisasi kolom
       -> Cleaning (missing value) -> Spam filter (durasi, duplikat, straight-lining)
       -> UPSERT ke database -> log eksekusi

Penggunaan:
    python etl_pipeline.py            # jalan terus, tiap ETL_INTERVAL_MINUTES (default 5)
    python etl_pipeline.py --once     # satu kali eksekusi (cocok untuk cron / Task Scheduler)
    python etl_pipeline.py --once --indicator IND01
"""
from __future__ import annotations

import argparse
import hashlib
import logging
import re
import sys
import threading
import time
from datetime import datetime

import numpy as np
import pandas as pd

import config
import database as db

logger = logging.getLogger("integrityview.etl")
_RUN_LOCK = threading.Lock()

FLAG_LABELS = {
    "flag_missing": "Data kosong > {:.0%}".format(config.MAX_MISSING_RATIO),
    "flag_too_fast": f"Durasi < {config.MIN_DURATION_SECONDS} detik",
    "flag_duplicate": "Email ganda (bukan respons terbaru)",
    "flag_straightline": "Straight-lining (jawaban seragam)",
}


# ===========================================================================
# 1. EXTRACT
# ===========================================================================
def _fetch_excel(source: dict) -> pd.DataFrame:
    return pd.read_excel(source["path"], sheet_name=source.get("sheet", 0))


def _fetch_csv_url(source: dict) -> pd.DataFrame:
    return pd.read_csv(source["url"])


def _fetch_gsheet(source: dict) -> pd.DataFrame:
    """Ambil data langsung dari Google Sheets (hasil G-Form) memakai service account."""
    import gspread  # import lokal: hanya dibutuhkan jika sumber gsheet dipakai

    gc = gspread.service_account(filename=config.GOOGLE_CREDENTIALS_FILE)
    sh = gc.open_by_key(source["sheet_id"])
    ws = sh.worksheet(source.get("worksheet", "Form Responses 1"))
    values = ws.get_all_values(
        value_render_option="UNFORMATTED_VALUE",
        date_time_render_option="SERIAL_NUMBER",
    )
    if not values:
        return pd.DataFrame()
    header, rows = values[0], values[1:]
    return pd.DataFrame(rows, columns=header)


FETCHERS = {"excel": _fetch_excel, "csv_url": _fetch_csv_url, "gsheet": _fetch_gsheet}


def fetch_data_from_gform(indicator_cfg: dict) -> pd.DataFrame:
    source = indicator_cfg["source"]
    fetcher = FETCHERS.get(source["type"])
    if fetcher is None:
        raise ValueError(f"Tipe sumber tidak dikenal: {source['type']}")
    df = fetcher(source)
    df.columns = [str(c) for c in df.columns]
    return df


# ===========================================================================
# 2. TRANSFORM - standardisasi kolom
# ===========================================================================
TIMESTAMP_KEYS = ("timestamp", "stempel waktu", "cap waktu", "submitted_at")
EMAIL_KEYS = ("email address", "alamat email", "email", "e-mail")
GROUP_KEYS = ("kelompok", "role", "peran", "kategori responden", "status pegawai")
START_KEYS = ("start_time", "start time", "waktu mulai", "waktu buka")


def _norm(text) -> str:
    return re.sub(r"\s+", " ", str(text)).strip().lower()


def _to_score(series: pd.Series) -> pd.Series:
    """Ubah jawaban Likert (angka / '4 - Sangat Setuju' / 'Sangat Setuju') menjadi float."""
    num = pd.to_numeric(series, errors="coerce")
    need = num.isna() & series.notna() & (series.astype(str).str.strip() != "")
    if need.any():
        txt = series[need].astype(str)
        lead = pd.to_numeric(txt.str.extract(r"^\s*(\d+)")[0], errors="coerce")
        mapped = txt.map(lambda s: config.LIKERT_TEXT_MAP.get(_norm(s)))
        num.loc[need] = lead.fillna(pd.to_numeric(mapped, errors="coerce"))
    num = num.where(num.between(config.LIKERT_MIN, config.LIKERT_MAX))
    return num.astype(float)


def _parse_datetime(series: pd.Series) -> pd.Series:
    if pd.api.types.is_datetime64_any_dtype(series):
        return pd.to_datetime(series)
    num = pd.to_numeric(series, errors="coerce")
    if num.notna().mean() > 0.9:  # serial number Google Sheets
        return pd.to_datetime(num, unit="D", origin="1899-12-30")
    return pd.to_datetime(series, errors="coerce", dayfirst=config.DATE_DAYFIRST)


def detect_columns(df: pd.DataFrame) -> dict:
    """Deteksi kolom metadata, butir Likert, dan kolom teks terbuka secara otomatis."""
    cols = list(df.columns)

    def find(keys):
        for c in cols:
            n = _norm(c)
            if any(n == k or n.startswith(k) for k in keys):
                return c
        return None

    mapping = {
        "timestamp": find(TIMESTAMP_KEYS),
        "email": find(EMAIL_KEYS),
        "group": find(GROUP_KEYS),
        "start": find(START_KEYS),
    }
    meta = {v for v in mapping.values() if v is not None}
    items, texts = [], []
    for c in cols:
        if c in meta:
            continue
        raw = df[c]
        nonblank = raw[raw.notna() & (raw.astype(str).str.strip() != "")]
        if nonblank.empty:
            continue
        scores = _to_score(nonblank)
        if scores.notna().mean() >= 0.9:
            items.append(c)
        else:
            texts.append(c)
    mapping["items"] = items
    mapping["texts"] = texts
    return mapping


def _make_response_id(indicator_code: str, email: str, ts: pd.Timestamp, answers: str) -> str:
    key = f"{indicator_code}|{email}|{ts.isoformat() if pd.notna(ts) else ''}|{answers}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()


def standardize_columns(raw: pd.DataFrame, indicator_code: str, cfg: dict):
    """Ubah kolom G-Form (pertanyaan panjang) menjadi kode standar, mis. Q1_Antikorupsi."""
    m = detect_columns(raw)
    if m["timestamp"] is None:
        raise ValueError("Kolom Timestamp tidak ditemukan pada sumber data.")
    if not m["items"]:
        raise ValueError("Tidak ada kolom butir Likert yang terdeteksi.")

    out = pd.DataFrame(index=raw.index)
    out["submitted_at"] = _parse_datetime(raw[m["timestamp"]])
    out["start_time"] = _parse_datetime(raw[m["start"]]) if m["start"] else pd.NaT
    out["email"] = (raw[m["email"]].fillna("").astype(str).str.strip().str.lower()
                    if m["email"] else "")
    if m["group"]:
        grp = raw[m["group"]].fillna("").astype(str).str.strip()
        out["kelompok"] = grp.map(lambda g: config.GROUP_ALIASES.get(g.lower(), g) or "Tidak Diketahui")
    else:
        out["kelompok"] = "Tidak Diketahui"
    if m["texts"]:
        out["feedback"] = (raw[m["texts"]].fillna("").astype(str)
                           .apply(lambda r: " | ".join(s.strip() for s in r if s.strip()), axis=1))
    else:
        out["feedback"] = ""

    labels = cfg.get("items") or []
    if labels and len(labels) != len(m["items"]):
        logger.warning("%s: jumlah butir terdeteksi (%d) berbeda dengan konfigurasi (%d)",
                       indicator_code, len(m["items"]), len(labels))
    item_meta = []
    for i, col in enumerate(m["items"], start=1):
        code = f"Q{i}_{cfg['slug']}"
        out[code] = _to_score(raw[col])
        short = labels[i - 1][0] if i <= len(labels) else (col.strip()[:40] + ("…" if len(col.strip()) > 40 else ""))
        item_meta.append({
            "item_code": code, "indicator_code": indicator_code, "item_order": i,
            "short_label": short, "question_text": col.strip(),
        })
    item_codes = [it["item_code"] for it in item_meta]

    out = out[out["submitted_at"].notna()].copy()  # buang baris kosong dari sheet
    out["indicator_code"] = indicator_code
    ans_str = out[item_codes].astype(str).agg(",".join, axis=1)
    out["response_id"] = [
        _make_response_id(indicator_code, e, t, a)
        for e, t, a in zip(out["email"], out["submitted_at"], ans_str)
    ]
    out = out.drop_duplicates("response_id").reset_index(drop=True)
    return out, item_meta


# ===========================================================================
# 3. TRANSFORM - cleaning & spam filter
# ===========================================================================
def preprocess_and_filter_spam(df: pd.DataFrame, item_codes: list[str]) -> pd.DataFrame:
    """
    Menandai (bukan menghapus) setiap respons dengan flag kualitas data, sehingga
    jejak audit tetap tersimpan di DB dan dashboard bisa memilih kebijakan filter.
    Kolom `is_valid` = respons yang dipakai untuk perhitungan.
    """
    if df.empty:
        for c in FLAG_LABELS:
            df[c] = pd.Series(dtype=bool)
        df["is_valid"] = pd.Series(dtype=bool)
        return df

    df = df.sort_values("submitted_at").reset_index(drop=True).copy()
    answers = df[item_codes]

    # --- Missing values: drop (>20%) atau imputasi median ---------------------
    df["missing_ratio"] = answers.isna().mean(axis=1)
    df["flag_missing"] = df["missing_ratio"] > config.MAX_MISSING_RATIO
    df["n_imputed"] = 0
    ok = ~df["flag_missing"]
    if answers.loc[ok].isna().any().any():
        medians = answers.loc[ok].median()
        imputed = answers.loc[ok].fillna(np.floor(medians + 0.5))
        df.loc[ok, "n_imputed"] = answers.loc[ok].isna().sum(axis=1).astype(int)
        df.loc[ok, item_codes] = imputed

    # --- Duration check (hanya jika sumber menyediakan waktu mulai) -----------
    if "start_time" in df and df["start_time"].notna().any():
        df["duration_seconds"] = (df["submitted_at"] - df["start_time"]).dt.total_seconds()
        df["flag_too_fast"] = df["duration_seconds"].lt(config.MIN_DURATION_SECONDS).fillna(False)
    else:
        df["duration_seconds"] = np.nan
        df["flag_too_fast"] = False

    # --- Variance check (straight-lining) ------------------------------------
    df["answer_std"] = df[item_codes].std(axis=1, ddof=0)
    enough = df[item_codes].notna().sum(axis=1) >= config.MIN_ITEMS_FOR_STRAIGHTLINE
    df["flag_straightline"] = (df["answer_std"] == 0) & enough

    # --- Duplicate check (email sama -> simpan respons terbaru) ---------------
    key = ["email"]
    if config.DUPLICATE_SCOPE == "daily":
        df["_day"] = df["submitted_at"].dt.date
        key.append("_day")
    has_email = df["email"].astype(str).str.len() > 0
    candidates = df[has_email & ~df["flag_missing"]]
    dup = candidates.duplicated(subset=key, keep=config.DUPLICATE_KEEP)
    df["flag_duplicate"] = False
    df.loc[dup[dup].index, "flag_duplicate"] = True
    df = df.drop(columns=["_day"], errors="ignore")

    # --- Keputusan akhir ------------------------------------------------------
    invalid = df["flag_missing"] | df["flag_too_fast"] | df["flag_duplicate"]
    if config.STRAIGHTLINE_POLICY == "drop":
        invalid |= df["flag_straightline"]
    df["is_valid"] = ~invalid
    df["flag_reasons"] = df[list(FLAG_LABELS)].apply(
        lambda r: "; ".join(FLAG_LABELS[c] for c, v in r.items() if v), axis=1)

    for c in list(FLAG_LABELS) + ["is_valid"]:
        df[c] = df[c].astype(bool)
    return df


# ===========================================================================
# 4. LOAD
# ===========================================================================
RESPONSE_COLS = [c.name for c in db.responses_t.columns]


def save_to_db(engine, indicator_code: str, cfg: dict, df: pd.DataFrame, item_meta: list[dict]):
    now = datetime.now()
    source = cfg["source"]
    db.upsert(engine, db.indicators_t, [{
        "indicator_code": indicator_code, "number": cfg["number"], "name": cfg["name"],
        "slug": cfg["slug"], "n_items": len(item_meta), "source_type": source["type"],
        "source_ref": str(source.get("path") or source.get("sheet_id") or source.get("url")),
        "updated_at": now,
    }])
    db.upsert(engine, db.items_t, item_meta)
    db.delete_stale_items(engine, indicator_code, [it["item_code"] for it in item_meta])

    df = df.copy()
    df["ingested_at"] = now
    df["updated_at"] = now
    inserted = db.upsert(engine, db.responses_t, db.df_to_records(df, RESPONSE_COLS),
                         preserve=("ingested_at",))

    item_codes = [it["item_code"] for it in item_meta]
    long = df.melt(id_vars="response_id", value_vars=item_codes,
                   var_name="item_code", value_name="score")
    db.upsert(engine, db.answers_t, db.df_to_records(long, ["response_id", "item_code", "score"]))

    deleted = 0
    if config.SYNC_DELETE_MISSING:
        stale = db.existing_response_ids(engine, indicator_code) - set(df["response_id"])
        deleted = db.delete_responses(engine, stale)
    return inserted, deleted


# ===========================================================================
# 5. ORKESTRASI
# ===========================================================================
def run_indicator(engine, indicator_code: str, cfg: dict) -> dict:
    started = datetime.now()
    record = {"run_started": started, "indicator_code": indicator_code}
    try:
        raw = fetch_data_from_gform(cfg)
        std, item_meta = standardize_columns(raw, indicator_code, cfg)
        item_codes = [it["item_code"] for it in item_meta]
        clean = preprocess_and_filter_spam(std, item_codes)
        inserted, deleted = save_to_db(engine, indicator_code, cfg, clean, item_meta)
        record.update(
            status="SUCCESS", rows_raw=len(clean), rows_valid=int(clean["is_valid"].sum()),
            n_missing=int(clean["flag_missing"].sum()), n_too_fast=int(clean["flag_too_fast"].sum()),
            n_duplicate=int(clean["flag_duplicate"].sum()),
            n_straightline=int(clean["flag_straightline"].sum()),
            n_inserted=inserted, n_deleted=deleted,
            message=f"{len(item_codes)} butir; sumber={cfg['source']['type']}",
        )
        logger.info("%s | raw=%d valid=%d dup=%d straight=%d deleted=%d", indicator_code,
                    record["rows_raw"], record["rows_valid"], record["n_duplicate"],
                    record["n_straightline"], deleted)
    except Exception as exc:  # noqa: BLE001 - satu indikator gagal tidak menghentikan lainnya
        logger.exception("%s gagal diproses", indicator_code)
        record.update(status="FAILED", message=f"{type(exc).__name__}: {exc}")
    record["run_finished"] = datetime.now()
    db.log_etl_run(engine, record)
    return record


def job(indicator_codes: list[str] | None = None) -> list[dict]:
    """Satu siklus ETL untuk semua (atau sebagian) indikator. Thread-safe."""
    if not _RUN_LOCK.acquire(blocking=False):
        logger.info("ETL sedang berjalan, siklus ini dilewati.")
        return []
    try:
        logger.info("Menjalankan ETL ...")
        engine = db.get_engine()
        indicators = config.get_indicators()
        results = []
        for code, cfg in indicators.items():
            if indicator_codes and code not in indicator_codes:
                continue
            results.append(run_indicator(engine, code, cfg))
        return results
    finally:
        _RUN_LOCK.release()


def _setup_logging():
    log_dir = config.DATA_DIR / "logs"
    log_dir.mkdir(exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout),
                  logging.FileHandler(log_dir / "etl.log", encoding="utf-8")],
    )


def main():
    parser = argparse.ArgumentParser(description="Integrity View ETL pipeline")
    parser.add_argument("--once", action="store_true", help="Jalankan satu kali lalu keluar")
    parser.add_argument("--indicator", nargs="*", help="Kode indikator tertentu, mis. IND01")
    parser.add_argument("--interval", type=int, default=config.ETL_INTERVAL_MINUTES,
                        help="Interval menit (default dari config)")
    args = parser.parse_args()
    _setup_logging()

    if args.once:
        results = job(args.indicator)
        sys.exit(0 if all(r["status"] == "SUCCESS" for r in results) else 1)

    import schedule

    job(args.indicator)  # langsung jalan saat start
    schedule.every(args.interval).minutes.do(job, args.indicator)
    logger.info("Scheduler aktif: ETL tiap %d menit. Tekan Ctrl+C untuk berhenti.", args.interval)
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Scheduler dihentikan.")


if __name__ == "__main__":
    main()
