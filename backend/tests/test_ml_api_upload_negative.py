import io
import uuid
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode, UserTypes
from service.presentation.routers.ml_api import ml_api as ml_module
from service.presentation.routers.ml_api.ml_api import (
    get_file_repo,
    get_file_saver,
    get_training_repo,
    ml_router,
)


class _FakeSaver:
    async def save(self, user_id, mode, file_name, file_content: bytes):  # pragma: no cover
        # Should not be called in negative cases after validation fails
        raise AssertionError("Saver should not be invoked for invalid CSV uploads")


class _FakeTrainingRepo:
    async def get_or_create_dataset_from_file(
        self, user_id, launch_id, mode, *, display_name, storage_key, file_url
    ):  # pragma: no cover
        class _Obj:
            def __init__(self):
                self.id = uuid.uuid4()
                self.user_id = user_id
                self.launch_id = launch_id
                self.mode = mode
                self.name = display_name
                self.storage_key = storage_key
                self.file_url = file_url
                self.created_at = datetime.now(UTC)

        return _Obj()


class _FakeFileRepo:
    pass


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=uuid.uuid4(), fingerprint=None, type=UserTypes.REGISTERED)


def _build_app():
    app = FastAPI()
    app.include_router(ml_router)
    app.dependency_overrides[get_training_repo] = lambda: _FakeTrainingRepo()
    app.dependency_overrides[get_file_saver] = lambda: _FakeSaver()
    app.dependency_overrides[get_file_repo] = lambda: _FakeFileRepo()
    app.dependency_overrides[ml_module.check_auth] = _fake_auth
    return app


def _post(client: TestClient, content: bytes, name: str = "dataset.csv"):
    files = {"file": (name, io.BytesIO(content), "text/csv")}
    return client.post(
        "/api/ml/v1/datasets/upload", params={"mode": ServiceMode.TRAINING.value}, files=files
    )


def test_csv_too_large(monkeypatch):
    app = _build_app()
    client = TestClient(app)
    # Force small MAX_CSV_UPLOAD_BYTES
    monkeypatch.setenv("MAX_CSV_UPLOAD_BYTES", "10")  # 10 bytes
    resp = _post(client, b"x1,x2,target\n1,2,0\n")  # >10 bytes
    assert resp.status_code == 413
    assert "слишком" in resp.text.lower()


def test_csv_missing_header():
    app = _build_app()
    client = TestClient(app)
    # Content without header (first line empty)
    resp = _post(client, b"\n1,2,0\n2,3,1\n")
    assert resp.status_code == 400
    assert "заголовок" in resp.text.lower()


def test_csv_insufficient_rows(monkeypatch):
    app = _build_app()
    client = TestClient(app)
    monkeypatch.setenv("MIN_CSV_DATA_ROWS", "3")
    # Only 2 data rows
    resp = _post(client, b"a,b,c\n1,2,3\n4,5,6\n")
    assert resp.status_code == 400
    assert "недостаточно строк" in resp.text.lower()


def test_csv_excessive_empty_ratio(monkeypatch):
    app = _build_app()
    client = TestClient(app)
    monkeypatch.setenv("MAX_EMPTY_RATIO", "0.1")  # strict
    # Many empty cells -> high empty ratio
    # Provide >= MIN_CSV_DATA_ROWS (default 2) while keeping many empties
    resp = _post(client, b"a,b,c\n1,,\n2,,\n")
    assert resp.status_code == 400
    assert "пустых" in resp.text.lower()
