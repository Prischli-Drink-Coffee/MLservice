import pytest

from service.services.automl import search_space as ss


def test_build_search_space_config_defaults():
    # Should return a non-None value for standard tasks
    cls_space = ss.build_search_space_config("classification")
    reg_space = ss.build_search_space_config("regression")
    assert cls_space is not None
    assert reg_space is not None


def test_build_search_space_config_with_mapping_override():
    override = {
        "sklearn.linear_model.LogisticRegression": {"C": [0.1, 1.0]},
    }
    res = ss.build_search_space_config("classification", override=override)
    # If TPOT is available and conversion works, we may get an object with
    # a generate() method. Otherwise we expect a dict (fallback path).
    if hasattr(res, "generate"):
        assert callable(getattr(res, "generate"))
    else:
        assert isinstance(res, dict)


def test_build_search_space_config_with_bad_override_string():
    # A string that is not a module path should be returned verbatim (e.g. 'linear')
    res = ss.build_search_space_config("classification", override="linear")
    assert res is not None


def test_build_symbolic_graph_search_space_validation():
    with pytest.raises(ValueError):
        ss.build_symbolic_graph_search_space("regression", n_features=0)
