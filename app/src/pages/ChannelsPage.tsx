import { useState } from 'react';
import {
  Plus, Search, Plug, Trash2, X, Bot, Copy, Eye, EyeOff,
  ChevronDown, ChevronUp, Zap, CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import { CHANNEL_META } from '../data';
import type { Channel, ChannelType, ChannelStatus } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

const statusMeta = (s: ChannelStatus) =>
  ({
    connected:    { label: 'Connected',    dot: '#2D7D46', color: '#2D7D46', bg: 'rgba(45,125,70,0.10)'   },
    disconnected: { label: 'Disconnected', dot: 'var(--text-muted)', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
    error:        { label: 'Error',        dot: '#DC2626', color: '#DC2626', bg: 'rgba(220,38,38,0.10)'   },
    pending:      { label: 'Pending',      dot: '#F59E0B', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  })[s];

// ── sub-components ────────────────────────────────────────────────────────────

function ChannelIcon({ type, size = 22 }: { type: ChannelType; size?: number }) {
  const meta = CHANNEL_META[type];
  return (
    <span style={{ color: meta.color, display: 'flex', alignItems: 'center', width: size, height: size }}>
      {meta.svg}
    </span>
  );
}

// ── Catalog card ─────────────────────────────────────────────────────────────

function CatalogCard({
  type,
  activeCount,
  onAdd,
}: {
  type: ChannelType;
  activeCount: number;
  onAdd: (type: ChannelType) => void;
}) {
  const meta = CHANNEL_META[type];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex-shrink-0 flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200"
      style={{
        width: 160,
        background: hovered ? meta.bg : 'var(--bg-surface)',
        border: `1.5px solid ${hovered ? meta.color + '55' : 'var(--border-color)'}`,
        boxShadow: hovered ? `0 4px 16px ${meta.color}22` : 'var(--shadow-sm)',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon + active badge */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg }}
        >
          <ChannelIcon type={type} size={20} />
        </div>
        {activeCount > 0 && (
          <span
            className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(45,125,70,0.12)', color: '#2D7D46' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
            {activeCount}
          </span>
        )}
      </div>

      {/* Label + tagline */}
      <div className="flex-1">
        <p className="font-display font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
          {meta.label}
        </p>
        <p className="font-body text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
          {meta.tagline}
        </p>
      </div>

      {/* Add button */}
      <button
        onClick={() => onAdd(type)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
        style={{
          background: hovered ? meta.color : 'var(--bg-elevated)',
          color: hovered ? '#fff' : meta.color,
          border: `1px solid ${hovered ? meta.color : meta.color + '44'}`,
        }}
      >
        <Plus size={12} /> Add
      </button>
    </div>
  );
}

// ── Accordion row ─────────────────────────────────────────────────────────────

function ChannelRow({
  ch,
  isOpen,
  onToggle,
  onUpdate,
  onDelete,
  instances,
}: {
  ch: Channel;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (updated: Channel) => void;
  onDelete: (id: string) => void;
  instances: ReturnType<typeof useStore>['instances'];
}) {
  const meta = CHANNEL_META[ch.type];
  const sm = statusMeta(ch.status);
  const agent = ch.agentId ? instances.find(i => i.id === ch.agentId) : null;
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleConnect = () => {
    const next: ChannelStatus = ch.status === 'connected' ? 'disconnected' : 'connected';
    onUpdate({ ...ch, status: next });
  };

  const toggleSecret = (key: string) =>
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: `1.5px solid ${isOpen ? meta.color + '44' : 'var(--border-color)'}`,
        background: 'var(--bg-surface)',
        boxShadow: isOpen ? `0 4px 20px ${meta.color}18` : 'var(--shadow-sm)',
      }}
    >
      {/* ── Row header (always visible) ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-150"
        style={{ background: isOpen ? meta.bg : 'transparent' }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg }}
        >
          <ChannelIcon type={ch.type} size={20} />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {ch.name}
            </p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: sm.bg, color: sm.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.dot }} />
              {sm.label}
            </span>
          </div>
          <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {meta.label}
            {agent ? ` · ${agent.name}` : ''}
            {ch.messages > 0 ? ` · ${ch.messages.toLocaleString()} msgs` : ''}
          </p>
        </div>

        {/* Chevron */}
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* ── Expanded config drawer ── */}
      {isOpen && (
        <div
          className="px-5 pb-6 pt-2"
          style={{ borderTop: `1px solid ${meta.color}22` }}
        >
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 mb-5">
            <button
              onClick={toggleConnect}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: ch.status === 'connected' ? 'rgba(220,38,38,0.08)' : 'rgba(45,125,70,0.08)',
                color: ch.status === 'connected' ? '#DC2626' : '#2D7D46',
                border: `1px solid ${ch.status === 'connected' ? 'rgba(220,38,38,0.25)' : 'rgba(45,125,70,0.25)'}`,
              }}
            >
              {ch.status === 'connected' ? 'Disconnect' : 'Connect'}
            </button>
            <button
              onClick={() => { if (window.confirm('Delete this channel?')) onDelete(ch.id); }}
              className="p-1.5 rounded-xl transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Messages', value: ch.messages.toLocaleString() },
                  { label: 'Created',  value: ch.createdAt },
                  { label: 'Agent',    value: agent?.name ?? 'None' },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-xl px-3 py-2.5"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
                  >
                    <p className="section-label mb-0.5" style={{ fontSize: 9 }}>{stat.label}</p>
                    <p className="font-display font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="section-label mb-1.5 block">Description</label>
                <textarea
                  className="form-input w-full resize-none text-sm"
                  rows={2}
                  value={ch.description}
                  onChange={e => onUpdate({ ...ch, description: e.target.value })}
                />
              </div>

              {/* Agent assignment */}
              <div>
                <label className="section-label mb-1.5 block">Assigned Agent</label>
                <select
                  className="form-input form-select w-full text-sm"
                  value={ch.agentId ?? ''}
                  onChange={e => onUpdate({ ...ch, agentId: e.target.value || null })}
                >
                  <option value="">— No agent —</option>
                  {instances.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.model})</option>
                  ))}
                </select>
                {agent && (
                  <div
                    className="flex items-center gap-3 mt-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(192,86,64,0.10)' }}
                    >
                      <Bot size={13} style={{ color: 'var(--burnt-orange)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                      <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{agent.model} · {agent.status}</p>
                    </div>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: agent.status === 'running' ? '#2D7D46' : agent.status === 'error' ? '#DC2626' : '#64748B' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right column — config fields */}
            <div className="space-y-4">
              <div>
                <p className="section-label mb-3">Configuration</p>
                {meta.fields.length === 0 ? (
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                    No configuration required.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {meta.fields.map(field => {
                      const revealed = showSecrets[field.key];
                      return (
                        <div key={field.key}>
                          <label className="section-label mb-1.5 block" style={{ fontSize: 10 }}>{field.label}</label>
                          <div className="relative">
                            <input
                              className="form-input w-full pr-10 font-mono text-sm"
                              type={field.secret && !revealed ? 'password' : 'text'}
                              placeholder={field.placeholder}
                              value={ch.config[field.key] ?? ''}
                              onChange={e => onUpdate({ ...ch, config: { ...ch.config, [field.key]: e.target.value } })}
                            />
                            {field.secret && (
                              <button
                                type="button"
                                onClick={() => toggleSecret(field.key)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              >
                                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Embed snippet for web-widget */}
              {ch.type === 'web-widget' && (
                <div>
                  <p className="section-label mb-2">Embed Snippet</p>
                  <div
                    className="rounded-xl p-3 font-mono text-xs overflow-x-auto"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    {`<script src="https://cdn.dropin.bot/widget.js"\n  data-channel="${ch.id}"\n  data-color="${ch.config.primaryColor || '#C05640'}"\n  defer></script>`}
                  </div>
                </div>
              )}

              {/* Webhook URL for api */}
              {ch.type === 'api' && (
                <div>
                  <p className="section-label mb-2">Inbound Webhook URL</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      className="form-input flex-1 font-mono text-xs"
                      value={`https://api.dropin.bot/channels/${ch.id}/inbound`}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://api.dropin.bot/channels/${ch.id}/inbound`).catch(() => {})}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const { channels, addChannel, updateChannel, deleteChannel, instances } = useStore();
  const { activeWorkspaceId } = useWorkspace();

  const workspaceChannels = channels.filter(c => c.workspaceId === activeWorkspaceId);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ChannelType | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = workspaceChannels.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const countByType = (type: ChannelType) =>
    workspaceChannels.filter(c => c.type === type).length;

  const handleCreate = (type: ChannelType) => {
    const nc: Channel = {
      id: `ch-${Date.now()}`,
      name: `${CHANNEL_META[type].label} Channel`,
      type,
      status: 'disconnected',
      agentId: null,
      description: '',
      messages: 0,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      config: {},
      workspaceId: activeWorkspaceId ?? '',
    };
    addChannel(nc);
    setOpenId(nc.id);
  };

  const handleUpdate = (updated: Channel) => {
    updateChannel(updated.id, updated);
  };

  const handleDelete = (id: string) => {
    deleteChannel(id);
    if (openId === id) setOpenId(null);
  };

  const toggleRow = (id: string) =>
    setOpenId(prev => (prev === id ? null : id));

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Page header ── */}
      <div
        className="sticky top-0 z-10 px-4 sm:px-6 lg:px-10 py-4 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="w-full flex items-center justify-between gap-4">
          <div>
            <p className="section-label mb-0">setup</p>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                Channels
              </h1>
              <InfoTooltip content="Channels are the integration surfaces where your agents connect to the outside world — Slack, Discord, web widgets, WhatsApp, REST API, email, and more. Each channel can be connected and configured independently." />
            </div>
          </div>

        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-10">


                {/* ── Zone 3: Quick stats footer ── */}
        {workspaceChannels.length > 0 && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: 'Total Messages',
                  value: workspaceChannels.reduce((s, c) => s + c.messages, 0).toLocaleString(),
                  icon: <Zap size={16} style={{ color: 'var(--burnt-orange)' }} />,
                },
                {
                  label: 'Connected',
                  value: workspaceChannels.filter(c => c.status === 'connected').length,
                  icon: <CheckCircle2 size={16} style={{ color: '#2D7D46' }} />,
                },
                {
                  label: 'Platforms',
                  value: new Set(workspaceChannels.map(c => c.type)).size,
                  icon: <Plug size={16} style={{ color: 'var(--burnt-orange)' }} />,
                },
                {
                  label: 'With Agent',
                  value: workspaceChannels.filter(c => c.agentId).length,
                  icon: <Bot size={16} style={{ color: 'var(--burnt-orange)' }} />,
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192,86,64,0.08)' }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>
                      {stat.value}
                    </p>
                    <p className="font-mono text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Zone 1: Catalog strip ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <p className="section-label mb-0">available channels</p>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            >
              {Object.keys(CHANNEL_META).length} platforms
            </span>
          </div>
          <div className="scroll-x-cards flex gap-3">
            {(Object.keys(CHANNEL_META) as ChannelType[]).map(type => (
              <CatalogCard
                key={type}
                type={type}
                activeCount={countByType(type)}
                onAdd={t => handleCreate(t)}
              />
            ))}
          </div>
        </section>

        {/* ── Zone 2: Connected channels ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <p className="section-label mb-0">connected channels</p>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                {workspaceChannels.length}
              </span>
            </div>

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  className="form-input pl-8 text-sm"
                  style={{ padding: '8px 12px 8px 32px', fontSize: 13 }}
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {(['all', ...Object.keys(CHANNEL_META)] as (ChannelType | 'all')[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all capitalize"
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
            </div>
          </div>

          {/* Channel list */}
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ border: '1.5px dashed var(--border-color)', background: 'var(--bg-surface)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(192,86,64,0.08)' }}
              >
                <Plug size={24} style={{ color: 'var(--burnt-orange)' }} />
              </div>
              <p className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                No channels yet
              </p>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Pick a platform above to get started.
              </p>

            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(ch => {
                const live = channels.find(c => c.id === ch.id) ?? ch;
                return (
                  <ChannelRow
                    key={live.id}
                    ch={live}
                    isOpen={openId === live.id}
                    onToggle={() => toggleRow(live.id)}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    instances={instances}
                  />
                );
              })}
            </div>
          )}
        </section>


      </div>

    </div>
  );
}
