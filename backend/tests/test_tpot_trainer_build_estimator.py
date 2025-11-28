import pytest

from service.services.automl.tpot_trainer import TPOTConfig, TPOTRunOptions, TPOTTrainer


class FakeTPOTEstimator:
    def __init__(self, **kwargs):
        # capture init kwargs for assertions
        self.init_kwargs = kwargs


def make_default_payload(**overrides):
    payload = {
        "parallel_mode": "local",
        "metric": "accuracy",
        "leaderboard_topk": 5,
        "generations": 10,
        "population_size": 20,
        "time_left": 600,
        "per_run_limit": 60,
        "cv_folds": 3,
        "memory_limit_mb": None,
        "n_jobs": 1,
        "config_dict": None,
        "dask_scheduler_file": None,
        "random_state": 42,
    }
    payload.update(overrides)
    return payload


def test_build_estimator_uses_legacy_config_dict(monkeypatch):
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    payload = make_default_payload(config_dict={"Custom": "Config"})
    options = trainer.resolve_run_options(payload)

    # Patch TPOTClassifier to our fake estimator
    import service.services.automl.tpot_trainer as tt

    monkeypatch.setattr(tt, "TPOTClassifier", FakeTPOTEstimator)

    est = trainer._build_estimator("classification", options, dask_client=None)
    assert isinstance(est, FakeTPOTEstimator)
    # legacy config dict should be forwarded in some form. Newer TPOT may
    # accept a converted `search_space` object instead; accept either case.
    assert ("config_dict" in est.init_kwargs) or ("search_space" in est.init_kwargs)
    if "config_dict" in est.init_kwargs:
        assert est.init_kwargs["config_dict"] == {"Custom": "Config"}


def test_build_estimator_uses_search_space_when_not_dict(monkeypatch):
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    payload = make_default_payload(config_dict=None)
    options = trainer.resolve_run_options(payload)

    import service.services.automl.tpot_trainer as tt

    # Force the internal build_search_space_config to return a non-dict (string)
    monkeypatch.setattr(tt, "build_search_space_config", lambda task, override=None: "linear")
    monkeypatch.setattr(tt, "TPOTClassifier", FakeTPOTEstimator)

    est = trainer._build_estimator("classification", options, dask_client=None)
    assert isinstance(est, FakeTPOTEstimator)
    assert "search_space" in est.init_kwargs
    assert est.init_kwargs["search_space"] == "linear"
    assert "config_dict" not in est.init_kwargs


def test_build_estimator_regressor_uses_search_space(monkeypatch):
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    payload = make_default_payload(config_dict=None)
    options = trainer.resolve_run_options(payload)

    import service.services.automl.tpot_trainer as tt

    monkeypatch.setattr(tt, "build_search_space_config", lambda task, override=None: "linear")
    monkeypatch.setattr(tt, "TPOTRegressor", FakeTPOTEstimator)

    est = trainer._build_estimator("regression", options, dask_client=None)
    assert isinstance(est, FakeTPOTEstimator)
    assert "search_space" in est.init_kwargs
    assert est.init_kwargs["search_space"] == "linear"
    assert "config_dict" not in est.init_kwargs
