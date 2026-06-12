import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated, selectAuthLoading } from "../store/slices/authSlice";
import toast from "react-hot-toast";

const AdminRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const location = useLocation();
  const hasToasted = useRef(false);

  // Show loading spinner while auth state is being resolved
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin — redirect to dashboard with toast
  if (user?.role !== "admin") {
    if (!hasToasted.current) {
      toast.error("Access denied: Admin only");
      hasToasted.current = true;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
