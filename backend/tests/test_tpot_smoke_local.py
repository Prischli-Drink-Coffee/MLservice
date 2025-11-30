import numpy as np
import pandas as pd

from service.services.automl.tpot_trainer import TPOTTrainer
from service.settings import TPOTConfig


def test_tpot_trainer_minimal_local_smoke():
    """Quick local-mode smoke: small dataset, very constrained TPOT config.

    This test is CI-friendly and should run quickly; it validates that the
    `TPOTTrainer.train` codepath works in local (non-distributed) mode.
    """
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    rng = np.random.RandomState(0)
    n = 80
    X = rng.randn(n, 4)
    y = ((X[:, 0] * 0.3 + X[:, 1] * -0.2 + rng.rand(n)) > 0).astype(int)

    df = pd.DataFrame(X, columns=[f"f{i}" for i in range(X.shape[1])])
    df["target"] = y

    minimal_config = {
        "sklearn.linear_model.LogisticRegression": {
            "C": [0.1, 1.0],
            "penalty": ["l2"],
            "solver": ["lbfgs"],
            "max_iter": [50],
        }
    }

    payload = {
        "parallel_mode": "local",
        "time_left": 20,
        "per_run_limit": 10,
        "n_jobs": 1,
        "random_state": 42,
        "config_dict": minimal_config,
        "generations": 1,
        "population_size": 6,
        "verbosity": 0,
    }

    res = trainer.train(df, target_column="target", task="classification", payload=payload)

    # basic assertions: trainer returns TPOTResult with numeric best_score
    assert hasattr(res, "best_score")
    assert res.best_score is None or isinstance(res.best_score, float)
    assert hasattr(res, "generations_completed")
