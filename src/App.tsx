import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Topbar        from './components/Topbar'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Dashboard     from './pages/Dashboard'
import CreateSession from './pages/CreateSession'
import Interview     from './pages/Interview'
import Results       from './pages/Results'

const AUTH_PATHS = ['/login', '/register']

function Layout() {
  const { pathname } = useLocation()
  const isAuthPage   = AUTH_PATHS.includes(pathname)

  return (
    <>
      {!isAuthPage && <Topbar />}
      <Routes>
        {/* Public auth routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create"    element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/results"   element={<ProtectedRoute><Results /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}
