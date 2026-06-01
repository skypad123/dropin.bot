import json
import logging
from typing import Any, Optional

from .base import ChannelAdapter

logger = logging.getLogger(__name__)


class WhatsAppAdapter(ChannelAdapter):
    def __init__(self):
        self._connected = False
        self._phone_number_id = None
        self._access_token = None
        self._verify_token = None

    async def connect(self, config: dict) -> None:
        phone_number_id = config.get("phone_number_id", "")
        access_token = config.get("access_token", "")
        verify_token = config.get("verify_token", "")

        if not access_token:
            logger.warning("WhatsApp adapter: no access_token provided, running in stub mode")
            self._connected = True
            return

        self._phone_number_id = phone_number_id
        self._access_token = access_token
        self._verify_token = verify_token
        self._connected = True
        logger.info("WhatsApp adapter connected")

    async def disconnect(self) -> None:
        self._connected = False
        logger.info("WhatsApp adapter disconnected")

    async def send_message(self, channel_id: str, text: str) -> None:
        if not self._access_token:
            logger.info(f"[WhatsApp stub] To {channel_id}: {text}")
            return

        try:
            import httpx
            url = f"https://graph.facebook.com/v20.0/{self._phone_number_id}/messages"
            headers = {
                "Authorization": f"Bearer {self._access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "messaging_product": "whatsapp",
                "to": channel_id,
                "type": "text",
                "text": {"body": text},
            }
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload, headers=headers)
        except ImportError:
            logger.info(f"[WhatsApp stub] To {channel_id}: {text}")
        except Exception as e:
            logger.error(f"WhatsApp send_message error: {e}")

    async def handle_incoming(self, raw: dict) -> None:
        logger.info(f"[WhatsApp] Incoming: {json.dumps(raw, default=str)[:200]}")
        from ..service import channel_service
        if channel_service:
            await channel_service.route_incoming("whatsapp", raw)

    def verify_webhook(self, mode: str, token: str, challenge: str) -> Optional[str]:
        if mode == "subscribe" and token == self._verify_token:
            return challenge
        return None
