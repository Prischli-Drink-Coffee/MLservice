from typing import Optional

from pydantic import BaseModel, Field


class MetricsResponse(BaseModel):
    """Standardized training metrics schema.

    Fields are optional to allow both classification and regression.
    Heavy path may also populate confusion_matrix (2D list) for classification.
    """

    task: str = Field(..., description="Task type: classification|regression")
    accuracy: Optional[float] = Field(None, description="Classification accuracy [0,1]")
    precision: Optional[float] = Field(
        None, description="Classification precision (macro-average) [0,1]"
    )
    recall: Optional[float] = Field(None, description="Classification recall (macro-average) [0,1]")
    f1: Optional[float] = Field(None, description="Classification F1-score (macro-average) [0,1]")
    confusion_matrix: Optional[list[list[int]]] = Field(
        None, description="Raw confusion matrix (rows: true classes, cols: predicted)"
    )
    r2: Optional[float] = Field(None, description="Regression R^2 score [-inf,1]")
    mse: Optional[float] = Field(None, description="Regression mean squared error [0,inf)")
    mae: Optional[float] = Field(None, description="Regression mean absolute error [0,inf)")
    n_features: int = Field(..., description="Number of numeric features used")
    n_samples: int = Field(..., description="Number of samples in the dataset")
