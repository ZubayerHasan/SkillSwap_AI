import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectAuthLoading } from "../store/slices/authSlice";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import VerifyEmailSentPage from "../pages/auth/VerifyEmailSentPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

// Public
import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";

// Feature pages
import DashboardPage from "../pages/dashboard/DashboardPage";
import MyProfilePage from "../pages/profile/MyProfilePage";
import PublicProfilePage from "../pages/profile/PublicProfilePage";
import MySkillsPage from "../pages/skills/MySkillsPage";
import AvailabilityPage from "../pages/availability/AvailabilityPage";
import DiscoveryPage from "../pages/discovery/DiscoveryPage";
import MatchDashboardPage from "../pages/discovery/MatchDashboardPage";
import WalletPage from "../pages/wallet/WalletPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import ExchangesPage from "../pages/exchanges/ExchangesPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ChatPage from "../pages/chat/ChatPage";

// Conditional home route — landing page for guests, dashboard for logged-in
const HomeRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

const AppRouter = () => (
  <Routes>
    {/* Home — landing page or dashboard redirect */}
    <Route path="/" element={<HomeRoute />} />

    {/* Public only */}
    <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
    <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
    <Route path="/resend-verification" element={<VerifyEmailSentPage />} />
    <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* Protected */}
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/profile/me" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
    <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
    <Route path="/skills" element={<ProtectedRoute><MySkillsPage /></ProtectedRoute>} />
    <Route path="/availability" element={<ProtectedRoute><AvailabilityPage /></ProtectedRoute>} />
    <Route path="/discover" element={<ProtectedRoute><DiscoveryPage /></ProtectedRoute>} />
    <Route path="/matches" element={<ProtectedRoute><MatchDashboardPage /></ProtectedRoute>} />
    <Route path="/discovery/matches" element={<ProtectedRoute><MatchDashboardPage /></ProtectedRoute>} />
    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="/exchanges" element={<ProtectedRoute><ExchangesPage /></ProtectedRoute>} />
    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRouter;