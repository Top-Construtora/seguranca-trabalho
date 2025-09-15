import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { WorksPage } from './pages/WorksPage'
import { EvaluationsPage } from './pages/EvaluationsPage'
import { EvaluationEditPage } from './pages/EvaluationEditPage'
import { EvaluationViewPage } from './pages/EvaluationViewPage'
import { ReportsPage } from './pages/ReportsPage'
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
                  <EvaluationViewPage />
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
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}