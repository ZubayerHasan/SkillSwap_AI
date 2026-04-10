import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { resendVerification } from "../../api/authApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

const VerifyEmailSentPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
    }, 1000);
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setLoading(true);
    try {
      await resendVerification(email);
      toast.success("Verification email sent!");
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-10 text-center">
        <div className="text-6xl mb-6">📧</div>
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">Check your email</h1>
        <p className="text-text-secondary mb-6">
          We sent a verification link to{" "}
          <span className="text-brand font-semibold">{email || "your email"}</span>
        </p>
        {!email && (
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" containerClassName="mb-4 text-left" />
        )}
        <Button onClick={resend} loading={loading} disabled={cooldown > 0} variant="ghost" className="w-full mb-4">
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
        </Button>
        <Link to="/login" className="text-sm text-text-muted hover:text-text-secondary">← Back to login</Link>
      </div>
    </div>
  );
};

export default VerifyEmailSentPage;
