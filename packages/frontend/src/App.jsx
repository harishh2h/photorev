import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/Toast/index.js'
import ProtectedRoute from '@/components/ProtectedRoute.jsx'
import AdminRoute from '@/components/AdminRoute.jsx'
import Dashboard from '@/pages/Dashboard.jsx'
import Login from '@/pages/Login.jsx'
import SetupPage from '@/pages/SetupPage.jsx'
import ProjectViewPage from '@/pages/ProjectViewPage.jsx'
import PhotoViewerPage from '@/pages/PhotoViewerPage.jsx'
import PublicSharePage from '@/pages/PublicSharePage.jsx'
import AdminUsersPage from '@/features/admin/AdminUsersPage.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/s/:token" element={<PublicSharePage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/projects" element={<Navigate to="/" replace />} />
        <Route path="/uploads" element={<Navigate to="/" replace />} />
        <Route
          path="/projects/:projectId/photos/:photoId"
          element={
            <ProtectedRoute>
              <PhotoViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
      </Routes>
    </ToastProvider>
  )
}
