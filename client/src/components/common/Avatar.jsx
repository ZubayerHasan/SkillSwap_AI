import React, { useState } from "react";

const Avatar = ({ src, name, size = "md", className = "" }) => {
  const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg", xl: "w-20 h-20 text-2xl" };
  const initials = name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-border flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-brand/20 border-2 border-brand/40 flex items-center justify-center flex-shrink-0 font-semibold text-brand ${className}`}>
      {initials}
    </div>
  );
};

export default Avatar;
