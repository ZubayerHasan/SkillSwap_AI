import React from "react";

const ProgressBar = ({ value = 0, max = 100, label, showPercent = true, colorClass = "" }) => {
  const percent = Math.round((value / max) * 100);
  const color = colorClass || (percent >= 80 ? "bg-success" : percent >= 50 ? "bg-brand" : percent >= 30 ? "bg-warning" : "bg-danger");

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs mb-1.5">
          {label && <span className="text-text-secondary">{label}</span>}
          {showPercent && <span className="font-mono text-text-muted">{percent}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-background-elevated rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
