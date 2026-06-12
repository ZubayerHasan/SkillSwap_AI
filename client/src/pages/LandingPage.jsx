import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getPublicStats, getPublicBroadcasts } from "../api/walletApi";

// ─── Animated Counter ─────────────────────────────────────────────────────────
const AnimatedCounter = ({ end, label, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!end) return;
    let frame;
    const duration = 1500;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end]);

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-mono font-bold text-brand">{count}{suffix}</div>
      <p className="text-text-muted text-sm mt-2">{label}</p>
    </div>
  );
};

// ─── Step Card ────────────────────────────────────────────────────────────────
const StepCard = ({ step, icon, title, description }) => (
  <div className="relative group">
    <div className="card p-6 md:p-8 text-center hover:border-brand/40 transition-all duration-300 hover:-translate-y-1">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="text-xs font-mono text-brand mb-2">STEP {step}</div>
      <h3 className="text-lg font-display font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  </div>
);

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = () => {
  const [stats, setStats] = useState({ skillCount: 0, exchangeCount: 0, studentCount: 0 });
  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    getPublicStats().then((r) => setStats(r.data.data)).catch(() => {});
    getPublicBroadcasts().then((r) => setBroadcasts((r.data.data.broadcasts || []).slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* ─── Hero Section ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-24 md:py-36">
          {/* Animated background blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
            <div className="absolute top-1/2 -right-32 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
            <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-purple-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              Campus skill barter platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-text-primary leading-tight mb-6">
              Exchange Skills.{" "}
              <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                No Money Needed.
              </span>
            </h1>

            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Trade your expertise with fellow students using time credits — teach what you know, learn what you need.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary !px-8 !py-3.5 text-base shadow-glow">
                Get Started Free
              </Link>
              <Link to="/discover" className="btn-ghost !px-8 !py-3.5 text-base">
                Browse Skills
              </Link>
            </div>
          </div>
        </section>

        {/* ─── How It Works ──────────────────────────────────────────────── */}
        <section className="py-20 bg-background-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-display font-bold text-text-primary mb-3">How It Works</h2>
              <p className="text-text-secondary">Three simple steps to start exchanging</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <StepCard step={1} icon="💡" title="List Skills You Have" description="Share your expertise — from coding to cooking, design to data science." />
              <StepCard step={2} icon="🔗" title="Get Matched" description="Our smart matching finds students who need your skills and have ones you want." />
              <StepCard step={3} icon="⚡" title="Swap & Earn Credits" description="Complete exchanges, earn time credits, and use them to learn something new." />
            </div>
          </div>
        </section>

        {/* ─── Live Broadcasts ───────────────────────────────────────────── */}
        {broadcasts.length > 0 && (
          <section className="py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-display font-bold text-text-primary mb-3">
                  Live Skill Broadcasts
                </h2>
                <p className="text-text-secondary">Students are looking for these skills right now</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {broadcasts.map((b) => (
                  <div key={b._id} className="card p-5 hover:border-accent/30 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm">
                        📢
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{b.userId?.name || "Student"}</p>
                        <p className="text-xs text-text-muted truncate">{b.userId?.university || ""}</p>
                      </div>
                    </div>
                    <p className="text-text-primary font-medium text-sm">Looking for: <span className="text-accent">{b.displayName}</span></p>
                    {b.description && <p className="text-xs text-text-muted mt-1 line-clamp-2">{b.description}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="badge bg-background-elevated text-text-muted">{b.category}</span>
                      {b.urgency >= 3 && <span className="badge bg-danger/15 text-danger">Urgent</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Stats Bar ─────────────────────────────────────────────────── */}
        <section className="py-16 bg-background-secondary/50 border-y border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-8">
              <AnimatedCounter end={stats.skillCount} label="Skills Listed" />
              <AnimatedCounter end={stats.exchangeCount} label="Exchanges Completed" />
              <AnimatedCounter end={stats.studentCount} label="Students" />
            </div>
          </div>
        </section>

        {/* ─── CTA Footer ────────────────────────────────────────────────── */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
              Join Your Campus Skill Economy
            </h2>
            <p className="text-text-secondary text-lg mb-8">
              Start with 5 free credits. No money, no catch — just skills.
            </p>
            <Link to="/register" className="btn-primary !px-10 !py-4 text-lg shadow-glow">
              Create Free Account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
