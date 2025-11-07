import asyncio
import logging
import time
from contextlib import suppress
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from service.models.ml_models import *
from service.presentation.routers.ml_api.schemas import *
from service.repositories.ml_repository import MLRepository
from service.settings import MLConfig

logger = logging.getLogger(__name__)


class MLService:

    def __init__(
        self,
        ml_repository: MLRepository,
        ml_config: MLConfig,
    ):
        self.ml_repository = ml_repository
        self._config = ml_config
        self._execution_tasks: dict[UUID, asyncio.Task] = {}

    def active_execution_ids(self) -> list[UUID]:
        """Вернуть идентификаторы активных фоновых выполнений."""

        return [
            execution_id for execution_id, task in self._execution_tasks.items() if not task.done()
        ]

    def _register_execution_task(self, execution_id: UUID, task: asyncio.Task) -> None:
        """Отслеживать фоновую задачу выполнения и снимать её с учёта по завершении."""

        self._execution_tasks[execution_id] = task

        def _cleanup(completed_task: asyncio.Task) -> None:
            # Удаляем задачу из реестра и логируем неожиданные ошибки
            self._execution_tasks.pop(execution_id, None)

            if completed_task.cancelled():
                logger.info("Execution task %s was cancelled", execution_id)
                return

            with suppress(Exception):
                exc = completed_task.exception()
                if exc:
                    logger.warning(
                        "Execution task %s completed with unhandled exception: %s",
                        execution_id,
                        exc,
                    )

        task.add_done_callback(_cleanup)

    def get_execution_task(self, execution_id: UUID) -> asyncio.Task | None:
        """Получить фоновую задачу по идентификатору выполнения."""

        return self._execution_tasks.get(execution_id)

    async def wait_for_execution(self, execution_id: UUID, timeout: float | None = None) -> bool:
        """Дождаться завершения выполнения графа. Возвращает True, если задача завершилась."""

        task = self._execution_tasks.get(execution_id)
        if not task:
            return False

        try:
            await asyncio.wait_for(asyncio.shield(task), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False

    async def shutdown(self, *, cancel_pending: bool = True) -> None:
        """Остановить сервис и дождаться завершения всех фоновых задач."""

        pending_items = list(self._execution_tasks.items())

        if not pending_items:
            return

        logger.info("Waiting for %d execution(s) to finish", len(pending_items))

        if cancel_pending:
            for _, task in pending_items:
                if not task.done():
                    task.cancel()

        results = await asyncio.gather(
            *(task for _, task in pending_items),
            return_exceptions=True,
        )

        for (execution_id, _), result in zip(pending_items, results):
            if isinstance(result, Exception) and not isinstance(result, asyncio.CancelledError):
                logger.warning(
                    "Execution %s concluded with exception during shutdown: %s",
                    execution_id,
                    result,
                )

        for execution_id, _ in pending_items:
            self._execution_tasks.pop(execution_id, None)

    async def create_ml_run(self, user_id: UUID, data: MLCreateSchema) -> MLResponseSchema:
        logger.info(f"Creating ML run '{data.name}' for user {user_id}")

        # Создать логическую модель
        ml_logic = MLLogic(
            user_id=user_id,
            name=data.name,
            description=data.description,
            parameters=data.parameters,
            is_active=data.is_active,
        )

    #     # Серверная валидация: ссылки рёбер на существующие ноды
    #     try:
    #         self._validate_edges(graph_logic.nodes, graph_logic.edges)
    #     except ValueError as exc:
    #         raise HTTPException(
    #             status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
    #         ) from exc

    #     # Сохранить в БД
    #     created_graph = await self.graph_repository.create_graph(graph_logic)

    #     return self._convert_to_response_schema(created_graph)

    # async def list_graphs(
    #     self, user_id: UUID, page: int, size: int, active_only: bool
    # ) -> GraphListResponseSchema:
    #     """Получить список графов пользователя"""
    #     logger.info(f"Listing graphs for user {user_id}, page={page}, size={size}")

    #     offset = (page - 1) * size
    #     graphs, total = await self.graph_repository.list_user_graphs(
    #         user_id=user_id, offset=offset, limit=size, active_only=active_only
    #     )

    #     return GraphListResponseSchema(
    #         graphs=[self._convert_to_response_schema(graph) for graph in graphs],
    #         total=total,
    #         page=page,
    #         size=size,
    #     )

    # async def get_graph(self, user_id: UUID, graph_id: UUID) -> GraphResponseSchema:
    #     """Получить граф по ID"""
    #     logger.info(f"Getting graph {graph_id} for user {user_id}")

    #     graph = await self.graph_repository.get_graph_by_id(user_id, graph_id)
    #     if not graph:
    #         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not found")

    #     return self._convert_to_response_schema(graph)

    # async def update_graph(
    #     self, user_id: UUID, graph_id: UUID, data: GraphUpdateSchema
    # ) -> GraphResponseSchema:
    #     """Обновить граф"""
    #     logger.info(f"Updating graph {graph_id} for user {user_id}")

    #     # Подготовить данные для обновления
    #     updates = {}
    #     if data.name is not None:
    #         updates["name"] = data.name
    #     if data.description is not None:
    #         updates["description"] = data.description
    #     if data.is_active is not None:
    #         updates["is_active"] = data.is_active

    #     # Обновить структуру графа если предоставлена
    #     if data.nodes is not None or data.edges is not None:
    #         # Получить текущий граф
    #         current_graph = await self.graph_repository.get_graph_by_id(user_id, graph_id)
    #         if not current_graph:
    #             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not found")

    #         # Обновить структуру
    #         new_nodes = (
    #             [NodeData(**node.dict()) for node in data.nodes]
    #             if data.nodes
    #             else current_graph.nodes
    #         )
    #         new_edges = (
    #             [EdgeData(**edge.dict()) for edge in data.edges]
    #             if data.edges
    #             else current_graph.edges
    #         )

    #         # Серверная валидация: ссылки рёбер на существующие ноды
    #         try:
    #             self._validate_edges(new_nodes, new_edges)
    #         except ValueError as exc:
    #             raise HTTPException(
    #                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
    #             ) from exc

    #         updates["graph_data"] = {
    #             "nodes": [node.dict() for node in new_nodes],
    #             "edges": [edge.dict() for edge in new_edges],
    #             "version": current_graph.version + 1,
    #         }
    #         updates["version"] = current_graph.version + 1

    #     updated_graph = await self.graph_repository.update_graph(user_id, graph_id, updates)
    #     if not updated_graph:
    #         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not found")

    #     return self._convert_to_response_schema(updated_graph)

    # async def delete_graph(self, user_id: UUID, graph_id: UUID) -> None:
    #     """Удалить граф"""
    #     logger.info(f"Deleting graph {graph_id} for user {user_id}")

    #     # Проверить, не используется ли граф активными ботами
    #     bots_using_graph = await self.telegram_repository.get_bots_by_graph_id(graph_id)
    #     if bots_using_graph:
    #         active_bots = [
    #             bot for bot in bots_using_graph if bot.is_active or bot.job_status == "RUNNING"
    #         ]
    #         if active_bots:
    #             bot_names = ", ".join([bot.name for bot in active_bots[:3]])
    #             raise HTTPException(
    #                 status_code=status.HTTP_400_BAD_REQUEST,
    #                 detail=f"Cannot delete graph: it is used by {len(active_bots)} active bot(s) ({bot_names}{'...' if len(active_bots) > 3 else ''})",
    #             )

    #     success = await self.graph_repository.delete_graph(user_id, graph_id)
    #     if not success:
    #         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not found")

    # async def execute_graph(
    #     self, user_id: UUID, graph_id: UUID, data: GraphExecuteSchema
    # ) -> GraphExecutionResponseSchema:
    #     """Выполнить граф"""
    #     logger.info(f"Executing graph {graph_id} for user {user_id}")

    #     # Получить граф
    #     graph_logic = await self.graph_repository.get_graph_by_id(user_id, graph_id)
    #     if not graph_logic:
    #         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not found")

    #     if not graph_logic.is_active:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST, detail="Graph is not active"
    #         )

    #     try:
    #         initial_inputs = self._prepare_initial_inputs(data.input_data)
    #     except ValueError as exc:
    #         raise HTTPException(
    #             status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
    #         ) from exc

    #     # Создать запись о выполнении
    #     execution_logic = GraphExecutionLogic(
    #         graph_id=graph_id,
    #         user_id=user_id,
    #         status="running",
    #         input_data=data.input_data,
    #         started_at=datetime.utcnow(),
    #     )

    #     created_execution = await self.graph_repository.create_execution(execution_logic)

    #     # Запустить выполнение в фоне и отслеживать задачу
    #     task = asyncio.create_task(
    #         self._execute_graph_async(graph_logic, created_execution, initial_inputs),
    #         name=f"graph-exec-{created_execution.id}",
    #     )
    #     self._register_execution_task(created_execution.id, task)

    #     return GraphExecutionResponseSchema(**created_execution.dict())

    # async def _execute_graph_async(
    #     self,
    #     graph_logic: GraphLogic,
    #     execution: GraphExecutionLogic,
    #     initial_inputs: Optional[Dict[str, Dict[str, Iterable[DataEnvelope]]]] = None,
    # ) -> None:
    #     """Асинхронное выполнение графа"""
    #     start_time = time.time()
    #     timeout = self._config.max_execution_time or None
    #     context = None

    #     try:
    #         logger.info(f"Starting async execution {execution.id}")

    #         plan = self._build_execution_plan(graph_logic)
    #         context = await self._scheduler.execute(
    #             plan,
    #             initial_inputs=initial_inputs,
    #             timeout=timeout,
    #         )

    #         execution_time_ms = int((time.time() - start_time) * 1000)
    #         updates = {
    #             "status": "completed",
    #             "output_data": self._serialize_results(context.results),
    #             "error_data": self._serialize_errors(context.errors),
    #             "execution_time_ms": execution_time_ms,
    #             "completed_at": datetime.utcnow(),
    #         }

    #         await self.graph_repository.update_execution(execution.user_id, execution.id, updates)
    #         logger.info(f"Execution {execution.id} completed successfully")

    #     except Exception as exc:
    #         logger.error(f"Execution {execution.id} failed: {exc}")

    #         execution_time_ms = int((time.time() - start_time) * 1000)
    #         error_payload: Dict[str, Any] = {"execution_error": str(exc)}
    #         if context:
    #             serialized_errors = self._serialize_errors(context.errors)
    #             if serialized_errors:
    #                 error_payload.update(serialized_errors)

    #         updates = {
    #             "status": "failed",
    #             "output_data": self._serialize_results(context.results) if context else None,
    #             "error_data": error_payload,
    #             "execution_time_ms": execution_time_ms,
    #             "completed_at": datetime.utcnow(),
    #         }

    #         try:
    #             await self.graph_repository.update_execution(
    #                 execution.user_id, execution.id, updates
    #             )
    #         except Exception:  # pragma: no cover - best effort logging
    #             logger.exception("Failed to persist execution failure state for %s", execution.id)

    # async def list_graph_executions(
    #     self, user_id: UUID, graph_id: UUID, limit: int
    # ) -> List[GraphExecutionResponseSchema]:
    #     """Получить историю выполнений графа"""
    #     logger.info(f"Listing executions for graph {graph_id}, user {user_id}")

    #     executions = await self.graph_repository.list_graph_executions(user_id, graph_id, limit)
    #     return [GraphExecutionResponseSchema(**execution.dict()) for execution in executions]

    # async def get_execution(
    #     self, user_id: UUID, execution_id: UUID
    # ) -> GraphExecutionResponseSchema:
    #     """Получить детали выполнения"""
    #     logger.info(f"Getting execution {execution_id} for user {user_id}")

    #     execution = await self.graph_repository.get_execution_by_id(user_id, execution_id)
    #     if not execution:
    #         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")

    #     return GraphExecutionResponseSchema(**execution.dict())

    # async def get_node_registry(self) -> NodeRegistryResponseSchema:
    #     """Получить реестр доступных нод"""
    #     logger.info("Getting node registry")

    #     categories: Dict[str, List[str]] = {}
    #     nodes: Dict[str, NodeTypeSchema] = {}

    #     for descriptor in self._registry.descriptors():
    #         meta = descriptor.meta
    #         try:
    #             temp_node = descriptor.node_cls()
    #         except Exception as exc:  # pragma: no cover - defensive
    #             logger.warning("Failed to instantiate node %s: %s", descriptor.type_name, exc)
    #             continue

    #         categories.setdefault(meta.category, []).append(descriptor.type_name)

    #         # Извлечение config_schema из config_model
    #         config_schema = None
    #         config_model = descriptor.node_cls.config_model()
    #         if config_model:
    #             config_schema = self._extract_config_schema(config_model)

    #         nodes[descriptor.type_name] = NodeTypeSchema(
    #             type=descriptor.type_name,
    #             meta=NodeMetaSchema(
    #                 name=meta.name,
    #                 category=meta.category,
    #                 description=meta.description,
    #                 icon=meta.icon or "",
    #                 tags=list(meta.tags),
    #                 version=meta.version,
    #             ),
    #             inputs={
    #                 name: NodePortSchema(
    #                     name=name,
    #                     type=self._format_port_kinds(port.kinds),
    #                     description=port.description,
    #                     required=port.required,
    #                     multiple=getattr(port, "multiple", None),
    #                 )
    #                 for name, port in temp_node.inputs.items()
    #             },
    #             outputs={
    #                 name: NodePortSchema(
    #                     name=name,
    #                     type=self._format_port_kinds(port.kinds),
    #                     description=port.description,
    #                     required=port.required,
    #                 )
    #                 for name, port in temp_node.outputs.items()
    #             },
    #             config_schema=config_schema,
    #         )

    #     for node_list in categories.values():
    #         node_list.sort()

    #     ordered_categories = dict(sorted(categories.items()))

    #     return NodeRegistryResponseSchema(
    #         categories=ordered_categories,
    #         nodes=nodes,
    #     )

    # def _convert_to_response_schema(self, graph: GraphLogic) -> GraphResponseSchema:
    #     """Конвертировать логическую модель в схему ответа"""
    #     return GraphResponseSchema(
    #         id=graph.id,
    #         name=graph.name,
    #         description=graph.description,
    #         nodes=[
    #             {"id": node.id, "type": node.type, "position": node.position, "data": node.data}
    #             for node in graph.nodes
    #         ],
    #         edges=[
    #             {
    #                 "id": edge.id,
    #                 "source": edge.source,
    #                 "sourceHandle": edge.sourceHandle,
    #                 "target": edge.target,
    #                 "targetHandle": edge.targetHandle,
    #             }
    #             for edge in graph.edges
    #         ],
    #         is_active=graph.is_active,
    #         version=graph.version,
    #         created_at=graph.created_at,
    #         updated_at=graph.updated_at,
    #     )

    # def _build_execution_plan(self, graph_logic: GraphLogic) -> ExecutionPlan:
    #     definition: GraphDefinition = graph_logic_to_definition(graph_logic)
    #     compiled = self._compiler.compile(definition)
    #     return ExecutionPlan.build(compiled)

    # def _prepare_initial_inputs(
    #     self, raw_inputs: Optional[Dict[str, Any]]
    # ) -> Optional[Dict[str, Dict[str, List[DataEnvelope]]]]:
    #     if raw_inputs is None:
    #         return None
    #     if not isinstance(raw_inputs, dict):
    #         raise ValueError("input_data must be a mapping of node_id to port values")

    #     prepared: Dict[str, Dict[str, List[DataEnvelope]]] = {}
    #     for node_id, ports in raw_inputs.items():
    #         if not isinstance(ports, dict):
    #             raise ValueError(
    #                 f"Node '{node_id}' input must be a mapping of port names to values"
    #             )

    #         port_payloads: Dict[str, List[DataEnvelope]] = {}
    #         for port_name, value in ports.items():
    #             try:
    #                 envelopes = self._normalize_envelopes(value)
    #             except ValueError as exc:
    #                 raise ValueError(f"Invalid payload for {node_id}.{port_name}: {exc}") from exc
    #             if envelopes:
    #                 port_payloads[port_name] = envelopes

    #         if port_payloads:
    #             prepared[node_id] = port_payloads

    #     return prepared or None

    # def _normalize_envelopes(self, value: Any) -> List[DataEnvelope]:
    #     if value is None:
    #         return []
    #     if isinstance(value, list):
    #         envelopes = [self._value_to_envelope(item) for item in value if item is not None]
    #         return [env for env in envelopes if env is not None]
    #     envelope = self._value_to_envelope(value)
    #     return [envelope] if envelope else []

    # def _value_to_envelope(self, value: Any) -> Optional[DataEnvelope]:
    #     if isinstance(value, DataEnvelope):
    #         return value
    #     if isinstance(value, dict):
    #         if "kind" in value:
    #             return DataEnvelope.from_dict(value)
    #         return DataEnvelope.json(value)
    #     if isinstance(value, bytes):
    #         return DataEnvelope.binary(value)
    #     if isinstance(value, (int, float, bool)):
    #         return DataEnvelope.json(value)
    #     if isinstance(value, str):
    #         return DataEnvelope.text(value)
    #     return DataEnvelope.json(value)

    # def _serialize_results(
    #     self, results: Dict[str, Dict[str, DataEnvelope]]
    # ) -> Optional[Dict[str, Dict[str, Dict[str, Any]]]]:
    #     if not results:
    #         return None
    #     serialized: Dict[str, Dict[str, Dict[str, Any]]] = {}
    #     for node_id, outputs in results.items():
    #         serialized[node_id] = {port: envelope.to_dict() for port, envelope in outputs.items()}
    #     return serialized

    # def _serialize_errors(self, errors: Dict[str, Exception]) -> Optional[Dict[str, str]]:
    #     if not errors:
    #         return None
    #     return {node_id: str(error) for node_id, error in errors.items()}

    # def _format_port_kinds(self, kinds: Iterable[DataKind]) -> str:
    #     if not kinds:
    #         return "any"
    #     return ", ".join(sorted(kind.value for kind in kinds))

    # def _extract_config_schema(self, config_model) -> Dict[str, NodeConfigFieldSchema]:
    #     """Извлечение схемы конфигурации из Pydantic модели"""
    #     from pydantic import BaseModel
    #     from pydantic.fields import FieldInfo

    #     if not config_model or not issubclass(config_model, BaseModel):
    #         return {}

    #     config_fields = {}
    #     for field_name, field_info in config_model.model_fields.items():
    #         field_type = field_info.annotation

    #         # Определение типа поля
    #         type_name = "string"
    #         if field_type == int or field_type == float:
    #             type_name = "number"
    #         elif field_type == bool:
    #             type_name = "boolean"
    #         elif hasattr(field_type, "__origin__"):  # Generic types (Optional, List, etc.)
    #             origin = getattr(field_type, "__origin__", None)
    #             if origin is list:
    #                 type_name = "array"

    #         # Извлечение метаданных
    #         field_schema = NodeConfigFieldSchema(
    #             name=field_name,
    #             type=type_name,
    #             title=field_info.title or field_name.replace("_", " ").title(),
    #             description=field_info.description or "",
    #             default=field_info.default if field_info.default is not None else None,
    #             required=field_info.is_required(),
    #         )

    #         # Дополнительные ограничения для чисел
    #         if type_name == "number" and hasattr(field_info, "metadata"):
    #             for constraint in field_info.metadata:
    #                 if hasattr(constraint, "ge"):
    #                     field_schema.minimum = constraint.ge
    #                 if hasattr(constraint, "le"):
    #                     field_schema.maximum = constraint.le

    #         # Дополнительные ограничения для строк
    #         if type_name == "string" and hasattr(field_info, "metadata"):
    #             for constraint in field_info.metadata:
    #                 if hasattr(constraint, "min_length"):
    #                     field_schema.minLength = constraint.min_length
    #                 if hasattr(constraint, "max_length"):
    #                     field_schema.maxLength = constraint.max_length

    #         config_fields[field_name] = field_schema

    #     return config_fields

    # # --- Validation helpers ---
    # def _validate_edges(self, nodes: List[NodeData], edges: List[EdgeData]) -> None:
    #     node_ids = {n.id for n in nodes}
    #     for edge in edges:
    #         if edge.source not in node_ids:
    #             raise ValueError(f"Edge {edge.id} references missing source node {edge.source}")
    #         if edge.target not in node_ids:
    #             raise ValueError(f"Edge {edge.id} references missing target node {edge.target}")
