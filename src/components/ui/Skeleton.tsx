import React from "react";

export function Skeleton({ className = "h-4 w-24" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-black/10 dark:bg-white/10 ${className}`} />;
}

export default Skeleton;

