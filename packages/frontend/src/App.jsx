import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/Toast/index.js'
import ProtectedRoute from '@/components/ProtectedRoute.jsx'
import Dashboard from '@/pages/Dashboard.jsx'
import Login from '@/pages/Login.jsx'
import ProjectsPage from '@/pages/ProjectsPage.jsx'
import UploadsPage from '@/pages/UploadsPage.jsx'
import ProfilePage from '@/pages/ProfilePage.jsx'
import ProjectViewPage from '@/pages/ProjectViewPage.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
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
          path="/uploads"
          element={
            <ProtectedRoute>
              <UploadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  )
}
