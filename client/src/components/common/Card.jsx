import React from "react";

const Card = ({ children, className = "", hover = false, ...props }) => (
  <div
    className={`card ${hover ? "hover:border-brand/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
