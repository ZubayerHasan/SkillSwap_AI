import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/authApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Reset link sent if email exists");
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="SkillSwap AI" className="w-12 h-12 mx-auto mb-4 rounded-xl object-contain" />
          <h1 className="text-2xl font-display font-bold text-text-primary">Reset your password</h1>
        </div>
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <p className="text-text-secondary">If that email exists, a reset link was sent. Check your inbox.</p>
              <Link to="/login" className="btn-ghost inline-block mt-6">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Input id="email" type="email" label="Email address" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" variant="primary" loading={loading} className="w-full">Send reset link</Button>
              <p className="text-center text-sm">
                <Link to="/login" className="text-text-muted hover:text-text-secondary">← Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
