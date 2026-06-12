import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "tip";

const variants: Record<Variant, string> = {
  primary:
    "bg-floodlight text-pitch-night hover:bg-floodlight/90 shadow-[0_0_24px_rgba(244,196,48,0.25)] focus-visible:outline-floodlight",
  tip: "bg-pitch-line text-white hover:bg-pitch-line/90 shadow-[0_0_24px_rgba(27,143,78,0.25)] focus-visible:outline-pitch-line",
  secondary:
    "bg-pitch-line/20 text-chalk border border-pitch-line/40 hover:bg-pitch-line/30 focus-visible:outline-pitch-line",
  ghost: "text-chalk/70 hover:text-chalk hover:bg-white/5 focus-visible:outline-chalk/50",
  danger: "bg-signal/20 text-signal border border-signal/40 hover:bg-signal/30 focus-visible:outline-signal",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className, variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
