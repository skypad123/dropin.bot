from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/mcps", tags=["mcp"])


@router.get("")
def list_mcps():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM workspace_mcps ORDER BY created_at DESC").fetchall()
        return {"mcps": [dict(r) for r in rows]}


@router.post("")
def add_mcp(body: dict):
    import uuid
    from datetime import datetime, timezone

    mcp_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            "INSERT INTO workspace_mcps (id, name, url, api_key, created_at) VALUES (?, ?, ?, ?, ?)",
            (mcp_id, body.get("name", ""), body.get("url", ""), body.get("api_key"), now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM workspace_mcps WHERE id = ?", (mcp_id,)).fetchone()

    return {"mcp": dict(row)}


@router.put("/{mcp_id}")
def update_mcp(mcp_id: str, body: dict):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM workspace_mcps WHERE id = ?", (mcp_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="MCP not found")

        updates = {}
        for field in ["name", "url", "api_key"]:
            if field in body and body[field] is not None:
                updates[field] = body[field]

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [mcp_id]
            conn.execute(f"UPDATE workspace_mcps SET {set_clause} WHERE id = ?", values)
            conn.commit()

        row = conn.execute("SELECT * FROM workspace_mcps WHERE id = ?", (mcp_id,)).fetchone()
        return {"mcp": dict(row)}


@router.delete("/{mcp_id}")
def remove_mcp(mcp_id: str):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM workspace_mcps WHERE id = ?", (mcp_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="MCP not found")
        conn.execute("DELETE FROM workspace_mcps WHERE id = ?", (mcp_id,))
        conn.commit()

    return {"deleted": mcp_id}
