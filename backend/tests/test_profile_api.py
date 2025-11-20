import uuid
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import UserTypes
from service.models.profile_models import ProfileQuotaSnapshot, UserProfileLogic
from service.presentation.routers.profile_api import profile_api as profile_module
from service.presentation.routers.profile_api.profile_api import (
    billing_router,
    get_profile_service,
    profile_router,
)


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=uuid.uuid4(), fingerprint=None, type=UserTypes.REGISTERED)


class _FakeProfileService:
    def __init__(self) -> None:
        now = datetime.now(UTC)
        self.profile = UserProfileLogic(
            id=uuid.uuid4(),
            email="user@example.com",
            password_hash="hash",
            phone="71234567890",
            first_name="Alex",
            company="MLservice",
            timezone="Europe/Moscow",
            avatar_url=None,
            available_launches=5,
            created_at=now,
            updated_at=now,
        )
        self.quota = ProfileQuotaSnapshot(limit=10, used=5, available=5, resets_at=None)
        self.update_calls: list[tuple[uuid.UUID, dict]] = []

    async def get_profile_overview(self, user_id):  # noqa: D401
        return self.profile, self.quota

    async def update_profile_details(self, user_id, updates):  # noqa: D401
        self.update_calls.append((user_id, updates))
        for key, value in updates.items():
            setattr(self.profile, key, value)
        return self.profile


def _make_app(fake_service: _FakeProfileService) -> TestClient:
    app = FastAPI()
    app.include_router(profile_router)
    app.include_router(billing_router)

    app.dependency_overrides[get_profile_service] = lambda: fake_service
    app.dependency_overrides[profile_module.check_auth] = _fake_auth

    return TestClient(app)


def test_get_profile_returns_overview():
    fake_service = _FakeProfileService()
    client = _make_app(fake_service)

    resp = client.get("/api/profile/me")

    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload["email"] == "user@example.com"
    assert payload["quota"] == {
        "limit": 10,
        "used": 5,
        "available": 5,
        "resets_at": None,
    }


def test_patch_profile_updates_fields():
    fake_service = _FakeProfileService()
    client = _make_app(fake_service)

    new_payload = {"first_name": "Nika", "timezone": "Europe/Berlin"}
    resp = client.patch("/api/profile/me", json=new_payload)

    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload["first_name"] == "Nika"
    assert payload["timezone"] == "Europe/Berlin"

    assert len(fake_service.update_calls) == 1
    _, updates = fake_service.update_calls[0]
    assert updates == new_payload


def test_quota_preview_returns_stub_plans():
    fake_service = _FakeProfileService()
    client = _make_app(fake_service)

    resp = client.get("/api/billing/quotas/preview")

    assert resp.status_code == 200, resp.text
    plans = resp.json()
    assert len(plans) == 3
    assert {plan["id"] for plan in plans} == {"starter", "growth", "scale"}
    assert all(plan["status"] == "coming_soon" for plan in plans)
