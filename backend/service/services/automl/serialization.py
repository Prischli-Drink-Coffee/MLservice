"""Utility helpers for serializing TPOT results."""

import json
import math
import os
import pathlib
from typing import Any

import numpy as np
import pandas as pd


def _sanitize_value(value: Any) -> Any:
    if isinstance(value, (np.floating, float)):
        if math.isnan(value):
            return None
        return float(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    try:
        if isinstance(value, (np.ndarray, list, tuple)):
            return list(value)
    except Exception:
        pass
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def serialize_dataframe(df: pd.DataFrame | None) -> list[dict[str, Any]]:
    if df is None or df.empty:
        return []
    stripped = df.copy()
    stripped = stripped.replace({np.nan: None, pd.NA: None})
    records = stripped.to_dict(orient="records")
    return [{k: _sanitize_value(v) for k, v in rec.items()} for rec in records]


def _metric_prefers_lower(metric: str) -> bool:
    lower_better = {
        "mse",
        "mae",
        "neg_mean_squared_error",
        "neg_mean_absolute_error",
        "mean_squared_error",
        "mean_absolute_error",
    }
    return metric.lower() in lower_better


def extract_leaderboard(
    df: pd.DataFrame | None, metric: str | None, top_k: int
) -> list[dict[str, Any]]:
    if df is None or df.empty:
        return []
    sort_key = metric if metric and metric in df.columns else None
    if sort_key is None:
        sort_key = df.columns[0]
    ascending = _metric_prefers_lower(sort_key)
    sorted_df = df.sort_values(sort_key, ascending=ascending)
    return serialize_dataframe(sorted_df.head(top_k))


def extract_pareto_front(df: pd.DataFrame | None) -> list[dict[str, Any]]:
    if df is None or df.empty or "Pareto_Front" not in df.columns:
        return []
    pareto_df = df[df["Pareto_Front"] == 1]
    if pareto_df.empty:
        pareto_df = df.head(5)
    return serialize_dataframe(pareto_df)


def write_json(obj: Any, path: str) -> None:
    path_obj = pathlib.Path(path)
    path_obj.parent.mkdir(parents=True, exist_ok=True)
    with path_obj.open("w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)
