/**
 * deviceIdentity.ts
 *
 * Generates and persists a stable ECDSA P-256 device identity per workspace.
 * Stored in localStorage under `dropin-device-{workspaceId}`.
 *
 * The OpenClaw Gateway WS protocol requires clients to:
 *   1. Include a stable device.id (fingerprint of the public key)
 *   2. Sign the server-provided connect.challenge nonce
 *   3. Send the signature + nonce in the connect request
 *
 * Signature payload (v3 format):
 *   `{deviceId}:{clientId}:{role}:{scopes}:{token}:{nonce}:{platform}:{deviceFamily}`
 */

const STORAGE_PREFIX = 'dropin-device-';

export interface DeviceIdentity {
  deviceId: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

function storageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

/** Load an existing identity from localStorage, or return null. */
function loadIdentity(workspaceId: string): DeviceIdentity | null {
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (!raw) return null;
    return JSON.parse(raw) as DeviceIdentity;
  } catch {
    return null;
  }
}

/** Persist an identity to localStorage. */
function saveIdentity(workspaceId: string, identity: DeviceIdentity): void {
  localStorage.setItem(storageKey(workspaceId), JSON.stringify(identity));
}

/** Derive a stable device ID from the public key (SHA-256 fingerprint, hex). */
async function deriveDeviceId(publicKeyJwk: JsonWebKey): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(publicKeyJwk));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get or create a device identity for the given workspace.
 * Idempotent — returns the same identity on repeated calls.
 */
export async function getOrCreateDeviceIdentity(workspaceId: string): Promise<DeviceIdentity> {
  const existing = loadIdentity(workspaceId);
  if (existing) return existing;

  // Generate a new ECDSA P-256 keypair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true, // extractable
    ['sign', 'verify'],
  );

  const [publicKeyJwk, privateKeyJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', keyPair.publicKey),
    crypto.subtle.exportKey('jwk', keyPair.privateKey),
  ]);

  const deviceId = await deriveDeviceId(publicKeyJwk);
  const identity: DeviceIdentity = { deviceId, publicKeyJwk, privateKeyJwk };
  saveIdentity(workspaceId, identity);
  return identity;
}

/**
 * Sign the connect.challenge nonce using the workspace's private key.
 *
 * Payload format (v3):
 *   `{deviceId}:{clientId}:{role}:{scopes_csv}:{token}:{nonce}:browser:browser`
 *
 * Returns a base64url-encoded ECDSA P-256 signature.
 */
export async function signChallenge(params: {
  privateKeyJwk: JsonWebKey;
  deviceId: string;
  clientId: string;
  role: string;
  scopes: string[];
  token: string;
  nonce: string;
}): Promise<string> {
  const { privateKeyJwk, deviceId, clientId, role, scopes, token, nonce } = params;

  const payload = [
    deviceId,
    clientId,
    role,
    scopes.join(','),
    token,
    nonce,
    'browser',
    'browser',
  ].join(':');

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(payload),
  );

  // base64url encode
  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Remove the device identity for a workspace (e.g. on workspace delete). */
export function clearDeviceIdentity(workspaceId: string): void {
  localStorage.removeItem(storageKey(workspaceId));
}
