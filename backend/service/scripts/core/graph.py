from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Set

from .errors import GraphValidationError
from .node import BaseNode
from .registry import NodeRegistry


@dataclass(slots=True)
class NodeInstanceSpec:
    id: str
    type: str
    config: dict = field(default_factory=dict)
    metadata: dict = field(default_factory=dict)


@dataclass(slots=True)
class EdgeSpec:
    id: str
    source: str
    source_port: str
    target: str
    target_port: str


@dataclass(slots=True)
class GraphDefinition:
    nodes: List[NodeInstanceSpec] = field(default_factory=list)
    edges: List[EdgeSpec] = field(default_factory=list)
    name: Optional[str] = None
    description: Optional[str] = None
    version: int = 1

    def node_ids(self) -> Set[str]:
        return {node.id for node in self.nodes}

    def adjacency(self) -> Dict[str, List[EdgeSpec]]:
        result: Dict[str, List[EdgeSpec]] = {node.id: [] for node in self.nodes}
        for edge in self.edges:
            result.setdefault(edge.source, []).append(edge)
        return result

    def reverse_adjacency(self) -> Dict[str, List[EdgeSpec]]:
        result: Dict[str, List[EdgeSpec]] = {node.id: [] for node in self.nodes}
        for edge in self.edges:
            result.setdefault(edge.target, []).append(edge)
        return result


@dataclass(slots=True)
class CompiledGraph:
    definition: GraphDefinition
    nodes: Dict[str, BaseNode]
    forward_edges: Dict[str, List[EdgeSpec]]
    backward_edges: Dict[str, List[EdgeSpec]]

    def upstream(self, node_id: str) -> List[EdgeSpec]:
        return self.backward_edges.get(node_id, [])

    def downstream(self, node_id: str) -> List[EdgeSpec]:
        return self.forward_edges.get(node_id, [])


class GraphCompiler:
    """Validates and instantiates graph definitions."""

    def __init__(self, registry: NodeRegistry) -> None:
        self._registry = registry

    def compile(self, definition: GraphDefinition) -> CompiledGraph:
        self._validate(definition)
        nodes = {
            spec.id: self._registry.create(spec.type, config=spec.config, node_id=spec.id)
            for spec in definition.nodes
        }
        return CompiledGraph(
            definition=definition,
            nodes=nodes,
            forward_edges=definition.adjacency(),
            backward_edges=definition.reverse_adjacency(),
        )

    # ------------------------------------------------------------------
    def _validate(self, definition: GraphDefinition) -> None:
        node_ids = definition.node_ids()
        if len(node_ids) != len(definition.nodes):
            raise GraphValidationError("Duplicate node identifiers detected")

        for edge in definition.edges:
            if edge.source not in node_ids:
                raise GraphValidationError(
                    f"Edge {edge.id} references missing source node {edge.source}"
                )
            if edge.target not in node_ids:
                raise GraphValidationError(
                    f"Edge {edge.id} references missing target node {edge.target}"
                )

        # Detect cycles using Kahn's algorithm
        in_degree: Dict[str, int] = {node.id: 0 for node in definition.nodes}
        for edge in definition.edges:
            in_degree[edge.target] += 1

        queue: List[str] = [node_id for node_id, degree in in_degree.items() if degree == 0]
        visited = 0
        adjacency = definition.adjacency()

        while queue:
            current = queue.pop(0)
            visited += 1
            for edge in adjacency.get(current, []):
                in_degree[edge.target] -= 1
                if in_degree[edge.target] == 0:
                    queue.append(edge.target)

        if visited != len(definition.nodes):
            raise GraphValidationError(
                "Graph contains cycles; explicit loop nodes are required for feedback paths"
            )

        # Validate port connections by instantiating nodes temporarily
        temp_nodes: Dict[str, BaseNode] = {}
        for spec in definition.nodes:
            temp_nodes[spec.id] = self._registry.create(
                spec.type, config=spec.config, node_id=spec.id
            )

        for edge in definition.edges:
            source_node = temp_nodes[edge.source]
            target_node = temp_nodes[edge.target]
            if edge.source_port not in source_node.outputs:
                raise GraphValidationError(
                    f"Edge {edge.id} references missing output port '{edge.source_port}' on node {edge.source}"
                )
            if edge.target_port not in target_node.inputs:
                raise GraphValidationError(
                    f"Edge {edge.id} references missing input port '{edge.target_port}' on node {edge.target}"
                )

            source_port = source_node.outputs[edge.source_port]
            target_port = target_node.inputs[edge.target_port]
            if target_port.kinds and not (target_port.kinds & source_port.kinds):
                raise GraphValidationError(
                    f"Port mismatch between {edge.source}:{edge.source_port} ({[k.value for k in source_port.kinds]})"
                    f" and {edge.target}:{edge.target_port} ({[k.value for k in target_port.kinds]})"
                )
