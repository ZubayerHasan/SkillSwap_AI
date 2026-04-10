import React from "react";

const PROFICIENCY_LABELS = { 1: "Beginner", 2: "Intermediate", 3: "Expert" };
const URGENCY_LABELS = { 1: "Low", 2: "Medium", 3: "High" };

const Badge = ({ variant = "default", children, className = "" }) => {
  const styles = {
    default: "bg-border text-text-secondary",
    brand: "bg-brand-dim text-brand",
    accent: "bg-accent-dim text-accent",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    danger: "bg-danger/20 text-danger",
    purple: "bg-purple-500/20 text-purple-400",
    muted: "bg-background-elevated text-text-muted",
  };

  return (
    <span className={`badge ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const ProficiencyBadge = ({ level }) => {
  // Hardcoded colors so they render correctly in both dark AND light themes
  // (theme-variable `brand` maps to near-black in light mode, making text invisible)
  const styles = {
    1: "bg-slate-500/20 text-slate-400 dark:text-slate-300",
    2: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    3: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  };
  return (
    <span className={`badge ${styles[level] || styles[1]}`}>
      {PROFICIENCY_LABELS[level] || "Unknown"}
    </span>
  );
};

export const UrgencyBadge = ({ level }) => {
  const styles = {
    1: "bg-slate-500/20 text-slate-500 dark:text-slate-400",
    2: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    3: "bg-red-500/20 text-red-600 dark:text-red-400",
  };
  return (
    <span className={`badge ${styles[level] || styles[1]}`}>
      {URGENCY_LABELS[level] || "Unknown"}
    </span>
  );
};

export const TrustBadge = ({ score }) => {
  const styles =
    score >= 70
      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      : score >= 40
      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
      : "bg-red-500/20 text-red-600 dark:text-red-400";
  return <span className={`badge ${styles}`}>⭐ {score}</span>;
};

export default Badge;
