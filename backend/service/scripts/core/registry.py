from __future__ import annotations

import importlib
import inspect
import pkgutil
from dataclasses import dataclass
from typing import Dict, Iterable, Optional, Type

from .errors import RegistryError
from .node import BaseNode, NodeMeta


@dataclass(slots=True)
class NodeDescriptor:
    type_name: str
    meta: NodeMeta
    node_cls: Type[BaseNode]

    def to_dict(self) -> dict:
        return {
            "type": self.type_name,
            "name": self.meta.name,
            "category": self.meta.category,
            "description": self.meta.description,
            "version": self.meta.version,
            "icon": self.meta.icon,
            "tags": list(self.meta.tags),
        }


class NodeRegistry:
    """In-memory registry of available node types."""

    def __init__(self) -> None:
        self._nodes: Dict[str, NodeDescriptor] = {}

    # ------------------------------------------------------------------
    # Registration API
    # ------------------------------------------------------------------
    def register(self, node_cls: Type[BaseNode]) -> None:
        if not inspect.isclass(node_cls) or not issubclass(node_cls, BaseNode):
            raise RegistryError(f"Cannot register {node_cls!r}: expected BaseNode subclass")

        descriptor = NodeDescriptor(
            type_name=node_cls.type_name or node_cls.__name__,
            meta=node_cls.get_meta(),
            node_cls=node_cls,
        )
        self._nodes[descriptor.type_name] = descriptor

    def register_many(self, node_classes: Iterable[Type[BaseNode]]) -> None:
        for node_cls in node_classes:
            self.register(node_cls)

    def types(self) -> Iterable[str]:
        return tuple(self._nodes.keys())

    def descriptors(self) -> Iterable[NodeDescriptor]:
        return tuple(self._nodes.values())

    def get(self, type_name: str) -> Type[BaseNode]:
        if type_name not in self._nodes:
            raise RegistryError(f"Node type '{type_name}' is not registered")
        return self._nodes[type_name].node_cls

    def create(
        self, type_name: str, *, config: Optional[dict] = None, node_id: Optional[str] = None
    ) -> BaseNode:
        node_cls = self.get(type_name)
        return node_cls(node_id=node_id, config=config)

    def describe(self) -> Dict[str, dict]:
        return {name: descriptor.to_dict() for name, descriptor in self._nodes.items()}

    # ------------------------------------------------------------------
    # Discovery utilities
    # ------------------------------------------------------------------
    def discover(self, package: str) -> int:
        """Recursively import modules and auto-register BaseNode subclasses."""

        count = 0
        module = importlib.import_module(package)
        package_path = getattr(module, "__path__", None)
        if not package_path:
            return 0

        for finder, name, is_pkg in pkgutil.walk_packages(package_path, module.__name__ + "."):
            imported = importlib.import_module(name)
            for attr_name in dir(imported):
                attr = getattr(imported, attr_name)
                if inspect.isclass(attr) and issubclass(attr, BaseNode) and attr is not BaseNode:
                    self.register(attr)
                    count += 1
        return count


registry = NodeRegistry()


def register_builtin_nodes() -> None:
    from service.scripts.nodes import langchain  # noqa: F401
    from service.scripts.nodes import ai, control_flow, system, telegram  # noqa: F401

    registry.discover("service.scripts.nodes")
