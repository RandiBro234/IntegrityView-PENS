"""
INTEGRITY VIEW - Konfigurasi Terpusat
=====================================
Semua parameter yang mungkin perlu diubah (sumber data, database, aturan spam,
skala Likert, target indeks, dan daftar indikator) dikumpulkan di file ini.

Nilai-nilai sensitif / spesifik lingkungan (DATABASE_URL, kredensial Google)
dapat dioverride melalui file `.env` (lihat `.env.example`).
"""
from __future__ import annotations

import os
import re
from pathlib import Path

try:  # python-dotenv bersifat opsional
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
DATA_DIR.mkdir(exist_ok=True)

if load_dotenv:
    load_dotenv(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# 1. INFRASTRUKTUR
# ---------------------------------------------------------------------------
# Default: SQLite lokal (tanpa instalasi). Untuk produksi gunakan PostgreSQL/MySQL:
#   postgresql+psycopg2://user:pass@localhost:5432/integrityview
#   mysql+pymysql://user:pass@localhost:3306/integrityview
DATABASE_URL = os.getenv(
    "DATABASE_URL", f"sqlite:///{(DATA_DIR / 'integrityview.db').as_posix()}"
)

# Service-account JSON untuk Google Sheets API (gspread)
GOOGLE_CREDENTIALS_FILE = os.getenv(
    "GOOGLE_CREDENTIALS_FILE", str(BASE_DIR / "credentials" / "service_account.json")
)

ETL_INTERVAL_MINUTES = int(os.getenv("ETL_INTERVAL_MINUTES", "5"))
DASHBOARD_REFRESH_SECONDS = int(os.getenv("DASHBOARD_REFRESH_SECONDS", "300"))
# Jika True, dashboard otomatis menjalankan ETL bila data lebih tua dari interval
# (berguna bila scheduler terpisah tidak dijalankan).
AUTO_ETL_IN_DASHBOARD = os.getenv("AUTO_ETL_IN_DASHBOARD", "true").lower() == "true"
# Hapus dari DB respons yang sudah tidak ada lagi di sumber (sinkronisasi penuh)
SYNC_DELETE_MISSING = True
# Format tanggal sumber berbentuk teks (CSV publik / G-Sheet locale Indonesia)
DATE_DAYFIRST = True

INSTITUTION_NAME = os.getenv("INSTITUTION_NAME", "Politeknik Elektronika Negeri Surabaya")
APP_NAME = "Integrity View"

# ---------------------------------------------------------------------------
# 2. SKALA & SKORING
# ---------------------------------------------------------------------------
# Data aktual G-Form menggunakan skala Likert 1-4 (tanpa opsi netral).
LIKERT_MIN = 1
LIKERT_MAX = 4
AGREE_THRESHOLD = 3  # skor >= 3 -> Setuju / Sangat Setuju
LIKERT_LABELS = {
    1: "Sangat Tidak Setuju",
    2: "Tidak Setuju",
    3: "Setuju",
    4: "Sangat Setuju",
}
# Jika jawaban berbentuk teks, dipetakan ke angka
LIKERT_TEXT_MAP = {
    "sangat tidak setuju": 1,
    "tidak setuju": 2,
    "setuju": 3,
    "sangat setuju": 4,
}

TARGET_INDEX = 75.0          # Target minimal indeks per indikator
ALPHA_MIN = 0.60             # Batas reliabilitas minimum (Cronbach's Alpha)
ALPHA_GOOD = 0.70            # Batas reliabilitas baik
SIGNIFICANCE_LEVEL = 0.05
MIN_SAMPLE_WARNING = 30      # Peringatan bila N valid < nilai ini

# Kategori mutu mengacu konversi IKM (PermenPANRB No. 14 Tahun 2017)
INDEX_CATEGORIES = [
    # (batas_bawah, grade, label, warna)
    (88.31, "A", "Sangat Baik", "#34D399"),
    (76.61, "B", "Baik", "#60A5FA"),
    (65.00, "C", "Kurang Baik", "#FBBF24"),
    (0.00, "D", "Tidak Baik", "#F87171"),
]

# ---------------------------------------------------------------------------
# 3. ATURAN SPAM / KUALITAS DATA
# ---------------------------------------------------------------------------
MIN_DURATION_SECONDS = 30       # Hanya berlaku jika sumber punya kolom waktu mulai
DUPLICATE_SCOPE = "global"      # "global": 1 orang 1 respons / "daily": per hari
DUPLICATE_KEEP = "last"         # Simpan respons terbaru
MAX_MISSING_RATIO = 0.20        # Drop jika > 20% butir kosong, selain itu imputasi median
MIN_ITEMS_FOR_STRAIGHTLINE = 3
# "flag" : ditandai saja (default; tetap dihitung, bisa dikecualikan di dashboard)
# "drop" : dianggap tidak valid
# Catatan: pada data aktual >60% responden memilih nilai sama di semua butir
# (umumnya "Sangat Setuju"). Membuang semuanya akan merusak representativitas.
STRAIGHTLINE_POLICY = "flag"

GROUP_ALIASES = {
    "tendik": "Tenaga Kependidikan",
    "tenaga kependidikan": "Tenaga Kependidikan",
    "dosen": "Dosen",
}

# ---------------------------------------------------------------------------
# 4. REGISTRI INDIKATOR
# ---------------------------------------------------------------------------
# Tipe sumber yang didukung:
#   {"type": "excel",   "path": "...xlsx", "sheet": "Form Responses 1"}
#   {"type": "gsheet",  "sheet_id": "<ID spreadsheet>", "worksheet": "Form Responses 1"}
#   {"type": "csv_url", "url": "https://docs.google.com/spreadsheets/d/<ID>/export?format=csv"}
# Butir Likert & kolom metadata dideteksi otomatis; "items" memberi label singkat
# dan rekomendasi spesifik per butir (urut sesuai urutan pertanyaan di form).
INDICATORS: dict[str, dict] = {
    "IND01": {
        "number": 1,
        "name": "Persepsi Antikorupsi",
        "slug": "Antikorupsi",
        "icon": "🛡️",
        "description": "Persepsi pegawai terhadap integritas layanan dan bebasnya "
                       "layanan dari praktik korupsi, pungli, dan percaloan.",
        "source": {
            "type": "excel",
            "path": BASE_DIR / "1. Survei Persepsi Antikorupsi - IntegrityView (Jawaban).xlsx",
            "sheet": "Form Responses 1",
        },
        "items": [
            ("Jujur & Transparan",
             "Publikasikan standar pelayanan (persyaratan, alur, waktu, biaya) secara terbuka "
             "di website dan titik layanan; perkuat keterbukaan informasi publik."),
            ("Adil & Non-diskriminatif",
             "Terapkan antrean/tiket layanan berbasis sistem, larang perlakuan istimewa karena "
             "jabatan/kedekatan, dan pantau melalui survei kepuasan berkala."),
            ("Bebas Manipulasi Prosedur",
             "Perkuat audit trail pada sistem informasi, terapkan prinsip maker-checker, dan "
             "jadwalkan audit internal (SPI) secara berkala."),
            ("Tanpa Imbalan / Pungli",
             "Tegaskan maklumat layanan 'tanpa biaya tambahan' (zero pungli) di setiap unit dan "
             "sediakan kanal pengaduan anonim yang mudah diakses."),
            ("Tanpa Perantara (Calo)",
             "Digitalisasi layanan (self-service/online) dan sederhanakan SOP agar layanan dapat "
             "diakses langsung tanpa perantara."),
            ("Integritas Layanan Keseluruhan",
             "Lanjutkan pembangunan ZI: keteladanan pimpinan, peran agen perubahan, dan publikasi "
             "capaian integritas secara rutin."),
        ],
    },
    "IND04": {
        "number": 4,
        "name": "Pengendalian Gratifikasi",
        "slug": "Gratifikasi",
        "icon": "🎁",
        "description": "Pemahaman, kemampuan identifikasi, dan komitmen pegawai dalam "
                       "menolak serta melaporkan gratifikasi.",
        "source": {
            "type": "excel",
            "path": BASE_DIR / "4. Survei Pengendalian Gratifikasi - IntegrityView (Jawaban).xlsx",
            "sheet": "Form Responses 1",
        },
        "items": [
            ("Pemahaman Konsep Gratifikasi",
             "Sosialisasikan definisi & contoh gratifikasi (boleh/tidak boleh) melalui fact sheet, "
             "infografis, dan e-learning singkat."),
            ("Identifikasi Situasi Rawan",
             "Bagikan studi kasus khas kampus (mahasiswa, orang tua/wali, mitra, vendor) beserta "
             "panduan praktis cara menolak dan melapor."),
            ("Mengetahui Saluran Pelaporan",
             "Publikasikan alur & kanal pelaporan gratifikasi (UPG internal, GOL KPK) di website, "
             "ruang kerja, laboratorium, dan email berkala."),
            ("Komitmen Lingkungan Kerja",
             "Tanda tangani pakta integritas per unit, perkuat keteladanan pimpinan, dan beri "
             "apresiasi bagi pegawai yang menolak/melaporkan gratifikasi."),
            ("Kejelasan Sosialisasi",
             "Jadwalkan sosialisasi rutin (mis. tiap semester / rapat akbar) dengan materi tertulis "
             "yang mudah diakses kembali."),
        ],
    },
    # Tambahkan indikator lain dengan pola yang sama, contoh:
    # "IND02": {"number": 2, "name": "Kualitas Pelayanan (SPKP)", "slug": "SPKP", "icon": "⭐",
    #           "source": {"type": "gsheet", "sheet_id": "...", "worksheet": "Form Responses 1"},
    #           "items": []},
}

# File survei yang belum terdaftar akan ditemukan otomatis dengan pola nama ini
AUTO_DISCOVER_PATTERN = re.compile(
    r"^(?P<num>\d+)\.\s*Survei\s+(?P<name>.+?)\s*-\s*IntegrityView.*\.xlsx$", re.IGNORECASE
)
AUTO_ICONS = ["📋", "⭐", "🏛️", "⚖️", "🔍", "🤝", "📈", "🧭", "💡", "🧩"]


def _slugify(name: str) -> str:
    words = re.findall(r"[A-Za-z0-9]+", name)
    return "".join(w.capitalize() for w in words[-2:]) or "Indikator"


def get_indicators() -> dict[str, dict]:
    """Registri indikator + hasil auto-discovery file Excel survei baru."""
    registry = {k: dict(v) for k, v in INDICATORS.items()}
    known_paths = {
        Path(v["source"].get("path", "")).resolve()
        for v in registry.values() if v["source"].get("type") == "excel"
    }
    for folder in (BASE_DIR, RAW_DIR):
        if not folder.exists():
            continue
        for f in sorted(folder.glob("*.xlsx")):
            if f.name.startswith("~$") or f.resolve() in known_paths:
                continue
            m = AUTO_DISCOVER_PATTERN.match(f.name)
            if not m:
                continue
            num = int(m.group("num"))
            code = f"IND{num:02d}"
            if code in registry:
                continue
            name = m.group("name").strip()
            registry[code] = {
                "number": num,
                "name": name,
                "slug": _slugify(name),
                "icon": AUTO_ICONS[num % len(AUTO_ICONS)],
                "description": f"Survei {name} (terdeteksi otomatis).",
                "source": {"type": "excel", "path": f, "sheet": 0},
                "items": [],
            }
    return dict(sorted(registry.items(), key=lambda kv: kv[1]["number"]))
