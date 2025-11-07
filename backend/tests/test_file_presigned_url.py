from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.db.db_models import UserFile
from service.models.key_value import ServiceMode, UserTypes
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.ml_api import ml_router


class _FakeFileRepo:
    def __init__(self, record: UserFile):
        self._record = record

    async def fetch_user_file_by_id(self, user_id, file_id, session=None):
        if user_id == self._record.user_id and file_id == self._record.id:
            return self._record
        return None


class _FakeStorage:
    def __init__(self, presigned: str | None):
        self._presigned = presigned

    def build_file_path(self, folder: str, mode: str, file_name: str) -> str:
        return f"{folder}/{mode}/{file_name}"

    async def upload_file(self, *, file_key: str, file_data: bytes) -> str:
        return f"/abs/{file_key}"

    async def delete_file(self, *, file_key: str) -> None:
        pass

    async def get_presigned_url(self, *, file_key: str, expiry_sec: int = 3600) -> str:
        if not self._presigned:
            raise RuntimeError("no presigned available")
        return self._presigned


class _FakeSaver:
    def __init__(self, storage):
        self.storage = storage

    async def get_presigned_url_by_key(self, *, file_key: str, expiry_sec: int = 3600):
        getter = getattr(self.storage, "get_presigned_url")
        return await getter(file_key=file_key, expiry_sec=expiry_sec)


def _build_app(presigned: str | None):
    app = FastAPI()
    from service.presentation.routers.ml_api.ml_api import get_file_repo, get_file_saver

    # Prepare fake record
    user_id = uuid4()
    def _auth():
        return AuthProfile(user_id=user_id, fingerprint=None, type=UserTypes.REGISTERED)
    app.dependency_overrides[check_auth] = _auth
    file_id = uuid4()
    record = UserFile(
        id=file_id,
        user_id=user_id,
        mode=ServiceMode.LIPS,
        file_name="uploads/LIPS/abc.csv",
        file_url="/abs/uploads/LIPS/abc.csv",
    )

    app.dependency_overrides[get_file_repo] = lambda: _FakeFileRepo(record)
    app.dependency_overrides[get_file_saver] = lambda: _FakeSaver(_FakeStorage(presigned))
    app.include_router(ml_router)
    return app, record


def test_presigned_success():
    app, record = _build_app("http://presigned.example.com/temp")
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/files/{record.id}/download-url?expiry_sec=123")
    assert r.status_code == 200
    data = r.json()
    assert data["file_id"] == str(record.id)
    assert data["url"].startswith("http://presigned.example.com")
    assert data["expiry_sec"] == 123
    assert data["backend"] == "minio"


def test_presigned_fallback_local():
    app, record = _build_app(None)
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/files/{record.id}/download-url")
    assert r.status_code == 200
    data = r.json()
    assert data["url"] == record.file_url  # fallback
    assert data["backend"] == "local"
