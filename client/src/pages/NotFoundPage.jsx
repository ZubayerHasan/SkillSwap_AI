import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated 404 */}
        <div className="relative">
          <h1 className="text-9xl font-mono font-bold text-brand/10 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl animate-bounce" style={{ animationDuration: "2s" }}>
              🔍
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
            Page Not Found
          </h2>
          <p className="text-text-secondary text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button onClick={() => navigate(-1)} className="btn-ghost !px-6">
            ← Go Back
          </button>
          <Link to="/" className="btn-primary !px-6">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
