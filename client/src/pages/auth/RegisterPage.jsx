import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", university: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = "Name must be at least 2 characters";
    if (!form.email || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.university) e.university = "University name is required";
    if (form.password.length < 8) e.password = "Min 8 characters";
    else if (!/[A-Z]/.test(form.password)) e.password = "Must include uppercase letter";
    else if (!/[0-9]/.test(form.password)) e.password = "Must include a number";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      await registerUser(form);
      toast.success("Account created! Check your email.");
      navigate("/verify-email-sent", { state: { email: form.email } });
    } catch (err) {
      const apiErrors = err.response?.data?.errors?.[0] || {};
      const msg = err.response?.data?.message || "Registration failed";
      if (Object.keys(apiErrors).length > 0) setErrors(apiErrors);
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="SkillSwap AI" className="w-12 h-12 mx-auto mb-4 rounded-xl object-contain" />
          <h1 className="text-3xl font-display font-bold text-text-primary">Join SkillSwap AI</h1>
          <p className="text-text-secondary mt-2">Exchange skills with your university peers</p>
        </div>
        <div className="card p-8">
          <form onSubmit={submit} className="space-y-4">
            <Input id="name" name="name" label="Full Name" placeholder="Your full name" value={form.name} onChange={handle} error={errors.name} required />
            <Input id="email" name="email" type="email" label="University Email" placeholder="you@university.edu" value={form.email} onChange={handle} error={errors.email} required />
            <Input id="university" name="university" label="University" placeholder="BRAC University" value={form.university} onChange={handle} error={errors.university} required />
            <div>
              <Input id="password" name="password" type="password" label="Password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={handle} error={errors.password} required />
            </div>
            {/* Password strength indicator */}
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {[/[A-Z]/, /[0-9]/, /.{8,}/].map((re, i) => (
                <div key={i} className={`h-1 rounded-full transition-colors duration-300 ${re.test(form.password) ? "bg-success" : "bg-border"}`} />
              ))}
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Create Account
            </Button>
          </form>
          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand hover:text-brand-hover font-medium">Sign in</Link>
          </p>
        </div>
        <p className="text-center text-xs text-text-muted mt-4">
          You'll receive <span className="text-accent font-semibold">5 free credits</span> upon email verification 🎉
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
