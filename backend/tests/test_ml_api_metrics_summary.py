from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode, UserTypes
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.ml_api import ml_router


class _FakeRepo:
    async def list_training_metrics_trends(
        self,
        user_id,
        mode=None,
        limit: int = 50,
        dataset_id=None,
        target_column=None,
        session=None,
    ):
        now = datetime.now(timezone.utc)
        # Two classification, one regression
        items = []
        class TR:
            def __init__(self, id, created_at, metrics):
                self.id = id
                self.created_at = created_at
                self.metrics = metrics
        # classification runs
        items.append((TR(uuid4(), now - timedelta(minutes=1), {
            "task": "classification", "accuracy": 0.8, "n_features": 3, "n_samples": 120
        }), 1))
        items.append((TR(uuid4(), now - timedelta(minutes=2), {
            "task": "classification", "accuracy": 0.9, "n_features": 3, "n_samples": 125
        }), 2))
        # regression run
        items.append((TR(uuid4(), now - timedelta(minutes=3), {
            "task": "regression", "r2": 0.4, "mse": 1.2, "n_features": 2, "n_samples": 110
        }), 3))
        return items[:limit]


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=uuid4(), fingerprint=None, type=UserTypes.REGISTERED)


def _get_fake_repo():
    return _FakeRepo()


def _build_app():
    app = FastAPI()
    app.dependency_overrides[check_auth] = _fake_auth
    from service.presentation.routers.ml_api.ml_api import get_training_repo as _get
    app.dependency_overrides[_get] = _get_fake_repo
    app.include_router(ml_router)
    return app


def test_metrics_summary_aggregates():
    app = _build_app()
    client = TestClient(app)
    r = client.get("/api/ml/v1/metrics/summary")
    assert r.status_code == 200, r.text
    data = r.json()
    assert set(data.keys()) == {"aggregates", "trends"}
    agg = data["aggregates"]
    assert agg["count"] == 3
    # accuracy average (0.8 + 0.9)/2 = 0.85
    assert abs(agg["avg_accuracy"] - 0.85) < 1e-6
    # regression averages
    assert agg["avg_r2"] == 0.4
    assert abs(agg["avg_mse"] - 1.2) < 1e-6
    # bests
    assert agg["best_accuracy"] == 0.9
    assert agg["best_r2"] == 0.4
    assert agg["best_mse"] == 1.2
    # counts per task
    assert agg["classification_count"] == 2
    assert agg["regression_count"] == 1
    assert len(data["trends"]) == 3


def test_metrics_summary_with_mode_filter():
    app = _build_app()
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/metrics/summary?mode={ServiceMode.TRAINING.value}")
    assert r.status_code == 200
    data = r.json()
    assert data["aggregates"]["count"] == 3  # fake repo ignores mode but endpoint handles param
