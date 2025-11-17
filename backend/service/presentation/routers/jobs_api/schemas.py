from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from service.models.key_value import ProcessingStatus, ServiceMode, ServiceType
from service.presentation.schemas.metrics import MetricsResponse


class StartJobRequest(BaseModel):
    file_id: Annotated[
        UUID | None, Field(None, description="Legacy file identifier to process (dataset id)")
    ]
    dataset_id: Annotated[
        UUID | None, Field(None, description="Dataset identifier selected for training")
    ]
    target_column: Annotated[
        str | None, Field(None, description="Optional target column name for training")
    ]
    mode: Annotated[ServiceMode, Field(..., description="Processing mode for the service")]
    type: Annotated[ServiceType, Field(..., description="Type of service to apply")]

    @model_validator(mode="after")
    def _ensure_source(self) -> "StartJobRequest":
        if not self.file_id and not self.dataset_id:
            raise ValueError("Either dataset_id or file_id must be provided")
        return self


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
