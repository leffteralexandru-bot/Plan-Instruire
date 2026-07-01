import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DepartmentHubPage } from '@/pages/DepartmentHubPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DayPage } from '@/pages/DayPage';
import { MentorPage } from '@/pages/MentorPage';
import { EvaluationsPage } from '@/pages/EvaluationsPage';
import { AdminPage } from '@/pages/AdminPage';
import { ErrorLibraryPage } from '@/pages/ErrorLibraryPage';
import { CompetencyPage } from '@/pages/CompetencyPage';
import { DepartmentComingSoonPage } from '@/pages/DepartmentComingSoonPage';
import { ingineriPath, DEPARTMENTS } from '@/data/departments';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-corporate-gold border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redirect rută veche /zi/:dayId → /ingineri/zi/:dayId */
function LegacyDayRedirect() {
  const { dayId } = useParams<{ dayId: string }>();
  return <Navigate to={ingineriPath(`/zi/${dayId ?? ''}`)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DepartmentHubPage />} />

        {DEPARTMENTS.filter((d) => !d.planAvailable).map((d) => (
          <Route
            key={d.id}
            path={`${d.route.replace(/^\//, '')}/in-curand`}
            element={<DepartmentComingSoonPage />}
          />
        ))}

        <Route path="ingineri">
          <Route index element={<DashboardPage />} />
          <Route path="zi/:dayId" element={<DayPage />} />
          <Route path="mentor" element={<MentorPage />} />
          <Route path="evaluari" element={<EvaluationsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="erori" element={<ErrorLibraryPage />} />
          <Route path="competente" element={<CompetencyPage />} />
        </Route>

        <Route path="zi/:dayId" element={<LegacyDayRedirect />} />
        <Route path="evaluari" element={<Navigate to={ingineriPath('/evaluari')} replace />} />
        <Route path="competente" element={<Navigate to={ingineriPath('/competente')} replace />} />
        <Route path="erori" element={<Navigate to={ingineriPath('/erori')} replace />} />
        <Route path="mentor" element={<Navigate to={ingineriPath('/mentor')} replace />} />
        <Route path="admin" element={<Navigate to={ingineriPath('/admin')} replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
