import React, { forwardRef } from "react";

const Input = forwardRef(({
  label,
  error,
  helper,
  className = "",
  containerClassName = "",
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`input ${error ? "input-error" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helper && !error && <p className="text-xs text-text-muted">{helper}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
