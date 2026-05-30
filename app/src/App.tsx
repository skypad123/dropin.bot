import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ProtectedRoute, Sidebar } from './components/shared';
import { useOpenClawConnection } from './hooks/useOpenClawConnection';
import { useWorkspace } from './context/WorkspaceContext';

/** Forces a full remount of WorkspaceSettingsPage when the active workspace changes,
 *  so useState initializers always reflect the current workspace's stored values. */
function WorkspaceSettingsPageWrapper() {
  const { activeWorkspaceId } = useWorkspace();
  return <WorkspaceSettingsPage key={activeWorkspaceId ?? 'none'} />;
}
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AgentsPage from './pages/AgentsPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import SettingsPage from './pages/SettingsPage';
import AgentConfigPage from './pages/AgentConfigPage';
import ChannelsPage from './pages/ChannelsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import WorkflowCanvasPage from './pages/WorkflowCanvasPage';
import KnowledgeBasesPage from './pages/KnowledgeBasesPage';
import FilesPage from './pages/FilesPage';
import AppsPage from './pages/AppsPage';
import ToolsPage from './pages/ToolsPage';
import PolicyPage from './pages/PolicyPage';
import DashboardPage from './pages/DashboardPage';
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage';

function AppShell() {
  // Mount the SharedWorker connection manager once for this tab.
  // It reacts to workspace switches and manages the WS lifecycle.
  useOpenClawConnection();

  return (
    <div className="lg:ml-60">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/workspace-settings" element={<ProtectedRoute><WorkspaceSettingsPageWrapper /></ProtectedRoute>} />
        <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBasesPage /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
        <Route path="/workflows" element={<ProtectedRoute><WorkflowsPage /></ProtectedRoute>} />
        <Route path="/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
        <Route path="/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
        <Route path="/apps" element={<ProtectedRoute><AppsPage /></ProtectedRoute>} />
        <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
        <Route path="/policy" element={<ProtectedRoute><PolicyPage /></ProtectedRoute>} />
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
      {/* Full-screen canvas — outside AppShell so no sidebar renders */}
      <Route path="/workflows/:id" element={<ProtectedRoute><WorkflowCanvasPage /></ProtectedRoute>} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <StoreProvider>
            <WorkspaceProvider>
              <RootRouter />
              <Toaster position="bottom-right" richColors closeButton />
            </WorkspaceProvider>
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
