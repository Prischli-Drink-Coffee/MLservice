from pydantic import BaseModel, Field


class PlatformStatsResponse(BaseModel):
    """Platform-wide statistics"""

    total_users: int = Field(..., description="Total number of registered users")
    total_bots: int = Field(..., description="Total number of telegram bots")
    active_bots: int = Field(..., description="Number of active telegram bots")
    total_graphs: int = Field(..., description="Total number of graphs")
    active_graphs: int = Field(..., description="Number of active graphs")


class UserStatsResponse(BaseModel):
    """User-specific statistics"""

    user_id: str = Field(..., description="User ID")
    total_bots: int = Field(..., description="Total number of user's bots")
    active_bots: int = Field(..., description="Number of user's active bots")
    total_graphs: int = Field(..., description="Total number of user's graphs")
    active_graphs: int = Field(..., description="Number of user's active graphs")
    total_executions: int = Field(..., description="Total number of graph executions")
    successful_executions: int = Field(..., description="Number of successful executions")
    failed_executions: int = Field(..., description="Number of failed executions")
