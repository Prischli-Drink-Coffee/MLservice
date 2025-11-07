class GraphError(Exception):
    """Base exception for graph engine failures."""


class NodeConfigurationError(GraphError):
    """Raised when node configuration is invalid."""


class NodeExecutionError(GraphError):
    """Raised when node execution fails."""


class GraphValidationError(GraphError):
    """Raised when a graph definition fails validation checks."""


class RegistryError(GraphError):
    """Raised when node registry operations fail."""


class ExecutionCancelled(GraphError):
    """Raised when execution is cancelled due to timeout or manual stop."""
