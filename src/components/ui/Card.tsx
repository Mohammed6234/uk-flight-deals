import React from "react";

export function Card({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`card-surface shadow-soft rounded-xl ${className}`}>{children}</div>
  );
}

export function CardHeader({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`px-5 pt-5 ${className}`}>{children}</div>;
}

export function CardContent({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}

export default Card;

