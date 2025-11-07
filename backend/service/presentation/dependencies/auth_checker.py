import jwt
from fastapi import Cookie, HTTPException, status

from service.models.auth_models import AuthProfile
from service.settings import config


def check_auth(auth_token: str = Cookie(None)) -> AuthProfile:
    """Проверяет JWT из secure cookie 'auth_token'."""
    if not auth_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")

    try:
        payload: dict = jwt.decode(
            auth_token, config.auth.secret, algorithms=[config.auth.algorithm]
        )

        user_profile = AuthProfile(
            user_id=payload["sub"],
            fingerprint=payload.get("fingerprint"),
            type=payload["type"],
        )

        return user_profile
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
