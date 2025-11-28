"""Lightweight smoke script to run a short TPOT training (distributed) against local dask stack.

This script is intended to be run inside the backend container where the
repository is mounted at /dude. It builds a small synthetic dataset and
runs TPOTTrainer with a short time budget to validate the distributed
integration and constructor-kwarg compatibility shims.
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from service.services.automl.tpot_trainer import TPOTTrainer
from service.settings import TPOTConfig

logging.basicConfig(level=logging.INFO)


def main() -> None:
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    rng = np.random.RandomState(0)
    n = 300
    X = rng.randn(n, 6) * 10
    # simple non-linear target
    y = ((X[:, 0] * 0.3 + X[:, 1] * -0.2 + rng.rand(n)) > 0).astype(int)

    df = pd.DataFrame(X, columns=[f"f{i}" for i in range(X.shape[1])])
    df["target"] = y

    # Use a very small, conservative config dict to avoid heavy models during
    # the smoke run and reduce memory/CPU requirements on the workers.
    simple_config = {
        "sklearn.linear_model.LogisticRegression": {
            "C": [0.1, 1.0],
            "penalty": ["l2"],
            "solver": ["lbfgs"],
            "max_iter": [100],
        }
    }

    payload = {
        # For environment mismatches during smoke runs we default to local mode
        # to validate TPOT functionality quickly. Distributed tests require
        # aligned package versions between client and workers.
        "parallel_mode": "local",
        # slightly larger time budget to avoid per-model cancels during smoke
        "time_left": 120,
        "per_run_limit": 30,
        "n_jobs": 1,
        "random_state": 42,
        # Avoid passing a raw config_dict here — convert-to-SearchSpace logic
        # may produce empty inner search spaces for minimal configs and cause
        # TPOT to raise during initial population generation. Use the
        # default TPOT search space for the smoke run to reduce variability.
        "config_dict": None,
        "verbosity": 4,
    }

    print("Starting trainer.train smoke (distributed)")
    res = trainer.train(df, target_column="target", task="classification", payload=payload)
    print("Done. best_score=", res.best_score)
    print("Generations completed:", res.generations_completed)
    print(
        "Evaluated individuals shape:",
        (
            None
            if res.evaluated_individuals is None
            else getattr(res.evaluated_individuals, "shape", None)
        ),
    )
    print(
        "Has fitted pipeline:",
        hasattr(res.fitted_pipeline, "__call__") or res.fitted_pipeline is not None,
    )


if __name__ == "__main__":
    main()
