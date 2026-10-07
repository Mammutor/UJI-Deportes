import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-[color:var(--uji-ink)]/15 bg-white px-3 py-2 text-sm outline-none transition focus-visible:border-[color:var(--uji-orange)] focus-visible:ring-2 focus-visible:ring-[color:var(--uji-orange)]/30 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
