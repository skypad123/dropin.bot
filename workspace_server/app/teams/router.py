from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("")
def list_teams():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM agent_teams ORDER BY created_at DESC").fetchall()
        teams = []
        for row in rows:
            team = dict(row)
            members = conn.execute(
                "SELECT * FROM team_members WHERE team_id = ?", (team["id"],)
            ).fetchall()
            team["members"] = [dict(m) for m in members]
            teams.append(team)
        return {"teams": teams}


@router.post("")
def create_team(body: dict):
    import uuid
    from datetime import datetime, timezone

    team_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            """INSERT INTO agent_teams (id, name, description, core_agent_id,
               core_agent_role_context, trigger, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                team_id,
                body.get("name", "New Team"),
                body.get("description", ""),
                body.get("core_agent_id"),
                body.get("core_agent_role_context", ""),
                body.get("trigger", "manual"),
                now,
            ),
        )
        conn.commit()

        for member in body.get("members", []):
            member_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO team_members (id, team_id, instance_id, role_context, max_parallel) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    member_id,
                    team_id,
                    member.get("instance_id"),
                    member.get("role_context", ""),
                    member.get("max_parallel", 1),
                ),
            )
        conn.commit()

        row = conn.execute("SELECT * FROM agent_teams WHERE id = ?", (team_id,)).fetchone()
        members = conn.execute(
            "SELECT * FROM team_members WHERE team_id = ?", (team_id,)
        ).fetchall()
        team = dict(row)
        team["members"] = [dict(m) for m in members]
        return {"team": team}


@router.get("/{team_id}")
def get_team(team_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM agent_teams WHERE id = ?", (team_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Team not found")
        team = dict(row)
        members = conn.execute(
            "SELECT * FROM team_members WHERE team_id = ?", (team_id,)
        ).fetchall()
        team["members"] = [dict(m) for m in members]
        return {"team": team}


@router.put("/{team_id}")
def update_team(team_id: str, body: dict):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM agent_teams WHERE id = ?", (team_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Team not found")

        updatable = ["name", "description", "core_agent_id", "core_agent_role_context", "trigger", "status"]
        updates = {k: v for k, v in body.items() if k in updatable and v is not None}

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [team_id]
            conn.execute(f"UPDATE agent_teams SET {set_clause} WHERE id = ?", values)
            conn.commit()

        row = conn.execute("SELECT * FROM agent_teams WHERE id = ?", (team_id,)).fetchone()
        members = conn.execute(
            "SELECT * FROM team_members WHERE team_id = ?", (team_id,)
        ).fetchall()
        team = dict(row)
        team["members"] = [dict(m) for m in members]
        return {"team": team}


@router.delete("/{team_id}")
def delete_team(team_id: str):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM agent_teams WHERE id = ?", (team_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Team not found")
        conn.execute("DELETE FROM team_members WHERE team_id = ?", (team_id,))
        conn.execute("DELETE FROM agent_teams WHERE id = ?", (team_id,))
        conn.commit()
    return {"deleted": team_id}


@router.post("/{team_id}/run")
async def run_team(team_id: str):
    from datetime import datetime, timezone

    with get_db() as conn:
        existing = conn.execute("SELECT * FROM agent_teams WHERE id = ?", (team_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Team not found")

        conn.execute(
            "UPDATE agent_teams SET status = 'running', last_run = ?, runs = runs + 1 WHERE id = ?",
            (datetime.now(timezone.utc).isoformat(), team_id),
        )
        conn.commit()

    return {
        "team_id": team_id,
        "status": "running",
        "message": f"Team '{existing['name']}' run triggered",
    }
