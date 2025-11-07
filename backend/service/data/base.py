from __future__ import annotations

import base64
import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any, Dict, List, Optional, Union


class DataType(StrEnum):
    """Supported data types in the system"""

    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    JSON = "json"
    BINARY = "binary"
    MULTIMODAL = "multimodal"


@dataclass
class MediaMetadata:
    """Metadata for media files"""

    filename: Optional[str] = None
    mime_type: Optional[str] = None
    size: Optional[int] = None
    duration: Optional[float] = None  # For audio/video
    dimensions: Optional[tuple[int, int]] = None  # For images/video
    format: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "filename": self.filename,
            "mime_type": self.mime_type,
            "size": self.size,
            "duration": self.duration,
            "dimensions": self.dimensions,
            "format": self.format,
        }


@dataclass
class TelegramContext:
    """Telegram-specific context information"""

    chat_id: Optional[int] = None
    user_id: Optional[int] = None
    message_id: Optional[int] = None
    username: Optional[str] = None
    chat_type: Optional[str] = None
    bot_id: Optional[str] = None
    is_group: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chat_id": self.chat_id,
            "user_id": self.user_id,
            "message_id": self.message_id,
            "username": self.username,
            "chat_type": self.chat_type,
            "bot_id": self.bot_id,
            "is_group": self.is_group,
        }


@dataclass
class DataPayload:
    """Unified data structure for all node communications"""

    data_type: DataType
    content: Any
    metadata: Dict[str, Any] = field(default_factory=dict)
    media_metadata: Optional[MediaMetadata] = None
    telegram_context: Optional[TelegramContext] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    payload_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    @classmethod
    def text(cls, content: str, **kwargs) -> DataPayload:
        """Create text payload"""
        return cls(data_type=DataType.TEXT, content=content, **kwargs)

    @classmethod
    def image(
        cls, content: Union[bytes, str], metadata: Optional[MediaMetadata] = None, **kwargs
    ) -> DataPayload:
        """Create image payload"""
        return cls(data_type=DataType.IMAGE, content=content, media_metadata=metadata, **kwargs)

    @classmethod
    def audio(
        cls, content: Union[bytes, str], metadata: Optional[MediaMetadata] = None, **kwargs
    ) -> DataPayload:
        """Create audio payload"""
        return cls(data_type=DataType.AUDIO, content=content, media_metadata=metadata, **kwargs)

    @classmethod
    def video(
        cls, content: Union[bytes, str], metadata: Optional[MediaMetadata] = None, **kwargs
    ) -> DataPayload:
        """Create video payload"""
        return cls(data_type=DataType.VIDEO, content=content, media_metadata=metadata, **kwargs)

    @classmethod
    def json(cls, content: Any, **kwargs) -> DataPayload:
        """Create JSON payload"""
        return cls(data_type=DataType.JSON, content=content, **kwargs)

    @classmethod
    def multimodal(cls, content: List[DataPayload], **kwargs) -> DataPayload:
        """Create multimodal payload containing multiple data types"""
        return cls(data_type=DataType.MULTIMODAL, content=content, **kwargs)

    @classmethod
    def from_telegram_update(cls, update: Dict[str, Any]) -> DataPayload:
        """Create payload from Telegram update"""
        telegram_ctx = TelegramContext()
        content_items = []

        # Extract message
        message = update.get("message") or update.get("edited_message")
        if message:
            telegram_ctx.chat_id = message.get("chat", {}).get("id")
            telegram_ctx.user_id = message.get("from", {}).get("id")
            telegram_ctx.message_id = message.get("message_id")
            telegram_ctx.username = message.get("from", {}).get("username")
            telegram_ctx.chat_type = message.get("chat", {}).get("type")
            telegram_ctx.is_group = telegram_ctx.chat_type in ["group", "supergroup"]

            # Text content
            if text := message.get("text"):
                content_items.append(cls.text(text, telegram_context=telegram_ctx))

            # Photo content
            if photo := message.get("photo"):
                largest_photo = max(photo, key=lambda x: x.get("file_size", 0))
                file_id = largest_photo.get("file_id")
                metadata = MediaMetadata(
                    mime_type="image/jpeg",
                    size=largest_photo.get("file_size"),
                    dimensions=(largest_photo.get("width"), largest_photo.get("height")),
                )
                content_items.append(
                    cls.image(file_id, metadata=metadata, telegram_context=telegram_ctx)
                )

            # Voice content
            if voice := message.get("voice"):
                file_id = voice.get("file_id")
                metadata = MediaMetadata(
                    mime_type=voice.get("mime_type", "audio/ogg"),
                    size=voice.get("file_size"),
                    duration=voice.get("duration"),
                )
                content_items.append(
                    cls.audio(file_id, metadata=metadata, telegram_context=telegram_ctx)
                )

            # Video content
            if video := message.get("video"):
                file_id = video.get("file_id")
                metadata = MediaMetadata(
                    mime_type=video.get("mime_type", "video/mp4"),
                    size=video.get("file_size"),
                    duration=video.get("duration"),
                    dimensions=(video.get("width"), video.get("height")),
                )
                content_items.append(
                    cls.video(file_id, metadata=metadata, telegram_context=telegram_ctx)
                )

        # If multiple content types, create multimodal payload
        if len(content_items) > 1:
            return cls.multimodal(content_items, telegram_context=telegram_ctx)
        elif len(content_items) == 1:
            return content_items[0]
        else:
            # Fallback to raw update data
            return cls.json(update, telegram_context=telegram_ctx)

    def to_dict(self) -> Dict[str, Any]:
        """Convert payload to dictionary for serialization"""
        result = {
            "data_type": self.data_type.value,
            "content": self._serialize_content(),
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "payload_id": self.payload_id,
        }

        if self.media_metadata:
            result["media_metadata"] = self.media_metadata.to_dict()

        if self.telegram_context:
            result["telegram_context"] = self.telegram_context.to_dict()

        return result

    def _serialize_content(self) -> Any:
        """Serialize content based on type"""
        if self.data_type == DataType.BINARY:
            if isinstance(self.content, bytes):
                return base64.b64encode(self.content).decode("utf-8")
        elif self.data_type == DataType.MULTIMODAL:
            if isinstance(self.content, list):
                return [
                    item.to_dict() if isinstance(item, DataPayload) else item
                    for item in self.content
                ]

        return self.content

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> DataPayload:
        """Create payload from dictionary"""
        data_type = DataType(data["data_type"])

        # Deserialize content
        content = data["content"]
        if data_type == DataType.BINARY and isinstance(content, str):
            content = base64.b64decode(content.encode("utf-8"))
        elif data_type == DataType.MULTIMODAL and isinstance(content, list):
            content = [
                cls.from_dict(item) if isinstance(item, dict) and "data_type" in item else item
                for item in content
            ]

        # Deserialize metadata objects
        media_metadata = None
        if "media_metadata" in data and data["media_metadata"]:
            media_metadata = MediaMetadata(**data["media_metadata"])

        telegram_context = None
        if "telegram_context" in data and data["telegram_context"]:
            telegram_context = TelegramContext(**data["telegram_context"])

        return cls(
            data_type=data_type,
            content=content,
            metadata=data.get("metadata", {}),
            media_metadata=media_metadata,
            telegram_context=telegram_context,
            created_at=datetime.fromisoformat(data["created_at"]),
            payload_id=data["payload_id"],
        )

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict())

    def get_text_content(self) -> Optional[str]:
        """Extract text content from payload"""
        if self.data_type == DataType.TEXT:
            return str(self.content)
        elif self.data_type == DataType.MULTIMODAL:
            for item in self.content:
                if isinstance(item, DataPayload) and item.data_type == DataType.TEXT:
                    return str(item.content)
        return None

    def get_media_items(self) -> List[DataPayload]:
        """Extract media items from payload"""
        if self.data_type in [DataType.IMAGE, DataType.AUDIO, DataType.VIDEO]:
            return [self]
        elif self.data_type == DataType.MULTIMODAL:
            return [
                item
                for item in self.content
                if isinstance(item, DataPayload)
                and item.data_type in [DataType.IMAGE, DataType.AUDIO, DataType.VIDEO]
            ]
        return []

    def has_telegram_context(self) -> bool:
        """Check if payload has Telegram context"""
        return self.telegram_context is not None

    def __str__(self) -> str:
        return f"DataPayload({self.data_type.value}: {type(self.content).__name__})"

    def __repr__(self) -> str:
        return f"DataPayload(data_type={self.data_type.value}, payload_id={self.payload_id})"
