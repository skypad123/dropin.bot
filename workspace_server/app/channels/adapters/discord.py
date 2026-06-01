import json
import logging
from typing import Any, Optional

from .base import ChannelAdapter

logger = logging.getLogger(__name__)


class DiscordAdapter(ChannelAdapter):
    def __init__(self):
        self._connected = False
        self._client = None

    async def connect(self, config: dict) -> None:
        bot_token = config.get("bot_token", "")

        if not bot_token:
            logger.warning("Discord adapter: no bot_token provided, running in stub mode")
            self._connected = True
            return

        try:
            import discord

            intents = discord.Intents.default()
            intents.message_content = True
            self._client = discord.Client(intents=intents)

            @self._client.event
            async def on_ready():
                logger.info(f"Discord bot connected as {self._client.user}")

            @self._client.event
            async def on_message(message):
                if message.author.bot:
                    return
                raw = {
                    "channel": "discord",
                    "channel_id": str(message.channel.id),
                    "text": message.content,
                    "user": str(message.author),
                    "raw": {"id": str(message.id)},
                }
                await self.handle_incoming(raw)

            import asyncio
            asyncio.create_task(self._client.start(bot_token))
            self._connected = True
            logger.info("Discord adapter connecting...")

        except ImportError:
            logger.warning("discord.py not installed, running Discord adapter in stub mode")
            self._connected = True
        except Exception as e:
            logger.error(f"Discord adapter connect error: {e}")
            self._connected = True

    async def disconnect(self) -> None:
        self._connected = False
        if self._client:
            try:
                await self._client.close()
            except Exception:
                pass
        logger.info("Discord adapter disconnected")

    async def send_message(self, channel_id: str, text: str) -> None:
        if not self._client:
            logger.info(f"[Discord stub] To {channel_id}: {text}")
            return
        try:
            channel = self._client.get_channel(int(channel_id))
            if channel:
                await channel.send(text)
        except Exception as e:
            logger.error(f"Discord send_message error: {e}")

    async def handle_incoming(self, raw: dict) -> None:
        logger.info(f"[Discord] Incoming: {json.dumps(raw, default=str)[:200]}")
        from ..service import channel_service
        if channel_service:
            await channel_service.route_incoming("discord", raw)
