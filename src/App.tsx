import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { LandingPage } from "./components/LandingPage";
import { EndUserOnboarding } from "./components/EndUserOnboarding";
import { AccountantOnboarding } from "./components/AccountantOnboarding";
import { AdminDashboard } from "./components/AdminDashboard";
import { ComplianceOverview } from "./components/ComplianceOverview";
import { GlobalAssetScanner } from "./components/GlobalAssetScanner";
import { MLTaxEngine } from "./components/MLTaxEngine";
import { ComplianceAlerts } from "./components/ComplianceAlerts";
import { HMRCReports } from "./components/HMRCReports";
import { HelpDocumentation } from "./components/HelpDocumentation";
import { DocumentIngestion } from "./components/DocumentIngestion";
import { AssetManager } from "./components/AssetManager";
import { SelfAssessmentReport } from "./components/SelfAssessmentReport";
import { DashboardLayout } from "./components/DashboardLayout";
import { NotFoundPage } from "./components/NotFoundPage";
import { RouteDebugger } from "./components/RouteDebugger";
import { Toaster } from "./components/ui/sonner";
import "./styles/globals.css";

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireOnboarding?: boolean;
}> = ({ children, requireOnboarding = true }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but no profile exists, show profile fix component
  if (session && !user) {
    const ProfileMissingFix = React.lazy(() =>
      import("./components/ProfileMissingFix").then((m) => ({ default: m.ProfileMissingFix }))
    );
    return (
      <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950"><div className="text-slate-400">Loading...</div></div>}>
        <ProfileMissingFix />
      </React.Suspense>
    );
  }

  if (requireOnboarding && user && !user.has_completed_onboarding) {
    return <Navigate to={`/onboarding/${user.user_type}`} replace />;
  }

  return <>{children}</>;
};

// Onboarding Route Component
const OnboardingRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.has_completed_onboarding) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <>{children}</>;
};

// Auth Route (redirect if already logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (session && user) {
    if (user.has_completed_onboarding) {
      return <Navigate to="/dashboard/overview" replace />;
    } else {
      return <Navigate to={`/onboarding/${user.user_type}`} replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthRoute>
            <Signup />
          </AuthRoute>
        }
      />

      {/* Onboarding Routes */}
      <Route
        path="/onboarding/end-user"
        element={
          <OnboardingRoute>
            <EndUserOnboarding onComplete={() => window.location.href = "/dashboard/overview"} />
          </OnboardingRoute>
        }
      />
      <Route
        path="/onboarding/accountant"
        element={
          <OnboardingRoute>
            <AccountantOnboarding onComplete={() => window.location.href = "/dashboard/overview"} />
          </OnboardingRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout userType={user?.user_type || "end-user"} adminRole={user?.admin_role as any} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="overview" element={<ComplianceOverview userRole={user?.user_type || "end-user"} />} />
        <Route path="scanner" element={<GlobalAssetScanner userRole={user?.user_type || "end-user"} />} />
        <Route path="tax-engine" element={<MLTaxEngine userRole={user?.user_type || "end-user"} />} />
        <Route path="alerts" element={<ComplianceAlerts userRole={user?.user_type || "end-user"} />} />
        <Route path="reports" element={<HMRCReports userRole={user?.user_type || "end-user"} />} />
        <Route path="documents" element={<DocumentIngestion userRole={user?.user_type || "end-user"} />} />
        <Route path="assets" element={<AssetManager userRole={user?.user_type || "end-user"} />} />
        <Route path="self-assessment" element={<SelfAssessmentReport />} />
        <Route path="help" element={<HelpDocumentation />} />
      </Route>

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <RouteDebugger />
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;