import json
import pytest

from app.gateway.protocol import ProtocolV4, EventType


def test_generate_device_identity():
    private_key, public_key = ProtocolV4.generate_device_identity()
    assert len(private_key) == 64
    assert len(public_key) == 128
    assert private_key != public_key


def test_sign_and_verify_challenge():
    private_key, public_key = ProtocolV4.generate_device_identity()

    protocol = ProtocolV4()
    challenge = protocol.create_challenge()
    nonce = challenge["payload"]["nonce"]

    signature = ProtocolV4.sign_challenge(private_key, nonce)
    assert len(signature) == 128

    valid = protocol.verify_challenge(public_key, nonce, signature)
    assert valid is True


def test_verify_challenge_rejects_wrong_nonce():
    private_key, public_key = ProtocolV4.generate_device_identity()
    protocol = ProtocolV4()

    challenge = protocol.create_challenge()
    nonce = challenge["payload"]["nonce"]
    signature = ProtocolV4.sign_challenge(private_key, nonce)

    valid = protocol.verify_challenge(public_key, "wrong-nonce", signature)
    assert valid is False


def test_verify_challenge_rejects_wrong_key():
    _, public_key = ProtocolV4.generate_device_identity()
    other_private, _ = ProtocolV4.generate_device_identity()

    protocol = ProtocolV4()
    nonce = "test-nonce"
    signature = ProtocolV4.sign_challenge(other_private, nonce)

    valid = protocol.verify_challenge(public_key, nonce, signature)
    assert valid is False


def test_create_challenge():
    protocol = ProtocolV4()
    challenge = protocol.create_challenge()

    assert challenge["type"] == "event"
    assert challenge["event"] == EventType.CONNECT_CHALLENGE.value
    assert "nonce" in challenge["payload"]
    assert "ts" in challenge["payload"]
    assert "challenge_id" in challenge["payload"]


def test_hello_ok_frame():
    protocol = ProtocolV4()
    snapshot = {"workspace_id": "test-ws-1"}
    frame = protocol.hello_ok(snapshot)

    assert frame["type"] == "hello-ok"
    assert frame["payload"]["workspace_id"] == "test-ws-1"
    assert "server_time" in frame["payload"]


def test_event_frame():
    protocol = ProtocolV4()
    frame = protocol.event(EventType.HEALTH, {"status": "ok"})

    assert frame["type"] == "event"
    assert frame["event"] == "health"
    assert frame["payload"]["status"] == "ok"


def test_error_frame():
    protocol = ProtocolV4()
    frame = protocol.error("test_code", "test message")

    assert frame["type"] == "error"
    assert frame["payload"]["code"] == "test_code"


def test_pong_frame():
    protocol = ProtocolV4()
    frame = protocol.pong()

    assert frame["type"] == "pong"
    assert "ts" in frame["payload"]


def test_event_type_enum():
    assert EventType.CONNECT_CHALLENGE.value == "connect.challenge"
    assert EventType.CHAT_MESSAGE.value == "chat.message"
    assert EventType.SESSION_MESSAGE.value == "session.message"
    assert EventType.SESSION_TOOL.value == "session.tool"


def test_verify_challenge_rejects_invalid_hex():
    protocol = ProtocolV4()
    valid = protocol.verify_challenge("invalid-hex", "nonce", "badsig")
    assert valid is False


def test_verify_challenge_rejects_short_key():
    protocol = ProtocolV4()
    valid = protocol.verify_challenge("aabb", "nonce", "badsig")
    assert valid is False
