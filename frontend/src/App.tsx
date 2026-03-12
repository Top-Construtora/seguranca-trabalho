import { lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Toaster } from './components/ui/toaster'

// Lazy load de todas as páginas protegidas
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const WorksPage = lazy(() => import('./pages/WorksPage').then(m => ({ default: m.WorksPage })))
const EvaluationsPage = lazy(() => import('./pages/EvaluationsPage').then(m => ({ default: m.EvaluationsPage })))
const EvaluationEditPage = lazy(() => import('./pages/EvaluationEditPage').then(m => ({ default: m.EvaluationEditPage })))
const EvaluationReportPage = lazy(() => import('./pages/EvaluationReportPage').then(m => ({ default: m.EvaluationReportPage })))
const EvaluationRedirect = lazy(() => import('./components/EvaluationRedirect').then(m => ({ default: m.EvaluationRedirect })))
const ActionPlansPage = lazy(() => import('./pages/ActionPlansPage').then(m => ({ default: m.ActionPlansPage })))
const RankingPage = lazy(() => import('./pages/RankingPage').then(m => ({ default: m.RankingPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPageUltimate').then(m => ({ default: m.ReportsPageUltimate })))
const ListDocuments = lazy(() => import('./pages/documents/ListDocuments'))
const CreateDocument = lazy(() => import('./pages/documents/CreateDocument'))
const EditDocument = lazy(() => import('./pages/documents/EditDocument'))
const AccidentsPage = lazy(() => import('./pages/AccidentsPage').then(m => ({ default: m.AccidentsPage })))
const AccidentFormPage = lazy(() => import('./pages/AccidentFormPage').then(m => ({ default: m.AccidentFormPage })))
const AccidentDetailsPage = lazy(() => import('./pages/AccidentDetailsPage').then(m => ({ default: m.AccidentDetailsPage })))
const AccidentDashboardPage = lazy(() => import('./pages/AccidentDashboardPage').then(m => ({ default: m.AccidentDashboardPage })))
const CorrectiveActionsPage = lazy(() => import('./pages/CorrectiveActionsPage').then(m => ({ default: m.CorrectiveActionsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })))
const UserFormPage = lazy(() => import('./pages/UserFormPage').then(m => ({ default: m.UserFormPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/works"
              element={
                <ProtectedRoute>
                  <WorksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluations/obra"
              element={
                <ProtectedRoute>
                  <EvaluationsPage evaluationType="obra" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluations/alojamento"
              element={
                <ProtectedRoute>
                  <EvaluationsPage evaluationType="alojamento" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluations/:id"
              element={
                <ProtectedRoute>
                  <EvaluationRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluations/:type/:id/edit"
              element={
                <ProtectedRoute>
                  <EvaluationEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranking"
              element={
                <ProtectedRoute>
                  <RankingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/action-plans"
              element={
                <ProtectedRoute>
                  <ActionPlansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/evaluation/:id"
              element={
                <ProtectedRoute>
                  <EvaluationReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <ListDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/new"
              element={
                <ProtectedRoute>
                  <CreateDocument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/:id/edit"
              element={
                <ProtectedRoute>
                  <EditDocument />
                </ProtectedRoute>
              }
            />
            {/* Rotas de Acidentes */}
            <Route
              path="/accidents"
              element={
                <ProtectedRoute>
                  <AccidentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accidents/new"
              element={
                <ProtectedRoute>
                  <AccidentFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accidents/dashboard"
              element={
                <ProtectedRoute>
                  <AccidentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accidents/:id"
              element={
                <ProtectedRoute>
                  <AccidentDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accidents/:id/edit"
              element={
                <ProtectedRoute>
                  <AccidentFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/corrective-actions"
              element={
                <ProtectedRoute>
                  <CorrectiveActionsPage />
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
            {/* Rotas de Usuários (Admin) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute role="admin">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <ProtectedRoute role="admin">
                  <UserFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <ProtectedRoute role="admin">
                  <UserFormPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
    </QueryClientProvider>
  )
}
