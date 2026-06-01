import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from ..config import settings


class FileStorage:
    def __init__(self, root: Optional[Path] = None):
        self._root = root

    @property
    def root(self) -> Path:
        if self._root is not None:
            return self._root.resolve()
        return Path(settings.files_path).resolve()

    @root.setter
    def root(self, value: Path):
        self._root = value

    def resolve(self, relative_path: str) -> Path:
        root = self.root
        root.mkdir(parents=True, exist_ok=True)
        full = (root / relative_path).resolve()
        if not str(full).startswith(str(root)):
            raise ValueError(f"Path escape attempt: {relative_path}")
        return full

    def list_tree(self, parent_id: Optional[str] = None) -> list[dict]:
        from ..db import get_db
        with get_db() as conn:
            if parent_id:
                rows = conn.execute(
                    "SELECT * FROM files WHERE parent_id = ? ORDER BY type DESC, name ASC",
                    (parent_id,),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM files WHERE parent_id IS NULL OR parent_id = '' ORDER BY type DESC, name ASC"
                ).fetchall()
            return [dict(r) for r in rows]

    def get_node(self, file_id: str) -> Optional[dict]:
        from ..db import get_db
        with get_db() as conn:
            row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
            return dict(row) if row else None

    def create_folder(self, name: str, parent_id: Optional[str] = None) -> dict:
        import uuid
        from ..db import get_db

        folder_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        root = self.root
        root.mkdir(parents=True, exist_ok=True)

        parent_path = ""
        if parent_id:
            parent = self.get_node(parent_id)
            if parent:
                parent_path = parent.get("name", "")

        folder_path = root / parent_path / name if parent_path else root / name
        folder_path.mkdir(parents=True, exist_ok=True)

        with get_db() as conn:
            conn.execute(
                "INSERT INTO files (id, parent_id, name, type, size, modified_at, created_at) "
                "VALUES (?, ?, ?, 'folder', '', ?, ?)",
                (folder_id, parent_id, name, now, now),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM files WHERE id = ?", (folder_id,)).fetchone()

        return dict(row)

    def delete_node(self, file_id: str) -> bool:
        from ..db import get_db

        node = self.get_node(file_id)
        if not node:
            return False

        root = self.root

        with get_db() as conn:
            if node["type"] == "folder":
                children = conn.execute(
                    "SELECT id FROM files WHERE parent_id = ?", (file_id,)
                ).fetchall()
                for child in children:
                    self.delete_node(child["id"])
            conn.execute("DELETE FROM files WHERE id = ?", (file_id,))
            conn.commit()

        if node.get("name"):
            fs_path = root / node["name"]
            if fs_path.exists():
                if fs_path.is_dir():
                    shutil.rmtree(fs_path, ignore_errors=True)
                else:
                    fs_path.unlink(missing_ok=True)

        return True

    def rename_node(self, file_id: str, new_name: str) -> Optional[dict]:
        from ..db import get_db
        now = datetime.now(timezone.utc).isoformat()

        with get_db() as conn:
            conn.execute(
                "UPDATE files SET name = ?, modified_at = ? WHERE id = ?",
                (new_name, now, file_id),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
            return dict(row) if row else None

    def move_node(self, file_id: str, new_parent_id: Optional[str]) -> Optional[dict]:
        from ..db import get_db
        now = datetime.now(timezone.utc).isoformat()

        with get_db() as conn:
            conn.execute(
                "UPDATE files SET parent_id = ?, modified_at = ? WHERE id = ?",
                (new_parent_id, now, file_id),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
            return dict(row) if row else None


storage = FileStorage()
