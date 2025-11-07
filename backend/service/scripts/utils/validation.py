from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, validator


class NodeSchema(BaseModel):
    id: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    config: Dict[str, object] = Field(default_factory=dict)
    metadata: Dict[str, object] = Field(default_factory=dict)


class EdgeSchema(BaseModel):
    id: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    source_port: str = Field(..., min_length=1)
    target: str = Field(..., min_length=1)
    target_port: str = Field(..., min_length=1)


class GraphSchema(BaseModel):
    name: Optional[str]
    description: Optional[str]
    version: int = 1
    nodes: List[NodeSchema] = Field(default_factory=list)
    edges: List[EdgeSchema] = Field(default_factory=list)

    @validator("edges", each_item=True)
    def ensure_unique_edge(cls, edge: EdgeSchema, values):
        nodes = {node.id for node in values.get("nodes", [])}
        if edge.source not in nodes:
            raise ValueError(f"Edge {edge.id} refers to missing source node {edge.source}")
        if edge.target not in nodes:
            raise ValueError(f"Edge {edge.id} refers to missing target node {edge.target}")
        return edge
