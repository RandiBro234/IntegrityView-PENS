"""
INTEGRITY VIEW - Modul Analitik & Statistik
===========================================
Seluruh perhitungan dilakukan dinamis saat dashboard diakses (bukan disimpan
statis di DB) agar selalu mengikuti data terbaru.

Isi:
- Skoring & indeks (Total skor aktual / total skor maks x 100) + kategori mutu
- Reliabilitas: Cronbach's Alpha, Alpha-if-item-deleted
- Validitas butir: corrected item-total correlation vs r-tabel
- Statistik deskriptif, distribusi jawaban, % setuju
- Perbandingan kelompok (Mann-Whitney U / Kruskal-Wallis)
- Tren waktu (harian & kumulatif)
- Analisis teks masukan responden (tema & kata kunci)
- Mesin rekomendasi otomatis
"""
from __future__ import annotations

import re
from collections import Counter

import numpy as np
import pandas as pd
from scipy import stats as sps

import config


# ---------------------------------------------------------------------------
# Reliabilitas & validitas
# ---------------------------------------------------------------------------
def calculate_cronbach_alpha(df: pd.DataFrame, question_cols: list[str]) -> float:
    """Cronbach's Alpha = k/(k-1) * (1 - sum(var_item) / var_total)."""
    items = df[question_cols].dropna()
    k = len(question_cols)
    if k < 2 or len(items) < 2:
        return float("nan")
    item_vars = items.var(ddof=1, axis=0)
    total_var = items.sum(axis=1).var(ddof=1)
    if total_var == 0:
        return 0.0
    alpha = (k / (k - 1)) * (1 - item_vars.sum() / total_var)
    return round(float(alpha), 3)


def alpha_if_item_deleted(df: pd.DataFrame, question_cols: list[str]) -> pd.Series:
    return pd.Series({
        c: calculate_cronbach_alpha(df, [x for x in question_cols if x != c])
        for c in question_cols
    })


def corrected_item_total_correlation(df: pd.DataFrame, question_cols: list[str]) -> pd.Series:
    items = df[question_cols].dropna()
    total = items.sum(axis=1)
    out = {}
    for c in question_cols:
        rest = total - items[c]
        if items[c].std() == 0 or rest.std() == 0 or len(items) < 3:
            out[c] = float("nan")
        else:
            out[c] = round(float(np.corrcoef(items[c], rest)[0, 1]), 3)
    return pd.Series(out)


def r_table(n: int, alpha: float = config.SIGNIFICANCE_LEVEL) -> float:
    """Nilai kritis r Pearson (dua sisi) untuk df = n - 2."""
    dfree = n - 2
    if dfree < 1:
        return float("nan")
    t = sps.t.ppf(1 - alpha / 2, dfree)
    return round(float(t / np.sqrt(dfree + t ** 2)), 3)


def reliability_label(alpha: float) -> tuple[str, str]:
    if alpha is None or np.isnan(alpha):
        return "Tidak dapat dihitung", "#94A3B8"
    if alpha >= 0.9:
        return "Sangat Tinggi", "#34D399"
    if alpha >= config.ALPHA_GOOD:
        return "Reliabel (Baik)", "#34D399"
    if alpha >= config.ALPHA_MIN:
        return "Reliabel (Cukup)", "#60A5FA"
    return "Kurang Reliabel", "#F87171"


# ---------------------------------------------------------------------------
# Skoring
# ---------------------------------------------------------------------------
def index_category(index: float) -> dict:
    if index is None or np.isnan(index):
        return {"grade": "-", "label": "Belum ada data", "color": "#94A3B8"}
    for lower, grade, label, color in config.INDEX_CATEGORIES:
        if index >= lower:
            return {"grade": grade, "label": label, "color": color}
    return {"grade": "D", "label": "Tidak Baik", "color": "#F87171"}


def score_to_index(score_mean: float) -> float:
    return score_mean / config.LIKERT_MAX * 100


def calculate_indicator_stats(df: pd.DataFrame, question_cols: list[str]) -> dict:
    """Ringkasan statistik satu indikator."""
    stats: dict = {"N": int(len(df)), "n_items": len(question_cols)}
    if stats["N"] == 0 or not question_cols:
        stats.update(indeks=float("nan"), rata_rata=float("nan"), median=float("nan"),
                     simpangan_baku=float("nan"), persen_setuju=float("nan"),
                     cronbach_alpha=float("nan"), min=float("nan"), max=float("nan"))
        stats["kategori"] = index_category(float("nan"))
        return stats

    values = df[question_cols].to_numpy(dtype=float)
    valid = ~np.isnan(values)
    actual = np.nansum(values)
    max_total = valid.sum() * config.LIKERT_MAX
    stats["indeks"] = round(actual / max_total * 100, 2) if max_total else float("nan")

    row_means = df[question_cols].mean(axis=1)
    stats["rata_rata"] = round(float(row_means.mean()), 3)
    stats["median"] = round(float(row_means.median()), 3)
    stats["simpangan_baku"] = round(float(row_means.std(ddof=1)), 3) if len(df) > 1 else 0.0
    stats["min"] = round(float(row_means.min()), 3)
    stats["max"] = round(float(row_means.max()), 3)

    flat = values[valid]
    stats["persen_setuju"] = round(float((flat >= config.AGREE_THRESHOLD).mean() * 100), 2)
    stats["persen_sangat_setuju"] = round(float((flat == config.LIKERT_MAX).mean() * 100), 2)
    stats["persen_tidak_setuju"] = round(float((flat < config.AGREE_THRESHOLD).mean() * 100), 2)

    stats["cronbach_alpha"] = calculate_cronbach_alpha(df, question_cols)
    stats["kategori"] = index_category(stats["indeks"])
    # Margin of error (95%) untuk indeks berdasarkan rata-rata responden
    if len(df) > 1:
        se = row_means.std(ddof=1) / np.sqrt(len(df))
        stats["moe"] = round(float(score_to_index(1.96 * se)), 2)
    else:
        stats["moe"] = float("nan")
    return stats


def item_analysis(df: pd.DataFrame, question_cols: list[str], labels: dict | None = None) -> pd.DataFrame:
    """Statistik per butir: rata-rata, indeks, distribusi, validitas, alpha-if-deleted."""
    labels = labels or {}
    n = len(df)
    if n == 0:
        return pd.DataFrame()
    rit = corrected_item_total_correlation(df, question_cols)
    aid = alpha_if_item_deleted(df, question_cols)
    rt = r_table(n)
    rows = []
    for c in question_cols:
        s = df[c].dropna()
        idx = round(score_to_index(s.mean()), 2) if len(s) else float("nan")
        rows.append({
            "item_code": c,
            "label": labels.get(c, c),
            "rata_rata": round(float(s.mean()), 3) if len(s) else float("nan"),
            "simpangan_baku": round(float(s.std(ddof=1)), 3) if len(s) > 1 else float("nan"),
            "indeks": idx,
            "kategori": index_category(idx)["label"],
            "persen_setuju": round(float((s >= config.AGREE_THRESHOLD).mean() * 100), 2) if len(s) else float("nan"),
            "persen_tidak_setuju": round(float((s < config.AGREE_THRESHOLD).mean() * 100), 2) if len(s) else float("nan"),
            "r_hitung": rit[c],
            "r_tabel": rt,
            "valid": bool(rit[c] > rt) if not np.isnan(rit[c]) and not np.isnan(rt) else False,
            "alpha_if_deleted": aid[c],
        })
    return pd.DataFrame(rows)


def answer_distribution(df: pd.DataFrame, question_cols: list[str], labels: dict | None = None) -> pd.DataFrame:
    labels = labels or {}
    rows = []
    for c in question_cols:
        s = df[c].dropna()
        total = len(s)
        for score in range(config.LIKERT_MIN, config.LIKERT_MAX + 1):
            cnt = int((s == score).sum())
            rows.append({
                "item_code": c, "label": labels.get(c, c), "skor": score,
                "keterangan": config.LIKERT_LABELS.get(score, str(score)),
                "jumlah": cnt, "persen": round(cnt / total * 100, 2) if total else 0.0,
            })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Perbandingan kelompok
# ---------------------------------------------------------------------------
def group_comparison(df: pd.DataFrame, question_cols: list[str], group_col: str = "kelompok") -> dict:
    if df.empty or group_col not in df:
        return {"table": pd.DataFrame(), "test": None, "per_item": pd.DataFrame()}
    d = df.copy()
    d["_mean"] = d[question_cols].mean(axis=1)
    table = d.groupby(group_col).agg(N=("_mean", "size"), rata_rata=("_mean", "mean"),
                                     median=("_mean", "median"), sd=("_mean", "std")).reset_index()
    table["indeks"] = table["rata_rata"].apply(score_to_index).round(2)
    table["alpha"] = [calculate_cronbach_alpha(d[d[group_col] == g], question_cols)
                      for g in table[group_col]]

    per_item = (d.groupby(group_col)[question_cols].mean().apply(lambda s: s.map(score_to_index))
                .round(2).reset_index().melt(id_vars=group_col, var_name="item_code",
                                             value_name="indeks"))

    groups = [g["_mean"].dropna().values for _, g in d.groupby(group_col) if len(g) >= 3]
    test = None
    if len(groups) == 2:
        u, p = sps.mannwhitneyu(groups[0], groups[1], alternative="two-sided")
        n1, n2 = len(groups[0]), len(groups[1])
        z = sps.norm.ppf(max(p, 1e-300) / 2)
        test = {"uji": "Mann-Whitney U", "statistik": round(float(u), 3), "p_value": round(float(p), 4),
                "effect_size_r": round(abs(float(z)) / np.sqrt(n1 + n2), 3),
                "signifikan": bool(p < config.SIGNIFICANCE_LEVEL)}
    elif len(groups) > 2:
        h, p = sps.kruskal(*groups)
        test = {"uji": "Kruskal-Wallis H", "statistik": round(float(h), 3), "p_value": round(float(p), 4),
                "effect_size_r": float("nan"), "signifikan": bool(p < config.SIGNIFICANCE_LEVEL)}
    return {"table": table, "test": test, "per_item": per_item}


# ---------------------------------------------------------------------------
# Tren waktu
# ---------------------------------------------------------------------------
def trend_over_time(df: pd.DataFrame, question_cols: list[str], freq: str = "D") -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    d = df[["submitted_at"] + question_cols].dropna(subset=["submitted_at"]).copy()
    d["periode"] = d["submitted_at"].dt.to_period(freq).dt.to_timestamp()
    d["_sum"] = d[question_cols].sum(axis=1)
    d["_cnt"] = d[question_cols].notna().sum(axis=1)
    g = d.groupby("periode").agg(responden=("_sum", "size"), skor=("_sum", "sum"), butir=("_cnt", "sum"))
    g["indeks_periode"] = (g["skor"] / (g["butir"] * config.LIKERT_MAX) * 100).round(2)
    g["responden_kumulatif"] = g["responden"].cumsum()
    g["indeks_kumulatif"] = (g["skor"].cumsum() / (g["butir"].cumsum() * config.LIKERT_MAX) * 100).round(2)
    return g.reset_index()


# ---------------------------------------------------------------------------
# Analisis teks (masukan terbuka)
# ---------------------------------------------------------------------------
STOPWORDS_ID = set("""
ada adalah agar akan aku anda apa apabila atau atas bagi bahwa bapak baik banyak barang
begitu belum benar beberapa berbagai bisa bila boleh buat bukan cara cukup dalam dan dapat
dari demikian dengan di dia diri ditingkatkan diperbaiki diperkuat harus hal hanya ibu ini
itu jadi jika juga jangan kalau kami kampus karena ke kepada kita lagi lain lebih maka
masih melalui menjadi menurut mereka misalnya mungkin namun oleh pada para pens perlu
saat saja sama sampai sangat saya se sebagai sebaiknya sebelum secara sedang sehingga
sekali selalu semakin semua sendiri seperti serta sesuai setiap sudah supaya tak tanpa
telah tentang terhadap tersebut tetapi tidak tiap untuk yaitu yang yg dgn utk tdk sdh blm
dll dsb nya pun lah kah apakah oke ok jg aja the of and to
""".split())

NO_INPUT_PATTERNS = re.compile(
    r"^\s*(-+|\.+|tidak ada|tdk ada|ga ada|gak ada|nggak ada|belum ada|blm ada|cukup|"
    r"sudah (cukup )?baik|sudah bagus|sudah cukup|sejauh ini (sudah )?(cukup )?baik|"
    r"tidak|no|none|n/?a|nihil|aman)\W*$",
    re.IGNORECASE,
)

THEMES = {
    "Sosialisasi & Edukasi": ["sosialisasi", "edukasi", "pelatihan", "workshop", "seminar",
                              "pemahaman", "materi", "informasi", "kampanye", "diingatkan", "fact sheet"],
    "Transparansi & Keterbukaan": ["transparan", "transparansi", "terbuka", "keterbukaan", "publikasi"],
    "SOP & Prosedur Layanan": ["sop", "prosedur", "alur", "standar", "aturan", "regulasi", "mekanisme"],
    "Digitalisasi & Sistem": ["sistem", "digital", "online", "aplikasi", "website", "teknologi", "elektronik"],
    "Pengawasan & Sanksi": ["pengawasan", "sanksi", "audit", "monitoring", "evaluasi", "tegas", "hukuman", "kontrol"],
    "Saluran Pelaporan / WBS": ["lapor", "pelaporan", "laporan", "pengaduan", "wbs", "whistle", "kanal", "saluran"],
    "Keteladanan & Komitmen": ["teladan", "keteladanan", "pimpinan", "komitmen", "budaya", "integritas", "contoh"],
    "Keadilan & Non-diskriminasi": ["adil", "keadilan", "diskriminasi", "membeda", "kedekatan", "nepotisme"],
    "Komunikasi & Koordinasi": ["komunikasi", "koordinasi", "antar unit", "kolaborasi"],
    "Kesejahteraan & SDM": ["kesejahteraan", "gaji", "insentif", "reward", "penghargaan", "apresiasi", "sdm"],
}


def is_meaningful_feedback(text: str) -> bool:
    if not isinstance(text, str):
        return False
    t = text.strip()
    return len(t) >= 4 and not NO_INPUT_PATTERNS.match(t)


def _tokens(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]+", text.lower())
    return [w for w in words if len(w) > 2 and w not in STOPWORDS_ID]


def keyword_frequencies(texts: pd.Series, top_n: int = 25) -> pd.DataFrame:
    counter: Counter = Counter()
    bigrams: Counter = Counter()
    for t in texts.dropna():
        if not is_meaningful_feedback(t):
            continue
        toks = _tokens(t)
        counter.update(set(toks))
        bigrams.update({f"{a} {b}" for a, b in zip(toks, toks[1:])})
    uni = pd.DataFrame(counter.most_common(top_n), columns=["kata", "frekuensi"])
    bi = pd.DataFrame([(k, v) for k, v in bigrams.most_common(top_n) if v >= 2],
                      columns=["kata", "frekuensi"])
    return pd.concat([uni.assign(jenis="kata"), bi.assign(jenis="frasa")], ignore_index=True)


def classify_themes(text: str) -> list[str]:
    if not is_meaningful_feedback(text):
        return ["Tidak Ada Masukan / Sudah Baik"]
    low = text.lower()
    found = [theme for theme, kws in THEMES.items() if any(k in low for k in kws)]
    return found or ["Lainnya"]


def theme_summary(texts: pd.Series) -> pd.DataFrame:
    counter: Counter = Counter()
    total = 0
    for t in texts.fillna(""):
        total += 1
        counter.update(classify_themes(t))
    df = pd.DataFrame(counter.items(), columns=["tema", "jumlah"]).sort_values("jumlah", ascending=False)
    df["persen"] = (df["jumlah"] / max(total, 1) * 100).round(1)
    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Rekomendasi
# ---------------------------------------------------------------------------
def generate_recommendations(stats: dict, items_df: pd.DataFrame, group_result: dict | None,
                             item_recos: dict | None = None, data_quality: dict | None = None,
                             themes: pd.DataFrame | None = None) -> list[dict]:
    """Daftar rekomendasi {level: success|info|warning|error, title, text}."""
    recos: list[dict] = []
    item_recos = item_recos or {}
    idx = stats.get("indeks", float("nan"))
    if stats.get("N", 0) == 0:
        return [{"level": "info", "title": "Belum ada data", "text": "Menunggu respons masuk."}]

    cat = stats["kategori"]
    if idx < config.TARGET_INDEX:
        recos.append({"level": "error", "title": f"Indeks {idx:.2f} di bawah target {config.TARGET_INDEX:.0f}",
                      "text": "Prioritaskan intervensi pada butir dengan indeks terendah dan lakukan "
                              "sosialisasi terarah terkait indikator ini."})
    else:
        recos.append({"level": "success", "title": f"Indeks {idx:.2f} — kategori {cat['label']} ({cat['grade']})",
                      "text": "Capaian di atas target. Pertahankan budaya kerja dan SOP, dorong ke kategori "
                              "berikutnya dengan memperbaiki butir terlemah."})

    if not items_df.empty:
        weakest = items_df.nsmallest(min(2, len(items_df)), "indeks")
        for _, r in weakest.iterrows():
            level = "warning" if r["indeks"] >= config.TARGET_INDEX else "error"
            recos.append({
                "level": level,
                "title": f"Butir prioritas: {r['label']} (indeks {r['indeks']:.2f}, "
                         f"{r['persen_tidak_setuju']:.1f}% tidak setuju)",
                "text": item_recos.get(r["item_code"], "Tinjau penyebab rendahnya persepsi pada butir ini "
                                                       "melalui FGD dengan responden."),
            })
        invalid = items_df[~items_df["valid"]]
        if len(invalid):
            recos.append({"level": "warning", "title": f"{len(invalid)} butir belum valid (r hitung ≤ r tabel)",
                          "text": "Butir: " + ", ".join(invalid["label"]) +
                                  ". Pertimbangkan merevisi redaksi pertanyaan pada periode survei berikutnya."})

    alpha = stats.get("cronbach_alpha", float("nan"))
    if not np.isnan(alpha) and alpha < config.ALPHA_MIN:
        recos.append({"level": "error", "title": f"Reliabilitas rendah (α = {alpha:.3f})",
                      "text": "Konsistensi internal instrumen di bawah 0,6. Tinjau ulang redaksi pertanyaan "
                              "atau butir yang menurunkan alpha (lihat tab Reliabilitas)."})
    elif not np.isnan(alpha):
        recos.append({"level": "info", "title": f"Instrumen reliabel (α = {alpha:.3f})",
                      "text": "Hasil survei konsisten secara internal sehingga layak dijadikan dasar keputusan."})

    if group_result and group_result.get("test") and group_result["test"]["signifikan"]:
        t = group_result["table"].sort_values("indeks")
        low, high = t.iloc[0], t.iloc[-1]
        recos.append({"level": "warning",
                      "title": f"Perbedaan signifikan antar kelompok (p = {group_result['test']['p_value']:.4f})",
                      "text": f"Kelompok **{low.iloc[0]}** ({low['indeks']:.2f}) lebih rendah dari "
                              f"**{high.iloc[0]}** ({high['indeks']:.2f}). Rancang intervensi khusus "
                              f"untuk kelompok {low.iloc[0]}."})

    if stats["N"] < config.MIN_SAMPLE_WARNING:
        recos.append({"level": "warning", "title": f"Sampel kecil (N = {stats['N']})",
                      "text": f"Disarankan minimal {config.MIN_SAMPLE_WARNING} responden valid agar hasil stabil."})

    if data_quality and data_quality.get("straightline_pct", 0) > 40:
        recos.append({"level": "info",
                      "title": f"{data_quality['straightline_pct']:.0f}% respons straight-lining",
                      "text": "Banyak responden memilih jawaban seragam. Pertimbangkan menambah butir "
                              "bernada negatif (reverse-coded) atau attention-check pada survei berikutnya."})

    if themes is not None and not themes.empty:
        top = themes[~themes["tema"].isin(["Tidak Ada Masukan / Sudah Baik", "Lainnya"])].head(3)
        if len(top):
            recos.append({"level": "info", "title": "Aspirasi terbanyak responden",
                          "text": ", ".join(f"{r.tema} ({r.jumlah})" for r in top.itertuples()) +
                                  ". Jadikan masukan ini sebagai rencana aksi tindak lanjut."})
    return recos


def mask_email(email: str) -> str:
    if not isinstance(email, str) or "@" not in email:
        return email
    user, domain = email.split("@", 1)
    keep = user[:2] if len(user) > 2 else user[:1]
    return f"{keep}{'•' * max(3, len(user) - len(keep))}@{domain}"
