import { useNavigate } from 'react-router-dom';
import { Bot, MessageSquare, Users, BookOpen, CheckCircle2, Zap, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import type { ChannelType, ChannelStatus } from '../types';

const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  slack: 'Slack',
  discord: 'Discord',
  'web-widget': 'Web Widget',
  whatsapp: 'WhatsApp',
  api: 'API',
  email: 'Email',
  telegram: 'Telegram',
  teams: 'Teams',
};

const channelStatusColor: Record<ChannelStatus, string> = {
  connected: '#2D7D46',
  disconnected: 'var(--text-muted)',
  error: '#DC2626',
  pending: '#F59E0B',
};

const instanceStatusColor: Record<string, string> = {
  running: '#2D7D46',
  stopped: 'var(--text-muted)',
  error: '#DC2626',
};

function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="font-mono text-[10px] px-2 py-0.5 rounded-full"
      style={{
        background: 'var(--bg-elevated)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-color)',
      }}
    >
      {count}
    </span>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <p className="section-label mb-0">{label}</p>
      <CountBadge count={count} />
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex items-center gap-3"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p
          className="font-display font-bold text-xl leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>
        <p
          className="font-mono text-[10px] mt-0.5 uppercase tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div
      className="rounded-2xl px-6 py-10 flex flex-col items-center justify-center gap-3 border-dashed"
      style={{
        background: 'var(--bg-surface)',
        border: '1.5px dashed var(--border-color)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { instances, channels, teams, knowledgeBases } = useStore();
  const { activeWorkspaceId } = useWorkspace();

  const wsInstances = instances.filter((i) => i.workspaceId === activeWorkspaceId);
  const wsChannels = channels.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsTeams = teams.filter((t) => t.workspaceId === activeWorkspaceId);
  const wsKBs = knowledgeBases.filter((k) => k.workspaceId === activeWorkspaceId);

  const runningCount = wsInstances.filter((i) => i.status === 'running').length;
  const connectedCount = wsChannels.filter((c) => c.status === 'connected').length;

  const recentChannels = [...wsChannels]
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 5);

  const topAgents = wsInstances.slice(0, 5);
  const topChannels = wsChannels.slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="sticky top-0 z-10 px-4 sm:px-6 lg:px-10 py-4 flex-shrink-0"
        style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <p className="section-label mb-0">setup</p>
        <div className="flex items-center gap-2 mt-0.5">
          <h1
            className="font-display font-bold text-xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Dashboard
          </h1>
          <InfoTooltip content="Overview of the active workspace — see your agents, channels, teams, and knowledge bases at a glance." />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            value={wsInstances.length}
            label="Agents"
            icon={<Bot size={16} />}
            color="var(--burnt-orange)"
          />
          <StatCard
            value={runningCount}
            label="Running"
            icon={<Zap size={16} />}
            color="#2D7D46"
          />
          <StatCard
            value={wsChannels.length}
            label="Channels"
            icon={<MessageSquare size={16} />}
            color="#5865F2"
          />
          <StatCard
            value={connectedCount}
            label="Connected"
            icon={<CheckCircle2 size={16} />}
            color="#2D7D46"
          />
          <StatCard
            value={wsTeams.length}
            label="Teams"
            icon={<Users size={16} />}
            color="#F59E0B"
          />
          <StatCard
            value={wsKBs.length}
            label="Knowledge Bases"
            icon={<BookOpen size={16} />}
            color="#7C3AED"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-8 min-w-0">
            <div className="space-y-4">
              <SectionHeader label="agents" count={wsInstances.length} />

              {topAgents.length === 0 ? (
                <EmptyState
                  icon={<Bot size={32} />}
                  message="No agents in this workspace"
                />
              ) : (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {topAgents.map((inst, i) => {
                    const statusColor =
                      instanceStatusColor[inst.status] ?? 'var(--text-muted)';
                    return (
                      <div
                        key={inst.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{
                          borderBottom:
                            i < topAgents.length - 1
                              ? '1px solid var(--border-color)'
                              : 'none',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(192,86,64,0.08)',
                            color: 'var(--burnt-orange)',
                          }}
                        >
                          {inst.status === 'running' ? (
                            <Zap size={14} />
                          ) : (
                            <Bot size={14} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className="font-display font-semibold text-sm truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {inst.name}
                            </p>
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: statusColor }}
                            />
                          </div>
                          <p
                            className="font-mono text-[10px] truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {inst.model}
                          </p>
                          <div
                            className="w-full h-1 rounded-full mt-1.5"
                            style={{ background: 'var(--bg-elevated)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(inst.usage, 100)}%`,
                                background:
                                  'linear-gradient(135deg, #C05640 0%, #F39075 100%)',
                              }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/agents/${inst.id}`)}
                          className="px-3 py-1.5 rounded-lg font-mono text-[10px] font-medium flex-shrink-0 transition-colors duration-150"
                          style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--burnt-orange)';
                            e.currentTarget.style.borderColor =
                              'var(--burnt-orange)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor =
                              'var(--border-color)';
                          }}
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <SectionHeader label="channels" count={wsChannels.length} />

              {topChannels.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare size={32} />}
                  message="No channels in this workspace"
                />
              ) : (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {topChannels.map((ch, i) => {
                    const dotColor =
                      channelStatusColor[ch.status] ?? 'var(--text-muted)';
                    return (
                      <div
                        key={ch.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{
                          borderBottom:
                            i < topChannels.length - 1
                              ? '1px solid var(--border-color)'
                              : 'none',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(88,101,242,0.08)',
                            color: '#5865F2',
                          }}
                        >
                          <MessageSquare size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className="font-display font-semibold text-sm truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {ch.name}
                            </p>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide"
                              style={{
                                background: `${dotColor}15`,
                                color: dotColor,
                                border: `1px solid ${dotColor}30`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: dotColor }}
                              />
                              {ch.status}
                            </span>
                          </div>
                          <p
                            className="font-mono text-[10px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {CHANNEL_TYPE_LABEL[ch.type] ?? ch.type}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className="font-mono text-[10px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {ch.messages.toLocaleString()} msgs
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
            <div className="space-y-3">
              <p className="section-label mb-0">quick actions</p>

              {[
                {
                  label: 'New Agent',
                  sub: 'Create an AI worker',
                  path: '/agents/new',
                  icon: <Bot size={16} style={{ color: 'var(--burnt-orange)' }} />,
                },
                {
                  label: 'Add Channel',
                  sub: 'Connect a messaging channel',
                  path: '/channels',
                  icon: (
                    <MessageSquare size={16} style={{ color: 'var(--burnt-orange)' }} />
                  ),
                },
                {
                  label: 'New Knowledge Base',
                  sub: 'Set up retrieval pipeline',
                  path: '/knowledge',
                  icon: (
                    <BookOpen size={16} style={{ color: 'var(--burnt-orange)' }} />
                  ),
                },
                {
                  label: 'New Team',
                  sub: 'Build an agentic workflow',
                  path: '/teams',
                  icon: (
                    <Users size={16} style={{ color: 'var(--burnt-orange)' }} />
                  ),
                },
              ].map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(192,86,64,0.35)';
                    e.currentTarget.style.background =
                      'rgba(192,86,64,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192,86,64,0.08)' }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <p
                      className="font-display font-semibold text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {action.label}
                    </p>
                    <p
                      className="font-body text-[11px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {action.sub}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <p className="section-label mb-0">recent</p>

              {recentChannels.length === 0 ? (
                <p
                  className="font-body text-xs py-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No channel activity yet
                </p>
              ) : (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {recentChannels.map((ch, i) => (
                    <div
                      key={ch.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        borderBottom:
                          i < recentChannels.length - 1
                            ? '1px solid var(--border-color)'
                            : 'none',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-display font-semibold text-sm truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {ch.name}
                        </p>
                        <p
                          className="font-mono text-[10px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {CHANNEL_TYPE_LABEL[ch.type] ?? ch.type}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className="font-mono text-[10px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {ch.messages.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
