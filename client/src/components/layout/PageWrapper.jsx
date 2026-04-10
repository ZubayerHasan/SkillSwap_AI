import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../../store/slices/authSlice";

const PageWrapper = ({ children, showSidebar = true, showFooter = true, className = "" }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Navbar />
      <main className={`flex-1 pt-16 page-enter ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default PageWrapper;
