import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full h-10 sm:h-11 appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm text-slate-900",
          "focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
          "disabled:bg-slate-50 disabled:text-slate-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
});
Select.displayName = "Select";
