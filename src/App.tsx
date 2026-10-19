import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import FriendsPage from './pages/FriendsPage'
import GroupsPage from './pages/GroupsPage'
import DemoApp from './demo/DemoApp'

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/demo" element={<DemoApp />} />
      <Route path="/" element={session ? <Layout><CalendarPage /></Layout> : <LoginPage />} />
      <Route path="/friends" element={session ? <Layout><FriendsPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/groups" element={session ? <Layout><GroupsPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
