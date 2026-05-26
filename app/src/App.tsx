import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import {
  Settings, Sun, Moon, Plus, Search,
  Plug, X, Slack, MessageCircle, Globe, Bot, LogOut,  Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, RefreshCw,
  MessageSquare, Zap, ArrowLeft, CheckCircle2,
  Link2, Brain, Database, CloudUpload, AlertTriangle, Trash2, Check,
  Layers, FileText,
  Wifi, PlusCircle,
  Folder, FolderOpen, FolderPlus, File, ChevronRight, ChevronDown,
  LayoutGrid, List, SortAsc, SortDesc, Download, Copy, MoreHorizontal,
  Image, FileCode, FileJson, Archive, Video, Music
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
  // Agent-specific fields
  workspaceId: string | null;
  memories: { conversationHistory: boolean; longTermMemory: boolean; crossSessionRecall: boolean; windowSize: number; mem0: boolean; zep: boolean; };
  plugins: { webSearch: boolean; codeInterpreter: boolean; imageGeneration: boolean; calculator: boolean; };
  skills: string[];
}

interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or identifier
  connected: boolean;
}

interface WorkspaceDoc {
  id: string;
  name: string;
  type: 'pdf' | 'md' | 'txt' | 'docx';
  size: string;
  uploadedAt: string;
}

interface DataSource {
  id: string;
  name: string;
  type: 'postgresql' | 'rest-api' | 'web-url';
  connectionString: string;
  status: 'connected' | 'error' | 'pending';
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  connectedApps: ConnectedApp[];
  documents: WorkspaceDoc[];
  dataSources: DataSource[];
  mcps: { id: string; name: string; url: string; apiKey: string }[];
  env: EnvNode[];
}

/* Environment file-tree types */
type EnvFileType = 'folder' | 'py' | 'js' | 'ts' | 'json' | 'md' | 'txt' | 'yaml' | 'sh' | 'img' | 'video' | 'audio' | 'zip' | 'file';
interface EnvNode {
  id: string;
  name: string;
  type: EnvFileType;
  size?: string;
  modifiedAt: string;
  children?: EnvNode[];
}

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */

const DEFAULT_MEMORIES = { conversationHistory: true, longTermMemory: false, crossSessionRecall: false, windowSize: 20, mem0: false, zep: false };
const DEFAULT_PLUGINS  = { webSearch: false, codeInterpreter: false, imageGeneration: false, calculator: false };

const INITIAL_INSTANCES: Instance[] = [
 { id: '1', name: 'My Assistant',  model: 'GPT-4',    status: 'running', uptime: '99.2%', conversations: '3.2K', integrations: ['Slack', 'Web'],           usage: 78,  lastActive: '2m ago',  temperature: 0.7, personality: 'Helpful and friendly assistant for daily tasks.',    systemPrompt: 'You are a helpful personal assistant.',              region: 'us-east',      environment: 'production',  workspaceId: 'ws-1', memories: { ...DEFAULT_MEMORIES, longTermMemory: true },  plugins: { ...DEFAULT_PLUGINS, webSearch: true },  skills: ['Summarization', 'Translation', 'Q&A'] },
 { id: '2', name: 'Team Bot',      model: 'Claude 3', status: 'running', uptime: '97.5%', conversations: '8.1K', integrations: ['Slack', 'Discord', 'Web'], usage: 92,  lastActive: '30s ago', temperature: 0.5, personality: 'Professional team collaboration bot.',               systemPrompt: 'You are a team collaboration assistant.',            region: 'us-west',      environment: 'production',  workspaceId: 'ws-1', memories: { ...DEFAULT_MEMORIES },                        plugins: { ...DEFAULT_PLUGINS, calculator: true }, skills: ['Scheduling', 'Summarization'] },
 { id: '3', name: 'Research Aid',  model: 'Llama 3',  status: 'running', uptime: '94.1%', conversations: '1.5K', integrations: ['Web'],                    usage: 45,  lastActive: '1h ago',  temperature: 0.9, personality: 'Deep research assistant with academic tone.',         systemPrompt: 'You are a research assistant focused on deep analysis.', region: 'eu-west',   environment: 'staging',     workspaceId: 'ws-2', memories: { ...DEFAULT_MEMORIES, crossSessionRecall: true }, plugins: { ...DEFAULT_PLUGINS, webSearch: true, codeInterpreter: true }, skills: ['Research', 'Citation', 'SQL Query'] },
 { id: '4', name: 'Code Helper',   model: 'GPT-4',    status: 'stopped', uptime: '—',     conversations: '12K',  integrations: ['Web', 'Discord'],         usage: 0,   lastActive: '3d ago',  temperature: 0.3, personality: 'Expert coding assistant.',                            systemPrompt: 'You are a senior software engineer assistant.',       region: 'us-east',      environment: 'development', workspaceId: 'ws-2', memories: { ...DEFAULT_MEMORIES },                        plugins: { ...DEFAULT_PLUGINS, codeInterpreter: true }, skills: ['Code Review', 'Debugging', 'Documentation'] },
 { id: '5', name: 'Writing Buddy', model: 'Mistral',  status: 'running', uptime: '98.8%', conversations: '890',  integrations: ['Web'],                    usage: 34,  lastActive: '15m ago', temperature: 1.2, personality: 'Creative writing companion.',                         systemPrompt: 'You are a creative writing assistant.',              region: 'asia-pacific', environment: 'production',  workspaceId: null,   memories: { ...DEFAULT_MEMORIES },                        plugins: { ...DEFAULT_PLUGINS, imageGeneration: true }, skills: ['Copywriting', 'Editing', 'Brainstorming'] },
 { id: '6', name: 'DevOps Bot',    model: 'Claude 3', status: 'error',   uptime: '62.3%', conversations: '4.2K', integrations: ['Slack'],                  usage: 100, lastActive: '5m ago',  temperature: 0.4, personality: 'Infrastructure monitoring assistant.',               systemPrompt: 'You are a DevOps monitoring assistant.',             region: 'us-west',      environment: 'production',  workspaceId: 'ws-1', memories: { ...DEFAULT_MEMORIES, longTermMemory: true },  plugins: { ...DEFAULT_PLUGINS, webSearch: true }, skills: ['Monitoring', 'Alerting', 'Incident Response'] },
];

const CONNECTED_APPS_TEMPLATE: ConnectedApp[] = [
  { id: 'google', name: 'Google Workspace', description: 'Docs, Sheets, Drive — read & write', icon: '🔵', connected: false },
  { id: 'notion',   name: 'Notion',           description: 'Pages, databases, wikis',            icon: '⬛', connected: false },
  { id: 'obsidian', name: 'Obsidian Vault',   description: 'Markdown notes & knowledge graphs',  icon: '💜', connected: false },
  { id: 'dropbox',  name: 'Dropbox',          description: 'File storage & sharing',             icon: '🔷', connected: false },
  { id: 'github',   name: 'GitHub',           description: 'Repos, issues, pull requests',       icon: '⚫', connected: false },
];

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Main Workspace',
    description: 'Primary workspace for production agents',
    isDefault: true,
    connectedApps: CONNECTED_APPS_TEMPLATE.map((a, i) => ({ ...a, connected: i < 2 })),
    documents: [
      { id: 'd1', name: 'Product Handbook.pdf',   type: 'pdf',  size: '2.4 MB', uploadedAt: 'May 20, 2026' },
      { id: 'd2', name: 'Brand Guidelines.pdf',   type: 'pdf',  size: '1.1 MB', uploadedAt: 'May 18, 2026' },
      { id: 'd3', name: 'FAQ.md',                 type: 'md',   size: '48 KB',  uploadedAt: 'May 15, 2026' },
      { id: 'd4', name: 'Onboarding Script.txt',  type: 'txt',  size: '12 KB',  uploadedAt: 'May 10, 2026' },
    ],
    dataSources: [
      { id: 'ds1', name: 'Production DB',   type: 'postgresql', connectionString: 'postgresql://prod:***@db.internal:5432/main', status: 'connected' },
      { id: 'ds2', name: 'CRM API',         type: 'rest-api',   connectionString: 'https://api.crm.internal/v2',                status: 'connected' },
      { id: 'ds3', name: 'Help Center',     type: 'web-url',    connectionString: 'https://help.dropin.bot',                    status: 'connected' },
    ],
    mcps: [],
    env: [
      { id: 'e1', name: 'agents', type: 'folder', modifiedAt: 'May 26, 2026', children: [
        { id: 'e1a', name: 'assistant.py',   type: 'py',   size: '8.2 KB',  modifiedAt: 'May 26, 2026' },
        { id: 'e1b', name: 'team_bot.py',    type: 'py',   size: '12.4 KB', modifiedAt: 'May 25, 2026' },
        { id: 'e1c', name: 'config.yaml',    type: 'yaml', size: '2.1 KB',  modifiedAt: 'May 24, 2026' },
      ]},
      { id: 'e2', name: 'prompts', type: 'folder', modifiedAt: 'May 25, 2026', children: [
        { id: 'e2a', name: 'system.md',      type: 'md',   size: '4.8 KB',  modifiedAt: 'May 25, 2026' },
        { id: 'e2b', name: 'few_shots.json', type: 'json', size: '18.3 KB', modifiedAt: 'May 23, 2026' },
      ]},
      { id: 'e3', name: 'scripts', type: 'folder', modifiedAt: 'May 22, 2026', children: [
        { id: 'e3a', name: 'deploy.sh',      type: 'sh',   size: '1.4 KB',  modifiedAt: 'May 22, 2026' },
        { id: 'e3b', name: 'seed_data.py',   type: 'py',   size: '6.7 KB',  modifiedAt: 'May 20, 2026' },
      ]},
      { id: 'e4', name: 'README.md',         type: 'md',   size: '3.2 KB',  modifiedAt: 'May 21, 2026' },
      { id: 'e5', name: 'requirements.txt',  type: 'txt',  size: '0.8 KB',  modifiedAt: 'May 18, 2026' },
    ],
  },
  {
    id: 'ws-2',
    name: 'Dev Workspace',
    description: 'Staging and development agents only',
    connectedApps: CONNECTED_APPS_TEMPLATE.map((a, i) => ({ ...a, connected: i === 4 })),
    documents: [
      { id: 'd5', name: 'API Reference.md',       type: 'md',   size: '320 KB', uploadedAt: 'May 21, 2026' },
      { id: 'd6', name: 'Architecture Diagram.pdf', type: 'pdf', size: '890 KB', uploadedAt: 'May 19, 2026' },
    ],
    dataSources: [
      { id: 'ds4', name: 'Staging DB',    type: 'postgresql', connectionString: 'postgresql://dev:***@db.staging:5432/dev', status: 'connected' },
      { id: 'ds5', name: 'GitHub API',    type: 'rest-api',   connectionString: 'https://api.github.com',                  status: 'connected' },
    ],
    mcps: [],
    env: [
      { id: 'f1', name: 'src', type: 'folder', modifiedAt: 'May 27, 2026', children: [
        { id: 'f1a', name: 'index.ts',     type: 'ts',   size: '5.1 KB',  modifiedAt: 'May 27, 2026' },
        { id: 'f1b', name: 'router.ts',    type: 'ts',   size: '3.8 KB',  modifiedAt: 'May 26, 2026' },
        { id: 'f1c', name: 'utils', type: 'folder', modifiedAt: 'May 25, 2026', children: [
          { id: 'f1c1', name: 'helpers.ts',  type: 'ts',   size: '2.2 KB',  modifiedAt: 'May 25, 2026' },
          { id: 'f1c2', name: 'logger.ts',   type: 'ts',   size: '1.6 KB',  modifiedAt: 'May 24, 2026' },
        ]},
      ]},
      { id: 'f2', name: 'tests', type: 'folder', modifiedAt: 'May 24, 2026', children: [
        { id: 'f2a', name: 'unit.test.ts',  type: 'ts',   size: '9.4 KB',  modifiedAt: 'May 24, 2026' },
        { id: 'f2b', name: 'e2e.test.ts',   type: 'ts',   size: '7.1 KB',  modifiedAt: 'May 23, 2026' },
      ]},
      { id: 'f3', name: 'package.json',    type: 'json', size: '1.2 KB',  modifiedAt: 'May 22, 2026' },
      { id: 'f4', name: 'tsconfig.json',   type: 'json', size: '0.9 KB',  modifiedAt: 'May 20, 2026' },
    ],
  },
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
   AUTH CONTEXT
   ═══════════════════════════════════════════ */

interface AuthUser {
  name: string;
  email: string;
  provider: string;
}

const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (provider: string, email?: string, name?: string) => void;
  signUp: (data: { name: string; email: string; phone?: string; provider: string }) => void;
  logout: () => void;
}>({ isAuthenticated: false, user: null, login: () => {}, signUp: () => {}, logout: () => {} });

function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dropin-auth') === 'true';
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('dropin-auth-user');
    return saved ? JSON.parse(saved) : null;
  });

  const persistUser = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('dropin-auth-user', JSON.stringify(u));
  };

  const login = useCallback((provider: string, email = '', name = '') => {
    setIsAuthenticated(true);
    persistUser({ name: name || 'User', email: email || '', provider });
    localStorage.setItem('dropin-auth', 'true');
  }, []);

  const signUp = useCallback((data: { name: string; email: string; phone?: string; provider: string }) => {
    setIsAuthenticated(true);
    persistUser({ name: data.name, email: data.email, provider: data.provider });
    localStorage.setItem('dropin-auth', 'true');
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('dropin-auth');
    localStorage.removeItem('dropin-auth-user');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ═══════════════════════════════════════════
   PROTECTED ROUTE
   ═══════════════════════════════════════════ */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* ═══════════════════════════════════════════
   AUTH PAGE SHARED HELPERS
   ═══════════════════════════════════════════ */

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

/* Shared auth page chrome (background, glow, theme toggle, mascot) */
function AuthPageShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(192,86,64,0.07) 0%, transparent 70%)',
          filter: 'blur(48px)',
        }}
      />
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 z-10"
        style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {children}

      {/* Mascot watermark */}
      <img
        src="/assets/mascot-watermark.png"
        alt=""
        className="fixed bottom-0 right-0 w-48 opacity-[0.04] pointer-events-none select-none"
        aria-hidden="true"
      />
      <style>{`
        @keyframes dropin-spin { to { transform: rotate(360deg); } }
        @keyframes dropin-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .dropin-fadein { animation: dropin-fadein 0.25s ease both; }
      `}</style>
    </div>
  );
}

/* Shared logo header used in both auth cards */
function AuthLogo() {
  return (
    <div className="flex flex-col items-center mb-7">
      <img
        src="/assets/logo-lockup.png"
        alt="dropin.bot"
        className="h-9 w-auto mb-5"
        onError={e => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = 'none';
          const fb = el.nextElementSibling as HTMLElement;
          if (fb) fb.style.display = 'flex';
        }}
      />
      <div className="hidden items-center gap-3 mb-5">
        <img src="/assets/logo-icon.png" alt="" className="w-9 h-9 rounded-[20%]" />
        <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          dropin<span className="font-normal">.bot</span>
        </span>
      </div>
    </div>
  );
}

/* SSO button row */
function SSOButtons({ loading, onSSO }: { loading: string | null; onSSO: (p: string) => void }) {
  const providers = [
    { id: 'github', label: 'GitHub',  Icon: GitHubIcon,  color: 'var(--text-primary)' },
    { id: 'google', label: 'Google',  Icon: GoogleIcon,  color: undefined },
    { id: 'apple',  label: 'Apple',   Icon: AppleIcon,   color: 'var(--text-primary)' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {providers.map(({ id, label, Icon, color }) => {
        const isLoading = loading === id;
        return (
          <button
            key={id}
            onClick={() => onSSO(id)}
            disabled={loading !== null}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              border: '1.5px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              opacity: loading !== null && !isLoading ? 0.45 : 1,
              cursor: loading !== null ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; e.currentTarget.style.background = 'rgba(192,86,64,0.04)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
          >
            <span style={{ color }}>
              {isLoading
                ? <span className="w-5 h-5 rounded-full border-2 inline-block" style={{ borderColor: 'var(--burnt-orange)', borderTopColor: 'transparent', animation: 'dropin-spin 0.7s linear infinite' }} />
                : <Icon />}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* Divider with label */
function OrDivider({ label = 'or continue with email' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
      <span className="font-mono text-[10px] uppercase whitespace-nowrap" style={{ color: 'var(--text-muted)', letterSpacing: '0.07em' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
    </div>
  );
}

/* Labelled input with optional left icon and right slot */
function AuthInput({
  label, id, type = 'text', placeholder, value, onChange, icon: Icon, rightSlot, error, autoComplete,
}: {
  label: string; id: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void;
  icon?: React.ElementType; rightSlot?: React.ReactNode;
  error?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-body font-medium text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl text-sm transition-all duration-200 outline-none"
          style={{
            background: 'var(--bg-primary)',
            border: `1.5px solid ${error ? 'rgba(220,38,38,0.6)' : 'var(--border-color)'}`,
            color: 'var(--text-primary)',
            padding: Icon ? '0.75rem 2.75rem 0.75rem 2.5rem' : '0.75rem 2.75rem 0.75rem 0.875rem',
            paddingRight: rightSlot ? '2.75rem' : '0.875rem',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = error ? 'rgba(220,38,38,0.8)' : 'var(--burnt-orange)'; e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(220,38,38,0.08)' : '0 0 0 3px rgba(192,86,64,0.10)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'rgba(220,38,38,0.6)' : 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && <p className="font-body text-xs mt-1.5" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

/* Password strength indicator */
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (p: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
    if (!p) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#DC2626' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'var(--burnt-orange)' };
    return { level: 3, label: 'Strong', color: '#2D7D46' };
  };
  const { level, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= level ? color : 'var(--border-color)' }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px]" style={{ color }}>{label}</p>
    </div>
  );
}

/* Primary CTA button */
function AuthButton({ children, onClick, disabled, loading }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 brand-gradient"
      style={{
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        boxShadow: disabled || loading ? 'none' : '0 4px 14px rgba(192,86,64,0.28)',
        transform: disabled || loading ? 'none' : undefined,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      {loading && (
        <span className="w-4 h-4 rounded-full border-2 inline-block" style={{ borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'white', animation: 'dropin-spin 0.7s linear infinite' }} />
      )}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════
   PAGE: LOGIN (Sign In + Sign Up tabs)
   ═══════════════════════════════════════════ */

function LoginPage() {
  const navigate = useNavigate();
  const { login, signUp, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  /* ── Sign In state ── */
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);
  const [siLoading, setSiLoading] = useState<string | null>(null);
  const [siErrors, setSiErrors] = useState<Record<string, string>>({});

  const validateSignIn = () => {
    const errs: Record<string, string> = {};
    if (!siEmail.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siEmail)) errs.email = 'Enter a valid email address.';
    if (!siPassword) errs.password = 'Password is required.';
    setSiErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = () => {
    if (!validateSignIn()) return;
    setSiLoading('email');
    setTimeout(() => { login('email', siEmail); navigate('/'); }, 1000);
  };

  const handleSSOSignIn = (provider: string) => {
    setSiLoading(provider);
    setTimeout(() => { login(provider); navigate('/'); }, 1200);
  };

  /* ── Sign Up state ── */
  const [suName, setSuName] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suShowPw, setSuShowPw] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);
  const [suLoading, setSuLoading] = useState<string | null>(null);
  const [suErrors, setSuErrors] = useState<Record<string, string>>({});

  const validateSignUp = () => {
    const errs: Record<string, string> = {};
    if (!suName.trim()) errs.name = 'Full name is required.';
    if (!suEmail.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)) errs.email = 'Enter a valid email address.';
    if (suPhone && !/^[+\d\s\-().]{7,20}$/.test(suPhone)) errs.phone = 'Enter a valid phone number.';
    if (!suPassword) errs.password = 'Password is required.';
    else if (suPassword.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!suConfirm) errs.confirm = 'Please confirm your password.';
    else if (suConfirm !== suPassword) errs.confirm = 'Passwords do not match.';
    setSuErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUp = () => {
    if (!validateSignUp()) return;
    setSuLoading('email');
    setTimeout(() => { signUp({ name: suName, email: suEmail, phone: suPhone || undefined, provider: 'email' }); navigate('/'); }, 1000);
  };

  const handleSSOSignUp = (provider: string) => {
    setSuLoading(provider);
    setTimeout(() => { signUp({ name: '', email: '', provider }); navigate('/'); }, 1200);
  };

  return (
    <AuthPageShell>
      <div className="relative w-full max-w-[420px] dropin-fadein">
        {/* Card */}
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <AuthLogo />

          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-7"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
          >
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: tab === t ? 'var(--bg-surface)' : 'transparent',
                  color: tab === t ? 'var(--burnt-orange)' : 'var(--text-muted)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                  border: tab === t ? '1px solid var(--border-color)' : '1px solid transparent',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ── SIGN IN ── */}
          {tab === 'signin' && (
            <div className="dropin-fadein">
              <div className="mb-6">
                <p className="section-label mb-0.5">welcome back</p>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Sign in to your dashboard</h1>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your OpenClaw bot instances</p>
              </div>

              <SSOButtons loading={siLoading} onSSO={handleSSOSignIn} />
              <OrDivider />

              <div className="space-y-4">
                <AuthInput
                  label="Email address" id="si-email" type="email"
                  placeholder="you@example.com" value={siEmail} onChange={setSiEmail}
                  icon={Mail} error={siErrors.email} autoComplete="email"
                />
                <AuthInput
                  label="Password" id="si-password"
                  type={siShowPw ? 'text' : 'password'}
                  placeholder="••••••••" value={siPassword} onChange={setSiPassword}
                  icon={Lock} error={siErrors.password} autoComplete="current-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setSiShowPw(v => !v)}
                      className="transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {siShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {/* Forgot password */}
              <div className="flex justify-end mt-2 mb-5">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="font-body text-xs transition-colors duration-150"
                  style={{ color: 'var(--burnt-orange)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Forgot password?
                </button>
              </div>

              <AuthButton onClick={handleSignIn} loading={siLoading === 'email'} disabled={siLoading !== null && siLoading !== 'email'}>
                Sign In
              </AuthButton>

              <p className="font-body text-sm text-center mt-5" style={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => setTab('signup')}
                  className="font-semibold inline-flex items-center gap-1 transition-opacity duration-150"
                  style={{ color: 'var(--burnt-orange)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Sign Up <ArrowRight size={14} />
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP ── */}
          {tab === 'signup' && (
            <div className="dropin-fadein">
              <div className="mb-6">
                <p className="section-label mb-0.5">create account</p>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Get started for free</h1>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Deploy your first bot in minutes</p>
              </div>

              <SSOButtons loading={suLoading} onSSO={handleSSOSignUp} />
              <OrDivider label="or sign up with email" />

              <div className="space-y-4">
                <AuthInput
                  label="Full name" id="su-name" placeholder="Jane Smith"
                  value={suName} onChange={setSuName}
                  icon={User} error={suErrors.name} autoComplete="name"
                />
                <AuthInput
                  label="Phone number (optional)" id="su-phone" type="tel"
                  placeholder="+1 555 000 0000"
                  value={suPhone} onChange={setSuPhone}
                  icon={Phone} error={suErrors.phone} autoComplete="tel"
                />
                <AuthInput
                  label="Email address" id="su-email" type="email"
                  placeholder="you@example.com"
                  value={suEmail} onChange={setSuEmail}
                  icon={Mail} error={suErrors.email} autoComplete="email"
                />
                <div>
                  <AuthInput
                    label="Password" id="su-password"
                    type={suShowPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={suPassword} onChange={setSuPassword}
                    icon={Lock} error={suErrors.password} autoComplete="new-password"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setSuShowPw(v => !v)}
                        className="transition-colors duration-150"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        {suShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <PasswordStrength password={suPassword} />
                </div>
                <AuthInput
                  label="Confirm password" id="su-confirm"
                  type={suShowConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={suConfirm} onChange={setSuConfirm}
                  icon={Lock} error={suErrors.confirm} autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setSuShowConfirm(v => !v)}
                      className="transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {suShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              <div className="mt-6">
                <AuthButton onClick={handleSignUp} loading={suLoading === 'email'} disabled={suLoading !== null && suLoading !== 'email'}>
                  Create Account
                </AuthButton>
              </div>

              <p className="font-body text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
                By creating an account you agree to our{' '}
                <a href="#" style={{ color: 'var(--burnt-orange)' }} className="underline underline-offset-2">Terms</a>
                {' '}and{' '}
                <a href="#" style={{ color: 'var(--burnt-orange)' }} className="underline underline-offset-2">Privacy Policy</a>.
              </p>

              <p className="font-body text-sm text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <button
                  onClick={() => setTab('signin')}
                  className="font-semibold transition-opacity duration-150"
                  style={{ color: 'var(--burnt-orange)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthPageShell>
  );
}

/* ═══════════════════════════════════════════
   PAGE: FORGOT PASSWORD
   ═══════════════════════════════════════════ */

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1100);
  };

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <AuthPageShell>
      <div className="relative w-full max-w-[400px] dropin-fadein">
        {/* Back link */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 mb-5 text-sm font-medium transition-all duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <AuthLogo />

          {!sent ? (
            <div className="dropin-fadein">
              <div className="mb-7">
                <p className="section-label mb-0.5">account recovery</p>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Reset your password</h1>
                <p className="font-body text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Enter your email and we'll send you a secure reset link.
                </p>
              </div>

              <div className="mb-5">
                <AuthInput
                  label="Email address" id="fp-email" type="email"
                  placeholder="you@example.com"
                  value={email} onChange={v => { setEmail(v); setError(''); }}
                  icon={Mail} error={error} autoComplete="email"
                />
              </div>

              <AuthButton onClick={handleSubmit} loading={loading}>
                Send Reset Link
              </AuthButton>
            </div>
          ) : (
            <div className="dropin-fadein text-center">
              {/* Success icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(45,125,70,0.10)' }}
              >
                <CheckCircle2 size={32} style={{ color: '#2D7D46' }} />
              </div>

              <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                Check your inbox
              </h2>
              <p className="font-body text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                We sent a reset link to
              </p>
              <p className="font-semibold text-sm mb-6" style={{ color: 'var(--burnt-orange)' }}>{email}</p>

              <div
                className="rounded-xl p-4 mb-6 text-left"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                <p className="font-mono text-[10px] uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>// next steps</p>
                {[
                  'Open the email from dropin.bot',
                  'Click the "Reset Password" link',
                  'Choose a new secure password',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-[10px] font-bold"
                      style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>{step}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleResend}
                disabled={resent}
                className="flex items-center gap-2 mx-auto text-sm font-medium transition-all duration-200"
                style={{ color: resent ? 'var(--text-muted)' : 'var(--burnt-orange)', cursor: resent ? 'default' : 'pointer' }}
              >
                <RefreshCw size={14} className={resent ? '' : ''} style={{ animation: resent ? 'dropin-spin 1s linear' : 'none' }} />
                {resent ? 'Sent!' : "Didn't receive it? Resend"}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full mt-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthPageShell>
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
  workspaces: Workspace[];
  addWorkspace: (w: Omit<Workspace, 'id' | 'isDefault' | 'connectedApps' | 'documents' | 'dataSources'>) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  getWorkspace: (id: string) => Workspace | undefined;
}>({
  instances: [],
  addInstance: () => {},
  updateInstance: () => {},
  deleteInstance: () => {},
  getInstance: () => undefined,
  workspaces: [],
  addWorkspace: () => {},
  updateWorkspace: () => {},
  deleteWorkspace: () => {},
  getWorkspace: () => undefined,
});

function useStore() { return useContext(StoreContext); }

function StoreProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<Instance[]>(INITIAL_INSTANCES);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);

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

  const addWorkspace = useCallback((data: Omit<Workspace, 'id' | 'isDefault' | 'connectedApps' | 'documents' | 'dataSources' | 'mcps' | 'env'>) => {
    const newWs: Workspace = {
      ...data,
      id: 'ws-' + Date.now(),
      connectedApps: CONNECTED_APPS_TEMPLATE.map(a => ({ ...a, connected: false })),
      documents: [],
      dataSources: [],
      mcps: [],
      env: [],
    };
    setWorkspaces(prev => [...prev, newWs]);
  }, []);
  const updateWorkspace = useCallback((id: string, data: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
  }, []);
  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => {
      const target = prev.find(w => w.id === id);
      if (!target || target.isDefault) return prev; // cannot delete default
      return prev.filter(w => w.id !== id);
    });
  }, []);
  const getWorkspace = useCallback((id: string) => workspaces.find(w => w.id === id), [workspaces]);

  return (
    <StoreContext.Provider value={{
      instances, addInstance, updateInstance, deleteInstance, getInstance,
      workspaces, addWorkspace, updateWorkspace, deleteWorkspace, getWorkspace,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

/* ═══════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════ */

const navItems = [
  { icon: Layers,    label: 'Workspaces', path: '/workspace' },
  { icon: Bot,       label: 'Agents',    path: '/agents' },
  { icon: Settings,  label: 'Settings',  path: '/settings' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
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
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
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

function AgentsPage() {
  const navigate = useNavigate();
  const { instances, workspaces } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Instance['status']>('all');

  const filtered = instances.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-4 flex items-center justify-between gap-4" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <p className="section-label mb-0">Agents</p>
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Your Agents</h1>
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
                      { label: 'Uptime',    value: inst.uptime },
                      { label: 'Sessions',  value: inst.conversations },
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

function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile'|'security'|'notifications'|'billing'|'account'>('profile');
  const tabs = ['profile','security','notifications','billing','account'];
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-20 px-6 lg:px-10 h-16 flex items-center justify-between" style={{ background: 'var(--bg-primary)' }}>
        <div>
          <p className="section-label mb-0">// preferences</p>
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        </div>
      </div>
      <div className="px-6 lg:px-10 pb-12 flex flex-col lg:flex-row">
        <div className="w-full lg:w-48 mb-4 lg:mb-0">
          <div className="flex flex-col space-y-1">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t as any)} className="text-left px-3 py-2 rounded-md font-medium"
                style={{
                  background: activeTab===t ? 'rgba(192,86,64,0.10)' : 'transparent',
                  color: activeTab===t ? 'var(--burnt-orange)' : 'var(--text-primary)'
                }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-6 lg:p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--burnt-orange)', color: 'white', fontFamily: 'Space Grotesk' }}>{user?.name?.[0] ?? 'U'}</div>
                <div>
                  <p className="font-display font-bold text-lg">{user?.name}</p>
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email} <span className="ml-1 px-1.5 py-0.5 bg-rgba(0,128,0,0.1) text-rgba(0,128,0) text-xs rounded">verified</span></p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="section-label mb-1">Full Name</label>
                  <input className="form-input" defaultValue={user?.name} />
                </div>
                <div>
                  <label className="section-label mb-1">Phone</label>
                  <input className="form-input" placeholder="+1 555 000 0000" />
                </div>
                <div className="md:col-span-2">
                  <label className="section-label mb-1">Bio</label>
                  <textarea className="form-input" rows={3} placeholder="Tell us about yourself..." />
                </div>
              </div>
              <button className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient">
                Save Changes
              </button>
            </div>
          )}
          {activeTab === 'security' && (
            <div>
              <p className="section-label mb-1">Change Password</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="form-input" type="password" placeholder="Current password" />
                <input className="form-input" type="password" placeholder="New password" />
                <input className="form-input" type="password" placeholder="Confirm password" />
              </div>
              <button className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient">
                Update Password
              </button>
              <div className="mt-6">
                <p className="section-label mb-1">Two‑Factor Authentication</p>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>Enable 2FA for extra security</p>
                  </div>
                  <button className="w-11 h-6 rounded-full" style={{ background: 'var(--border-color)' }}>
                    <span className="block w-5 h-5 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'notifications' && (
            <div>
              {['Email Digests','Conversation Alerts','Usage Warnings','Security Alerts','Product Updates'].map(item => (
                <div key={item} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>{item}</p>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>Enable to receive {item.toLowerCase()}</p>
                  </div>
                  <button className="w-11 h-6 rounded-full" style={{ background: 'var(--border-color)' }}>
                    <span className="block w-5 h-5 bg-white rounded-full shadow" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'billing' && (
            <div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Current Plan</p>
                <h2 className="font-display font-bold text-xl">Pro Plan</h2>
                <ul className="list-disc pl-5 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li>Unlimited instances</li>
                  <li>Priority support</li>
                  <li>Advanced analytics</li>
                </ul>
                <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white brand-gradient">
                  Upgrade
                </button>
              </div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Usage</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-var(--border-color) rounded-full overflow-hidden">
                    <div className="h-full bg-var(--burnt-orange)" style={{ width: '70%' }} />
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--text-primary)' }}>70%</span>
                </div>
                <p className="font-body text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Conversations used / limit</p>
              </div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Payment Method</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm">Visa ending 4242</span>
                  </div>
                  <button className="px-3 py-1 rounded-full text-sm font-medium bg-var(--bg-surface)" style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Update</button>
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Billing History</p>
                <ul className="space-y-2">
                  {[{date:'2024-04-01',amount:49.99},{date:'2024-03-01',amount:49.99},{date:'2024-02-01',amount:49.99}].map((inv,i)=>(
                    <li key={i} className="flex items-center justify-between">
                      <span className="font-body text-sm">{inv.date}</span>
                      <span className="font-body text-sm">${inv.amount}</span>
                      <button className="text-sm font-medium underline" style={{ color: 'var(--burnt-orange)' }}>Download</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'account' && (
            <div>
              <div className="rounded-2xl p-5 mb-4 border border-red-600" style={{ background: 'var(--bg-primary)' }}>
                <p className="section-label mb-1 text-red-600">Delete Account</p>
                <p className="font-body text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>This action cannot be undone. All data will be lost.</p>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-red-600 hover:-translate-y-0.5" style={{ boxShadow: '0 4px 12px rgba(220,38,38,0.25)' }}>
                  Delete Account
                </button>
              </div>
              <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white brand-gradient">
                Export Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: WORKSPACE
   ═══════════════════════════════════════════ */

function WorkspacePage() {
  const navigate = useNavigate();
  const { workspaces, addWorkspace, updateWorkspace, deleteWorkspace, instances } = useStore();
  const [activeWsId, setActiveWsId] = useState<string>(() => workspaces[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<'apps' | 'tools' | 'mcps' | 'env'>('env');
  const [showNewWsModal, setShowNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [toolSearch, setToolSearch] = useState('');
  const [toolSearchOpen, setToolSearchOpen] = useState(false);
  const [workspaceTools, setWorkspaceTools] = useState<{ label: string; config: Record<string, string>; expanded: boolean }[]>([]);

  const addTool = (label: string) => {
    if (workspaceTools.find(t => t.label === label)) return;
    setWorkspaceTools(prev => [...prev, { label, config: {}, expanded: true }]);
    setToolSearch(''); setToolSearchOpen(false);
  };
  const removeTool = (label: string) => setWorkspaceTools(prev => prev.filter(t => t.label !== label));
  const toggleToolExpanded = (label: string) => setWorkspaceTools(prev => prev.map(t => t.label === label ? { ...t, expanded: !t.expanded } : t));
  const updateToolConfig = (label: string, key: string, value: string) => setWorkspaceTools(prev => prev.map(t => t.label === label ? { ...t, config: { ...t.config, [key]: value } } : t));

  const getToolStatus = (tool: { label: string; config: Record<string, string> }): 'unconfigured' | 'configuring' | 'ready' => {
    const def = RECOMMENDED_SKILLS.find(s => s.label === tool.label);
    if (!def || def.configFields.length === 0) return 'ready';
    const required = def.configFields.filter(f => f.required);
    const allFilled = required.every(f => (tool.config[f.key] ?? '').trim() !== '');
    const anyFilled = def.configFields.some(f => (tool.config[f.key] ?? '').trim() !== '');
    if (allFilled) return 'ready';
    if (anyFilled) return 'configuring';
    return 'unconfigured';
  };

  // MCP state (workspace-level)
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
  const toggleWsMcpExpanded = (name: string) => setWsMcpExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
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

  // Environment tab state
  const [envSelectedId, setEnvSelectedId] = useState<string | null>(null);
  const [envExpanded, setEnvExpanded] = useState<Set<string>>(new Set(['e1', 'f1']));
  const [envViewMode, setEnvViewMode] = useState<'grid' | 'list'>('list');
  const [envSortBy, setEnvSortBy] = useState<'name' | 'modified' | 'size' | 'type'>('name');
  const [envSortDir, setEnvSortDir] = useState<'asc' | 'desc'>('asc');
  const [envSearch, setEnvSearch] = useState('');
  const [envFilterType, setEnvFilterType] = useState<string>('all');

  const toggleEnvExpanded = (id: string) => {
    setEnvExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Find a node by id in the tree
  const findEnvNode = (nodes: EnvNode[], id: string): EnvNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) { const found = findEnvNode(n.children, id); if (found) return found; }
    }
    return null;
  };

  const activeWs = workspaces.find(w => w.id === activeWsId) ?? workspaces[0];
  const attachedAgents = instances.filter(i => i.workspaceId === activeWs?.id);

  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) return;
    addWorkspace({ name: newWsName.trim(), description: newWsDesc.trim(), mcps: [], env: [] });
    setNewWsName(''); setNewWsDesc(''); setShowNewWsModal(false);
    // Switch to last workspace (the one just added)
    setTimeout(() => {
      const latest = workspaces[workspaces.length - 1];
      if (latest) setActiveWsId(latest.id);
    }, 50);
  };

  const toggleApp = (appId: string) => {
    if (!activeWs) return;
    updateWorkspace(activeWs.id, {
      connectedApps: activeWs.connectedApps.map(a => a.id === appId ? { ...a, connected: !a.connected } : a),
    });
  };

  const tabs = [
    { id: 'env',       label: 'Files',          icon: FolderOpen },
    { id: 'tools',     label: 'Tools',          icon: Zap },
    { id: 'mcps',      label: 'MCP Servers',    icon: Plug },
    { id: 'apps',      label: 'Connected Apps', icon: Wifi },
  ] as const;

  if (!activeWs) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-6 lg:px-10 h-16 flex items-center justify-between" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <p className="section-label mb-0">// resources</p>
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Workspaces</h1>
        </div>
        <button
          onClick={() => setShowNewWsModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient"
          style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}
        >
          <Plus size={16} /> New Workspace
        </button>
      </div>

      <div className="flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left panel — workspace list */}
        <div className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r pt-6 pb-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}>
          <p className="section-label px-4 mb-3">// workspaces</p>
          <div className="flex-1 overflow-y-auto px-2">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => setActiveWsId(ws.id)}
                className="w-full text-left px-3 py-3 rounded-xl mb-1 transition-all duration-200"
                style={{
                  background: activeWsId === ws.id ? 'rgba(192,86,64,0.10)' : 'transparent',
                  border: activeWsId === ws.id ? '1px solid rgba(192,86,64,0.25)' : '1px solid transparent',
                }}
              >
                <p className="font-display font-semibold text-sm truncate" style={{ color: activeWsId === ws.id ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{ws.name}</p>
                {ws.isDefault && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide" style={{ background: 'rgba(192,86,64,0.12)', color: 'var(--burnt-orange)' }}>Default</span>
                )}
                <p className="font-body text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{ws.description}</p>
              </button>
            ))}
          </div>
          <div className="px-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setShowNewWsModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <PlusCircle size={16} /> New Workspace
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto">
          {/* Workspace header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-display font-bold text-2xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {activeWs.name}
                {activeWs.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(192,86,64,0.12)', color: 'var(--burnt-orange)', border: '1px solid rgba(192,86,64,0.25)' }}>Default</span>
                )}
              </h2>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{activeWs.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/workspace/${activeWs.id}/policy`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                title="Access policy"
              >
                <Lock size={14} /> Policy
              </button>
              <button
                onClick={() => { if (!activeWs.isDefault && workspaces.length > 1 && confirm(`Delete "${activeWs.name}"?`)) { deleteWorkspace(activeWs.id); setActiveWsId(workspaces.find(w => w.id !== activeWs.id)?.id ?? ''); } }}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: activeWs.isDefault ? 'var(--border-color)' : 'var(--text-muted)', cursor: activeWs.isDefault ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!activeWs.isDefault) { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; } }}
                onMouseLeave={e => { e.currentTarget.style.color = activeWs.isDefault ? 'var(--border-color)' : 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                title={activeWs.isDefault ? 'Cannot delete the default workspace' : 'Delete workspace'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Attached agents */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Attached agents:</span>
            {attachedAgents.length === 0
              ? <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>None</span>
              : attachedAgents.map(a => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/agents/${a.id}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
                  style={{ background: 'rgba(192,86,64,0.08)', color: 'var(--burnt-orange)', border: '1px solid rgba(192,86,64,0.20)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(192,86,64,0.08)'}
                >
                  <Bot size={12} /> {a.name}
                </button>
              ))
            }
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  background: activeTab === t.id ? 'rgba(192,86,64,0.10)' : 'transparent',
                  color: activeTab === t.id ? 'var(--burnt-orange)' : 'var(--text-secondary)',
                  border: activeTab === t.id ? '1.5px solid var(--burnt-orange)' : '1.5px solid var(--border-color)',
                }}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>


          {/* TAB: Connected Apps */}
          {activeTab === 'apps' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeWs.connectedApps.map(app => (
                <div key={app.id} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{app.icon}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: app.connected ? 'rgba(45,125,70,0.10)' : 'rgba(192,86,64,0.08)', color: app.connected ? '#2D7D46' : 'var(--text-muted)' }}>
                      {app.connected ? '● Connected' : '○ Not connected'}
                    </span>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{app.name}</p>
                    <p className="font-body text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{app.description}</p>
                  </div>
                  <button
                    onClick={() => toggleApp(app.id)}
                    className="mt-auto w-full py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                    style={app.connected
                      ? { border: '1.5px solid #DC2626', color: '#DC2626', background: 'transparent' }
                      : { background: 'linear-gradient(135deg, #C05640, #F39075)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }
                    }
                    onMouseEnter={e => { if (app.connected) e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
                    onMouseLeave={e => { if (app.connected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {app.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tools' && (
            <div>
              {/* Search bar to add tools */}
              <div className="relative mb-5">
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
                  <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Search above to add tools to this workspace.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workspaceTools.map(tool => {
                    const def = RECOMMENDED_SKILLS.find(s => s.label === tool.label);
                    if (!def) return null;
                    const status = getToolStatus(tool);
                    const statusStyle = {
                      ready:        { dot: '#2D7D46', label: 'Ready',       border: 'rgba(45,125,70,0.25)',   bg: 'rgba(45,125,70,0.05)'   },
                      configuring:  { dot: '#C05640', label: 'Configuring', border: 'rgba(192,86,64,0.25)',  bg: 'rgba(192,86,64,0.05)'  },
                      unconfigured: { dot: '#DC2626', label: 'Not configured', border: 'rgba(220,38,38,0.25)', bg: 'rgba(220,38,38,0.04)' },
                    }[status];
                    return (
                      <div key={tool.label} className="rounded-2xl overflow-hidden transition-all duration-200" style={{ border: `1px solid ${statusStyle.border}`, background: statusStyle.bg }}>
                        {/* Header row */}
                        <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => toggleToolExpanded(tool.label)}>
                          {/* Status dot */}
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

                        {/* Config fields */}
                        {tool.expanded && def.configFields.length > 0 && (
                          <div className="px-5 pb-5 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                            {def.configFields.map(field => (
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
          )}

          {/* MCP Servers tab */}
          {activeTab === 'mcps' && (
            <div>
              {/* Search bar */}
              <div className="relative mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input
                  className="form-input pl-8 w-full"
                  placeholder="Search MCP servers to add…"
                  value={mcpSearch}
                  onChange={e => { setMcpSearch(e.target.value); setMcpSearchOpen(true); }}
                  onFocus={() => setMcpSearchOpen(true)}
                  onKeyDown={e => { if (e.key === 'Escape') setMcpSearchOpen(false); }}
                />
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
                <div className="text-center py-10 rounded-2xl" style={{ border: '1.5px dashed var(--border-color)' }}>
                  <Plug size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
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
          )}

          {/* ── Environment tab ── */}
          {activeTab === 'env' && (() => {
            const envNodes = activeWs.env;

            // Helper: file type → icon + colour
            const fileIcon = (type: EnvFileType, size = 16) => {
              const cls = { color: '' };
              switch (type) {
                case 'folder':    cls.color = '#C05640'; return <Folder size={size} style={{ color: cls.color }} />;
                case 'py':        cls.color = '#3B82F6'; return <FileCode size={size} style={{ color: cls.color }} />;
                case 'ts':
                case 'js':        cls.color = '#F59E0B'; return <FileCode size={size} style={{ color: cls.color }} />;
                case 'json':      cls.color = '#10B981'; return <FileJson size={size} style={{ color: cls.color }} />;
                case 'md':        cls.color = '#6366F1'; return <FileText size={size} style={{ color: cls.color }} />;
                case 'yaml':
                case 'sh':        cls.color = '#EC4899'; return <FileCode size={size} style={{ color: cls.color }} />;
                case 'img':       cls.color = '#8B5CF6'; return <Image size={size} style={{ color: cls.color }} />;
                case 'video':     cls.color = '#EF4444'; return <Video size={size} style={{ color: cls.color }} />;
                case 'audio':     cls.color = '#14B8A6'; return <Music size={size} style={{ color: cls.color }} />;
                case 'zip':       cls.color = '#F97316'; return <Archive size={size} style={{ color: cls.color }} />;
                default:          cls.color = 'var(--text-muted)'; return <File size={size} style={{ color: cls.color }} />;
              }
            };

            // Recursive tree node renderer
            const renderTree = (nodes: EnvNode[], depth = 0): React.ReactNode => nodes.map(node => {
              const isFolder = node.type === 'folder';
              const isExpanded = envExpanded.has(node.id);
              const isSelected = envSelectedId === node.id;
              return (
                <div key={node.id}>
                  <button
                    className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-left transition-all duration-150 group"
                    style={{
                      paddingLeft: `${8 + depth * 16}px`,
                      background: isSelected ? 'rgba(192,86,64,0.10)' : 'transparent',
                      color: isSelected ? 'var(--burnt-orange)' : 'var(--text-primary)',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(192,86,64,0.05)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => {
                      setEnvSelectedId(node.id);
                      if (isFolder) toggleEnvExpanded(node.id);
                    }}
                  >
                    {/* Chevron for folders */}
                    <span className="w-4 flex-shrink-0 flex items-center justify-center">
                      {isFolder
                        ? (isExpanded
                            ? <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                            : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />)
                        : null}
                    </span>
                    {/* Icon */}
                    <span className="flex-shrink-0">
                      {isFolder
                        ? (isExpanded
                            ? <FolderOpen size={15} style={{ color: 'var(--burnt-orange)' }} />
                            : <Folder size={15} style={{ color: 'var(--burnt-orange)' }} />)
                        : fileIcon(node.type, 15)}
                    </span>
                    <span className="font-body text-sm truncate flex-1" style={{ color: isSelected ? 'var(--burnt-orange)' : 'var(--text-primary)' }}>{node.name}</span>
                  </button>
                  {isFolder && isExpanded && node.children && (
                    <div>{renderTree(node.children, depth + 1)}</div>
                  )}
                </div>
              );
            });

            // Get contents for right panel
            const selectedNode = envSelectedId ? findEnvNode(envNodes, envSelectedId) : null;
            const folderForPanel: EnvNode | null = selectedNode?.type === 'folder' ? selectedNode : null;
            const rawContents: EnvNode[] = folderForPanel ? (folderForPanel.children ?? []) : envNodes;

            // Filter
            const filtered = rawContents.filter(n => {
              const matchSearch = n.name.toLowerCase().includes(envSearch.toLowerCase());
              const matchType = envFilterType === 'all' || n.type === envFilterType || (envFilterType === 'folder' && n.type === 'folder');
              return matchSearch && matchType;
            });

            // Sort
            const sorted = [...filtered].sort((a, b) => {
              // folders always first
              if (a.type === 'folder' && b.type !== 'folder') return -1;
              if (b.type === 'folder' && a.type !== 'folder') return 1;
              let cmp = 0;
              if (envSortBy === 'name') cmp = a.name.localeCompare(b.name);
              else if (envSortBy === 'type') cmp = a.type.localeCompare(b.type);
              else if (envSortBy === 'modified') cmp = a.modifiedAt.localeCompare(b.modifiedAt);
              else if (envSortBy === 'size') cmp = (a.size ?? '').localeCompare(b.size ?? '');
              return envSortDir === 'asc' ? cmp : -cmp;
            });

            // Breadcrumb path
            const getBreadcrumb = (): string[] => {
              if (!selectedNode) return ['root'];
              const path: string[] = [];
              const walk = (nodes: EnvNode[], target: string): boolean => {
                for (const n of nodes) {
                  if (n.id === target) { path.push(n.name); return true; }
                  if (n.children && walk(n.children, target)) { path.unshift(n.name); return true; }
                }
                return false;
              };
              walk(envNodes, selectedNode.id);
              return ['root', ...path.slice(0, -1)];
            };
            const breadcrumb = getBreadcrumb();

            // Unique file types in current folder for filter
            const typesInFolder = Array.from(new Set(rawContents.map(n => n.type)));

            return (
              <div className="flex gap-0 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)', minHeight: '520px' }}>

                {/* ── Left: Tree panel ── */}
                <div className="w-56 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                  <div className="px-3 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>// files</span>
                    <button
                      className="p-1 rounded-lg transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; e.currentTarget.style.background = 'rgba(192,86,64,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      title="New folder"
                    >
                      <FolderPlus size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {/* Root entry */}
                    <button
                      className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-left transition-all duration-150 mb-0.5"
                      style={{
                        background: envSelectedId === null ? 'rgba(192,86,64,0.10)' : 'transparent',
                        color: envSelectedId === null ? 'var(--burnt-orange)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => { if (envSelectedId !== null) e.currentTarget.style.background = 'rgba(192,86,64,0.05)'; }}
                      onMouseLeave={e => { if (envSelectedId !== null) e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => setEnvSelectedId(null)}
                    >
                      <span className="w-4" />
                      <FolderOpen size={15} style={{ color: 'var(--burnt-orange)', flexShrink: 0 }} />
                      <span className="font-body text-sm font-medium truncate">root</span>
                    </button>
                    {renderTree(envNodes)}
                  </div>
                </div>

                {/* ── Right: Content panel ── */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Toolbar */}
                  <div className="flex items-center gap-2 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 flex-1 min-w-0 mr-2">
                      {breadcrumb.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                          <span className="font-mono text-[11px]" style={{ color: i === breadcrumb.length - 1 ? 'var(--burnt-orange)' : 'var(--text-muted)' }}>{crumb}</span>
                        </span>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                      <input
                        className="form-input pl-7 py-1.5 text-xs w-36"
                        placeholder="Search…"
                        value={envSearch}
                        onChange={e => setEnvSearch(e.target.value)}
                      />
                    </div>

                    {/* Type filter */}
                    {typesInFolder.length > 1 && (
                      <select
                        className="form-input form-select py-1.5 text-xs"
                        value={envFilterType}
                        onChange={e => setEnvFilterType(e.target.value)}
                      >
                        <option value="all">All types</option>
                        {typesInFolder.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    )}

                    {/* Sort */}
                    <select
                      className="form-input form-select py-1.5 text-xs"
                      value={envSortBy}
                      onChange={e => setEnvSortBy(e.target.value as typeof envSortBy)}
                    >
                      <option value="name">Name</option>
                      <option value="modified">Modified</option>
                      <option value="size">Size</option>
                      <option value="type">Type</option>
                    </select>

                    {/* Sort direction */}
                    <button
                      className="p-1.5 rounded-lg transition-colors duration-150"
                      style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                      onClick={() => setEnvSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                      title={envSortDir === 'asc' ? 'Ascending' : 'Descending'}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; e.currentTarget.style.borderColor = 'var(--burnt-orange)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    >
                      {envSortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                    </button>

                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                      <button
                        className="p-1.5 transition-colors duration-150"
                        style={{ background: envViewMode === 'list' ? 'rgba(192,86,64,0.10)' : 'transparent', color: envViewMode === 'list' ? 'var(--burnt-orange)' : 'var(--text-muted)' }}
                        onClick={() => setEnvViewMode('list')}
                        title="List view"
                      ><List size={14} /></button>
                      <button
                        className="p-1.5 transition-colors duration-150"
                        style={{ background: envViewMode === 'grid' ? 'rgba(192,86,64,0.10)' : 'transparent', color: envViewMode === 'grid' ? 'var(--burnt-orange)' : 'var(--text-muted)', borderLeft: '1px solid var(--border-color)' }}
                        onClick={() => setEnvViewMode('grid')}
                        title="Grid view"
                      ><LayoutGrid size={14} /></button>
                    </div>
                  </div>

                  {/* File count */}
                  <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {sorted.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <FolderOpen size={36} style={{ color: 'var(--text-muted)' }} />
                        <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>This folder is empty</p>
                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Upload files or create a new folder to get started.</p>
                      </div>
                    ) : envViewMode === 'list' ? (
                      /* ── List view ── */
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                        {/* Header row */}
                        <div className="grid text-left px-4 py-2" style={{ gridTemplateColumns: '1fr 80px 140px 80px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                          {(['Name', 'Type', 'Modified', 'Size'] as const).map(col => (
                            <button
                              key={col}
                              className="font-mono text-[10px] uppercase tracking-widest text-left transition-colors duration-150"
                              style={{ color: envSortBy === col.toLowerCase() ? 'var(--burnt-orange)' : 'var(--text-muted)' }}
                              onClick={() => {
                                const key = col.toLowerCase() as typeof envSortBy;
                                if (envSortBy === key) setEnvSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setEnvSortBy(key); setEnvSortDir('asc'); }
                              }}
                            >{col} {envSortBy === col.toLowerCase() ? (envSortDir === 'asc' ? '↑' : '↓') : ''}</button>
                          ))}
                        </div>
                        {sorted.map((node, i) => {
                          const isFolder = node.type === 'folder';
                          return (
                            <div
                              key={node.id}
                              className="grid items-center px-4 py-3 cursor-pointer transition-all duration-150 group"
                              style={{
                                gridTemplateColumns: '1fr 80px 140px 80px',
                                borderTop: i > 0 ? '1px solid var(--border-color)' : 'none',
                                background: 'transparent',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,86,64,0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              onDoubleClick={() => {
                                setEnvSelectedId(node.id);
                                if (isFolder) setEnvExpanded(prev => { const n = new Set(prev); n.add(node.id); return n; });
                              }}
                              onClick={() => setEnvSelectedId(node.id)}
                            >
                              {/* Name */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isFolder
                                  ? <FolderOpen size={16} style={{ color: 'var(--burnt-orange)', flexShrink: 0 }} />
                                  : fileIcon(node.type, 16)}
                                <span className="font-body text-sm truncate" style={{ color: 'var(--text-primary)' }}>{node.name}</span>
                              </div>
                              {/* Type */}
                              <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{node.type}</span>
                              {/* Modified */}
                              <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{node.modifiedAt}</span>
                              {/* Size */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{node.size ?? (isFolder ? '—' : '—')}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150">
                                  <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Download"><Download size={12} /></button>
                                  <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Copy path"><Copy size={12} /></button>
                                  <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="More"><MoreHorizontal size={12} /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* ── Grid view ── */
                      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                        {sorted.map(node => {
                          const isFolder = node.type === 'folder';
                          return (
                            <div
                              key={node.id}
                              className="flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all duration-150 group"
                              style={{ border: '1px solid var(--border-color)', background: 'transparent' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,86,64,0.05)'; e.currentTarget.style.borderColor = 'rgba(192,86,64,0.30)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                              onDoubleClick={() => {
                                setEnvSelectedId(node.id);
                                if (isFolder) setEnvExpanded(prev => { const n = new Set(prev); n.add(node.id); return n; });
                              }}
                              onClick={() => setEnvSelectedId(node.id)}
                            >
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: isFolder ? 'rgba(192,86,64,0.10)' : 'rgba(99,102,241,0.08)' }}>
                                {isFolder
                                  ? <FolderOpen size={26} style={{ color: 'var(--burnt-orange)' }} />
                                  : fileIcon(node.type, 26)}
                              </div>
                              <span className="font-body text-xs text-center leading-tight w-full truncate" style={{ color: 'var(--text-primary)' }}>{node.name}</span>
                              <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>{node.size ?? node.type}</span>
                              {/* Hover actions */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150">
                                <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Download"><Download size={11} /></button>
                                <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="More"><MoreHorizontal size={11} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

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
                <input className="form-input w-full" placeholder="e.g. Marketing Workspace" value={newWsName} onChange={e => setNewWsName(e.target.value)} />
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
    </div>
  );
}



const PRESET_MCPS: { name: string; desc: string; urlPlaceholder: string; requiresKey: boolean }[] = [
  { name: 'GitHub',          desc: 'Read repos, issues, PRs and commit history.',          urlPlaceholder: 'https://mcp.github.com',           requiresKey: true  },
  { name: 'Notion',          desc: 'Read and write Notion pages and databases.',            urlPlaceholder: 'https://mcp.notion.so',             requiresKey: true  },
  { name: 'Slack',           desc: 'Post messages and read channel history.',               urlPlaceholder: 'https://mcp.slack.com',             requiresKey: true  },
  { name: 'Google Drive',    desc: 'Access and search files in Google Drive.',              urlPlaceholder: 'https://mcp.googleapis.com/drive',  requiresKey: true  },
  { name: 'Linear',          desc: 'Manage issues, projects and cycles.',                   urlPlaceholder: 'https://mcp.linear.app',            requiresKey: true  },
  { name: 'Jira',            desc: 'Create and update Jira tickets and sprints.',           urlPlaceholder: 'https://mcp.atlassian.com/jira',    requiresKey: true  },
  { name: 'Postgres',        desc: 'Query a PostgreSQL database directly.',                 urlPlaceholder: 'https://mcp.example.com/postgres',  requiresKey: false },
  { name: 'Stripe',          desc: 'Retrieve payments, customers and subscriptions.',       urlPlaceholder: 'https://mcp.stripe.com',            requiresKey: true  },
  { name: 'Browserbase',     desc: 'Headless browser automation and web scraping.',         urlPlaceholder: 'https://mcp.browserbase.com',       requiresKey: true  },
  { name: 'Filesystem',      desc: 'Read and write local or remote file systems.',          urlPlaceholder: 'http://localhost:3100',              requiresKey: false },
  { name: 'Custom MCP',      desc: 'Connect any MCP-compatible server by URL.',             urlPlaceholder: 'https://your-mcp-server.com',       requiresKey: false },
];

const MODELS: { id: string; label: string; updatedAt: string; description: string; stats: { intelligence: number; cost: number; speed: number } }[] = [
  { id: 'GPT-4',      label: 'GPT-4',      updatedAt: 'Nov 2023', description: 'Best for complex reasoning, coding, and nuanced instruction-following.', stats: { intelligence: 9, cost: 3, speed: 5 } },
  { id: 'GPT-4o',     label: 'GPT-4o',     updatedAt: 'May 2024', description: 'Faster multimodal model — great for real-time chat and vision tasks.',   stats: { intelligence: 9, cost: 5, speed: 8 } },
  { id: 'Claude 3',   label: 'Claude 3',   updatedAt: 'Mar 2024', description: 'Excels at long-context analysis, summarisation, and safe outputs.',       stats: { intelligence: 8, cost: 5, speed: 6 } },
  { id: 'Claude 3.5', label: 'Claude 3.5', updatedAt: 'Jun 2024', description: "Anthropic's most capable model — top-tier coding and reasoning.",         stats: { intelligence: 10, cost: 4, speed: 7 } },
  { id: 'Llama 3',    label: 'Llama 3',    updatedAt: 'Apr 2024', description: 'Open-weight model ideal for self-hosted, privacy-first deployments.',      stats: { intelligence: 7, cost: 9, speed: 7 } },
  { id: 'Mistral',    label: 'Mistral 7B', updatedAt: 'Sep 2023', description: 'Lightweight and fast — great for high-throughput, low-latency tasks.',    stats: { intelligence: 6, cost: 10, speed: 10 } },
  { id: 'Gemini Pro', label: 'Gemini Pro', updatedAt: 'Dec 2023', description: "Google's multimodal model with strong search-augmented reasoning.",        stats: { intelligence: 8, cost: 6, speed: 7 } },
];

const SKILL_TAGS = {
  external: { label: 'External Call', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  read:     { label: 'Read',          color: '#2563EB', bg: 'rgba(37,99,235,0.10)'  },
  write:    { label: 'Write',         color: '#C05640', bg: 'rgba(192,86,64,0.10)'  },
} as const;
type SkillTag = keyof typeof SKILL_TAGS;

interface ToolConfigField { key: string; label: string; placeholder: string; required: boolean; secret?: boolean; }

const RECOMMENDED_SKILLS: { label: string; desc: string; tags: SkillTag[]; configFields: ToolConfigField[] }[] = [
  { label: 'Weather',                desc: 'Real-time forecasts and conditions',       tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'OpenWeatherMap API key', required: true, secret: true }] },
  { label: 'Stock Market',           desc: 'Equities, indices and market data',         tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Alpha Vantage or Polygon.io key', required: true, secret: true }] },
  { label: 'Commodities',            desc: 'Oil, gold, metals and raw materials',       tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Commodities data provider key', required: true, secret: true }] },
  { label: 'Crypto',                 desc: 'Cryptocurrency prices and trends',          tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'CoinGecko or CoinMarketCap key', required: false, secret: true }, { key: 'currency', label: 'Base Currency', placeholder: 'USD', required: false }] },
  { label: 'Web Browser',           desc: 'Browse and extract content from URLs',      tags: ['external', 'read'],  configFields: [{ key: 'maxPages', label: 'Max Pages per Request', placeholder: '5', required: false }] },
  { label: 'Web Search',            desc: 'Search the web for up-to-date info',        tags: ['external', 'read'],  configFields: [{ key: 'apiKey', label: 'Search API Key', placeholder: 'Brave / SerpAPI / Google key', required: true, secret: true }, { key: 'maxResults', label: 'Max Results', placeholder: '10', required: false }] },
  { label: 'Time & Timezone',       desc: 'Current time, dates and conversions',       tags: ['external'],          configFields: [] },
  { label: 'Summarization',         desc: 'Condense long content into key points',     tags: [],                    configFields: [{ key: 'maxLength', label: 'Max Summary Length (words)', placeholder: '200', required: false }] },
  { label: 'Translation',           desc: 'Translate text across languages',           tags: [],                    configFields: [{ key: 'defaultTarget', label: 'Default Target Language', placeholder: 'en', required: false }] },
  { label: 'Code Execution',        desc: 'Run and debug code snippets',               tags: ['external', 'write'], configFields: [{ key: 'sandbox', label: 'Sandbox URL', placeholder: 'https://sandbox.example.com', required: true }] },
  { label: 'Image Generation',      desc: 'Create images from text prompts',           tags: ['external', 'write'], configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'OpenAI / Stability AI key', required: true, secret: true }, { key: 'model', label: 'Model', placeholder: 'dall-e-3', required: false }] },
  { label: 'Email Drafting',        desc: 'Compose and format emails',                 tags: ['write'],             configFields: [] },
  { label: 'Calendar & Scheduling', desc: 'Manage events and reminders',               tags: ['read', 'write'],     configFields: [{ key: 'calendarId', label: 'Calendar ID', placeholder: 'primary', required: true }] },
  { label: 'PDF & Document Reader', desc: 'Parse and extract text from files',         tags: ['read'],              configFields: [{ key: 'maxPages', label: 'Max Pages', placeholder: '50', required: false }] },
  { label: 'SQL Query',             desc: 'Write and explain database queries',        tags: ['read', 'write'],     configFields: [{ key: 'connectionString', label: 'Connection String', placeholder: 'postgresql://user:pass@host/db', required: true, secret: true }] },
];

function AgentConfigPage({ mode }: { mode: 'new' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addInstance, updateInstance, deleteInstance, getInstance, workspaces } = useStore();
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
    workspaceId: existing?.workspaceId ?? null as string | null,
    memories: existing?.memories ?? { conversationHistory: true, longTermMemory: false, crossSessionRecall: false, windowSize: 20, mem0: false, zep: false },
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
        personality: form.personality,
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
        personality: form.personality,
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
            <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
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
                                <span className="font-mono text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Updated {m.updatedAt}</span>
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
                          {statConfig.map(({ key, label, color }) => {
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
                                <span className="font-mono text-[10px] w-8 text-right flex-shrink-0" style={{ color }}>{val}<span style={{ color: 'var(--text-muted)' }}>/10</span></span>
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

              <div className="space-y-1">
                {([
                  { key: 'conversationHistory', label: 'Conversation History', desc: 'Remember messages within a session' },
                  { key: 'longTermMemory',       label: 'Long-Term Memory',      desc: 'Persist facts across sessions' },
                  { key: 'crossSessionRecall',   label: 'Cross-Session Recall',  desc: 'Reference past conversations' },
                ] as { key: keyof typeof form.memories; label: string; desc: string }[]).map(({ key, label, desc }) => {
                  const isOn = form.memories[key] as boolean;
                  return (
                    <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <p className="font-body font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                      </div>
                      <button
                        onClick={() => update('memories', { ...form.memories, [key]: !isOn })}
                        className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                        style={{ background: isOn ? 'var(--burnt-orange)' : 'var(--muted-beige)' }}
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200" style={{ left: isOn ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </button>
                    </div>
                  );
                })}

                {/* mem0 */}
                {(() => {
                  const isOn = form.memories.mem0;
                  return (
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-body font-medium text-sm" style={{ color: 'var(--text-primary)' }}>mem0</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}>External</span>
                        </div>
                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Managed memory layer via mem0.ai — semantic + episodic recall</p>
                      </div>
                      <button
                        onClick={() => update('memories', { ...form.memories, mem0: !isOn })}
                        className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                        style={{ background: isOn ? 'var(--burnt-orange)' : 'var(--muted-beige)' }}
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200" style={{ left: isOn ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </button>
                    </div>
                  );
                })()}

                {/* Zep */}
                {(() => {
                  const isOn = form.memories.zep;
                  return (
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-body font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Zep</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}>External</span>
                        </div>
                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Long-term memory store via Zep — structured user facts & history</p>
                      </div>
                      <button
                        onClick={() => update('memories', { ...form.memories, zep: !isOn })}
                        className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                        style={{ background: isOn ? 'var(--burnt-orange)' : 'var(--muted-beige)' }}
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200" style={{ left: isOn ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Window size */}
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass} style={{ ...labelStyle, marginBottom: 0 }}>Context Window Size</label>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}>{form.memories.windowSize} msgs</span>
                </div>
                <input
                  type="range" min="5" max="100" step="5"
                  value={form.memories.windowSize}
                  onChange={e => update('memories', { ...form.memories, windowSize: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, var(--burnt-orange) ${((form.memories.windowSize - 5) / 95) * 100}%, var(--border-color) ${((form.memories.windowSize - 5) / 95) * 100}%)` }}
                />
                <div className="flex justify-between mt-1">
                  <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>5 msgs</span>
                  <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>100 msgs</span>
                </div>
              </div>
            </div>

            {/* Communication Channels */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <MessageSquare size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Communication Channels</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Where your agent can talk to users.</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'webChat',  label: 'Web Chat',  icon: Globe,          desc: 'Embed on your website' },
                  { key: 'slack',    label: 'Slack',     icon: Slack,          desc: 'Connect to your Slack workspace' },
                  { key: 'discord',  label: 'Discord',   icon: MessageCircle,  desc: 'Add to your Discord server' },
                  { key: 'whatsApp', label: 'WhatsApp',  icon: Phone,          desc: 'Connect via WhatsApp Business API' },
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

            {/* Attached Workspaces */}
            <div className={sectionClass} style={sectionStyle}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.10)' }}>
                  <Layers size={20} style={{ color: 'var(--burnt-orange)' }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Attached Workspaces</h3>
                  <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Select workspaces this agent can access. Click a card to attach or detach.</p>
                </div>
              </div>

              {workspaces.length === 0 ? (
                <p className="font-body text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No workspaces yet — create one in the Workspace page.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {workspaces.map(ws => {
                    const isSelected = form.workspaceId === ws.id;
                    return (
                      <div
                        key={ws.id}
                        className="rounded-xl p-4 transition-all duration-200 cursor-pointer"
                        style={{
                          border: isSelected ? '1.5px solid var(--burnt-orange)' : '1.5px solid var(--border-color)',
                          background: isSelected ? 'rgba(192,86,64,0.04)' : 'var(--bg-elevated)',
                        }}
                        onClick={() => update('workspaceId', isSelected ? null : ws.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isSelected ? 'rgba(192,86,64,0.12)' : 'var(--border-color)' }}>
                              <Layers size={14} style={{ color: isSelected ? 'var(--burnt-orange)' : 'var(--text-muted)' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-body font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{ws.name}</p>
                              {ws.description && (
                                <p className="font-body text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{ws.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{ws.documents.length} docs · {ws.dataSources.length} sources</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isSelected && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(45,125,70,0.12)', color: '#2D7D46' }}>
                                <Check size={9} /> Attached
                              </span>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/workspace/${ws.id}/policy`); }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                              title="View access policy"
                            >
                              Policy →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

/* ═══════════════════════════════════════════
   WORKSPACE POLICY PAGE
   ═══════════════════════════════════════════ */

function WorkspacePolicyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { workspaces, instances } = useStore();
  const ws = workspaces.find(w => w.id === id);

  // Local state: per-agent permission toggles { agentId: { read, write } }
  const [perms, setPerms] = useState<Record<string, { read: boolean; write: boolean }>>(() => {
    const init: Record<string, { read: boolean; write: boolean }> = {};
    instances.forEach(inst => {
      init[inst.id] = { read: true, write: false };
    });
    return init;
  });

  const toggle = (agentId: string, field: 'read' | 'write') => {
    setPerms(p => ({ ...p, [agentId]: { ...p[agentId], [field]: !p[agentId][field] } }));
  };

  const attachedAgents = instances.filter(i => i.workspaceId === id);

  if (!ws) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="font-body text-lg" style={{ color: 'var(--text-secondary)' }}>Workspace not found.</p>
          <button onClick={() => navigate('/workspace')} className="mt-4 px-5 py-2 rounded-full text-sm font-semibold brand-gradient text-white">Back to Workspaces</button>
        </div>
      </div>
    );
  }

  const AgentRow = ({ inst }: { inst: Instance }) => {
    const p = perms[inst.id] ?? { read: true, write: false };
    const statusColor = inst.status === 'running' ? '#22c55e' : inst.status === 'stopped' ? 'var(--text-muted)' : '#ef4444';
    return (
      <div className="flex items-center gap-4 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.08)' }}>
          <Bot size={16} style={{ color: 'var(--burnt-orange)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-body font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{inst.name}</p>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
          </div>
          <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{inst.model}</p>
        </div>
        <div className="flex items-center gap-6">
          {(['read', 'write'] as const).map(field => {
            const isOn = p[field];
            return (
              <div key={field} className="flex flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{field}</span>
                <button
                  onClick={() => toggle(inst.id, field)}
                  className="relative w-11 h-6 rounded-full transition-all duration-200"
                  style={{ background: isOn ? 'var(--burnt-orange)' : 'var(--muted-beige)' }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200" style={{ left: isOn ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => navigate(`/agents/${inst.id}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Edit →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-4 flex items-center justify-between" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workspace')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p className="section-label mb-0">Workspace</p>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <p className="section-label mb-0" style={{ color: 'var(--burnt-orange)' }}>Access Policy</p>
            </div>
            <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{ws.name}</h1>
          </div>
        </div>
        <button
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient"
          onClick={() => navigate('/workspace')}
        >
          Save Policy
        </button>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-3xl">
        {/* Info card */}
        <div className="rounded-2xl p-5 mb-8 flex items-start gap-4" style={{ background: 'rgba(192,86,64,0.04)', border: '1px solid rgba(192,86,64,0.15)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.10)' }}>
            <Layers size={18} style={{ color: 'var(--burnt-orange)' }} />
          </div>
          <div>
            <p className="font-body font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ws.name}</p>
            {ws.description && <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ws.description}</p>}
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{ws.documents.length} documents</span>
              <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{ws.dataSources.length} data sources</span>
              <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{attachedAgents.length} attached agents</span>
            </div>
          </div>
        </div>

        {/* Attached agents */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Attached Agents</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(45,125,70,0.10)', color: '#2D7D46' }}>{attachedAgents.length}</span>
          </div>
          <p className="font-body text-xs mb-5" style={{ color: 'var(--text-muted)' }}>These agents are currently connected to this workspace. Toggle read/write access per agent.</p>

          {attachedAgents.length === 0 ? (
            <div className="text-center py-8">
              <Bot size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No agents attached yet.</p>
              <button onClick={() => navigate('/agents')} className="mt-3 px-4 py-2 rounded-full text-xs font-semibold brand-gradient text-white">Attach an agent</button>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div className="flex items-center gap-4 pb-2 mb-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex-1" />
                <div className="flex items-center gap-6 pr-1">
                  <span className="w-11 text-center font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Read</span>
                  <span className="w-11 text-center font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Write</span>
                  <span className="w-14" />
                </div>
              </div>
              {attachedAgents.map(inst => <AgentRow key={inst.id} inst={inst} />)}
            </div>
          )}
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
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/workspace/:id/policy" element={<ProtectedRoute><WorkspacePolicyPage /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
        <Route path="/agents/new" element={<ProtectedRoute><AgentConfigPage mode="new" /></ProtectedRoute>} />
        <Route path="/agents/:id" element={<ProtectedRoute><AgentConfigPage mode="edit" /></ProtectedRoute>} />
        <Route path="/new" element={<Navigate to="/agents/new" replace />} />
        <Route path="/edit/:id" element={<ProtectedRoute><AgentConfigPage mode="edit" /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function RootRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */
export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <StoreProvider>
            <RootRouter />
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
