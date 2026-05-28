import { useState } from 'react';
import { Plug, Search, X, PlusCircle, Layers } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { PRESET_MCPS } from '../data';

export default function AppsPage() {
  const { workspaces, updateWorkspace } = useStore();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace ?? workspaces[0];

  const [mcpSearch, setMcpSearch] = useState('');
  const [mcpSearchOpen, setMcpSearchOpen] = useState(false);
  const [wsMcpExpanded, setWsMcpExpanded] = useState<string[]>([]);

  const addWsMcp = (name: string) => {
    const preset = PRESET_MCPS.find(p => p.name === name);
    if (!preset || !activeWs) return;
    if (activeWs.mcps.find(m => m.name === name)) return;
    updateWorkspace(activeWs.id, { mcps: [...activeWs.mcps, { id: 'mcp-' + Date.now(), name, url: '', apiKey: '' }] });
    setWsMcpExpanded(prev => [...prev, name]);
    setMcpSearch(''); setMcpSearchOpen(false);
  };

  const removeWsMcp = (name: string) => {
    if (!activeWs) return;
    updateWorkspace(activeWs.id, { mcps: activeWs.mcps.filter(m => m.name !== name) });
    setWsMcpExpanded(prev => prev.filter(n => n !== name));
  };

  const toggleWsMcpExpanded = (name: string) =>
    setWsMcpExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const updateWsMcpField = (name: string, field: 'url' | 'apiKey', value: string) => {
    if (!activeWs) return;
    updateWorkspace(activeWs.id, { mcps: activeWs.mcps.map(m => m.name === name ? { ...m, [field]: value } : m) });
  };

  const getWsMcpStatus = (mcp: { url: string; apiKey: string; name: string }): 'ready' | 'configuring' | 'unconfigured' => {
    const preset = PRESET_MCPS.find(p => p.name === mcp.name);
    const hasUrl = mcp.url.trim() !== '';
    const hasKey = mcp.apiKey.trim() !== '';
    if (!hasUrl && !hasKey) return 'unconfigured';
    if (hasUrl && (!preset?.requiresKey || hasKey)) return 'ready';
    return 'configuring';
  };

  if (!activeWs) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 h-16 flex items-center justify-between" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.10)' }}>
            <Plug size={18} style={{ color: 'var(--burnt-orange)' }} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>Apps</h1>
            <p className="font-body text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>Connect MCP servers to your workspaces</p>
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
              placeholder="Search MCP servers to add…"
              value={mcpSearch}
              onChange={e => { setMcpSearch(e.target.value); setMcpSearchOpen(true); }}
              onFocus={() => setMcpSearchOpen(true)}
              onKeyDown={e => { if (e.key === 'Escape') setMcpSearchOpen(false); }}
            />
          </div>
          {mcpSearchOpen && (() => {
            const q = mcpSearch.toLowerCase();
            const results = PRESET_MCPS.filter(p =>
              !activeWs.mcps.find(m => m.name === p.name) &&
              (q === '' || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
            );
            if (results.length === 0) return null;
            return (
              <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                {q === '' && <div className="px-3 pt-2.5 pb-1"><span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--burnt-orange)' }}>★ Available Servers</span></div>}
                {results.map((p, i) => (
                  <button
                    key={p.name}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); addWsMcp(p.name); }}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-150"
                    style={{ borderTop: (i > 0 || q === '') ? '1px solid var(--border-color)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                        {p.requiresKey && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>API Key</span>}
                      </div>
                      <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
                    </div>
                    <PlusCircle size={15} style={{ color: 'var(--burnt-orange)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Added MCPs */}
        {activeWs.mcps.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1.5px dashed var(--border-color)' }}>
            <Plug size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No MCP servers connected</p>
            <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Search above to connect an MCP server to this workspace.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeWs.mcps.map(mcp => {
              const preset = PRESET_MCPS.find(p => p.name === mcp.name);
              const status = getWsMcpStatus(mcp);
              const expanded = wsMcpExpanded.includes(mcp.name);
              const statusStyle = {
                ready:        { dot: '#2D7D46', label: 'Ready',          border: 'rgba(45,125,70,0.25)',  bg: 'rgba(45,125,70,0.04)'  },
                configuring:  { dot: '#C05640', label: 'Configuring',    border: 'rgba(192,86,64,0.25)', bg: 'rgba(192,86,64,0.04)' },
                unconfigured: { dot: '#DC2626', label: 'Not configured', border: 'rgba(220,38,38,0.25)', bg: 'rgba(220,38,38,0.03)' },
              }[status];
              return (
                <div key={mcp.name} className="rounded-2xl overflow-hidden transition-all duration-200" style={{ border: `1px solid ${statusStyle.border}`, background: statusStyle.bg }}>
                  <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => toggleWsMcpExpanded(mcp.name)}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusStyle.dot, boxShadow: `0 0 6px ${statusStyle.dot}80` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{mcp.name}</p>
                        {preset?.requiresKey && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>API Key</span>}
                        <span className="font-mono text-[10px]" style={{ color: statusStyle.dot }}>{statusStyle.label}</span>
                      </div>
                      <p className="font-body text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{mcp.url || preset?.urlPlaceholder || 'No URL set'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); removeWsMcp(mcp.name); }}
                        className="p-1.5 rounded-lg transition-colors duration-150"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Remove MCP"
                      ><X size={14} /></button>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {expanded && (
                    <div className="px-5 pb-5 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-wide flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                          Server URL <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          className="form-input w-full"
                          placeholder={preset?.urlPlaceholder ?? 'https://your-mcp-server.com'}
                          value={mcp.url}
                          onChange={e => updateWsMcpField(mcp.name, 'url', e.target.value)}
                        />
                      </div>
                      {preset?.requiresKey && (
                        <div>
                          <label className="font-mono text-[10px] uppercase tracking-wide flex items-center gap-2 mb-1.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                            API Key <span style={{ color: '#DC2626' }}>*</span>
                            <span className="px-1 py-0.5 rounded text-[8px] font-semibold uppercase" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>secret</span>
                          </label>
                          <input
                            className="form-input w-full"
                            type="password"
                            placeholder="sk-••••••••••••••••"
                            value={mcp.apiKey}
                            onChange={e => updateWsMcpField(mcp.name, 'apiKey', e.target.value)}
                          />
                        </div>
                      )}
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
