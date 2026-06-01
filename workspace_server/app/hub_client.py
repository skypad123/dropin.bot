import httpx
import logging

logger = logging.getLogger(__name__)


async def report_ready_to_hub(workspace_id: str):
    from .config import settings
    url = f"{settings.hub_api_url}/api/v1/hub/workspaces/{workspace_id}/ready"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json={"status": "ready"}, timeout=10)
            logger.info(f"Reported ready to hub: {resp.status_code}")
        except Exception as e:
            logger.warning(f"Failed to report ready to hub: {e}")


async def report_offline_to_hub(workspace_id: str):
    from .config import settings
    url = f"{settings.hub_api_url}/api/v1/hub/workspaces/{workspace_id}/offline"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json={"status": "offline"}, timeout=10)
            logger.info(f"Reported offline to hub: {resp.status_code}")
        except Exception as e:
            logger.warning(f"Failed to report offline to hub: {e}")
