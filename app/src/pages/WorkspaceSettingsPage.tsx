import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wifi, WifiOff, Loader2, AlertTriangle, Settings2,
  Eye, EyeOff, Save, Trash2, RefreshCw, Terminal, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useConnectionStore } from '../stores/connectionStore';
import { clearDeviceIdentity } from '../lib/deviceIdentity';
import type { ConnStatus } from '../lib/gatewayProtocol';

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ConnStatus, { label: string; color: string; bg: string; dot: string; Icon: React.ElementType }> = {
  connected:        { label: 'Connected',        color: '#2D7D46', bg: 'rgba(45,125,70,0.12)',    dot: '#2D7D46', Icon: Wifi },
  connecting:       { label: 'Connecting…',      color: '#C05640', bg: 'rgba(192,86,64,0.12)',   dot: '#C05640', Icon: Loader2 },
  disconnected:     { label: 'Disconnected',     color: '#6B7280', bg: 'rgba(107,114,128,0.12)', dot: '#6B7280', Icon: WifiOff },
  error:            { label: 'Error',            color: '#DC2626', bg: 'rgba(220,38,38,0.12)',   dot: '#DC2626', Icon: AlertTriangle },
  pairing_required: { label: 'Pairing Required', color: '#D97706', bg: 'rgba(217,119,6,0.12)',   dot: '#D97706', Icon: AlertTriangle },
};

function StatusBadge({ status }: { status: ConnStatus }) {
  const cfg = STATUS_CONFIG[status];
  const { Icon } = cfg;
  const spinning = status === 'connecting';
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon size={13} className={spinning ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsPage() {
  const navigate = useNavigate();
  const { workspaces, updateWorkspace, deleteWorkspace } = useStore(); // workspaces used in handleDelete
  const { activeWorkspaceId, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { getConnection } = useConnectionStore();

  const conn = activeWorkspaceId ? getConnection(activeWorkspaceId) : null;

  // ── Local form state ──────────────────────────────────────────────────────
  const [name, setName]         = useState(activeWorkspace?.name ?? '');
  const [desc, setDesc]         = useState(activeWorkspace?.description ?? '');
  const [endpoint, setEndpoint] = useState(activeWorkspace?.openClaw?.endpoint ?? '');
  const [token, setToken]       = useState(activeWorkspace?.openClaw?.token ?? '');
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [saving, setSaving]     = useState(false);

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!activeWorkspaceId) return;
    setSaving(true);

    updateWorkspace(activeWorkspaceId, {
      name: name.trim() || activeWorkspace?.name,
      description: desc.trim(),
      openClaw: endpoint.trim() && token.trim()
        ? { endpoint: endpoint.trim(), token: token.trim() }
        : undefined,
    });

    // Persist openClaw config to localStorage (interim until backend)
    if (endpoint.trim() && token.trim()) {
      localStorage.setItem(
        `dropin-openclaw-${activeWorkspaceId}`,
        JSON.stringify({ endpoint: endpoint.trim(), token: token.trim() }),
      );
    } else {
      localStorage.removeItem(`dropin-openclaw-${activeWorkspaceId}`);
    }

    setTimeout(() => {
      setSaving(false);
      toast.success('Workspace settings saved');
    }, 300);
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!activeWorkspaceId || activeWorkspace?.isDefault) return;
    if (!confirm(`Delete workspace "${activeWorkspace?.name}"? This cannot be undone.`)) return;

    clearDeviceIdentity(activeWorkspaceId);
    localStorage.removeItem(`dropin-openclaw-${activeWorkspaceId}`);
    deleteWorkspace(activeWorkspaceId);

    // Switch to first remaining workspace
    const remaining = workspaces.filter(w => w.id !== activeWorkspaceId);
    if (remaining.length > 0) setActiveWorkspace(remaining[0].id);
    navigate('/dashboard');
    toast.success('Workspace deleted');
  };

  // ── Copy device ID ────────────────────────────────────────────────────────
  const handleCopyConnId = () => {
    if (!conn?.connId) return;
    navigator.clipboard.writeText(conn.connId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Reset device identity ─────────────────────────────────────────────────
  const handleResetDevice = () => {
    if (!activeWorkspaceId) return;
    if (!confirm('Reset device identity? The gateway will require re-pairing.')) return;
    clearDeviceIdentity(activeWorkspaceId);
    toast.info('Device identity reset. Reconnect to re-pair.');
  };

  const sectionClass = 'rounded-2xl p-6 lg:p-8 mb-6';
  const sectionStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)' };
  const labelClass = 'font-body font-medium text-sm mb-2 block';
  const labelStyle = { color: 'var(--text-primary)' };
  const helperClass = 'font-body text-xs mt-1.5 block';
  const helperStyle = { color: 'var(--text-muted)' };

  const status = conn?.status ?? 'disconnected';
  const isPairingRequired = status === 'pairing_required';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-20 px-6 lg:px-10 h-16 flex items-center justify-between"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="section-label mb-0">Workspace</p>
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              {activeWorkspace?.name ?? 'Settings'}
            </h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient transition-all duration-200"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Changes
        </button>
      </div>

      <div className="px-6 lg:px-10 pb-16 pt-6 max-w-[860px]">

        {/* ── Workspace Info ─────────────────────────────────────────────── */}
        <div className={sectionClass} style={sectionStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,86,64,0.10)' }}>
              <Settings2 size={20} style={{ color: 'var(--burnt-orange)' }} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Workspace Info</h3>
              <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>Name and description for this workspace.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>Name <span style={{ color: 'var(--burnt-orange)' }}>*</span></label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Production Workspace"
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Description</label>
              <input
                className="form-input"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What is this workspace for?"
              />
            </div>
          </div>
        </div>

        {/* ── Gateway Connection ─────────────────────────────────────────── */}
        <div className={sectionClass} style={sectionStyle}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,86,64,0.10)' }}>
                <Wifi size={20} style={{ color: 'var(--burnt-orange)' }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Gateway Connection</h3>
                <p className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>OpenClaw Gateway WebSocket endpoint for this workspace.</p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Pairing required banner */}
          {isPairingRequired && (
            <div
              className="rounded-xl p-4 mb-5 flex items-start gap-3"
              style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)' }}
            >
              <Terminal size={16} style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-sm mb-1" style={{ color: '#D97706' }}>Pairing approval required</p>
                <p className="font-body text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  A new device is requesting access to your Gateway. Run the following command on the machine running OpenClaw, then click Retry.
                </p>
                <code
                  className="block font-mono text-xs px-3 py-2 rounded-lg mb-3"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  openclaw devices approve --latest
                </code>
                <button
                  onClick={() => {
                    // Re-trigger by saving current config (hook will reconnect)
                    handleSave();
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-opacity"
                  style={{ color: '#D97706' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <RefreshCw size={12} /> Retry connection
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>Gateway Endpoint</label>
              <input
                className="form-input font-mono text-sm"
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                placeholder="wss://your-gateway-host:18789"
                spellCheck={false}
              />
              <span className={helperClass} style={helperStyle}>
                WebSocket URL of your OpenClaw Gateway. Use <code className="font-mono">wss://</code> for remote gateways.
              </span>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>Gateway Token <span style={{ color: 'var(--burnt-orange)' }}>*</span></label>
              <div className="relative">
                <input
                  className="form-input font-mono text-sm pr-10"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="sk-oc-…"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className={helperClass} style={helperStyle}>
                Shared-secret token from your Gateway config. Stored in localStorage until a backend is available.
              </span>
            </div>
          </div>
        </div>

        {/* ── Connection Details (when connected) ────────────────────────── */}
        {conn && (status === 'connected' || conn.connId) && (
          <div className={sectionClass} style={sectionStyle}>
            <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Connection Details</h3>
            <div className="space-y-3">
              {conn.connId && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>Connection ID</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                      {conn.connId.slice(0, 20)}…
                    </code>
                    <button
                      onClick={handleCopyConnId}
                      className="transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {copied ? <Check size={14} style={{ color: '#2D7D46' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}
              {conn.protocol && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>Protocol Version</span>
                  <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>v{conn.protocol}</span>
                </div>
              )}
              {conn.lastConnectedAt && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>Last Connected</span>
                  <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(conn.lastConnectedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {conn.error && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>Last Error</span>
                  <span className="font-body text-xs" style={{ color: '#DC2626' }}>{conn.error}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={handleResetDevice}
                className="flex items-center gap-2 text-xs font-medium transition-opacity"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <RefreshCw size={13} /> Reset device identity (forces re-pairing)
              </button>
            </div>
          </div>
        )}

        {/* ── Danger Zone ────────────────────────────────────────────────── */}
        {!activeWorkspace?.isDefault && (
          <div
            className={sectionClass}
            style={{ ...sectionStyle, borderColor: 'rgba(220,38,38,0.25)' }}
          >
            <h3 className="font-display font-semibold text-base mb-1" style={{ color: '#DC2626' }}>Danger Zone</h3>
            <p className="font-body text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Permanently delete this workspace and all its configuration. This cannot be undone.
            </p>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{ border: '1.5px solid rgba(220,38,38,0.4)', color: '#DC2626' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={15} /> Delete Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
