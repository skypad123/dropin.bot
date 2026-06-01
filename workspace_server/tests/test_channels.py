import json
import pytest


def test_list_channels_empty(client):
    resp = client.get("/api/v1/ws/channels")
    assert resp.status_code == 200
    data = resp.json()
    assert "channels" in data
    assert isinstance(data["channels"], list)


def test_create_channel(client):
    resp = client.post("/api/v1/ws/channels", json={
        "name": "Test Slack",
        "type": "slack",
        "description": "My Slack workspace",
        "config": '{"bot_token": "xoxb-test"}',
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["channel"]["name"] == "Test Slack"
    assert data["channel"]["type"] == "slack"
    assert data["channel"]["status"] == "disconnected"
    assert "id" in data["channel"]


def test_get_channel(client):
    create = client.post("/api/v1/ws/channels", json={
        "name": "Get Channel", "type": "discord",
    })
    channel_id = create.json()["channel"]["id"]

    resp = client.get(f"/api/v1/ws/channels/{channel_id}")
    assert resp.status_code == 200
    assert resp.json()["channel"]["name"] == "Get Channel"


def test_update_channel(client):
    create = client.post("/api/v1/ws/channels", json={
        "name": "Update Channel", "type": "telegram",
    })
    channel_id = create.json()["channel"]["id"]

    resp = client.put(f"/api/v1/ws/channels/{channel_id}", json={
        "name": "Updated Channel",
        "description": "New description",
    })
    assert resp.status_code == 200
    assert resp.json()["channel"]["name"] == "Updated Channel"


def test_delete_channel(client):
    create = client.post("/api/v1/ws/channels", json={
        "name": "Delete Channel", "type": "whatsapp",
    })
    channel_id = create.json()["channel"]["id"]

    resp = client.delete(f"/api/v1/ws/channels/{channel_id}")
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/ws/channels/{channel_id}")
    assert resp.status_code == 404


def test_channel_not_found(client):
    resp = client.get("/api/v1/ws/channels/nonexistent")
    assert resp.status_code == 404


def test_channel_connect_disconnect(client):
    create = client.post("/api/v1/ws/channels", json={
        "name": "Connect Test", "type": "slack",
    })
    channel_id = create.json()["channel"]["id"]

    resp = client.post(f"/api/v1/ws/channels/{channel_id}/connect")
    assert resp.status_code == 200
    assert resp.json()["status"] == "connected"

    resp = client.post(f"/api/v1/ws/channels/{channel_id}/disconnect")
    assert resp.status_code == 200
    assert resp.json()["status"] == "disconnected"


def test_channel_connect_not_found(client):
    resp = client.post("/api/v1/ws/channels/nonexistent/connect")
    assert resp.status_code == 404


def test_create_channel_with_agent(client):
    agent_resp = client.post("/api/v1/ws/instances", json={
        "name": "Agent For Channel", "model": "gpt-4o",
    })
    agent_id = agent_resp.json()["instance"]["id"]

    resp = client.post("/api/v1/ws/channels", json={
        "name": "Agent Channel",
        "type": "discord",
        "agent_id": agent_id,
    })
    assert resp.status_code == 200
    assert resp.json()["channel"]["agent_id"] == agent_id
