import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MessageSquare, X, Bot,
  Zap, ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import { CHANNEL_META } from '../data';
import type { Channel, ChannelType, ChannelStatus } from '../types';

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { instances, channels, addChannel } = useStore();
  const { activeWorkspaceId } = useWorkspace();
  const workspaceChannels = channels.filter(c => c.workspaceId === activeWorkspaceId);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ChannelType | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState<ChannelType>('web-widget');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAgentId, setNewAgentId] = useState<string>('');

  const filtered = workspaceChannels.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    const nc: Channel = {
      id: `ch-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      status: 'disconnected',
      agentId: newAgentId || null,
      description: newDesc.trim(),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      messages: 0,
      config: {},
      workspaceId: activeWorkspaceId ?? '',
    };
    addChannel(nc);
    setNewName(''); setNewDesc(''); setNewAgentId(''); setNewType('web-widget');
    setShowNewModal(false);
    navigate(`/workflows/${nc.id}`);
  };

  const statusMeta = (s: ChannelStatus) => ({
    connected:    { label: 'Connected',    color: '#2D7D46', bg: 'rgba(45,125,70,0.10)'   },
    disconnected: { label: 'Disconnected', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
    error:        { label: 'Error',        color: '#DC2626', bg: 'rgba(220,38,38,0.10)'   },
    pending:      { label: 'Pending',      color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  }[s]);

  const getAgent = (id: string | null) => id ? instances.find(i => i.id === id) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 lg:px-10 py-4 flex items-center justify-between gap-4 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div>
          <p className="section-label mb-0">Workflows</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              Workflows
            </h1>
            <InfoTooltip content="Workflows are the surfaces where your agents talk to the world — Slack, Discord, web widgets, WhatsApp, REST API, email, and more. Each workflow is wired to one agent and has its own canvas, credentials and config." />
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient"
          style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}
        >
          <Plus size={16} /> New Workflow
        </button>
      </div>

      {/* Search + filter bar */}
      <div
        className="px-6 lg:px-10 py-4 flex items-center gap-3 flex-wrap flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="form-input pl-8 w-full text-sm"
            placeholder="Search workflows…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', ...Object.keys(CHANNEL_META)] as (ChannelType | 'all')[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all capitalize"
              style={{
                background: typeFilter === t ? 'rgba(192,86,64,0.12)' : 'var(--bg-elevated)',
                color: typeFilter === t ? 'var(--burnt-orange)' : 'var(--text-muted)',
                border: `1px solid ${typeFilter === t ? 'rgba(192,86,64,0.3)' : 'var(--border-color)'}`,
              }}
            >
              {t === 'all' ? 'All' : CHANNEL_META[t as ChannelType].label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} workflow{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Card grid */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(192,86,64,0.10)' }}
            >
              <MessageSquare size={28} style={{ color: 'var(--burnt-orange)' }} />
            </div>
            <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              {search || typeFilter !== 'all' ? 'No workflows match your filters' : 'No workflows yet'}
            </p>
            <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
              {search || typeFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Create your first workflow to start deploying agents.'}
            </p>
            {!search && typeFilter === 'all' && (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient mt-2"
                style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}
              >
                <Plus size={16} /> New Workflow
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(ch => {
              const meta = CHANNEL_META[ch.type];
              const sm = statusMeta(ch.status);
              const agent = getAgent(ch.agentId);
              return (
                <WorkflowCard
                  key={ch.id}
                  channel={ch}
                  meta={meta}
                  sm={sm}
                  agent={agent ?? null}
                  onClick={() => navigate(`/workflows/${ch.id}`)}
                />
              );
            })}

            {/* "New workflow" ghost card */}
            <button
              onClick={() => setShowNewModal(true)}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl p-8 transition-all duration-200 border-2 border-dashed"
              style={{ borderColor: 'var(--border-color)', minHeight: 200 }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(192,86,64,0.4)';
                e.currentTarget.style.background = 'rgba(192,86,64,0.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
              >
                <Plus size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>
                New Workflow
              </p>
            </button>
          </div>
        )}
      </div>

      {/* New Workflow modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(45,42,38,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                New Workflow
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Channel type grid */}
              <div>
                <label className="section-label mb-2 block">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(CHANNEL_META) as [ChannelType, typeof CHANNEL_META[ChannelType]][]).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewType(key)}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-150"
                      style={{
                        border: `1.5px solid ${newType === key ? meta.color : 'var(--border-color)'}`,
                        background: newType === key ? meta.bg : 'var(--bg-elevated)',
                      }}
                      onMouseEnter={e => { if (newType !== key) e.currentTarget.style.borderColor = meta.color + '55'; }}
                      onMouseLeave={e => { if (newType !== key) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    >
                      <span className="text-xl leading-none">{meta.icon}</span>
                      <span
                        className="font-mono text-[9px] font-semibold text-center leading-tight"
                        style={{ color: newType === key ? meta.color : 'var(--text-muted)' }}
                      >
                        {meta.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="section-label mb-1.5 block">Workflow Name</label>
                <input
                  className="form-input w-full"
                  placeholder={`e.g. ${CHANNEL_META[newType].label} Bot`}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>

              <div>
                <label className="section-label mb-1.5 block">
                  Description{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="form-input w-full"
                  placeholder="What does this workflow do?"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="section-label mb-1.5 block">
                  Assign Agent{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <select
                  className="form-select w-full"
                  value={newAgentId}
                  onChange={e => setNewAgentId(e.target.value)}
                >
                  <option value="">— Choose later —</option>
                  {instances.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.model})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--burnt-orange)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white brand-gradient disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ boxShadow: newName.trim() ? '0 4px 12px rgba(192,86,64,0.25)' : 'none' }}
              >
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workflow Card ──────────────────────────────────────────────────────────────

interface WorkflowCardProps {
  channel: Channel;
  meta: typeof CHANNEL_META[ChannelType];
  sm: { label: string; color: string; bg: string };
  agent: { id: string; name: string; model: string; status: string } | null;
  onClick: () => void;
}

function WorkflowCard({ channel: ch, meta, sm, agent, onClick }: WorkflowCardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 w-full"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(192,86,64,0.35)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: icon + status */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: meta.bg }}
        >
          {meta.icon}
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ background: sm.bg, color: sm.color }}
        >
          {sm.label}
        </span>
      </div>

      {/* Name + type */}
      <div className="flex-1">
        <h3
          className="font-display font-bold text-base leading-snug mb-0.5 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {ch.name}
        </h3>
        <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {meta.label}
        </p>
        {ch.description && (
          <p
            className="font-body text-xs mt-2 line-clamp-2"
            style={{ color: 'var(--text-muted)' }}
          >
            {ch.description}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div
        className="flex items-center gap-3 pt-3"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        {/* Agent */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {agent ? (
            <>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(192,86,64,0.10)' }}
              >
                <Bot size={11} style={{ color: 'var(--burnt-orange)' }} />
              </div>
              <span
                className="font-body text-xs truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {agent.name}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background:
                    agent.status === 'running' ? '#2D7D46'
                    : agent.status === 'error' ? '#DC2626'
                    : '#64748B',
                }}
              />
            </>
          ) : (
            <>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <Bot size={11} style={{ color: 'var(--text-muted)' }} />
              </div>
              <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                No agent
              </span>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Zap size={11} style={{ color: 'var(--text-muted)' }} />
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {ch.messages.toLocaleString()} msg
          </span>
        </div>

        {/* Arrow hint */}
        <ArrowRight
          size={14}
          className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: 'var(--burnt-orange)', opacity: 0.7 }}
        />
      </div>
    </button>
  );
}
