import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import VerifyEmailSentPage from "../pages/auth/VerifyEmailSentPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

// Feature pages
import DashboardPage from "../pages/dashboard/DashboardPage";
import MyProfilePage from "../pages/profile/MyProfilePage";
import MySkillsPage from "../pages/skills/MySkillsPage";
import AvailabilityPage from "../pages/availability/AvailabilityPage";
import DiscoveryPage from "../pages/discovery/DiscoveryPage";
import WalletPage from "../pages/wallet/WalletPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import ExchangesPage from "../pages/exchanges/ExchangesPage";
import ChatPage from "../pages/chat/ChatPage";

const AppRouter = () => (
  <Routes>
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
    <Route path="/skills" element={<ProtectedRoute><MySkillsPage /></ProtectedRoute>} />
    <Route path="/availability" element={<ProtectedRoute><AvailabilityPage /></ProtectedRoute>} />
    <Route path="/discover" element={<ProtectedRoute><DiscoveryPage /></ProtectedRoute>} />
    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="/exchanges" element={<ProtectedRoute><ExchangesPage /></ProtectedRoute>} />
    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

    {/* Redirects */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRouter;
