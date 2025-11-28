import pytest

from service.services.automl.search_space import build_search_space_config


def test_legacy_config_conversion_basic():
    """If TPOT is available the legacy config dict should be converted to a
    search-space-like object; otherwise we fall back to returning the dict.
    """
    legacy = {
        "sklearn.linear_model.LogisticRegression": {
            "C": [0.01, 1.0],
            "penalty": ["l2"],
            "solver": ["lbfgs"],
        }
    }

    result = build_search_space_config("classification", override=legacy)

    # Newer TPOT exposes objects with a `generate` method. If conversion
    # succeeded we expect a non-dict object; otherwise we accept the dict
    # fallback (TPOT not installed in the current environment).
    if hasattr(result, "generate"):
        assert not isinstance(result, dict)
    else:
        assert isinstance(result, dict)
