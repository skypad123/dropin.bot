import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Link2, Brain, Database, CloudUpload, AlertTriangle, Trash2,
  Check, X, Search, Zap, PlusCircle, Wifi
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { MODELS, RECOMMENDED_SKILLS } from '../data';
import { SKILL_TAGS } from '../types';

export default function AgentConfigPage({ mode }: { mode: 'new' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addInstance, updateInstance, deleteInstance, getInstance } = useStore();
  const { activeWorkspaceId } = useWorkspace();
  const existing = mode === 'edit' && id ? getInstance(id) : undefined;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    model: existing?.model ?? 'GPT-4',
    apiKey: '',
    region: existing?.region ?? 'us-east',
    environment: existing?.environment ?? 'production',
    temperature: existing?.temperature ?? 0.7,
    systemPrompt: existing?.systemPrompt ?? '',
    workspaceId: existing?.workspaceId ?? activeWorkspaceId ?? '',
    memories: existing?.memories ?? { organiser: 'file' as const },
    plugins: existing?.plugins ?? { webSearch: false, codeInterpreter: false, imageGeneration: false, calculator: false },
    skills: existing?.skills ?? [] as string[],
    webChat: existing?.integrations.includes('Web') ?? true,
    slack: existing?.integrations.includes('Slack') ?? false,
    discord: existing?.integrations.includes('Discord') ?? false,
    whatsApp: existing?.integrations.includes('WhatsApp') ?? false,
  });
  const [skillInput, setSkillInput] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const update = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) update('skills', [...form.skills, s]);
    setSkillInput('');
  };
  const removeSkill = (s: string) => update('skills', form.skills.filter((sk: string) => sk !== s));

  const handleSubmit = () => {
    const integrations = [form.webChat && 'Web', form.slack && 'Slack', form.discord && 'Discord', form.whatsApp && 'WhatsApp'].filter(Boolean) as string[];
    if (mode === 'new') {
      addInstance({
        name: form.name,
        model: form.model,
        status: 'running',
        integrations,
        temperature: form.temperature,
        systemPrompt: form.systemPrompt,
        region: form.region,
        environment: form.environment,
        workspaceId: form.workspaceId,
        memories: form.memories,
        plugins: form.plugins,
        skills: form.skills,
      });
    } else if (existing) {
      updateInstance(existing.id, {
        name: form.name,
        model: form.model,
        temperature: form.temperature,
        systemPrompt: form.systemPrompt,
        region: form.region,
        environment: form.environment,
        integrations,
        workspaceId: form.workspaceId,
        memories: form.memories,
        plugins: form.plugins,
        skills: form.skills,
      });
    }
    navigate('/agents');
  };

  const handleDelete = () => {
    if (existing && confirm('Delete this agent permanently?')) {
      deleteInstance(existing.id);
      navigate('/agents');
    }
  };

  const sectionClass = "rounded-2xl p-6 lg:p-8 mb-6";
  const sectionStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)' };
  const labelClass = "font-body font-medium text-sm mb-2 block";
  const labelStyle = { color: 'var(--text-primary)' };
  const helperClass = "font-body text-xs mt-1.5 block";
  const helperStyle = { color: 'var(--text-muted)' };

  const canSubmit = form.name.trim().length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-6 lg:px-10 h-16 flex items-center justify-between" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/agents')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="section-label mb-0">{mode === 'new' ? 'New Agent' : 'Edit Agent'}</p>
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              {mode === 'new' ? 'Configure your agent' : existing?.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/agents')}
            className="hidden sm:block px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 brand-gradient"
            style={{
              opacity: canSubmit ? 1 : 0.4,
              transform: canSubmit ? undefined : 'none',
              boxShadow: canSubmit ? '0 4px 12px rgba(192, 86, 64, 0.25)' : 'none',
            }}
          >
            {mode === 'new' ? 'Deploy' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 max-w-[1200px]">
          {/* LEFT: Form */}
          <div>
            {/* Connection */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Link2 size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Connection</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>How dropin.bot connects to your OpenClaw infrastructure.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass} style={labelStyle}>Instance Name <span style={{ color: 'var(--burnt-orange)' }}>*</span></label>
                  <input className="form-input" placeholder="e.g. My Assistant" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>

                <div>
                  <label className={labelClass} style={labelStyle}>OpenClaw API Key <span style={{ color: 'var(--burnt-orange)' }}>*</span></label>
                  <input className="form-input" type="password" placeholder="sk-oc-..." value={form.apiKey} onChange={e => update('apiKey', e.target.value)} />
                  <span className={helperClass} style={helperStyle}>Your API key is encrypted and never stored in plain text.</span>
                </div>

              </div>
            </div>

            {/* Model */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Brain size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Model</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Choose the brain and behavior settings for your assistant.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass} style={labelStyle}>AI Model</label>
                    <a
                      href="https://artificialanalysis.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium transition-opacity duration-200"
                      style={{ color: 'var(--burnt-orange)' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <Wifi size={12} /> LLM Leaderboard ↗
                    </a>
                  </div>

                  {/* Custom dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setModelDropdownOpen(o => !o)}
                      className="form-input w-full flex items-center justify-between gap-2 text-left"
                      style={{ paddingRight: '0.75rem' }}
                    >
                      <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {MODELS.find(m => m.id === form.model)?.label ?? form.model}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0, transform: modelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {modelDropdownOpen && (
                      <div
                        className="absolute z-30 left-0 right-0 mt-1 rounded-xl overflow-hidden"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
                      >
                        {MODELS.map((m, i) => {
                          const selected = form.model === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { update('model', m.id); setModelDropdownOpen(false); }}
                              className="w-full text-left px-4 py-3 transition-colors duration-150"
                              style={{
                                background: selected ? 'rgba(192,86,64,0.08)' : 'transparent',
                                borderTop: i > 0 ? '1px solid var(--border-color)' : 'none',
                              }}
                              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                            >
                               <div className="flex items-center justify-between gap-3">
                                 <span className="font-display font-semibold text-sm" style={{ color: selected ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{m.label}</span>
                                 <div className="flex items-center gap-2 flex-shrink-0">
                                   <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(14,165,233,0.10)', color: '#0EA5E9' }}>{m.contextLabel}</span>
                                   <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>Updated {m.updatedAt}</span>
                                 </div>
                               </div>
                              <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected model info card */}
                  {(() => {
                    const m = MODELS.find(m => m.id === form.model);
                    if (!m) return null;
                    const statConfig = [
                      { key: 'intelligence' as const, label: 'Intelligence', color: '#7C3AED' },
                      { key: 'cost'         as const, label: 'Affordability', color: '#2D7D46' },
                      { key: 'speed'        as const, label: 'Speed',         color: '#C05640' },
                      { key: 'context'      as const, label: 'Context',       color: '#0EA5E9', suffix: m.contextLabel },
                    ];
                    return (
                      <div className="mt-2 rounded-xl p-4" style={{ background: 'rgba(192,86,64,0.05)', border: '1px solid rgba(192,86,64,0.15)' }}>
                        {/* Description + updated */}
                        <div className="flex items-start gap-2 mb-4">
                          <Brain size={13} style={{ color: 'var(--burnt-orange)', marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                            <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Last updated: {m.updatedAt}</p>
                          </div>
                        </div>
                        {/* RPG stat bars */}
                         <div className="space-y-2.5">
                           {statConfig.map(({ key, label, color, suffix }) => {
                             const val = m.stats[key];
                             const segments = Array.from({ length: 10 });
                             return (
                               <div key={key} className="flex items-center gap-3">
                                 <span className="font-mono text-[10px] uppercase w-20 flex-shrink-0" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{label}</span>
                                 <div className="flex items-center gap-0.5 flex-1">
                                   {segments.map((_, i) => (
                                     <div
                                       key={i}
                                       className="flex-1 h-2.5 rounded-sm transition-all duration-500"
                                       style={{
                                         background: i < val ? color : 'var(--bg-elevated)',
                                         opacity: i < val ? (0.4 + (i / 10) * 0.6) : 1,
                                         border: `1px solid ${i < val ? color : 'var(--border-color)'}`,
                                         boxShadow: i < val && i === val - 1 ? `0 0 6px ${color}80` : 'none',
                                       }}
                                     />
                                   ))}
                                 </div>
                                 {suffix
                                   ? <span className="font-mono text-[10px] w-8 text-right flex-shrink-0" style={{ color }}>{suffix}</span>
                                   : <span className="font-mono text-[10px] w-8 text-right flex-shrink-0" style={{ color }}>{val}<span style={{ color: 'var(--text-muted)' }}>/10</span></span>
                                 }
                               </div>
                             );
                           })}
                         </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass} style={{ ...labelStyle, marginBottom: 0 }}>Temperature</label>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(192, 86, 64, 0.10)', color: 'var(--burnt-orange)' }}>{form.temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min="0" max="2" step="0.1"
                    value={form.temperature}
                    onChange={e => update('temperature', parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, var(--burnt-orange) ${(form.temperature / 2) * 100}%, var(--border-color) ${(form.temperature / 2) * 100}%)` }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>Focused</span>
                    <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>Creative</span>
                  </div>
                </div>

                <div>
                  <label className={labelClass} style={labelStyle}>System Prompt</label>
                  <textarea className="form-input form-textarea" rows={4} placeholder="Enter the system prompt that defines your assistant's core behavior..." value={form.systemPrompt} onChange={e => update('systemPrompt', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Knowledge Base */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Database size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Knowledge Base</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Connect data sources your assistant can reference.</p>
                </div>
              </div>

              <div
                className="rounded-2xl p-8 text-center"
                style={{ border: '1.5px dashed var(--border-color)', background: 'var(--bg-elevated)' }}
              >
                <CloudUpload size={36} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" />
                <p className="font-body text-sm font-medium" style={{ color: 'var(--text-muted)' }}>File upload coming soon</p>
                <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, Markdown, TXT up to 10MB each</p>
              </div>
            </div>

            {/* Agent Memory */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Brain size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Agent Memory</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Control how your agent remembers conversations and context.</p>
                </div>
              </div>

              <div className="space-y-3">
                {([
                  {
                    value: 'file',
                    label: 'Text File Memory',
                    badge: 'Default',
                    badgeColor: '#2D7D46',
                    badgeBg: 'rgba(45,125,70,0.10)',
                    desc: 'Stores conversation history as structured text files. Lightweight, fully local, and cost-efficient — ideal for most use cases.',
                    icon: '📄',
                  },
                  {
                    value: 'mem0',
                    label: 'mem0',
                    badge: 'External',
                    badgeColor: 'var(--burnt-orange)',
                    badgeBg: 'rgba(192,86,64,0.10)',
                    desc: 'Managed semantic + episodic memory via mem0.ai. Understands context deeply and recalls relevant facts across sessions.',
                    icon: '🧠',
                  },
                  {
                    value: 'zep',
                    label: 'Zep',
                    badge: 'Long Tasks',
                    badgeColor: '#7C3AED',
                    badgeBg: 'rgba(124,58,237,0.10)',
                    desc: 'Structured long-term memory store via Zep. Best suited for agents handling extended, multi-step tasks requiring persistent user facts.',
                    icon: '⚡',
                  },
                ] as { value: 'file'|'mem0'|'zep'; label: string; badge: string; badgeColor: string; badgeBg: string; desc: string; icon: string }[]).map(opt => {
                  const selected = form.memories.organiser === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update('memories', { organiser: opt.value })}
                      className="w-full text-left rounded-xl p-4 transition-all duration-200"
                      style={{
                        border: selected ? '1.5px solid var(--burnt-orange)' : '1.5px solid var(--border-color)',
                        background: selected ? 'rgba(192,86,64,0.05)' : 'var(--bg-elevated)',
                      }}
                      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'rgba(192,86,64,0.40)'; e.currentTarget.style.background = 'rgba(192,86,64,0.03)'; } }}
                      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-elevated)'; } }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Radio dot */}
                        <div className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200" style={{ border: selected ? '2px solid var(--burnt-orange)' : '2px solid var(--border-color)' }}>
                          {selected && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--burnt-orange)' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{opt.icon}</span>
                            <span className="font-display font-semibold text-sm" style={{ color: selected ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{opt.label}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: opt.badgeBg, color: opt.badgeColor }}>{opt.badge}</span>
                          </div>
                          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Zap size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Skills</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Tag capabilities this agent has.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {(form.skills as string[]).map((s: string) => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(192,86,64,0.08)', color: 'var(--burnt-orange)', border: '1px solid rgba(192,86,64,0.20)' }}>
                    {s}
                    <button onClick={() => removeSkill(s)} className="ml-0.5 hover:opacity-70"><X size={10} /></button>
                  </span>
                ))}
              </div>

              {/* Skill search + dropdown */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    <input
                      className="form-input pl-8 w-full"
                      placeholder="Search or add a skill…"
                      value={skillInput}
                      onChange={e => { setSkillInput(e.target.value); setSkillDropdownOpen(true); }}
                      onFocus={() => setSkillDropdownOpen(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addSkill(); setSkillDropdownOpen(false); }
                        if (e.key === 'Escape') setSkillDropdownOpen(false);
                      }}
                    />
                  </div>
                  <button
                    onClick={() => { addSkill(); setSkillDropdownOpen(false); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white brand-gradient flex-shrink-0"
                  >Add</button>
                </div>

                {skillDropdownOpen && (() => {
                  const query = skillInput.toLowerCase();
                  const suggestions = RECOMMENDED_SKILLS.filter(
                    s => !( form.skills as string[]).includes(s.label) &&
                         (query === '' || s.label.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query))
                  );
                  if (suggestions.length === 0) return null;
                  return (
                    <div
                      className="absolute z-30 left-0 right-0 mt-1 rounded-xl overflow-hidden"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
                    >
                      <div className="px-3 pt-2.5 pb-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--burnt-orange)' }}>★ Recommended</span>
                      </div>
                      {suggestions.map((s, i) => (
                        <button
                          key={s.label}
                          type="button"
                          onMouseDown={e => { e.preventDefault(); update('skills', [...(form.skills as string[]), s.label]); setSkillInput(''); setSkillDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150"
                          style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                            <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                            {s.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {s.tags.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: SKILL_TAGS[t].bg, color: SKILL_TAGS[t].color }}>
                                    {SKILL_TAGS[t].label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <PlusCircle size={14} style={{ color: 'var(--burnt-orange)', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Danger Zone (edit only) */}
            {mode === 'edit' && existing && (
              <div className="rounded-2xl p-6 lg:p-8" style={{ background: 'rgba(220, 38, 38, 0.02)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle size={20} style={{ color: '#DC2626' }} />
                  <h3 className="font-display font-semibold text-base" style={{ color: '#DC2626' }}>Danger Zone</h3>
                </div>
                <p className="font-body text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Deleting this instance is permanent and cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{ border: '1.5px solid #DC2626', color: '#DC2626' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 size={16} />
                  Delete Instance
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Summary sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <h3 className="font-display font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>Summary</h3>

              <div className="space-y-4">
                {[
                  { label: 'Name', value: form.name || '—', filled: !!form.name },
                  { label: 'Model', value: form.model, filled: true },
                  { label: 'Temperature', value: form.temperature.toFixed(1), filled: true },
                  { label: 'Channels', value: [form.webChat && 'Web', form.slack && 'Slack', form.discord && 'Discord', form.whatsApp && 'WhatsApp'].filter(Boolean).join(', ') || 'None', filled: form.webChat || form.slack || form.discord || form.whatsApp },
                ].map(({ label, value, filled }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: filled ? 'rgba(45, 125, 70, 0.15)' : 'var(--border-color)' }}>
                      {filled && <Check size={10} style={{ color: '#2D7D46' }} />}
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{label}</p>
                      <p className="font-body text-sm font-medium" style={{ color: filled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Estimated cost</p>
                <p className="font-display font-bold text-2xl mt-1" style={{ color: 'var(--text-primary)' }}>$12-48<span className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>/month</span></p>
                <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Based on selected model and usage.</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 brand-gradient"
                style={{ opacity: canSubmit ? 1 : 0.4 }}
              >
                {mode === 'new' ? 'Deploy Agent' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
