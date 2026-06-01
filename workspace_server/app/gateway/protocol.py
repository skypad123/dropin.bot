import time
import uuid
import json
from enum import Enum
from typing import Any, Optional

from ecdsa import SigningKey, VerifyingKey, NIST256p, BadSignatureError


class EventType(str, Enum):
    CONNECT_CHALLENGE = "connect.challenge"
    HEALTH = "health"
    PRESENCE = "presence"
    SESSIONS_CHANGED = "sessions.changed"
    CHAT_MESSAGE = "chat.message"
    SESSION_MESSAGE = "session.message"
    SESSION_OPERATION = "session.operation"
    SESSION_TOOL = "session.tool"
    TICK = "tick"


Frame = dict[str, Any]


class ProtocolV4:
    def __init__(self):
        self._pending_challenges: dict[str, tuple[str, int, int]] = {}

    def create_challenge(self) -> Frame:
        nonce = uuid.uuid4().hex
        ts = int(time.time())
        challenge_id = uuid.uuid4().hex
        self._pending_challenges[challenge_id] = (nonce, ts, 300)
        return {
            "type": "event",
            "event": EventType.CONNECT_CHALLENGE.value,
            "payload": {
                "challenge_id": challenge_id,
                "nonce": nonce,
                "ts": ts,
            },
        }

    def verify_challenge(self, device_id: str, nonce: str, signature: str) -> bool:
        try:
            pub_key_bytes = bytes.fromhex(device_id) if len(device_id) >= 64 else None
            if pub_key_bytes is None:
                return False
            vk = VerifyingKey.from_string(pub_key_bytes, curve=NIST256p)
            return vk.verify(bytes.fromhex(signature), nonce.encode())
        except (ValueError, BadSignatureError):
            return False

    @staticmethod
    def generate_device_identity() -> tuple[str, str]:
        sk = SigningKey.generate(curve=NIST256p)
        vk = sk.verifying_key
        private_key = sk.to_string().hex()
        public_key = vk.to_string().hex()
        return private_key, public_key

    @staticmethod
    def sign_challenge(private_key_hex: str, nonce: str) -> str:
        sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=NIST256p)
        return sk.sign(nonce.encode()).hex()

    def hello_ok(self, snapshot: dict) -> Frame:
        return {
            "type": "hello-ok",
            "payload": {
                "workspace_id": snapshot.get("workspace_id", ""),
                "snapshot": snapshot,
                "server_time": int(time.time()),
                "version": "0.1.0",
            },
        }

    def event(self, event_type: EventType, payload: Any = None) -> Frame:
        frame = {"type": "event", "event": event_type.value}
        if payload is not None:
            frame["payload"] = payload
        return frame

    def error(self, code: str, message: str) -> Frame:
        return {
            "type": "error",
            "payload": {"code": code, "message": message},
        }

    def pong(self) -> Frame:
        return {"type": "pong", "payload": {"ts": int(time.time())}}

    @staticmethod
    def register_device(public_key_hex: str, workspace_id: str) -> None:
        from ..db import get_db

        with get_db() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO device_identities (device_id, workspace_id, public_key, paired, created_at) "
                "VALUES (?, ?, ?, 1, ?)",
                (public_key_hex[:32], workspace_id, public_key_hex, _now_iso()),
            )
            conn.commit()


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
