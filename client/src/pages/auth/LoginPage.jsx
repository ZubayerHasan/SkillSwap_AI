import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/slices/authSlice";
import { loginUser } from "../../api/authApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setUnverified(false);
    try {
      const { data } = await loginUser(form);
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }));
      toast.success(`Welcome back, ${data.data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      if (err.response?.status === 403) {
        setUnverified(true);
      } else {
        toast.error(msg);
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="SkillSwap AI" className="w-12 h-12 mx-auto mb-4 rounded-xl object-contain" />
          <h1 className="text-3xl font-display font-bold text-text-primary">Welcome back</h1>
          <p className="text-text-secondary mt-2">Sign in to your SkillSwap AI account</p>
        </div>

        <div className="card p-8">
          {unverified && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-5 text-sm">
              <p className="text-warning font-semibold mb-1">Email not verified</p>
              <p className="text-text-secondary">Check your inbox or{" "}
                <Link to="/resend-verification" state={{ email: form.email }} className="text-brand underline">
                  resend verification email
                </Link>
              </p>
            </div>
          )}
          {errors.general && !unverified && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4 text-sm text-danger">{errors.general}</div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <Input id="email" name="email" type="email" label="University Email" placeholder="you@university.edu" value={form.email} onChange={handle} error={errors.email} required />
            <Input id="password" name="password" type="password" label="Password" placeholder="••••••••" value={form.password} onChange={handle} error={errors.password} required />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-brand hover:text-brand-hover">Forgot password?</Link>
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-text-muted mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand hover:text-brand-hover font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
