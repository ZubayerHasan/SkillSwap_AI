import React from "react";
import { Link } from "react-router-dom";

const EmptyState = ({ icon = "📭", title, description, action, className = "" }) => (
  <div className={`text-center py-16 px-4 ${className}`}>
    <div className="text-6xl mb-5 animate-bounce" style={{ animationDuration: "2s" }}>
      {icon}
    </div>
    <h3 className="text-xl font-display font-bold text-text-primary mb-2">{title}</h3>
    {description && <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">{description}</p>}
    {action && (
      <Link to={action.href} className="btn-primary inline-flex !px-6">
        {action.label}
      </Link>
    )}
  </div>
);

export default EmptyState;
