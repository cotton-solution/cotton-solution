import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
        "focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
        "disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
