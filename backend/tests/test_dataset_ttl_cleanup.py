from uuid import uuid4

FIXED_ADMIN_ID = uuid4()

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import UserTypes
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.ml_api import ml_router


class _FakeRepo:
    def __init__(self, keys):
        self._keys = keys

    async def cleanup_expired_datasets(self, *, cutoff, limit, session=None):
        # ignore cutoff/limit in fake; return keys as expired
        return list(self._keys)[:limit]


class _FakeStorage:
    def __init__(self):
        self.deleted = []

    async def delete_file(self, *, file_key: str):
        self.deleted.append(file_key)


class _FakeSaver:
    def __init__(self, storage):
        self.storage = storage


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=FIXED_ADMIN_ID, fingerprint=None, type=UserTypes.REGISTERED)


def _get_fake_repo(keys):
    return lambda: _FakeRepo(keys)


def _get_fake_saver(storage):
    return lambda: _FakeSaver(storage)


def _build_app(keys):
    app = FastAPI()
    app.dependency_overrides[check_auth] = _fake_auth
    from service.presentation.routers.ml_api.ml_api import get_file_saver, get_training_repo

    # Ensure the fake user is present in admin list for tests that require admin access.
    from service.settings import config as _config
    _config.admin_user_ids = [str(FIXED_ADMIN_ID)]

    storage = _FakeStorage()
    app.dependency_overrides[get_training_repo] = _get_fake_repo(keys)
    app.dependency_overrides[get_file_saver] = _get_fake_saver(storage)
    app.include_router(ml_router)
    return app, storage


def test_ttl_cleanup_deletes_files_and_reports():
    keys = ["uploads/TRAINING/a.csv", "uploads/TRAINING/b.csv", "uploads/TRAINING/c.csv"]
    app, storage = _build_app(keys)
    client = TestClient(app)

    r = client.delete("/api/ml/v1/datasets/expired?limit=2")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["deleted"] == 2
    assert data["files_removed"] == 2
    assert data["files_missing"] == 0
    assert len(storage.deleted) == 2
