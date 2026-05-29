import React from 'react';
import type { Instance, ConnectedApp, Workspace, AgentTeam, KnowledgeBase, Channel, ChannelType, ChannelMeta, SkillTag, ToolConfigField } from '../types';

export const DEFAULT_MEMORIES = { organiser: 'file' as const };
export const DEFAULT_PLUGINS  = { webSearch: false, codeInterpreter: false, imageGeneration: false, calculator: false };

export const CONNECTED_APPS_TEMPLATE: ConnectedApp[] = [
  { id: 'google',   name: 'Google Workspace', description: 'Docs, Sheets, Drive — read & write', icon: '🔵', connected: false },
  { id: 'notion',   name: 'Notion',           description: 'Pages, databases, wikis',            icon: '⬛', connected: false },
  { id: 'obsidian', name: 'Obsidian Vault',   description: 'Markdown notes & knowledge graphs',  icon: '💜', connected: false },
  { id: 'dropbox',  name: 'Dropbox',          description: 'File storage & sharing',             icon: '🔷', connected: false },
  { id: 'github',   name: 'GitHub',           description: 'Repos, issues, pull requests',       icon: '⚫', connected: false },
];

export const INITIAL_INSTANCES: Instance[] = [
 { id: '1', name: 'My Assistant',  model: 'GPT-4',    status: 'running', uptime: '99.2%', conversations: '3.2K', integrations: ['Slack', 'Web'],           usage: 78,  lastActive: '2m ago',  temperature: 0.7, systemPrompt: 'You are a helpful personal assistant.',              region: 'us-east',      environment: 'production',  workspaceId: 'ws-1', memories: { organiser: 'mem0' },  plugins: { ...DEFAULT_PLUGINS, webSearch: true },  skills: ['Summarization', 'Translation', 'Q&A'] },
 { id: '2', name: 'Team Bot',      model: 'Claude 3', status: 'running', uptime: '97.5%', conversations: '8.1K', integrations: ['Slack', 'Discord', 'Web'], usage: 92,  lastActive: '30s ago', temperature: 0.5, systemPrompt: 'You are a team collaboration assistant.',            region: 'us-west',      environment: 'production',  workspaceId: 'ws-1', memories: { ...DEFAULT_MEMORIES },                        plugins: { ...DEFAULT_PLUGINS, calculator: true }, skills: ['Scheduling', 'Summarization'] },
 { id: '3', name: 'Research Aid',  model: 'Llama 3',  status: 'running', uptime: '94.1%', conversations: '1.5K', integrations: ['Web'],                    usage: 45,  lastActive: '1h ago',  temperature: 0.9, systemPrompt: 'You are a research assistant focused on deep analysis.', region: 'eu-west',   environment: 'staging',     workspaceId: 'ws-2', memories: { organiser: 'zep' },  plugins: { ...DEFAULT_PLUGINS, webSearch: true, codeInterpreter: true }, skills: ['Research', 'Citation', 'SQL Query'] },
 { id: '4', name: 'Code Helper',   model: 'GPT-4',    status: 'stopped', uptime: '—',     conversations: '12K',  integrations: ['Web', 'Discord'],         usage: 0,   lastActive: '3d ago',  temperature: 0.3, systemPrompt: 'You are a senior software engineer assistant.',       region: 'us-east',      environment: 'development', workspaceId: 'ws-2', memories: { ...DEFAULT_MEMORIES },                        plugins: { ...DEFAULT_PLUGINS, codeInterpreter: true }, skills: ['Code Review', 'Debugging', 'Documentation'] },
 { id: '5', name: 'Writing Buddy', model: 'Mistral',  status: 'running', uptime: '98.8%', conversations: '890',  integrations: ['Web'],                    usage: 34,  lastActive: '15m ago', temperature: 1.2, systemPrompt: 'You are a creative writing assistant.',              region: 'asia-pacific', environment: 'production',  workspaceId: 'ws-1', memories: { ...DEFAULT_MEMORIES },                        plugins: { ...DEFAULT_PLUGINS, imageGeneration: true }, skills: ['Copywriting', 'Editing', 'Brainstorming'] },
 { id: '6', name: 'DevOps Bot',    model: 'Claude 3', status: 'error',   uptime: '62.3%', conversations: '4.2K', integrations: ['Slack'],                  usage: 100, lastActive: '5m ago',  temperature: 0.4, systemPrompt: 'You are a DevOps monitoring assistant.',             region: 'us-west',      environment: 'production',  workspaceId: 'ws-1', memories: { organiser: 'zep' },   plugins: { ...DEFAULT_PLUGINS, webSearch: true }, skills: ['Monitoring', 'Alerting', 'Incident Response'] },
];

export const INITIAL_WORKSPACES: Workspace[] = [
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
    tools: [],
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
    collaborators: [
      { id: 'c1', name: 'Alex Rivera',  email: 'alex@company.com',   avatar: 'AR', role: 'owner',  joinedAt: 'Jan 2025' },
      { id: 'c2', name: 'Sam Chen',     email: 'sam@company.com',    avatar: 'SC', role: 'editor', joinedAt: 'Feb 2025' },
      { id: 'c3', name: 'Jordan Lee',   email: 'jordan@company.com', avatar: 'JL', role: 'editor', joinedAt: 'Mar 2025' },
      { id: 'c4', name: 'Taylor Kim',   email: 'taylor@company.com', avatar: 'TK', role: 'viewer', joinedAt: 'Apr 2025' },
    ],
  },
  {
    id: 'ws-2',
    name: 'Dev Workspace',
    description: 'Staging and development agents only',
    connectedApps: CONNECTED_APPS_TEMPLATE.map((a, i) => ({ ...a, connected: i === 4 })),
    documents: [
      { id: 'd5', name: 'API Reference.md',         type: 'md',  size: '320 KB', uploadedAt: 'May 21, 2026' },
      { id: 'd6', name: 'Architecture Diagram.pdf', type: 'pdf', size: '890 KB', uploadedAt: 'May 19, 2026' },
    ],
    dataSources: [
      { id: 'ds4', name: 'Staging DB',  type: 'postgresql', connectionString: 'postgresql://dev:***@db.staging:5432/dev', status: 'connected' },
      { id: 'ds5', name: 'GitHub API',  type: 'rest-api',   connectionString: 'https://api.github.com',                  status: 'connected' },
    ],
    mcps: [],
    tools: [],
    env: [
      { id: 'f1', name: 'src', type: 'folder', modifiedAt: 'May 27, 2026', children: [
        { id: 'f1a', name: 'index.ts',  type: 'ts', size: '5.1 KB', modifiedAt: 'May 27, 2026' },
        { id: 'f1b', name: 'router.ts', type: 'ts', size: '3.8 KB', modifiedAt: 'May 26, 2026' },
        { id: 'f1c', name: 'utils', type: 'folder', modifiedAt: 'May 25, 2026', children: [
          { id: 'f1c1', name: 'helpers.ts', type: 'ts', size: '2.2 KB', modifiedAt: 'May 25, 2026' },
          { id: 'f1c2', name: 'logger.ts',  type: 'ts', size: '1.6 KB', modifiedAt: 'May 24, 2026' },
        ]},
      ]},
      { id: 'f2', name: 'tests', type: 'folder', modifiedAt: 'May 24, 2026', children: [
        { id: 'f2a', name: 'unit.test.ts', type: 'ts', size: '9.4 KB', modifiedAt: 'May 24, 2026' },
        { id: 'f2b', name: 'e2e.test.ts',  type: 'ts', size: '7.1 KB', modifiedAt: 'May 23, 2026' },
      ]},
      { id: 'f3', name: 'package.json',  type: 'json', size: '1.2 KB', modifiedAt: 'May 22, 2026' },
      { id: 'f4', name: 'tsconfig.json', type: 'json', size: '0.9 KB', modifiedAt: 'May 20, 2026' },
    ],
    collaborators: [
      { id: 'c5', name: 'Morgan Blake', email: 'morgan@company.com', avatar: 'MB', role: 'owner',  joinedAt: 'Feb 2025' },
      { id: 'c6', name: 'Casey Park',   email: 'casey@company.com',  avatar: 'CP', role: 'editor', joinedAt: 'Mar 2025' },
    ],
  },
];

export const INITIAL_AGENT_TEAMS: AgentTeam[] = [
  {
    id: 'at-1', name: 'Content Pipeline', status: 'active',
    description: 'Researches a topic, drafts an article, and reviews for quality.',
    coreAgentId: '3',
    coreAgentRoleContext: 'Leads the pipeline — receives the topic brief, coordinates research, and hands off to subagents in sequence.',
    subagents: [
      { instanceId: '1', roleContext: 'Drafts the article body based on the research summary provided by the core agent.' },
      { instanceId: '2', roleContext: 'Reviews the draft for factual accuracy, tone, and grammar. Returns a revised version.' },
    ],
    trigger: 'manual', lastRun: '2h ago', runs: 48,
    workspaceId: 'ws-1',
  },
  {
    id: 'at-2', name: 'Support Triage', status: 'active',
    description: 'Classifies incoming tickets and routes to the right specialist.',
    coreAgentId: '2',
    coreAgentRoleContext: 'Receives all incoming support tickets, classifies intent and urgency, then delegates to the appropriate specialist subagent.',
    subagents: [
      { instanceId: '1', roleContext: 'Handles billing and subscription queries. Has access to the billing knowledge base.' },
      { instanceId: '4', roleContext: 'Handles technical issues and bug reports. Can query the engineering runbook.' },
    ],
    trigger: 'webhook', lastRun: '5m ago', runs: 1204,
    workspaceId: 'ws-1',
  },
  {
    id: 'at-3', name: 'Data Enrichment', status: 'idle',
    description: 'Pulls records, enriches with web data, validates and writes back.',
    coreAgentId: '4',
    coreAgentRoleContext: 'Orchestrates the enrichment job — fetches the record batch, dispatches to subagents, and writes the merged result back to the database.',
    subagents: [
      { instanceId: '5', roleContext: 'Fetches supplementary data from the web for each record using search and scraping tools.' },
      { instanceId: '6', roleContext: 'Validates enriched records against the schema and flags anomalies for review.' },
    ],
    trigger: 'scheduled', lastRun: 'Yesterday', runs: 22,
    workspaceId: 'ws-2',
  },
];

export const PRESET_MCPS: { name: string; desc: string; urlPlaceholder: string; requiresKey: boolean }[] = [
  { name: 'GitHub',      desc: 'Read repos, issues, PRs and commit history.',    urlPlaceholder: 'https://mcp.github.com',           requiresKey: true  },
  { name: 'Notion',      desc: 'Read and write Notion pages and databases.',      urlPlaceholder: 'https://mcp.notion.so',             requiresKey: true  },
  { name: 'Slack',       desc: 'Post messages and read channel history.',         urlPlaceholder: 'https://mcp.slack.com',             requiresKey: true  },
  { name: 'Google Drive',desc: 'Access and search files in Google Drive.',        urlPlaceholder: 'https://mcp.googleapis.com/drive',  requiresKey: true  },
  { name: 'Linear',      desc: 'Manage issues, projects and cycles.',             urlPlaceholder: 'https://mcp.linear.app',            requiresKey: true  },
  { name: 'Jira',        desc: 'Create and update Jira tickets and sprints.',     urlPlaceholder: 'https://mcp.atlassian.com/jira',    requiresKey: true  },
  { name: 'Postgres',    desc: 'Query a PostgreSQL database directly.',           urlPlaceholder: 'https://mcp.example.com/postgres',  requiresKey: false },
  { name: 'Stripe',      desc: 'Retrieve payments, customers and subscriptions.', urlPlaceholder: 'https://mcp.stripe.com',            requiresKey: true  },
  { name: 'Browserbase', desc: 'Headless browser automation and web scraping.',   urlPlaceholder: 'https://mcp.browserbase.com',       requiresKey: true  },
  { name: 'Filesystem',  desc: 'Read and write local or remote file systems.',    urlPlaceholder: 'http://localhost:3100',              requiresKey: false },
  { name: 'Custom MCP',  desc: 'Connect any MCP-compatible server by URL.',       urlPlaceholder: 'https://your-mcp-server.com',       requiresKey: false },
];

export const MODELS: { id: string; label: string; updatedAt: string; description: string; contextLabel: string; stats: { intelligence: number; cost: number; speed: number; context: number } }[] = [
  { id: 'GPT-4',      label: 'GPT-4',      updatedAt: 'Nov 2023', description: 'Best for complex reasoning, coding, and nuanced instruction-following.', contextLabel: '8K',   stats: { intelligence: 9,  cost: 3,  speed: 5,  context: 2  } },
  { id: 'GPT-4o',     label: 'GPT-4o',     updatedAt: 'May 2024', description: 'Faster multimodal model — great for real-time chat and vision tasks.',   contextLabel: '128K', stats: { intelligence: 9,  cost: 5,  speed: 8,  context: 9  } },
  { id: 'Claude 3',   label: 'Claude 3',   updatedAt: 'Mar 2024', description: 'Excels at long-context analysis, summarisation, and safe outputs.',       contextLabel: '200K', stats: { intelligence: 8,  cost: 5,  speed: 6,  context: 10 } },
  { id: 'Claude 3.5', label: 'Claude 3.5', updatedAt: 'Jun 2024', description: "Anthropic's most capable model — top-tier coding and reasoning.",         contextLabel: '200K', stats: { intelligence: 10, cost: 4,  speed: 7,  context: 10 } },
  { id: 'Llama 3',    label: 'Llama 3',    updatedAt: 'Apr 2024', description: 'Open-weight model ideal for self-hosted, privacy-first deployments.',      contextLabel: '8K',   stats: { intelligence: 7,  cost: 9,  speed: 7,  context: 2  } },
  { id: 'Mistral',    label: 'Mistral 7B', updatedAt: 'Sep 2023', description: 'Lightweight and fast — great for high-throughput, low-latency tasks.',    contextLabel: '32K',  stats: { intelligence: 6,  cost: 10, speed: 10, context: 5  } },
  { id: 'Gemini Pro', label: 'Gemini Pro', updatedAt: 'Dec 2023', description: "Google's multimodal model with strong search-augmented reasoning.",        contextLabel: '32K',  stats: { intelligence: 8,  cost: 6,  speed: 7,  context: 5  } },
];

export const RECOMMENDED_SKILLS: { label: string; desc: string; tags: SkillTag[]; configFields: ToolConfigField[] }[] = [
  { label: 'Weather',                desc: 'Real-time forecasts and conditions',       tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'OpenWeatherMap API key', required: true, secret: true }] },
  { label: 'Stock Market',           desc: 'Equities, indices and market data',         tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Alpha Vantage or Polygon.io key', required: true, secret: true }] },
  { label: 'Commodities',            desc: 'Oil, gold, metals and raw materials',       tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Commodities data provider key', required: true, secret: true }] },
  { label: 'Crypto',                 desc: 'Cryptocurrency prices and trends',          tags: ['external'],          configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'CoinGecko or CoinMarketCap key', required: false, secret: true }, { key: 'currency', label: 'Base Currency', placeholder: 'USD', required: false }] },
  { label: 'Web Browser',            desc: 'Browse and extract content from URLs',      tags: ['external', 'read'],  configFields: [{ key: 'maxPages', label: 'Max Pages per Request', placeholder: '5', required: false }] },
  { label: 'Web Search',             desc: 'Search the web for up-to-date info',        tags: ['external', 'read'],  configFields: [{ key: 'apiKey', label: 'Search API Key', placeholder: 'Brave / SerpAPI / Google key', required: true, secret: true }, { key: 'maxResults', label: 'Max Results', placeholder: '10', required: false }] },
  { label: 'Time & Timezone',        desc: 'Current time, dates and conversions',       tags: ['external'],          configFields: [] },
  { label: 'Summarization',          desc: 'Condense long content into key points',     tags: [],                    configFields: [{ key: 'maxLength', label: 'Max Summary Length (words)', placeholder: '200', required: false }] },
  { label: 'Translation',            desc: 'Translate text across languages',           tags: [],                    configFields: [{ key: 'defaultTarget', label: 'Default Target Language', placeholder: 'en', required: false }] },
  { label: 'Code Execution',         desc: 'Run and debug code snippets',               tags: ['external', 'write'], configFields: [{ key: 'sandbox', label: 'Sandbox URL', placeholder: 'https://sandbox.example.com', required: true }] },
  { label: 'Image Generation',       desc: 'Create images from text prompts',           tags: ['external', 'write'], configFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'OpenAI / Stability AI key', required: true, secret: true }, { key: 'model', label: 'Model', placeholder: 'dall-e-3', required: false }] },
  { label: 'Email Drafting',         desc: 'Compose and format emails',                 tags: ['write'],             configFields: [] },
  { label: 'Calendar & Scheduling',  desc: 'Manage events and reminders',               tags: ['read', 'write'],     configFields: [{ key: 'calendarId', label: 'Calendar ID', placeholder: 'primary', required: true }] },
  { label: 'PDF & Document Reader',  desc: 'Parse and extract text from files',         tags: ['read'],              configFields: [{ key: 'maxPages', label: 'Max Pages', placeholder: '50', required: false }] },
  { label: 'SQL Query',              desc: 'Write and explain database queries',        tags: ['read', 'write'],     configFields: [{ key: 'connectionString', label: 'Connection String', placeholder: 'postgresql://user:pass@host/db', required: true, secret: true }] },
];

export const INITIAL_KBS: KnowledgeBase[] = [
  {
    id: 'kb-1', name: 'Product Knowledge Base',
    description: 'Product docs, release notes, and FAQs indexed for support agents.',
    status: 'active',
    sources: [
      { id: 's1', name: 'Product Docs',  type: 'PDF',       size: '4.2 MB', chunks: 312, status: 'indexed',    icon: '📄' },
      { id: 's2', name: 'Support KB',    type: 'Markdown',  size: '1.8 MB', chunks: 198, status: 'indexed',    icon: '📝' },
      { id: 's3', name: 'API Reference', type: 'Web Crawl', size: '9.1 MB', chunks: 841, status: 'processing', icon: '🌐' },
    ],
    vectorStore: 'Pinecone', embeddingModel: 'text-embedding-3-large', ragLLM: 'gpt-4o',
    retrieval: { topK: 5, minSimilarity: 72, chunkSize: 512 },
    permissions: { workspaceIds: ['ws-1', 'ws-2'], visibility: 'org' },
    workspaceId: 'ws-1',
  },
  {
    id: 'kb-2', name: 'Legal & Compliance Docs',
    description: 'Internal policy documents and regulatory guidelines.',
    status: 'active',
    sources: [
      { id: 's4', name: 'Policy Manual',   type: 'PDF',          size: '2.1 MB', chunks: 204, status: 'indexed', icon: '📄' },
      { id: 's5', name: 'Compliance Wiki', type: 'Confluence',   size: '3.4 MB', chunks: 388, status: 'indexed', icon: '📘' },
      { id: 's6', name: 'GDPR Guidelines', type: 'PDF',          size: '0.9 MB', chunks: 88,  status: 'indexed', icon: '📄' },
      { id: 's7', name: 'Legal Runbooks',  type: 'Notion',       size: '1.2 MB', chunks: 112, status: 'indexed', icon: '🗒️' },
      { id: 's8', name: 'Audit Logs',      type: 'Google Drive', size: '5.6 MB', chunks: 100, status: 'indexed', icon: '📁' },
    ],
    vectorStore: 'pgvector', embeddingModel: 'text-embedding-3-small', ragLLM: 'claude-3-5-sonnet',
    retrieval: { topK: 8, minSimilarity: 80, chunkSize: 256 },
    permissions: { workspaceIds: ['ws-1'], visibility: 'workspace' },
    workspaceId: 'ws-1',
  },
  {
    id: 'kb-3', name: 'Engineering Runbooks',
    description: 'Incident runbooks, architecture docs, and on-call guides.',
    status: 'indexing',
    sources: [
      { id: 's9',  name: 'Incident Runbooks', type: 'GitHub',   size: '0.8 MB', chunks: 94,  status: 'indexed',    icon: '🐙' },
      { id: 's10', name: 'Architecture Docs', type: 'Markdown', size: '2.3 MB', chunks: 323, status: 'processing', icon: '📝' },
    ],
    vectorStore: 'Chroma', embeddingModel: 'bge-large-en-v1.5', ragLLM: 'gpt-4o-mini',
    retrieval: { topK: 5, minSimilarity: 65, chunkSize: 1024 },
    permissions: { workspaceIds: ['ws-2'], visibility: 'workspace' },
    workspaceId: 'ws-2',
  },
];

export const EXTERNAL_SOURCE_TYPES = [
  { type: 'Notion',       icon: '🗒️', label: 'Notion' },
  { type: 'Confluence',   icon: '📘', label: 'Confluence' },
  { type: 'Google Drive', icon: '📁', label: 'Google Drive' },
  { type: 'Slack',        icon: '💬', label: 'Slack' },
  { type: 'GitHub',       icon: '🐙', label: 'GitHub' },
  { type: 'Web Crawl',    icon: '🌐', label: 'Web Crawl' },
];

export const RAG_LLMS = [
  { id: 'gpt-4o',            label: 'GPT-4o',            provider: 'OpenAI',      badge: 'Best'      },
  { id: 'gpt-4o-mini',       label: 'GPT-4o mini',       provider: 'OpenAI',      badge: 'Fast'      },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic',   badge: 'Reasoning' },
  { id: 'gemini-1-5-pro',    label: 'Gemini 1.5 Pro',    provider: 'Google',      badge: 'Long ctx'  },
  { id: 'llama-3-70b',       label: 'Llama 3 70B',       provider: 'Self-hosted', badge: 'Open'      },
];

export const EMBEDDING_MODELS = [
  { id: 'text-embedding-3-large', label: 'text-embedding-3-large', provider: 'OpenAI', dims: '3072d', badge: 'Best Quality' },
  { id: 'text-embedding-3-small', label: 'text-embedding-3-small', provider: 'OpenAI', dims: '1536d', badge: 'Balanced'     },
  { id: 'embed-english-v3.0',     label: 'embed-english-v3.0',     provider: 'Cohere', dims: '1024d', badge: 'Multilingual' },
  { id: 'bge-large-en-v1.5',      label: 'bge-large-en-v1.5',      provider: 'Local',  dims: '1024d', badge: 'Self-hosted'  },
];

export const VECTOR_STORES = [
  { id: 'Pinecone', label: 'Pinecone', desc: 'Managed, serverless — best for production scale.',   badge: 'Managed'  },
  { id: 'Chroma',   label: 'Chroma',   desc: 'Open-source, runs locally — great for dev/staging.', badge: 'Local'    },
  { id: 'Weaviate', label: 'Weaviate', desc: 'Hybrid search with BM25 + vector fusion.',           badge: 'Hybrid'   },
  { id: 'pgvector', label: 'pgvector', desc: 'Postgres extension — no extra infra needed.',        badge: 'Embedded' },
];

export const CHANNEL_META: Record<ChannelType, ChannelMeta> = {
  slack: {
    label: 'Slack', icon: '💬', color: '#4A154B', bg: 'rgba(74,21,75,0.10)',
    tagline: 'Post messages & read channel history',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 22, height: 22 },
      React.createElement('path', { d: 'M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z' })
    ),
    fields: [{ key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...', secret: true }, { key: 'signingSecret', label: 'Signing Secret', placeholder: 'abc123...', secret: true }],
  },
  discord: {
    label: 'Discord', icon: '🎮', color: '#5865F2', bg: 'rgba(88,101,242,0.10)',
    tagline: 'Deploy bots to servers & DMs',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 22, height: 22 },
      React.createElement('path', { d: 'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' })
    ),
    fields: [{ key: 'botToken', label: 'Bot Token', placeholder: 'MTI3...', secret: true }, { key: 'guildId', label: 'Server ID', placeholder: '123456789' }],
  },
  'web-widget': {
    label: 'Web Widget', icon: '🌐', color: '#C05640', bg: 'rgba(192,86,64,0.10)',
    tagline: 'Embed a chat widget on any website',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', width: 22, height: 22 },
      React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
      React.createElement('path', { d: 'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })
    ),
    fields: [{ key: 'allowedOrigins', label: 'Allowed Origins', placeholder: 'https://yoursite.com' }, { key: 'primaryColor', label: 'Brand Color', placeholder: '#C05640' }],
  },
  whatsapp: {
    label: 'WhatsApp', icon: '📱', color: '#25D366', bg: 'rgba(37,211,102,0.10)',
    tagline: 'Reach users on WhatsApp Business',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 22, height: 22 },
      React.createElement('path', { d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z' })
    ),
    fields: [{ key: 'phoneId', label: 'Phone Number ID', placeholder: '123456...' }, { key: 'accessToken', label: 'Access Token', placeholder: 'EAAb...', secret: true }],
  },
  api: {
    label: 'REST API', icon: '⚡', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)',
    tagline: 'Expose a webhook endpoint for any app',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', width: 22, height: 22 },
      React.createElement('polyline', { points: '16 18 22 12 16 6' }),
      React.createElement('polyline', { points: '8 6 2 12 8 18' })
    ),
    fields: [{ key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://...' }, { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', secret: true }],
  },
  email: {
    label: 'Email', icon: '✉️', color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)',
    tagline: 'Handle inbound & outbound email',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', width: 22, height: 22 },
      React.createElement('rect', { x: 2, y: 4, width: 20, height: 16, rx: 2 }),
      React.createElement('path', { d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' })
    ),
    fields: [{ key: 'inboundEmail', label: 'Inbound Address', placeholder: 'agent@dropin.bot' }, { key: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.example.com' }],
  },
  telegram: {
    label: 'Telegram', icon: '✈️', color: '#26A5E4', bg: 'rgba(38,165,228,0.10)',
    tagline: 'Deploy a Telegram bot in minutes',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 22, height: 22 },
      React.createElement('path', { d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' })
    ),
    fields: [{ key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-...', secret: true }],
  },
  teams: {
    label: 'MS Teams', icon: '🟦', color: '#6264A7', bg: 'rgba(98,100,167,0.10)',
    tagline: 'Integrate with Microsoft Teams workspaces',
    svg: React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 22, height: 22 },
      React.createElement('path', { d: 'M20.625 7.5h-8.25A1.125 1.125 0 0 0 11.25 8.625v5.25c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125v-5.25A1.125 1.125 0 0 0 20.625 7.5zM9 6.375a2.625 2.625 0 1 0 0-5.25 2.625 2.625 0 0 0 0 5.25zm1.5 1.5H7.5A3.375 3.375 0 0 0 4.125 11.25v3.375c0 .621.504 1.125 1.125 1.125H9v-5.25A2.625 2.625 0 0 1 10.5 7.875zm8.25-3a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5zm-1.5 9.75v1.5a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3v-1.5H3a.75.75 0 0 1-.75-.75V9.75A3.75 3.75 0 0 1 6 6h.375A3.748 3.748 0 0 0 5.25 8.625v5.25c0 1.036.84 1.875 1.875 1.875h6.75c1.036 0 1.875-.84 1.875-1.875v-.75h2.25a.75.75 0 0 0 .75-.75z' })
    ),
    fields: [{ key: 'appId', label: 'App ID', placeholder: 'xxxxxxxx-...' }, { key: 'appPassword', label: 'App Password', placeholder: '...', secret: true }],
  },
};

export const INITIAL_CHANNELS: Channel[] = [
  { id: 'ch-1', name: 'Support Slack',    type: 'slack',      status: 'connected',    agentId: '2',  description: 'Customer support bot in #support channel.',   createdAt: 'Mar 2025', messages: 14820, config: { botToken: 'xoxb-***', signingSecret: '***' }, workspaceId: 'ws-1' },
  { id: 'ch-2', name: 'Docs Widget',      type: 'web-widget', status: 'connected',    agentId: '1',  description: 'Embedded chat widget on the docs site.',       createdAt: 'Apr 2025', messages: 3210,  config: { allowedOrigins: 'https://docs.dropin.bot', primaryColor: '#C05640' }, workspaceId: 'ws-1' },
  { id: 'ch-3', name: 'Dev Discord',      type: 'discord',    status: 'error',        agentId: '3',  description: 'Research assistant in the dev Discord server.', createdAt: 'Apr 2025', messages: 892,   config: { botToken: '***', guildId: '987654321' }, workspaceId: 'ws-2' },
  { id: 'ch-4', name: 'API Integration',  type: 'api',        status: 'connected',    agentId: '4',  description: 'REST endpoint for internal tooling.',           createdAt: 'May 2025', messages: 5540,  config: { webhookUrl: 'https://api.dropin.bot/ch/ch-4', apiKey: 'sk-***' }, workspaceId: 'ws-2' },
  { id: 'ch-5', name: 'WhatsApp Support', type: 'whatsapp',   status: 'disconnected', agentId: null, description: 'WhatsApp Business channel — not yet live.',    createdAt: 'May 2025', messages: 0,     config: {}, workspaceId: 'ws-1' },
];

export const navItems = [
  { icon: 'Layers',        label: 'Workspaces',      sub: 'Environments & files',  path: '/workspace' },
  { icon: 'FolderOpen',    label: 'Files',           sub: 'Browse & manage files', path: '/files'     },
  { icon: 'Plug',          label: 'Apps',            sub: 'MCP integrations',      path: '/apps'      },
  { icon: 'Zap',           label: 'Tools',           sub: 'Agent tools & skills',  path: '/tools'     },
  { icon: 'MessageSquare', label: 'Channels',        sub: 'Deploy & integrate',    path: '/channels'  },
  { icon: 'BookOpen',      label: 'Knowledge Bases', sub: 'Retrieval pipelines',   path: '/knowledge' },
  { icon: 'Bot',           label: 'Agents',          sub: 'Your AI workers',       path: '/agents'    },
  { icon: 'Users',         label: 'Teams',           sub: 'Agentic workflows',     path: '/teams'     },
  { icon: 'Lock',          label: 'Policy',          sub: 'Access control',        path: '/policy'    },
  { icon: 'Settings',      label: 'Settings',        sub: 'Account & config',      path: '/settings'  },
];
