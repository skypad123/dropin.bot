from fastapi import APIRouter, HTTPException
from .models import Instance, InstanceCreate, InstanceUpdate
from .orchestrator import orchestrator
from ..db import get_db

router = APIRouter(prefix="/instances", tags=["agents"])


@router.get("")
def list_instances():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM instances ORDER BY created_at DESC").fetchall()
        return {"instances": [dict(r) for r in rows]}


@router.post("")
def create_instance(body: InstanceCreate):
    import uuid
    from datetime import datetime, timezone

    instance_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            """INSERT INTO instances (id, name, model, temperature, system_prompt,
               region, environment, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (instance_id, body.name, body.model, body.temperature,
             body.system_prompt, body.region, body.environment, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM instances WHERE id = ?", (instance_id,)).fetchone()

    return {"instance": dict(row)}


@router.get("/{instance_id}")
def get_instance(instance_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM instances WHERE id = ?", (instance_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Instance not found")
        return {"instance": dict(row)}


@router.put("/{instance_id}")
def update_instance(instance_id: str, body: InstanceUpdate):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM instances WHERE id = ?", (instance_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Instance not found")

        updates = {}
        for field, value in body.model_dump(exclude_unset=True).items():
            if value is not None:
                updates[field] = value

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [instance_id]
            conn.execute(f"UPDATE instances SET {set_clause} WHERE id = ?", values)
            conn.commit()

        row = conn.execute("SELECT * FROM instances WHERE id = ?", (instance_id,)).fetchone()
        return {"instance": dict(row)}


@router.delete("/{instance_id}")
def delete_instance(instance_id: str):
    if orchestrator.is_running(instance_id):
        raise HTTPException(status_code=409, detail="Stop the agent before deleting")

    with get_db() as conn:
        existing = conn.execute("SELECT * FROM instances WHERE id = ?", (instance_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Instance not found")
        conn.execute("DELETE FROM instances WHERE id = ?", (instance_id,))
        conn.commit()

    return {"deleted": instance_id}


@router.post("/{instance_id}/run")
async def start_instance(instance_id: str):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM instances WHERE id = ?", (instance_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Instance not found")

    run_id = await orchestrator.start_agent(instance_id)
    return {"instance_id": instance_id, "run_id": run_id, "status": "running"}


@router.post("/{instance_id}/stop")
async def stop_instance(instance_id: str):
    await orchestrator.stop_agent(instance_id)
    return {"instance_id": instance_id, "status": "stopped"}
