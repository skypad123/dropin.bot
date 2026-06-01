import json
import logging
from typing import Any, Optional

from .adapters.base import ChannelAdapter
from .adapters.slack import SlackAdapter
from .adapters.discord import DiscordAdapter
from .adapters.whatsapp import WhatsAppAdapter
from .adapters.telegram import TelegramAdapter
from ..db import get_db

logger = logging.getLogger(__name__)


class ChannelService:
    def __init__(self):
        self._adapters: dict[str, ChannelAdapter] = {
            "slack": SlackAdapter(),
            "discord": DiscordAdapter(),
            "whatsapp": WhatsAppAdapter(),
            "telegram": TelegramAdapter(),
        }

    async def connect_channel(self, channel_id: str) -> bool:
        config = self._get_channel_config(channel_id)
        if not config:
            return False

        channel_type = config.get("type", "").lower()
        adapter = self._adapters.get(channel_type)
        if not adapter:
            logger.warning(f"No adapter for channel type: {channel_type}")
            return False

        channel_config = self._parse_config(config.get("config", "{}"))
        await adapter.connect(channel_config)
        self._update_channel_status(channel_id, "connected")
        return True

    async def disconnect_channel(self, channel_id: str) -> bool:
        config = self._get_channel_config(channel_id)
        if not config:
            return False

        channel_type = config.get("type", "").lower()
        adapter = self._adapters.get(channel_type)
        if not adapter:
            return False

        await adapter.disconnect()
        self._update_channel_status(channel_id, "disconnected")
        return True

    async def send_message(self, channel_id: str, text: str) -> bool:
        config = self._get_channel_config(channel_id)
        if not config:
            return False

        channel_type = config.get("type", "").lower()
        adapter = self._adapters.get(channel_type)
        if not adapter:
            return False

        channel_config = self._parse_config(config.get("config", "{}"))
        target_id = channel_config.get("channel_id", channel_config.get("chat_id", ""))
        await adapter.send_message(target_id or "default", text)
        return True

    async def route_incoming(self, channel_type: str, raw: dict):
        text = raw.get("text", "")
        channel_id = raw.get("channel_id", "")
        logger.info(f"Routing incoming from {channel_type}/{channel_id}: {text[:100]}")

        from ..agents.orchestrator import orchestrator
        from ..gateway.protocol import EventType
        from datetime import datetime, timezone

        if orchestrator.session_manager:
            await orchestrator.session_manager.broadcast_event(
                EventType.CHAT_MESSAGE,
                {
                    "id": raw.get("message_id", ""),
                    "session_key": f"channel-{channel_type}-{channel_id}",
                    "role": "user",
                    "content": text,
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "source": channel_type,
                    "channel_id": channel_id,
                },
            )

    async def reconnect_all(self):
        with get_db() as conn:
            rows = conn.execute(
                "SELECT id FROM channels WHERE status = 'connected'"
            ).fetchall()
            for row in rows:
                await self.connect_channel(row["id"])

    async def disconnect_all(self):
        with get_db() as conn:
            rows = conn.execute("SELECT id FROM channels").fetchall()
            for row in rows:
                await self.disconnect_channel(row["id"])

    def _get_channel_config(self, channel_id: str) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM channels WHERE id = ?", (channel_id,)
            ).fetchone()
            return dict(row) if row else None

    def _update_channel_status(self, channel_id: str, status: str):
        with get_db() as conn:
            conn.execute(
                "UPDATE channels SET status = ? WHERE id = ?",
                (status, channel_id),
            )
            conn.commit()

    @staticmethod
    def _parse_config(raw: str) -> dict:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return {}


channel_service = ChannelService()
