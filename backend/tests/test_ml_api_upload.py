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
        masked = f"uploads/{mode.value}/{uuid.uuid4().hex}.csv"
        url = f"/storage/{masked}"
        return UploadResponse(file_id=uuid.uuid4(), file_url=url, file_key=masked)


class _FakeTrainingRepo:
    async def get_or_create_dataset_from_file(
        self, user_id, launch_id, mode, *, display_name, storage_key, file_url
    ):
        # minimal dataset-like object
        class _Obj:
            def __init__(self):
                self.id = uuid.uuid4()
                self.user_id = user_id
                self.launch_id = launch_id
                self.mode = mode
                self.name = display_name
                self.storage_key = storage_key
                self.file_url = file_url
                self.version = 3  # simulate next version
                self.created_at = datetime.now(UTC)

        return _Obj()


class _FakeFileRepo:
    def __init__(self, file_name: str | None = None, file_url: str | None = None):
        self._file_name = file_name
        self._file_url = file_url or (f"/storage/{file_name}" if file_name else None)

    async def fetch_user_file_by_id(self, user_id, dataset_id):  # noqa: D401
        # emulate repository layer returning stored metadata for dataset_id
        if not self._file_name:
            return None

        class _UserFile:
            def __init__(self, name: str, url: str | None):
                self.file_name = name
                self.file_url = url

        return _UserFile(self._file_name, self._file_url)

    async def fetch_user_file_by_name(self, user_id, file_name):  # noqa: D401
        if not self._file_name or file_name != self._file_name:
            return None

        class _UserFile:
            def __init__(self, name: str, url: str | None):
                self.file_name = name
                self.file_url = url

        return _UserFile(self._file_name, self._file_url)


class _FakeSaverWithPresign(_FakeSaver):
    async def get_presigned_url_by_key(self, file_key, expiry_sec=3600):  # noqa: D401
        return f"https://example.com/{file_key}?expires={expiry_sec}" if file_key else None


class _FakeTrainingRepoWithDatasets(_FakeTrainingRepo):
    async def list_datasets(self, user_id, limit=20):  # noqa: D401
        class _Dataset:
            def __init__(self):
                self.id = uuid.uuid4()
                self.user_id = user_id
                self.launch_id = uuid.uuid4()
                self.mode = ServiceMode.TRAINING
                self.name = "dataset.csv"
                self.storage_key = "uploads/TRAINING/masked.csv"
                self.file_url = f"/storage/{self.storage_key}"
                self.version = 1
                self.created_at = datetime.now(UTC)

        return [_Dataset()]


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
        "/api/ml/v1/datasets/upload", params={"mode": ServiceMode.TRAINING.value}, files=files
    )

    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["file_url"].startswith("/storage/")
    assert data["name"] == "dataset.csv"
    assert data["mode"] == ServiceMode.TRAINING.value
    assert data["version"] == 3


def test_list_datasets_returns_presigned_url():
    app = FastAPI()
    app.include_router(ml_router)

    training_repo = _FakeTrainingRepoWithDatasets()
    file_repo = _FakeFileRepo(file_name="uploads/TRAINING/masked.csv")
    saver = _FakeSaverWithPresign()

    app.dependency_overrides[get_training_repo] = lambda: training_repo
    app.dependency_overrides[get_file_saver] = lambda: saver
    app.dependency_overrides[get_file_repo] = lambda: file_repo
    app.dependency_overrides[ml_module.check_auth] = _fake_auth

    client = TestClient(app)
    resp = client.get("/api/ml/v1/datasets", params={"limit": 10})

    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert len(payload) == 1
    dataset = payload[0]
    assert dataset["mode"] == ServiceMode.TRAINING.value
    assert dataset["download_url"].startswith("https://example.com/uploads/TRAINING/masked.csv")
    assert dataset["version"] == 1
