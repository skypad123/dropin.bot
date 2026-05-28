import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Search, Users, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import type { AgentTeam } from '../types';

export default function TeamsPage() {
  const navigate = useNavigate();
  const { instances, teams, addTeam } = useStore();
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCoreAgentId, setNewCoreAgentId] = useState('');

  const workspaceTeams = teams.filter(t => t.workspaceId === activeWorkspaceId);

  const filtered = workspaceTeams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim() || !activeWorkspaceId) return;
    const nt: AgentTeam = {
      id: `at-${Date.now()}`, name: newName.trim(), description: newDesc.trim(),
      status: 'idle', coreAgentId: newCoreAgentId || null, coreAgentRoleContext: '', subagents: [],
      trigger: 'manual', lastRun: '—', runs: 0,
      workspaceId: activeWorkspaceId,
    };
    addTeam(nt);
    setNewName(''); setNewDesc(''); setNewCoreAgentId(''); setShowNewModal(false);
    navigate(`/teams/${nt.id}`);
  };

  const getAgent = (id: string | null) => id ? instances.find(i => i.id === id) : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-4 flex items-center justify-between gap-4"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <p className="section-label mb-0">Teams</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Agent Teams</h1>
            <InfoTooltip content="A team has one core agent that leads the work, supported by any number of subagents. The core agent orchestrates and delegates tasks to its subagents." />
          </div>
        </div>
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient"
          style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}>
          <Plus size={16} /> New Team
        </button>
      </div>

      <div className="px-6 lg:px-10 py-6">
        {/* Search + count */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="form-input pl-9 w-full" placeholder="Search teams…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} team{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>No teams found</p>
            <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your search or create a new team.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(team => {
              const core = getAgent(team.coreAgentId);
              return (
                <div key={team.id}
                  className="rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(192,86,64,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(192,86,64,0.10)' }}>
                        <Users size={18} style={{ color: 'var(--burnt-orange)' }} />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{team.name}</p>
                        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {team.subagents.length + (team.coreAgentId ? 1 : 0)} agent{(team.subagents.length + (team.coreAgentId ? 1 : 0)) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0" style={{
                      background: team.status === 'active' ? 'rgba(45,125,70,0.10)' : team.status === 'error' ? 'rgba(220,38,38,0.10)' : 'var(--bg-elevated)',
                      color: team.status === 'active' ? '#2D7D46' : team.status === 'error' ? '#DC2626' : 'var(--text-muted)',
                    }}>
                      {team.status === 'active' ? '● Active' : team.status === 'error' ? '✕ Error' : '○ Idle'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="font-body text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>{team.description}</p>

                  {/* Core agent */}
                  {core ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(192,86,64,0.12)' }}>
                        <Bot size={12} style={{ color: 'var(--burnt-orange)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{core.name}</p>
                      </div>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}>Core</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)' }}>
                      <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>No core agent assigned</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {team.subagents.length} subagent{team.subagents.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{team.runs} runs</span>
                      <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{team.lastRun}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Team modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(45,42,38,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>New Team</h2>
              <button onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              ><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="section-label mb-1.5 block">Team Name</label>
                <input className="form-input w-full" placeholder="e.g. Content Pipeline"
                  value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
              </div>
              <div>
                <label className="section-label mb-1.5 block">Goal <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea className="form-input w-full resize-none" rows={2}
                  placeholder="What should this team accomplish?"
                  value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div>
                <label className="section-label mb-1.5 block">Core Agent <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <select className="form-select w-full" value={newCoreAgentId} onChange={e => setNewCoreAgentId(e.target.value)}>
                  <option value="">— Assign later —</option>
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
              >Create Team</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
