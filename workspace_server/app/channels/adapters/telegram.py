import json
import logging
from typing import Any, Optional

from .base import ChannelAdapter

logger = logging.getLogger(__name__)


class TelegramAdapter(ChannelAdapter):
    def __init__(self):
        self._connected = False
        self._app = None

    async def connect(self, config: dict) -> None:
        bot_token = config.get("bot_token", "")

        if not bot_token:
            logger.warning("Telegram adapter: no bot_token provided, running in stub mode")
            self._connected = True
            return

        try:
            from telegram import Update
            from telegram.ext import Application, MessageHandler, filters, ContextTypes

            async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
                if not update.message or not update.message.text:
                    return
                raw = {
                    "channel": "telegram",
                    "channel_id": str(update.message.chat_id),
                    "text": update.message.text,
                    "user": update.message.from_user.username or str(update.message.from_user.id) if update.message.from_user else "unknown",
                    "raw": update.to_dict(),
                }
                await self.handle_incoming(raw)

            self._app = Application.builder().token(bot_token).build()
            self._app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

            import asyncio
            asyncio.create_task(self._app.initialize())
            asyncio.create_task(self._app.start())
            asyncio.create_task(self._app.updater.start_polling())

            self._connected = True
            logger.info("Telegram adapter connected")

        except ImportError:
            logger.warning("python-telegram-bot not installed, running Telegram adapter in stub mode")
            self._connected = True
        except Exception as e:
            logger.error(f"Telegram adapter connect error: {e}")
            self._connected = True

    async def disconnect(self) -> None:
        self._connected = False
        if self._app:
            try:
                await self._app.updater.stop()
                await self._app.stop()
                await self._app.shutdown()
            except Exception:
                pass
        logger.info("Telegram adapter disconnected")

    async def send_message(self, channel_id: str, text: str) -> None:
        if not self._app:
            logger.info(f"[Telegram stub] To {channel_id}: {text}")
            return
        try:
            await self._app.bot.send_message(chat_id=channel_id, text=text)
        except Exception as e:
            logger.error(f"Telegram send_message error: {e}")

    async def handle_incoming(self, raw: dict) -> None:
        logger.info(f"[Telegram] Incoming: {json.dumps(raw, default=str)[:200]}")
        from ..service import channel_service
        if channel_service:
            await channel_service.route_incoming("telegram", raw)
