from abc import ABC, abstractmethod
from typing import Any, Optional


class ChannelAdapter(ABC):
    @abstractmethod
    async def connect(self, config: dict) -> None:
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        ...

    @abstractmethod
    async def send_message(self, channel_id: str, text: str) -> None:
        ...

    @abstractmethod
    async def handle_incoming(self, raw: dict) -> None:
        ...
