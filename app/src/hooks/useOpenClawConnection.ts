/**
 * useOpenClawConnection.ts
 *
 * Mounted ONCE inside AppShell. Manages this browser tab's relationship with
 * the SharedWorker (gatewayWorker.ts).
 *
 * Responsibilities:
 *   1. Instantiate the SharedWorker (once per tab, lazily)
 *   2. When the active workspace changes and has openClaw config:
 *        - Load/create the device identity for that workspace
 *        - Send 'connect' to the worker with credentials
 *        - Send 'disconnect' for the previous workspace
 *   3. Listen on BroadcastChannel 'dropin-gateway' for worker broadcasts:
 *        - 'status'   → update connectionStore
 *        - 'event'    → dispatch to gatewayDataStore
 *        - 'response' → (future: resolve pending RPC promises)
 *   4. On beforeunload, send 'tab_closing' so the worker can decrement its
 *      port count and close the socket if this was the last tab.
 *   5. Show a sonner toast when status becomes 'pairing_required'.
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '../context/WorkspaceContext';
import { getOrCreateDeviceIdentity } from '../lib/deviceIdentity';
import type { TabToWorkerMessage, WorkerBroadcast } from '../lib/gatewayProtocol';
import { useConnectionStore } from '../stores/connectionStore';
import { useGatewayDataStore } from '../stores/gatewayDataStore';

// Singleton worker reference — shared across all hook invocations in the tab
let sharedWorker: SharedWorker | null = null;

function getWorker(): SharedWorker | null {
  if (sharedWorker) return sharedWorker;
  if (typeof SharedWorker === 'undefined') return null; // SSR / unsupported

  try {
    sharedWorker = new SharedWorker(
      new URL('../workers/gatewayWorker.ts', import.meta.url),
      { type: 'module', name: 'dropin-gateway-worker' },
    );
    sharedWorker.port.start();
  } catch (err) {
    console.error('[dropin] Failed to start SharedWorker:', err);
    sharedWorker = null;
  }
  return sharedWorker;
}

function postToWorker(msg: TabToWorkerMessage) {
  const worker = getWorker();
  if (!worker) return;
  worker.port.postMessage(msg);
}

export function useOpenClawConnection(): void {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const { setConnectionState } = useConnectionStore();
  const { handleEvent } = useGatewayDataStore();

  // Track the previous workspace so we can send 'disconnect' on switch
  const prevWorkspaceIdRef = useRef<string | null>(null);
  // Track pairing toast id to avoid duplicate toasts
  const pairingToastRef = useRef<string | number | null>(null);

  // ── BroadcastChannel listener (set up once per tab) ──────────────────────
  useEffect(() => {
    const bc = new BroadcastChannel('dropin-gateway');

    bc.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as WorkerBroadcast;

      if (msg.type === 'status') {
        setConnectionState(msg.workspaceId, {
          status: msg.status,
          connId: msg.connId ?? null,
          protocol: msg.protocol ?? null,
          error: msg.error ?? null,
        });

        // Show pairing toast
        if (msg.status === 'pairing_required') {
          if (!pairingToastRef.current) {
            pairingToastRef.current = toast.warning(
              'Gateway pairing required',
              {
                description: 'Run: openclaw devices approve --latest  then click Retry.',
                duration: Infinity,
                action: {
                  label: 'Retry',
                  onClick: () => {
                    pairingToastRef.current = null;
                    // Re-trigger connect by re-sending credentials
                    const ws = activeWorkspace;
                    if (ws?.openClaw && msg.workspaceId) {
                      getOrCreateDeviceIdentity(msg.workspaceId).then(identity => {
                        postToWorker({
                          type: 'connect',
                          workspaceId: msg.workspaceId,
                          endpoint: ws.openClaw!.endpoint,
                          token: ws.openClaw!.token,
                          deviceId: identity.deviceId,
                          publicKeyJwk: identity.publicKeyJwk,
                          privateKeyJwk: identity.privateKeyJwk,
                        });
                      });
                    }
                  },
                },
              },
            );
          }
        } else if (msg.status === 'connected' && pairingToastRef.current) {
          toast.dismiss(pairingToastRef.current);
          pairingToastRef.current = null;
        }
      }

      if (msg.type === 'event') {
        handleEvent(msg.workspaceId, msg.event, msg.payload);
      }
    };

    return () => {
      bc.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — set up once per tab mount

  // ── Connect / disconnect on workspace switch ──────────────────────────────
  useEffect(() => {
    const prevId = prevWorkspaceIdRef.current;

    // Disconnect previous workspace if it changed
    if (prevId && prevId !== activeWorkspaceId) {
      postToWorker({ type: 'disconnect', workspaceId: prevId });
    }

    prevWorkspaceIdRef.current = activeWorkspaceId;

    if (!activeWorkspaceId || !activeWorkspace?.openClaw) return;

    const { endpoint, token } = activeWorkspace.openClaw;
    if (!endpoint || !token) return;

    // Async: load/create device identity then connect
    getOrCreateDeviceIdentity(activeWorkspaceId).then(identity => {
      postToWorker({
        type: 'connect',
        workspaceId: activeWorkspaceId,
        endpoint,
        token,
        deviceId: identity.deviceId,
        publicKeyJwk: identity.publicKeyJwk,
        privateKeyJwk: identity.privateKeyJwk,
      });
    });
  }, [activeWorkspaceId, activeWorkspace?.openClaw?.endpoint, activeWorkspace?.openClaw?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab close — notify worker to decrement port count ────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeWorkspaceId) {
        postToWorker({ type: 'tab_closing', workspaceId: activeWorkspaceId });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeWorkspaceId]);
}
