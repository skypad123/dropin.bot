import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStore } from './StoreContext';
import type { Workspace } from '../types';

interface WorkspaceContextValue {
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (id: string) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  activeWorkspaceId: null,
  activeWorkspace: null,
  setActiveWorkspace: () => {},
  isLoading: true,
});

export function useWorkspace() { return useContext(WorkspaceContext); }

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { workspaces } = useStore();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve active workspace from ID + workspaces array
  const activeWorkspace = activeWorkspaceId
    ? workspaces.find(w => w.id === activeWorkspaceId) ?? null
    : null;

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dropin-active-workspace');
    if (saved && workspaces.some(w => w.id === saved)) {
      setActiveWorkspaceId(saved);
    } else if (workspaces.length > 0) {
      // Fall back to default workspace, then first workspace
      const defaultWs = workspaces.find(w => w.isDefault);
      const fallback = defaultWs ?? workspaces[0];
      setActiveWorkspaceId(fallback.id);
    }
    setIsLoading(false);
  }, [workspaces]);

  const setActiveWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('dropin-active-workspace', id);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ activeWorkspaceId, activeWorkspace, setActiveWorkspace, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
