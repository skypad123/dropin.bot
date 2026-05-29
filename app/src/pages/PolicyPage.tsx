import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Bot, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import type { Instance } from '../types';

// ── Agent row ─────────────────────────────────────────────────────────────────

function AgentRow({
  inst,
  perms,
  onToggle,
  onEdit,
}: {
  inst: Instance;
  perms: { read: boolean; write: boolean };
  onToggle: (field: 'read' | 'write') => void;
  onEdit: () => void;
}) {
  const p = perms ?? { read: true, write: false };
  const statusColor = inst.status === 'running' ? '#22c55e' : inst.status === 'stopped' ? 'var(--text-muted)' : '#ef4444';
  return (
    <div className="flex items-center gap-4 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.08)' }}>
        <Bot size={16} style={{ color: 'var(--burnt-orange)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-body font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{inst.name}</p>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
        </div>
        <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{inst.model}</p>
      </div>
      <div className="flex items-center gap-6">
        {(['read', 'write'] as const).map(field => {
          const isOn = p[field];
          return (
            <div key={field} className="flex flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{field}</span>
              <button
                onClick={() => onToggle(field)}
                className="relative w-11 h-6 rounded-full transition-all duration-200"
                style={{ background: isOn ? 'var(--burnt-orange)' : 'var(--muted-beige)' }}
              >
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200" style={{ left: isOn ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              </button>
            </div>
          );
        })}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          Edit →
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PolicyPage() {
  const navigate = useNavigate();
  const { workspaces, instances } = useStore();
  const { activeWorkspace } = useWorkspace();
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set(workspaces.map(w => w.id)));
  const [perms, setPerms] = useState<Record<string, { read: boolean; write: boolean }>>(() => {
    const init: Record<string, { read: boolean; write: boolean }> = {};
    instances.forEach(inst => { init[inst.id] = { read: true, write: false }; });
    return init;
  });

  const toggle = (agentId: string, field: 'read' | 'write') => {
    setPerms(p => ({ ...p, [agentId]: { ...p[agentId], [field]: !p[agentId][field] } }));
  };

  const toggleWs = (wsId: string) => {
    setExpandedWorkspaces(prev => {
      const next = new Set(prev);
      if (next.has(wsId)) next.delete(wsId); else next.add(wsId);
      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 sm:px-6 lg:px-10 py-4 flex-shrink-0" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <p className="section-label mb-0">setup</p>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Policy</h1>
          <InfoTooltip content="Control what each agent can read and write within your workspaces. Toggle read and write permissions per agent to enforce access boundaries." />
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-3xl space-y-4">
        {!activeWorkspace ? (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1.5px dashed var(--border-color)' }}>
            <Layers size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No workspace selected</p>
            <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Select a workspace to manage access policies.</p>
          </div>
        ) : (() => {
          const ws = activeWorkspace;
          const attachedAgents = instances.filter(i => i.workspaceId === ws.id);
          const isExpanded = expandedWorkspaces.has(ws.id);
          return (
            <div key={ws.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              {/* Workspace header row */}
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-150"
                style={{ background: 'var(--bg-elevated)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onClick={() => toggleWs(ws.id)}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.10)' }}>
                  <Layers size={16} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ws.name}</p>
                    {ws.isDefault && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: 'rgba(192,86,64,0.12)', color: 'var(--burnt-orange)', border: '1px solid rgba(192,86,64,0.25)' }}>Default</span>
                    )}
                  </div>
                  <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {attachedAgents.length} agent{attachedAgents.length !== 1 ? 's' : ''} attached
                  </p>
                </div>
                {isExpanded
                  ? <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </button>

              {/* Agents list */}
              {isExpanded && (
                <div className="px-5">
                  {attachedAgents.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                      <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No agents attached to this workspace.</p>
                      <button
                        onClick={() => navigate('/agents')}
                        className="mt-3 px-4 py-2 rounded-full text-xs font-semibold brand-gradient text-white"
                      >Attach an agent</button>
                    </div>
                  ) : (
                    <div>
                      {/* Column headers */}
                      <div className="flex items-center gap-4 pb-2 mb-1 pt-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div className="flex-1" />
                        <div className="flex items-center gap-6 pr-1">
                          <span className="w-11 text-center font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Read</span>
                          <span className="w-11 text-center font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Write</span>
                          <span className="w-14" />
                        </div>
                      </div>
                      {attachedAgents.map(inst => <AgentRow key={inst.id} inst={inst} perms={perms[inst.id] ?? { read: true, write: false }} onToggle={field => toggle(inst.id, field)} onEdit={() => navigate(`/agents/${inst.id}`)} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
