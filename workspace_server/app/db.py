import os
import uuid
import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Any, Iterator

from sqlmodel import SQLModel, create_engine, Session

from .config import settings

DATABASE_PATH = os.environ.get("DATABASE_PATH") or settings.database_path

engine = create_engine(
    f"sqlite:///{DATABASE_PATH}",
    connect_args={"check_same_thread": False},
    echo=False,
)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def run_migrations(db_path: str):
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()


def database_has_data(db_path: str) -> bool:
    conn = sqlite3.connect(db_path)
    cur = conn.execute("SELECT COUNT(*) FROM connected_apps")
    count = cur.fetchone()[0]
    conn.close()
    return count > 0


def seed_default_data(db_path: str):
    conn = sqlite3.connect(db_path)
    now = _now_iso()
    conn.executescript(SEED_SQL.format(now=now))
    conn.commit()
    conn.close()


def init_database(db_path: str):
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    run_migrations(db_path)
    if not database_has_data(db_path):
        seed_default_data(db_path)


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS instances (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    model           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'stopped',
    temperature     REAL NOT NULL DEFAULT 0.7,
    system_prompt   TEXT DEFAULT '',
    region          TEXT DEFAULT 'us-east',
    environment     TEXT DEFAULT 'production',
    memories_organiser TEXT DEFAULT 'file',
    plugins         TEXT DEFAULT '{}',
    skills          TEXT DEFAULT '[]',
    integrations    TEXT DEFAULT '[]',
    created_at      TEXT NOT NULL,
    last_active_at  TEXT,
    usage           INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS channels (
    id              TEXT PRIMARY KEY,
    agent_id        TEXT,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'disconnected',
    description     TEXT DEFAULT '',
    config          TEXT DEFAULT '{}',
    messages_count  INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_teams (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    description             TEXT DEFAULT '',
    status                  TEXT DEFAULT 'idle',
    core_agent_id           TEXT,
    core_agent_role_context TEXT DEFAULT '',
    trigger                 TEXT DEFAULT 'manual',
    last_run                TEXT DEFAULT '\u2014',
    runs                    INTEGER DEFAULT 0,
    created_at              TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    id              TEXT PRIMARY KEY,
    team_id         TEXT NOT NULL,
    instance_id     TEXT NOT NULL,
    role_context    TEXT DEFAULT '',
    max_parallel    INTEGER
);

CREATE TABLE IF NOT EXISTS knowledge_bases (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    status          TEXT DEFAULT 'indexing',
    vector_store    TEXT DEFAULT 'pgvector',
    embedding_model TEXT DEFAULT 'text-embedding-3-large',
    rag_llm         TEXT DEFAULT 'gpt-4o',
    top_k           INTEGER DEFAULT 5,
    min_similarity  REAL DEFAULT 0.72,
    chunk_size      INTEGER DEFAULT 512,
    visibility      TEXT DEFAULT 'private',
    allowed_ws_ids  TEXT DEFAULT '[]',
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kb_sources (
    id         TEXT PRIMARY KEY,
    kb_id      TEXT NOT NULL,
    name       TEXT NOT NULL,
    type       TEXT NOT NULL,
    size       TEXT DEFAULT '',
    chunks     INTEGER DEFAULT 0,
    status     TEXT DEFAULT 'processing',
    metadata   TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_tools (
    id         TEXT PRIMARY KEY,
    label      TEXT NOT NULL,
    config     TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_mcps (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    api_key    TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
    id          TEXT PRIMARY KEY,
    parent_id   TEXT,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    size        TEXT,
    modified_at TEXT NOT NULL,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gateway_sessions (
    key         TEXT PRIMARY KEY,
    agent_id    TEXT,
    title       TEXT,
    status      TEXT,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          TEXT PRIMARY KEY,
    session_key TEXT NOT NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    ts          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connected_apps (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon        TEXT DEFAULT '',
    connected   INTEGER DEFAULT 0
);
"""

SEED_SQL = """
INSERT OR IGNORE INTO connected_apps (id, name, description, icon, connected) VALUES
('app-slack', 'Slack', 'Team messaging', 'slack', 0),
('app-discord', 'Discord', 'Community chat', 'discord', 0),
('app-whatsapp', 'WhatsApp', 'Business messaging', 'whatsapp', 0),
('app-telegram', 'Telegram', 'Messaging app', 'telegram', 0),
('app-email', 'Email', 'Email integration', 'email', 0),
('app-api', 'API', 'Webhook receiver', 'api', 0),
('app-web-widget', 'Web Widget', 'Embedded chat widget', 'widget', 0),
('app-teams', 'MS Teams', 'Microsoft Teams', 'teams', 0);

INSERT OR IGNORE INTO files (id, parent_id, name, type, size, modified_at, created_at) VALUES
('root', NULL, 'workspace', 'folder', '', '{now}', '{now}'),
('f-data', 'root', 'data', 'folder', '', '{now}', '{now}'),
('f-files', 'root', 'files', 'folder', '', '{now}', '{now}'),
('f-tools', 'root', 'tools', 'folder', '', '{now}', '{now}');

INSERT OR IGNORE INTO gateway_sessions (key, agent_id, title, status, updated_at) VALUES
('session-welcome', NULL, 'Welcome', 'active', '{now}');
"""
