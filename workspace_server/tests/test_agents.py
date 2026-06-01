import json
import pytest


def test_list_instances_empty(client):
    resp = client.get("/api/v1/ws/instances")
    assert resp.status_code == 200
    data = resp.json()
    assert "instances" in data
    assert isinstance(data["instances"], list)


def test_create_instance(client):
    resp = client.post("/api/v1/ws/instances", json={
        "name": "Test Agent",
        "model": "gpt-4o",
        "temperature": 0.5,
        "system_prompt": "You are a test agent.",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["instance"]["name"] == "Test Agent"
    assert data["instance"]["model"] == "gpt-4o"
    assert data["instance"]["status"] == "stopped"
    assert "id" in data["instance"]


def test_get_instance(client):
    create = client.post("/api/v1/ws/instances", json={
        "name": "Get Test",
        "model": "claude-sonnet-4-20250514",
    })
    instance_id = create.json()["instance"]["id"]

    resp = client.get(f"/api/v1/ws/instances/{instance_id}")
    assert resp.status_code == 200
    assert resp.json()["instance"]["name"] == "Get Test"


def test_get_instance_not_found(client):
    resp = client.get("/api/v1/ws/instances/nonexistent")
    assert resp.status_code == 404


def test_update_instance(client):
    create = client.post("/api/v1/ws/instances", json={
        "name": "Update Test",
        "model": "gpt-4o",
    })
    instance_id = create.json()["instance"]["id"]

    resp = client.put(f"/api/v1/ws/instances/{instance_id}", json={
        "name": "Updated Name",
        "temperature": 0.9,
    })
    assert resp.status_code == 200
    assert resp.json()["instance"]["name"] == "Updated Name"


def test_delete_instance(client):
    create = client.post("/api/v1/ws/instances", json={
        "name": "Delete Test",
        "model": "gpt-4o",
    })
    instance_id = create.json()["instance"]["id"]

    resp = client.delete(f"/api/v1/ws/instances/{instance_id}")
    assert resp.status_code == 200
    assert resp.json()["deleted"] == instance_id

    resp = client.get(f"/api/v1/ws/instances/{instance_id}")
    assert resp.status_code == 404


def test_list_instances_has_created(client):
    client.post("/api/v1/ws/instances", json={
        "name": "Agent A", "model": "gpt-4o",
    })
    client.post("/api/v1/ws/instances", json={
        "name": "Agent B", "model": "claude-sonnet-4-20250514",
    })

    resp = client.get("/api/v1/ws/instances")
    assert resp.status_code == 200
    instances = resp.json()["instances"]
    assert len(instances) >= 2


def test_instance_endpoint_health(client):
    resp = client.get("/api/v1/ws/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["workspace_id"] == "test-ws-1"
