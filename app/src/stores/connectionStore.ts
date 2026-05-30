/**
 * connectionStore.ts
 *
 * Zustand store — per-tab mirror of the SharedWorker's connection state.
 * Updated by useOpenClawConnection when the BroadcastChannel delivers
 * 'status' messages from the worker.
 */

import { create } from 'zustand';
import type { ConnStatus } from '../lib/gatewayProtocol';

export interface ConnectionState {
  status: ConnStatus;
  connId: string | null;
  protocol: number | null;
  error: string | null;
  lastConnectedAt: number | null;
}

const DEFAULT_STATE: ConnectionState = {
  status: 'disconnected',
  connId: null,
  protocol: null,
  error: null,
  lastConnectedAt: null,
};

interface ConnectionStore {
  /** Map of workspaceId → connection state */
  connections: Record<string, ConnectionState>;

  /** Called by useOpenClawConnection when a status broadcast arrives */
  setConnectionState: (workspaceId: string, update: Partial<ConnectionState>) => void;

  /** Remove a workspace's connection state (e.g. on workspace delete) */
  removeConnection: (workspaceId: string) => void;

  /** Convenience selector — returns state for a workspace or the default */
  getConnection: (workspaceId: string) => ConnectionState;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: {},

  setConnectionState: (workspaceId, update) => {
    set(state => {
      const prev = state.connections[workspaceId] ?? { ...DEFAULT_STATE };
      const next: ConnectionState = { ...prev, ...update };

      // Track when we last successfully connected
      if (update.status === 'connected') {
        next.lastConnectedAt = Date.now();
        next.error = null;
      }

      return {
        connections: { ...state.connections, [workspaceId]: next },
      };
    });
  },

  removeConnection: (workspaceId) => {
    set(state => {
      const { [workspaceId]: _, ...rest } = state.connections;
      return { connections: rest };
    });
  },

  getConnection: (workspaceId) => {
    return get().connections[workspaceId] ?? { ...DEFAULT_STATE };
  },
}));
