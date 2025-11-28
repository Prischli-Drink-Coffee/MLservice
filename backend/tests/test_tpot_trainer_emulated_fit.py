import pandas as pd


def test_tpot_trainer_emulated_fit(monkeypatch):
    """Emulate TPOT estimator behaviour (fit/score) with a lightweight fake
    estimator so we can run an end-to-end `TPOTTrainer.train` in local mode
    without installing TPOT.
    """
    from service.services.automl import tpot_trainer as tt
    from service.services.automl.tpot_trainer import TPOTTrainer
    from service.settings import TPOTConfig

    # Fake estimator that mirrors TPOTClassifier/TPOTRegressor surface used
    # by TPOTTrainer: accepts kwargs, implements fit, score and exposes
    # fitted_pipeline_, evaluated_individuals_, generations_completed_.
    class FakeEstimator:
        def __init__(self, **kwargs):
            self.init_kwargs = kwargs

        def fit(self, X, y):
            # set minimal attributes that TPOTTrainer expects after fit
            self.fitted_pipeline_ = lambda x: 0
            self.evaluated_individuals_ = pd.DataFrame({"score": [0.5]})
            self.generations_completed_ = self.init_kwargs.get("generations", 1)
            return self

        def score(self, X, y):
            return 0.75

    # Patch the module-level TPOTClassifier with our fake estimator
    monkeypatch.setattr(tt, "TPOTClassifier", FakeEstimator)

    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    # small synthetic numeric dataset
    n = 40
    X = pd.DataFrame({f"f{i}": range(n) for i in range(3)})
    y = (X["f0"] % 2).astype(int)
    df = X.copy()
    df["target"] = y

    payload = {"parallel_mode": "local", "generations": 2, "population_size": 4, "time_left": 10, "per_run_limit": 5}

    res = trainer.train(df, target_column="target", task="classification", payload=payload)

    assert res is not None
    assert hasattr(res, "fitted_pipeline")
    assert res.best_score == 0.75
    assert res.evaluated_individuals.shape[0] >= 1
