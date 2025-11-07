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
        # Use in-memory bytes upload with simple retries
        import asyncio
        from io import BytesIO

        attempts = int(os.getenv("MINIO_RETRY_ATTEMPTS", "3"))
        backoff_base = float(os.getenv("MINIO_RETRY_BACKOFF", "0.5"))
        last_exc: Exception | None = None
        for i in range(max(1, attempts)):
            try:
                data = BytesIO(file_data)
                length = len(file_data)
                self._client.put_object(self._bucket, file_key, data, length)
                return f"s3://{self._bucket}/{file_key}"
            except Exception as e:  # noqa: BLE001
                last_exc = e
                if i < attempts - 1:
                    await asyncio.sleep(backoff_base * (2**i))
                else:
                    raise

        # Should not reach here
        if last_exc:
            raise last_exc
        return f"s3://{self._bucket}/{file_key}"

    async def delete_file(self, *, file_key: str) -> None:  # pragma: no cover - simple pass-through
        import asyncio

        attempts = int(os.getenv("MINIO_RETRY_ATTEMPTS", "3"))
        backoff_base = float(os.getenv("MINIO_RETRY_BACKOFF", "0.5"))
        for i in range(max(1, attempts)):
            try:
                self._client.remove_object(self._bucket, file_key)
                return
            except Exception:
                if i < attempts - 1:
                    await asyncio.sleep(backoff_base * (2**i))
                else:
                    # Non-fatal for cleanup flows
                    return

    async def get_presigned_url(self, *, file_key: str, expiry_sec: int = 3600) -> str:
        from datetime import timedelta

        # minio client returns a temporary HTTP URL
        try:
            url = self._client.presigned_get_object(
                self._bucket, file_key, expires=timedelta(seconds=max(1, int(expiry_sec)))
            )
            return url
        except Exception:  # noqa: BLE001
            # Fallback to s3:// style reference if presign fails
            return f"s3://{self._bucket}/{file_key}"
