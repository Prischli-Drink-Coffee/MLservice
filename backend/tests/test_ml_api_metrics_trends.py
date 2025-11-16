from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode, UserTypes
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.ml_api import ml_router


class _FakeRepo:
    async def list_training_metrics_trends(self, user_id, mode=None, limit: int = 50, session=None):
        now = datetime.now(timezone.utc)
        # produce 3 fake entries
        items = []
        for i in range(3):
            class TR:
                def __init__(self, id, created_at, metrics):
                    self.id = id
                    self.created_at = created_at
                    self.metrics = metrics
            tr = TR(uuid4(), now - timedelta(minutes=i), {
                "task": "classification",
                "accuracy": 0.8 + i * 0.01,
                "n_features": 3,
                "n_samples": 100 + i,
            })
            items.append((tr, 1 + i))
        if mode is not None:
            # Just validate that we can accept mode and ignore in fake
            assert isinstance(mode, ServiceMode)
        return items[:limit]


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=uuid4(), fingerprint=None, type=UserTypes.REGISTERED)


def _get_fake_repo():
    return _FakeRepo()


@pytest.fixture()
def app():
    app = FastAPI()
    app.dependency_overrides[check_auth] = _fake_auth
    # override repo provider
    from service.presentation.routers.ml_api.ml_api import get_training_repo as _get
    app.dependency_overrides[_get] = _get_fake_repo
    app.include_router(ml_router)
    yield app


def test_metrics_trends_basic(app):
    client = TestClient(app)
    r = client.get("/api/ml/v1/metrics/trends?limit=3")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 3
    for item in data:
        assert set(item.keys()) == {"run_id", "created_at", "version", "metrics"}
        assert isinstance(item["version"], int)
        if item["metrics"] is not None:
            assert "task" in item["metrics"]


def test_metrics_trends_with_mode_filter(app):
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/metrics/trends?mode={ServiceMode.TRAINING.value}")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
