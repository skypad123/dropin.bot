import { useState, useRef } from 'react';
import {
  Plus, Search, MessageSquare, Trash2, X, ChevronDown,
  Bot, Copy, Eye, EyeOff,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import { CHANNEL_META, INITIAL_KBS, RECOMMENDED_SKILLS } from '../data';
import type { Channel, ChannelType, ChannelStatus } from '../types';

// ── Canvas local types (hoisted to file scope) ──
type CanvasCategory = 'input' | 'work' | 'output';
type CanvasNode = { id: string; kind: 'kb' | 'tool' | 'agent' | 'team' | 'channel'; label: string; icon: string; category: CanvasCategory; x: number; y: number };
type CanvasEdge = { id: string; fromId: string; toId: string };
type WorkflowCanvas = { nodes: CanvasNode[]; edges: CanvasEdge[] };

export default function ChannelsPage() {
  const { instances, teams, channels, addChannel, updateChannel, deleteChannel } = useStore();
  const { activeWorkspaceId } = useWorkspace();
  const workspaceChannels = channels.filter(c => c.workspaceId === activeWorkspaceId);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ChannelType | 'all'>('all');
  const [selected, setSelected] = useState<Channel | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState<ChannelType>('web-widget');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAgentId, setNewAgentId] = useState<string>('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [detailTab, setDetailTab] = useState<'canvas' | 'config'>('canvas');

  // ── Canvas state ──
  const [canvases, setCanvases] = useState<Record<string, WorkflowCanvas>>({});
  const [dragging, setDragging] = useState<{ nodeId: string; chId: string; ox: number; oy: number } | null>(null);
  const [pendingEdge, setPendingEdge] = useState<{ fromId: string; fromSide: 'right' | 'left'; chId: string; mx: number; my: number } | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getCanvas = (chId: string): WorkflowCanvas => canvases[chId] ?? { nodes: [], edges: [] };

  const setCanvas = (chId: string, fn: (prev: WorkflowCanvas) => WorkflowCanvas) =>
    setCanvases(prev => ({ ...prev, [chId]: fn(prev[chId] ?? { nodes: [], edges: [] }) }));

  const addNode = (chId: string, node: Omit<CanvasNode, 'x' | 'y'>) => {
    const cv = getCanvas(chId);
    if (cv.nodes.find(n => n.id === node.id)) return;
    const col = node.category === 'input' ? 60 : node.category === 'work' ? 280 : 500;
    const row = cv.nodes.filter(n => n.category === node.category).length;
    setCanvas(chId, prev => ({ ...prev, nodes: [...prev.nodes, { ...node, x: col, y: 60 + row * 120 }] }));
    setShowAddNode(false);
  };

  const removeNode = (chId: string, nodeId: string) =>
    setCanvas(chId, prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.fromId !== nodeId && e.toId !== nodeId),
    }));

  const addEdge = (chId: string, fromId: string, toId: string) => {
    const cv = getCanvas(chId);
    const from = cv.nodes.find(n => n.id === fromId);
    const to   = cv.nodes.find(n => n.id === toId);
    if (!from || !to || fromId === toId) return;
    const valid =
      (from.category === 'input'  && to.category === 'work')   ||
      (from.category === 'work'   && to.category === 'work')   ||
      (from.category === 'work'   && to.category === 'output');
    if (!valid) return;
    if (cv.edges.find(e => e.fromId === fromId && e.toId === toId)) return;
    setCanvas(chId, prev => ({ ...prev, edges: [...prev.edges, { id: `e-${Date.now()}`, fromId, toId }] }));
  };

  const removeEdge = (chId: string, edgeId: string) =>
    setCanvas(chId, prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));

  const NODE_W = 176; const NODE_H = 72;

  const portPos = (node: CanvasNode, side: 'left' | 'right') => ({
    x: side === 'left' ? node.x : node.x + NODE_W,
    y: node.y + NODE_H / 2,
  });

  const bezier = (x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  };

  const categoryStyle = (cat: CanvasCategory) => ({
    input:  { border: '2px solid #6366F1', bg: 'rgba(99,102,241,0.06)',  pill: { bg: 'rgba(99,102,241,0.12)',  color: '#6366F1' }  },
    work:   { border: '2px solid #0EA5E9', bg: 'rgba(14,165,233,0.06)',  pill: { bg: 'rgba(14,165,233,0.12)',  color: '#0EA5E9' }  },
    output: { border: `2px solid var(--burnt-orange)`, bg: 'rgba(192,86,64,0.06)', pill: { bg: 'rgba(192,86,64,0.12)', color: 'var(--burnt-orange)' } },
  }[cat]);

  const onNodeMouseDown = (e: React.MouseEvent, chId: string, nodeId: string) => {
    e.stopPropagation();
    const node = getCanvas(chId).nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragging({ nodeId, chId, ox: e.clientX - node.x, oy: e.clientY - node.y });
  };

  const onCanvasMouseMove = (e: React.MouseEvent, chId: string) => {
    if (dragging && dragging.chId === chId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      setCanvas(chId, prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === dragging.nodeId ? { ...n, x: Math.max(0, e.clientX - (rect?.left ?? 0) - dragging.ox), y: Math.max(0, e.clientY - (rect?.top ?? 0) - dragging.oy) } : n),
      }));
    }
    if (pendingEdge && pendingEdge.chId === chId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      setPendingEdge(prev => prev ? { ...prev, mx: e.clientX - (rect?.left ?? 0), my: e.clientY - (rect?.top ?? 0) } : null);
    }
  };

  const onPortMouseDown = (e: React.MouseEvent, chId: string, nodeId: string, side: 'left' | 'right') => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    setPendingEdge({ fromId: nodeId, fromSide: side, chId, mx: e.clientX - (rect?.left ?? 0), my: e.clientY - (rect?.top ?? 0) });
  };

  const onPortMouseUp = (e: React.MouseEvent, chId: string, nodeId: string) => {
    e.stopPropagation();
    if (pendingEdge && pendingEdge.chId === chId) {
      addEdge(chId, pendingEdge.fromId, nodeId);
      setPendingEdge(null);
    }
  };

  const onCanvasMouseUp = () => {
    setDragging(null);
    setPendingEdge(null);
  };

  const filtered = workspaceChannels.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    const nc: Channel = {
      id: `ch-${Date.now()}`, name: newName.trim(), type: newType,
      status: 'disconnected', agentId: newAgentId || null,
      description: newDesc.trim(), createdAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      messages: 0, config: {}, workspaceId: activeWorkspaceId ?? '',
    };
    addChannel(nc);
    setSelected(nc);
    setNewName(''); setNewDesc(''); setNewAgentId(''); setNewType('web-widget'); setShowNewModal(false);
  };

  const handleUpdateChannel = (updated: Channel) => {
    updateChannel(updated.id, updated);
    setSelected(updated);
  };

  const handleDeleteChannel = (id: string) => {
    if (!window.confirm('Delete this channel?')) return;
    deleteChannel(id);
    setSelected(null);
  };

  const toggleConnect = (ch: Channel) => {
    const next: ChannelStatus = ch.status === 'connected' ? 'disconnected' : 'connected';
    handleUpdateChannel({ ...ch, status: next });
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
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-4 flex items-center justify-between gap-4 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <p className="section-label mb-0">Workflows</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Workflows</h1>
            <InfoTooltip content="Workflows are the surfaces where your agents talk to the world — Slack, Discord, web widgets, WhatsApp, REST API, email, and more. Each workflow is wired to one agent and has its own credentials and config." />
          </div>
        </div>
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient"
          style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}>
          <Plus size={16} /> New Workflow
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left list ── */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}>
          {/* Search + filter */}
          <div className="p-4 space-y-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="form-input pl-8 w-full text-sm" placeholder="Search logic units…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', ...Object.keys(CHANNEL_META)] as (ChannelType | 'all')[]).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all capitalize"
                  style={{
                    background: typeFilter === t ? 'rgba(192,86,64,0.12)' : 'var(--bg-elevated)',
                    color: typeFilter === t ? 'var(--burnt-orange)' : 'var(--text-muted)',
                    border: `1px solid ${typeFilter === t ? 'rgba(192,86,64,0.3)' : 'var(--border-color)'}`,
                  }}>
                  {t === 'all' ? 'All' : CHANNEL_META[t as ChannelType].label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel list */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No logic units found</p>
              </div>
            ) : filtered.map(ch => {
              const meta = CHANNEL_META[ch.type];
              const sm = statusMeta(ch.status);
              const agent = getAgent(ch.agentId);
              const isActive = selected?.id === ch.id;
              return (
                <button key={ch.id} onClick={() => setSelected(ch)}
                  className="w-full text-left px-4 py-4 flex items-start gap-3 transition-all duration-150"
                  style={{
                    background: isActive ? 'rgba(192,86,64,0.07)' : 'transparent',
                    borderLeft: `3px solid ${isActive ? 'var(--burnt-orange)' : 'transparent'}`,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(192,86,64,0.03)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: meta.bg }}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{ch.name}</p>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                    </div>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{meta.label}{agent ? ` · ${agent.name}` : ''}</p>
                    <p className="font-body text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{ch.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right detail ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'rgba(192,86,64,0.10)' }}>💬</div>
              <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Select a workflow</p>
              <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>Choose a workflow from the list or create a new one.</p>
            </div>
          ) : (() => {
            const ch = channels.find(c => c.id === selected.id) ?? selected;
            const meta = CHANNEL_META[ch.type];
            const sm = statusMeta(ch.status);
            const agent = getAgent(ch.agentId);
            const cv = getCanvas(ch.id);
            return (
              <div className="flex flex-col h-full">
                {/* Detail header */}
                <div className="flex-shrink-0 px-6 pt-6 pb-0">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: meta.bg }}>{meta.icon}</div>
                      <div>
                        <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{ch.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{meta.label}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleConnect(ch)}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                        style={{
                          background: ch.status === 'connected' ? 'rgba(220,38,38,0.08)' : 'rgba(192,86,64,0.10)',
                          color: ch.status === 'connected' ? '#DC2626' : 'var(--burnt-orange)',
                          border: `1px solid ${ch.status === 'connected' ? 'rgba(220,38,38,0.25)' : 'rgba(192,86,64,0.25)'}`,
                        }}>
                        {ch.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </button>
                      <button onClick={() => handleDeleteChannel(ch.id)}
                        className="p-2 rounded-xl transition-all"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      ><Trash2 size={16} /></button>
                    </div>
                  </div>

                  {/* Canvas / Config tabs */}
                  <div className="flex gap-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    {(['canvas', 'config'] as const).map(t => (
                      <button key={t} onClick={() => setDetailTab(t)}
                        className="px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px"
                        style={{
                          color: detailTab === t ? 'var(--burnt-orange)' : 'var(--text-muted)',
                          borderBottomColor: detailTab === t ? 'var(--burnt-orange)' : 'transparent',
                        }}
                        onMouseEnter={e => { if (detailTab !== t) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        onMouseLeave={e => { if (detailTab !== t) e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >{t === 'canvas' ? '⬡ Canvas' : '⚙ Config'}</button>
                    ))}
                  </div>
                </div>

                {/* ── CANVAS TAB ── */}
                {detailTab === 'canvas' && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}>
                      <div className="relative">
                        <button
                          onClick={() => setShowAddNode(v => !v)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        ><Plus size={12} /> Add Node <ChevronDown size={11} /></button>

                        {showAddNode && (
                          <div className="absolute left-0 top-full mt-1 z-30 w-64 rounded-2xl overflow-hidden"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                            {/* Input nodes */}
                            <div className="px-3 pt-3 pb-1">
                              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#6366F1' }}>● Input</span>
                            </div>
                            {INITIAL_KBS.map(kb => (
                              <button key={kb.id} type="button"
                                onMouseDown={() => addNode(ch.id, { id: `kb-${kb.id}`, kind: 'kb', label: kb.name, icon: '🗄', category: 'input' })}
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              ><span>🗄</span>{kb.name}</button>
                            ))}
                            {RECOMMENDED_SKILLS.slice(0, 4).map(s => (
                              <button key={s.label} type="button"
                                onMouseDown={() => addNode(ch.id, { id: `tool-${s.label}`, kind: 'tool', label: s.label, icon: '🔧', category: 'input' })}
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              ><span>🔧</span>{s.label}</button>
                            ))}
                            {/* Work nodes */}
                            <div className="px-3 pt-3 pb-1 border-t mt-1" style={{ borderColor: 'var(--border-color)' }}>
                              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#0EA5E9' }}>● Work</span>
                            </div>
                            {instances.map(inst => (
                              <button key={inst.id} type="button"
                                onMouseDown={() => addNode(ch.id, { id: `agent-${inst.id}`, kind: 'agent', label: inst.name, icon: '🤖', category: 'work' })}
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              ><span>🤖</span>{inst.name}</button>
                            ))}
                            {teams.map(team => (
                              <button key={team.id} type="button"
                                onMouseDown={() => addNode(ch.id, { id: `team-${team.id}`, kind: 'team', label: team.name, icon: '👥', category: 'work' })}
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              ><span>👥</span>{team.name}</button>
                            ))}
                            {/* Output nodes */}
                            <div className="px-3 pt-3 pb-1 border-t mt-1" style={{ borderColor: 'var(--border-color)' }}>
                              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--burnt-orange)' }}>● Output</span>
                            </div>
                            {(Object.entries(CHANNEL_META) as [ChannelType, typeof CHANNEL_META[ChannelType]][]).map(([key, m]) => (
                              <button key={key} type="button"
                                onMouseDown={() => addNode(ch.id, { id: `chan-${key}`, kind: 'channel', label: m.label, icon: m.icon, category: 'output' })}
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              ><span>{m.icon}</span>{m.label}</button>
                            ))}
                            <div className="h-2" />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setCanvas(ch.id, () => ({ nodes: [], edges: [] }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.color = '#DC2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      ><Trash2 size={11} /> Clear</button>

                      <div className="ml-auto flex items-center gap-3">
                        <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#6366F1' }} />Input</span>
                          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#0EA5E9' }} />Work</span>
                          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: 'var(--burnt-orange)' }} />Output</span>
                        </div>
                        <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{cv.nodes.length} nodes · {cv.edges.length} edges</span>
                      </div>
                    </div>

                    {/* Canvas area */}
                    <div
                      ref={canvasRef}
                      className="flex-1 relative overflow-hidden select-none"
                      style={{ background: 'var(--bg-primary)', backgroundImage: 'radial-gradient(circle, var(--border-color) 1px, transparent 1px)', backgroundSize: '24px 24px', cursor: dragging ? 'grabbing' : 'default' }}
                      onMouseMove={e => onCanvasMouseMove(e, ch.id)}
                      onMouseUp={onCanvasMouseUp}
                      onClick={() => setShowAddNode(false)}
                    >
                      {cv.nodes.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>⬡</div>
                          <p className="font-display font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>Empty canvas</p>
                          <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>Click <strong>Add Node</strong> to start building your workflow.</p>
                        </div>
                      )}

                      {/* SVG edges layer */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                        <defs>
                          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="var(--burnt-orange)" opacity="0.6" />
                          </marker>
                        </defs>
                        {cv.edges.map(edge => {
                          const from = cv.nodes.find(n => n.id === edge.fromId);
                          const to   = cv.nodes.find(n => n.id === edge.toId);
                          if (!from || !to) return null;
                          const fp = portPos(from, 'right');
                          const tp = portPos(to, 'left');
                          return (
                            <g key={edge.id} className="pointer-events-auto" style={{ cursor: 'pointer' }}
                              onClick={() => removeEdge(ch.id, edge.id)}>
                              <path d={bezier(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke="transparent" strokeWidth={12} />
                              <path d={bezier(fp.x, fp.y, tp.x, tp.y)} fill="none"
                                stroke="var(--burnt-orange)" strokeWidth={2} strokeOpacity={0.55}
                                markerEnd="url(#arrowhead)" />
                            </g>
                          );
                        })}
                        {/* Pending edge preview */}
                        {pendingEdge && pendingEdge.chId === ch.id && (() => {
                          const from = cv.nodes.find(n => n.id === pendingEdge.fromId);
                          if (!from) return null;
                          const fp = portPos(from, pendingEdge.fromSide);
                          return (
                            <path d={bezier(fp.x, fp.y, pendingEdge.mx, pendingEdge.my)}
                              fill="none" stroke="var(--burnt-orange)" strokeWidth={2} strokeDasharray="6 3" strokeOpacity={0.7} />
                          );
                        })()}
                      </svg>

                      {/* Nodes */}
                      {cv.nodes.map(node => {
                        const cs = categoryStyle(node.category);
                        const hasLeft  = node.category !== 'input';
                        const hasRight = node.category !== 'output';
                        return (
                          <div key={node.id}
                            style={{ position: 'absolute', left: node.x, top: node.y, width: NODE_W, height: NODE_H, cursor: 'grab', userSelect: 'none', zIndex: dragging?.nodeId === node.id ? 10 : 1 }}
                            onMouseDown={e => onNodeMouseDown(e, ch.id, node.id)}
                          >
                            {/* Left port */}
                            {hasLeft && (
                              <div
                                style={{ position: 'absolute', left: -7, top: NODE_H / 2 - 7, width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-surface)', border: `2px solid ${cs.border.replace('2px solid ', '')}`, cursor: 'crosshair', zIndex: 2 }}
                                onMouseDown={e => onPortMouseDown(e, ch.id, node.id, 'left')}
                                onMouseUp={e => onPortMouseUp(e, ch.id, node.id)}
                              />
                            )}
                            {/* Card */}
                            <div className="w-full h-full rounded-2xl flex flex-col justify-center px-3 gap-1"
                              style={{ background: cs.bg, border: cs.border, boxShadow: dragging?.nodeId === node.id ? 'var(--shadow-lg)' : 'none' }}>
                              <div className="flex items-center gap-2">
                                <span className="text-base leading-none">{node.icon}</span>
                                <p className="font-display font-semibold text-xs truncate flex-1" style={{ color: 'var(--text-primary)' }}>{node.label}</p>
                                <button
                                  onMouseDown={e => e.stopPropagation()}
                                  onClick={() => removeNode(ch.id, node.id)}
                                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#DC2626'; }}
                                  onMouseLeave={e => { e.currentTarget.style.opacity = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                ><X size={11} /></button>
                              </div>
                              <span className="self-start px-1.5 py-0.5 rounded-full font-mono text-[9px] font-semibold uppercase tracking-wide"
                                style={{ background: cs.pill.bg, color: cs.pill.color }}>{node.category}</span>
                            </div>
                            {/* Right port */}
                            {hasRight && (
                              <div
                                style={{ position: 'absolute', right: -7, top: NODE_H / 2 - 7, width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-surface)', border: `2px solid ${cs.border.replace('2px solid ', '')}`, cursor: 'crosshair', zIndex: 2 }}
                                onMouseDown={e => onPortMouseDown(e, ch.id, node.id, 'right')}
                                onMouseUp={e => onPortMouseUp(e, ch.id, node.id)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── CONFIG TAB ── */}
                {detailTab === 'config' && (
                  <div className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-2xl">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { label: 'Messages', value: ch.messages.toLocaleString() },
                        { label: 'Created',  value: ch.createdAt },
                        { label: 'Agent',    value: agent?.name ?? 'None' },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-xl px-4 py-3"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                          <p className="section-label mb-1">{stat.label}</p>
                          <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                      <p className="section-label mb-2">Description</p>
                      <textarea className="form-input w-full resize-none text-sm" rows={2}
                        value={ch.description}
                        onChange={e => handleUpdateChannel({ ...ch, description: e.target.value })} />
                    </div>

                    {/* Agent assignment */}
                    <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                      <p className="section-label mb-3">Assigned Agent</p>
                      <select className="form-select w-full"
                        value={ch.agentId ?? ''}
                        onChange={e => handleUpdateChannel({ ...ch, agentId: e.target.value || null })}>
                        <option value="">— No agent —</option>
                        {instances.map(i => (
                          <option key={i.id} value={i.id}>{i.name} ({i.model})</option>
                        ))}
                      </select>
                      {agent && (
                        <div className="flex items-center gap-3 mt-3 px-3 py-2.5 rounded-xl"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(192,86,64,0.10)' }}>
                            <Bot size={14} style={{ color: 'var(--burnt-orange)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                            <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{agent.model} · {agent.status}</p>
                          </div>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{
                            background: agent.status === 'running' ? '#2D7D46' : agent.status === 'error' ? '#DC2626' : '#64748B'
                          }} />
                        </div>
                      )}
                    </div>

                    {/* Credentials / config */}
                    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                      <p className="section-label mb-4">Configuration</p>
                      {meta.fields.length === 0 ? (
                        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No configuration required for this channel type.</p>
                      ) : (
                        <div className="space-y-4">
                          {meta.fields.map(field => {
                            const isSecret = field.secret;
                            const revealed = showSecrets[`${ch.id}-${field.key}`];
                            return (
                              <div key={field.key}>
                                <label className="section-label mb-1.5 block">{field.label}</label>
                                <div className="relative">
                                  <input
                                    className="form-input w-full pr-10 font-mono text-sm"
                                    type={isSecret && !revealed ? 'password' : 'text'}
                                    placeholder={field.placeholder}
                                    value={ch.config[field.key] ?? ''}
                                    onChange={e => handleUpdateChannel({ ...ch, config: { ...ch.config, [field.key]: e.target.value } })}
                                  />
                                  {isSecret && (
                                    <button
                                      type="button"
                                      onClick={() => setShowSecrets(prev => ({ ...prev, [`${ch.id}-${field.key}`]: !revealed }))}
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

                      {/* Embed snippet for web-widget */}
                      {ch.type === 'web-widget' && (
                        <div className="mt-5">
                          <p className="section-label mb-2">Embed Snippet</p>
                          <div className="rounded-xl p-3 font-mono text-xs overflow-x-auto"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            {`<script src="https://cdn.dropin.bot/widget.js"\n  data-channel="${ch.id}"\n  data-color="${ch.config.primaryColor || '#C05640'}"\n  defer></script>`}
                          </div>
                        </div>
                      )}

                      {/* Webhook URL for API */}
                      {ch.type === 'api' && (
                        <div className="mt-5">
                          <p className="section-label mb-2">Inbound Webhook URL</p>
                          <div className="flex items-center gap-2">
                            <input readOnly className="form-input flex-1 font-mono text-xs"
                              value={`https://api.dropin.bot/channels/${ch.id}/inbound`} />
                            <button
                              onClick={() => navigator.clipboard.writeText(`https://api.dropin.bot/channels/${ch.id}/inbound`).catch(() => {})}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            ><Copy size={13} /> Copy</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* New Workflow modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(45,42,38,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>New Workflow</h2>
              <button onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              ><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {/* Channel type grid */}
              <div>
                <label className="section-label mb-2 block">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(CHANNEL_META) as [ChannelType, typeof CHANNEL_META[ChannelType]][]).map(([key, meta]) => (
                    <button key={key} type="button" onClick={() => setNewType(key)}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-150"
                      style={{
                        border: `1.5px solid ${newType === key ? meta.color : 'var(--border-color)'}`,
                        background: newType === key ? meta.bg : 'var(--bg-elevated)',
                      }}
                      onMouseEnter={e => { if (newType !== key) e.currentTarget.style.borderColor = meta.color + '55'; }}
                      onMouseLeave={e => { if (newType !== key) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    >
                      <span className="text-xl leading-none">{meta.icon}</span>
                      <span className="font-mono text-[9px] font-semibold text-center leading-tight"
                        style={{ color: newType === key ? meta.color : 'var(--text-muted)' }}>{meta.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="section-label mb-1.5 block">Workflow Name</label>
                <input className="form-input w-full" placeholder={`e.g. ${CHANNEL_META[newType].label} Bot`}
                  value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
              </div>

              <div>
                <label className="section-label mb-1.5 block">Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input w-full" placeholder="What does this channel do?"
                  value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>

              <div>
                <label className="section-label mb-1.5 block">Assign Agent <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <select className="form-select w-full" value={newAgentId} onChange={e => setNewAgentId(e.target.value)}>
                  <option value="">— Choose later —</option>
                  {instances.map(i => <option key={i.id} value={i.id}>{i.name} ({i.model})</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--burnt-orange)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >Cancel</button>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white brand-gradient disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ boxShadow: newName.trim() ? '0 4px 12px rgba(192,86,64,0.25)' : 'none' }}
              >Create Workflow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
