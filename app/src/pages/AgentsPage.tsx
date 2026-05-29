import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Search, Layers } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip, StatusBadge, IntegrationIcon } from '../components/shared';

export default function AgentsPage() {
  const navigate = useNavigate();
  const { instances, workspaces } = useStore();
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'error'>('all');

  const workspaceInstances = instances.filter(i => i.workspaceId === activeWorkspaceId);

  const filtered = workspaceInstances.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-4 flex items-center justify-between gap-4" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <p className="section-label mb-0">Agents</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Your Agents</h1>
            <InfoTooltip content="An agent is an AI worker configured with a model, memory, personality, and skills. It runs inside a workspace and can query any knowledge base it has permission to access." />
          </div>
        </div>
        <button
          onClick={() => navigate('/agents/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient"
        >
          <Plus size={16} /> New Agent
        </button>
      </div>

      <div className="px-6 lg:px-10 py-6">
        {/* Search + filter bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="form-input pl-9 w-full"
              placeholder="Search agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'running', 'stopped', 'error'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-2 rounded-full text-xs font-medium capitalize transition-all duration-200"
                style={{
                  background: statusFilter === s ? 'rgba(192,86,64,0.10)' : 'transparent',
                  color: statusFilter === s ? 'var(--burnt-orange)' : 'var(--text-secondary)',
                  border: statusFilter === s ? '1.5px solid var(--burnt-orange)' : '1.5px solid var(--border-color)',
                }}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Agent grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Bot size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>No agents found</p>
            <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(inst => {
              const ws = inst.workspaceId ? workspaces.find(w => w.id === inst.workspaceId) : null;
              return (
                <div
                  key={inst.id}
                  className="rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                  onClick={() => navigate(`/agents/${inst.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(192,86,64,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.10)' }}>
                        <Bot size={18} style={{ color: 'var(--burnt-orange)' }} />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{inst.name}</p>
                        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{inst.model}</p>
                      </div>
                    </div>
                    <StatusBadge status={inst.status} />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Uptime',   value: inst.uptime },
                      { label: 'Sessions', value: inst.conversations },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
                        <p className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{label}</p>
                        <p className="font-display font-bold text-lg mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {inst.integrations.slice(0, 3).map(n => <IntegrationIcon key={n} name={n} />)}
                    </div>
                    {ws && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(192,86,64,0.08)', color: 'var(--burnt-orange)', border: '1px solid rgba(192,86,64,0.15)' }}>
                        <Layers size={11} /> {ws.name}
                      </span>
                    )}
                  </div>

                  {/* Skills */}
                  {inst.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                      {inst.skills.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{s}</span>
                      ))}
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
