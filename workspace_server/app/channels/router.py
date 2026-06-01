from fastapi import APIRouter, HTTPException

from .models import ChannelCreate, ChannelUpdate
from .service import channel_service
from ..db import get_db

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("")
def list_channels():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM channels ORDER BY created_at DESC").fetchall()
        return {"channels": [dict(r) for r in rows]}


@router.post("")
def create_channel(body: ChannelCreate):
    import uuid
    from datetime import datetime, timezone

    channel_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            """INSERT INTO channels (id, agent_id, name, type, description, config, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (channel_id, body.agent_id, body.name, body.type, body.description, body.config, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()

    return {"channel": dict(row)}


@router.get("/{channel_id}")
def get_channel(channel_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Channel not found")
        return {"channel": dict(row)}


@router.put("/{channel_id}")
def update_channel(channel_id: str, body: ChannelUpdate):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Channel not found")

        updates = {}
        for field, value in body.model_dump(exclude_unset=True).items():
            if value is not None:
                updates[field] = value

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [channel_id]
            conn.execute(f"UPDATE channels SET {set_clause} WHERE id = ?", values)
            conn.commit()

        row = conn.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        return {"channel": dict(row)}


@router.delete("/{channel_id}")
def delete_channel(channel_id: str):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Channel not found")
        conn.execute("DELETE FROM channels WHERE id = ?", (channel_id,))
        conn.commit()

    return {"deleted": channel_id}


@router.post("/{channel_id}/connect")
async def connect_channel(channel_id: str):
    ok = await channel_service.connect_channel(channel_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"channel_id": channel_id, "status": "connected"}


@router.post("/{channel_id}/disconnect")
async def disconnect_channel(channel_id: str):
    ok = await channel_service.disconnect_channel(channel_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"channel_id": channel_id, "status": "disconnected"}
