import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/authApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Min 8 chars, 1 uppercase, 1 number");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, password });
      toast.success("Password reset! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-display font-bold text-text-primary mb-6">Set new password</h1>
        <form onSubmit={submit} className="space-y-4">
          <Input id="password" type="password" label="New Password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} error={error} required />
          <Button type="submit" variant="primary" loading={loading} className="w-full">Reset Password</Button>
        </form>
        <p className="text-center mt-4"><Link to="/login" className="text-sm text-text-muted hover:text-text-secondary">← Back to login</Link></p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
