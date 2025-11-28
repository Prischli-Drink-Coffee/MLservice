import sys
import types


def test_conversion_generate_failure_fallback(monkeypatch):
    """Simulate TPOT's old_config_utils returning a SearchSpace-like object
    whose `generate()` raises (e.g. due to empty inner search spaces). The
    function should fall back to returning the raw dict in that case.
    """
    # Create a fake tpot module with old_config_utils
    class BadSpace:
        def generate(self, *args, **kwargs):
            raise ValueError("a cannot be empty")

    class OldConfigUtils:
        def convert_config_dict_to_linearpipeline(self, d):
            return BadSpace()

        def convert_config_dict_to_graphpipeline(self, d):
            raise RuntimeError("graph conversion not supported in this fake")

    fake_tpot = types.SimpleNamespace(old_config_utils=OldConfigUtils())

    # Inject into sys.modules so `from tpot import old_config_utils` succeeds
    monkeypatch.setitem(sys.modules, "tpot", fake_tpot)

    from service.services.automl.search_space import build_search_space_config

    legacy = {"sklearn.linear_model.LogisticRegression": {"C": [0.1]}}

    result = build_search_space_config("classification", override=legacy)

    # Because generate() raised, we expect a dict fallback
    assert isinstance(result, dict)
