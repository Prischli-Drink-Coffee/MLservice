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
    def __init__(self):
        self.last_filters = None

    async def list_training_metrics_trends(
        self,
        user_id,
        mode=None,
        limit: int = 50,
        dataset_id=None,
        target_column=None,
        session=None,
    ):
        self.last_filters = {
            "mode": mode,
            "limit": limit,
            "dataset_id": dataset_id,
            "target_column": target_column,
        }
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
        return items[:limit]


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=uuid4(), fingerprint=None, type=UserTypes.REGISTERED)


_REPO_INSTANCE = _FakeRepo()


def _get_fake_repo():
    return _REPO_INSTANCE


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


def test_metrics_trends_with_dataset_and_target_filters(app):
    client = TestClient(app)
    dataset_id = uuid4()
    _REPO_INSTANCE.last_filters = None
    r = client.get(
        f"/api/ml/v1/metrics/trends?dataset_id={dataset_id}&target_column=price&limit=2"
    )
    assert r.status_code == 200
    assert len(r.json()) == 2
    assert _REPO_INSTANCE.last_filters is not None
    assert _REPO_INSTANCE.last_filters["dataset_id"] == dataset_id
    assert _REPO_INSTANCE.last_filters["target_column"] == "price"
