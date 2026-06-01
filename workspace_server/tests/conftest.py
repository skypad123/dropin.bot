import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def setup_db(monkeypatch):
    tmpdir = tempfile.mkdtemp()
    db_path = os.path.join(tmpdir, "test_workspace.db")
    files_path = os.path.join(tmpdir, "files")
    os.makedirs(files_path, exist_ok=True)

    monkeypatch.setenv("DATABASE_PATH", db_path)
    monkeypatch.setenv("FILES_PATH", files_path)
    monkeypatch.setenv("GATEWAY_TOKEN", "test-token")
    monkeypatch.setenv("WORKSPACE_ID", "test-ws-1")
    monkeypatch.setenv("DISABLE_HUB_REPORT", "1")

    from app.config import settings
    settings.database_path = db_path
    settings.files_path = files_path
    settings.gateway_token = "test-token"
    settings.workspace_id = "test-ws-1"

    import app.db as db_mod
    db_mod.DATABASE_PATH = db_path
    db_mod.engine = None

    from app.db import init_database
    init_database(db_path)

    yield db_path

    import shutil
    shutil.rmtree(tmpdir, ignore_errors=True)


@pytest.fixture
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c
