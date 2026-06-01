import io
import json
import pytest


def test_list_files_has_seed(client):
    resp = client.get("/api/v1/ws/files")
    assert resp.status_code == 200
    data = resp.json()
    assert "files" in data
    assert len(data["files"]) >= 1


def test_get_file_info(client):
    resp = client.get("/api/v1/ws/files/root")
    assert resp.status_code == 200
    data = resp.json()
    assert data["file"]["name"] == "workspace"
    assert data["file"]["type"] == "folder"


def test_get_file_not_found(client):
    resp = client.get("/api/v1/ws/files/nonexistent")
    assert resp.status_code == 404


def test_create_folder(client):
    resp = client.post("/api/v1/ws/files/folders", json={
        "name": "test-folder",
        "parent_id": "root",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["file"]["name"] == "test-folder"
    assert data["file"]["type"] == "folder"
    assert data["file"]["parent_id"] == "root"


def test_upload_file(client):
    file_content = b"Hello, workspace!"
    resp = client.post(
        "/api/v1/ws/files",
        files={"file": ("hello.txt", io.BytesIO(file_content), "text/plain")},
        data={"parent_id": "root"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["file"]["name"] == "hello.txt"
    assert data["file"]["type"] == "file"
    assert "B" in data["file"]["size"]


def test_delete_file(client):
    create = client.post("/api/v1/ws/files/folders", json={
        "name": "to-delete",
    })
    file_id = create.json()["file"]["id"]

    resp = client.delete(f"/api/v1/ws/files/{file_id}")
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/ws/files/{file_id}")
    assert resp.status_code == 404


def test_rename_file(client):
    create = client.post("/api/v1/ws/files/folders", json={
        "name": "original-name",
    })
    file_id = create.json()["file"]["id"]

    resp = client.put(f"/api/v1/ws/files/{file_id}", json={
        "name": "renamed",
    })
    assert resp.status_code == 200
    assert resp.json()["file"]["name"] == "renamed"


def test_file_tree_with_parent(client):
    folder = client.post("/api/v1/ws/files/folders", json={
        "name": "subfolder",
        "parent_id": "root",
    })
    folder_id = folder.json()["file"]["id"]

    client.post("/api/v1/ws/files/folders", json={
        "name": "nested",
        "parent_id": folder_id,
    })

    resp = client.get(f"/api/v1/ws/files?parent_id={folder_id}")
    assert resp.status_code == 200
    children = resp.json()["files"]
    assert len(children) == 1
    assert children[0]["name"] == "nested"
