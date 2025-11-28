"""Helpers for TPOT search spaces and configs."""

from __future__ import annotations

import importlib
import json
import logging
from typing import Any, Mapping

# TPOT is optional at runtime; avoid top-level imports that crash the app when TPOT
# isn't installed (common in lightweight dev environments / CI). Modules that need
# TPOT should import it lazily and handle ImportError.
try:
    import tpot  # type: ignore

    _HAS_TPOT = True
except Exception:  # pragma: no cover - optional dependency
    _HAS_TPOT = False

logger = logging.getLogger(__name__)
try:
    from ConfigSpace import ConfigurationSpace

    _HAS_CONFIGSPACE = True
except ImportError:  # pragma: no cover - optional dependency
    ConfigurationSpace = None  # type: ignore[assignment]
    _HAS_CONFIGSPACE = False

DEFAULT_SEARCH_SPACES: dict[str, Any] = {
    # older TPOT versions exposed config dicts like
    # `classification_gp_config_dict`/`regression_gp_config_dict`.
    # Newer TPOT exposes `get_configspace` / `get_search_space`.
    # Keep placeholders here for backwards compatibility; the real
    # default is resolved at runtime in `build_search_space_config`.
    "classification": "linear",
    "regression": "linear",
}


def _load_attr(path: str) -> Any:
    module_name, _, attr = path.rpartition(".")
    if not module_name:
        raise ValueError("TPOT config path must be module + attribute")
    module = importlib.import_module(module_name)
    return getattr(module, attr)


def _parse_override(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        candidate = value.strip()
        if candidate.startswith("{") and candidate.endswith("}"):
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                logger.debug(
                    "TPOT config override string is not valid JSON, interpreting as module path"
                )
        # If the candidate looks like a simple TPOT built-in name (e.g. 'linear',
        # 'graph'), prefer returning it verbatim. Otherwise, treat as a
        # module.path.attr reference and attempt to import the attribute.
        if "." not in candidate:
            return candidate
        return _load_attr(candidate)
    if isinstance(value, Mapping):
        return dict(value)
    if _HAS_CONFIGSPACE and isinstance(value, ConfigurationSpace):
        return value
    return value


def build_search_space_config(task: str, override: Any | None = None) -> Any:
    """Return TPOT search space configuration for the provided task."""

    custom = _parse_override(override)
    # If user provided a config dict (legacy TPOT config), try to convert it
    # into a TPOT SearchSpace object so newer TPOT versions (which expect
    # objects with .generate()) receive the correct type. Fall back to
    # returning the raw dict when conversion is unavailable.
    if isinstance(custom, Mapping):
        try:
            # import lazily because TPOT is optional in many environments
            from tpot import old_config_utils  # type: ignore

            # Try linear pipeline conversion first — if the override contains
            # only estimator modules (classifiers/regressors) a linear
            # pipeline is usually appropriate. After conversion, attempt a
            # lightweight validation by calling `generate()` once; if that
            # raises (e.g. empty inner search spaces) fall back to the next
            # option rather than returning a broken SearchSpace.
            try:
                converted = old_config_utils.convert_config_dict_to_linearpipeline(custom)
                if hasattr(converted, "generate"):
                    try:
                        # Try to generate a single candidate to validate the space
                        _ = converted.generate()
                    except Exception as exc:  # pragma: no cover - defensive
                        logger.warning(
                            "Linearpipeline generate() failed during validation: %s", exc
                        )
                        raise
                return converted
            except Exception:
                try:
                    converted = old_config_utils.convert_config_dict_to_graphpipeline(custom)
                    if hasattr(converted, "generate"):
                        try:
                            _ = converted.generate()
                        except Exception as exc:  # pragma: no cover - defensive
                            logger.warning(
                                "Graphpipeline generate() failed during validation: %s", exc
                            )
                            raise
                    return converted
                except Exception:
                    return dict(custom)
        except Exception:
            # TPOT not installed or conversion failed; return the raw mapping
            return dict(custom)
    if custom is not None:
        return custom
    # Resolve defaults for current TPOT versions. TPOT expects either:
    # - a string name of built-in search space (e.g. 'linear', 'graph')
    # - an instance of TPOT.search_spaces.SearchSpace
    # Accept group names like 'classification' / 'regression' and map them
    # to appropriate TPOT search spaces.
    name = task.lower()
    try:
        # prefer using TPOT's get_search_space when available
        from tpot.config import get_search_space

        if name == "classification":
            return get_search_space("classifiers")
        if name == "regression":
            return get_search_space("regressors")
        # if task is already a known TPOT search space name, return it
        return get_search_space(name)
    except Exception:
        # Fallback to simple string-based defaults (backwards compatibility)
        return DEFAULT_SEARCH_SPACES.get(name, DEFAULT_SEARCH_SPACES["classification"])


def build_symbolic_graph_search_space(task: str, *, n_features: int, max_size: int = 20) -> Any:
    """Constructs a simple GraphSearchPipeline for symbolic regression/classification."""

    if n_features <= 0:
        raise ValueError("n_features must be positive to build a symbolic graph search space")

    from tpot.config import get_search_space
    from tpot.search_spaces.nodes import FSSNode
    from tpot.search_spaces.pipelines import GraphSearchPipeline

    if task.lower() == "regression":
        root = get_search_space("SGDRegressor")
    else:
        root = get_search_space("LogisticRegression")

    return GraphSearchPipeline(
        root_search_space=root,
        leaf_search_space=FSSNode(subsets=n_features),
        inner_search_space=get_search_space(["arithmatic"]),
        max_size=max_size,
    )
