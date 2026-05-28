import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, Check, ChevronLeft, Clock, ExternalLink, MessageSquare, Play, Plus, Send, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import type { TeamMember } from '../types';

type TeamDetailTab = 'members' | 'chat' | 'settings';
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; agentName?: string; ts: string };

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { instances, teams, updateTeam, removeTeam } = useStore();
  const { activeWorkspaceId } = useWorkspace();

  const team = teams.find(t => t.id === id);

  if (team && team.workspaceId !== activeWorkspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Team not found in this workspace</p>
          <button onClick={() => navigate('/teams')} className="px-4 py-2 rounded-full text-sm font-medium brand-gradient text-white mt-2">← Back to Teams</button>
        </div>
      </div>
    );
  }
  const [tab, setTab] = useState<TeamDetailTab>('members');

  // Settings tab state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Members tab state
  const [showAddSubagentModal, setShowAddSubagentModal] = useState(false);
  const [showChangeCoreModal, setShowChangeCoreModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  // Chat tab state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (team) {
      setEditName(team.name);
      setEditDesc(team.description);
    }
  }, [team?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Team not found</p>
          <button onClick={() => navigate('/teams')} className="px-4 py-2 rounded-full text-sm font-medium brand-gradient text-white mt-2">← Back to Teams</button>
        </div>
      </div>
    );
  }

  const getAgent = (iid: string | null) => iid ? instances.find(i => i.id === iid) : null;
  const coreAgent = getAgent(team.coreAgentId);

  const handleSaveSettings = () => {
    updateTeam({ ...team, name: editName.trim() || team.name, description: editDesc });
  };

  const handleDeleteTeam = () => {
    if (window.confirm(`Delete "${team.name}"? This cannot be undone.`)) {
      removeTeam(team.id);
      navigate('/teams');
    }
  };

  const handleRemoveSubagent = (instanceId: string) => {
    updateTeam({ ...team, subagents: team.subagents.filter(s => s.instanceId !== instanceId) });
  };

  const handleUpdateRoleContext = (instanceId: string, roleContext: string) => {
    updateTeam({ ...team, subagents: team.subagents.map(s => s.instanceId === instanceId ? { ...s, roleContext } : s) });
  };

  const handleUpdateMaxParallel = (instanceId: string, raw: string) => {
    const n = raw === '' ? 1 : Math.min(99, Math.max(0, parseInt(raw, 10) || 0));
    updateTeam({ ...team, subagents: team.subagents.map(s => s.instanceId === instanceId ? { ...s, maxParallel: n } : s) });
  };

  const handleUpdateCoreRoleContext = (roleContext: string) => {
    updateTeam({ ...team, coreAgentRoleContext: roleContext });
  };

  const handleAddSubagents = () => {
    const newSubs: TeamMember[] = selectedToAdd.map(iid => ({ instanceId: iid, roleContext: '' }));
    updateTeam({ ...team, subagents: [...team.subagents, ...newSubs] });
    setSelectedToAdd([]);
    setShowAddSubagentModal(false);
  };

  const agentsNotInTeam = instances.filter(i =>
    i.id !== team.coreAgentId && !team.subagents.find(s => s.instanceId === i.id)
  );

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'user', content: text, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    const coreAgentName = coreAgent?.name ?? team.name;
    setTimeout(() => {
      const replies = [
        `Got it. I'll coordinate with the team on that — starting with the subagents that handle the relevant context.`,
        `Understood. I'm processing your request and will delegate the appropriate subtasks to the subagents.`,
        `On it. I'll break this down and route it through the team pipeline now.`,
        `Sure — I'll handle the orchestration. Expect a response once the subagents have completed their tasks.`,
        `Received. Delegating to the relevant subagents and will consolidate the output for you.`,
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const assistantMsg: ChatMessage = {
        id: `m-${Date.now()}-r`, role: 'assistant', content: reply,
        agentName: coreAgentName,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      setChatLoading(false);
    }, 1200 + Math.random() * 800);
  };

  const TABS: { key: TeamDetailTab; label: string }[] = [
    { key: 'members',  label: 'Members'  },
    { key: 'chat',     label: 'Chat'     },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-4"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/teams')}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            ><ChevronLeft size={18} /></button>
            <div>
              <p className="section-label mb-0">Teams</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{team.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
                  background: team.status === 'active' ? 'rgba(45,125,70,0.10)' : team.status === 'error' ? 'rgba(220,38,38,0.10)' : 'var(--bg-elevated)',
                  color: team.status === 'active' ? '#2D7D46' : team.status === 'error' ? '#DC2626' : 'var(--text-muted)',
                }}>
                  {team.status === 'active' ? '● Active' : team.status === 'error' ? '✕ Error' : '○ Idle'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock size={12} />
              {team.lastRun} · {team.runs} runs
            </div>
            <button
              disabled={team.trigger !== 'manual'}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white brand-gradient disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: team.trigger === 'manual' ? '0 4px 12px rgba(192,86,64,0.25)' : 'none' }}
              title={team.trigger !== 'manual' ? 'Change trigger to Manual to run manually' : 'Run this team now'}
            >
              <Play size={14} /> Run Now
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 text-sm font-medium transition-all duration-150 border-b-2"
              style={{
                color: tab === t.key ? 'var(--burnt-orange)' : 'var(--text-muted)',
                borderBottomColor: tab === t.key ? 'var(--burnt-orange)' : 'transparent',
              }}
              onMouseEnter={e => { if (tab !== t.key) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { if (tab !== t.key) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {tab !== 'chat' && (
      <div className="px-6 lg:px-10 py-8 max-w-3xl">

        {/* ── MEMBERS TAB ── */}
        {tab === 'members' && (
          <div className="space-y-6">
            {/* Core Agent */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="section-label mb-0.5">Core Agent</p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>The lead agent that orchestrates the team.</p>
                </div>
                <button onClick={() => setShowChangeCoreModal(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >Change</button>
              </div>
              {coreAgent ? (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-surface)', border: '2px solid rgba(192,86,64,0.30)' }}>
                  <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(192,86,64,0.12)' }}>
                      <Bot size={20} style={{ color: 'var(--burnt-orange)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{coreAgent.name}</p>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}>Core</span>
                      </div>
                      <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{coreAgent.model} · {coreAgent.status}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full" style={{
                        background: coreAgent.status === 'running' ? '#2D7D46' : coreAgent.status === 'error' ? '#DC2626' : '#64748B'
                      }} />
                      <button onClick={() => navigate(`/agents/${coreAgent.id}`)}
                        className="font-mono text-[10px] underline underline-offset-2 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >View →</button>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <label className="section-label mb-2 block">Role in this team</label>
                    <textarea
                      className="form-input w-full resize-none text-sm"
                      rows={3}
                      placeholder="Describe what this agent does in the team — its responsibilities, what it receives as input, and what it produces…"
                      value={team.coreAgentRoleContext}
                      onChange={e => handleUpdateCoreRoleContext(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest self-center" style={{ color: 'var(--text-muted)' }}>Suggestions:</span>
                      {[
                        { label: '📋 Always plan first', text: 'Before taking any action, always produce a step-by-step plan and confirm it with the user before proceeding.' },
                        { label: '❓ Ask for missing details', text: 'If any information required to complete the task is missing or ambiguous, ask the user clarifying questions before proceeding.' },
                      ].map(({ label, text }) => (
                        <button key={label} type="button"
                          onClick={() => handleUpdateCoreRoleContext(team.coreAgentRoleContext ? team.coreAgentRoleContext.trimEnd() + '\n' + text : text)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-5 flex items-center gap-3"
                  style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-color)' }}>
                  <Bot size={20} style={{ color: 'var(--text-muted)' }} />
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No core agent assigned. Click "Change" to assign one.</p>
                </div>
              )}
            </div>

            {/* Subagents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="section-label mb-0.5">Subagents</p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                    {team.subagents.length} supporting agent{team.subagents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setShowAddSubagentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white brand-gradient"
                  style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.20)' }}>
                  <Plus size={12} /> Add Subagent
                </button>
              </div>

              {team.subagents.length === 0 ? (
                <div className="rounded-2xl p-8 text-center"
                  style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-color)' }}>
                  <Bot size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No subagents yet. Add supporting agents to the team.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {team.subagents.map((sub) => {
                    const agent = getAgent(sub.instanceId);
                    const statusColor = !agent ? '#64748B' : agent.status === 'running' ? '#2D7D46' : agent.status === 'error' ? '#DC2626' : '#64748B';
                    return (
                      <div key={sub.instanceId} className="rounded-2xl overflow-hidden"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(14,165,233,0.10)' }}>
                            <Bot size={16} style={{ color: '#0EA5E9' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {agent?.name ?? `Agent ${sub.instanceId}`}
                            </p>
                            <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {agent?.model ?? '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                            {sub.maxParallel !== undefined && sub.maxParallel !== 1 && (
                              <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] font-semibold flex-shrink-0"
                                style={{ background: 'rgba(217,119,6,0.12)', color: '#B45309', border: '1px solid rgba(217,119,6,0.25)' }}>
                                {sub.maxParallel === 0 ? '⚡ ∞' : `⚡ ×${sub.maxParallel}`}
                              </span>
                            )}
                            <button onClick={() => agent && navigate(`/agents/${agent.id}`)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              title="View agent config"
                            ><ExternalLink size={13} /></button>
                            <button onClick={() => handleRemoveSubagent(sub.instanceId)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              title="Remove subagent"
                            ><X size={13} /></button>
                          </div>
                        </div>
                        <div className="px-5 py-4">
                          <label className="section-label mb-2 block">Role in this team</label>
                          <textarea
                            className="form-input w-full resize-none text-sm"
                            rows={2}
                            placeholder="Describe what this subagent does — what tasks it handles, what inputs it expects, and what it returns…"
                            value={sub.roleContext}
                            onChange={e => handleUpdateRoleContext(sub.instanceId, e.target.value)}
                          />
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest self-center" style={{ color: 'var(--text-muted)' }}>Suggestions:</span>
                            <button type="button"
                              onClick={() => handleUpdateRoleContext(sub.instanceId, sub.roleContext ? sub.roleContext.trimEnd() + '\n' + 'If any information required to complete the task is missing or ambiguous, ask the user clarifying questions before proceeding.' : 'If any information required to complete the task is missing or ambiguous, ask the user clarifying questions before proceeding.')}
                              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >❓ Ask for missing details</button>
                          </div>
                        </div>

                        {/* Parallel execution control */}
                        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-base leading-none mt-0.5">⚡</span>
                              <div>
                                <p className="font-body font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Parallel instances</p>
                                <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {(sub.maxParallel ?? 1) === 1
                                    ? 'Single instance only — runs one at a time.'
                                    : (sub.maxParallel ?? 1) === 0
                                    ? 'Unlimited — clone and run as many as needed.'
                                    : `At most ${sub.maxParallel} clones will run at the same time.`}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={99}
                                className="form-input text-center font-mono text-sm"
                                style={{ width: '64px' }}
                                value={sub.maxParallel ?? 1}
                                onChange={e => handleUpdateMaxParallel(sub.instanceId, e.target.value)}
                              />
                              <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>0 = unlimited</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="max-w-xl space-y-6">
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <p className="section-label">General</p>
              <div>
                <label className="section-label mb-1.5 block">Team Name</label>
                <input className="form-input w-full" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="section-label mb-1.5 block">Goal / Description</label>
                <textarea className="form-input w-full resize-none" rows={3}
                  value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              </div>
              <button onClick={handleSaveSettings}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white brand-gradient"
                style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}>
                Save Changes
              </button>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <p className="section-label mb-1" style={{ color: '#DC2626' }}>Danger Zone</p>
              <p className="font-body text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Permanently delete this team and all its configuration. This cannot be undone.
              </p>
              <button onClick={handleDeleteTeam}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,0.25)' }}>
                <Trash2 size={14} /> Delete Team
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center brand-gradient">
                  <MessageSquare size={26} className="text-white" />
                </div>
                <p className="font-display font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>Start a conversation with {coreAgent?.name ?? team.name}</p>
                <p className="font-body text-sm text-center max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  The core agent will orchestrate the team to respond to your messages.
                </p>
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' ? (
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center brand-gradient">
                    <span className="text-white font-display font-bold text-xs">
                      {(coreAgent?.name ?? team.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                    <span className="font-display font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>Y</span>
                  </div>
                )}
                <div className={`max-w-[70%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'assistant' && (
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{msg.agentName}</span>
                  )}
                  <div className="rounded-2xl px-4 py-2.5"
                    style={msg.role === 'user'
                      ? { background: 'var(--burnt-orange)', color: '#fff' }
                      : { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }
                    }>
                    <p className="font-body text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{msg.ts}</span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center brand-gradient">
                  <span className="text-white font-display font-bold text-xs">
                    {(coreAgent?.name ?? team.name).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--text-muted)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-6 lg:px-10 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <textarea
                ref={chatInputRef}
                rows={1}
                className="form-input flex-1 resize-none"
                style={{ minHeight: '42px', maxHeight: '140px', lineHeight: '1.5' }}
                placeholder={`Message ${coreAgent?.name ?? team.name}…`}
                value={chatInput}
                onChange={e => {
                  setChatInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
                }}
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center brand-gradient text-white transition-opacity"
                style={{ opacity: (!chatInput.trim() || chatLoading) ? 0.45 : 1, boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}
              >
                <Send size={16} />
              </button>
            </div>
            <p className="font-body text-[11px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
              Press <kbd className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>Enter</kbd> to send · <kbd className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      )}

      {/* Add Subagent Modal */}
      {showAddSubagentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(45,42,38,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddSubagentModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Add Subagents</h2>
              <button onClick={() => setShowAddSubagentModal(false)}
                className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              ><X size={18} /></button>
            </div>
            {agentsNotInTeam.length === 0 ? (
              <p className="font-body text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>All agents are already in this team.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {agentsNotInTeam.map(agent => {
                  const checked = selectedToAdd.includes(agent.id);
                  return (
                    <button key={agent.id}
                      onClick={() => setSelectedToAdd(prev => checked ? prev.filter(x => x !== agent.id) : [...prev, agent.id])}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        background: checked ? 'rgba(192,86,64,0.08)' : 'var(--bg-elevated)',
                        border: `1.5px solid ${checked ? 'var(--burnt-orange)' : 'var(--border-color)'}`,
                      }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(192,86,64,0.10)' }}>
                        <Bot size={14} style={{ color: 'var(--burnt-orange)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{agent.model}</p>
                      </div>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: checked ? 'var(--burnt-orange)' : 'var(--bg-surface)', border: `1.5px solid ${checked ? 'var(--burnt-orange)' : 'var(--border-color)'}` }}>
                        {checked && <Check size={11} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setShowAddSubagentModal(false)}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--burnt-orange)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >Cancel</button>
              <button onClick={handleAddSubagents} disabled={selectedToAdd.length === 0}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white brand-gradient disabled:opacity-40 disabled:cursor-not-allowed"
              >Add {selectedToAdd.length > 0 ? `(${selectedToAdd.length})` : ''}</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Core Agent Modal */}
      {showChangeCoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(45,42,38,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowChangeCoreModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Change Core Agent</h2>
              <button onClick={() => setShowChangeCoreModal(false)}
                className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              ><X size={18} /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {instances.map(agent => {
                const isCurrent = agent.id === team.coreAgentId;
                return (
                  <button key={agent.id}
                    onClick={() => { updateTeam({ ...team, coreAgentId: agent.id }); setShowChangeCoreModal(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: isCurrent ? 'rgba(192,86,64,0.08)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${isCurrent ? 'var(--burnt-orange)' : 'var(--border-color)'}`,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(192,86,64,0.10)' }}>
                      <Bot size={14} style={{ color: 'var(--burnt-orange)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{agent.model}</p>
                    </div>
                    {isCurrent && <Check size={14} style={{ color: 'var(--burnt-orange)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
