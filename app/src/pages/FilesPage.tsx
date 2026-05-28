import React, { useState } from 'react';
import {
  FolderOpen, Folder, FolderPlus, File, FileCode, FileJson, FileText,
  Image, Video, Music, Archive, LayoutGrid, List, SortAsc, SortDesc,
  Download, Copy, MoreHorizontal, ChevronDown, ChevronRight, Search, Layers
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import type { EnvNode, EnvFileType } from '../types';

export default function FilesPage() {
  const { workspaces } = useStore();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace ?? workspaces[0];

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

  const findEnvNode = (nodes: EnvNode[], id: string): EnvNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) { const found = findEnvNode(n.children, id); if (found) return found; }
    }
    return null;
  };

  const fileIcon = (type: EnvFileType, size = 16) => {
    switch (type) {
      case 'folder':  return <Folder size={size} style={{ color: '#C05640' }} />;
      case 'py':      return <FileCode size={size} style={{ color: '#3B82F6' }} />;
      case 'ts':
      case 'js':      return <FileCode size={size} style={{ color: '#F59E0B' }} />;
      case 'json':    return <FileJson size={size} style={{ color: '#10B981' }} />;
      case 'md':      return <FileText size={size} style={{ color: '#6366F1' }} />;
      case 'yaml':
      case 'sh':      return <FileCode size={size} style={{ color: '#EC4899' }} />;
      case 'img':     return <Image size={size} style={{ color: '#8B5CF6' }} />;
      case 'video':   return <Video size={size} style={{ color: '#EF4444' }} />;
      case 'audio':   return <Music size={size} style={{ color: '#14B8A6' }} />;
      case 'zip':     return <Archive size={size} style={{ color: '#F97316' }} />;
      default:        return <File size={size} style={{ color: 'var(--text-muted)' }} />;
    }
  };

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
          <span className="w-4 flex-shrink-0 flex items-center justify-center">
            {isFolder
              ? (isExpanded
                  ? <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />)
              : null}
          </span>
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

  const envNodes: EnvNode[] = activeWs?.env ?? [];
  const selectedNode = envSelectedId ? findEnvNode(envNodes, envSelectedId) : null;
  const folderForPanel: EnvNode | null = selectedNode?.type === 'folder' ? selectedNode : null;
  const rawContents: EnvNode[] = folderForPanel ? (folderForPanel.children ?? []) : envNodes;

  const envFiltered = rawContents.filter(n => {
    const matchSearch = n.name.toLowerCase().includes(envSearch.toLowerCase());
    const matchType = envFilterType === 'all' || n.type === envFilterType;
    return matchSearch && matchType;
  });

  const envSorted = [...envFiltered].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (b.type === 'folder' && a.type !== 'folder') return 1;
    let cmp = 0;
    if (envSortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (envSortBy === 'type') cmp = a.type.localeCompare(b.type);
    else if (envSortBy === 'modified') cmp = a.modifiedAt.localeCompare(b.modifiedAt);
    else if (envSortBy === 'size') cmp = (a.size ?? '').localeCompare(b.size ?? '');
    return envSortDir === 'asc' ? cmp : -cmp;
  });

  const getEnvBreadcrumb = (): string[] => {
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

  const envBreadcrumb = getEnvBreadcrumb();
  const typesInFolder = Array.from(new Set(rawContents.map(n => n.type)));

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 lg:px-10 h-16 flex items-center justify-between" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,86,64,0.10)' }}>
            <FolderOpen size={18} style={{ color: 'var(--burnt-orange)' }} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>Files</h1>
            <p className="font-body text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>Browse and manage workspace files</p>
          </div>
        </div>
      </div>

      {/* File browser */}
      <div className="flex flex-col flex-1 min-h-0 px-6 lg:px-10 ">
        <div className="flex gap-0 overflow-hidden flex-1 min-h-0 -mx-6 lg:-mx-10" style={{ border: '1px solid var(--border-color)', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
          {/* Left: Tree panel */}
          <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
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

          {/* Right: Content panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar */}
            <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
              {/* Row 1: breadcrumb + search */}
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {envBreadcrumb.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                      <span className="font-mono text-[11px]" style={{ color: i === envBreadcrumb.length - 1 ? 'var(--burnt-orange)' : 'var(--text-muted)' }}>{crumb}</span>
                    </span>
                  ))}
                </div>
                <div className="relative flex-shrink-0">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="form-input pl-7 py-1.5 text-xs w-36"
                    placeholder="Search…"
                    value={envSearch}
                    onChange={e => setEnvSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* Row 2: filters + sort + view toggle */}
              <div className="flex items-center gap-2 px-4 py-2">
                {typesInFolder.length > 1 && (
                  <select
                    className="form-input form-select py-1 text-xs"
                    value={envFilterType}
                    onChange={e => setEnvFilterType(e.target.value)}
                  >
                    <option value="all">All types</option>
                    {typesInFolder.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                <select
                  className="form-input form-select py-1 text-xs"
                  value={envSortBy}
                  onChange={e => setEnvSortBy(e.target.value as typeof envSortBy)}
                >
                  <option value="name">Name</option>
                  <option value="modified">Modified</option>
                  <option value="size">Size</option>
                  <option value="type">Type</option>
                </select>
                <button
                  className="p-1.5 rounded-lg transition-colors duration-150 flex-shrink-0"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                  onClick={() => setEnvSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; e.currentTarget.style.borderColor = 'var(--burnt-orange)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  {envSortDir === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />}
                </button>
                <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border-color)' }}>
                  <button
                    className="p-1.5 transition-colors duration-150"
                    style={{ background: envViewMode === 'list' ? 'rgba(192,86,64,0.10)' : 'transparent', color: envViewMode === 'list' ? 'var(--burnt-orange)' : 'var(--text-muted)' }}
                    onClick={() => setEnvViewMode('list')}
                    title="List view"
                  ><List size={13} /></button>
                  <button
                    className="p-1.5 transition-colors duration-150"
                    style={{ background: envViewMode === 'grid' ? 'rgba(192,86,64,0.10)' : 'transparent', color: envViewMode === 'grid' ? 'var(--burnt-orange)' : 'var(--text-muted)', borderLeft: '1px solid var(--border-color)' }}
                    onClick={() => setEnvViewMode('grid')}
                    title="Grid view"
                  ><LayoutGrid size={13} /></button>
                </div>
                <span className="ml-auto font-mono text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{envSorted.length} item{envSorted.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4">
              {envSorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <FolderOpen size={36} style={{ color: 'var(--text-muted)' }} />
                  <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>This folder is empty</p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>Upload files or create a new folder to get started.</p>
                </div>
              ) : envViewMode === 'list' ? (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
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
                  {envSorted.map((node, i) => {
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
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isFolder
                            ? <FolderOpen size={16} style={{ color: 'var(--burnt-orange)', flexShrink: 0 }} />
                            : fileIcon(node.type, 16)}
                          <span className="font-body text-sm truncate" style={{ color: 'var(--text-primary)' }}>{node.name}</span>
                        </div>
                        <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{node.type}</span>
                        <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{node.modifiedAt}</span>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{node.size ?? '—'}</span>
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
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                  {envSorted.map(node => {
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
      </div>
    </div>
  );
}
