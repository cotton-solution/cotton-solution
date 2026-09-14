import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-600 focus:ring-offset-0",
        className
      )}
      {...props}
    />
  );
});
Checkbox.displayName = "Checkbox";
