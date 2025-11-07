from __future__ import annotations

from backend.service.models.ml_models import EdgeData, GraphLogic, NodeData

from ..core.graph import EdgeSpec, GraphDefinition, NodeInstanceSpec


def graph_logic_to_definition(graph_logic: GraphLogic) -> GraphDefinition:
    nodes = [
        NodeInstanceSpec(
            id=node.id,
            type=node.type,
            config=node.data or {},
            metadata={"position": node.position},
        )
        for node in graph_logic.nodes
    ]

    edges = [
        EdgeSpec(
            id=edge.id,
            source=edge.source,
            source_port=edge.sourceHandle,
            target=edge.target,
            target_port=edge.targetHandle,
        )
        for edge in graph_logic.edges
    ]

    return GraphDefinition(
        nodes=nodes,
        edges=edges,
        name=graph_logic.name,
        description=graph_logic.description,
        version=graph_logic.version,
    )
