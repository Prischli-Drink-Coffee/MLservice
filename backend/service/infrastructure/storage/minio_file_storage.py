import os

from .abstract_file_storage import AbstractFileStorage


class MinioFileStorage(AbstractFileStorage):
    """S3/MinIO backend. Requires `minio` package if actually used.

    Env vars:
      - MINIO_ENDPOINT (host:port)
      - MINIO_BUCKET
      - MINIO_ACCESS_KEY
      - MINIO_SECRET_KEY
      - MINIO_SECURE ("1"/"true" for TLS)
      - STORAGE_PREFIX (optional key prefix)
    """

    def __init__(self) -> None:
        try:
            from minio import Minio  # type: ignore
        except Exception as e:  # noqa: BLE001
            raise RuntimeError(
                "Minio client not installed. Please `pip install minio` to use MinioFileStorage"
            ) from e

        endpoint = os.getenv("MINIO_ENDPOINT")
        bucket = os.getenv("MINIO_BUCKET")
        access = os.getenv("MINIO_ACCESS_KEY")
        secret = os.getenv("MINIO_SECRET_KEY")
        secure = os.getenv("MINIO_SECURE", "0").strip().lower() in {"1", "true", "yes", "on"}
        if not all([endpoint, bucket, access, secret]):
            raise RuntimeError("Missing MinIO configuration envs")

        self._bucket = bucket  # type: ignore[arg-type]
        self._prefix = os.getenv("STORAGE_PREFIX", "")
        self._client = Minio(endpoint, access_key=access, secret_key=secret, secure=secure)
        # Ensure bucket exists (idempotent)
        if not self._client.bucket_exists(self._bucket):
            self._client.make_bucket(self._bucket)

    def build_file_path(self, folder: str, mode: str, file_name: str) -> str:
        key = f"{folder}/{mode}/{file_name}"
        if self._prefix:
            return f"{self._prefix.rstrip('/')}/{key}"
        return key

    async def upload_file(self, *, file_key: str, file_data: bytes) -> str:
        # Use in-memory bytes upload
        from io import BytesIO

        data = BytesIO(file_data)
        length = len(file_data)
        self._client.put_object(self._bucket, file_key, data, length)
        # Return s3:// style url placeholder
        return f"s3://{self._bucket}/{file_key}"

    async def delete_file(self, *, file_key: str) -> None:  # pragma: no cover - simple pass-through
        try:
            self._client.remove_object(self._bucket, file_key)
        except Exception:
            # Non-fatal for cleanup flows
            pass
