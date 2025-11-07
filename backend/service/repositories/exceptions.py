"""Repository-level exception hierarchy.

These exceptions are raised by data access layer helpers and mapped to
HTTP responses by the FastAPI exception handlers. They are also used by
background workers to distinguish between recoverable persistence
problems and generic runtime errors.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class RepositoryError(Exception):
    """Base class for repository-related errors."""

    message: str = "Repository operation failed"

    def __init__(self, message: str = "Repository operation failed") -> None:
        self.message = message
        super().__init__(self.message)


@dataclass(slots=True)
class RepositoryIntegrityError(RepositoryError):
    """Violation of integrity constraints (unique, FK, etc.)."""

    message: str = "Integrity constraint violated"


@dataclass(slots=True)
class RepositoryNotFoundError(RepositoryError):
    """Requested entity was not found."""

    message: str = "Requested record not found"


@dataclass(slots=True)
class RepositoryMultipleResultsError(RepositoryError):
    """Unexpectedly retrieved multiple rows for a single-row query."""

    message: str = "Multiple records found where one was expected"


@dataclass(slots=True)
class RepositoryOperationalError(RepositoryError):
    """Database connectivity or transient operational failure."""

    message: str = "Database operation failed"
