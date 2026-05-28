import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ProtectedRoute, Sidebar } from './components/shared';
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

function AppShell() {
  return (
    <div className="lg:ml-60">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to="/workflows" replace />} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
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
            </WorkspaceProvider>
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
