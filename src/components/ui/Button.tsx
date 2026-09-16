import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";

const styles: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-strong shadow-sm border border-transparent",
  secondary:
    "bg-white text-ink border border-slate-200 hover:border-brand hover:text-brand shadow-sm",
  soft: "bg-brand-soft text-brand-strong border border-transparent hover:bg-[#fad7bd]",
  ghost: "bg-transparent text-slate-600 hover:bg-white/70 hover:text-ink",
  danger: "bg-danger-soft text-danger border border-red-100 hover:bg-red-100",
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
