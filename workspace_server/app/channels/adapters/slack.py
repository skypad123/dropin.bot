import json
import logging
from typing import Any, Optional

from .base import ChannelAdapter

logger = logging.getLogger(__name__)


class SlackAdapter(ChannelAdapter):
    def __init__(self):
        self._connected = False
        self._app = None
        self._handler = None

    async def connect(self, config: dict) -> None:
        bot_token = config.get("bot_token", "")
        app_token = config.get("app_token", "")
        signing_secret = config.get("signing_secret", "")

        if not bot_token:
            logger.warning("Slack adapter: no bot_token provided, running in stub mode")
            self._connected = True
            return

        try:
            from slack_bolt.app.async_app import AsyncApp
            from slack_bolt.adapter.socket_mode.aiohttp import AsyncSocketModeHandler

            self._app = AsyncApp(
                token=bot_token,
                signing_secret=signing_secret,
            )

            @self._app.event("message")
            async def handle_message(event: dict, say, client):
                if event.get("bot_id"):
                    return
                raw = {
                    "channel": "slack",
                    "channel_id": event.get("channel", ""),
                    "text": event.get("text", ""),
                    "user": event.get("user", ""),
                    "raw": event,
                }
                await self.handle_incoming(raw)

            if app_token:
                self._handler = AsyncSocketModeHandler(self._app, app_token)
                await self._handler.start_async()
            else:
                await self._app.start()

            self._connected = True
            logger.info("Slack adapter connected")

        except ImportError:
            logger.warning("slack-bolt not installed, running Slack adapter in stub mode")
            self._connected = True
        except Exception as e:
            logger.error(f"Slack adapter connect error: {e}")
            self._connected = True

    async def disconnect(self) -> None:
        self._connected = False
        if self._handler:
            try:
                await self._handler.close_async()
            except Exception:
                pass
        if self._app:
            try:
                await self._app.stop()
            except Exception:
                pass
        logger.info("Slack adapter disconnected")

    async def send_message(self, channel_id: str, text: str) -> None:
        if not self._app:
            logger.info(f"[Slack stub] To {channel_id}: {text}")
            return
        try:
            await self._app.client.chat_postMessage(channel=channel_id, text=text)
        except Exception as e:
            logger.error(f"Slack send_message error: {e}")

    async def handle_incoming(self, raw: dict) -> None:
        logger.info(f"[Slack] Incoming: {json.dumps(raw, default=str)[:200]}")
        from ..service import channel_service
        if channel_service:
            await channel_service.route_incoming("slack", raw)
