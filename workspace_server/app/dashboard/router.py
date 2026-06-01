from fastapi import APIRouter
from ..db import get_db
from ..config import settings

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard():
    stats = {}

    with get_db() as conn:
        instances = conn.execute("SELECT COUNT(*) as c FROM instances").fetchone()
        stats["instances_total"] = instances["c"]

        running = conn.execute(
            "SELECT COUNT(*) as c FROM instances WHERE status = 'running'"
        ).fetchone()
        stats["instances_running"] = running["c"]

        channels = conn.execute("SELECT COUNT(*) as c FROM channels").fetchone()
        stats["channels_total"] = channels["c"]

        connected = conn.execute(
            "SELECT COUNT(*) as c FROM channels WHERE status = 'connected'"
        ).fetchone()
        stats["channels_connected"] = connected["c"]

        teams = conn.execute("SELECT COUNT(*) as c FROM agent_teams").fetchone()
        stats["teams_total"] = teams["c"]

        kbs = conn.execute("SELECT COUNT(*) as c FROM knowledge_bases").fetchone()
        stats["knowledge_bases_total"] = kbs["c"]

        files = conn.execute("SELECT COUNT(*) as c FROM files").fetchone()
        stats["files_total"] = files["c"]

        tools = conn.execute("SELECT COUNT(*) as c FROM workspace_tools").fetchone()
        stats["custom_tools"] = tools["c"]

        mcps = conn.execute("SELECT COUNT(*) as c FROM workspace_mcps").fetchone()
        stats["mcps"] = mcps["c"]

        messages = conn.execute("SELECT COUNT(*) as c FROM chat_messages").fetchone()
        stats["chat_messages_total"] = messages["c"]

        sessions = conn.execute("SELECT COUNT(*) as c FROM gateway_sessions").fetchone()
        stats["sessions_total"] = sessions["c"]

    stats["workspace_id"] = settings.workspace_id
    stats["workspace_name"] = settings.workspace_name

    return {"dashboard": stats}
