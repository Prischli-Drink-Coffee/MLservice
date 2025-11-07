from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field

from service.models.key_value import ProcessingStatus, ServiceMode, ServiceType
from service.presentation.schemas.metrics import MetricsResponse


class StartJobRequest(BaseModel):
    file_id: Annotated[UUID, Field(..., description="File identifier to process")]
    mode: Annotated[ServiceMode, Field(..., description="Processing mode for the service")]
    type: Annotated[ServiceType, Field(..., description="Type of service to apply")]


class JobResponse(BaseModel):
    job_id: Annotated[UUID, Field(..., description="Unique job identifier")]
    status: Annotated[ProcessingStatus, Field(..., description="Current job processing status")]
    result_file_url: Annotated[
        str | None, Field(None, description="URL to download the processed file result")
    ]
    available_launches: Annotated[
        int, Field(..., description="Number of remaining job launches available")
    ]
    wait_time_sec: Annotated[
        int, Field(..., description="Estimated wait time in seconds before job completion")
    ]
    model_url: Annotated[str | None, Field(None, description="URL модели (ML TRAIN jobs)")]
    metrics: Annotated[
        MetricsResponse | None, Field(None, description="Метрики обучения (ML TRAIN jobs)")
    ]
