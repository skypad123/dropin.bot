/**
 * gatewayWorker.ts — SharedWorker
 *
 * Owns one WebSocket connection per workspaceId. All browser tabs for the same
 * workspace share this single socket. The socket is kept alive as long as at
 * least one tab port is connected; it is closed when the last port disconnects.
 *
 * Communication:
 *   Tab → Worker : postMessage on the MessagePort (TabToWorkerMessage)
 *   Worker → Tabs: BroadcastChannel 'dropin-gateway' (WorkerBroadcast)
 *
 * Handshake (OpenClaw Gateway WS protocol v4):
 *   1. ws.onopen  → wait for connect.challenge event from server
 *   2. challenge  → sign nonce with ECDSA P-256 private key (SubtleCrypto)
 *   3. send connect req frame
 *   4. hello-ok   → broadcast status:'connected', start tick watchdog
 *   5. PAIRING_REQUIRED error → broadcast status:'pairing_required'
 *   6. other error / close   → schedule exponential-backoff reconnect
 */

/// <reference lib="webworker" />

import type {
  TabToWorkerMessage,
  WorkerBroadcast,
  ConnStatus,
  InboundFrame,
  HelloOkPayload,
  ErrorDetails,
} from '../lib/gatewayProtocol';
import {
  PROTOCOL_VERSION,
  MIN_PROTOCOL_VERSION,
  CLIENT_ID,
  CLIENT_VERSION,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_RECONNECT_BACKOFF_MS,
  MAX_RECONNECT_BACKOFF_MS,
  PREAUTH_TIMEOUT_MS,
  ERROR_CODES,
  makeConnectRequest,
  makeRpcRequest,
  nextReqId,
} from '../lib/gatewayProtocol';

declare const self: SharedWorkerGlobalScope;

// ── BroadcastChannel for outbound messages to all tabs ───────────────────────
const bc = new BroadcastChannel('dropin-gateway');

function broadcast(msg: WorkerBroadcast) {
  bc.postMessage(msg);
}

// ── Per-workspace socket state ───────────────────────────────────────────────

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface SocketState {
  ws: WebSocket | null;
  status: ConnStatus;
  ports: Set<MessagePort>;

  // Connection config (needed for reconnects)
  endpoint: string;
  token: string;
  deviceId: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;

  // Handshake state
  challengeNonce: string | null;
  connectReqId: string | null;
  preauthTimer: ReturnType<typeof setTimeout> | null;

  // Post-handshake
  tickIntervalMs: number;
  tickWatchdog: ReturnType<typeof setTimeout> | null;
  connId: string | null;
  protocol: number | null;

  // Reconnect
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempt: number;
  intentionalClose: boolean;

  // In-flight RPC requests
  pendingRequests: Map<string, PendingRequest>;
}

const sockets = new Map<string, SocketState>();

// ── Crypto helpers (SubtleCrypto available in SharedWorker) ──────────────────

async function signChallenge(params: {
  privateKeyJwk: JsonWebKey;
  deviceId: string;
  role: string;
  scopes: string[];
  token: string;
  nonce: string;
}): Promise<string> {
  const { privateKeyJwk, deviceId, role, scopes, token, nonce } = params;

  // v3 payload: deviceId:clientId:role:scopes_csv:token:nonce:platform:deviceFamily
  const payload = [deviceId, CLIENT_ID, role, scopes.join(','), token, nonce, 'browser', 'browser'].join(':');

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const sigBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(payload),
  );

  return btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Reconnect backoff ────────────────────────────────────────────────────────

function backoffMs(attempt: number): number {
  return Math.min(DEFAULT_RECONNECT_BACKOFF_MS * 2 ** attempt, MAX_RECONNECT_BACKOFF_MS);
}

// ── Tick watchdog ────────────────────────────────────────────────────────────

function resetTickWatchdog(state: SocketState) {
  if (state.tickWatchdog) clearTimeout(state.tickWatchdog);
  const interval = state.tickIntervalMs > 0 ? state.tickIntervalMs : 30_000;
  state.tickWatchdog = setTimeout(() => {
    // No tick received within 2× interval — close and reconnect
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.intentionalClose = false;
      state.ws.close(4000, 'tick-timeout');
    }
  }, interval * 2);
}

// ── Connect ──────────────────────────────────────────────────────────────────

function connect(workspaceId: string) {
  const state = sockets.get(workspaceId);
  if (!state) return;

  // Clean up any existing socket
  if (state.ws) {
    state.intentionalClose = true;
    state.ws.onopen = null;
    state.ws.onmessage = null;
    state.ws.onclose = null;
    state.ws.onerror = null;
    if (state.ws.readyState < WebSocket.CLOSING) state.ws.close();
    state.ws = null;
  }

  if (state.reconnectTimer) { clearTimeout(state.reconnectTimer); state.reconnectTimer = null; }
  if (state.tickWatchdog)   { clearTimeout(state.tickWatchdog);   state.tickWatchdog = null; }
  if (state.preauthTimer)   { clearTimeout(state.preauthTimer);   state.preauthTimer = null; }

  state.status = 'connecting';
  state.challengeNonce = null;
  state.connectReqId = null;
  state.intentionalClose = false;

  broadcast({ type: 'status', workspaceId, status: 'connecting' });

  let ws: WebSocket;
  try {
    ws = new WebSocket(state.endpoint);
  } catch (err) {
    scheduleReconnect(workspaceId, String(err));
    return;
  }

  state.ws = ws;

  // Pre-auth timeout: if we don't complete handshake in time, close
  state.preauthTimer = setTimeout(() => {
    if (state.status === 'connecting') {
      state.intentionalClose = false;
      ws.close(1001, 'preauth-timeout');
    }
  }, PREAUTH_TIMEOUT_MS);

  ws.onopen = () => {
    // Wait for connect.challenge event — do nothing here
  };

  ws.onmessage = async (ev: MessageEvent) => {
    let frame: InboundFrame;
    try {
      frame = JSON.parse(ev.data as string) as InboundFrame;
    } catch {
      return;
    }

    await handleFrame(workspaceId, state, frame);
  };

  ws.onclose = (ev: CloseEvent) => {
    if (state.preauthTimer) { clearTimeout(state.preauthTimer); state.preauthTimer = null; }
    if (state.tickWatchdog) { clearTimeout(state.tickWatchdog); state.tickWatchdog = null; }

    // Reject all pending requests
    for (const [, pending] of state.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`WebSocket closed: ${ev.code} ${ev.reason}`));
    }
    state.pendingRequests.clear();

    if (state.intentionalClose || state.ports.size === 0) {
      state.status = 'disconnected';
      broadcast({ type: 'status', workspaceId, status: 'disconnected' });
      return;
    }

    scheduleReconnect(workspaceId, `closed ${ev.code}`);
  };

  ws.onerror = () => {
    // onclose will fire after onerror — handle reconnect there
  };
}

// ── Frame handler ────────────────────────────────────────────────────────────

async function handleFrame(workspaceId: string, state: SocketState, frame: InboundFrame) {
  // connect.challenge — server wants us to authenticate
  if (frame.type === 'event' && frame.event === 'connect.challenge') {
    const { nonce } = frame.payload as { nonce: string; ts: number };
    state.challengeNonce = nonce;

    // Sign and send connect request
    try {
      const signature = await signChallenge({
        privateKeyJwk: state.privateKeyJwk,
        deviceId: state.deviceId,
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        token: state.token,
        nonce,
      });

      const reqId = nextReqId();
      state.connectReqId = reqId;

      const connectReq = makeConnectRequest({
        minProtocol: MIN_PROTOCOL_VERSION,
        maxProtocol: PROTOCOL_VERSION,
        client: {
          id: CLIENT_ID,
          version: CLIENT_VERSION,
          platform: 'browser',
          mode: 'operator',
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token: state.token },
        locale: navigator.language || 'en-US',
        userAgent: `dropin-bot-ui/${CLIENT_VERSION}`,
        device: {
          id: state.deviceId,
          publicKey: JSON.stringify(state.publicKeyJwk),
          signature,
          signedAt: Date.now(),
          nonce,
        },
      });

      // Override the id so we can match the response
      connectReq.id = reqId;
      state.ws?.send(JSON.stringify(connectReq));
    } catch (err) {
      scheduleReconnect(workspaceId, `sign error: ${String(err)}`);
    }
    return;
  }

  // Response to our connect request
  if (frame.type === 'res' && frame.id === state.connectReqId) {
    if (state.preauthTimer) { clearTimeout(state.preauthTimer); state.preauthTimer = null; }

    if (frame.ok) {
      const payload = frame.payload as HelloOkPayload;
      state.status = 'connected';
      state.connId = payload.server.connId;
      state.protocol = payload.protocol;
      state.tickIntervalMs = payload.policy.tickIntervalMs;
      state.reconnectAttempt = 0;

      // Persist device token if issued
      if (payload.auth.deviceToken) {
        try {
          localStorage.setItem(`dropin-device-token-${workspaceId}`, payload.auth.deviceToken);
        } catch { /* localStorage not available in worker — tabs handle persistence */ }
      }

      broadcast({
        type: 'status',
        workspaceId,
        status: 'connected',
        connId: payload.server.connId,
        protocol: payload.protocol,
      });

      resetTickWatchdog(state);
    } else {
      const err = (frame as { ok: false; error: { code: string; message: string; details?: ErrorDetails } }).error;
      const code = err?.code ?? '';
      const details = err?.details;

      if (code === ERROR_CODES.PAIRING_REQUIRED) {
        state.status = 'pairing_required';
        broadcast({
          type: 'status',
          workspaceId,
          status: 'pairing_required',
          error: err?.message,
        });

        // Retry after retryAfterMs if provided, otherwise keep reconnecting
        const retryAfter = details?.retryAfterMs ?? backoffMs(state.reconnectAttempt);
        if (!details?.pauseReconnect) {
          state.reconnectTimer = setTimeout(() => connect(workspaceId), retryAfter);
        }
      } else if (code === ERROR_CODES.UNAVAILABLE && details?.retryAfterMs) {
        // Gateway still starting up — retry after suggested delay
        state.reconnectTimer = setTimeout(() => connect(workspaceId), details.retryAfterMs);
      } else {
        scheduleReconnect(workspaceId, err?.message ?? 'connect failed');
      }
    }
    return;
  }

  // Tick event — reset watchdog
  if (frame.type === 'event' && frame.event === 'tick') {
    resetTickWatchdog(state);
    return;
  }

  // Shutdown event — don't reconnect
  if (frame.type === 'event' && frame.event === 'shutdown') {
    state.intentionalClose = true;
    state.status = 'disconnected';
    broadcast({ type: 'status', workspaceId, status: 'disconnected', error: 'gateway shutdown' });
    return;
  }

  // Response to an in-flight RPC request
  if (frame.type === 'res') {
    const pending = state.pendingRequests.get(frame.id);
    if (pending) {
      clearTimeout(pending.timer);
      state.pendingRequests.delete(frame.id);
      if (frame.ok) {
        pending.resolve(frame.payload);
      } else {
        pending.reject(frame.error);
      }
    }
    return;
  }

  // All other events — broadcast to tabs
  if (frame.type === 'event') {
    const seq = 'seq' in frame ? (frame as { seq?: number }).seq : undefined;
    broadcast({
      type: 'event',
      workspaceId,
      event: frame.event,
      payload: frame.payload,
      seq,
    });
  }
}

// ── Reconnect ────────────────────────────────────────────────────────────────

function scheduleReconnect(workspaceId: string, reason: string) {
  const state = sockets.get(workspaceId);
  if (!state || state.ports.size === 0) return;

  state.status = 'error';
  broadcast({ type: 'status', workspaceId, status: 'error', error: reason });

  const delay = backoffMs(state.reconnectAttempt);
  state.reconnectAttempt++;
  state.reconnectTimer = setTimeout(() => connect(workspaceId), delay);
}

// ── Send RPC ─────────────────────────────────────────────────────────────────

function sendRpc(workspaceId: string, method: string, params: unknown, reqId: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const state = sockets.get(workspaceId);
    if (!state || !state.ws || state.ws.readyState !== WebSocket.OPEN) {
      reject(new Error('Not connected'));
      return;
    }

    const req = makeRpcRequest(method, params);
    req.id = reqId; // use caller-provided id for correlation

    const timer = setTimeout(() => {
      state.pendingRequests.delete(reqId);
      reject(new Error(`RPC timeout: ${method}`));
    }, DEFAULT_REQUEST_TIMEOUT_MS);

    state.pendingRequests.set(reqId, { resolve, reject, timer });
    state.ws.send(JSON.stringify(req));
  });
}

// ── Port (tab) lifecycle ─────────────────────────────────────────────────────

function removePort(workspaceId: string, port: MessagePort) {
  const state = sockets.get(workspaceId);
  if (!state) return;

  state.ports.delete(port);

  // If no more tabs are watching this workspace, close the socket
  if (state.ports.size === 0) {
    if (state.reconnectTimer) { clearTimeout(state.reconnectTimer); state.reconnectTimer = null; }
    if (state.tickWatchdog)   { clearTimeout(state.tickWatchdog);   state.tickWatchdog = null; }
    if (state.preauthTimer)   { clearTimeout(state.preauthTimer);   state.preauthTimer = null; }

    if (state.ws) {
      state.intentionalClose = true;
      if (state.ws.readyState < WebSocket.CLOSING) state.ws.close(1000, 'no-tabs');
      state.ws = null;
    }

    state.status = 'disconnected';
    broadcast({ type: 'status', workspaceId, status: 'disconnected' });
    sockets.delete(workspaceId);
  }
}

// ── SharedWorker onconnect ───────────────────────────────────────────────────

self.onconnect = (ev: MessageEvent) => {
  const port = ev.ports[0];

  port.onmessage = (msgEv: MessageEvent) => {
    const msg = msgEv.data as TabToWorkerMessage;

    switch (msg.type) {
      case 'connect': {
        const { workspaceId, endpoint, token, deviceId, publicKeyJwk, privateKeyJwk } = msg;

        let state = sockets.get(workspaceId);

        if (!state) {
          // First tab for this workspace — create state and connect
          state = {
            ws: null,
            status: 'disconnected',
            ports: new Set([port]),
            endpoint,
            token,
            deviceId,
            publicKeyJwk,
            privateKeyJwk,
            challengeNonce: null,
            connectReqId: null,
            preauthTimer: null,
            tickIntervalMs: 30_000,
            tickWatchdog: null,
            connId: null,
            protocol: null,
            reconnectTimer: null,
            reconnectAttempt: 0,
            intentionalClose: false,
            pendingRequests: new Map(),
          };
          sockets.set(workspaceId, state);
          connect(workspaceId);
        } else {
          // Additional tab joining an existing connection
          state.ports.add(port);

          // Update credentials in case they changed
          state.endpoint = endpoint;
          state.token = token;
          state.deviceId = deviceId;
          state.publicKeyJwk = publicKeyJwk;
          state.privateKeyJwk = privateKeyJwk;

          // Immediately send current status to the new tab
          broadcast({
            type: 'status',
            workspaceId,
            status: state.status,
            connId: state.connId ?? undefined,
            protocol: state.protocol ?? undefined,
          });

          // If currently disconnected/error, trigger a fresh connect
          if (state.status === 'disconnected' || state.status === 'error') {
            connect(workspaceId);
          }
        }
        break;
      }

      case 'disconnect': {
        removePort(msg.workspaceId, port);
        break;
      }

      case 'tab_closing': {
        removePort(msg.workspaceId, port);
        break;
      }

      case 'send': {
        const { workspaceId, method, params, reqId } = msg;
        sendRpc(workspaceId, method, params, reqId)
          .then(payload => {
            broadcast({ type: 'response', workspaceId, reqId, ok: true, payload });
          })
          .catch(err => {
            broadcast({ type: 'response', workspaceId, reqId, ok: false, error: String(err) });
          });
        break;
      }
    }
  };

  port.start();
};
