import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { WorksPage } from './pages/WorksPage'
import { EvaluationsPage } from './pages/EvaluationsPage'
import { EvaluationEditPage } from './pages/EvaluationEditPage'
import { EvaluationReportPage } from './pages/EvaluationReportPage'
import { EvaluationRedirect } from './components/EvaluationRedirect'
import { ActionPlansPage } from './pages/ActionPlansPage'
import { RankingPage } from './pages/RankingPage'
import { ReportsPageUltimate as ReportsPage } from './pages/ReportsPageUltimate'
import ListDocuments from './pages/documents/ListDocuments'
import CreateDocument from './pages/documents/CreateDocument'
import EditDocument from './pages/documents/EditDocument'
import { AccidentsPage } from './pages/AccidentsPage'
import { AccidentFormPage } from './pages/AccidentFormPage'
import { AccidentDetailsPage } from './pages/AccidentDetailsPage'
import { AccidentDashboardPage } from './pages/AccidentDashboardPage'
import { CorrectiveActionsPage } from './pages/CorrectiveActionsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Toaster } from './components/ui/toaster'

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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
    </QueryClientProvider>
  )
}