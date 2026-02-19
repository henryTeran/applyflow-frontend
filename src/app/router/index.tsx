import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks";
import { AppLayout } from "../layout/AppLayout";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { JobOffersListPage } from "../../features/jobOffers/pages/JobOffersListPage";
import { JobOfferDetailPage } from "../../features/jobOffers/pages/JobOfferDetailPage";
import { CreateJobOfferPage } from "../../features/jobOffers/pages/CreateJobOfferPage";
import { QuickApplyPage } from "../../features/jobOffers/pages/QuickApplyPage";
import { ApplicationsListPage } from "../../features/applications/pages/ApplicationsListPage";
import { ApplicationDetailPage } from "../../features/applications/pages/ApplicationDetailPage";
import { SettingsPage } from "../../features/settings/pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="offers" element={<JobOffersListPage />} />
          <Route path="offers/new" element={<CreateJobOfferPage />} />
          <Route path="offers/quick-apply" element={<QuickApplyPage />} />
          <Route path="offers/:id" element={<JobOfferDetailPage />} />
          <Route path="applications" element={<ApplicationsListPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
