from fastapi import APIRouter, HTTPException
from ..db import get_db

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge"])


@router.get("")
def list_knowledge_bases():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM knowledge_bases ORDER BY created_at DESC").fetchall()
        return {"knowledge_bases": [dict(r) for r in rows]}


@router.post("")
def create_knowledge_base(body: dict):
    import uuid
    from datetime import datetime, timezone

    kb_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            """INSERT INTO knowledge_bases (id, name, description, vector_store,
               embedding_model, rag_llm, top_k, min_similarity, chunk_size, visibility, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                kb_id,
                body.get("name", "New KB"),
                body.get("description", ""),
                body.get("vector_store", "pgvector"),
                body.get("embedding_model", "text-embedding-3-large"),
                body.get("rag_llm", "gpt-4o"),
                body.get("top_k", 5),
                body.get("min_similarity", 0.72),
                body.get("chunk_size", 512),
                body.get("visibility", "private"),
                now,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)).fetchone()

    return {"knowledge_base": dict(row)}


@router.get("/{kb_id}")
def get_knowledge_base(kb_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Knowledge base not found")
        kb = dict(row)
        sources = conn.execute(
            "SELECT * FROM kb_sources WHERE kb_id = ? ORDER BY created_at DESC", (kb_id,)
        ).fetchall()
        kb["sources"] = [dict(s) for s in sources]
        return {"knowledge_base": kb}


@router.put("/{kb_id}")
def update_knowledge_base(kb_id: str, body: dict):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Knowledge base not found")

        updatable = [
            "name", "description", "vector_store", "embedding_model",
            "rag_llm", "top_k", "min_similarity", "chunk_size", "visibility", "status",
        ]
        updates = {k: v for k, v in body.items() if k in updatable and v is not None}

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [kb_id]
            conn.execute(f"UPDATE knowledge_bases SET {set_clause} WHERE id = ?", values)
            conn.commit()

        row = conn.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)).fetchone()
        return {"knowledge_base": dict(row)}


@router.delete("/{kb_id}")
def delete_knowledge_base(kb_id: str):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Knowledge base not found")
        conn.execute("DELETE FROM kb_sources WHERE kb_id = ?", (kb_id,))
        conn.execute("DELETE FROM knowledge_bases WHERE id = ?", (kb_id,))
        conn.commit()
    return {"deleted": kb_id}


@router.post("/{kb_id}/sources")
def add_source(kb_id: str, body: dict):
    import uuid
    from datetime import datetime, timezone

    with get_db() as conn:
        existing = conn.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Knowledge base not found")

        src_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        conn.execute(
            "INSERT INTO kb_sources (id, kb_id, name, type, size, status, metadata, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                src_id,
                kb_id,
                body.get("name", "New Source"),
                body.get("type", "file"),
                body.get("size", ""),
                "processing",
                body.get("metadata", "{}"),
                now,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM kb_sources WHERE id = ?", (src_id,)).fetchone()

    return {"source": dict(row)}


@router.delete("/{kb_id}/sources/{src_id}")
def remove_source(kb_id: str, src_id: str):
    with get_db() as conn:
        existing = conn.execute(
            "SELECT * FROM kb_sources WHERE id = ? AND kb_id = ?", (src_id, kb_id)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Source not found")
        conn.execute("DELETE FROM kb_sources WHERE id = ?", (src_id,))
        conn.commit()
    return {"deleted": src_id}
