from typing import Any

import httpx

from app.config import settings

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


async def verify_google_token(id_token: str) -> dict[str, Any] | None:
    """Verify a Google ID token and return the payload, or None on failure."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_TOKEN_INFO_URL, params={"id_token": id_token})
        if resp.status_code != 200:
            return None
        data = resp.json()

    if data.get("aud") != settings.GOOGLE_CLIENT_ID:
        return None
    if data.get("email_verified") != "true":
        return None

    return data
