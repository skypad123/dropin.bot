import os
from datetime import datetime, timezone

from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from .storage import storage
from ..db import get_db

router = APIRouter(prefix="/files", tags=["files"])


@router.get("")
def get_file_tree(parent_id: Optional[str] = None):
    nodes = storage.list_tree(parent_id)
    return {"files": nodes}


@router.get("/{file_id}")
def get_file_info(file_id: str):
    node = storage.get_node(file_id)
    if not node:
        raise HTTPException(status_code=404, detail="File not found")

    if node["type"] == "folder":
        children = storage.list_tree(file_id)
        node["children"] = children

    return {"file": node}


@router.post("/folders")
def create_folder(body: dict):
    name = body.get("name", "New Folder")
    parent_id = body.get("parent_id")
    node = storage.create_folder(name, parent_id)
    return {"file": node}


@router.post("")
async def upload_file(file: UploadFile = File(...), parent_id: Optional[str] = None):
    import uuid

    file_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    content = await file.read()
    size_bytes = len(content)

    parent = storage.get_node(parent_id) if parent_id else None
    parent_path = parent.get("name", "") if parent else ""
    filename = file.filename or "unnamed_file"
    root = storage.root
    root.mkdir(parents=True, exist_ok=True)
    fs_path = root / parent_path / filename if parent_path else root / filename
    fs_path.parent.mkdir(parents=True, exist_ok=True)
    fs_path.write_bytes(content)

    size_str = format_size(size_bytes)

    with get_db() as conn:
        conn.execute(
            "INSERT INTO files (id, parent_id, name, type, size, modified_at, created_at) "
            "VALUES (?, ?, ?, 'file', ?, ?, ?)",
            (file_id, parent_id, file.filename, size_str, now, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()

    return {"file": dict(row)}


@router.put("/{file_id}")
def update_file(file_id: str, body: dict):
    node = storage.get_node(file_id)
    if not node:
        raise HTTPException(status_code=404, detail="File not found")

    if "name" in body:
        node = storage.rename_node(file_id, body["name"])
    if "parent_id" in body:
        node = storage.move_node(file_id, body.get("parent_id"))

    return {"file": node}


@router.delete("/{file_id}")
def delete_file(file_id: str):
    ok = storage.delete_node(file_id)
    if not ok:
        raise HTTPException(status_code=404, detail="File not found")
    return {"deleted": file_id}


@router.get("/{file_id}/download")
def download_file(file_id: str):
    node = storage.get_node(file_id)
    if not node or node["type"] != "file":
        raise HTTPException(status_code=404, detail="File not found")

    fs_path = storage.root / node["name"]
    if not fs_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(fs_path, filename=node["name"])


def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
