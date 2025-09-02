"use client";

import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none active:translate-y-[0.5px]";
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  } as const;
  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300",
    secondary:
      "bg-black/5 dark:bg-white/10 text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/15",
    ghost:
      "bg-transparent hover:bg-black/5 dark:hover:bg-white/10",
  } as const;

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="inline-block size-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  );
}

export default Button;

