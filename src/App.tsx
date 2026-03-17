import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { GuestRoute } from './components/guards/GuestRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TaskListPage } from './pages/tasks/TaskListPage';
import { TaskCreatePage } from './pages/tasks/TaskCreatePage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { AreaListPage } from './pages/areas/AreaListPage';
import { AreaCreatePage } from './pages/areas/AreaCreatePage';
import { AreaDetailPage } from './pages/areas/AreaDetailPage';
import { MeetingListPage } from './pages/meetings/MeetingListPage';
import { MeetingCreatePage } from './pages/meetings/MeetingCreatePage';
import { MeetingDetailPage } from './pages/meetings/MeetingDetailPage';
import { UserListPage } from './pages/users/UserListPage';
import { ConsolidatedPage } from './pages/consolidated/ConsolidatedPage';
import { SettingsPage } from './pages/settings/SettingsPage';

function App() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Tasks - all authenticated roles */}
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/create" element={<TaskCreatePage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />

          {/* Meetings - all authenticated roles */}
          <Route path="/meetings" element={<MeetingListPage />} />
          <Route path="/meetings/create" element={<MeetingCreatePage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        </Route>
      </Route>

      {/* SuperAdmin & Area Manager routes */}
      <Route element={<ProtectedRoute allowedRoles={['superadmin', 'area_manager']} />}>
        <Route element={<AppLayout />}>
          <Route path="/areas" element={<AreaListPage />} />
          <Route path="/areas/create" element={<AreaCreatePage />} />
          <Route path="/areas/:id" element={<AreaDetailPage />} />
        </Route>
      </Route>

      {/* SuperAdmin only routes */}
      <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/users" element={<UserListPage />} />
          <Route path="/consolidated" element={<ConsolidatedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
