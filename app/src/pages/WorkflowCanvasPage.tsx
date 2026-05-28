import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, X, ChevronDown, ChevronLeft,
  Bot, Copy, Eye, EyeOff,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CHANNEL_META, INITIAL_KBS, RECOMMENDED_SKILLS } from '../data';
import type { Channel, ChannelType, ChannelStatus } from '../types';

// ── Canvas local types ──────────────────────────────────────────────────────
type CanvasCategory = 'input' | 'work' | 'output';
type CanvasNode = {
  id: string;
  kind: 'kb' | 'tool' | 'agent' | 'team' | 'channel';
  label: string;
  icon: string;
  category: CanvasCategory;
  x: number;
  y: number;
};
type CanvasEdge = { id: string; fromId: string; toId: string };
type WorkflowCanvas = { nodes: CanvasNode[]; edges: CanvasEdge[] };

export default function WorkflowCanvasPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { instances, teams, channels, updateChannel, deleteChannel } = useStore();

  const ch = channels.find(c => c.id === id);

  // ── Canvas state ──
  const [canvas, setCanvasState] = useState<WorkflowCanvas>({ nodes: [], edges: [] });
  const [dragging, setDragging] = useState<{ nodeId: string; ox: number; oy: number } | null>(null);
  const [pendingEdge, setPendingEdge] = useState<{ fromId: string; fromSide: 'right' | 'left'; mx: number; my: number } | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [addNodeCategory, setAddNodeCategory] = useState<CanvasCategory | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'canvas' | 'config'>('canvas');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Canvas helpers ──
  const addNode = (node: Omit<CanvasNode, 'x' | 'y'>) => {
    if (canvas.nodes.find(n => n.id === node.id)) return;
    const col = node.category === 'input' ? 60 : node.category === 'work' ? 280 : 500;
    const row = canvas.nodes.filter(n => n.category === node.category).length;
    setCanvasState(prev => ({
      ...prev,
      nodes: [...prev.nodes, { ...node, x: col, y: 60 + row * 120 }],
    }));
    setShowAddNode(false);
  };

  const removeNode = (nodeId: string) =>
    setCanvasState(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.fromId !== nodeId && e.toId !== nodeId),
    }));

  const addEdge = (fromId: string, toId: string) => {
    const from = canvas.nodes.find(n => n.id === fromId);
    const to   = canvas.nodes.find(n => n.id === toId);
    if (!from || !to || fromId === toId) return;
    const valid =
      (from.category === 'input' && to.category === 'work')   ||
      (from.category === 'work'  && to.category === 'work')   ||
      (from.category === 'work'  && to.category === 'output');
    if (!valid) return;
    if (canvas.edges.find(e => e.fromId === fromId && e.toId === toId)) return;
    setCanvasState(prev => ({
      ...prev,
      edges: [...prev.edges, { id: `e-${Date.now()}`, fromId, toId }],
    }));
  };

  const removeEdge = (edgeId: string) =>
    setCanvasState(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));

  const NODE_W = 176;
  const NODE_H = 72;

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

  const onNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    setSelectedNodeId(nodeId);
    setDragging({ nodeId, ox: e.clientX - (rect?.left ?? 0) - node.x, oy: e.clientY - (rect?.top ?? 0) - node.y });
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      setCanvasState(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === dragging.nodeId
            ? { ...n, x: Math.max(0, e.clientX - (rect?.left ?? 0) - dragging.ox), y: Math.max(0, e.clientY - (rect?.top ?? 0) - dragging.oy) }
            : n
        ),
      }));
    }
    if (pendingEdge) {
      const rect = canvasRef.current?.getBoundingClientRect();
      setPendingEdge(prev => prev ? { ...prev, mx: e.clientX - (rect?.left ?? 0), my: e.clientY - (rect?.top ?? 0) } : null);
    }
  };

  const onPortMouseDown = (e: React.MouseEvent, nodeId: string, side: 'left' | 'right') => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    setPendingEdge({ fromId: nodeId, fromSide: side, mx: e.clientX - (rect?.left ?? 0), my: e.clientY - (rect?.top ?? 0) });
  };

  const onPortMouseUp = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (pendingEdge) {
      addEdge(pendingEdge.fromId, nodeId);
      setPendingEdge(null);
    }
  };

  const onCanvasMouseUp = () => {
    setDragging(null);
    setPendingEdge(null);
  };

  // ── Channel helpers ──
  const statusMeta = (s: ChannelStatus) => ({
    connected:    { label: 'Connected',    color: '#2D7D46', bg: 'rgba(45,125,70,0.10)'   },
    disconnected: { label: 'Disconnected', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
    error:        { label: 'Error',        color: '#DC2626', bg: 'rgba(220,38,38,0.10)'   },
    pending:      { label: 'Pending',      color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  }[s]);

  const handleUpdateChannel = (updated: Channel) => updateChannel(updated.id, updated);

  const toggleConnect = (channel: Channel) => {
    const next: ChannelStatus = channel.status === 'connected' ? 'disconnected' : 'connected';
    handleUpdateChannel({ ...channel, status: next });
  };

  const handleDelete = (channel: Channel) => {
    if (!window.confirm('Delete this workflow?')) return;
    deleteChannel(channel.id);
    navigate('/workflows');
  };

  const getAgent = (agentId: string | null) => agentId ? instances.find(i => i.id === agentId) : null;

  // ── Not found ──
  if (!ch) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--bg-primary)' }}
      >
        <p className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          Workflow not found
        </p>
        <button
          onClick={() => navigate('/workflows')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={16} /> Back to Workflows
        </button>
      </div>
    );
  }

  const meta = CHANNEL_META[ch.type as ChannelType];
  const sm = statusMeta(ch.status);
  const agent = getAgent(ch.agentId);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Full-screen header ── */}
      <div
        className="flex-shrink-0 flex items-center gap-4 px-5 py-3"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', zIndex: 20 }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/workflows')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex-shrink-0"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; e.currentTarget.style.borderColor = 'rgba(192,86,64,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          <ChevronLeft size={15} /> Workflows
        </button>

        {/* Divider */}
        <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--border-color)' }} />

        {/* Channel identity */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: meta.bg }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="font-display font-bold text-base truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {ch.name}
            </h1>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: sm.bg, color: sm.color }}
            >
              {sm.label}
            </span>
          </div>
          <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {meta.label}
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="flex rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}
        >
          {(['canvas', 'config'] as const).map(t => (
            <button
              key={t}
              onClick={() => setDetailTab(t)}
              className="px-4 py-1.5 text-xs font-semibold capitalize transition-all"
              style={{
                background: detailTab === t ? 'var(--burnt-orange)' : 'transparent',
                color: detailTab === t ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t === 'canvas' ? '⬡ Canvas' : '⚙ Config'}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toggleConnect(ch)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: ch.status === 'connected' ? 'rgba(220,38,38,0.08)' : 'rgba(192,86,64,0.10)',
              color: ch.status === 'connected' ? '#DC2626' : 'var(--burnt-orange)',
              border: `1px solid ${ch.status === 'connected' ? 'rgba(220,38,38,0.25)' : 'rgba(192,86,64,0.25)'}`,
            }}
          >
            {ch.status === 'connected' ? 'Disconnect' : 'Connect'}
          </button>
          <button
            onClick={() => handleDelete(ch)}
            className="p-1.5 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── CANVAS TAB ── */}
      {detailTab === 'canvas' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Toolbar */}
          <div
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}
          >
            <div className="relative">
              <button
                onClick={() => setShowAddNode(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Plus size={12} /> Add Node <ChevronDown size={11} />
              </button>

              {showAddNode && (
                <div
                  className="absolute left-0 top-full mt-1 z-30 w-60 rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
                >
                  {/* Category tabs */}
                  <div className="flex gap-1 p-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    {([
                      { cat: 'input'  as CanvasCategory, label: 'Input',  color: '#6366F1',             bg: 'rgba(99,102,241,0.10)'  },
                      { cat: 'work'   as CanvasCategory, label: 'Work',   color: '#0EA5E9',             bg: 'rgba(14,165,233,0.10)'  },
                      { cat: 'output' as CanvasCategory, label: 'Output', color: 'var(--burnt-orange)', bg: 'rgba(192,86,64,0.10)'   },
                    ]).map(({ cat, label, color, bg }) => (
                      <button
                        key={cat}
                        type="button"
                        onMouseDown={e => { e.stopPropagation(); setAddNodeCategory(addNodeCategory === cat ? null : cat); }}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold font-mono uppercase tracking-wide transition-all"
                        style={{
                          background: addNodeCategory === cat ? bg : 'transparent',
                          color: addNodeCategory === cat ? color : 'var(--text-muted)',
                          border: `1px solid ${addNodeCategory === cat ? color + '55' : 'transparent'}`,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Nodes for selected category */}
                  {addNodeCategory === 'input' && (
                    <div className="py-1 max-h-52 overflow-y-auto">
                      {INITIAL_KBS.map(kb => (
                        <button
                          key={kb.id}
                          type="button"
                          onMouseDown={() => addNode({ id: `kb-${kb.id}`, kind: 'kb', label: kb.name, icon: '🗄', category: 'input' })}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span>🗄</span>{kb.name}
                        </button>
                      ))}
                      {RECOMMENDED_SKILLS.slice(0, 4).map(s => (
                        <button
                          key={s.label}
                          type="button"
                          onMouseDown={() => addNode({ id: `tool-${s.label}`, kind: 'tool', label: s.label, icon: '🔧', category: 'input' })}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span>🔧</span>{s.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {addNodeCategory === 'work' && (
                    <div className="py-1 max-h-52 overflow-y-auto">
                      {instances.map(inst => (
                        <button
                          key={inst.id}
                          type="button"
                          onMouseDown={() => addNode({ id: `agent-${inst.id}`, kind: 'agent', label: inst.name, icon: '🤖', category: 'work' })}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span>🤖</span>{inst.name}
                        </button>
                      ))}
                      {teams.map(team => (
                        <button
                          key={team.id}
                          type="button"
                          onMouseDown={() => addNode({ id: `team-${team.id}`, kind: 'team', label: team.name, icon: '👥', category: 'work' })}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span>👥</span>{team.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {addNodeCategory === 'output' && (
                    <div className="py-1 max-h-52 overflow-y-auto">
                      {(Object.entries(CHANNEL_META) as [ChannelType, typeof CHANNEL_META[ChannelType]][]).map(([key, m]) => (
                        <button
                          key={key}
                          type="button"
                          onMouseDown={() => addNode({ id: `chan-${key}`, kind: 'channel', label: m.label, icon: m.icon, category: 'output' })}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span>{m.icon}</span>{m.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {!addNodeCategory && (
                    <div className="px-3 py-3 text-center">
                      <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Select a category above</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              disabled={!selectedNodeId}
              onClick={() => { if (selectedNodeId) { removeNode(selectedNodeId); setSelectedNodeId(null); } }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'var(--bg-elevated)',
                border: `1px solid ${selectedNodeId ? 'rgba(220,38,38,0.4)' : 'var(--border-color)'}`,
                color: selectedNodeId ? '#DC2626' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (selectedNodeId) e.currentTarget.style.borderColor = '#DC2626'; }}
              onMouseLeave={e => { if (selectedNodeId) e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'; }}
            >
              <Trash2 size={11} /> Remove
            </button>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#6366F1' }} />Input</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#0EA5E9' }} />Work</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: 'var(--burnt-orange)' }} />Output</span>
              </div>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {canvas.nodes.length} nodes · {canvas.edges.length} edges
              </span>
            </div>
          </div>

          {/* Canvas area */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden select-none"
            style={{
              background: 'var(--bg-primary)',
              backgroundImage: 'radial-gradient(circle, var(--border-color) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              cursor: dragging ? 'grabbing' : 'default',
            }}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onMouseDown={() => { setShowAddNode(false); setSelectedNodeId(null); }}
          >
            {canvas.nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                >
                  ⬡
                </div>
                <p className="font-display font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>
                  Empty canvas
                </p>
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                  Click <strong>Add Node</strong> to start building your workflow.
                </p>
              </div>
            )}

            {/* SVG edges layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--burnt-orange)" opacity="0.6" />
                </marker>
              </defs>
              {canvas.edges.map(edge => {
                const from = canvas.nodes.find(n => n.id === edge.fromId);
                const to   = canvas.nodes.find(n => n.id === edge.toId);
                if (!from || !to) return null;
                const fp = portPos(from, 'right');
                const tp = portPos(to, 'left');
                return (
                  <g
                    key={edge.id}
                    className="pointer-events-auto"
                    style={{ cursor: 'pointer' }}
                    onClick={() => removeEdge(edge.id)}
                  >
                    <path d={bezier(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke="transparent" strokeWidth={12} />
                    <path
                      d={bezier(fp.x, fp.y, tp.x, tp.y)}
                      fill="none"
                      stroke="var(--burnt-orange)"
                      strokeWidth={2}
                      strokeOpacity={0.55}
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
              {/* Pending edge preview */}
              {pendingEdge && (() => {
                const from = canvas.nodes.find(n => n.id === pendingEdge.fromId);
                if (!from) return null;
                const fp = portPos(from, pendingEdge.fromSide);
                return (
                  <path
                    d={bezier(fp.x, fp.y, pendingEdge.mx, pendingEdge.my)}
                    fill="none"
                    stroke="var(--burnt-orange)"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    strokeOpacity={0.7}
                  />
                );
              })()}
            </svg>

            {/* Nodes */}
            {canvas.nodes.map(node => {
              const cs = categoryStyle(node.category);
              const hasLeft  = node.category !== 'input';
              const hasRight = node.category !== 'output';
              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: NODE_W,
                    height: NODE_H,
                    cursor: 'grab',
                    userSelect: 'none',
                    zIndex: dragging?.nodeId === node.id ? 10 : selectedNodeId === node.id ? 5 : 1,
                  }}
                  onMouseDown={e => onNodeMouseDown(e, node.id)}
                >
                  {/* Left port */}
                  {hasLeft && (
                    <div
                      style={{
                        position: 'absolute',
                        left: -7,
                        top: NODE_H / 2 - 7,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: 'var(--bg-surface)',
                        border: `2px solid ${cs.border.replace('2px solid ', '')}`,
                        cursor: 'crosshair',
                        zIndex: 2,
                      }}
                      onMouseDown={e => onPortMouseDown(e, node.id, 'left')}
                      onMouseUp={e => onPortMouseUp(e, node.id)}
                    />
                  )}
                  {/* Card */}
                  <div
                    className="w-full h-full rounded-2xl flex flex-col justify-center px-3 gap-1"
                    style={{
                      background: cs.bg,
                      border: selectedNodeId === node.id ? cs.border.replace('2px', '3px') : cs.border,
                      boxShadow:
                        dragging?.nodeId === node.id
                          ? 'var(--shadow-lg)'
                          : selectedNodeId === node.id
                          ? `0 0 0 3px ${cs.border.replace('2px solid ', '')}55, 0 4px 16px rgba(0,0,0,0.15)`
                          : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{node.icon}</span>
                      <p
                        className="font-display text-xs truncate flex-1"
                        style={{ color: 'var(--text-primary)', fontWeight: selectedNodeId === node.id ? 800 : 600 }}
                      >
                        {node.label}
                      </p>
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => removeNode(node.id)}
                        className="flex-shrink-0 transition-opacity"
                        style={{ color: 'var(--text-muted)', opacity: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#DC2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <span
                      className="self-start px-1.5 py-0.5 rounded-full font-mono text-[9px] font-semibold uppercase tracking-wide"
                      style={{ background: cs.pill.bg, color: cs.pill.color }}
                    >
                      {node.category}
                    </span>
                  </div>
                  {/* Right port */}
                  {hasRight && (
                    <div
                      style={{
                        position: 'absolute',
                        right: -7,
                        top: NODE_H / 2 - 7,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: 'var(--bg-surface)',
                        border: `2px solid ${cs.border.replace('2px solid ', '')}`,
                        cursor: 'crosshair',
                        zIndex: 2,
                      }}
                      onMouseDown={e => onPortMouseDown(e, node.id, 'right')}
                      onMouseUp={e => onPortMouseUp(e, node.id)}
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
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 lg:p-8">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Messages', value: ch.messages.toLocaleString() },
                { label: 'Created',  value: ch.createdAt },
                { label: 'Agent',    value: agent?.name ?? 'None' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                >
                  <p className="section-label mb-1">{stat.label}</p>
                  <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
            >
              <p className="section-label mb-2">Description</p>
              <textarea
                className="form-input w-full resize-none text-sm"
                rows={2}
                value={ch.description}
                onChange={e => handleUpdateChannel({ ...ch, description: e.target.value })}
              />
            </div>

            {/* Agent assignment */}
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
            >
              <p className="section-label mb-3">Assigned Agent</p>
              <select
                className="form-select w-full"
                value={ch.agentId ?? ''}
                onChange={e => handleUpdateChannel({ ...ch, agentId: e.target.value || null })}
              >
                <option value="">— No agent —</option>
                {instances.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.model})</option>
                ))}
              </select>
              {agent && (
                <div
                  className="flex items-center gap-3 mt-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192,86,64,0.10)' }}
                  >
                    <Bot size={14} style={{ color: 'var(--burnt-orange)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {agent.name}
                    </p>
                    <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {agent.model} · {agent.status}
                    </p>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        agent.status === 'running' ? '#2D7D46'
                        : agent.status === 'error' ? '#DC2626'
                        : '#64748B',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Credentials / config */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
            >
              <p className="section-label mb-4">Configuration</p>
              {meta.fields.length === 0 ? (
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                  No configuration required for this channel type.
                </p>
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
                  <div
                    className="rounded-xl p-3 font-mono text-xs overflow-x-auto"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    {`<script src="https://cdn.dropin.bot/widget.js"\n  data-channel="${ch.id}"\n  data-color="${ch.config.primaryColor || '#C05640'}"\n  defer></script>`}
                  </div>
                </div>
              )}

              {/* Webhook URL for API */}
              {ch.type === 'api' && (
                <div className="mt-5">
                  <p className="section-label mb-2">Inbound Webhook URL</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      className="form-input flex-1 font-mono text-xs"
                      value={`https://api.dropin.bot/channels/${ch.id}/inbound`}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://api.dropin.bot/channels/${ch.id}/inbound`).catch(() => {})}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
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
