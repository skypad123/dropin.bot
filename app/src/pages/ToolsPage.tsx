import { useState } from 'react';
import { Zap, Search, X, PlusCircle } from 'lucide-react';
import { RECOMMENDED_SKILLS } from '../data';
import { SKILL_TAGS } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ToolConfigField } from '../types';

export default function ToolsPage() {
  const { activeWorkspace } = useWorkspace();
  const [toolSearch, setToolSearch] = useState('');
  const [toolSearchOpen, setToolSearchOpen] = useState(false);
  const [workspaceTools, setWorkspaceTools] = useState<{ label: string; config: Record<string, string>; expanded: boolean }[]>([]);

  const addTool = (label: string) => {
    if (workspaceTools.find(t => t.label === label)) return;
    setWorkspaceTools(prev => [...prev, { label, config: {}, expanded: true }]);
    setToolSearch(''); setToolSearchOpen(false);
  };

  const removeTool = (label: string) =>
    setWorkspaceTools(prev => prev.filter(t => t.label !== label));

  const toggleToolExpanded = (label: string) =>
    setWorkspaceTools(prev => prev.map(t => t.label === label ? { ...t, expanded: !t.expanded } : t));

  const updateToolConfig = (label: string, key: string, value: string) =>
    setWorkspaceTools(prev => prev.map(t => t.label === label ? { ...t, config: { ...t.config, [key]: value } } : t));

  const getToolStatus = (tool: { label: string; config: Record<string, string> }): 'unconfigured' | 'configuring' | 'ready' => {
    const def = RECOMMENDED_SKILLS.find(s => s.label === tool.label);
    if (!def || def.configFields.length === 0) return 'ready';
    const required = def.configFields.filter((f: ToolConfigField) => f.required);
    const allFilled = required.every((f: ToolConfigField) => (tool.config[f.key] ?? '').trim() !== '');
    const anyFilled = def.configFields.some((f: ToolConfigField) => (tool.config[f.key] ?? '').trim() !== '');
    if (allFilled) return 'ready';
    if (anyFilled) return 'configuring';
    return 'unconfigured';
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 h-16 flex items-center" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.10)' }}>
            <Zap size={18} style={{ color: 'var(--burnt-orange)' }} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>Tools</h1>
            <p className="font-body text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>Configure agent tools and skills</p>
            {activeWorkspace && (
              <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--burnt-orange)' }}>{activeWorkspace.name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-3xl">
        {/* Search bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              className="form-input pl-8 w-full"
              placeholder="Search tools to add…"
              value={toolSearch}
              onChange={e => { setToolSearch(e.target.value); setToolSearchOpen(true); }}
              onFocus={() => setToolSearchOpen(true)}
              onKeyDown={e => { if (e.key === 'Escape') setToolSearchOpen(false); }}
            />
          </div>
          {toolSearchOpen && (() => {
            const q = toolSearch.toLowerCase();
            const results = RECOMMENDED_SKILLS.filter(s =>
              !workspaceTools.find(t => t.label === s.label) &&
              (q === '' || s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
            );
            if (results.length === 0) return null;
            return (
              <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                {q === '' && <div className="px-3 pt-2.5 pb-1"><span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--burnt-orange)' }}>★ Recommended</span></div>}
                {results.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); addTool(s.label); }}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-150"
                    style={{ borderTop: (i > 0 || q === '') ? '1px solid var(--border-color)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                        {s.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: SKILL_TAGS[t].bg, color: SKILL_TAGS[t].color }}>{SKILL_TAGS[t].label}</span>
                        ))}
                      </div>
                      <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                    </div>
                    <PlusCircle size={15} style={{ color: 'var(--burnt-orange)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Added tools */}
        {workspaceTools.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1.5px dashed var(--border-color)' }}>
            <Zap size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No tools added yet</p>
            <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Search above to add tools.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaceTools.map(tool => {
              const def = RECOMMENDED_SKILLS.find(s => s.label === tool.label);
              if (!def) return null;
              const status = getToolStatus(tool);
              const statusStyle = {
                ready:        { dot: '#2D7D46', label: 'Ready',          border: 'rgba(45,125,70,0.25)',   bg: 'rgba(45,125,70,0.05)'   },
                configuring:  { dot: '#C05640', label: 'Configuring',    border: 'rgba(192,86,64,0.25)',  bg: 'rgba(192,86,64,0.05)'  },
                unconfigured: { dot: '#DC2626', label: 'Not configured', border: 'rgba(220,38,38,0.25)', bg: 'rgba(220,38,38,0.04)' },
              }[status];
              return (
                <div key={tool.label} className="rounded-2xl overflow-hidden transition-all duration-200" style={{ border: `1px solid ${statusStyle.border}`, background: statusStyle.bg }}>
                  <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => toggleToolExpanded(tool.label)}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusStyle.dot, boxShadow: `0 0 6px ${statusStyle.dot}80` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{tool.label}</p>
                        {def.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: SKILL_TAGS[t].bg, color: SKILL_TAGS[t].color }}>{SKILL_TAGS[t].label}</span>
                        ))}
                        <span className="font-mono text-[10px]" style={{ color: statusStyle.dot }}>{statusStyle.label}</span>
                      </div>
                      <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{def.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); removeTool(tool.label); }}
                        className="p-1.5 rounded-lg transition-colors duration-150"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Remove tool"
                      ><X size={14} /></button>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-muted)', transform: tool.expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {tool.expanded && def.configFields.length > 0 && (
                    <div className="px-5 pb-5 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                      {def.configFields.map((field: ToolConfigField) => (
                        <div key={field.key}>
                          <label className="font-mono text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                            {field.label}
                            {field.required && <span style={{ color: '#DC2626' }}>*</span>}
                            {field.secret && <span className="px-1 py-0.5 rounded text-[8px] font-semibold uppercase" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>secret</span>}
                          </label>
                          <input
                            className="form-input w-full"
                            type={field.secret ? 'password' : 'text'}
                            placeholder={field.placeholder}
                            value={tool.config[field.key] ?? ''}
                            onChange={e => updateToolConfig(tool.label, field.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {tool.expanded && def.configFields.length === 0 && (
                    <div className="px-5 pb-4 pt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>No configuration required — this tool is ready to use.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
