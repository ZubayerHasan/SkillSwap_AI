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
  const variants = { 1: "muted", 2: "brand", 3: "purple" };
  return <Badge variant={variants[level]}>{PROFICIENCY_LABELS[level] || "Unknown"}</Badge>;
};

export const UrgencyBadge = ({ level }) => {
  const variants = { 1: "muted", 2: "warning", 3: "danger" };
  return <Badge variant={variants[level]}>{URGENCY_LABELS[level] || "Unknown"}</Badge>;
};

export const TrustBadge = ({ score }) => {
  const variant = score >= 70 ? "success" : score >= 40 ? "warning" : "danger";
  return <Badge variant={variant}>⭐ {score}</Badge>;
};

export default Badge;
