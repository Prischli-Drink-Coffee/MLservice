from typing import Optional

from pydantic import BaseModel, Field


class MetricsResponse(BaseModel):
    """Standardized training metrics schema.

    Fields are optional to allow both classification and regression.
    """

    task: str = Field(..., description="Task type: classification|regression")
    accuracy: Optional[float] = Field(None, description="Classification accuracy [0,1]")
    r2: Optional[float] = Field(None, description="Regression R^2 score [-inf,1]")
    mse: Optional[float] = Field(None, description="Regression mean squared error [0,inf)")
    n_features: int = Field(..., description="Number of numeric features used")
    n_samples: int = Field(..., description="Number of samples in the dataset")
