"""Area unit normalization and tolerance comparison for Bangladesh land records."""
import re
from typing import Optional, Tuple
from app.rules.base import CaseConfig

EXACT_SQFT_FACTORS = {
    # 1 decimal = 435.6 sq ft
    "decimal": 435.6,
    "shotok": 435.6,
    "shatok": 435.6,
    "shatank": 435.6,
    "cent": 435.6,
    # 1 acre = 100 decimal = 43,560 sq ft
    "acre": 43560.0,
    "ekor": 43560.0,
    # 1 hectare = 107,639.1 sq ft
    "hectare": 107639.1,
    "hector": 107639.1,
    # 1 sq m = 10.7639 sq ft
    "sqm": 10.7639,
    "sq_m": 10.7639,
    "sq m": 10.7639,
    "square meter": 10.7639,
    "square meters": 10.7639,
    "square_meter": 10.7639,
    "square_meters": 10.7639,
    "sq.m": 10.7639,
    # Square feet
    "sqft": 1.0,
    "sq_ft": 1.0,
    "sq ft": 1.0,
    "square foot": 1.0,
    "square feet": 1.0,
    "square_feet": 1.0,
    "sq.ft": 1.0,
}

REGIONAL_UNITS = {"katha", "cotta", "bigha", "kani", "gonda"}

def clean_unit(unit: Optional[str]) -> str:
    if not unit:
        return ""
    u = unit.strip().lower()
    u = re.sub(r"[^\w\s\.]", "", u)
    return u

def is_regional_unit(unit: Optional[str]) -> bool:
    u = clean_unit(unit)
    return any(r in u for r in REGIONAL_UNITS)

def normalize_area_to_sqft(
    value: Optional[float],
    unit: Optional[str],
    config: Optional[CaseConfig] = None,
) -> Optional[float]:
    """
    Normalizes numeric land area to square feet.
    Returns None if value or unit is missing, or if unit is regional and basis is unset.
    """
    if value is None or value < 0 or not unit:
        return None

    cfg = config or CaseConfig()
    u = clean_unit(unit)

    # Check exact standard conversions
    for key, factor in EXACT_SQFT_FACTORS.items():
        if u == key or u.startswith(key):
            return round(value * factor, 4)

    # Regional unit: Katha
    if "katha" in u or "cotta" in u:
        if cfg.katha_sqft is not None and cfg.katha_sqft > 0:
            return round(value * cfg.katha_sqft, 4)
        return None

    # Regional unit: Bigha (standardly 20 katha if katha basis is set, or explicit bigha_sqft)
    if "bigha" in u:
        if cfg.bigha_sqft is not None and cfg.bigha_sqft > 0:
            return round(value * cfg.bigha_sqft, 4)
        if cfg.katha_sqft is not None and cfg.katha_sqft > 0:
            return round(value * cfg.katha_sqft * 20.0, 4)
        return None

    return None

def compare_areas(
    val_a: Optional[float],
    unit_a: Optional[str],
    val_b: Optional[float],
    unit_b: Optional[str],
    config: Optional[CaseConfig] = None,
) -> Tuple[Optional[float], Optional[float], Optional[float], Optional[bool]]:
    """
    Compare two area values by normalizing to sq ft.
    Returns: (sqft_a, sqft_b, diff_pct, is_within_tolerance).
    diff_pct is relative to the larger of the two values (|A - B| / max(A, B) * 100).
    """
    cfg = config or CaseConfig()
    sqft_a = normalize_area_to_sqft(val_a, unit_a, cfg)
    sqft_b = normalize_area_to_sqft(val_b, unit_b, cfg)

    if sqft_a is None or sqft_b is None:
        return (sqft_a, sqft_b, None, None)

    max_val = max(sqft_a, sqft_b)
    if max_val == 0:
        return (0.0, 0.0, 0.0, True)

    diff = abs(sqft_a - sqft_b)
    diff_pct = round((diff / max_val) * 100.0, 4)
    within_tol = diff_pct <= cfg.area_tolerance_pct
    return (sqft_a, sqft_b, diff_pct, within_tol)
