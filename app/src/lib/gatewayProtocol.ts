/**
 * gatewayProtocol.ts
 *
 * TypeScript types and frame builders for the OpenClaw Gateway WebSocket protocol.
 * Protocol version: 4
 *
 * Transport: WebSocket, text frames, JSON payloads.
 * Framing:
 *   Request  → { type: "req",   id, method, params }
 *   Response → { type: "res",   id, ok, payload | error }
 *   Event    → { type: "event", event, payload, seq?, stateVersion? }
 */

// ── Connection status ────────────────────────────────────────────────────────

export type ConnStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'pairing_required';

// ── Protocol constants ───────────────────────────────────────────────────────

export const PROTOCOL_VERSION = 4;
export const MIN_PROTOCOL_VERSION = 4;
export const CLIENT_ID = 'dropin-bot-ui';
export const CLIENT_VERSION = '1.0.0';
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
export const DEFAULT_RECONNECT_BACKOFF_MS = 1_000;
export const MAX_RECONNECT_BACKOFF_MS = 30_000;
export const PREAUTH_TIMEOUT_MS = 15_000;

// ── Inbound frames (Gateway → Client) ───────────────────────────────────────

export interface ConnectChallengeEvent {
  type: 'event';
  event: 'connect.challenge';
  payload: { nonce: string; ts: number };
}

export interface HelloOkPayload {
  type: 'hello-ok';
  protocol: number;
  server: { version: string; connId: string };
  features: { methods: string[]; events: string[] };
  snapshot: Record<string, unknown>;
  auth: {
    role: string;
    scopes: string[];
    deviceToken?: string;
    deviceTokens?: Array<{ deviceToken: string; role: string; scopes: string[] }>;
  };
  policy: {
    maxPayload: number;
    maxBufferedBytes: number;
    tickIntervalMs: number;
  };
  pluginSurfaceUrls?: Record<string, string>;
}

export interface HelloOkResponse {
  type: 'res';
  id: string;
  ok: true;
  payload: HelloOkPayload;
}

export interface ErrorDetails {
  code: string;
  reason?: string;
  message?: string;
  retryable?: boolean;
  retryAfterMs?: number;
  pauseReconnect?: boolean;
  recommendedNextStep?: string;
  canRetryWithDeviceToken?: boolean;
}

export interface ErrorResponse {
  type: 'res';
  id: string;
  ok: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetails;
  };
}

export interface GatewayEvent {
  type: 'event';
  event: string;
  payload: unknown;
  seq?: number;
  stateVersion?: number;
}

export interface RpcResponse {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string; details?: ErrorDetails };
}

export type InboundFrame =
  | ConnectChallengeEvent
  | HelloOkResponse
  | ErrorResponse
  | GatewayEvent
  | RpcResponse;

// ── Outbound frames (Client → Gateway) ──────────────────────────────────────

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    version: string;
    platform: string;
    mode: 'operator';
  };
  role: 'operator';
  scopes: string[];
  caps: string[];
  commands: string[];
  permissions: Record<string, boolean>;
  auth: { token: string };
  locale: string;
  userAgent: string;
  device: {
    id: string;
    publicKey: string;       // JSON-stringified JWK
    signature: string;       // base64url ECDSA signature
    signedAt: number;        // unix ms
    nonce: string;           // echo of challenge nonce
  };
}

export interface ConnectRequest {
  type: 'req';
  id: string;
  method: 'connect';
  params: ConnectParams;
}

export interface RpcRequest {
  type: 'req';
  id: string;
  method: string;
  params: unknown;
  idempotencyKey?: string;
}

// ── Worker ↔ Tab message types ───────────────────────────────────────────────
// Messages sent from a browser tab to the SharedWorker

export type TabToWorkerMessage =
  | {
      type: 'connect';
      workspaceId: string;
      endpoint: string;
      token: string;
      deviceId: string;
      publicKeyJwk: JsonWebKey;
      privateKeyJwk: JsonWebKey;
    }
  | { type: 'disconnect'; workspaceId: string }
  | { type: 'send'; workspaceId: string; method: string; params: unknown; reqId: string }
  | { type: 'tab_closing'; workspaceId: string };

// Messages broadcast from the SharedWorker to all tabs (via BroadcastChannel)

export type WorkerBroadcast =
  | {
      type: 'status';
      workspaceId: string;
      status: ConnStatus;
      connId?: string;
      protocol?: number;
      error?: string;
      pairingRequestId?: string;
    }
  | { type: 'event'; workspaceId: string; event: string; payload: unknown; seq?: number }
  | { type: 'response'; workspaceId: string; reqId: string; ok: boolean; payload?: unknown; error?: unknown };

// ── Frame builders ───────────────────────────────────────────────────────────

let _reqCounter = 0;
export function nextReqId(): string {
  return `dropin-${Date.now()}-${++_reqCounter}`;
}

export function makeConnectRequest(params: ConnectParams): ConnectRequest {
  return { type: 'req', id: nextReqId(), method: 'connect', params };
}

export function makeRpcRequest(method: string, params: unknown, idempotencyKey?: string): RpcRequest {
  const req: RpcRequest = { type: 'req', id: nextReqId(), method, params };
  if (idempotencyKey) req.idempotencyKey = idempotencyKey;
  return req;
}

// ── Gateway event data shapes (partial — expand as protocol is used) ─────────

export interface GatewayHealth {
  status: 'ok' | 'degraded' | 'error';
  uptime?: number;
  version?: string;
}

export interface PresenceEntry {
  deviceId: string;
  roles: string[];
  scopes: string[];
  connectedAt?: number;
}

export interface GatewaySession {
  key: string;
  agentId?: string;
  title?: string;
  status?: string;
  updatedAt?: number;
}

export interface ChatMessage {
  id: string;
  sessionKey?: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  ts: number;
  deltaText?: string;
  replace?: boolean;
}

export interface AgentEvent {
  sessionKey?: string;
  kind: string;
  payload: unknown;
  ts: number;
}

// ── Error code constants ─────────────────────────────────────────────────────

export const ERROR_CODES = {
  PAIRING_REQUIRED: 'PAIRING_REQUIRED',
  AUTH_TOKEN_MISMATCH: 'AUTH_TOKEN_MISMATCH',
  AUTH_SCOPE_MISMATCH: 'AUTH_SCOPE_MISMATCH',
  UNAVAILABLE: 'UNAVAILABLE',
  DEVICE_AUTH_NONCE_REQUIRED: 'DEVICE_AUTH_NONCE_REQUIRED',
  DEVICE_AUTH_NONCE_MISMATCH: 'DEVICE_AUTH_NONCE_MISMATCH',
  DEVICE_AUTH_SIGNATURE_INVALID: 'DEVICE_AUTH_SIGNATURE_INVALID',
  DEVICE_AUTH_SIGNATURE_EXPIRED: 'DEVICE_AUTH_SIGNATURE_EXPIRED',
} as const;
