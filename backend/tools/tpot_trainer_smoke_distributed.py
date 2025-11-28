"""Distributed smoke script: runs TPOTTrainer against local dask scheduler inside compose network.

This script writes verbose logs to /tmp/tpot_smoke_distributed.log inside the container.
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
    n = 400
    X = rng.randn(n, 6) * 10
    # simple non-linear target
    y = ((X[:, 0] * 0.3 + X[:, 1] * -0.2 + rng.rand(n)) > 0).astype(int)

    df = pd.DataFrame(X, columns=[f"f{i}" for i in range(X.shape[1])])
    df["target"] = y

    # Use the default TPOT search space for stability; distributed mode requires
    # aligned package versions between client and workers.
    payload = {
        "parallel_mode": "distributed",
        # time budget (minutes)
        "time_left": 2 * 60,
        "per_run_limit": 60,
        "n_jobs": 1,
        "random_state": 42,
        # connect to local dask scheduler by address (compose service name)
        "dask_address": os.environ.get(
            "TPOT_DASK_ADDRESS", "tcp://mlservice-dask-scheduler-1:8786"
        ),
        "verbosity": 4,
    }

    out_path = "/tmp/tpot_smoke_distributed.log"
    print(f"Starting distributed trainer.train smoke; writing logs to {out_path}")
    # run and capture output
    try:
        res = trainer.train(df, target_column="target", task="classification", payload=payload)
        with open(out_path, "a") as f:
            f.write(f"Done. best_score={res.best_score}\n")
            f.write(f"Generations completed: {res.generations_completed}\n")
            f.write(
                f"Evaluated individuals shape: {None if res.evaluated_individuals is None else getattr(res.evaluated_individuals, 'shape', None)}\n"
            )
            f.write(
                f"Has fitted pipeline: {hasattr(res.fitted_pipeline, '__call__') or res.fitted_pipeline is not None}\n"
            )
    except Exception as exc:
        with open(out_path, "a") as f:
            f.write(f"Exception during distributed smoke: {exc}\n")
        raise


if __name__ == "__main__":
    main()
