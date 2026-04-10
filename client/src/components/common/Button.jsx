import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const variants = {
    primary: "btn-primary",
    ghost: "btn-ghost",
    danger: "btn-danger",
    success: "btn-success",
    accent: "bg-accent text-background-primary font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-glow-accent active:scale-95",
  };
  const sizes = {
    sm: "!px-3 !py-1.5 text-sm",
    md: "",
    lg: "!px-7 !py-3.5 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} ${className} inline-flex items-center justify-center gap-2`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
