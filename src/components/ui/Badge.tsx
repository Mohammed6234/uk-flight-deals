import React from "react";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "info";
};

export function Badge({ className = "", tone = "default", children, ...rest }: Props) {
  const tones = {
    default: "bg-black/5 dark:bg-white/10 text-[var(--foreground)]",
    success: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    info: "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${tones[tone]} ${className}`} {...rest}>
      {children}
    </span>
  );
}

export default Badge;

