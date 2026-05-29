import { useState } from 'react';
import {
  Plus, Search, Trash2, Bot, Check,
  Database, CloudUpload, Layers, Brain, BookOpen, Lock,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import { EXTERNAL_SOURCE_TYPES, VECTOR_STORES, EMBEDDING_MODELS, RAG_LLMS } from '../data';
import type { KnowledgeBase, KBSource, KBVisibility } from '../types';

// ── Radio list ────────────────────────────────────────────────────────────────

function RadioList<T extends string>({
  label,
  icon,
  options,
  selected,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  options: { id: T; label: string; desc?: string; badge?: string; meta?: string }[];
  selected: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: 'var(--burnt-orange)', display: 'flex' }}>{icon}</span>
        <h3 className="font-display font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{label}</h3>
      </div>
      <div className="space-y-1.5">
        {options.map(opt => {
          const sel = opt.id === selected;
          return (
            <button key={opt.id} type="button"
              onClick={() => onChange(opt.id)}
              className="w-full text-left rounded-lg px-3 py-2 flex items-center gap-3 transition-all duration-150"
              style={{
                border: `1.5px solid ${sel ? 'var(--burnt-orange)' : 'var(--border-color)'}`,
                background: sel ? 'rgba(192,86,64,0.05)' : 'var(--bg-elevated)',
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(192,86,64,0.35)'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center" style={{ border: `2px solid ${sel ? 'var(--burnt-orange)' : 'var(--border-color)'}` }}>
                {sel && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--burnt-orange)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px]" style={{ color: sel ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{opt.label}</span>
                  {opt.meta && <span className="font-body text-[10px]" style={{ color: 'var(--text-muted)' }}>{opt.meta}</span>}
                </div>
                {opt.desc && <p className="font-body text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>}
              </div>
              {opt.badge && (
                <span className="font-mono text-[9px] px-1 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Status badge helper ────────────────────────────────────────────────────────

const sourceStatus = (s: 'indexed' | 'processing' | 'error') =>
  ({
    indexed:    { dot: '#2D7D46', label: 'Indexed',    bg: 'rgba(45,125,70,0.10)',  color: '#2D7D46'   },
    processing: { dot: '#F59E0B', label: 'Processing',  bg: 'rgba(245,158,11,0.10)', color: '#F59E0B'  },
    error:      { dot: '#DC2626', label: 'Error',       bg: 'rgba(220,38,38,0.10)',  color: '#DC2626'  },
  })[s];

const kbStatus = (s: 'active' | 'indexing' | 'error') =>
  ({
    active:   { dot: '#2D7D46', label: 'Active',   bg: 'rgba(45,125,70,0.10)',  color: '#2D7D46'   },
    indexing: { dot: '#F59E0B', label: 'Indexing',  bg: 'rgba(245,158,11,0.10)', color: '#F59E0B'  },
    error:    { dot: '#DC2626', label: 'Error',     bg: 'rgba(220,38,38,0.10)',  color: '#DC2626'  },
  })[s];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KnowledgeBasesPage() {
  const { workspaces, knowledgeBases, addKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } = useStore();
  const { activeWorkspaceId } = useWorkspace();
  const workspaceKbs = knowledgeBases.filter(kb => kb.workspaceId === activeWorkspaceId);
  const [activeId, setActiveId] = useState<string | null>(workspaceKbs[0]?.id ?? null);

  const selected = workspaceKbs.find(k => k.id === activeId) ?? null;

  const update = (id: string, patch: Partial<KnowledgeBase>) =>
    updateKnowledgeBase(id, patch);

  const toggleWorkspace = (kbId: string, wsId: string) => {
    const kb = knowledgeBases.find(k => k.id === kbId);
    if (!kb) return;
    const has = kb.permissions.workspaceIds.includes(wsId);
    update(kbId, {
      permissions: {
        ...kb.permissions,
        workspaceIds: has
          ? kb.permissions.workspaceIds.filter(w => w !== wsId)
          : [...kb.permissions.workspaceIds, wsId],
      },
    });
  };

  const totalChunks = (kb: KnowledgeBase) =>
    kb.sources.reduce((s, src) => s + src.chunks, 0);

  const handleNew = () => {
    const id = `kb-${Date.now()}`;
    const nb: KnowledgeBase = {
      id, name: 'New Knowledge Base', description: '',
      status: 'indexing', sources: [],
      vectorStore: 'Pinecone', embeddingModel: 'text-embedding-3-large', ragLLM: 'gpt-4o',
      retrieval: { topK: 5, minSimilarity: 72, chunkSize: 512 },
      permissions: { workspaceIds: [], visibility: 'private' },
      workspaceId: activeWorkspaceId ?? '',
    };
    addKnowledgeBase(nb);
    setActiveId(id);
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Zone 0: Sticky Header ── */}
      <div
        className="sticky top-0 z-10 px-4 sm:px-6 lg:px-10 py-4 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <p className="section-label mb-0">design</p>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Knowledge Bases</h1>
          <InfoTooltip content="A knowledge base is a retrieval pipeline — connect sources (PDFs, Notion, web crawls), choose a vector store and embedding model, and agents query it to answer questions. One knowledge base can be shared across multiple workspaces with permission controls." />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* ── Left sidebar: KB list ── */}
        <div
          className="w-80 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: '1px solid var(--border-color)' }}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {workspaceKbs.length} knowledge base{workspaceKbs.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleNew}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150"
              style={{ background: 'rgba(192,86,64,0.08)', color: 'var(--burnt-orange)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--burnt-orange)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,86,64,0.08)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
            >
              <Plus size={12} /> New
            </button>
          </div>

          {/* KB cards */}
          <div className="scroll-y-kb flex-1 p-3 space-y-2">
            {workspaceKbs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BookOpen size={32} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
                <p className="font-display font-semibold text-xs mt-3" style={{ color: 'var(--text-primary)' }}>No knowledge bases yet</p>
                <p className="font-body text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Create one to start building retrieval pipelines.
                </p>
                <button
                  onClick={handleNew}
                  className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white brand-gradient"
                  style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.20)' }}
                >
                  <Plus size={12} /> New Knowledge Base
                </button>
              </div>
            ) : (
              workspaceKbs.map(kb => {
                const st = kbStatus(kb.status);
                const active = activeId === kb.id;
                return (
                  <button
                    key={kb.id}
                    type="button"
                    onClick={() => setActiveId(kb.id)}
                    className="text-left rounded-2xl p-3.5 transition-all duration-150 w-full"
                    style={{
                      background: active ? 'rgba(192,86,64,0.06)' : 'var(--bg-surface)',
                      border: `1.5px solid ${active ? 'var(--burnt-orange)' : 'var(--border-color)'}`,
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(192,86,64,0.35)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-display font-semibold text-xs leading-tight" style={{ color: active ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>
                        {kb.name}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: st.bg, color: st.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>
                    {kb.description && (
                      <p className="font-body text-[11px] mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {kb.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        {kb.sources.length} source{kb.sources.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ color: 'var(--border-color)' }}>·</span>
                      <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        {totalChunks(kb).toLocaleString()} chunks
                      </span>
                      <span style={{ color: 'var(--border-color)' }}>·</span>
                      <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        {kb.vectorStore}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: detail ── */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
              <BookOpen size={44} strokeWidth={1.2} />
              <p className="font-body text-sm">Select a knowledge base or create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl">

              {/* Title + actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <input
                    className="form-input font-display font-semibold text-lg"
                    style={{ paddingTop: 10, paddingBottom: 10 }}
                    value={selected.name}
                    onChange={e => update(selected.id, { name: e.target.value })}
                  />
                  <input
                    className="form-input font-body text-xs"
                    style={{ paddingTop: 8, paddingBottom: 8 }}
                    placeholder="Description…"
                    value={selected.description}
                    onChange={e => update(selected.id, { description: e.target.value })}
                  />
                </div>
                <button
                  onClick={() => { if (window.confirm('Delete this knowledge base?')) { deleteKnowledgeBase(selected.id); setActiveId(null); } }}
                  className="p-2 rounded-xl flex-shrink-0 transition-colors duration-150"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.30)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                ><Trash2 size={14} /></button>
              </div>

              {/* ── Sources ── */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Database size={14} style={{ color: 'var(--burnt-orange)' }} />
                  <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Sources</h3>
                  <span className="ml-auto font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {selected.sources.length} source{selected.sources.length !== 1 ? 's' : ''} · {totalChunks(selected).toLocaleString()} chunks
                  </span>
                </div>

                {/* Existing sources */}
                {selected.sources.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {selected.sources.map(src => {
                      const st = sourceStatus(src.status);
                      return (
                        <div key={src.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                          <span className="text-base flex-shrink-0">{src.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-body font-medium text-xs truncate" style={{ color: 'var(--text-primary)' }}>{src.name}</p>
                            <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{src.type} · {src.size} · {src.chunks} chunks</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: st.bg, color: st.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                            {st.label}
                          </span>
                          <button
                            onClick={() => update(selected.id, { sources: selected.sources.filter(s => s.id !== src.id) })}
                            className="p-1 rounded-lg flex-shrink-0 transition-colors duration-150"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                          ><Trash2 size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="font-body text-xs mb-3" style={{ color: 'var(--text-muted)' }}>No sources yet — add one below.</p>
                )}

                {/* Add source row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const ns: KBSource = { id: `s-${Date.now()}`, name: 'New File', type: 'PDF', size: '—', chunks: 0, status: 'processing', icon: '📄' };
                      update(selected.id, { sources: [...selected.sources, ns] });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(192,86,64,0.35)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  ><CloudUpload size={12} /> Upload File</button>
                  {EXTERNAL_SOURCE_TYPES.map(ext => (
                    <button key={ext.type}
                      onClick={() => {
                        const ns: KBSource = { id: `s-${Date.now()}`, name: ext.label, type: ext.type as KBSource['type'], size: '—', chunks: 0, status: 'processing', icon: ext.icon };
                        update(selected.id, { sources: [...selected.sources, ns] });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(192,86,64,0.35)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >{ext.icon} {ext.label}</button>
                  ))}
                </div>
              </div>

              {/* ── Vector Store + Embedding ── */}
              <div className="grid grid-cols-2 gap-4">
                <RadioList
                  label="Vector Store"
                  icon={<Layers size={13} />}
                  selected={selected.vectorStore}
                  onChange={id => update(selected.id, { vectorStore: id as KnowledgeBase['vectorStore'] })}
                  options={VECTOR_STORES.map(vs => ({ id: vs.id, label: vs.label, desc: vs.desc, badge: vs.badge }))}
                />
                <RadioList
                  label="Embedding Model"
                  icon={<Brain size={13} />}
                  selected={selected.embeddingModel}
                  onChange={id => update(selected.id, { embeddingModel: id })}
                  options={EMBEDDING_MODELS.map(em => ({ id: em.id, label: em.label, meta: `${em.provider} · ${em.dims}`, badge: em.badge }))}
                />
              </div>

              {/* ── RAG LLM ── */}
              <RadioList
                label="Synthesis Model"
                icon={<Bot size={13} />}
                selected={selected.ragLLM}
                onChange={id => update(selected.id, { ragLLM: id })}
                options={RAG_LLMS.map(llm => ({ id: llm.id, label: llm.label, meta: llm.provider, badge: llm.badge }))}
              />

              {/* ── Retrieval Settings ── */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Search size={13} style={{ color: 'var(--burnt-orange)' }} />
                  <h3 className="font-display font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Retrieval Settings</h3>
                </div>
                <div className="grid grid-cols-3 gap-5">
                  {([
                    { key: 'topK',          label: 'Top-K Chunks',   min: 1,   max: 20,   step: 1,   display: String(selected.retrieval.topK),          pct: ((selected.retrieval.topK - 1) / 19) * 100 },
                    { key: 'minSimilarity', label: 'Min Similarity', min: 0,   max: 100,  step: 1,   display: (selected.retrieval.minSimilarity / 100).toFixed(2), pct: selected.retrieval.minSimilarity },
                    { key: 'chunkSize',     label: 'Chunk Size',     min: 128, max: 2048, step: 128, display: `${selected.retrieval.chunkSize} tok`,     pct: ((selected.retrieval.chunkSize - 128) / 1920) * 100 },
                  ] as { key: keyof typeof selected.retrieval; label: string; min: number; max: number; step: number; display: string; pct: number }[]).map(s => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.label}</label>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}>{s.display}</span>
                      </div>
                      <input type="range" min={s.min} max={s.max} step={s.step}
                        value={selected.retrieval[s.key]}
                        onChange={e => update(selected.id, { retrieval: { ...selected.retrieval, [s.key]: Number(e.target.value) } })}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          accentColor: 'var(--burnt-orange)',
                          background: `linear-gradient(to right, var(--burnt-orange) ${s.pct}%, var(--border-color) ${s.pct}%)`,
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="font-body text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.min}</span>
                        <span className="font-body text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Permissions ── */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={13} style={{ color: 'var(--burnt-orange)' }} />
                  <h3 className="font-display font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Permissions</h3>
                </div>

                {/* Visibility */}
                <div className="mb-4">
                  <label className="section-label mb-2 block">Visibility</label>
                  <div className="flex gap-2">
                    {([
                      { id: 'private',   label: 'Private',   desc: 'Only you' },
                      { id: 'workspace', label: 'Workspace', desc: 'Attached workspaces' },
                      { id: 'org',       label: 'Org',       desc: 'Everyone in org' },
                    ] as { id: KBVisibility; label: string; desc: string }[]).map(v => {
                      const sel = v.id === selected.permissions.visibility;
                      return (
                        <button key={v.id} type="button"
                          onClick={() => update(selected.id, { permissions: { ...selected.permissions, visibility: v.id } })}
                          className="flex-1 rounded-xl px-3 py-2.5 text-center transition-all duration-150"
                          style={{ border: `1.5px solid ${sel ? 'var(--burnt-orange)' : 'var(--border-color)'}`, background: sel ? 'rgba(192,86,64,0.05)' : 'var(--bg-elevated)' }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(192,86,64,0.35)'; }}
                          onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                          <p className="font-display font-semibold text-xs" style={{ color: sel ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{v.label}</p>
                          <p className="font-body text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{v.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workspace access */}
                <div>
                  <label className="section-label mb-2 block">Workspace Access</label>
                  <div className="space-y-1.5">
                    {workspaces.map(ws => {
                      const has = selected.permissions.workspaceIds.includes(ws.id);
                      return (
                        <button key={ws.id} type="button"
                          onClick={() => toggleWorkspace(selected.id, ws.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                          style={{ border: `1.5px solid ${has ? 'var(--burnt-orange)' : 'var(--border-color)'}`, background: has ? 'rgba(192,86,64,0.05)' : 'var(--bg-elevated)' }}
                          onMouseEnter={e => { if (!has) e.currentTarget.style.borderColor = 'rgba(192,86,64,0.35)'; }}
                          onMouseLeave={e => { if (!has) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ border: `2px solid ${has ? 'var(--burnt-orange)' : 'var(--border-color)'}`, background: has ? 'var(--burnt-orange)' : 'transparent' }}>
                            {has && <Check size={10} color="white" strokeWidth={3} />}
                          </div>
                          <span className="font-body text-xs flex-1 text-left" style={{ color: has ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{ws.name}</span>
                          {ws.isDefault && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}>Default</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
