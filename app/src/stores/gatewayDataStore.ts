/**
 * gatewayDataStore.ts
 *
 * Zustand store — live data received from the OpenClaw Gateway per workspace.
 * Populated by useOpenClawConnection when 'event' broadcasts arrive from the
 * SharedWorker via BroadcastChannel.
 *
 * Shape is intentionally minimal now and will expand as the UI consumes more
 * Gateway event families (chat, sessions, tools, etc.).
 */

import { create } from 'zustand';
import type {
  GatewayHealth,
  PresenceEntry,
  GatewaySession,
  ChatMessage,
  AgentEvent,
} from '../lib/gatewayProtocol';

const MAX_CHAT_MESSAGES = 500;
const MAX_AGENT_EVENTS = 200;

export interface WorkspaceGatewayData {
  sessions: GatewaySession[];
  chatMessages: ChatMessage[];
  agentEvents: AgentEvent[];
  health: GatewayHealth | null;
  presence: PresenceEntry[];
}

const emptyData = (): WorkspaceGatewayData => ({
  sessions: [],
  chatMessages: [],
  agentEvents: [],
  health: null,
  presence: [],
});

interface GatewayDataStore {
  /** Map of workspaceId → live data */
  data: Record<string, WorkspaceGatewayData>;

  /**
   * Route an inbound Gateway event to the correct slice.
   * Called by useOpenClawConnection for every 'event' broadcast.
   */
  handleEvent: (workspaceId: string, event: string, payload: unknown) => void;

  /** Clear all live data for a workspace (e.g. on disconnect or workspace switch) */
  clearData: (workspaceId: string) => void;
}

export const useGatewayDataStore = create<GatewayDataStore>((set) => ({
  data: {},

  handleEvent: (workspaceId, event, payload) => {
    set(state => {
      const prev = state.data[workspaceId] ?? emptyData();

      // ── health ────────────────────────────────────────────────────────────
      if (event === 'health') {
        return {
          data: {
            ...state.data,
            [workspaceId]: { ...prev, health: payload as GatewayHealth },
          },
        };
      }

      // ── presence ──────────────────────────────────────────────────────────
      if (event === 'presence') {
        const entries = payload as Record<string, PresenceEntry>;
        return {
          data: {
            ...state.data,
            [workspaceId]: { ...prev, presence: Object.values(entries) },
          },
        };
      }

      // ── sessions.changed ──────────────────────────────────────────────────
      if (event === 'sessions.changed') {
        const sessions = (payload as { sessions?: GatewaySession[] })?.sessions ?? [];
        return {
          data: {
            ...state.data,
            [workspaceId]: { ...prev, sessions },
          },
        };
      }

      // ── chat events ───────────────────────────────────────────────────────
      if (event === 'chat.inject' || event === 'chat.message') {
        const msg = payload as ChatMessage;
        const existing = prev.chatMessages;

        // If replace=true, replace the last assistant message with matching id
        if (msg.replace) {
          let idx = -1;
          for (let i = existing.length - 1; i >= 0; i--) {
            if (existing[i].id === msg.id) { idx = i; break; }
          }
          if (idx !== -1) {
            const updated = [...existing];
            updated[idx] = msg;
            return {
              data: {
                ...state.data,
                [workspaceId]: { ...prev, chatMessages: updated },
              },
            };
          }
        }

        // Append, capped at MAX_CHAT_MESSAGES
        const updated = [...existing, msg].slice(-MAX_CHAT_MESSAGES);
        return {
          data: {
            ...state.data,
            [workspaceId]: { ...prev, chatMessages: updated },
          },
        };
      }

      // ── session.message ───────────────────────────────────────────────────
      if (event === 'session.message') {
        const msg = payload as ChatMessage;
        const updated = [...prev.chatMessages, msg].slice(-MAX_CHAT_MESSAGES);
        return {
          data: {
            ...state.data,
            [workspaceId]: { ...prev, chatMessages: updated },
          },
        };
      }

      // ── session.operation / session.tool (agent events) ───────────────────
      if (event === 'session.operation' || event === 'session.tool') {
        const agentEvent: AgentEvent = {
          kind: event,
          payload,
          ts: Date.now(),
          sessionKey: (payload as { sessionKey?: string })?.sessionKey,
        };
        const updated = [...prev.agentEvents, agentEvent].slice(-MAX_AGENT_EVENTS);
        return {
          data: {
            ...state.data,
            [workspaceId]: { ...prev, agentEvents: updated },
          },
        };
      }

      // Unknown event — no state change
      return state;
    });
  },

  clearData: (workspaceId) => {
    set(state => ({
      data: { ...state.data, [workspaceId]: emptyData() },
    }));
  },
}));
