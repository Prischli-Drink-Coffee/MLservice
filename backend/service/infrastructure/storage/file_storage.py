from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4

from service.scripts.core.envelope import (
    DataEnvelope,
    DataKind,
    MediaAsset,
    StoragePointer,
)


@dataclass(frozen=True)
class FileStorageConfig:
    base_dir: Path
    archive_dir: Optional[Path] = None

    @classmethod
    def from_env(cls) -> "FileStorageConfig":
        base = Path(os.getenv("STORAGE_ROOT", "/var/lib/app/storage"))
        archive = os.getenv("STORAGE_ARCHIVE")
        return cls(base_dir=base, archive_dir=Path(archive) if archive else None)


class FileStorageService:
    """Простое файловое хранилище для вложений DataEnvelope."""

    def __init__(self, config: FileStorageConfig) -> None:
        self._config = config
        self._base_dir = config.base_dir
        self._base_dir.mkdir(parents=True, exist_ok=True)
        if config.archive_dir:
            config.archive_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    def save_bytes(
        self,
        *,
        kind: DataKind,
        data: bytes,
        bot_id: Optional[str] = None,
        job_id: Optional[str] = None,
        hint: Optional[str] = None,
    ) -> StoragePointer:
        storage_id = uuid4().hex
        bot_segment = bot_id or "bot-unknown"
        job_segment = job_id or datetime.utcnow().strftime("%Y%m%d")
        hint_segment = hint or kind.value
        filename = f"{storage_id}-{hint_segment}"

        directory = self._base_dir / bot_segment / job_segment
        directory.mkdir(parents=True, exist_ok=True)

        file_path = directory / filename
        with file_path.open("wb") as f:
            f.write(data)

        checksum = hashlib.sha256(data).hexdigest()
        return StoragePointer(
            storage_id=storage_id,
            relative_path=str(file_path.relative_to(self._base_dir)),
            checksum=checksum,
            size=len(data),
        )

    def resolve_path(self, pointer: StoragePointer) -> Path:
        return self._base_dir / pointer.relative_path

    def read_bytes(self, pointer: StoragePointer) -> bytes:
        return self.resolve_path(pointer).read_bytes()

    def mark_for_archive(self, pointer: StoragePointer) -> None:
        if not self._config.archive_dir:
            return
        source = self.resolve_path(pointer)
        destination = self._config.archive_dir / pointer.relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.exists():
            destination.write_bytes(source.read_bytes())
            source.unlink(missing_ok=True)

    # ------------------------------------------------------------------
    def persist_attachments(
        self,
        envelope: DataEnvelope,
        *,
        bot_id: Optional[str] = None,
        job_id: Optional[str] = None,
    ) -> DataEnvelope:
        """Сохраняет вложения на диск и возвращает Envelope с ссылками."""
        stored_assets: list[MediaAsset] = []
        for asset in envelope.attachments:
            if asset.storage is not None:
                stored_assets.append(asset)
                continue
            if asset.data is None:
                stored_assets.append(asset)
                continue

            if isinstance(asset.data, str):
                raw = asset.data.encode("utf-8")
            else:
                raw = bytes(asset.data)

            pointer = self.save_bytes(
                kind=asset.kind,
                data=raw,
                bot_id=bot_id,
                job_id=job_id,
                hint=asset.mime_type or asset.kind.value,
            )
            stored_assets.append(
                MediaAsset(
                    kind=asset.kind,
                    data=None,
                    mime_type=asset.mime_type,
                    size=pointer.size,
                    duration=asset.duration,
                    width=asset.width,
                    height=asset.height,
                    storage=pointer,
                    extra=asset.extra,
                )
            )
        return envelope.replace_attachments(stored_assets)
