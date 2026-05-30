import { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Plug, Slack, MessageCircle, Globe, X, Bot, Sun, Moon, LogOut, Layers, BookOpen, Users, MessageSquare, Settings, FolderOpen, Zap, Lock, ChevronDown, Check, Plus, LayoutDashboard, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '../../context/StoreContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useConnectionStore } from '../../stores/connectionStore';
import type { Instance } from '../../types';
import type { ConnStatus } from '../../lib/gatewayProtocol';

/** Small colored dot indicating WS connection status */
function WsStatusDot({ status }: { status: ConnStatus }) {
  const colors: Record<ConnStatus, string> = {
    connected:        '#2D7D46',
    connecting:       '#C05640',
    disconnected:     '#6B7280',
    error:            '#DC2626',
    pairing_required: '#D97706',
  };
  const isAnimating = status === 'connecting';
  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${isAnimating ? 'animate-pulse' : ''}`}
      style={{ background: colors[status] }}
      title={status.replace('_', ' ')}
    />
  );
}

export function InfoTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: boolean; right: boolean }>({ top: false, right: false });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const tooltipH = 120; // conservative estimate
    const tooltipW = 288; // w-72
    setPos({
      top: rect.bottom + tooltipH > window.innerHeight && rect.top > tooltipH,
      right: rect.left + tooltipW > window.innerWidth,
    });
  }, [open]);

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-150 flex-shrink-0"
        style={{
          border: '1.5px solid var(--border-color)',
          color: 'var(--text-muted)',
          background: 'var(--bg-elevated)',
        }}
      >?</button>
      {open && (
        <div
          className="absolute z-50 w-72 rounded-2xl p-4"
          style={{
            ...(pos.top
              ? { bottom: 'calc(100% + 8px)', top: 'auto' }
              : { top: 'calc(100% + 8px)', bottom: 'auto' }),
            ...(pos.right
              ? { right: 0, left: 'auto' }
              : { left: 0, right: 'auto' }),
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{content}</p>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: Instance['status'] }) {
  const styles = {
    running: { bg: 'rgba(45, 125, 70, 0.12)', color: '#2D7D46', label: 'Running', dot: '#2D7D46' },
    stopped: { bg: 'rgba(192, 86, 64, 0.12)', color: '#C05640', label: 'Stopped', dot: '#C05640' },
    error:   { bg: 'rgba(220, 38, 38, 0.12)', color: '#DC2626', label: 'Error',   dot: '#DC2626' },
  };
  const s = styles[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

export function IntegrationIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Slack: <Slack size={14} />,
    Discord: <MessageCircle size={14} />,
    Web: <Globe size={14} />,
  };
  return (
    <span
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(192, 86, 64, 0.08)', color: 'var(--burnt-orange)' }}
      title={name}
    >
      {icons[name] || <Plug size={14} />}
    </span>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const navGroup1 = [
  { icon: FolderOpen,    label: 'Files',           sub: 'Browse & manage files', path: '/files'     },
  { icon: Plug,          label: 'Apps',            sub: 'MCP integrations',      path: '/apps'      },
  { icon: Zap,           label: 'Tools',           sub: 'Agent tools & skills',  path: '/tools'     },
  { icon: MessageSquare, label: 'Channels',        sub: 'Integrations & config', path: '/channels'  },
  { icon: Lock,          label: 'Policy',          sub: 'Access control',        path: '/policy'    },
];

const navGroup2 = [
  { icon: BookOpen,      label: 'Knowledge Bases', sub: 'Retrieval pipelines',   path: '/knowledge' },
  { icon: Bot,           label: 'Agents',          sub: 'Your AI workers',       path: '/agents'    },
  { icon: Users,         label: 'Teams',           sub: 'Agentic workflows',     path: '/teams'     },
];

const navGroup3 = [
  { icon: MessageSquare, label: 'Workflows',       sub: 'Deploy & integrate',    path: '/workflows' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsActive = location.pathname === '/settings' || location.pathname.startsWith('/settings/');
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { workspaces, addWorkspace } = useStore();
  const { activeWorkspace, activeWorkspaceId, setActiveWorkspace } = useWorkspace();
  const { getConnection } = useConnectionStore();
  const activeConnStatus = activeWorkspaceId ? getConnection(activeWorkspaceId).status : 'disconnected';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [showNewWsModal, setShowNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) return;
    addWorkspace({ name: newWsName.trim(), description: newWsDesc.trim(), mcps: [], env: [], tools: [] });
    setNewWsName(''); setNewWsDesc(''); setShowNewWsModal(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <img src="/assets/logo-icon.png" alt="dropin.bot" className="w-10 h-10 rounded-[20%]" />
        <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          dropin<span className="font-normal">.bot</span>
        </span>
      </div>

      {/* Workspace Switcher */}
      <div className="px-4 pb-4">
        <div className="relative">
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; }}
            onMouseLeave={e => { if (!wsDropdownOpen) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <Layers size={16} style={{ color: 'var(--burnt-orange)' }} />
            <span className="flex-1 text-left truncate">{activeWorkspace?.name ?? 'Select Workspace'}</span>
            {activeWorkspace?.openClaw && <WsStatusDot status={activeConnStatus} />}
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: wsDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {wsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setWsDropdownOpen(false)} />
              <div
                className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl overflow-hidden shadow-xl"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="max-h-64 overflow-y-auto py-1.5">
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => { setActiveWorkspace(ws.id); setWsDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Layers size={14} style={{ color: 'var(--burnt-orange)' }} />
                      <span className="flex-1 truncate">{ws.name}</span>
                      {ws.id === activeWorkspaceId && <Check size={14} style={{ color: 'var(--burnt-orange)' }} />}
                    </button>
                  ))}
                </div>
                <div className="border-t px-3.5 py-2 space-y-1" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    onClick={() => { setWsDropdownOpen(false); navigate('/workspace-settings'); }}
                    className="w-full flex items-center gap-2 text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Settings2 size={14} /> Workspace Settings
                  </button>
                  <button
                    onClick={() => { setWsDropdownOpen(false); setShowNewWsModal(true); }}
                    className="w-full flex items-center gap-2 text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Plus size={14} /> New Workspace
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <nav className="scroll-y-kb px-3 flex-1 min-h-0">
        {/* Dashboard — above all groups */}
        {(() => {
          const path = '/dashboard';
          const isActive = location.pathname === path;
          return (
            <button
              onClick={() => { navigate(path); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 mt-1"
              style={{
                background: isActive ? 'rgba(192, 86, 64, 0.10)' : 'transparent',
                color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(192, 86, 64, 0.06)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <LayoutDashboard size={18} className="flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>Dashboard</p>
                <p className="text-[10px] font-normal leading-tight mt-0.5" style={{ color: isActive ? 'rgba(192,86,64,0.65)' : 'var(--text-muted)' }}>Workspace overview</p>
              </div>
            </button>
          );
        })()}
        <div style={{ margin: '6px 12px 2px 12px' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1" style={{ color: 'var(--text-muted)' }}>1. Setup</p>
          <div style={{ borderTop: '1px solid var(--border-color)' }} />
        </div>
        {navGroup1.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1"
              style={{
                background: isActive ? 'rgba(192, 86, 64, 0.10)' : 'transparent',
                color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(192, 86, 64, 0.06)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-[10px] font-normal leading-tight mt-0.5" style={{ color: isActive ? 'rgba(192,86,64,0.65)' : 'var(--text-muted)' }}>{item.sub}</p>
              </div>
            </button>
          );
        })}
        <div style={{ margin: '6px 12px 2px 12px' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1" style={{ color: 'var(--text-muted)' }}>2. Design</p>
          <div style={{ borderTop: '1px solid var(--border-color)' }} />
        </div>
        {navGroup2.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1"
              style={{
                background: isActive ? 'rgba(192, 86, 64, 0.10)' : 'transparent',
                color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(192, 86, 64, 0.06)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-[10px] font-normal leading-tight mt-0.5" style={{ color: isActive ? 'rgba(192,86,64,0.65)' : 'var(--text-muted)' }}>{item.sub}</p>
              </div>
            </button>
          );
        })}
        <div style={{ margin: '6px 12px 2px 12px' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1" style={{ color: 'var(--text-muted)' }}>3. Deploy</p>
          <div style={{ borderTop: '1px solid var(--border-color)' }} />
        </div>
        {navGroup3.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/') || location.pathname === '/channels' || location.pathname.startsWith('/channels/');
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1"
              style={{
                background: isActive ? 'rgba(192, 86, 64, 0.10)' : 'transparent',
                color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(192, 86, 64, 0.06)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: isActive ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-[10px] font-normal leading-tight mt-0.5" style={{ color: isActive ? 'rgba(192,86,64,0.65)' : 'var(--text-muted)' }}>{item.sub}</p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(192, 86, 64, 0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <button
          onClick={() => { navigate('/settings'); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: isSettingsActive ? 'rgba(192, 86, 64, 0.10)' : 'transparent',
            color: isSettingsActive ? 'var(--burnt-orange)' : 'var(--text-secondary)',
          }}
          onMouseEnter={e => { if (!isSettingsActive) e.currentTarget.style.background = 'rgba(192, 86, 64, 0.06)'; }}
          onMouseLeave={e => { if (!isSettingsActive) e.currentTarget.style.background = 'transparent'; }}
        >
          <Settings size={20} />
          Settings
        </button>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-1"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.06)'; e.currentTarget.style.color = '#DC2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Bot size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className="lg:hidden fixed top-0 left-0 z-40 h-full w-60 flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 h-full w-60 flex-col z-30"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* New Workspace Modal */}
      {showNewWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) setShowNewWsModal(false); }}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>New Workspace</h2>
              <button onClick={() => setShowNewWsModal(false)} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><X size={18} /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-body font-medium text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>Workspace Name <span style={{ color: 'var(--burnt-orange)' }}>*</span></label>
                <input className="form-input w-full" placeholder="e.g. Marketing Workspace" value={newWsName} onChange={e => setNewWsName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()} />
              </div>
              <div>
                <label className="block font-body font-medium text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>Description</label>
                <input className="form-input w-full" placeholder="What is this workspace for?" value={newWsDesc} onChange={e => setNewWsDesc(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewWsModal(false)} className="flex-1 py-3 rounded-full text-sm font-semibold transition-all" style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleCreateWorkspace} disabled={!newWsName.trim()} className="flex-1 py-3 rounded-full text-sm font-semibold text-white brand-gradient" style={{ opacity: newWsName.trim() ? 1 : 0.4 }}>Create Workspace</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
