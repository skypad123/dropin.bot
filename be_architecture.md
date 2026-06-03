# dropin.bot — Backend Architecture

## Overview

dropin.bot uses a **hub-and-spoke** architecture. There are two server types:

1. **Hub API** (one instance, central) — Auth, user management, workspace directory, provisioning, reference data catalog. Thin. No agent logic, no real-time traffic.
2. **Workspace Server** (one per workspace, in its own container) — Agent orchestrator, WebSocket gateway for direct client communication, channel adapters, workflow engine, tool sandbox, workspace-local SQLite database.

The dashboard connects to the Hub for config, then opens a **direct WebSocket** to each workspace container for real-time communication.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Dropin Dashboard (React)                            │
│                                                                               │
│   ┌────────────────────────────────────────┐                                  │
│   │  Config data (agents, channels, etc.)   │  REST ────► Hub API             │
│   └────────────────────────────────────────┘                                  │
│                                                                               │
│   ┌────────────────────────────────────────┐                                  │
│   │  Real-time (chat, events, presence)     │  WS ─────► Workspace Server     │
│   └────────────────────────────────────────┘            (direct per-workspace)│
└──────────────────────────────────────────────────────────────────────────────┘
         │                            │
         │ REST (auth, workspace      │ WebSocket (direct,
         │  directory, provisioning,  │  per-workspace,
         │  catalog)                  │  protocol v4)
         ▼                            ▼
┌─────────────────────┐     ┌──────────────────────────────────┐
│     Hub API         │     │    Workspace Server (per ws)      │
│   (FastAPI, 1x)     │     │    (FastAPI, in container)        │
│                     │     │                                  │
│  ┌───────────────┐  │     │  ┌────────────────────────────┐  │
│  │    Auth       │  │     │  │    WebSocket Gateway       │  │
│  │  (JWT, OAuth) │  │     │  │    (protocol v4, ECDSA)    │◄─┼── WS from dashboard
│  └───────────────┘  │     │  └────────────────────────────┘  │
│                     │     │                                  │
│  ┌───────────────┐  │     │  ┌────────────────────────────┐  │
│  │  Workspace    │  │     │  │   Agent Orchestrator       │  │
│  │  Directory    │  │     │  │   (LangGraph loop)         │  │
│  │  (CRUD, con-  │  │     │  └────────────────────────────┘  │
│  │   nection     │  │     │                                  │
│  │   info)       │  │     │  ┌────────────────────────────┐  │
│  └───────────────┘  │     │  │   Channel Adapters         │  │
│                     │     │  │   (Slack, Discord, etc.)    │  │
│  ┌───────────────┐  │     │  └────────────────────────────┘  │
│  │  Provisioning │  │     │                                  │
│  │  (K8s API)    │──┼─────┼──► Creates/manages pods         │
│  └───────────────┘  │     │                                  │
│                     │     │  ┌────────────────────────────┐  │
│  ┌───────────────┐  │     │  │   Tool Sandbox            │  │
│  │   Catalog     │  │     │  │   (shell, file I/O)       │  │
│  │  (models,     │  │     │  └────────────────────────────┘  │
│  │   skills,     │  │     │                                  │
│  │   channels)   │  │     │  ┌────────────────────────────┐  │
│  └───────────────┘  │     │  │   Workflow Engine          │  │
│                     │     │  │   (team orchestration)     │  │
│  ┌───────────────┐  │     │  └────────────────────────────┘  │
│  │  PostgreSQL   │  │     │                                  │
│  │  (users, ws   │  │     │  ┌────────────────────────────┐  │
│  │   metadata)   │  │     │  │   SQLite (local DB)        │  │
│  └───────────────┘  │     │  │   agents, channels,        │  │
│                     │     │  │   history, tools, files     │  │
└─────────────────────┘     │  └────────────────────────────┘  │
                            │                                  │
                            │  ┌────────────────────────────┐  │
                            │  │   50GB EBS Persistent Vol  │  │
                            │  │   /workspace               │  │
                            │  └────────────────────────────┘  │
                            │                                  │
                            │  Runs on: EKS + Karpenter        │
                            │  Image: ubuntu:22.04 + Python    │
                            └──────────────────────────────────┘
```

### Connection Flow

```
1. Dashboard authenticates with Hub API (REST) → receives JWT
2. Dashboard GET /workspaces from Hub API → receives list with connection info:
   {
     id: "ws-abc123",
     name: "My Workspace",
     connection: {
       endpoint: "wss://ws-abc123.dropin.bot/ws",
       token: "sk-oc-..."
     }
   }
3. Dashboard opens WebSocket directly to ws-abc123.dropin.bot/ws
4. Workspace Server challenges dashboard (ECDSA P-256, protocol v4)
5. Dashboard signs challenge and authenticates
6. Direct real-time communication begins — no central relay
```

### Why Hub-and-Spoke Over Central Gateway

| Concern | Central Gateway | Hub-and-Spoke (this design) |
|---|---|---|
| Latency | Dashboard → Gateway → Pod | Dashboard → Pod (direct) |
| Single point of failure | Gateway goes down = all workspaces dead | One workspace goes down = only that workspace affected |
| Resource contention | Gateway handles all workspace traffic | Each workspace handles its own |
| Workspace isolation | Shared gateway process | Fully isolated per workspace |
| Channel integrations | Must route through gateway | Channels run directly in workspace container |
| Agent orchestration | Central server manages all agents | Each workspace runs its own orchestrator |
| Deployment simplicity | Fewer moving parts | More containers, but each is self-contained |
| Scaling | Scale gateway vertically | Scale Karpenter nodes horizontally |

---

## Hub API Server

### Purpose

The Hub is a thin directory service. It owns **none of the workspace data** — no agent configs, no conversation history, no tool state. It stores only what's needed to find and provision workspaces.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.12+) |
| ORM | SQLModel |
| Database | PostgreSQL 16 (RDS) |
| Migrations | Alembic |
| Auth | python-jose (JWT), passlib (bcrypt), httpx-oauth |
| K8s client | kubernetes-asyncio (provisioning) |
| Config | pydantic-settings |
| Observability | OpenTelemetry → CloudWatch |

### Database (Hub only — minimal schema)

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    provider      TEXT NOT NULL DEFAULT 'email',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    is_default      BOOLEAN NOT NULL DEFAULT false,
    endpoint_url    TEXT,             -- wss://ws-{id}.dropin.bot/ws
    gateway_token   TEXT,             -- encrypted at rest, used for dashboard→workspace auth
    status          TEXT DEFAULT 'provisioning',  -- provisioning | ready | stopped | error
    pod_name        TEXT,             -- K8s StatefulSet name
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspace_collaborators (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id),
    role          TEXT NOT NULL DEFAULT 'editor',
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

CREATE TABLE device_identities (
    device_id     TEXT PRIMARY KEY,
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    public_key    TEXT NOT NULL,
    paired        BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### API Endpoints (Hub)

#### Auth
| Method | Path | Description |
|---|---|---|
| POST   | `/api/v1/auth/register` | Register |
| POST   | `/api/v1/auth/login`    | Login |
| POST   | `/api/v1/auth/logout`   | Invalidate JWT |
| GET    | `/api/v1/auth/me`       | Current user |
| GET    | `/api/v1/auth/oauth/{provider}/url` | OAuth redirect URL |
| GET    | `/api/v1/auth/oauth/{provider}/callback` | OAuth callback |

#### Workspace Directory
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/workspaces`              | List user's workspaces (with connection info) |
| POST   | `/api/v1/workspaces`              | Create workspace → triggers K8s provisioning |
| GET    | `/api/v1/workspaces/{id}`         | Workspace metadata + connection info |
| PATCH  | `/api/v1/workspaces/{id}`         | Update name/description |
| DELETE | `/api/v1/workspaces/{id}`         | Delete workspace → deletes K8s resources |
| GET    | `/api/v1/workspaces/{id}/status`  | Provisioning status |

#### Device Management
| Method | Path | Description |
|---|---|---|
| POST   | `/api/v1/workspaces/{id}/devices/pair` | Approve device pairing |
| DELETE | `/api/v1/workspaces/{id}/devices/{device_id}` | Revoke device |

#### Catalog (static reference data)
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/catalog/models`           | Available LLM models |
| GET    | `/api/v1/catalog/channel-meta`     | Channel type metadata (8 types) |
| GET    | `/api/v1/catalog/skills`           | Recommended tool definitions (15 tools) |
| GET    | `/api/v1/catalog/vector-stores`    | Vector store options |
| GET    | `/api/v1/catalog/embedding-models` | Embedding model options |
| GET    | `/api/v1/catalog/rag-llms`         | RAG synthesis model options |
| GET    | `/api/v1/catalog/mcps`             | MCP server presets (11 presets) |

---

## Workspace Server (per workspace container)

### Purpose

Each workspace is a **self-contained application server** running inside its own container. It handles everything specific to that workspace: agents, channels, tools, workflows, files, and real-time communication with the dashboard.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | SQLite (local, on persistent EBS volume) |
| Agent orchestration | LangGraph |
| LLM clients | openai + anthropic |
| WebSocket | FastAPI native WS (protocol v4) |
| Channel adapters | Custom async adapters (Slack bolt, discord.py, etc.) |
| Background tasks | asyncio tasks (light) + Celery (heavy) |
| Tool sandbox | Direct shell execution in container (native) |

### Database (SQLite — workspace-local)

All workspace-specific data lives in SQLite at `/workspace/data/workspace.db`:

```sql
CREATE TABLE instances (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    model           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'stopped',
    temperature     REAL NOT NULL DEFAULT 0.7,
    system_prompt   TEXT DEFAULT '',
    region          TEXT DEFAULT 'us-east',
    environment     TEXT DEFAULT 'production',
    memories_organiser TEXT DEFAULT 'file',
    plugins         TEXT DEFAULT '{}',
    skills          TEXT DEFAULT '[]',
    integrations    TEXT DEFAULT '[]',
    created_at      TEXT NOT NULL,
    last_active_at  TEXT,
    usage           INTEGER DEFAULT 0
);

CREATE TABLE channels (
    id              TEXT PRIMARY KEY,
    agent_id        TEXT,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'disconnected',
    description     TEXT DEFAULT '',
    config          TEXT DEFAULT '{}',
    messages_count  INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL
);

CREATE TABLE agent_teams (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    description             TEXT DEFAULT '',
    status                  TEXT DEFAULT 'idle',
    core_agent_id           TEXT,
    core_agent_role_context TEXT DEFAULT '',
    trigger                 TEXT DEFAULT 'manual',
    last_run                TEXT DEFAULT '—',
    runs                    INTEGER DEFAULT 0,
    created_at              TEXT NOT NULL
);

CREATE TABLE team_members (
    id              TEXT PRIMARY KEY,
    team_id         TEXT NOT NULL,
    instance_id     TEXT NOT NULL,
    role_context    TEXT DEFAULT '',
    max_parallel    INTEGER
);

CREATE TABLE knowledge_bases (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    status          TEXT DEFAULT 'indexing',
    vector_store    TEXT DEFAULT 'pgvector',
    embedding_model TEXT DEFAULT 'text-embedding-3-large',
    rag_llm         TEXT DEFAULT 'gpt-4o',
    top_k           INTEGER DEFAULT 5,
    min_similarity  REAL DEFAULT 0.72,
    chunk_size      INTEGER DEFAULT 512,
    visibility      TEXT DEFAULT 'private',
    allowed_ws_ids  TEXT DEFAULT '[]',
    created_at      TEXT NOT NULL
);

CREATE TABLE kb_sources (
    id         TEXT PRIMARY KEY,
    kb_id      TEXT NOT NULL,
    name       TEXT NOT NULL,
    type       TEXT NOT NULL,
    size       TEXT DEFAULT '',
    chunks     INTEGER DEFAULT 0,
    status     TEXT DEFAULT 'processing',
    metadata   TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE TABLE workspace_tools (
    id         TEXT PRIMARY KEY,
    label      TEXT NOT NULL,
    config     TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE TABLE workspace_mcps (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    api_key    TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE files (
    id          TEXT PRIMARY KEY,
    parent_id   TEXT,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    size        TEXT,
    modified_at TEXT NOT NULL,
    created_at  TEXT NOT NULL
);

CREATE TABLE gateway_sessions (
    key         TEXT PRIMARY KEY,
    agent_id    TEXT,
    title       TEXT,
    status      TEXT,
    updated_at  TEXT NOT NULL
);

CREATE TABLE chat_messages (
    id          TEXT PRIMARY KEY,
    session_key TEXT NOT NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    ts          TEXT NOT NULL
);

CREATE TABLE connected_apps (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon        TEXT DEFAULT '',
    connected   INTEGER DEFAULT 0
);
```

### API Endpoints (Workspace Server)

All prefixed with `/api/v1/ws`, authenticated via JWT from Hub or gateway token.

#### Gateway (WebSocket)
| Method | Path | Description |
|---|---|---|
| WS     | `/ws` | OpenClaw protocol v4 WebSocket endpoint |

#### Agents
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/instances` | List instances |
| POST   | `/api/v1/ws/instances` | Create instance |
| GET    | `/api/v1/ws/instances/{id}` | Get instance |
| PUT    | `/api/v1/ws/instances/{id}` | Update instance |
| DELETE | `/api/v1/ws/instances/{id}` | Delete instance |
| POST   | `/api/v1/ws/instances/{id}/run` | Start agent |
| POST   | `/api/v1/ws/instances/{id}/stop` | Stop agent |

#### Channels
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/channels` | List channels |
| POST   | `/api/v1/ws/channels` | Create channel |
| GET    | `/api/v1/ws/channels/{id}` | Get channel |
| PUT    | `/api/v1/ws/channels/{id}` | Update channel |
| DELETE | `/api/v1/ws/channels/{id}` | Delete channel |
| POST   | `/api/v1/ws/channels/{id}/connect` | Connect channel |
| POST   | `/api/v1/ws/channels/{id}/disconnect` | Disconnect channel |

#### Teams
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/teams` | List teams |
| POST   | `/api/v1/ws/teams` | Create team |
| GET    | `/api/v1/ws/teams/{id}` | Get team |
| PUT    | `/api/v1/ws/teams/{id}` | Update team |
| DELETE | `/api/v1/ws/teams/{id}` | Delete team |
| POST   | `/api/v1/ws/teams/{id}/run` | Trigger team run |

#### Tools
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/tools` | List tools |
| POST   | `/api/v1/ws/tools` | Add tool |
| PUT    | `/api/v1/ws/tools/{id}` | Update tool |
| DELETE | `/api/v1/ws/tools/{id}` | Remove tool |

#### Knowledge Bases
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/knowledge-bases` | List KBs |
| POST   | `/api/v1/ws/knowledge-bases` | Create KB |
| GET    | `/api/v1/ws/knowledge-bases/{id}` | Get KB |
| PUT    | `/api/v1/ws/knowledge-bases/{id}` | Update KB |
| DELETE | `/api/v1/ws/knowledge-bases/{id}` | Delete KB |
| POST   | `/api/v1/ws/knowledge-bases/{id}/sources` | Add source |
| DELETE | `/api/v1/ws/knowledge-bases/{id}/sources/{src_id}` | Remove source |

#### Files
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/files` | Get file tree |
| GET    | `/api/v1/ws/files/{id}` | Get file info |
| POST   | `/api/v1/ws/files` | Upload file |
| POST   | `/api/v1/ws/files/folders` | Create folder |
| PUT    | `/api/v1/ws/files/{id}` | Rename/move |
| DELETE | `/api/v1/ws/files/{id}` | Delete |
| GET    | `/api/v1/ws/files/{id}/download` | Download |

#### MCP Apps
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/mcps` | List MCPs |
| POST   | `/api/v1/ws/mcps` | Add MCP |
| PUT    | `/api/v1/ws/mcps/{id}` | Update MCP |
| DELETE | `/api/v1/ws/mcps/{id}` | Remove MCP |

#### Dashboard
| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/ws/dashboard` | Aggregated stats for this workspace |

---

## Gateway Protocol v4 (per workspace)

Each workspace server runs its own WebSocket gateway. The protocol is the same v4 spec — it just only handles connections for that single workspace.

### Connection Flow (same protocol, per-workspace)

```
1. Dashboard opens WebSocket to wss://ws-{id}.dropin.bot/ws
2. Workspace Server sends: {type: "event", event: "connect.challenge", payload: {nonce, ts}}
3. Dashboard signs and sends connect request (same v4 handshake)
4. Workspace Server validates signature against stored device identity
5. If paired: hello-ok with workspace snapshot
6. Events flow: chat messages, agent events, presence, health, sessions
```

### Event Types (unchanged)

| Event | Payload |
|---|---|
| `connect.challenge` | `{nonce, ts}` |
| `tick`              | `{}` |
| `health`            | `{status, uptime, version}` |
| `presence`          | Connected dashboard clients |
| `sessions.changed`  | `{sessions: [...]}` |
| `chat.message`      | Chat messages |
| `session.message`   | Session messages |
| `session.operation` | Agent operations |
| `session.tool`      | Tool executions |

---

## Agent Orchestration (LangGraph — per workspace)

The agent loop runs inside the workspace server as an asyncio task. Each running agent is a spawned task with a cancellation handle.

```
     ┌──────────────┐
     │   Receive    │
     │   Message    │  ← from WS (dashboard) or channel (Slack, etc.)
     └──────┬───────┘
            │
     ┌──────▼───────┐
     │   Call LLM   │
     │  (with tools)│
     └──────┬───────┘
            │
     ┌──────▼───────┐
     │  Tool Call?  │── No ──► Final response → WS + history
     └──────┬───────┘
            │ Yes
     ┌──────▼───────┐
     │  Execute in  │
     │  Sandbox     │  ← native shell in this container
     └──────┬───────┘
            │
            └──► back to Call LLM (with tool result)
```

### Tool Sandbox (native)

Since the LLM agent runs inside the same Ubuntu container it controls, the sandbox is just a path-resolving wrapper around native subprocess calls:

```python
class Sandbox:
    """Confines file/shell operations to /workspace."""
    
    def __init__(self, root: Path = Path("/workspace")):
        self.root = root.resolve()
    
    def resolve(self, path: str) -> Path:
        full = (self.root / path).resolve()
        if not str(full).startswith(str(self.root)):
            raise SandboxError(f"Path escape: {path}")
        return full
    
    async def run_shell(self, command: str, timeout: int = 30):
        proc = await asyncio.create_subprocess_shell(
            command, stdout=PIPE, stderr=PIPE, cwd=str(self.root)
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout)
        except asyncio.TimeoutError:
            proc.kill()
            raise SandboxError(f"Timeout after {timeout}s")
        return ShellResult(stdout.decode(), stderr.decode(), proc.returncode or 0)
    
    async def read_file(self, path: str) -> str:
        return self.resolve(path).read_text()
    
    async def write_file(self, path: str, content: str):
        target = self.resolve(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
    
    async def glob(self, pattern: str) -> list[str]:
        return [str(p.relative_to(self.root)) for p in self.root.glob(pattern)]
    
    async def install(self, package: str, manager: str = "pip"):
        cmd = f"pip install {package}" if manager == "pip" else f"npm install {package}"
        return await self.run_shell(cmd, timeout=120)
```

---

## Channel Integrations (per workspace)

Channel adapters run inside the workspace server. Each adapter implements a common interface:

```python
class ChannelAdapter(ABC):
    async def connect(self, config: dict) -> None: ...
    async def disconnect(self) -> None: ...
    async def send_message(self, channel_id: str, text: str) -> None: ...
    async def handle_incoming(self, raw: dict) -> None: ...
```

### Supported Channels

| Type | Library | Notes |
|---|---|---|
| Slack | slack-bolt (async) | Socket mode or Events API |
| Discord | discord.py (rewrite) | Bot token |
| WhatsApp | whatsapp-business-api | Cloud API |
| Telegram | python-telegram-bot | Bot API |
| MS Teams | Custom (Graph API) | Bot Framework |
| Email | aiosmtpd + Mailgun/SendGrid | Inbound/outbound |
| API | FastAPI endpoint | Webhook receiver |
| Web Widget | Embedded iframe | Routes to WS |

Channels connect once on workspace startup and stay connected for the lifetime of the container. Incoming messages are routed to the agent orchestrator the same way dashboard WS messages are.

---

## Workflow Engine (per workspace)

Team orchestration (agentic workflows) runs inside the workspace server:

```
POST /api/v1/ws/teams/{id}/run
  → Resolve core agent + subagents
  → Core agent plans the task
  → Dispatches to subagents (parallel or sequential)
  → Subagent results collected by core agent
  → Core agent synthesizes final output
  → Results streamed via WebSocket to dashboard
```

---

## File & Directory Structure

```
dropin.bot/
├── app/                    # React dashboard (unchanged)
├── landing/                # Marketing page (unchanged)
├── hub/                    # Central Hub API
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── deps.py
│   │   ├── db.py
│   │   ├── auth/
│   │   │   ├── router.py
│   │   │   ├── jwt.py
│   │   │   ├── oauth.py
│   │   │   └── models.py
│   │   ├── workspaces/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   ├── service.py
│   │   │   └── provisioner.py   # K8s API calls
│   │   └── catalog/
│   │       └── router.py
│   └── tests/
│
├── workspace-server/       # Per-workspace container server
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py             # FastAPI + lifespan startup
│   │   ├── config.py
│   │   ├── db.py               # SQLite (on /workspace/data/)
│   │   ├── gateway/
│   │   │   ├── router.py       # WS /ws endpoint
│   │   │   ├── protocol.py     # Frame builders, challenge-response
│   │   │   └── session.py      # Connected client state
│   │   ├── agents/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   └── orchestrator.py # LangGraph agent loop
│   │   ├── sandbox.py           # Shell/file sandbox
│   │   ├── channels/
│   │   │   ├── router.py
│   │   │   ├── adapters/
│   │   │   │   ├── base.py
│   │   │   │   ├── slack.py
│   │   │   │   ├── discord.py
│   │   │   │   └── whatsapp.py
│   │   │   └── service.py
│   │   ├── tools/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   └── catalog.py
│   │   ├── teams/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   └── runner.py
│   │   ├── knowledge/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   └── embedder.py
│   │   ├── files/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   └── storage.py
│   │   ├── mcp/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   └── client.py
│   │   └── dashboard/
│   │       └── router.py
│   └── tests/
│
└── k8s/
    ├── base/
    │   ├── namespace.yaml
    │   ├── storage-class.yaml
    │   ├── statefulset.yaml        # Workspace pod template
    │   ├── service.yaml
    │   ├── ingress.yaml
    │   └── network-policy.yaml
    └── karpenter/
        ├── node-pool.yaml
        └── node-class.yaml
```

### Workspace Server Dockerfile

```dockerfile
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl wget git jq vim nano \
    python3 python3-pip python3-venv \
    build-essential unzip tar gzip ripgrep fd-find \
    sqlite3 libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install workspace server
COPY dist/workspace_server-*.whl /tmp/
RUN pip3 install /tmp/workspace_server-*.whl

# Workspace directories
RUN mkdir -p /workspace /workspace/data /workspace/files /tools
WORKDIR /workspace

# Persistent data volume
VOLUME ["/workspace"]

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/ws/health || exit 1

ENTRYPOINT ["uvicorn", "workspace_server.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### K8s Ingress (per-workspace routing)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: workspace-{id}
  namespace: dropin-workspaces
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  tls:
    - hosts:
        - ws-{id}.dropin.bot
      secretName: ws-{id}-tls
  rules:
    - host: ws-{id}.dropin.bot
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: workspace-{id}
                port:
                  number: 8080
```

---

## Frontend Changes Needed

The React dashboard currently connects to a single central gateway. With hub-and-spoke, it needs to:

1. **Auth flow**: Same — authenticate with Hub API, receive JWT
2. **Data fetching**: Workspace-specific REST calls go to `https://ws-{id}.dropin.bot/api/v1/ws/...` instead of a central API
3. **WebSocket**: Open one WS connection per active workspace, each to `wss://ws-{id}.dropin.bot/ws`
4. **Connection store**: Already per-workspace (`connectionStore.ts`), fits this model perfectly
5. **SharedWorker**: Update to manage multiple per-workspace WS connections instead of a single gateway connection

The `WorkspaceOpenClaw` config (`endpoint` + `token`) in the frontend becomes:
```ts
interface WorkspaceOpenClaw {
  endpoint: string;  // wss://ws-{id}.dropin.bot/ws
  token: string;     // gateway token for this workspace
}
```
The Hub API provides this on workspace list. The dashboard connects directly, no central relay.

---

## Security

- **Hub ↔ Workspace**: Hub provisions the workspace via K8s API with a generated gateway token. Token is passed as env var to the workspace container.
- **Dashboard ↔ Workspace**: Dashboard authenticates with the token + ECDSA device identity (protocol v4). The token never touches the central gateway.
- **Workspace isolation**: NetworkPolicy prevents inter-pod communication. Each workspace only talks to its own EBS volume.
- **Token rotation**: Hub can regenerate workspace tokens, triggering workspace server restart.
- **All secrets** encrypted at rest (KMS envelope encryption on Hub, EBS volume encryption on workspaces).

---

## Observability

- **Hub**: OpenTelemetry traces + metrics + structured logs → CloudWatch
- **Workspace servers**: Self-report health to Hub (periodic ping). Prometheus metrics per-pod. Logs via CloudWatch agent sidecar.
- **Alerts**: Workspace pod crashes, workspace server health check failures, provisioning failures, agent error rates per workspace.

---

## Development Workflow

```bash
# Terminal 1: Hub API
cd hub
uvicorn app.main:app --reload --port 8000

# Terminal 2: Workspace server (dev mode, no K8s)
cd workspace-server
WORKSPACE_ID=dev-ws-1 uvicorn app.main:app --reload --port 8080

# Terminal 3: Frontend
cd app
VITE_HUB_URL=http://localhost:8000 VITE_WS_ENDPOINT=ws://localhost:8080/ws npm run dev
```

Local development uses direct connections — no K8s, no EBS. The same code runs in production with different env vars.
