import httpx

from app.config import settings


async def send_push_notification(
    expo_push_token: str,
    title: str,
    body: str,
    data: dict | None = None,
) -> bool:
    if not settings.expo_access_token:
        return False

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            "https://exp.host/--/api/v2/push/send",
            json={
                "to": expo_push_token,
                "title": title,
                "body": body,
                "data": data or {},
                "sound": "default",
                "priority": "high",
            },
            headers={"Authorization": f"Bearer {settings.expo_access_token}"},
        )
        return resp.status_code == 200
