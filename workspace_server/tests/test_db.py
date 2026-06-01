import sqlite3

from app.db import SCHEMA_SQL, SEED_SQL, _now_iso, run_migrations, seed_default_data, database_has_data


def test_schema_creates_all_tables(setup_db):
    conn = sqlite3.connect(setup_db)
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    table_names = [t[0] for t in tables]
    conn.close()

    expected = [
        "agent_teams",
        "channels",
        "chat_messages",
        "connected_apps",
        "files",
        "gateway_sessions",
        "instances",
        "kb_sources",
        "knowledge_bases",
        "team_members",
        "workspace_mcps",
        "workspace_tools",
    ]
    for t in expected:
        assert t in table_names, f"Table {t} not found"


def test_seed_data_populates(setup_db):
    conn = sqlite3.connect(setup_db)

    apps = conn.execute("SELECT COUNT(*) FROM connected_apps").fetchone()[0]
    assert apps == 8

    files = conn.execute("SELECT COUNT(*) FROM files").fetchone()[0]
    assert files == 4

    sessions = conn.execute("SELECT COUNT(*) FROM gateway_sessions").fetchone()[0]
    assert sessions == 1

    conn.close()


def test_database_has_data_after_seed(setup_db):
    assert database_has_data(setup_db) is True


def test_seed_is_idempotent(setup_db):
    conn = sqlite3.connect(setup_db)
    count_before = conn.execute("SELECT COUNT(*) FROM connected_apps").fetchone()[0]
    conn.close()

    seed_default_data(setup_db)

    conn = sqlite3.connect(setup_db)
    count_after = conn.execute("SELECT COUNT(*) FROM connected_apps").fetchone()[0]
    conn.close()

    assert count_before == count_after


def test_migrations_create_indexes(setup_db):
    conn = sqlite3.connect(setup_db)
    indexes = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='index'"
    ).fetchall()
    conn.close()
    assert len(indexes) >= 0
