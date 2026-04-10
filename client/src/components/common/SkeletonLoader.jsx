import React from "react";

const SkeletonLoader = ({ className = "", count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-shimmer rounded-lg bg-background-elevated ${className}`}
        />
      ))}
    </>
  );
};

export const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="flex items-center gap-3">
      <SkeletonLoader className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader className="h-4 w-3/4" />
        <SkeletonLoader className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonLoader className="h-16" />
    <div className="flex gap-2">
      <SkeletonLoader className="h-6 w-20 rounded-full" />
      <SkeletonLoader className="h-6 w-16 rounded-full" />
    </div>
    <SkeletonLoader className="h-9 rounded-lg" />
  </div>
);

export default SkeletonLoader;
