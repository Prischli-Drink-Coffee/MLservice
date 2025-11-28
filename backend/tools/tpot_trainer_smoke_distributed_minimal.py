"""Very small distributed smoke runner: uses a constrained TPOT config to limit memory/complexity.

Connects to compose dask scheduler; writes logs to /tmp/tpot_smoke_distributed_minimal.log
"""

from __future__ import annotations

import logging
import os

import numpy as np
import pandas as pd

import service.services.automl.search_space as _ss
from service.services.automl.search_space import build_symbolic_graph_search_space
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

    # Minimal config: only LogisticRegression (very light) to reduce worker memory
    minimal_config = {
        "sklearn.linear_model.LogisticRegression": {
            "C": [0.1, 1.0],
            "penalty": ["l2"],
            "solver": ["lbfgs"],
            "max_iter": [100],
        }
    }

    payload = {
        "parallel_mode": "distributed",
        "time_left": 30,  # seconds
        "per_run_limit": 15,  # seconds
        "n_jobs": 1,
        "random_state": 42,
        "config_dict": minimal_config,
        "generations": 1,
        "population_size": 6,
        "verbosity": 4,
        # Prefer an explicit env var, otherwise connect to localhost where
        # docker-compose publishes the scheduler port (host:8786).
        "dask_address": os.environ.get("TPOT_DASK_ADDRESS", "tcp://127.0.0.1:8786"),
    }

    # Override the build_search_space_config used by the trainer in this
    # smoke script with a tiny, validated symbolic graph search space to
    # avoid conversion issues and huge default search spaces that can blow
    # up worker memory in distributed tests.
    try:
        # Override the reference that TPOTTrainer holds to ensure the
        # trainer uses our simplified search-space resolver (it imports the
        # function at module import time so we patch the symbol there).
        import tpot.config as _tpot_cfg

        import service.services.automl.tpot_trainer as _tt

        # Return TPOT's internal SearchSpace object for LogisticRegression
        # which is safer than passing a raw dict or an unsupported string.
        _tt.build_search_space_config = lambda task, override=None: _tpot_cfg.get_search_space(
            "LogisticRegression"
        )
    except Exception:
        pass

    out_path = "/tmp/tpot_smoke_distributed_minimal.log"
    print(f"Starting minimal distributed trainer.train smoke; writing logs to {out_path}")
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
            f.write(f"Exception during distributed minimal smoke: {exc}\n")
        raise


if __name__ == "__main__":
    main()
