import io
import uuid
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode, UserTypes
from service.presentation.routers.files_api.schemas import UploadResponse
from service.presentation.routers.ml_api import ml_api as ml_module
from service.presentation.routers.ml_api.ml_api import (
    get_file_repo,
    get_file_saver,
    get_training_repo,
    ml_router,
)


# ---- Fakes for dependency overrides ----
class _FakeSaver:
    async def save(self, user_id, mode, file_name, file_content: bytes):
        # emulate FileSaverService.save returning UploadResponse
        # map to /storage/uploads/<mode>/<file_name>
        url = f"/storage/uploads/{mode.value}/{file_name}"
        return UploadResponse(file_id=uuid.uuid4(), file_url=url)


class _FakeTrainingRepo:
    async def get_or_create_dataset_from_file(self, user_id, launch_id, mode, file_name, file_url):
        # minimal dataset-like object
        class _Obj:
            def __init__(self):
                self.id = uuid.uuid4()
                self.user_id = user_id
                self.launch_id = launch_id
                self.mode = mode
                self.name = file_name
                self.file_url = file_url
                self.created_at = datetime.now(UTC)

        return _Obj()


class _FakeFileRepo:
    pass


def _fake_auth() -> AuthProfile:
    # bypass real auth
    return AuthProfile(user_id=uuid.uuid4(), fingerprint=None, type=UserTypes.REGISTERED)


def test_dataset_upload_endpoint(tmp_path):
    app = FastAPI()
    app.include_router(ml_router)

    app.dependency_overrides[get_training_repo] = lambda: _FakeTrainingRepo()
    app.dependency_overrides[get_file_saver] = lambda: _FakeSaver()
    app.dependency_overrides[get_file_repo] = lambda: _FakeFileRepo()
    app.dependency_overrides[ml_module.check_auth] = _fake_auth

    client = TestClient(app)

    csv_bytes = b"x1,x2,target\n1,2,0\n2,3,1\n"
    files = {"file": ("dataset.csv", io.BytesIO(csv_bytes), "text/csv")}
    resp = client.post(
        "/api/ml/v1/datasets/upload", params={"mode": ServiceMode.LIPS.value}, files=files
    )

    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["file_url"].startswith("/storage/")
    assert data["name"] == "dataset.csv"
    assert data["mode"] == ServiceMode.LIPS.value
