import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../api/authApi";
import Button from "../../components/common/Button";

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const [state, setState] = useState("loading"); // loading | success | error

  useEffect(() => {
    if (!token) { setState("error"); return; }
    verifyEmail(token, email)
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token, email]);

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-10 text-center">
        {state === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-display font-bold text-text-primary">Verifying your email...</h2>
          </>
        )}
        {state === "success" && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Email Verified!</h2>
            <p className="text-text-secondary mb-4">Your account is ready. You've received <span className="text-accent font-semibold">5 starter credits</span>.</p>
            <Link to="/login" className="btn-primary inline-block">Sign In Now</Link>
          </>
        )}
        {state === "error" && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Verification Failed</h2>
            <p className="text-text-secondary mb-6">This link is invalid or has expired (24h TTL).</p>
            <Link to="/resend-verification" className="btn-primary inline-block">Resend Verification</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
