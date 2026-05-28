import { createContext, useCallback, useContext, useState } from 'react';
import type { Instance, InstanceInput, Workspace, AgentTeam, Channel, KnowledgeBase } from '../types';
import { INITIAL_INSTANCES, INITIAL_WORKSPACES, INITIAL_AGENT_TEAMS, INITIAL_CHANNELS, INITIAL_KBS, CONNECTED_APPS_TEMPLATE } from '../data';

const StoreContext = createContext<{
  instances: Instance[];
  addInstance: (i: InstanceInput) => void;
  updateInstance: (id: string, data: Partial<Instance>) => void;
  deleteInstance: (id: string) => void;
  getInstance: (id: string) => Instance | undefined;
  workspaces: Workspace[];
  addWorkspace: (w: Omit<Workspace, 'id' | 'isDefault' | 'connectedApps' | 'documents' | 'dataSources' | 'collaborators'>) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  getWorkspace: (id: string) => Workspace | undefined;
  teams: AgentTeam[];
  addTeam: (t: AgentTeam) => void;
  updateTeam: (t: AgentTeam) => void;
  removeTeam: (id: string) => void;
  channels: Channel[];
  addChannel: (c: Channel) => void;
  updateChannel: (id: string, data: Partial<Channel>) => void;
  deleteChannel: (id: string) => void;
  knowledgeBases: KnowledgeBase[];
  addKnowledgeBase: (kb: KnowledgeBase) => void;
  updateKnowledgeBase: (id: string, data: Partial<KnowledgeBase>) => void;
  deleteKnowledgeBase: (id: string) => void;
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
  teams: [],
  addTeam: () => {},
  updateTeam: () => {},
  removeTeam: () => {},
  channels: [],
  addChannel: () => {},
  updateChannel: () => {},
  deleteChannel: () => {},
  knowledgeBases: [],
  addKnowledgeBase: () => {},
  updateKnowledgeBase: () => {},
  deleteKnowledgeBase: () => {},
});

export function useStore() { return useContext(StoreContext); }

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<Instance[]>(INITIAL_INSTANCES);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [teams, setTeams] = useState<AgentTeam[]>(INITIAL_AGENT_TEAMS);
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(INITIAL_KBS);

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

  const addWorkspace = useCallback((data: Omit<Workspace, 'id' | 'isDefault' | 'connectedApps' | 'documents' | 'dataSources' | 'mcps' | 'env' | 'collaborators'>) => {
    const newWs: Workspace = {
      ...data,
      id: 'ws-' + Date.now(),
      connectedApps: CONNECTED_APPS_TEMPLATE.map(a => ({ ...a, connected: false })),
      documents: [],
      dataSources: [],
      mcps: [],
      env: [],
      collaborators: [],
    };
    setWorkspaces(prev => [...prev, newWs]);
  }, []);
  const updateWorkspace = useCallback((id: string, data: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
  }, []);
  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => {
      const target = prev.find(w => w.id === id);
      if (!target || target.isDefault) return prev;
      return prev.filter(w => w.id !== id);
    });
  }, []);
  const getWorkspace = useCallback((id: string) => workspaces.find(w => w.id === id), [workspaces]);

  const addTeam = useCallback((t: AgentTeam) => setTeams(prev => [...prev, t]), []);
  const updateTeam = useCallback((t: AgentTeam) => setTeams(prev => prev.map(x => x.id === t.id ? t : x)), []);
  const removeTeam = useCallback((id: string) => setTeams(prev => prev.filter(x => x.id !== id)), []);

  const addChannel = useCallback((c: Channel) => setChannels(prev => [...prev, c]), []);
  const updateChannel = useCallback((id: string, data: Partial<Channel>) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);
  const deleteChannel = useCallback((id: string) => setChannels(prev => prev.filter(c => c.id !== id)), []);

  const addKnowledgeBase = useCallback((kb: KnowledgeBase) => setKnowledgeBases(prev => [...prev, kb]), []);
  const updateKnowledgeBase = useCallback((id: string, data: Partial<KnowledgeBase>) => {
    setKnowledgeBases(prev => prev.map(kb => kb.id === id ? { ...kb, ...data } : kb));
  }, []);
  const deleteKnowledgeBase = useCallback((id: string) => setKnowledgeBases(prev => prev.filter(kb => kb.id !== id)), []);

  return (
    <StoreContext.Provider value={{
      instances, addInstance, updateInstance, deleteInstance, getInstance,
      workspaces, addWorkspace, updateWorkspace, deleteWorkspace, getWorkspace,
      teams, addTeam, updateTeam, removeTeam,
      channels, addChannel, updateChannel, deleteChannel,
      knowledgeBases, addKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase,
    }}>
      {children}
    </StoreContext.Provider>
  );
}
