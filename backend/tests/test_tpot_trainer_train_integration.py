import pandas as pd
import pytest

from service.services.automl.tpot_trainer import TPOTConfig, TPOTResult, TPOTTrainer


class FakeFittedPipeline:
    def __init__(self, name="fake_pipeline"):
        self.name = name


class FakeTPOTEstimator:
    def __init__(self, **kwargs):
        self.init_kwargs = kwargs
        # set attributes TPOTTrainer expects after fit
        self.fitted_pipeline_ = FakeFittedPipeline()
        self.evaluated_individuals_ = pd.DataFrame([{"Individual": 1, "Generation": 0}])
        self.generations_completed_ = kwargs.get("generations", 0)

    def fit(self, X, y):
        # pretend to fit
        return self

    def score(self, X, y):
        # return deterministic score
        return 0.75


@pytest.fixture
def sample_dataframe():
    df = pd.DataFrame({
        "a": [1, 2, 3, 4],
        "b": [0.1, 0.2, 0.3, 0.4],
        "target": [0, 1, 0, 1],
    })
    return df


def test_train_classification_happy_path(monkeypatch, sample_dataframe):
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    # patch build_search_space_config to simple string and TPOTClassifier to fake
    import service.services.automl.tpot_trainer as tt

    monkeypatch.setattr(tt, "build_search_space_config", lambda task, override=None: "linear")
    monkeypatch.setattr(tt, "TPOTClassifier", FakeTPOTEstimator)

    result: TPOTResult = trainer.train(sample_dataframe, target_column="target", task="classification", payload=None)

    assert isinstance(result, TPOTResult)
    assert result.best_score == pytest.approx(0.75)
    assert result.fitted_pipeline is not None
    assert not result.evaluated_individuals.empty
    assert result.metric_name == cfg.metric


def test_train_raises_on_no_numeric_features(monkeypatch):
    cfg = TPOTConfig()
    trainer = TPOTTrainer(cfg)

    df = pd.DataFrame({"text": ["a", "b"], "target": [0, 1]})

    with pytest.raises(ValueError):
        trainer.train(df, target_column="target", task="classification", payload=None)
