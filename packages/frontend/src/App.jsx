import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/Toast/index.js'
import ProtectedRoute from '@/components/ProtectedRoute.jsx'
import Dashboard from '@/pages/Dashboard.jsx'
import Login from '@/pages/Login.jsx'

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
      </Routes>
    </ToastProvider>
  )
}
