import json
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from .protocol import ProtocolV4, Frame, EventType
from .session import SessionManager, ClientSession

router = APIRouter()
protocol = ProtocolV4()
session_manager = SessionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    await websocket.accept()
    session = session_manager.create(websocket)

    try:
        await handle_handshake(session)

        snapshot = session_manager.get_workspace_snapshot()
        await session.send(protocol.hello_ok(snapshot))

        await session_manager.broadcast_event(EventType.PRESENCE, {
            "count": session_manager.count(),
            "clients": session_manager.client_ids(),
        })

        async for raw in websocket.iter_text():
            try:
                frame: Frame = json.loads(raw)
            except json.JSONDecodeError:
                await session.send(protocol.error("invalid_json", "Invalid JSON frame"))
                continue

            await handle_frame(session, frame)

    except WebSocketDisconnect:
        pass
    finally:
        session_manager.remove(session.connection_id)
        await session_manager.broadcast_event(EventType.PRESENCE, {
            "count": session_manager.count(),
            "clients": session_manager.client_ids(),
        })


async def handle_handshake(session: ClientSession):
    challenge = protocol.create_challenge()
    await session.send(challenge)

    raw_response = await session.websocket.receive_text()
    try:
        response: Frame = json.loads(raw_response)
    except json.JSONDecodeError:
        await session.send(protocol.error("invalid_json", "Invalid handshake"))
        await session.websocket.close(code=4001)
        return

    if response.get("type") != "connect":
        await session.send(protocol.error("bad_handshake", "Expected connect frame"))
        await session.websocket.close(code=4001)
        return

    payload = response.get("payload", {})
    device_id = payload.get("device_id", "")
    signature = payload.get("signature", "")
    nonce = payload.get("nonce", "")
    ts = payload.get("ts", 0)

    valid = protocol.verify_challenge(device_id, nonce, signature)
    if not valid:
        await session.send(protocol.error("auth_failed", "Invalid signature"))
        await session.websocket.close(code=4002)
        return

    session.device_id = device_id
    session.authenticated = True


async def handle_frame(session: ClientSession, frame: Frame):
    ftype = frame.get("type", "")

    if ftype == "ping":
        await session.send(protocol.pong())

    elif ftype == "chat.message":
        payload = frame.get("payload", {})
        msg = {
            "id": str(uuid.uuid4()),
            "session_key": payload.get("session_key", "session-welcome"),
            "role": "user",
            "content": payload.get("content", ""),
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        await session_manager.broadcast_event(EventType.CHAT_MESSAGE, msg)

    elif ftype == "session.message":
        await session_manager.broadcast(frame)

    elif ftype == "session.operation":
        await session_manager.broadcast(frame)

    elif ftype == "session.tool":
        await session_manager.broadcast(frame)

    elif ftype == "tick":
        health = {
            "status": "ok",
            "uptime": session_manager.uptime_seconds(),
            "version": "0.1.0",
        }
        await session.send(protocol.event(EventType.HEALTH, health))

    else:
        await session.send(protocol.error("unknown_type", f"Unknown frame type: {ftype}"))
