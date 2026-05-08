import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PageLoader } from './components/ui'
import AppLayout from './components/layout/AppLayout'

import Login from './pages/Login'
import CandidatePortal from './pages/candidate/CandidatePortal'

import HRDashboard from './pages/hr/HRDashboard'
import InternList from './pages/hr/InternList'
import InitiateIntern from './pages/hr/InitiateIntern'
import InternDetail from './pages/hr/InternDetail'
import MastersSettings from './pages/hr/MastersSettings'

import AccountsDashboard from './pages/accounts/AccountsDashboard'
import AccountsTaskDetail from './pages/accounts/AccountsTaskDetail'

import ITDashboard from './pages/it/ITDashboard'
import ITTaskDetail from './pages/it/ITTaskDetail'

import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerReview from './pages/manager/ManagerReview'

const ROLE_HOME = {
  hr: '/hr/dashboard',
  accounts: '/accounts/dashboard',
  it: '/it/dashboard',
  manager: '/manager/dashboard',
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/portal/:token" element={<CandidatePortal />} />
          <Route path="/" element={<RootRedirect />} />

          {/* All protected routes share the sidebar layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

            {/* ── HR ───────────────────────────────────── */}
            <Route path="/hr/dashboard"  element={<ProtectedRoute roles={['hr']}><HRDashboard /></ProtectedRoute>} />
            <Route path="/hr/interns"    element={<ProtectedRoute roles={['hr']}><InternList /></ProtectedRoute>} />
            <Route path="/hr/initiate"   element={<ProtectedRoute roles={['hr']}><InitiateIntern /></ProtectedRoute>} />
            <Route path="/hr/intern/:id" element={<ProtectedRoute roles={['hr']}><InternDetail /></ProtectedRoute>} />
            <Route path="/hr/masters" element={<ProtectedRoute roles={['hr']}><MastersSettings /></ProtectedRoute>} />

            {/* ── Accounts ─────────────────────────────── */}
            <Route path="/accounts/dashboard"    element={<ProtectedRoute roles={['accounts']}><AccountsDashboard /></ProtectedRoute>} />
            <Route path="/accounts/task/:taskId" element={<ProtectedRoute roles={['accounts']}><AccountsTaskDetail /></ProtectedRoute>} />

            {/* ── IT ───────────────────────────────────── */}
            <Route path="/it/dashboard"    element={<ProtectedRoute roles={['it']}><ITDashboard /></ProtectedRoute>} />
            <Route path="/it/task/:taskId" element={<ProtectedRoute roles={['it']}><ITTaskDetail /></ProtectedRoute>} />

            {/* ── Manager ──────────────────────────────── */}
            <Route path="/manager/dashboard"      element={<ProtectedRoute roles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/manager/review/:id"     element={<ProtectedRoute roles={['manager']}><ManagerReview /></ProtectedRoute>} />

          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}