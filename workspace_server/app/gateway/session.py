import time
import uuid
from typing import Any, Optional

from fastapi import WebSocket

from ..config import settings


class ClientSession:
    def __init__(self, connection_id: str, websocket: WebSocket):
        self.connection_id = connection_id
        self.websocket = websocket
        self.device_id: Optional[str] = None
        self.authenticated: bool = False
        self.connected_at: float = time.time()

    async def send(self, frame: dict[str, Any]):
        import json
        await self.websocket.send_text(json.dumps(frame))


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, ClientSession] = {}
        self._start_time: float = time.time()

    def create(self, websocket: WebSocket) -> ClientSession:
        cid = str(uuid.uuid4())
        session = ClientSession(cid, websocket)
        self._sessions[cid] = session
        return session

    def remove(self, connection_id: str):
        self._sessions.pop(connection_id, None)

    def get(self, connection_id: str) -> Optional[ClientSession]:
        return self._sessions.get(connection_id)

    def count(self) -> int:
        return len(self._sessions)

    def client_ids(self) -> list[str]:
        return list(self._sessions.keys())

    async def broadcast(self, frame: dict[str, Any]):
        for session in list(self._sessions.values()):
            try:
                await session.send(frame)
            except Exception:
                pass

    async def broadcast_event(self, event_type: Any, payload: Any = None):
        from .protocol import ProtocolV4
        protocol = ProtocolV4()
        frame = protocol.event(event_type, payload)
        await self.broadcast(frame)

    def uptime_seconds(self) -> float:
        return time.time() - self._start_time

    def get_workspace_snapshot(self) -> dict:
        return {
            "workspace_id": settings.workspace_id,
            "workspace_name": settings.workspace_name,
            "version": "0.1.0",
        }


session_manager = SessionManager()
