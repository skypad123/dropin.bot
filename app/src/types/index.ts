// Types extracted from App.tsx

// ── Core types ──
export interface Instance {
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
  systemPrompt: string;
  region: string;
  environment: string;
  workspaceId: string;
  memories: { organiser: 'file' | 'mem0' | 'zep'; };
  plugins: { webSearch: boolean; codeInterpreter: boolean; imageGeneration: boolean; calculator: boolean; };
  skills: string[];
}

export interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
}

export interface WorkspaceDoc {
  id: string;
  name: string;
  type: 'pdf' | 'md' | 'txt' | 'docx';
  size: string;
  uploadedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'postgresql' | 'rest-api' | 'web-url';
  connectionString: string;
  status: 'connected' | 'error' | 'pending';
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: CollaboratorRole;
  joinedAt: string;
}

export interface WorkspaceOpenClaw {
  endpoint: string;  // wss://host:18789
  token: string;     // sk-oc-... shared-secret gateway token
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  connectedApps: ConnectedApp[];
  documents: WorkspaceDoc[];
  dataSources: DataSource[];
  mcps: { id: string; name: string; url: string; apiKey: string }[];
  tools: { id: string; label: string; config: Record<string, string> }[];
  env: EnvNode[];
  collaborators: Collaborator[];
  openClaw?: WorkspaceOpenClaw;
}

export type EnvFileType = 'folder' | 'py' | 'js' | 'ts' | 'json' | 'md' | 'txt' | 'yaml' | 'sh' | 'img' | 'video' | 'audio' | 'zip' | 'file';

export interface EnvNode {
  id: string;
  name: string;
  type: EnvFileType;
  size?: string;
  modifiedAt: string;
  children?: EnvNode[];
}

export type Theme = 'light' | 'dark';

export interface AuthUser {
  name: string;
  email: string;
  provider: string;
}

export type InstanceInput = Omit<Instance, 'id' | 'lastActive' | 'uptime' | 'conversations' | 'usage'>;

export type TeamStatus = 'active' | 'idle' | 'error';

export interface TeamMember {
  instanceId: string;
  roleContext: string;
  maxParallel?: number;
}

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  status: TeamStatus;
  coreAgentId: string | null;
  coreAgentRoleContext: string;
  subagents: TeamMember[];
  trigger: 'manual' | 'scheduled' | 'webhook' | 'event';
  lastRun: string;
  runs: number;
  workspaceId: string;
}

export type KBVisibility = 'private' | 'workspace' | 'org';
export type KBStatus = 'active' | 'indexing' | 'error';

export interface KBSource {
  id: string;
  name: string;
  type: 'PDF' | 'Markdown' | 'Web Crawl' | 'Notion' | 'Confluence' | 'Google Drive' | 'Slack' | 'GitHub';
  size: string;
  chunks: number;
  status: 'indexed' | 'processing' | 'error';
  icon: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  status: KBStatus;
  sources: KBSource[];
  vectorStore: 'Pinecone' | 'Chroma' | 'Weaviate' | 'pgvector';
  embeddingModel: string;
  ragLLM: string;
  retrieval: { topK: number; minSimilarity: number; chunkSize: number };
  permissions: { workspaceIds: string[]; visibility: KBVisibility };
  workspaceId: string;
}

export type ChannelType = 'slack' | 'discord' | 'web-widget' | 'whatsapp' | 'api' | 'email' | 'telegram' | 'teams';
export type ChannelStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface ChannelMeta {
  label: string;
  icon: string;
  color: string;
  bg: string;
  tagline: string;
  svg: React.ReactNode;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  agentId: string | null;
  description: string;
  createdAt: string;
  messages: number;
  config: Record<string, string>;
  workspaceId: string;
}

export const SKILL_TAGS = {
  external: { label: 'External Call', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  read:     { label: 'Read',          color: '#2563EB', bg: 'rgba(37,99,235,0.10)'  },
  write:    { label: 'Write',         color: '#C05640', bg: 'rgba(192,86,64,0.10)'  },
} as const;
export type SkillTag = keyof typeof SKILL_TAGS;

export interface ToolConfigField { key: string; label: string; placeholder: string; required: boolean; secret?: boolean; }
