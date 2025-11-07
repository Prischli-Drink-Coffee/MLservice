from __future__ import annotations

import asyncio
import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional

from .envelope import DataEnvelope
from .errors import ExecutionCancelled, NodeExecutionError
from .graph import CompiledGraph
from .node import BaseNode, NodeContext

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class ExecutionLayer:
    nodes: List[str]


@dataclass(slots=True)
class ExecutionPlan:
    compiled: CompiledGraph
    layers: List[ExecutionLayer]

    @classmethod
    def build(cls, compiled: CompiledGraph) -> "ExecutionPlan":
        in_degree: Dict[str, int] = {node_id: 0 for node_id in compiled.nodes}
        for edges in compiled.forward_edges.values():
            for edge in edges:
                in_degree[edge.target] += 1

        queue: deque[str] = deque(node_id for node_id, deg in in_degree.items() if deg == 0)
        layers: List[ExecutionLayer] = []

        while queue:
            layer_nodes = list(queue)
            layers.append(ExecutionLayer(nodes=layer_nodes.copy()))
            for _ in range(len(layer_nodes)):
                node_id = queue.popleft()
                for edge in compiled.downstream(node_id):
                    in_degree[edge.target] -= 1
                    if in_degree[edge.target] == 0:
                        queue.append(edge.target)

        return cls(compiled=compiled, layers=layers)


class ExecutionContext:
    def __init__(self, compiled: CompiledGraph, *, timeout: Optional[float] = None) -> None:
        self.compiled = compiled
        self.timeout = timeout
        self._results: Dict[str, Dict[str, DataEnvelope]] = {}
        self._errors: Dict[str, Exception] = {}
        self._initial_inputs: Dict[str, Dict[str, List[DataEnvelope]]] = defaultdict(dict)
        self._metrics: Dict[str, Dict[str, List]] = defaultdict(lambda: defaultdict(list))

    # ------------------------------------------------------------------
    def set_initial_inputs(self, mapping: Dict[str, Dict[str, Iterable[DataEnvelope]]]) -> None:
        for node_id, ports in mapping.items():
            port_mapping: Dict[str, List[DataEnvelope]] = {}
            for port_name, value in ports.items():
                if isinstance(value, DataEnvelope):
                    port_mapping[port_name] = [value]
                else:
                    port_mapping[port_name] = list(value)
            self._initial_inputs[node_id] = port_mapping

    # ------------------------------------------------------------------
    def emit_metric(self, node_id: str, key: str, value) -> None:
        self._metrics[node_id][key].append(value)

    def log(self, node_id: str, level: str, message: str, **extra) -> None:
        getattr(logger, level.lower(), logger.info)("[%s] %s", node_id, message, extra)

    # ------------------------------------------------------------------
    def record_result(self, node_id: str, outputs: Dict[str, DataEnvelope]) -> None:
        self._results[node_id] = outputs

    def record_error(self, node_id: str, error: Exception) -> None:
        self._errors[node_id] = error

    def results_for(self, node_id: str) -> Dict[str, DataEnvelope]:
        return self._results.get(node_id, {})

    def inputs_for(self, node_id: str) -> Dict[str, List[DataEnvelope]]:
        inputs: Dict[str, List[DataEnvelope]] = defaultdict(list)

        if node_id in self._initial_inputs:
            inputs.update(self._initial_inputs[node_id])

        for edge in self.compiled.backward_edges.get(node_id, []):
            source_outputs = self._results.get(edge.source, {})
            if edge.source_port in source_outputs:
                inputs[edge.target_port].append(source_outputs[edge.source_port])
        return inputs

    # ------------------------------------------------------------------
    @property
    def results(self) -> Dict[str, Dict[str, DataEnvelope]]:
        return self._results

    @property
    def errors(self) -> Dict[str, Exception]:
        return self._errors

    @property
    def metrics(self) -> Dict[str, Dict[str, List]]:
        return self._metrics


class AsyncScheduler:
    def __init__(self, *, concurrency: int = 32) -> None:
        self._concurrency = concurrency

    async def execute(
        self,
        plan: ExecutionPlan,
        *,
        initial_inputs: Optional[Dict[str, Dict[str, Iterable[DataEnvelope]]]] = None,
        timeout: Optional[float] = None,
    ) -> ExecutionContext:
        context = ExecutionContext(plan.compiled, timeout=timeout)
        if initial_inputs:
            context.set_initial_inputs(initial_inputs)

        semaphore = asyncio.Semaphore(self._concurrency)
        for layer in plan.layers:
            if not layer.nodes:
                continue
            tasks = []
            for node_id in layer.nodes:
                node = plan.compiled.nodes[node_id]
                inputs = context.inputs_for(node_id)
                tasks.append(
                    asyncio.create_task(
                        self._execute_node(semaphore, context, node, inputs),
                        name=f"node:{node_id}",
                    )
                )
            try:
                await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=False), timeout=timeout
                )
            except asyncio.TimeoutError as exc:
                raise ExecutionCancelled("Execution timed out") from exc
        return context

    async def _execute_node(
        self,
        semaphore: asyncio.Semaphore,
        context: ExecutionContext,
        node: BaseNode,
        raw_inputs: Dict[str, Iterable[DataEnvelope]],
    ) -> None:
        async with semaphore:
            try:
                prepared_inputs = node.prepare_inputs(raw_inputs)
                node_ctx = NodeContext(context, node.id, prepared_inputs)
                outputs = await node.run(node_ctx)
                context.record_result(node.id, outputs or {})
            except Exception as exc:  # pragma: no cover - runtime safety
                context.record_error(node.id, exc)
                logger.exception("Node %s failed: %s", node.id, exc)
                raise NodeExecutionError(f"Node {node.id} failed: {exc}") from exc
