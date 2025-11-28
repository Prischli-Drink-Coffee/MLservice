"""Very small local smoke runner: runs TPOT in local (non-distributed) mode.

This is a quick CI-friendly fallback when the distributed stack is flaky.
"""

from __future__ import annotations

import logging
import os

import numpy as np
import pandas as pd

from service.services.automl.tpot_trainer import TPOTTrainer
from service.settings import TPOTConfig

logging.basicConfig(level=logging.INFO)


def main() -> None:
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    rng = np.random.RandomState(0)
    n = 150
    X = rng.randn(n, 6) * 10
    y = ((X[:, 0] * 0.3 + X[:, 1] * -0.2 + rng.rand(n)) > 0).astype(int)

    df = pd.DataFrame(X, columns=[f"f{i}" for i in range(X.shape[1])])
    df["target"] = y

    minimal_config = {
        "sklearn.linear_model.LogisticRegression": {
            "C": [0.1, 1.0],
            "penalty": ["l2"],
            "solver": ["lbfgs"],
            "max_iter": [100],
        }
    }

    payload = {
        "parallel_mode": "local",
        "time_left": 30,  # seconds
        "per_run_limit": 15,  # seconds
        "n_jobs": 1,
        "random_state": 42,
        "config_dict": minimal_config,
        "generations": 1,
        "population_size": 6,
        "verbosity": 2,
    }

    # Override the build_search_space_config used by the trainer to a tiny,
    # validated search space to avoid TPOT conversion issues that can lead
    # to empty inner choices and 'No individuals could be evaluated'.
    try:
        import tpot.config as _tpot_cfg

        import service.services.automl.tpot_trainer as _tt

        _tt.build_search_space_config = lambda task, override=None: _tpot_cfg.get_search_space(
            "LogisticRegression"
        )
    except Exception:
        pass

    out_path = "/tmp/tpot_smoke_minimal_local.log"
    print(f"Starting minimal LOCAL trainer.train smoke; writing logs to {out_path}")
    try:
        res = trainer.train(df, target_column="target", task="classification", payload=payload)
        with open(out_path, "a") as f:
            f.write(f"Done. best_score={res.best_score}\n")
            f.write(f"Generations completed: {res.generations_completed}\n")
            f.write(
                f"Evaluated individuals shape: {None if res.evaluated_individuals is None else getattr(res.evaluated_individuals, 'shape', None)}\n"
            )
    except Exception as exc:
        with open(out_path, "a") as f:
            f.write(f"Exception during minimal LOCAL smoke: {exc}\n")
        raise


if __name__ == "__main__":
    main()
