import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, BarChart3, Settings, Sun, Moon, Plus, Search,
  ChevronRight, Link2, Brain, Database, Plug, X, Trash2,
  AlertTriangle, Check, CloudUpload, Slack, MessageCircle, Code2,
  Globe, ArrowLeft, Bot
} from 'lucide-react';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface Instance {
  id: string;
  name: string;
  model: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  conversations: string;
  integrations: string[];
  usage: number;
  lastActive: string;
  temperature: number;
  personality: string;
  systemPrompt: string;
  region: string;
  environment: string;
}

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */

const INITIAL_INSTANCES: Instance[] = [
  { id: '1', name: 'My Assistant', model: 'GPT-4', status: 'running', uptime: '99.2%', conversations: '3.2K', integrations: ['Slack', 'Web'], usage: 78, lastActive: '2m ago', temperature: 0.7, personality: 'Helpful and friendly assistant for daily tasks.', systemPrompt: 'You are a helpful personal assistant.', region: 'us-east', environment: 'production' },
  { id: '2', name: 'Team Bot', model: 'Claude 3', status: 'running', uptime: '97.5%', conversations: '8.1K', integrations: ['Slack', 'Discord', 'Web'], usage: 92, lastActive: '30s ago', temperature: 0.5, personality: 'Professional team collaboration bot.', systemPrompt: 'You are a team collaboration assistant.', region: 'us-west', environment: 'production' },
  { id: '3', name: 'Research Aid', model: 'Llama 3', status: 'running', uptime: '94.1%', conversations: '1.5K', integrations: ['Web'], usage: 45, lastActive: '1h ago', temperature: 0.9, personality: 'Deep research assistant with academic tone.', systemPrompt: 'You are a research assistant focused on deep analysis.', region: 'eu-west', environment: 'staging' },
  { id: '4', name: 'Code Helper', model: 'GPT-4', status: 'stopped', uptime: '—', conversations: '12K', integrations: ['Web', 'Discord'], usage: 0, lastActive: '3d ago', temperature: 0.3, personality: 'Expert coding assistant.', systemPrompt: 'You are a senior software engineer assistant.', region: 'us-east', environment: 'development' },
  { id: '5', name: 'Writing Buddy', model: 'Mistral', status: 'running', uptime: '98.8%', conversations: '890', integrations: ['Web'], usage: 34, lastActive: '15m ago', temperature: 1.2, personality: 'Creative writing companion.', systemPrompt: 'You are a creative writing assistant.', region: 'asia-pacific', environment: 'production' },
  { id: '6', name: 'DevOps Bot', model: 'Claude 3', status: 'error', uptime: '62.3%', conversations: '4.2K', integrations: ['Slack'], usage: 100, lastActive: '5m ago', temperature: 0.4, personality: 'Infrastructure monitoring assistant.', systemPrompt: 'You are a DevOps monitoring assistant.', region: 'us-west', environment: 'production' },
];

/* ═══════════════════════════════════════════
   THEME CONTEXT
   ═══════════════════════════════════════════ */

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: 'light', toggleTheme: () => {} });

function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('dropin-theme') as Theme | null;
    return saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dropin-theme', theme);
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

/* ═══════════════════════════════════════════
   INSTANCE STORE (Context)
   ═══════════════════════════════════════════ */

type InstanceInput = Omit<Instance, 'id' | 'lastActive' | 'uptime' | 'conversations' | 'usage'>;

const StoreContext = createContext<{
  instances: Instance[];
  addInstance: (i: InstanceInput) => void;
  updateInstance: (id: string, data: Partial<Instance>) => void;
  deleteInstance: (id: string) => void;
  getInstance: (id: string) => Instance | undefined;
}>({
  instances: [],
  addInstance: () => {},
  updateInstance: () => {},
  deleteInstance: () => {},
  getInstance: () => undefined,
});

function useStore() { return useContext(StoreContext); }

function StoreProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<Instance[]>(INITIAL_INSTANCES);
  const addInstance = useCallback((data: InstanceInput) => {
    const newInst: Instance = {
      ...data,
      id: Date.now().toString(),
      lastActive: 'Just now',
      uptime: '100%',
      conversations: '0',
      usage: 0,
    };
    setInstances(prev => [newInst, ...prev]);
  }, []);
  const updateInstance = useCallback((id: string, data: Partial<Instance>) => {
    setInstances(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }, []);
  const deleteInstance = useCallback((id: string) => {
    setInstances(prev => prev.filter(i => i.id !== id));
  }, []);
  const getInstance = useCallback((id: string) => instances.find(i => i.id === id), [instances]);
  return (
    <StoreContext.Provider value={{ instances, addInstance, updateInstance, deleteInstance, getInstance }}>
      {children}
    </StoreContext.Provider>
  );
}

/* ═══════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════ */

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Boxes, label: 'Instances', path: '/' },
  { icon: BarChart3, label: 'Analytics', path: '#' },
  { icon: Settings, label: 'Settings', path: '#' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center gap-3">
        <img src="/assets/logo-icon.png" alt="dropin.bot" className="w-10 h-10 rounded-[20%]" />
        <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          dropin<span className="font-normal">.bot</span>
        </span>
      </div>

      <nav className="px-3 flex-1">
        {navItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
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
              <item.icon size={20} />
              {item.label}
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
    </>
  );
}

/* ═══════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════ */

function StatusBadge({ status }: { status: Instance['status'] }) {
  const styles = {
    running: { bg: 'rgba(45, 125, 70, 0.12)', color: '#2D7D46', label: 'Running', dot: '#2D7D46' },
    stopped: { bg: 'rgba(192, 86, 64, 0.12)', color: '#C05640', label: 'Stopped', dot: '#C05640' },
    error:   { bg: 'rgba(220, 38, 38, 0.12)', color: '#DC2626', label: 'Error', dot: '#DC2626' },
  };
  const s = styles[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   INTEGRATION ICON
   ═══════════════════════════════════════════ */

function IntegrationIcon({ name }: { name: string }) {
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

/* ═══════════════════════════════════════════
   PAGE: DASHBOARD
   ═══════════════════════════════════════════ */

function DashboardPage() {
  const navigate = useNavigate();
  const { instances } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped' | 'error'>('all');

  const filtered = instances.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.model.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || i.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Total Instances', value: instances.length.toString(), change: `${instances.filter(i => i.status === 'running').length} active` },
    { label: 'Active', value: instances.filter(i => i.status === 'running').length.toString(), change: `${Math.round(instances.filter(i => i.status === 'running').length / instances.length * 100)}% healthy` },
    { label: 'Models', value: '4', change: 'GPT-4, Claude, Llama, Mistral' },
    { label: 'Conversations', value: '30.9K', change: 'All time' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-6 lg:px-10 h-16 flex items-center justify-between" style={{ background: 'var(--bg-primary)' }}>
        <div>
          <p className="section-label mb-0">Instances</p>
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center px-4 py-2 rounded-xl" style={{ border: '1.5px solid var(--border-color)' }}>
            <Search size={16} className="mr-2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search instances..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-48"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={() => navigate('/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 brand-gradient"
            style={{ boxShadow: '0 4px 12px rgba(192, 86, 64, 0.25)' }}
          >
            <Plus size={16} />
            New Instance
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-10 pb-12">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl p-5 lg:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <p className="font-mono text-[11px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{s.label}</p>
              <p className="font-display font-bold text-2xl lg:text-3xl mt-1" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="font-body text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.change}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'running', 'stopped', 'error'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200"
              style={{
                background: filter === f ? 'rgba(192, 86, 64, 0.10)' : 'transparent',
                color: filter === f ? 'var(--burnt-orange)' : 'var(--text-secondary)',
                border: filter === f ? '1.5px solid var(--burnt-orange)' : '1.5px solid var(--border-color)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Instance Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <img src="/assets/mascot-sitting.png" alt="" className="w-24 h-24 mb-6 opacity-50" />
            <h3 className="font-display font-medium text-xl" style={{ color: 'var(--text-primary)' }}>No instances found</h3>
            <p className="font-body text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {instances.length === 0 ? "Deploy your first OpenClaw assistant to get started." : "Try a different search or filter."}
            </p>
            <button
              onClick={() => navigate('/new')}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white brand-gradient"
            >
              <Plus size={16} />
              Create Instance
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filtered.map(inst => (
              <div
                key={inst.id}
                className="rounded-2xl overflow-hidden card-hover cursor-pointer"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                onClick={() => navigate(`/edit/${inst.id}`)}
              >
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{inst.name}</h3>
                    <span
                      className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: 'rgba(192, 86, 64, 0.10)', color: 'var(--burnt-orange)' }}
                    >
                      {inst.model}
                    </span>
                  </div>
                  <StatusBadge status={inst.status} />
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Uptime</p>
                      <p className="font-display font-semibold text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{inst.uptime}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Conversations</p>
                      <p className="font-display font-semibold text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{inst.conversations}</p>
                    </div>
                  </div>

                  {/* Usage bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Usage</span>
                      <span className="font-mono text-[10px]" style={{ color: inst.usage > 90 ? '#DC2626' : 'var(--text-secondary)' }}>{inst.usage}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${inst.usage}%`,
                          background: inst.usage > 90 ? '#DC2626' : inst.usage > 70 ? 'var(--burnt-orange)' : 'linear-gradient(90deg, #C05640, #F39075)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Integrations */}
                  <div className="flex items-center gap-2">
                    {inst.integrations.map(int => <IntegrationIcon key={int} name={int} />)}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Last active: {inst.lastActive}</span>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: INSTANCE FORM (NEW / EDIT)
   ═══════════════════════════════════════════ */

const MODELS = ['GPT-4', 'Claude 3', 'Llama 3', 'Mistral'];
const REGIONS = [
  { value: 'us-east', label: 'US East' },
  { value: 'us-west', label: 'US West' },
  { value: 'eu-west', label: 'EU West' },
  { value: 'asia-pacific', label: 'Asia Pacific' },
];
const ENVIRONMENTS = ['production', 'staging', 'development'];

function InstanceFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addInstance, updateInstance, deleteInstance, getInstance } = useStore();
  const existing = mode === 'edit' && id ? getInstance(id) : undefined;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    model: existing?.model ?? 'GPT-4',
    apiKey: '',
    region: existing?.region ?? 'us-east',
    environment: existing?.environment ?? 'production',
    temperature: existing?.temperature ?? 0.7,
    personality: existing?.personality ?? '',
    systemPrompt: existing?.systemPrompt ?? '',
    webChat: true,
    slack: false,
    discord: false,
    apiAccess: false,
  });

  const update = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (mode === 'new') {
      addInstance({
        name: form.name,
        model: form.model,
        status: 'running',
        integrations: [
          ...(form.webChat ? ['Web'] : []),
          ...(form.slack ? ['Slack'] : []),
          ...(form.discord ? ['Discord'] : []),
        ],
        temperature: form.temperature,
        personality: form.personality,
        systemPrompt: form.systemPrompt,
        region: form.region,
        environment: form.environment,
      });
    } else if (existing) {
      updateInstance(existing.id, {
        name: form.name,
        model: form.model,
        temperature: form.temperature,
        personality: form.personality,
        systemPrompt: form.systemPrompt,
        region: form.region,
        environment: form.environment,
        integrations: [
          ...(form.webChat ? ['Web'] : []),
          ...(form.slack ? ['Slack'] : []),
          ...(form.discord ? ['Discord'] : []),
        ],
      });
    }
    navigate('/');
  };

  const handleDelete = () => {
    if (existing && confirm('Are you sure? This will permanently delete this instance.')) {
      deleteInstance(existing.id);
      navigate('/');
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
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="section-label mb-0">{mode === 'new' ? 'New Instance' : 'Edit Instance'}</p>
            <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {mode === 'new' ? 'Configure your assistant' : existing?.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass} style={labelStyle}>Region</label>
                    <select className="form-input form-select" value={form.region} onChange={e => update('region', e.target.value)}>
                      {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Environment</label>
                    <div className="flex gap-2">
                      {ENVIRONMENTS.map(env => (
                        <button
                          key={env}
                          onClick={() => update('environment', env)}
                          className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all duration-200"
                          style={{
                            border: form.environment === env ? '1.5px solid var(--burnt-orange)' : '1.5px solid var(--border-color)',
                            background: form.environment === env ? 'rgba(192, 86, 64, 0.06)' : 'transparent',
                            color: form.environment === env ? 'var(--burnt-orange)' : 'var(--text-secondary)',
                          }}
                        >
                          {env}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model & Personality */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Brain size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Model & Personality</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Choose the brain and voice for your assistant.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass} style={labelStyle}>AI Model</label>
                  <select className="form-input form-select" value={form.model} onChange={e => update('model', e.target.value)}>
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
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
                  <label className={labelClass} style={labelStyle}>Personality</label>
                  <textarea className="form-input form-textarea" rows={3} placeholder="Describe how your assistant should behave..." value={form.personality} onChange={e => update('personality', e.target.value)} />
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
                className="rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer"
                style={{ border: '2px dashed var(--border-color)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.background = 'rgba(192, 86, 64, 0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <CloudUpload size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" />
                <p className="font-body text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Drop files here or click to upload</p>
                <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, Markdown, TXT up to 10MB each</p>
              </div>
            </div>

            {/* Integrations */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Plug size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Integrations</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Where your assistant will be available.</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'webChat', label: 'Web Chat', icon: Globe, desc: 'Embed on your website', defaultOn: true },
                  { key: 'slack', label: 'Slack', icon: Slack, desc: 'Connect to your workspace' },
                  { key: 'discord', label: 'Discord', icon: MessageCircle, desc: 'Add to your server' },
                  { key: 'apiAccess', label: 'API Access', icon: Code2, desc: 'Direct API integration' },
                ].map(({ key, label, icon: Icon, desc }) => {
                  const isOn = form[key as keyof typeof form] as boolean;
                  return (
                    <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.08)' }}>
                          <Icon size={18} style={{ color: 'var(--burnt-orange)' }} />
                        </div>
                        <div>
                          <p className="font-body font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                          <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => update(key, !isOn)}
                        className="relative w-11 h-6 rounded-full transition-all duration-200"
                        style={{ background: isOn ? 'var(--burnt-orange)' : 'var(--muted-beige)' }}
                      >
                        <span
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
                          style={{ left: isOn ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                        />
                      </button>
                    </div>
                  );
                })}
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
                  { label: 'Region', value: REGIONS.find(r => r.value === form.region)?.label, filled: true },
                  { label: 'Environment', value: form.environment, filled: true },
                  { label: 'Temperature', value: form.temperature.toFixed(1), filled: true },
                  { label: 'Integrations', value: [form.webChat && 'Web', form.slack && 'Slack', form.discord && 'Discord'].filter(Boolean).join(', ') || 'None', filled: form.webChat || form.slack || form.discord },
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
                {mode === 'new' ? 'Deploy Instance' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP SHELL
   ═══════════════════════════════════════════ */

function AppShell() {
  return (
    <div className="lg:ml-60">
      <Sidebar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/new" element={<InstanceFormPage mode="new" />} />
        <Route path="/edit/:id" element={<InstanceFormPage mode="edit" />} />
      </Routes>
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */
export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
