from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Iterable, Optional, Set

from .envelope import DataEnvelope, DataKind

PortValidator = Callable[[DataEnvelope], bool]


@dataclass(slots=True)
class BasePort:
    """Base description for input/output ports."""

    name: str
    kinds: Set[DataKind] = field(default_factory=lambda: {DataKind.JSON})
    description: str = ""
    required: bool = True

    def accepts(self, envelope: DataEnvelope) -> bool:
        return not self.kinds or envelope.kind in self.kinds


@dataclass(slots=True)
class InputPort(BasePort):
    """Input port definition."""

    multiple: bool = False
    default: Optional[DataEnvelope] = None
    validator: Optional[PortValidator] = None

    def validate(self, value: DataEnvelope) -> bool:
        if self.validator and not self.validator(value):
            return False
        return self.accepts(value)


@dataclass(slots=True)
class OutputPort(BasePort):
    """Output port definition."""

    def __post_init__(self) -> None:
        # Outputs do not require default, always optional
        self.required = False


def ensure_envelope(value: Any, *, port_name: str) -> DataEnvelope:
    if isinstance(value, DataEnvelope):
        return value
    raise TypeError(f"Port '{port_name}' expects DataEnvelope, got {type(value)!r}")


def ensure_collection(values: Iterable[DataEnvelope], *, port_name: str) -> list[DataEnvelope]:
    result: list[DataEnvelope] = []
    for idx, value in enumerate(values):
        if not isinstance(value, DataEnvelope):
            raise TypeError(
                f"Port '{port_name}' expects DataEnvelope collection, element {idx} has type {type(value)!r}"
            )
        result.append(value)
    return result
