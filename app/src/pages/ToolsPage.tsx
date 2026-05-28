import { useState } from 'react';
import { Zap, Search, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, CheckCircle2, Globe, Database, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import { RECOMMENDED_SKILLS } from '../data';
import { SKILL_TAGS } from '../types';
import type { ToolConfigField } from '../types';

// ── Highlight helper ─────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(192,86,64,0.18)', color: 'var(--burnt-orange)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

// ── Catalog card ─────────────────────────────────────────────────────────────

function ToolCatalogCard({
  skill,
  query,
  activeCount,
  onAdd,
}: {
  skill: typeof RECOMMENDED_SKILLS[0];
  query: string;
  activeCount: number;
  onAdd: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex-shrink-0 flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200"
      style={{
        width: 160,
        background: hovered ? 'rgba(192,86,64,0.06)' : 'var(--bg-surface)',
        border: `1.5px solid ${hovered ? 'rgba(192,86,64,0.40)' : 'var(--border-color)'}`,
        boxShadow: hovered ? '0 4px 16px rgba(192,86,64,0.12)' : 'var(--shadow-sm)',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon + active badge */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: hovered ? 'rgba(192,86,64,0.12)' : 'rgba(192,86,64,0.08)' }}
        >
          <Zap size={18} style={{ color: 'var(--burnt-orange)' }} />
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

      {/* Label + desc */}
      <div className="flex-1">
        <p className="font-display font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
          <Highlight text={skill.label} query={query} />
        </p>
        <p className="font-body text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
          <Highlight text={skill.desc} query={query} />
        </p>
      </div>

      {/* Tags */}
      {skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.tags.map(t => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
              style={{ background: SKILL_TAGS[t].bg, color: SKILL_TAGS[t].color }}
            >
              {SKILL_TAGS[t].label}
            </span>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
        style={{
          background: hovered ? 'var(--burnt-orange)' : 'var(--bg-elevated)',
          color: hovered ? '#fff' : 'var(--burnt-orange)',
          border: `1px solid ${hovered ? 'var(--burnt-orange)' : 'rgba(192,86,64,0.35)'}`,
        }}
      >
        <Plus size={12} /> Add
      </button>
    </div>
  );
}

// ── Accordion row ─────────────────────────────────────────────────────────────

function ToolRow({ tool, skillDef, isOpen, onToggle, onRemove, onUpdateConfig }: {
  tool: { id: string; label: string; config: Record<string, string> };
  skillDef: typeof RECOMMENDED_SKILLS[0];
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdateConfig: (key: string, value: string) => void;
}) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Compute status
  const required = skillDef.configFields.filter(f => f.required);
  const allFilled = required.every(f => (tool.config[f.key] ?? '').trim() !== '');
  const anyFilled = skillDef.configFields.some(f => (tool.config[f.key] ?? '').trim() !== '');
  const status: 'ready' | 'configuring' | 'unconfigured' =
    skillDef.configFields.length === 0 ? 'ready' :
    allFilled ? 'ready' :
    anyFilled ? 'configuring' : 'unconfigured';

  const statusStyle = {
    ready:        { dot: '#2D7D46', label: 'Ready',          bg: 'rgba(45,125,70,0.10)',  color: '#2D7D46'   },
    configuring:  { dot: '#F59E0B', label: 'Configuring',    bg: 'rgba(245,158,11,0.10)', color: '#F59E0B'   },
    unconfigured: { dot: '#DC2626', label: 'Not configured', bg: 'rgba(220,38,38,0.10)',  color: '#DC2626'   },
  }[status];

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200" style={{
      border: `1.5px solid ${isOpen ? 'rgba(192,86,64,0.35)' : 'var(--border-color)'}`,
      background: 'var(--bg-surface)',
      boxShadow: isOpen ? '0 4px 20px rgba(192,86,64,0.10)' : 'var(--shadow-sm)',
    }}>
      {/* Row header */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-150"
        style={{ background: isOpen ? 'rgba(192,86,64,0.05)' : 'transparent' }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.08)' }}>
          <Zap size={18} style={{ color: 'var(--burnt-orange)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{tool.label}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
              {statusStyle.label}
            </span>
            {skillDef.tags.map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: SKILL_TAGS[t].bg, color: SKILL_TAGS[t].color }}>
                {SKILL_TAGS[t].label}
              </span>
            ))}
          </div>
          <p className="font-body text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{skillDef.desc}</p>
        </div>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded config drawer */}
      {isOpen && (
        <div className="px-5 pb-6 pt-2" style={{ borderTop: '1px solid rgba(192,86,64,0.15)' }}>
          <div className="flex items-center justify-end mb-5">
            <button onClick={() => { if (window.confirm('Remove this tool?')) onRemove(); }}
              className="p-1.5 rounded-xl transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            ><Trash2 size={15} /></button>
          </div>

          {skillDef.configFields.length === 0 ? (
            <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No configuration required — this tool is ready to use.</p>
          ) : (
            <div className="space-y-4">
              {skillDef.configFields.map((field: ToolConfigField) => {
                const revealed = showSecrets[field.key];
                return (
                  <div key={field.key}>
                    <label className="section-label mb-1.5 block" style={{ fontSize: 10 }}>
                      {field.label}
                      {field.required && <span style={{ color: '#DC2626' }}> *</span>}
                      {field.secret && <span className="ml-2 px-1 py-0.5 rounded text-[8px] font-semibold uppercase" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>secret</span>}
                    </label>
                    <div className="relative">
                      <input
                        className="form-input w-full font-mono text-sm"
                        type={field.secret && !revealed ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={tool.config[field.key] ?? ''}
                        onChange={e => onUpdateConfig(field.key, e.target.value)}
                        style={{ paddingRight: field.secret ? '2.5rem' : undefined }}
                      />
                      {field.secret && (
                        <button type="button" onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >{revealed ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const { workspaces, updateWorkspace } = useStore();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace ?? workspaces[0];
  const tools = activeWs?.tools ?? [];

  const [skillSearch, setSkillSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const addTool = (label: string) => {
    if (!activeWs) return;
    const newId = 'tool-' + Date.now();
    updateWorkspace(activeWs.id, { tools: [...tools, { id: newId, label, config: {} }] });
    setOpenId(newId);
    setSkillSearch('');
  };

  const removeTool = (toolId: string) => {
    if (!activeWs) return;
    updateWorkspace(activeWs.id, { tools: tools.filter(t => t.id !== toolId) });
    if (openId === toolId) setOpenId(null);
  };

  const updateToolConfig = (toolId: string, key: string, value: string) => {
    if (!activeWs) return;
    updateWorkspace(activeWs.id, {
      tools: tools.map(t => t.id === toolId ? { ...t, config: { ...t.config, [key]: value } } : t),
    });
  };

  const toggleTool = (id: string) => setOpenId(prev => prev === id ? null : id);

  const addedLabels = new Set(tools.map(t => t.label));

  // Ranked search results — exclude already-added, score by match quality, cap at 10
  const searchResults = (() => {
    const q = skillSearch.toLowerCase().trim();
    return RECOMMENDED_SKILLS
      .filter(() => true) // all tools always available — multiples allowed
      .map(s => {
        if (q === '') return { skill: s, score: 0 };
        const labelLower = s.label.toLowerCase();
        const descLower  = s.desc.toLowerCase();
        let score = 0;
        if (labelLower === q)                  score = 100;
        else if (labelLower.startsWith(q))     score = 80;
        else if (labelLower.includes(q))       score = 60;
        else if (descLower.includes(q))        score = 30;
        else                                   score = -1; // no match
        return { skill: s, score };
      })
      .filter(r => q === '' || r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(r => r.skill);
  })();

  // Stats computations
  const externalCount = tools.filter(t => RECOMMENDED_SKILLS.find(s => s.label === t.label)?.tags.includes('external')).length;
  const readWriteCount = tools.filter(t => {
    const def = RECOMMENDED_SKILLS.find(s => s.label === t.label);
    return def?.tags.includes('read') || def?.tags.includes('write');
  }).length;
  const readyCount = tools.filter(t => {
    const def = RECOMMENDED_SKILLS.find(s => s.label === t.label);
    if (!def || def.configFields.length === 0) return true;
    return def.configFields.filter(f => f.required).every(f => (t.config[f.key] ?? '').trim() !== '');
  }).length;

  if (!activeWs) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Zone 0: Sticky Header ── */}
      <div
        className="sticky top-0 z-10 px-4 sm:px-6 lg:px-10 py-4 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="w-full flex items-center justify-between gap-4">
          <div>
            <p className="section-label mb-0">setup</p>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Tools</h1>
              <InfoTooltip content="Tools give your agents real-world capabilities — from web search and code execution to calendar access and SQL queries. Each tool can be configured with API keys and settings." />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-10">

        {/* ── Zone 1: Stats Bar ── */}
        {tools.length > 0 && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Active Tools',  value: tools.length,   icon: <Zap size={16} style={{ color: 'var(--burnt-orange)' }} /> },
                { label: 'Ready',         value: readyCount,     icon: <CheckCircle2 size={16} style={{ color: '#2D7D46' }} /> },
                { label: 'External Calls',value: externalCount,  icon: <Globe size={16} style={{ color: '#7C3AED' }} /> },
                { label: 'Read / Write',  value: readWriteCount, icon: <Database size={16} style={{ color: '#2563EB' }} /> },
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

        {/* ── Zone 2: Search ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <p className="section-label mb-0">add tools</p>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            >
              {RECOMMENDED_SKILLS.length} available
            </span>
          </div>

          {/* Search bar — prominent, Google-style */}
          <div className="relative max-w-2xl mb-2">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              className="form-input w-full font-body text-base"
              style={{ paddingLeft: '2.75rem', paddingRight: skillSearch ? '2.5rem' : '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', fontSize: 15 }}
              placeholder="Search tools…"
              value={skillSearch}
              onChange={e => setSkillSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setSkillSearch(''); }}
              autoComplete="off"
              spellCheck={false}
            />
            {skillSearch && (
              <button
                type="button"
                onClick={() => setSkillSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Result count — only shown when query is active */}
          {skillSearch.trim() && (
            <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--text-muted)', paddingLeft: '0.25rem' }}>
              {searchResults.length === 0
                ? 'No results'
                : `About ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Horizontal catalog cards — live results, max 10 */}
          {searchResults.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {searchResults.map(s => (
                <ToolCatalogCard
                  key={s.label}
                  skill={s}
                  query={skillSearch}
                  activeCount={tools.filter(t => t.label === s.label).length}
                  onAdd={() => addTool(s.label)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Zone 3: Active Tools ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <p className="section-label mb-0">active tools</p>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            >
              {tools.length}
            </span>
          </div>

          {tools.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ border: '1.5px dashed var(--border-color)', background: 'var(--bg-surface)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(192,86,64,0.08)' }}
              >
                <Zap size={24} style={{ color: 'var(--burnt-orange)' }} />
              </div>
              <p className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>No tools active yet</p>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Search above to add tools and equip your agents.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map(tool => {
                const skillDef = RECOMMENDED_SKILLS.find(s => s.label === tool.label);
                if (!skillDef) return null;
                return (
                  <ToolRow
                    key={tool.id}
                    tool={tool}
                    skillDef={skillDef}
                    isOpen={openId === tool.id}
                    onToggle={() => toggleTool(tool.id)}
                    onRemove={() => removeTool(tool.id)}
                    onUpdateConfig={(key, value) => updateToolConfig(tool.id, key, value)}
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
