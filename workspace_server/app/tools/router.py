from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/tools", tags=["tools"])


TOOL_CATALOG = [
    {
        "id": "run_shell",
        "label": "Run Shell Command",
        "description": "Execute a shell command in the sandbox",
        "config": {"timeout": 30},
    },
    {
        "id": "read_file",
        "label": "Read File",
        "description": "Read a file from the workspace",
        "config": {},
    },
    {
        "id": "write_file",
        "label": "Write File",
        "description": "Write content to a file in the workspace",
        "config": {},
    },
    {
        "id": "glob",
        "label": "Find Files",
        "description": "Search for files matching a pattern",
        "config": {},
    },
    {
        "id": "install_package",
        "label": "Install Package",
        "description": "Install a Python or Node.js package",
        "config": {"manager": "pip"},
    },
    {
        "id": "web_search",
        "label": "Web Search",
        "description": "Search the web for information",
        "config": {},
    },
    {
        "id": "web_fetch",
        "label": "Fetch URL",
        "description": "Fetch and read content from a URL",
        "config": {},
    },
    {
        "id": "list_directory",
        "label": "List Directory",
        "description": "List files in a directory",
        "config": {},
    },
    {
        "id": "git_clone",
        "label": "Git Clone",
        "description": "Clone a git repository",
        "config": {},
    },
    {
        "id": "pdf_read",
        "label": "Read PDF",
        "description": "Extract text from a PDF file",
        "config": {},
    },
    {
        "id": "image_analyze",
        "label": "Analyze Image",
        "description": "Analyze an image with vision model",
        "config": {},
    },
    {
        "id": "send_email",
        "label": "Send Email",
        "description": "Send an email",
        "config": {},
    },
    {
        "id": "database_query",
        "label": "Database Query",
        "description": "Run a SQL query on workspace database",
        "config": {},
    },
    {
        "id": "api_call",
        "label": "API Call",
        "description": "Make an HTTP API request",
        "config": {},
    },
    {
        "id": "code_execute",
        "label": "Execute Code",
        "description": "Run Python code in sandbox",
        "config": {"timeout": 60},
    },
]


@router.get("")
def list_tools():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM workspace_tools ORDER BY created_at DESC").fetchall()
        custom = [dict(r) for r in rows]

    return {"tools": TOOL_CATALOG, "custom": custom}


@router.get("/catalog")
def get_tool_catalog():
    return {"tools": TOOL_CATALOG}


@router.post("")
def add_tool(body: dict):
    import uuid
    from datetime import datetime, timezone
    import json

    tool_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            "INSERT INTO workspace_tools (id, label, config, created_at) VALUES (?, ?, ?, ?)",
            (tool_id, body.get("label", "Custom Tool"), json.dumps(body.get("config", {})), now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM workspace_tools WHERE id = ?", (tool_id,)).fetchone()

    return {"tool": dict(row)}


@router.put("/{tool_id}")
def update_tool(tool_id: str, body: dict):
    import json

    with get_db() as conn:
        existing = conn.execute("SELECT * FROM workspace_tools WHERE id = ?", (tool_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Tool not found")

        updates = {}
        if "label" in body:
            updates["label"] = body["label"]
        if "config" in body:
            updates["config"] = json.dumps(body["config"])

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [tool_id]
            conn.execute(f"UPDATE workspace_tools SET {set_clause} WHERE id = ?", values)
            conn.commit()

        row = conn.execute("SELECT * FROM workspace_tools WHERE id = ?", (tool_id,)).fetchone()
        return {"tool": dict(row)}


@router.delete("/{tool_id}")
def remove_tool(tool_id: str):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM workspace_tools WHERE id = ?", (tool_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Tool not found")
        conn.execute("DELETE FROM workspace_tools WHERE id = ?", (tool_id,))
        conn.commit()

    return {"deleted": tool_id}
